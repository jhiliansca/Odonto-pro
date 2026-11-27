"use strict";

const express = require("express");
const { query, one } = require("../db");
const { asyncHandler, httpError, parseJSON, formatDateUI } = require("../utils");
const { listarAlertasStock, listarCaducidades, redondear } = require("../services/inventario");

const router = express.Router();

const CONFIG_TIPOS = {
  consumo: {
    titulo: "Reporte de consumo y predicción",
    descripcion: "Salidas reales por insumo en el periodo seleccionado",
    modulo: "inventario",
  },
  categorias: {
    titulo: "Reporte de valoración por categoría",
    descripcion: "Unidades y valor económico por categoría",
    modulo: "inventario",
  },
  alertas: {
    titulo: "Reporte detallado de alertas de stock",
    descripcion: "Alertas de stock con proveedor, cobertura, movimientos y caducidades",
    modulo: "inventario",
  },
  caducidad: {
    titulo: "Reporte de control por caducidad",
    descripcion: "Lotes activos, días restantes, ubicación y valor en riesgo",
    modulo: "inventario",
  },
  valorado: {
    titulo: "Reporte valorado de inventario",
    descripcion: "Valoración de existencias por insumo",
    modulo: "inventario",
  },
};

function numero(valor) {
  return redondear(valor, 2);
}

function formatoFecha(valor) {
  return formatDateUI(valor);
}

async function construirSnapshot(tipo, parametros = {}) {
  const dias = Math.min(180, Math.max(1, Number(parametros.dias) || 90));
  const resumenBase = await one("SELECT * FROM vw_catalogo_resumen");
  const resumen = [
    { label: "Materiales", value: resumenBase.materiales },
    { label: "Stock bajo", value: resumenBase.stockBajo },
    { label: "Valor total", value: `Bs ${numero(resumenBase.valorTotal)}` },
    { label: "Lotes activos", value: resumenBase.lotesActivos || 0 },
    { label: "Por vencer", value: resumenBase.lotesPorVencer || 0 },
    { label: "Vencidos", value: resumenBase.lotesVencidos || 0 },
  ];

  const snapshot = {
    tipo,
    parametros: { ...parametros, dias },
    generadoEn: new Date().toISOString(),
    resumen,
    columnas: [],
    filas: [],
    notas: "Datos obtenidos directamente de OdontoproDB al momento de generar el reporte.",
  };

  if (tipo === "consumo") {
    const filas = await query(
      `SELECT m.nombre AS material, m.unidad,
              COALESCE(SUM(CASE WHEN mv.tipo = 'SALIDA' THEN mv.cantidad ELSE 0 END), 0) AS salidas,
              COALESCE(SUM(CASE WHEN mv.tipo = 'ENTRADA' THEN mv.cantidad ELSE 0 END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN mv.tipo = 'SALIDA' THEN mv.cantidad * m.precio ELSE 0 END), 0) AS valor
       FROM movimientos_materiales mv
       JOIN materiales m ON m.id = mv.material_id
       WHERE mv.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY m.id, m.nombre, m.unidad
       ORDER BY salidas DESC, entradas DESC
       LIMIT 100`,
      [dias]
    );
    snapshot.columnas = ["Insumo", "Unidad", "Salidas", "Entradas", "Valor salidas (Bs)"];
    snapshot.filas = filas.map((fila) => [
      fila.material,
      fila.unidad,
      numero(fila.salidas),
      numero(fila.entradas),
      numero(fila.valor),
    ]);
    snapshot.notas = `Movimientos reales registrados en los últimos ${dias} días.`;
  } else if (tipo === "categorias") {
    const filas = await query(`
      SELECT categoria, COUNT(*) AS materiales,
             COALESCE(SUM(stock), 0) AS unidades,
             COALESCE(SUM(stock * precio), 0) AS valor
      FROM vw_materiales_uso
      WHERE activo = 1
      GROUP BY categoria
      ORDER BY valor DESC
    `);
    snapshot.columnas = ["Categoría", "Materiales", "Unidades", "Valor (Bs)"];
    snapshot.filas = filas.map((fila) => [fila.categoria, fila.materiales, numero(fila.unidades), numero(fila.valor)]);
  } else if (tipo === "alertas") {
    const alertas = await listarAlertasStock();
    snapshot.columnas = [
      "Insumo",
      "Severidad",
      "Stock",
      "Mínimo",
      "Faltante",
      "Proveedor",
      "Días cobertura",
      "Consumo 30d",
      "Último movimiento",
      "Acción recomendada",
    ];
    snapshot.filas = alertas.alertas.map((alerta) => [
      alerta.producto,
      alerta.severidad,
      alerta.stock,
      alerta.stockMinimo,
      alerta.faltante,
      alerta.proveedor || "Sin proveedor",
      alerta.diasCobertura === null ? "—" : alerta.diasCobertura,
      alerta.consumo30,
      alerta.ultimoMovimiento
        ? `${alerta.ultimoMovimiento.tipo} ${alerta.ultimoMovimiento.cantidad} · ${formatoFecha(alerta.ultimoMovimiento.fecha)}`
        : "Sin movimientos",
      alerta.accion,
    ]);
    snapshot.notas = `Se detectaron ${alertas.resumen.total} alertas; ${alertas.resumen.conCaducidad} incluyen lotes próximos a vencer o vencidos.`;
  } else if (tipo === "caducidad") {
    const caducidades = await listarCaducidades({ estado: "todos", incluirCerrados: false });
    snapshot.columnas = [
      "Insumo",
      "Lote",
      "Vencimiento",
      "Días restantes",
      "Cantidad",
      "Unidad",
      "Ubicación",
      "Proveedor",
      "Estado",
      "Valor (Bs)",
    ];
    snapshot.filas = caducidades.lotes.map((lote) => [
      lote.material,
      lote.codigoLote,
      formatoFecha(lote.fechaVencimiento),
      lote.diasRestantes,
      lote.cantidadActual,
      lote.unidad,
      lote.ubicacion || "—",
      lote.proveedor || "—",
      lote.estadoCaducidad,
      lote.valor,
    ]);
    snapshot.notas = `${caducidades.resumen.porVencer} lote(s) por vencer y ${caducidades.resumen.vencidos} vencido(s). Valor en riesgo: Bs ${numero(caducidades.resumen.valorEnRiesgo)}.`;
  } else if (tipo === "valorado") {
    const filas = await query(`
      SELECT nombre, clave, categoria, unidad,
             CAST(stock AS DECIMAL(12,3)) AS stock, precio,
             CAST(stock * precio AS DECIMAL(14,2)) AS valor,
             stock_minimo AS stockMinimo, ubicacion
      FROM materiales
      WHERE activo = 1
      ORDER BY valor DESC, nombre ASC
      LIMIT 200
    `);
    snapshot.columnas = ["Insumo", "Clave", "Categoría", "Unidad", "Stock", "Mínimo", "Precio", "Valor (Bs)", "Ubicación"];
    snapshot.filas = filas.map((fila) => [
      fila.nombre,
      fila.clave,
      fila.categoria,
      fila.unidad,
      numero(fila.stock),
      numero(fila.stockMinimo),
      numero(fila.precio),
      numero(fila.valor),
      fila.ubicacion || "—",
    ]);
  }

  snapshot.datos = {
    resumenBase,
    columnas: snapshot.columnas,
    filas: snapshot.filas,
    parametros: snapshot.parametros,
    generadoEn: snapshot.generadoEn,
  };
  return snapshot;
}

router.get(
  "/reportes",
  asyncHandler(async (req, res) => {
    const { modulo, tipo, limit } = req.query;
    const cond = [];
    const params = [];
    if (modulo) {
      cond.push("modulo = ?");
      params.push(String(modulo));
    }
    if (tipo) {
      cond.push("tipo = ?");
      params.push(String(tipo));
    }
    const lim = Math.min(200, Math.max(1, Number(limit) || 50));
    const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
    const rows = await query(
      `SELECT id, tipo, modulo, titulo, descripcion, parametros, generado_por AS generadoPor, generado_por_id AS generadoPorId, formato, DATE_FORMAT(created_at,'%d/%m/%Y %H:%i') AS fecha, created_at AS createdAt
       FROM reportes ${where} ORDER BY created_at DESC, id DESC LIMIT ${lim}`,
      params
    );
    res.json(rows.map((fila) => ({ ...fila, parametros: parseJSON(fila.parametros, null) })));
  })
);

router.get(
  "/reportes/:id",
  asyncHandler(async (req, res) => {
    const fila = await one(
      `SELECT id, tipo, modulo, titulo, descripcion, parametros, datos, generado_por AS generadoPor,
              generado_por_id AS generadoPorId, formato, DATE_FORMAT(created_at,'%d/%m/%Y %H:%i') AS fecha,
              created_at AS createdAt
       FROM reportes WHERE id = ?`,
      [req.params.id]
    );
    if (!fila) throw httpError(404, "Reporte no encontrado");
    res.json({
      ...fila,
      parametros: parseJSON(fila.parametros, null),
      datos: parseJSON(fila.datos, null),
    });
  })
);

router.post(
  "/reportes/generar",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const tipo = String(body.tipo || "consumo").trim();
    const config = CONFIG_TIPOS[tipo];
    if (!config) throw httpError(400, "Tipo de reporte no válido");
    const snapshot = await construirSnapshot(tipo, body.parametros || {});
    const titulo = String(body.titulo || config.titulo).trim();
    const modulo = String(body.modulo || config.modulo).trim();
    const descripcion = String(body.descripcion || config.descripcion);

    const resultado = await query(
      `INSERT INTO reportes (tipo, modulo, titulo, descripcion, parametros, datos, generado_por, generado_por_id, formato)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo,
        modulo,
        titulo,
        descripcion,
        JSON.stringify(snapshot.parametros),
        JSON.stringify(snapshot),
        body.generadoPor || "Sistema",
        body.generadoPorId || null,
        body.formato || "PDF",
      ]
    );

    const fila = await one(
      `SELECT id, tipo, modulo, titulo, descripcion, parametros, datos, generado_por AS generadoPor,
              generado_por_id AS generadoPorId, formato, DATE_FORMAT(created_at,'%d/%m/%Y %H:%i') AS fecha,
              created_at AS createdAt
       FROM reportes WHERE id = ?`,
      [resultado.insertId]
    );

    res.status(201).json({
      ...fila,
      parametros: parseJSON(fila.parametros, null),
      datos: parseJSON(fila.datos, null),
    });
  })
);

router.post(
  "/reportes",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const tipo = String(body.tipo || "").trim();
    const modulo = String(body.modulo || "").trim();
    const titulo = String(body.titulo || "").trim();
    if (!tipo || !modulo || !titulo) throw httpError(400, "tipo, modulo y titulo son obligatorios");
    const result = await query(
      `INSERT INTO reportes (tipo, modulo, titulo, descripcion, parametros, datos, generado_por, generado_por_id, formato)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo,
        modulo,
        titulo,
        body.descripcion || null,
        body.parametros ? JSON.stringify(body.parametros) : null,
        body.datos ? JSON.stringify(body.datos) : null,
        body.generadoPor || "Sistema",
        body.generadoPorId || null,
        body.formato || "PDF",
      ]
    );
    const row = await one(
      `SELECT id, tipo, modulo, titulo, descripcion, parametros, generado_por AS generadoPor, generado_por_id AS generadoPorId, formato, DATE_FORMAT(created_at,'%d/%m/%Y %H:%i') AS fecha, created_at AS createdAt FROM reportes WHERE id=?`,
      [result.insertId]
    );
    res.status(201).json({ ...row, parametros: parseJSON(row.parametros, null) });
  })
);

module.exports = router;
