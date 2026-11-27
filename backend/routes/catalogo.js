"use strict";

const express = require("express");
const { query, one, transaction } = require("../db");
const { asyncHandler, httpError, requireFields, toInt, regresionLineal } = require("../utils");
const { listarAlertasStock, listarCaducidades, obtenerLote, resumenCaducidades } = require("../services/inventario");

const router = express.Router();

function redondear(valor, decimales = 2) {
  const factor = 10 ** decimales;
  return Math.round(Number(valor || 0) * factor) / factor;
}

function fechaISO(fecha) {
  const dos = (numero) => String(numero).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function sumarDias(fecha, dias) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

function fechaISOValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""))) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime());
}

function normalizarFecha(valor) {
  return String(valor || "").slice(0, 10);
}

async function registrarMovimientoEnTransaccion(connection, materialId, tipo, cantidad, motivo, usuario) {
  await connection.query(
    `INSERT INTO movimientos_materiales (material_id, tipo, cantidad, motivo, usuario, fecha)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [materialId, tipo, cantidad, motivo, usuario || "Sistema"]
  );
  const delta = tipo === "ENTRADA" ? cantidad : -cantidad;
  await connection.query("UPDATE materiales SET stock = GREATEST(0, stock + ?) WHERE id = ?", [delta, materialId]);
}

const MATERIAL_SELECT = `
  SELECT
    m.id,
    m.nombre,
    m.clave,
    m.categoria,
    m.unidad,
    CAST(m.stock AS DECIMAL(12,3)) AS stock,
    m.stockMinimo,
    m.precio,
    m.activo,
    m.requiereCaducidad,
    m.diasAlertaCaducidad,
    m.ubicacion,
    m.procedimientos,
    m.usos,
    CAST(m.cantidadRequerida AS DECIMAL(12,3)) AS cantidadRequerida,
    m.actualizado,
    CASE
      WHEN m.stock <= 0 THEN 'agotado'
      WHEN m.stockMinimo > 0 AND m.stock < m.stockMinimo THEN 'bajo'
      ELSE 'normal'
    END AS estadoStock
  FROM vw_materiales_uso m
`;

async function getMaterial(id) {
  const material = await one(`${MATERIAL_SELECT} WHERE m.id = ? `, [id]);
  if (!material) throw httpError(404, "Material no encontrado");
  return material;
}

/* ============================ RESUMEN / FILTROS ============================ */

router.get(
  "/catalogo/resumen",
  asyncHandler(async (_req, res) => {
    const fila = await one("SELECT * FROM vw_catalogo_resumen");
    const ultimo = await one("SELECT MAX(updated_at) AS actualizado FROM materiales");
    const porSemestre = await query(`
      SELECT s.etiqueta AS semestre, COUNT(DISTINCT pr.id) AS procedimientos
      FROM semestres s
      LEFT JOIN procedimientos pr ON pr.semestre_id = s.id
      GROUP BY s.id, s.etiqueta
      ORDER BY s.numero ASC
    `);
    res.json({
      ...fila,
      actualizado: ultimo.actualizado || null,
      porSemestre,
      servidor: new Date().toISOString(),
    });
  })
);

router.get(
  "/catalogo/semestres",
  asyncHandler(async (_req, res) => {
    res.json(await query("SELECT id, numero, etiqueta FROM semestres ORDER BY numero ASC"));
  })
);

router.get(
  "/catalogo/asignaturas",
  asyncHandler(async (req, res) => {
    const params = [];
    let where = "";
    if (req.query.semestre) {
      where = "WHERE a.semestre_id = ?";
      params.push(toInt(req.query.semestre));
    }
    res.json(
      await query(
        `SELECT a.id, a.nombre AS asignatura, s.etiqueta AS semestre, s.numero AS semestreNumero
         FROM asignaturas a JOIN semestres s ON s.id = a.semestre_id
         ${where}
         ORDER BY s.numero ASC, a.nombre ASC`,
        params
      )
    );
  })
);

/* ============================== PROCEDIMIENTOS ============================= */

router.get(
  "/catalogo/procedimientos",
  asyncHandler(async (req, res) => {
    const conditions = [];
    const params = [];

    if (req.query.semestre) {
      conditions.push("semestreNumero = ?");
      params.push(toInt(req.query.semestre));
    }
    if (req.query.asignatura) {
      conditions.push("asignatura = ?");
      params.push(String(req.query.asignatura));
    }
    if (req.query.revisado !== undefined) {
      conditions.push("revisado = ?");
      params.push(req.query.revisado === "true" || req.query.revisado === "1" ? 1 : 0);
    }
    if (req.query.buscar) {
      conditions.push("(procedimiento LIKE ? OR asignatura LIKE ?)");
      const term = `%${req.query.buscar}%`;
      params.push(term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    res.json(
      await query(
        `SELECT id, item, procedimiento, asignatura, semestre, semestreNumero,
                revisado, totalMateriales, actualizado
         FROM vw_procedimientos_catalogo
         ${where}
         ORDER BY semestreNumero ASC, item ASC`,
        params
      )
    );
  })
);

router.get(
  "/catalogo/procedimientos/:id",
  asyncHandler(async (req, res) => {
    const procedimiento = await one(
      "SELECT * FROM vw_procedimientos_catalogo WHERE id = ? ",
      [req.params.id]
    );
    if (!procedimiento) throw httpError(404, "Procedimiento no encontrado");
    const materiales = await query(
      `SELECT
         pm.id AS relacionId,
         pm.material_id AS materialId,
         pm.nombre_original AS nombreOriginal,
         pm.cantidad_texto AS cantidadTexto,
         CAST(pm.cantidad AS DECIMAL(12,3)) AS cantidad,
         pm.unidad,
         pm.orden,
         m.nombre AS material,
         m.categoria,
         CAST(m.stock AS DECIMAL(12,3)) AS stock,
         m.activo
       FROM procedimiento_materiales pm
       JOIN materiales m ON m.id = pm.material_id
       WHERE pm.procedimiento_id =
       ? ORDER BY pm.orden ASC`,
      [req.params.id]
    );
    res.json({ ...procedimiento, materiales });
  })
);

router.patch(
  "/catalogo/procedimientos/:id/revisado",
  asyncHandler(async (req, res) => {
    const revisado = req.body.revisado ? 1 : 0;
    const resultado = await query("UPDATE procedimientos SET revisado =  ? WHERE id = ? ", [
      revisado,
      req.params.id,
    ]);
    if (!resultado.affectedRows) throw httpError(404, "Procedimiento no encontrado");
    res.json({ id: Number(req.params.id), revisado });
  })
);

/* ================================ MATERIALES =============================== */

router.get(
  "/catalogo/materiales",
  asyncHandler(async (req, res) => {
    const conditions = ["m.activo = 1"];
    const params = [];

    if (req.query.categoria && req.query.categoria !== "todas") {
      conditions.push("m.categoria = ?");
      params.push(req.query.categoria);
    }
    if (req.query.buscar) {
      conditions.push("(m.nombre LIKE ? OR m.clave LIKE ?)");
      const term = `%${req.query.buscar}%`;
      params.push(term, term);
    }
    if (req.query.semestre) {
      conditions.push(`EXISTS (
        SELECT 1 FROM procedimiento_materiales pm
        JOIN procedimientos pr ON pr.id = pm.procedimiento_id
        WHERE pm.material_id = m.id AND pr.semestre_id = ?)`);
      params.push(toInt(req.query.semestre));
    }
    if (req.query.procedimiento) {
      conditions.push(`EXISTS (
        SELECT 1 FROM procedimiento_materiales pm
        WHERE pm.material_id = m.id AND pm.procedimiento_id = ?)`);
      params.push(toInt(req.query.procedimiento));
    }
    if (req.query.stockBajo === "true" || req.query.stockBajo === "1") {
      conditions.push("(m.stock <= 0 OR (m.stockMinimo > 0 AND m.stock < m.stockMinimo))");
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    res.json(await query(`${MATERIAL_SELECT} ${where} ORDER BY m.nombre ASC`, params));
  })
);

router.get(
  "/catalogo/materiales/:id",
  asyncHandler(async (req, res) => {
    const material = await getMaterial(req.params.id);
    const procedimientos = await query(
      `SELECT pr.id, pr.item, pr.nombre AS procedimiento, s.etiqueta AS semestre,
              a.nombre AS asignatura, pm.cantidad_texto AS cantidadTexto,
              pm.nombre_original AS nombreOriginal
       FROM procedimiento_materiales pm
       JOIN procedimientos pr ON pr.id = pm.procedimiento_id
       JOIN semestres s ON s.id = pr.semestre_id
       JOIN asignaturas a ON a.id = pr.asignatura_id
       WHERE pm.material_id =
       ? ORDER BY s.numero ASC, pr.item ASC`,
      [req.params.id]
    );
    res.json({ ...material, procedimientos });
  })
);

router.put(
  "/catalogo/materiales/:id",
  asyncHandler(async (req, res) => {
    await getMaterial(req.params.id);
    const body = req.body || {};
    const campos = [];
    const params = [];
    const asignar = (columna, valor) => {
      campos.push(`${columna} = ?`);
      params.push(valor);
    };

    if (body.nombre !== undefined) asignar("nombre", String(body.nombre).trim());
    if (body.categoria !== undefined) asignar("categoria", body.categoria);
    if (body.unidad !== undefined) asignar("unidad", body.unidad);
    if (body.stock !== undefined) asignar("stock", Number(body.stock));
    if (body.stockMinimo !== undefined) asignar("stock_minimo", Number(body.stockMinimo));
    if (body.precio !== undefined) asignar("precio", Number(body.precio));
    if (body.activo !== undefined) asignar("activo", body.activo ? 1 : 0);
    if (body.requiereCaducidad !== undefined) asignar("requiere_caducidad", body.requiereCaducidad ? 1 : 0);
    if (body.diasAlertaCaducidad !== undefined) {
      const dias = toInt(body.diasAlertaCaducidad, 30);
      if (dias < 1 || dias > 365) throw httpError(400, "Los días de alerta deben estar entre 1 y 365");
      asignar("dias_alerta_caducidad", dias);
    }
    if (body.ubicacion !== undefined) asignar("ubicacion", body.ubicacion || null);

    if (campos.length) {
      params.push(req.params.id);
      await query(`UPDATE materiales SET ${campos.join(", ")} WHERE id = ? `, params);
    }
    res.json(await getMaterial(req.params.id));
  })
);

/* ============================== MOVIMIENTOS =============================== */

router.get(
  "/catalogo/movimientos",
  asyncHandler(async (req, res) => {
    const params = [];
    let where = "";
    if (req.query.materialId) {
      where = "WHERE mv.material_id = ?";
      params.push(toInt(req.query.materialId));
    }
    const limite = Math.min(5000, Math.max(1, toInt(req.query.limit, 100)));
    res.json(
      await query(
        `SELECT mv.id, mv.material_id AS materialId, m.nombre AS material,
                mv.tipo, CAST(mv.cantidad AS DECIMAL(12,3)) AS cantidad,
                mv.motivo, COALESCE(mv.usuario, 'Sistema') AS usuario, mv.fecha
         FROM movimientos_materiales mv
         JOIN materiales m ON m.id = mv.material_id
         ${where}
         ORDER BY mv.fecha DESC, mv.id DESC
         LIMIT ${limite}`,
        params
      )
    );
  })
);

router.post(
  "/catalogo/movimientos",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["materialId", "tipo", "cantidad"]);
    if (!["ENTRADA", "SALIDA"].includes(body.tipo)) {
      throw httpError(400, "El tipo debe ser ENTRADA o SALIDA");
    }
    const cantidad = Number(body.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw httpError(400, "La cantidad debe ser mayor que cero");
    }

    const movimiento = await transaction(async (connection) => {
      const [filas] = await connection.query(
        "SELECT id, nombre, stock FROM materiales WHERE id =  ? FOR UPDATE",
        [body.materialId]
      );
      if (!filas.length) throw httpError(404, "Material no encontrado");
      const delta = body.tipo === "ENTRADA" ? cantidad : -cantidad;
      const [resultado] = await connection.query(
        `INSERT INTO movimientos_materiales (material_id, tipo, cantidad, motivo, usuario, fecha)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [body.materialId, body.tipo, cantidad, body.motivo || "Movimiento de inventario", body.usuario || "Sistema"]
      );
      await connection.query(
        "UPDATE materiales SET stock = GREATEST(0, stock + ? ) WHERE id = ? ",
        [delta, body.materialId]
      );
      return { id: resultado.insertId, material: filas[0].nombre, tipo: body.tipo, cantidad };
    });

    res.status(201).json({ ...movimiento, material: await getMaterial(body.materialId) });
  })
);

/* ============================== SOLICITUDES =============================== */

router.get(
  "/catalogo/solicitudes",
  asyncHandler(async (req, res) => {
    const params = [];
    let where = "";
    if (req.query.estado) {
      where = "WHERE s.estado = ?";
      params.push(req.query.estado);
    }
    res.json(
      await query(
        `SELECT s.id, s.estudiante, s.material_id AS materialId, m.nombre AS material,
                s.procedimiento_id AS procedimientoId, pr.nombre AS procedimiento,
                CAST(s.cantidad AS DECIMAL(12,3)) AS cantidad,
                s.cantidad_texto AS cantidadTexto, s.estado,
                DATE_FORMAT(s.fecha, '%d/%m/%Y %H:%i') AS fecha
         FROM solicitudes_insumos s
         JOIN materiales m ON m.id = s.material_id
         LEFT JOIN procedimientos pr ON pr.id = s.procedimiento_id
         ${where}
         ORDER BY s.fecha DESC, s.id DESC`,
        params
      )
    );
  })
);

router.post(
  "/catalogo/solicitudes",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["materialId", "cantidad"]);
    const cantidad = Number(body.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw httpError(400, "La cantidad debe ser mayor que cero");
    }
    await getMaterial(body.materialId);
    const [resultado] = await query(
      `INSERT INTO solicitudes_insumos
        (estudiante, semestre_id, procedimiento_id, material_id, cantidad, cantidad_texto, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [
        body.estudiante || "Estudiante",
        body.semestreId || null,
        body.procedimientoId || null,
        body.materialId,
        cantidad,
        body.cantidadTexto || null,
        body.observaciones || null,
      ]
    );
    res.status(201).json({ id: resultado.insertId, estado: "pendiente" });
  })
);

router.patch(
  "/catalogo/solicitudes/:id/estado",
  asyncHandler(async (req, res) => {
    const estados = ["pendiente", "aprobado", "entregado", "rechazado"];
    if (!estados.includes(req.body.estado)) throw httpError(400, "Estado no válido");
    const resultado = await query("UPDATE solicitudes_insumos SET estado =  ? WHERE id = ? ", [
      req.body.estado,
      req.params.id,
    ]);
    if (!resultado.affectedRows) throw httpError(404, "Solicitud no encontrada");
    res.json({ id: Number(req.params.id), estado: req.body.estado });
  })
);

/* ============================== PROVEEDORES ============================== */

router.get(
  "/catalogo/proveedores",
  asyncHandler(async (_req, res) => {
    res.json(
      await query(
        `SELECT p.id, p.nombre, p.contacto, p.telefono, p.email, p.categoria, p.estado,
                COUNT(DISTINCT mp.material_id) AS materiales,
                COALESCE(SUM(mp.precio_unitario * m.stock), 0) AS valorTotal
         FROM proveedores p
         LEFT JOIN material_proveedores mp ON mp.proveedor_id = p.id
         LEFT JOIN materiales m ON m.id = mp.material_id
         GROUP BY p.id
         ORDER BY p.nombre ASC`
      )
    );
  })
);

router.get(
  "/catalogo/proveedores/:id",
  asyncHandler(async (req, res) => {
    const proveedor = await one(
      `SELECT id, nombre, contacto, telefono, email, categoria, estado
       FROM proveedores WHERE id = ? `,
      [req.params.id]
    );
    if (!proveedor) throw httpError(404, "Proveedor no encontrado");
    const materiales = await query(
      `SELECT m.id, m.nombre, m.clave, m.categoria, m.unidad,
              CAST(m.stock AS DECIMAL(12,3)) AS stock,
              m.stock_minimo AS stockMinimo,
              m.precio, mp.precio_unitario AS precioProveedor,
              CASE WHEN m.stock_minimo > 0 AND m.stock < m.stock_minimo THEN 1 ELSE 0 END AS stockBajo
       FROM material_proveedores mp
       JOIN materiales m ON m.id = mp.material_id
       WHERE mp.proveedor_id =
       ? ORDER BY m.nombre ASC`,
      [req.params.id]
    );
    res.json({ ...proveedor, materiales });
  })
);

router.post(
  "/catalogo/proveedores",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["nombre"]);
    const nombre = String(body.nombre).trim();
    const existente = await one("SELECT id FROM proveedores WHERE nombre = ? ", [nombre]);
    if (existente) throw httpError(409, "Ya existe un proveedor con ese nombre");
    const [resultado] = await query(
      `INSERT INTO proveedores (nombre, contacto, telefono, email, categoria, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        body.contacto || null,
        body.telefono || null,
        body.email || null,
        body.categoria || "general",
        body.estado === "inactivo" ? "inactivo" : "activo",
      ]
    );
    res.status(201).json({ id: resultado.insertId, nombre, estado: body.estado === "inactivo" ? "inactivo" : "activo" });
  })
);

router.put(
  "/catalogo/proveedores/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const actual = await one("SELECT id FROM proveedores WHERE id = ? ", [req.params.id]);
    if (!actual) throw httpError(404, "Proveedor no encontrado");

    const campos = [];
    const valores = [];
    const asignar = (columna, valor) => {
      campos.push(`${columna} = ?`);
      valores.push(valor);
    };

    if (body.nombre !== undefined) {
      const nombre = String(body.nombre).trim();
      if (!nombre) throw httpError(400, "El nombre del proveedor es obligatorio");
      const repetido = await one("SELECT id FROM proveedores WHERE nombre =  ? AND id <> ? ", [nombre, req.params.id]);
      if (repetido) throw httpError(409, "Ya existe un proveedor con ese nombre");
      asignar("nombre", nombre);
    }
    for (const campo of ["contacto", "telefono", "email", "categoria"]) {
      if (body[campo] !== undefined) asignar(campo, body[campo] || null);
    }
    if (body.estado !== undefined) {
      if (!["activo", "inactivo"].includes(body.estado)) throw httpError(400, "Estado inválido");
      asignar("estado", body.estado);
    }

    if (campos.length) {
      valores.push(req.params.id);
      await query(`UPDATE proveedores SET ${campos.join(", ")} WHERE id = ? `, valores);
    }

    const proveedor = await one(
      `SELECT p.id, p.nombre, p.contacto, p.telefono, p.email, p.categoria, p.estado,
              COUNT(DISTINCT mp.material_id) AS materiales,
              COALESCE(SUM(mp.precio_unitario * m.stock), 0) AS valorTotal
       FROM proveedores p
       LEFT JOIN material_proveedores mp ON mp.proveedor_id = p.id
       LEFT JOIN materiales m ON m.id = mp.material_id
       WHERE p.id =
       ? GROUP BY p.id`,
      [req.params.id]
    );
    res.json({ message: "Proveedor actualizado correctamente", proveedor });
  })
);

router.get(
  "/catalogo/alertas",
  asyncHandler(async (_req, res) => {
    res.json(await listarAlertasStock());
  })
);

router.get(
  "/catalogo/caducidades",
  asyncHandler(async (req, res) => {
    res.json(
      await listarCaducidades({
        estado: req.query.estado,
        materialId: req.query.materialId,
        dias: req.query.dias,
        buscar: req.query.buscar,
        incluirCerrados: req.query.incluirCerrados === "true" || req.query.incluirCerrados === "1",
      })
    );
  })
);

router.get(
  "/catalogo/caducidades/:id",
  asyncHandler(async (req, res) => {
    res.json(await obtenerLote(req.params.id));
  })
);

router.post(
  "/catalogo/caducidades",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["materialId", "codigoLote", "fechaVencimiento", "cantidad"]);
    const codigoLote = String(body.codigoLote).trim();
    if (!codigoLote) throw httpError(400, "El código de lote es obligatorio");
    const cantidad = Number(body.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) throw httpError(400, "La cantidad debe ser mayor que cero");
    const fechaVencimiento = normalizarFecha(body.fechaVencimiento);
    const fechaIngreso = body.fechaIngreso ? normalizarFecha(body.fechaIngreso) : new Date().toISOString().slice(0, 10);
    if (!fechaISOValida(fechaVencimiento)) throw httpError(400, "La fecha de vencimiento no es válida");
    if (!fechaISOValida(fechaIngreso)) throw httpError(400, "La fecha de ingreso no es válida");

    const lote = await transaction(async (connection) => {
      const [materiales] = await connection.query(
        "SELECT id, nombre, unidad FROM materiales WHERE id = ? FOR UPDATE",
        [body.materialId]
      );
      if (!materiales.length) throw httpError(404, "Material no encontrado");
      const [duplicados] = await connection.query(
        "SELECT id FROM lotes_materiales WHERE material_id = ? AND codigo_lote = ?",
        [body.materialId, codigoLote]
      );
      if (duplicados.length) throw httpError(409, "Ya existe un lote con ese código para el material");

      if (body.proveedorId) {
        const [proveedores] = await connection.query("SELECT id FROM proveedores WHERE id = ?", [body.proveedorId]);
        if (!proveedores.length) throw httpError(404, "Proveedor no encontrado");
      }

      const [resultado] = await connection.query(
        `INSERT INTO lotes_materiales
          (material_id, codigo_lote, fecha_ingreso, fecha_vencimiento, cantidad_inicial,
           cantidad_actual, unidad, proveedor_id, ubicacion, estado, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)`,
        [
          body.materialId,
          codigoLote,
          fechaIngreso,
          fechaVencimiento,
          cantidad,
          cantidad,
          materiales[0].unidad,
          body.proveedorId || null,
          body.ubicacion || materiales[0].ubicacion || null,
          body.observaciones || null,
        ]
      );

      if (body.registrarEntrada !== false) {
        await registrarMovimientoEnTransaccion(
          connection,
          body.materialId,
          "ENTRADA",
          cantidad,
          `Ingreso de lote ${codigoLote} (vence ${fechaVencimiento})`,
          body.usuario || "Sistema"
        );
      }

      const [filas] = await connection.query("SELECT * FROM vw_lotes_caducidad WHERE id = ?", [resultado.insertId]);
      return filas[0];
    });

    res.status(201).json(lote);
  })
);

router.put(
  "/catalogo/caducidades/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const lote = await transaction(async (connection) => {
      const [filas] = await connection.query(
        "SELECT * FROM lotes_materiales WHERE id = ? FOR UPDATE",
        [req.params.id]
      );
      if (!filas.length) throw httpError(404, "Lote no encontrado");
      const actual = filas[0];
      const estado = body.estado || actual.estado;
      if (!["activo", "agotado", "descartado"].includes(estado)) throw httpError(400, "Estado de lote no válido");
      if (actual.estado === "descartado" && estado === "activo") {
        throw httpError(400, "Un lote descartado no se puede reactivar; registra un lote nuevo");
      }

      let cantidad = actual.cantidad_actual ? Number(actual.cantidad_actual) : 0;
      if (body.cantidadActual !== undefined) cantidad = Number(body.cantidadActual);
      if (estado === "descartado") cantidad = 0;
      if (!Number.isFinite(cantidad) || cantidad < 0) throw httpError(400, "La cantidad no puede ser negativa");

      const fechaVencimiento =
        body.fechaVencimiento !== undefined
          ? normalizarFecha(body.fechaVencimiento)
          : normalizarFecha(actual.fecha_vencimiento);
      if (!fechaISOValida(fechaVencimiento)) throw httpError(400, "La fecha de vencimiento no es válida");

      if (body.proveedorId) {
        const [proveedores] = await connection.query("SELECT id FROM proveedores WHERE id = ?", [body.proveedorId]);
        if (!proveedores.length) throw httpError(404, "Proveedor no encontrado");
      }

      const delta = cantidad - Number(actual.cantidad_actual);
      if (delta !== 0) {
        await registrarMovimientoEnTransaccion(
          connection,
          actual.material_id,
          delta > 0 ? "ENTRADA" : "SALIDA",
          Math.abs(delta),
          `Ajuste de lote ${actual.codigo_lote}${delta < 0 ? " por descarte" : ""}`,
          body.usuario || "Sistema"
        );
      }

      await connection.query(
        `UPDATE lotes_materiales SET fecha_vencimiento = ?, cantidad_actual = ?, proveedor_id = ?,
          ubicacion = ?, observaciones = ?, estado = ? WHERE id = ?`,
        [
          fechaVencimiento,
          cantidad,
          body.proveedorId !== undefined ? body.proveedorId || null : actual.proveedor_id,
          body.ubicacion !== undefined ? body.ubicacion || null : actual.ubicacion,
          body.observaciones !== undefined ? body.observaciones || null : actual.observaciones,
          estado,
          req.params.id,
        ]
      );

      const [actualizados] = await connection.query("SELECT * FROM vw_lotes_caducidad WHERE id = ?", [req.params.id]);
      return actualizados[0];
    });
    res.json(lote);
  })
);

router.post(
  "/catalogo/caducidades/:id/descartar",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const lote = await transaction(async (connection) => {
      const [filas] = await connection.query("SELECT * FROM lotes_materiales WHERE id = ? FOR UPDATE", [req.params.id]);
      if (!filas.length) throw httpError(404, "Lote no encontrado");
      const actual = filas[0];
      const cantidad = Number(actual.cantidad_actual);
      if (actual.estado !== "activo" || cantidad <= 0) {
        throw httpError(400, "El lote ya no tiene stock activo para descartar");
      }

      await connection.query(
        "UPDATE lotes_materiales SET estado = 'descartado', cantidad_actual = 0 WHERE id = ?",
        [req.params.id]
      );
      await registrarMovimientoEnTransaccion(
        connection,
        actual.material_id,
        "SALIDA",
        cantidad,
        body.motivo || `Descarte por caducidad del lote ${actual.codigo_lote}`,
        body.usuario || "Sistema"
      );
      const [actualizados] = await connection.query("SELECT * FROM vw_lotes_caducidad WHERE id = ?", [req.params.id]);
      return actualizados[0];
    });
    res.json(lote);
  })
);

/* =============================== PREDICCIÓN ============================== */

router.get(
  "/catalogo/prediccion",
  asyncHandler(async (req, res) => {
    const diasHistorial = Math.min(180, Math.max(7, toInt(req.query.dias, 60)));
    const horizonte = Math.min(30, Math.max(1, toInt(req.query.horizonte, 7)));

    const filas = await query(
      `SELECT DATE(mv.fecha) AS dia, mv.material_id AS materialId,
              mat.nombre AS material, mat.unidad,
              CAST(mat.stock AS DECIMAL(12,3)) AS stock,
              mat.stock_minimo AS stockMinimo, mat.precio,
              SUM(mv.cantidad) AS cantidad
       FROM movimientos_materiales mv
       JOIN materiales mat ON mat.id = mv.material_id
       WHERE mv.tipo = 'SALIDA' AND mv.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(mv.fecha), mv.material_id
       ORDER BY dia ASC`,
      [diasHistorial]
    );

    const hoy = new Date();
    const fechas = [];
    for (let restante = diasHistorial - 1; restante >= 0; restante -= 1) {
      fechas.push(fechaISO(sumarDias(hoy, -restante)));
    }
    const indiceFecha = new Map(fechas.map((dia, indice) => [dia, indice]));
    const serie = fechas.map((dia, indice) => ({ dia, indice, cantidad: 0 }));
    const porMaterial = new Map();

    for (const fila of filas) {
      const indice = indiceFecha.get(String(fila.dia).slice(0, 10));
      if (indice === undefined) continue;
      const cantidad = Number(fila.cantidad);
      serie[indice].cantidad += cantidad;

      const id = Number(fila.materialId);
      let item = porMaterial.get(id);
      if (!item) {
        item = {
          id,
          material: fila.material,
          unidad: fila.unidad,
          stock: Number(fila.stock),
          stockMinimo: Number(fila.stockMinimo),
          precio: Number(fila.precio),
          total: 0,
          porDia: new Map(),
        };
        porMaterial.set(id, item);
      }
      item.total += cantidad;
      item.porDia.set(indice, (item.porDia.get(indice) || 0) + cantidad);
    }

    const xs = serie.map((punto) => punto.indice);
    const ys = serie.map((punto) => punto.cantidad);
    const modelo = regresionLineal(xs, ys);
    const promedioDiario = ys.reduce((suma, valor) => suma + valor, 0) / diasHistorial;
    const desviacion = Math.sqrt(
      ys.reduce((suma, valor) => suma + (valor - promedioDiario) ** 2, 0) / diasHistorial
    );

    const pronostico = [];
    for (let paso = 1; paso <= horizonte; paso += 1) {
      const indice = diasHistorial + paso - 1;
      const valor = Math.max(0, modelo.predecir(indice));
      const margen = Math.min(desviacion * 0.75, valor * 0.35 + 0.5);
      pronostico.push({
        dia: fechaISO(sumarDias(hoy, paso)),
        valor: redondear(valor),
        inferior: redondear(Math.max(0, valor - margen)),
        superior: redondear(valor + margen),
      });
    }

    const caducidades = await resumenCaducidades(horizonte);

    const materiales = [...porMaterial.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((item) => {
        const regresion = regresionLineal(
          xs,
          xs.map((indice) => item.porDia.get(indice) || 0)
        );
        const promedio = item.total / diasHistorial;
        const proyectado = Math.max(0, regresion.predecir(diasHistorial + horizonte - 1)) * horizonte;
        const caducidad = caducidades.porMaterial[item.id] || { unidades: 0, valor: 0, lotes: 0 };
        const stockDisponible = Math.max(0, item.stock - caducidad.unidades);
        const cobertura = promedio > 0 ? stockDisponible / (promedio * 30) : 12;
        return {
          id: item.id,
          material: item.material,
          unidad: item.unidad,
          stock: item.stock,
          stockMinimo: item.stockMinimo,
          precio: item.precio,
          consumido: redondear(item.total),
          promedioDiario: redondear(promedio),
          proyectado: redondear(proyectado),
          tendencia: redondear(regresion.pendiente, 3),
          r2: redondear(regresion.r2, 3),
          coberturaMeses: redondear(cobertura),
          caducidadUnidades: redondear(caducidad.unidades, 3),
          caducidadLotes: caducidad.lotes,
          stockDisponible: redondear(stockDisponible, 3),
          riesgo: cobertura < 0.5 || caducidad.unidades > 0 ? "critico" : cobertura < 1.5 ? "alto" : "normal",
        };
      });

    const consumoTotal = ys.reduce((suma, valor) => suma + valor, 0);
    const totalProyectado = pronostico.reduce((suma, punto) => suma + punto.valor, 0);
    const precioPonderado = consumoTotal
      ? [...porMaterial.values()].reduce((suma, item) => suma + item.precio * item.total, 0) / consumoTotal
      : 0;

    res.json({
      generadoEn: new Date().toISOString(),
      sinDatos: filas.length === 0,
      diasHistorial,
      horizonte,
      serie: serie.map(({ dia, cantidad }) => ({ dia, cantidad })),
      pronostico,
      modelo: {
        pendiente: redondear(modelo.pendiente, 3),
        intercepto: redondear(modelo.intercepto, 3),
        r2: redondear(modelo.r2, 3),
      },
      resumen: {
        consumoTotal: redondear(consumoTotal),
        promedioDiario: redondear(promedioDiario),
        tendencia: redondear(modelo.pendiente, 3),
        r2: redondear(modelo.r2, 3),
        proyectadoTotal: redondear(totalProyectado),
        valorProyectado: redondear(totalProyectado * precioPonderado),
      },
      caducidades: {
        horizonte: caducidades.horizonte,
        totalUnidades: caducidades.totalUnidades,
        valorEnRiesgo: caducidades.valorEnRiesgo,
        totalLotes: caducidades.totalLotes,
        lotes: caducidades.lotes,
      },
      materiales,
    });
  })
);

module.exports = router;