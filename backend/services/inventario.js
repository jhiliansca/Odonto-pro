"use strict";

const { query, one } = require("../db");
const { httpError, toInt } = require("../utils");

function redondear(valor, decimales = 2) {
  const factor = 10 ** decimales;
  return Math.round(Number(valor || 0) * factor) / factor;
}

function prioridadDe(severidad) {
  if (severidad === "critico") return 3;
  if (severidad === "bajo") return 2;
  return 1;
}

async function listarAlertasStock() {
  const materiales = await query(`
    SELECT m.id, m.nombre, m.clave, m.categoria, m.unidad,
           CAST(m.stock AS DECIMAL(12,3)) AS stock,
           CAST(m.stockMinimo AS DECIMAL(12,3)) AS stockMinimo,
           m.precio, m.diasAlertaCaducidad, m.actualizado
    FROM vw_materiales_uso m
    WHERE m.activo = 1 AND (m.stock <= 0 OR (m.stockMinimo > 0 AND m.stock < m.stockMinimo * 1.5))
  `);

  const movimientos = await query(`
    SELECT mv.id, mv.material_id AS materialId, mv.tipo,
           CAST(mv.cantidad AS DECIMAL(12,3)) AS cantidad,
           mv.motivo, COALESCE(mv.usuario, 'Sistema') AS usuario, mv.fecha
    FROM movimientos_materiales mv
    WHERE mv.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY mv.fecha DESC, mv.id DESC
  `);

  const lotes = await query(`
    SELECT l.materialId, l.material, l.codigoLote, l.fechaVencimiento,
           l.diasRestantes, l.estadoCaducidad, l.cantidadActual, l.unidad, l.ubicacion, l.proveedor
    FROM vw_lotes_caducidad l
    WHERE l.estado = 'activo' AND l.cantidadActual > 0
      AND l.fechaVencimiento <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
    ORDER BY l.diasRestantes ASC
  `);

  const proveedores = await query(`
    SELECT mp.material_id AS materialId, p.nombre AS proveedor, p.telefono, p.email
    FROM material_proveedores mp
    JOIN proveedores p ON p.id = mp.proveedor_id
    ORDER BY mp.es_principal DESC, mp.id ASC
  `);

  const movimientosPorMaterial = new Map();
  for (const movimiento of movimientos) {
    if (!movimientosPorMaterial.has(movimiento.materialId)) {
      movimientosPorMaterial.set(movimiento.materialId, []);
    }
    movimientosPorMaterial.get(movimiento.materialId).push(movimiento);
  }

  const proveedoresPorMaterial = new Map();
  for (const proveedor of proveedores) {
    if (!proveedoresPorMaterial.has(proveedor.materialId)) {
      proveedoresPorMaterial.set(proveedor.materialId, proveedor);
    }
  }

  const lotesPorMaterial = new Map();
  for (const lote of lotes) {
    if (!lotesPorMaterial.has(lote.materialId)) lotesPorMaterial.set(lote.materialId, []);
    lotesPorMaterial.get(lote.materialId).push(lote);
  }

  const alertas = materiales
    .map((material) => {
      const historial = movimientosPorMaterial.get(material.id) || [];
      const salidas30 = historial
        .filter((movimiento) => movimiento.tipo === "SALIDA")
        .reduce((suma, movimiento) => suma + Number(movimiento.cantidad), 0);
      const entradas30 = historial
        .filter((movimiento) => movimiento.tipo === "ENTRADA")
        .reduce((suma, movimiento) => suma + Number(movimiento.cantidad), 0);
      const promedioDiario = salidas30 / 30;
      const diasCobertura = promedioDiario > 0 ? Number(material.stock) / promedioDiario : null;
      const stock = Number(material.stock);
      const minimo = Number(material.stockMinimo);
      const faltante = Math.max(0, minimo - stock);
      const porcentajeMinimo = minimo > 0 ? (stock / minimo) * 100 : 100;

      let severidad = null;
      if (stock <= 0 || (minimo > 0 && stock <= minimo / 2)) severidad = "critico";
      else if (stock < minimo) severidad = "bajo";
      else if (stock <= minimo * 1.5) severidad = "por_agotar";
      if (diasCobertura !== null && diasCobertura < 3 && severidad !== "critico") severidad = "critico";

      const lotesMaterial = lotesPorMaterial.get(material.id) || [];
      const lotesVencidos = lotesMaterial.filter((lote) => Number(lote.diasRestantes) < 0);
      const lotesProximos = lotesMaterial.filter(
        (lote) => Number(lote.diasRestantes) >= 0 && Number(lote.diasRestantes) <= Number(material.diasAlertaCaducidad)
      );
      const proveedor = proveedoresPorMaterial.get(material.id) || null;
      const reposicionSugerida = Math.max(
        faltante,
        Math.ceil(promedioDiario * 7),
        severidad === "critico" ? Math.ceil(minimo) : 0
      );

      let accion = "Monitorear el consumo y mantener el stock por encima del mínimo.";
      if (severidad === "critico") {
        accion = `Reposición urgente de ${reposicionSugerida} ${material.unidad}${proveedor ? `; contactar a ${proveedor.proveedor}` : ""}.`;
      } else if (severidad === "bajo") {
        accion = `Programar reposición de ${reposicionSugerida} ${material.unidad} antes de llegar al mínimo.`;
      }
      if (lotesVencidos.length) {
        accion += ` Hay ${lotesVencidos.length} lote(s) vencido(s): retirar del inventario activo.`;
      } else if (lotesProximos.length) {
        accion += ` ${lotesProximos.length} lote(s) vence(n) en ${material.diasAlertaCaducidad} días: priorizar su uso.`;
      }

      return {
        id: material.id,
        materialId: material.id,
        producto: material.nombre,
        categoria: material.categoria,
        clave: material.clave,
        unidad: material.unidad,
        stock: redondear(stock, 3),
        stockMinimo: redondear(minimo, 3),
        faltante: redondear(faltante, 3),
        porcentajeMinimo: redondear(porcentajeMinimo, 1),
        severidad,
        proveedor: proveedor?.proveedor || null,
        proveedorTelefono: proveedor?.telefono || null,
        consumo30: redondear(salidas30, 3),
        entradas30: redondear(entradas30, 3),
        promedioDiario: redondear(promedioDiario, 3),
        diasCobertura: diasCobertura === null ? null : redondear(diasCobertura, 1),
        ultimoMovimiento: historial[0] || null,
        lotesProximos: lotesProximos.slice(0, 3),
        lotesVencidos: lotesVencidos.slice(0, 3),
        totalLotesAfectados: lotesProximos.length + lotesVencidos.length,
        diasAlertaCaducidad: material.diasAlertaCaducidad,
        reposicionSugerida: redondear(reposicionSugerida, 3),
        accion,
        prioridad:
          prioridadDe(severidad) +
          (diasCobertura !== null && diasCobertura < 7 ? 1 : 0) +
          (lotesVencidos.length ? 2 : 0) +
          (lotesProximos.length ? 1 : 0),
        fechaDeteccion: material.actualizado,
      };
    })
    .sort((a, b) => b.prioridad - a.prioridad || b.faltante - a.faltante || a.producto.localeCompare(b.producto, "es"));

  return {
    generadoEn: new Date().toISOString(),
    resumen: {
      total: alertas.length,
      critico: alertas.filter((alerta) => alerta.severidad === "critico").length,
      bajo: alertas.filter((alerta) => alerta.severidad === "bajo").length,
      porAgotar: alertas.filter((alerta) => alerta.severidad === "por_agotar").length,
      conCaducidad: alertas.filter((alerta) => alerta.totalLotesAfectados > 0).length,
    },
    alertas,
  };
}

async function listarCaducidades(filtros = {}) {
  const conditions = [];
  const params = [];
  const estado = String(filtros.estado || "todos");
  const estados = ["todos", "activo", "vencido", "hoy", "proximo", "critico", "normal", "cerrado", "descartado"];

  if (estado !== "todos") {
    if (!estados.includes(estado)) throw httpError(400, "Estado de caducidad no válido");
    const reglas = {
      activo: "l.estado = 'activo'",
      vencido: "l.estado = 'activo' AND l.diasRestantes < 0",
      hoy: "l.estado = 'activo' AND l.diasRestantes = 0",
      proximo: "l.estado = 'activo' AND l.diasRestantes BETWEEN 0 AND l.diasAlertaCaducidad",
      critico: "l.estado = 'activo' AND l.diasRestantes BETWEEN 0 AND 7",
      normal: "l.estado = 'activo' AND l.diasRestantes > l.diasAlertaCaducidad",
      cerrado: "l.estado <> 'activo'",
      descartado: "l.estado = 'descartado'",
    };
    conditions.push(reglas[estado]);
  } else if (!filtros.incluirCerrados) {
    conditions.push("l.estado <> 'descartado'");
  }

  if (filtros.materialId) {
    conditions.push("l.materialId = ?");
    params.push(toInt(filtros.materialId));
  }
  if (filtros.dias !== undefined && filtros.dias !== null && filtros.dias !== "") {
    conditions.push("l.diasRestantes BETWEEN 0 AND ?");
    params.push(Math.max(1, toInt(filtros.dias, 30)));
  }
  if (filtros.buscar) {
    const termino = `%${filtros.buscar}%`;
    conditions.push("(l.material LIKE ? OR l.codigoLote LIKE ? OR l.proveedor LIKE ? OR l.ubicacion LIKE ?)");
    params.push(termino, termino, termino, termino);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const lotes = await query(
    `SELECT l.* FROM vw_lotes_caducidad l ${where}
     ORDER BY l.diasRestantes ASC, l.material ASC, l.codigoLote ASC`,
    params
  );

  const resumen = await one(`
    SELECT
      SUM(estado = 'activo' AND cantidadActual > 0) AS lotesActivos,
      SUM(estado = 'activo' AND cantidadActual > 0 AND diasRestantes < 0) AS vencidos,
      SUM(estado = 'activo' AND cantidadActual > 0 AND diasRestantes BETWEEN 0 AND diasAlertaCaducidad) AS porVencer,
      SUM(estado = 'descartado') AS descartados,
      COALESCE(SUM(CASE WHEN estado = 'activo' THEN valor ELSE 0 END), 0) AS valorActivo,
      COALESCE(SUM(CASE WHEN estado = 'activo' AND diasRestantes <= diasAlertaCaducidad THEN valor ELSE 0 END), 0) AS valorEnRiesgo
    FROM vw_lotes_caducidad
  `);

  return {
    generadoEn: new Date().toISOString(),
    resumen: {
      lotesActivos: Number(resumen.lotesActivos || 0),
      vencidos: Number(resumen.vencidos || 0),
      porVencer: Number(resumen.porVencer || 0),
      descartados: Number(resumen.descartados || 0),
      valorActivo: redondear(resumen.valorActivo),
      valorEnRiesgo: redondear(resumen.valorEnRiesgo),
    },
    lotes: lotes.map((lote) => ({
      ...lote,
      cantidadInicial: redondear(lote.cantidadInicial, 3),
      cantidadActual: redondear(lote.cantidadActual, 3),
      valor: redondear(lote.valor),
      precio: redondear(lote.precio),
    })),
  };
}

async function obtenerLote(id) {
  const lote = await one("SELECT * FROM vw_lotes_caducidad WHERE id = ?", [id]);
  if (!lote) throw httpError(404, "Lote no encontrado");
  return lote;
}

async function resumenCaducidades(dias) {
  const lotes = await query(
    `SELECT materialId, material, codigoLote, fechaVencimiento, diasRestantes,
            cantidadActual, unidad, valor, ubicacion, proveedor
     FROM vw_lotes_caducidad
     WHERE estado = 'activo' AND cantidadActual > 0 AND diasRestantes BETWEEN 0 AND ?
     ORDER BY diasRestantes ASC, material ASC`,
    [dias]
  );

  const porMaterial = {};
  for (const lote of lotes) {
    const actual = porMaterial[lote.materialId] || { unidades: 0, valor: 0, lotes: 0 };
    actual.unidades += Number(lote.cantidadActual);
    actual.valor += Number(lote.valor);
    actual.lotes += 1;
    porMaterial[lote.materialId] = actual;
  }

  return {
    horizonte: dias,
    totalUnidades: redondear(lotes.reduce((suma, lote) => suma + Number(lote.cantidadActual), 0), 3),
    valorEnRiesgo: redondear(lotes.reduce((suma, lote) => suma + Number(lote.valor), 0)),
    totalLotes: lotes.length,
    porMaterial,
    lotes: lotes.map((lote) => ({
      ...lote,
      cantidadActual: redondear(lote.cantidadActual, 3),
      valor: redondear(lote.valor),
    })),
  };
}

module.exports = { listarAlertasStock, listarCaducidades, obtenerLote, resumenCaducidades, redondear };
