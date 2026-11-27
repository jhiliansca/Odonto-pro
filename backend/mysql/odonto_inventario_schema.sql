-- =============================================================================
-- ODONTO-PRO · Migración del módulo de inventario (MySQL 8.0 / 9.x)
-- =============================================================================
-- Espejo 1:1 del esquema declarado en backend/mysql/OdontoproDB_contactos.sql
-- (líneas 54-124), corregido para usar la base de datos real que consume el
-- backend (backend/index.js -> database: "OdontoproDB").
--
-- Es idempotente: puede ejecutarse tantas veces como sea necesario.
-- Se aplica automáticamente por:  node seed/simularInventario.js
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `OdontoproDB`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE `OdontoproDB`;

-- -----------------------------------------------------------------------------
-- proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `contacto` VARCHAR(120) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(120) DEFAULT NULL,
  `categoria` VARCHAR(60) DEFAULT NULL,
  `estado` ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proveedores_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- productos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `marca` VARCHAR(80) DEFAULT NULL,
  `categoria` ENUM('materiales','insumos','instrumentos','medicamentos') NOT NULL,
  `unidad` VARCHAR(40) NOT NULL DEFAULT 'unidades',
  `stock` INT NOT NULL DEFAULT 0,
  `stock_minimo` INT NOT NULL DEFAULT 0,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `proveedor_id` INT DEFAULT NULL,
  `ubicacion` VARCHAR(60) DEFAULT NULL,
  `ultima_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_productos_proveedor` (`proveedor_id`),
  KEY `idx_productos_categoria` (`categoria`),
  CONSTRAINT `fk_productos_proveedor` FOREIGN KEY (`proveedor_id`)
    REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- lotes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lotes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `producto_id` INT NOT NULL,
  `codigo_lote` VARCHAR(60) NOT NULL,
  `cantidad_inicial` INT NOT NULL DEFAULT 0,
  `cantidad_actual` INT NOT NULL DEFAULT 0,
  `fecha_ingreso` DATE NOT NULL,
  `fecha_vencimiento` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lote_producto` (`producto_id`,`codigo_lote`),
  KEY `idx_lotes_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `fk_lotes_producto` FOREIGN KEY (`producto_id`)
    REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- movimientos_inventario
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `movimientos_inventario` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `producto_id` INT NOT NULL,
  `lote_id` INT DEFAULT NULL,
  `tipo` ENUM('ENTRADA','SALIDA') NOT NULL,
  `cantidad` INT NOT NULL,
  `motivo` VARCHAR(150) NOT NULL,
  `usuario` VARCHAR(100) DEFAULT NULL,
  `precio_unitario` DECIMAL(10,2) DEFAULT NULL,
  `fecha` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mov_fecha` (`fecha`),
  KEY `idx_mov_producto` (`producto_id`),
  KEY `idx_mov_tipo` (`tipo`),
  CONSTRAINT `fk_mov_producto` FOREIGN KEY (`producto_id`)
    REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_lote` FOREIGN KEY (`lote_id`)
    REFERENCES `lotes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- Vistas de apoyo (Grafana / API de predicción)
-- =============================================================================

-- Valoración del inventario (Stat / Gauge)
CREATE OR REPLACE VIEW `vw_valoracion_inventario` AS
SELECT
  COUNT(*)                                            AS total_productos,
  COALESCE(SUM(p.stock > 0), 0)                       AS productos_con_stock,
  COALESCE(SUM(p.stock < p.stock_minimo), 0)          AS productos_criticos,
  COALESCE(SUM(p.precio * p.stock), 0)                AS valor_total,
  COALESCE(SUM(p.precio * p.stock_minimo), 0)         AS valor_stock_minimo
FROM productos p;

-- Alertas de stock mínimo (tabla)
CREATE OR REPLACE VIEW `vw_alertas_stock_minimo` AS
SELECT
  p.id,
  p.nombre,
  p.marca,
  p.categoria,
  p.unidad,
  p.stock,
  p.stock_minimo,
  (p.stock - p.stock_minimo)                          AS diferencia,
  CASE
    WHEN p.stock_minimo <= 0 THEN 0
    ELSE ROUND((p.stock - p.stock_minimo) / p.stock_minimo * 100, 1)
  END                                                 AS pct_sobre_minimo,
  ROUND(p.precio * p.stock, 2)                        AS valor_stock,
  pr.nombre                                           AS proveedor,
  p.ultima_actualizacion
FROM productos p
LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
WHERE p.stock <= p.stock_minimo;

-- Control de caducidad: lotes con stock y vencimiento próximo (≤ 30 días)
CREATE OR REPLACE VIEW `vw_lotes_por_vencer` AS
SELECT
  l.id,
  l.codigo_lote,
  p.id                                                AS producto_id,
  p.nombre,
  p.marca,
  l.cantidad_actual,
  p.unidad,
  l.fecha_ingreso,
  l.fecha_vencimiento,
  DATEDIFF(l.fecha_vencimiento, CURDATE())            AS dias_restantes,
  ROUND(l.cantidad_actual * p.precio, 2)              AS valor_en_riesgo,
  CASE
    WHEN l.fecha_vencimiento < CURDATE() THEN 'vencido'
    WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) <= 7 THEN 'inminente'
    ELSE 'por_vencer'
  END                                                 AS estado_caducidad
FROM lotes l
JOIN productos p ON p.id = l.producto_id
WHERE l.cantidad_actual > 0
  AND l.fecha_vencimiento IS NOT NULL
  AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY);

-- Consumo mensual por insumo (base del modelo de predicción de demanda)
CREATE OR REPLACE VIEW `vw_consumo_mensual` AS
SELECT
  DATE_FORMAT(m.fecha, '%Y-%m-01')                    AS mes,
  p.id                                                AS producto_id,
  p.nombre,
  p.marca,
  p.unidad,
  SUM(m.cantidad)                                     AS consumido,
  ROUND(SUM(m.cantidad * COALESCE(m.precio_unitario, 0)), 2) AS valor_consumido
FROM movimientos_inventario m
JOIN productos p ON p.id = m.producto_id
WHERE m.tipo = 'SALIDA'
GROUP BY DATE_FORMAT(m.fecha, '%Y-%m-01'), p.id, p.nombre, p.marca, p.unidad;

-- Consumo diario agregado (Time Series de Grafana)
CREATE OR REPLACE VIEW `vw_consumo_diario` AS
SELECT
  DATE(m.fecha)                                       AS dia,
  SUM(CASE WHEN m.tipo = 'SALIDA'  THEN m.cantidad ELSE 0 END) AS salidas,
  SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE 0 END) AS entradas,
  ROUND(SUM(CASE WHEN m.tipo = 'SALIDA'
            THEN m.cantidad * COALESCE(m.precio_unitario, 0) ELSE 0 END), 2) AS valor_consumido
FROM movimientos_inventario m
GROUP BY DATE(m.fecha);
