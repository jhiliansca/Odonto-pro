-- =============================================================================
-- ODONTO-PRO · Consultas SQL para Grafana (catálogo real)
-- =============================================================================
-- Fuente de datos: MySQL  ->  base `OdontoproDB` (localhost:3306)
-- Generadas por  : backend/seed/sembrarCatalogo.js
--
-- Cada bloque corresponde a un panel del dashboard exportado en:
--   backWeb/grafana/dashboard_odonto_inventario.json
--
-- Los paneles usan la macro de tiempo del plugin MySQL de Grafana
-- ($__timeFilter). Las variantes sin macro (fechas literales) se incluyen
-- para probarlas desde MySQL Workbench / mysql.exe.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- (a) VALORACIÓN TOTAL DEL INVENTARIO  ->  panel Stat "Valor total"
-- -----------------------------------------------------------------------------
SELECT
  ROUND(COALESCE(SUM(m.precio * m.stock), 0), 2)        AS valor_total
FROM materiales m;

-- Variante con desglose por categoría (usada en el panel Piechart)
SELECT
  m.categoria,
  ROUND(COALESCE(SUM(m.precio * m.stock), 0), 2)        AS valor_total
FROM materiales m
GROUP BY m.categoria
ORDER BY valor_total DESC;

-- -----------------------------------------------------------------------------
-- (b) ALERTAS DE STOCK MÍNIMO  ->  panel Table "Alertas de stock mínimo"
-- -----------------------------------------------------------------------------
SELECT
  m.nombre                                              AS Insumo,
  m.categoria                                           AS Categoria,
  m.unidad                                              AS Unidad,
  m.stock                                               AS Stock,
  m.stock_minimo                                        AS Minimo,
  (m.stock - m.stock_minimo)                            AS Diferencia,
  CASE
    WHEN m.stock_minimo <= 0 THEN 0
    ELSE ROUND((m.stock - m.stock_minimo) / m.stock_minimo * 100, 1)
  END                                                   AS `%_sobre_minimo`,
  CASE
    WHEN m.stock_minimo > 0 AND m.stock < m.stock_minimo / 2 THEN 'CRITICO'
    WHEN m.stock < m.stock_minimo                       THEN 'BAJO'
    ELSE 'OK'
  END                                                   AS Severidad,
  ROUND(m.precio * m.stock, 2)                          AS `Valor stock (Bs)`
FROM materiales m
WHERE m.stock_minimo > 0 AND m.stock <= m.stock_minimo
ORDER BY (m.stock / NULLIF(m.stock_minimo, 0)) ASC;

-- -----------------------------------------------------------------------------
-- (c) INSUMOS SIN PRECIO  ->  panel Stat "Insumos sin precio cargado"
--     El catálogo fuente no incluye precios; este panel muestra cuántos
--     insumos todavía requieren precio para completar la valoración.
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS insumos_sin_precio
FROM materiales m
WHERE m.precio = 0;

-- -----------------------------------------------------------------------------
-- (d) USO DEL CATÁLOGO  ->  panel Table "Insumos más usados en el catálogo"
-- -----------------------------------------------------------------------------
SELECT
  u.nombre                                              AS Insumo,
  u.categoria                                           AS Categoria,
  u.unidad                                              AS Unidad,
  u.procedimientos                                      AS Procedimientos,
  u.usos                                                AS Usos,
  u.`cantidadRequerida`                                 AS `Cantidad requerida`
FROM vw_materiales_uso u
WHERE u.procedimientos > 0
ORDER BY u.procedimientos DESC, u.usos DESC
LIMIT 30;

-- -----------------------------------------------------------------------------
-- (e) CONSUMO TEMPORAL  ->  panel Time Series "Consumo temporal de insumos"
--     Serie diaria de entradas vs. salidas registradas por la API.
-- -----------------------------------------------------------------------------
SELECT
  DATE(m.fecha)                                          AS time,
  SUM(CASE WHEN m.tipo = 'SALIDA'  THEN m.cantidad ELSE 0 END) AS salidas,
  SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE 0 END) AS entradas
FROM movimientos_materiales m
WHERE $__timeFilter(m.fecha)
GROUP BY DATE(m.fecha)
ORDER BY time ASC;

-- Variante sin macros (Workbench): últimos 30 días
-- SELECT
--   DATE(m.fecha) AS time,
--   SUM(CASE WHEN m.tipo = 'SALIDA'  THEN m.cantidad ELSE 0 END) AS salidas,
--   SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE 0 END) AS entradas
-- FROM movimientos_materiales m
-- WHERE m.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
-- GROUP BY DATE(m.fecha)
-- ORDER BY time ASC;

-- -----------------------------------------------------------------------------
-- (f) BONUS · Top 10 de consumo por insumo  ->  panel Bar "Más consumidos"
-- -----------------------------------------------------------------------------
SELECT
  mat.nombre                                            AS Insumo,
  SUM(m.cantidad)                                       AS Unidades
FROM movimientos_materiales m
JOIN materiales mat ON mat.id = m.material_id
WHERE m.tipo = 'SALIDA'
  AND $__timeFilter(m.fecha)
GROUP BY mat.id, mat.nombre
ORDER BY Unidades DESC
LIMIT 10;

-- -----------------------------------------------------------------------------
-- (g) BONUS · Consumo mensual por insumo  ->  insumo del modelo de Predicción
-- -----------------------------------------------------------------------------
SELECT
  DATE_FORMAT(m.fecha, '%Y-%m-01')                      AS mes,
  mat.id                                                AS material_id,
  mat.nombre                                            AS Insumo,
  mat.unidad                                            AS Unidad,
  SUM(m.cantidad)                                       AS Consumido
FROM movimientos_materiales m
JOIN materiales mat ON mat.id = m.material_id
WHERE m.tipo = 'SALIDA'
GROUP BY DATE_FORMAT(m.fecha, '%Y-%m-01'), mat.id, mat.nombre, mat.unidad
ORDER BY mat.id, mes ASC;
