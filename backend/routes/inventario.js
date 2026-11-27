const express = require('express');
const { query, one } = require('../db');
const { asyncHandler, httpError, requireFields, toInt, toNumber } = require('../utils');

const router = express.Router();

const PRODUCT_SELECT = `
  SELECT
    p.id,
    p.nombre,
    COALESCE(p.marca, '') AS marca,
    p.categoria,
    p.unidad,
    p.stock,
    p.stock_minimo AS stockMinimo,
    p.precio,
    p.proveedor_id AS proveedorId,
    COALESCE(pr.nombre, '') AS proveedor,
    COALESCE(p.ubicacion, '') AS ubicacion,
    ROUND(p.precio * p.stock, 2) AS valorStock,
    p.ultima_actualizacion AS ultimaActualizacion,
    DATE_FORMAT(p.ultima_actualizacion, '%d/%m/%Y') AS ultimaActualizacionUI,
    CASE
      WHEN p.stock <= 0 THEN 'agotado'
      WHEN p.stock <= p.stock_minimo THEN 'bajo'
      ELSE 'normal'
    END AS estadoStock
  FROM productos p
  LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
`;

async function getProduct(id) {
  const row = await one(`${PRODUCT_SELECT} WHERE p.id = ? `, [id]);
  if (!row) throw httpError(404, 'Producto no encontrado');
  return row;
}

/* ============================== PRODUCTOS =============================== */

router.get(
  '/productos',
  asyncHandler(async (req, res) => {
    const { search, categoria, estado, proveedorId, stockBajo } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(p.nombre LIKE ? OR p.marca LIKE ? OR pr.nombre LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (categoria && categoria !== 'todas') {
      conditions.push('p.categoria = ?');
      params.push(categoria);
    }
    if (proveedorId) {
      conditions.push('p.proveedor_id = ?');
      params.push(proveedorId);
    }
    if (estado === 'bajo') conditions.push('p.stock <= p.stock_minimo');
    if (estado === 'agotado') conditions.push('p.stock <= 0');
    if (estado === 'normal') conditions.push('p.stock > p.stock_minimo');
    if (stockBajo === 'true' || stockBajo === '1') conditions.push('p.stock <= p.stock_minimo');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`${PRODUCT_SELECT} ${where} ORDER BY p.nombre ASC`, params);
    res.json(rows);
  })
);

router.get(
  '/productos/stats',
  asyncHandler(async (_req, res) => {
    const row = await one(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(stock <= stock_minimo), 0) AS criticos,
        COALESCE(SUM(stock <= 0), 0) AS agotados,
        COALESCE(SUM(stock * precio), 0) AS valorTotal,
        COALESCE(SUM(stock), 0) AS unidades
       FROM productos`
    );
    const categorias = await query(
      `SELECT categoria, COUNT(*) AS total, COALESCE(SUM(stock), 0) AS unidades
       FROM productos GROUP BY categoria ORDER BY categoria ASC`
    );
    res.json({ ...row, categorias });
  })
);

router.get(
  '/productos/:id',
  asyncHandler(async (req, res) => {
    res.json(await getProduct(req.params.id));
  })
);

router.post(
  '/productos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre', 'categoria']);
    const result = await query(
      `INSERT INTO productos
        (nombre, marca, categoria, unidad, stock, stock_minimo, precio, proveedor_id, ubicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.nombre,
        body.marca || null,
        body.categoria,
        body.unidad || 'unidades',
        toInt(body.stock, 0),
        toInt(body.stockMinimo, 0),
        toNumber(body.precio, 0),
        toInt(body.proveedorId),
        body.ubicacion || null,
      ]
    );
    res.status(201).json(await getProduct(result.insertId));
  })
);

router.put(
  '/productos/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT id FROM productos WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Producto no encontrado');

    const fields = [];
    const params = [];
    const assign = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (body.nombre !== undefined) assign('nombre', body.nombre);
    if (body.marca !== undefined) assign('marca', body.marca || null);
    if (body.categoria !== undefined) assign('categoria', body.categoria);
    if (body.unidad !== undefined) assign('unidad', body.unidad);
    if (body.stock !== undefined) assign('stock', toInt(body.stock, 0));
    if (body.stockMinimo !== undefined) assign('stock_minimo', toInt(body.stockMinimo, 0));
    if (body.precio !== undefined) assign('precio', toNumber(body.precio, 0));
    if (body.proveedorId !== undefined) assign('proveedor_id', toInt(body.proveedorId));
    if (body.ubicacion !== undefined) assign('ubicacion', body.ubicacion || null);

    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE productos SET ${fields.join(', ')} WHERE id = ? `, params);
    }
    res.json(await getProduct(req.params.id));
  })
);

router.delete(
  '/productos/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM productos WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Producto eliminado', id: Number(req.params.id) });
  })
);

/* ============================== PROVEEDORES ============================= */

const PROVEEDOR_SELECT = `
  SELECT
    pr.id,
    pr.nombre,
    COALESCE(pr.contacto, '') AS contacto,
    COALESCE(pr.telefono, '') AS telefono,
    COALESCE(pr.email, '') AS email,
    COALESCE(pr.categoria, '') AS categoria,
    pr.estado,
    DATE_FORMAT(pr.created_at, '%d/%m/%Y') AS fechaRegistro,
    COUNT(DISTINCT p.id) AS productos,
    COUNT(DISTINCT pd.id) AS pedidos,
    COALESCE(SUM(DISTINCT p.stock * p.precio), 0) AS valorInventario
  FROM proveedores pr
  LEFT JOIN productos p ON p.proveedor_id = pr.id
  LEFT JOIN pedidos pd ON pd.proveedor_id = pr.id
`;

async function getProveedor(id) {
  const row = await one(`${PROVEEDOR_SELECT} WHERE pr.id =  ? GROUP BY pr.id`, [id]);
  if (!row) throw httpError(404, 'Proveedor no encontrado');
  return row;
}

router.get(
  '/proveedores',
  asyncHandler(async (req, res) => {
    const { search, estado } = req.query;
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(pr.nombre LIKE ? OR pr.contacto LIKE ? OR pr.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (estado) {
      conditions.push('pr.estado = ?');
      params.push(estado);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `${PROVEEDOR_SELECT} ${where} GROUP BY pr.id ORDER BY pr.nombre ASC`,
      params
    );
    res.json(rows);
  })
);

router.get(
  '/proveedores/:id',
  asyncHandler(async (req, res) => {
    res.json(await getProveedor(req.params.id));
  })
);

router.post(
  '/proveedores',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre']);
    const result = await query(
      `INSERT INTO proveedores (nombre, contacto, telefono, email, categoria, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.nombre,
        body.contacto || null,
        body.telefono || null,
        body.email || null,
        body.categoria || null,
        body.estado === 'inactivo' ? 'inactivo' : 'activo',
      ]
    );
    res.status(201).json(await getProveedor(result.insertId));
  })
);

router.put(
  '/proveedores/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT id FROM proveedores WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Proveedor no encontrado');

    const fields = [];
    const params = [];
    const assign = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (body.nombre !== undefined) assign('nombre', body.nombre);
    if (body.contacto !== undefined) assign('contacto', body.contacto || null);
    if (body.telefono !== undefined) assign('telefono', body.telefono || null);
    if (body.email !== undefined) assign('email', body.email || null);
    if (body.categoria !== undefined) assign('categoria', body.categoria || null);
    if (body.estado !== undefined) assign('estado', body.estado === 'inactivo' ? 'inactivo' : 'activo');

    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE proveedores SET ${fields.join(', ')} WHERE id = ? `, params);
    }
    res.json(await getProveedor(req.params.id));
  })
);

router.delete(
  '/proveedores/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM proveedores WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Proveedor eliminado', id: Number(req.params.id) });
  })
);

/* =============================== PEDIDOS ================================ */

const PEDIDO_SELECT = `
  SELECT
    pd.id,
    pd.codigo,
    pd.producto_id AS productoId,
    pd.producto_nombre AS producto,
    pd.cantidad,
    pd.proveedor_id AS proveedorId,
    COALESCE(pr.nombre, '') AS proveedor,
    DATE_FORMAT(pd.fecha, '%Y-%m-%d') AS fecha,
    DATE_FORMAT(pd.fecha, '%d/%m/%Y') AS fechaUI,
    DATE_FORMAT(pd.fecha_entrega, '%Y-%m-%d') AS fechaEntrega,
    DATE_FORMAT(pd.fecha_entrega, '%d/%m/%Y') AS fechaEntregaUI,
    pd.total,
    pd.estado,
    DATE_FORMAT(pd.created_at, '%d/%m/%Y') AS fechaRegistro
  FROM pedidos pd
  LEFT JOIN proveedores pr ON pr.id = pd.proveedor_id
`;

async function getPedido(id) {
  const row = await one(`${PEDIDO_SELECT} WHERE pd.id = ? `, [id]);
  if (!row) throw httpError(404, 'Pedido no encontrado');
  return row;
}

async function nextCodigo() {
  const row = await one('SELECT COUNT(*) AS total FROM pedidos');
  const n = Number(row.total || 0) + 1;
  return `PED-${String(n).padStart(4, '0')}`;
}

router.get(
  '/pedidos',
  asyncHandler(async (req, res) => {
    const { estado, proveedorId, search } = req.query;
    const conditions = [];
    const params = [];
    if (estado) {
      conditions.push('pd.estado = ?');
      params.push(estado);
    }
    if (proveedorId) {
      conditions.push('pd.proveedor_id = ?');
      params.push(proveedorId);
    }
    if (search) {
      conditions.push('(pd.codigo LIKE ? OR pd.producto_nombre LIKE ? OR pr.nombre LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`${PEDIDO_SELECT} ${where} ORDER BY pd.fecha DESC, pd.id DESC`, params);
    res.json(rows);
  })
);

router.get(
  '/pedidos/stats',
  asyncHandler(async (_req, res) => {
    const row = await one(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(estado = 'pendiente'), 0) AS pendientes,
        COALESCE(SUM(estado = 'en_transito'), 0) AS enTransito,
        COALESCE(SUM(estado = 'entregado'), 0) AS entregados,
        COALESCE(SUM(estado = 'cancelado'), 0) AS cancelados,
        COALESCE(SUM(total), 0) AS montoTotal
       FROM pedidos`
    );
    res.json(row);
  })
);

router.get(
  '/pedidos/:id',
  asyncHandler(async (req, res) => {
    res.json(await getPedido(req.params.id));
  })
);

router.post(
  '/pedidos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['producto']);

    let productoId = toInt(body.productoId);
    let productoNombre = body.producto;
    let precio = toNumber(body.precio, 0);
    if (productoId) {
      const producto = await one('SELECT id, nombre, precio FROM productos WHERE id = ? ', [productoId]);
      if (!producto) throw httpError(404, 'Producto no encontrado');
      productoNombre = producto.nombre;
      if (!precio) precio = Number(producto.precio);
    }

    const cantidad = toInt(body.cantidad, 1);
    const total = body.total !== undefined ? toNumber(body.total, 0) : precio * cantidad;
    const codigo = body.codigo || (await nextCodigo());

    const result = await query(
      `INSERT INTO pedidos
        (codigo, producto_id, producto_nombre, cantidad, proveedor_id, fecha, fecha_entrega, total, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        productoId,
        productoNombre,
        cantidad,
        toInt(body.proveedorId),
        body.fecha || new Date().toISOString().slice(0, 10),
        body.fechaEntrega || null,
        total,
        body.estado || 'pendiente',
      ]
    );
    res.status(201).json(await getPedido(result.insertId));
  })
);

router.put(
  '/pedidos/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT * FROM pedidos WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Pedido no encontrado');

    const fields = [];
    const params = [];
    const assign = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (body.codigo !== undefined) assign('codigo', body.codigo);
    if (body.productoId !== undefined) assign('producto_id', toInt(body.productoId));
    if (body.producto !== undefined) assign('producto_nombre', body.producto);
    if (body.cantidad !== undefined) assign('cantidad', toInt(body.cantidad, 1));
    if (body.proveedorId !== undefined) assign('proveedor_id', toInt(body.proveedorId));
    if (body.fecha !== undefined) assign('fecha', body.fecha);
    if (body.fechaEntrega !== undefined) assign('fecha_entrega', body.fechaEntrega || null);
    if (body.total !== undefined) assign('total', toNumber(body.total, 0));
    if (body.estado !== undefined) assign('estado', body.estado);

    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = ? `, params);
    }

    // Al marcarse como entregado, ingresar el stock automáticamente.
    if (body.estado === 'entregado' && current.estado !== 'entregado' && current.producto_id) {
      await query(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario, precio_unitario, fecha)
         VALUES (?, 'ENTRADA', ?, 'Recepción de pedido', 'Sistema', NULL, NOW())`,
        [current.producto_id, current.cantidad]
      );
      await query('UPDATE productos SET stock = stock +  ? WHERE id = ? ', [current.cantidad, current.producto_id]);
    }

    res.json(await getPedido(req.params.id));
  })
);

router.patch(
  '/pedidos/:id/estado',
  asyncHandler(async (req, res) => {
    const estado = req.body.estado;
    const allowed = ['pendiente', 'en_transito', 'entregado', 'cancelado'];
    if (!allowed.includes(estado)) throw httpError(400, 'Estado inválido');
    await query('UPDATE pedidos SET estado =  ? WHERE id = ? ', [estado, req.params.id]);
    res.json(await getPedido(req.params.id));
  })
);

router.delete(
  '/pedidos/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM pedidos WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Pedido eliminado', id: Number(req.params.id) });
  })
);

/* ========================= ALERTAS Y MOVIMIENTOS ======================== */

router.get(
  '/inventario/alertas',
  asyncHandler(async (_req, res) => {
    const stock = await query(
      `SELECT
        id, nombre, marca, categoria, unidad, stock, stock_minimo AS stockMinimo,
        (stock - stock_minimo) AS diferencia,
        pct_sobre_minimo AS pctSobreMinimo,
        valor_stock AS valorStock,
        proveedor, ultima_actualizacion AS ultimaActualizacion
       FROM vw_alertas_stock_minimo
       ORDER BY diferencia ASC`
    );
    const vencimientos = await query(
      `SELECT
        id, codigo_lote AS codigoLote, producto_id AS productoId, nombre, marca,
        cantidad_actual AS cantidadActual, unidad,
        fecha_ingreso AS fechaIngreso, fecha_vencimiento AS fechaVencimiento,
        dias_restantes AS diasRestantes, valor_en_riesgo AS valorEnRiesgo,
        estado_caducidad AS estadoCaducidad
       FROM vw_lotes_por_vencer
       ORDER BY dias_restantes ASC`
    );
    res.json({ stock, vencimientos });
  })
);

router.get(
  '/inventario/movimientos',
  asyncHandler(async (req, res) => {
    const { tipo, productoId, desde, hasta, limit } = req.query;
    const conditions = [];
    const params = [];
    if (tipo) {
      conditions.push('m.tipo = ?');
      params.push(tipo);
    }
    if (productoId) {
      conditions.push('m.producto_id = ?');
      params.push(productoId);
    }
    if (desde) {
      conditions.push('DATE(m.fecha) >= ?');
      params.push(desde);
    }
    if (hasta) {
      conditions.push('DATE(m.fecha) <= ?');
      params.push(hasta);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const max = Math.min(1000, Math.max(1, toInt(limit, 200)));
    const rows = await query(
      `SELECT
        m.id,
        m.producto_id AS productoId,
        p.nombre AS producto,
        p.marca,
        p.unidad,
        m.lote_id AS loteId,
        l.codigo_lote AS lote,
        m.tipo,
        m.cantidad,
        m.motivo,
        m.usuario,
        m.precio_unitario AS precioUnitario,
        m.fecha
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       LEFT JOIN lotes l ON l.id = m.lote_id
       ${where}
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT ${max}`,
      params
    );
    res.json(rows);
  })
);

router.post(
  '/inventario/movimientos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['productoId', 'tipo', 'cantidad']);
    const tipo = String(body.tipo).toUpperCase();
    if (!['ENTRADA', 'SALIDA'].includes(tipo)) throw httpError(400, 'Tipo de movimiento inválido');

    const producto = await one('SELECT id, stock, precio FROM productos WHERE id = ? ', [toInt(body.productoId)]);
    if (!producto) throw httpError(404, 'Producto no encontrado');
    const cantidad = Math.abs(toInt(body.cantidad, 0));
    if (!cantidad) throw httpError(400, 'La cantidad debe ser mayor a cero');
    if (tipo === 'SALIDA' && producto.stock < cantidad) {
      throw httpError(400, 'Stock insuficiente para realizar la salida');
    }

    let loteId = toInt(body.loteId);
    if (!loteId && tipo === 'ENTRADA') {
      const codigo = body.codigoLote || `L-${Date.now().toString().slice(-8)}`;
      const created = await query(
        `INSERT INTO lotes
          (producto_id, codigo_lote, cantidad_inicial, cantidad_actual, fecha_ingreso, fecha_vencimiento)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          producto.id,
          codigo,
          cantidad,
          cantidad,
          body.fecha || new Date().toISOString().slice(0, 10),
          body.fechaVencimiento || null,
        ]
      );
      loteId = created.insertId;
    }

    const result = await query(
      `INSERT INTO movimientos_inventario
        (producto_id, lote_id, tipo, cantidad, motivo, usuario, precio_unitario, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        producto.id,
        loteId || null,
        tipo,
        cantidad,
        body.motivo || (tipo === 'ENTRADA' ? 'Ingreso de stock' : 'Consumo clínico'),
        body.usuario || 'Sistema',
        body.precioUnitario !== undefined ? toNumber(body.precioUnitario, 0) : producto.precio,
        body.fecha || new Date().toISOString().slice(0, 19).replace('T', ' '),
      ]
    );

    if (tipo === 'ENTRADA') {
      await query('UPDATE productos SET stock = stock +  ? WHERE id = ? ', [cantidad, producto.id]);
    } else {
      await query('UPDATE productos SET stock = GREATEST(stock - ? , 0) WHERE id = ? ', [cantidad, producto.id]);
      if (loteId) {
        await query('UPDATE lotes SET cantidad_actual = GREATEST(cantidad_actual - ? , 0) WHERE id = ? ', [cantidad, loteId]);
      }
    }

    const created = await one(
      `SELECT id, producto_id AS productoId, tipo, cantidad, motivo, usuario, fecha
       FROM movimientos_inventario WHERE id = ? `,
      [result.insertId]
    );
    res.status(201).json(created);
  })
);

router.get(
  '/inventario/lotes',
  asyncHandler(async (req, res) => {
    const { productoId, estado } = req.query;
    const conditions = [];
    const params = [];
    if (productoId) {
      conditions.push('l.producto_id = ?');
      params.push(productoId);
    }
    if (estado === 'vencido') conditions.push('l.fecha_vencimiento < CURDATE()');
    if (estado === 'por_vencer') {
      conditions.push('l.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `SELECT
        l.id,
        l.producto_id AS productoId,
        p.nombre AS producto,
        p.marca,
        l.codigo_lote AS codigoLote,
        l.cantidad_inicial AS cantidadInicial,
        l.cantidad_actual AS cantidadActual,
        l.fecha_ingreso AS fechaIngreso,
        l.fecha_vencimiento AS fechaVencimiento,
        DATEDIFF(l.fecha_vencimiento, CURDATE()) AS diasRestantes
       FROM lotes l
       JOIN productos p ON p.id = l.producto_id
       ${where}
       ORDER BY l.fecha_vencimiento ASC, l.id ASC`,
      params
    );
    res.json(rows);
  })
);

/* ============================== DASHBOARD =============================== */

router.get(
  '/inventario/dashboard',
  asyncHandler(async (_req, res) => {
    const valoracion = await one(
      `SELECT
        total_productos AS totalProductos,
        productos_con_stock AS productosConStock,
        productos_criticos AS productosCriticos,
        valor_total AS valorTotal,
        valor_stock_minimo AS valorStockMinimo
       FROM vw_valoracion_inventario`
    );
    const pedidos = await one(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(estado IN ('pendiente','en_transito')), 0) AS abiertos,
        COALESCE(SUM(estado = 'entregado'), 0) AS entregados
       FROM pedidos`
    );
    const lotes = await one(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(fecha_vencimiento < CURDATE() AND cantidad_actual > 0), 0) AS vencidos,
        COALESCE(SUM(fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND cantidad_actual > 0), 0) AS porVencer
       FROM lotes`
    );
    const categorias = await query(
      `SELECT categoria, COUNT(*) AS productos, COALESCE(SUM(stock), 0) AS unidades,
              COALESCE(SUM(stock * precio), 0) AS valor
       FROM productos GROUP BY categoria ORDER BY valor DESC`
    );
    const consumo = await query(
      `SELECT dia, salidas, entradas, valor_consumido AS valorConsumido
       FROM vw_consumo_diario
       ORDER BY dia DESC
       LIMIT 30`
    );
    const movimientos = await query(
      `SELECT
        m.id, p.nombre AS producto, m.tipo, m.cantidad, m.motivo, m.usuario,
        DATE_FORMAT(m.fecha, '%d/%m/%Y %H:%i') AS fecha
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT 8`
    );
    const alertas = await query(
      `SELECT id, nombre, marca, stock, stock_minimo AS stockMinimo, unidad,
              (stock - stock_minimo) AS diferencia
       FROM vw_alertas_stock_minimo
       ORDER BY diferencia ASC
       LIMIT 5`
    );

    res.json({
      valoracion: valoracion || {},
      pedidos: pedidos || {},
      lotes: lotes || {},
      categorias,
      consumo: consumo.reverse(),
      movimientos,
      alertas,
    });
  })
);

/* ============================== REPORTES ================================ */

router.get(
  '/inventario/reportes',
  asyncHandler(async (req, res) => {
    const { tipo, search } = req.query;
    const conditions = ["modulo = 'inventario'"];
    const params = [];
    if (tipo) {
      conditions.push('tipo = ?');
      params.push(tipo);
    }
    if (search) {
      conditions.push('(titulo LIKE ? OR periodo LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const rows = await query(
      `SELECT
        id, titulo, tipo, periodo, registros,
        DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
        DATE_FORMAT(fecha, '%d/%m/%Y') AS fechaUI,
        COALESCE(generado_por, '') AS generadoPor,
        COALESCE(usuario_asignado, '') AS usuarioAsignado,
        descargas
       FROM reportes
       WHERE ${conditions.join(' AND ')}
       ORDER BY fecha DESC, id DESC`,
      params
    );
    res.json(rows);
  })
);

router.post(
  '/inventario/reportes',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['titulo', 'tipo']);
    const result = await query(
      `INSERT INTO reportes (modulo, titulo, tipo, periodo, registros, fecha, generado_por, usuario_asignado)
       VALUES ('inventario', ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.titulo,
        body.tipo,
        body.periodo || null,
        toInt(body.registros, 0),
        body.fecha || new Date().toISOString().slice(0, 10),
        body.generadoPor || null,
        body.usuarioAsignado || null,
      ]
    );
    res.status(201).json(
      await one(
        `SELECT id, titulo, tipo, periodo, registros, DATE_FORMAT(fecha, '%d/%m/%Y') AS fechaUI,
                COALESCE(generado_por, '') AS generadoPor, COALESCE(usuario_asignado, '') AS usuarioAsignado,
                descargas
         FROM reportes WHERE id = ? `,
        [result.insertId]
      )
    );
  })
);

router.delete(
  '/inventario/reportes/:id',
  asyncHandler(async (req, res) => {
    await query("DELETE FROM reportes WHERE id =  ? AND modulo = 'inventario'", [req.params.id]);
    res.json({ message: 'Reporte eliminado', id: Number(req.params.id) });
  })
);

router.post(
  '/inventario/reportes/:id/descargar',
  asyncHandler(async (req, res) => {
    await query('UPDATE reportes SET descargas = descargas + 1 WHERE id = ? ', [req.params.id]);
    const row = await one('SELECT * FROM reportes WHERE id = ? ', [req.params.id]);
    if (!row) throw httpError(404, 'Reporte no encontrado');
    res.json({ ...row, descargas: Number(row.descargas) + 1 });
  })
);

/* ============================= PREDICCIÓN =============================== */

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0].y || 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (!denominator) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function monthKeys(count) {
  const keys = [];
  const now = new Date();
  now.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

router.get(
  '/inventario/prediccion',
  asyncHandler(async (req, res) => {
    const meses = Math.min(24, Math.max(3, toInt(req.query.meses, 6)));
    const keys = monthKeys(meses);

    // Consumo mensual por producto, rellenando meses sin datos con 0.
    const rows = await query(
      `SELECT
        p.id, p.nombre, p.categoria AS marca, p.unidad, p.stock, p.stock_minimo AS stockMinimo,
        DATE_FORMAT(m.fecha, '%Y-%m') AS mes,
        SUM(m.cantidad) AS cantidad
       FROM materiales p
       LEFT JOIN movimientos_materiales m
         ON m.material_id = p.id AND m.tipo = 'SALIDA'
        AND m.fecha >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
       GROUP BY p.id, mes
       ORDER BY p.nombre ASC`,
      [meses - 1]
    );

    const productos = new Map();
    for (const row of rows) {
      if (!productos.has(row.id)) {
        productos.set(row.id, {
          id: row.id,
          nombre: row.nombre,
          marca: row.marca,
          unidad: row.unidad,
          stock: row.stock,
          stockMinimo: row.stockMinimo,
          serie: Object.fromEntries(keys.map((k) => [k, 0])),
        });
      }
      if (row.mes) productos.get(row.id).serie[row.mes] = Number(row.cantidad || 0);
    }

    const matricula = [];
    const matriculaMap = new Map(matricula.map((m) => [m.mes, Number(m.estudiantes || 0)]));

    const resultado = [...productos.values()].map((producto) => {
      const points = keys.map((key, index) => ({ x: index + 1, y: producto.serie[key] }));
      const { slope, intercept } = linearRegression(points);
      const prediccion = Math.max(0, Math.round(slope * (keys.length + 1) + intercept));
      const promedio = points.reduce((s, p) => s + p.y, 0) / (points.length || 1);
      const consumoTotal = points.reduce((s, p) => s + p.y, 0);
      const cobertura = promedio > 0 ? Math.round((producto.stock / promedio) * 10) / 10 : null;
      return {
        ...producto,
        historial: keys.map((key) => ({ mes: key, cantidad: producto.serie[key], estudiantes: matriculaMap.get(key) || 0 })),
        promedioMensual: Math.round(promedio * 10) / 10,
        consumoTotal,
        prediccion,
        tendencia: slope > 0.5 ? 'sube' : slope < -0.5 ? 'baja' : 'estable',
        pendiente: Math.round(slope * 100) / 100,
        coberturaMeses: cobertura,
        riesgo: cobertura !== null && cobertura < 1 ? 'alto' : cobertura !== null && cobertura < 2 ? 'medio' : 'bajo',
      };
    });

    const totalPrediccion = resultado.reduce((s, p) => s + p.prediccion, 0);
    const criticos = resultado.filter((p) => p.riesgo !== 'bajo').length;

    res.json({
      meses: keys,
      matricula: keys.map((key) => ({ mes: key, estudiantes: matriculaMap.get(key) || 0 })),
      productos: resultado.sort((a, b) => b.prediccion - a.prediccion),
      resumen: {
        productos: resultado.length,
        totalPrediccion,
        criticos,
        promedioMensual: Math.round((resultado.reduce((s, p) => s + p.promedioMensual, 0) / (resultado.length || 1)) * 10) / 10,
      },
    });
  })
);

/* ============================ CONSUMOS/VISTAS =========================== */

router.get(
  '/inventario/consumo',
  asyncHandler(async (req, res) => {
    const { productoId, meses } = req.query;
    const limite = Math.min(24, Math.max(1, toInt(meses, 12)));
    const params = [limite - 1];
    let filter = '';
    if (productoId) {
      filter = 'AND producto_id = ';
      params.push(productoId);
    }
    const mensual = await query(
      `SELECT mes, producto_id AS productoId, nombre, marca, unidad, consumido, valor_consumido AS valorConsumido
       FROM vw_consumo_mensual
       WHERE mes >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
       ${filter}
       ORDER BY mes ASC`,
      params
    );
    const diario = await query(
      `SELECT dia, salidas, entradas, valor_consumido AS valorConsumido
       FROM vw_consumo_diario
       WHERE dia >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
       ORDER BY dia ASC`
    );
    res.json({ mensual, diario });
  })
);

module.exports = router;