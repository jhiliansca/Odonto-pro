-- =============================================================================
-- ODONTO-PRO · Catálogo real de insumos por procedimiento (MySQL 8.0+)
-- =============================================================================
-- Datos fuente: planilla "Insumos Clínica Odontológica - CBB", 157 ítems.
-- Reemplaza el catálogo simulado: no hay productos, marcas ni precios inventados.
-- Idempotente: se puede ejecutar las veces que sea necesario.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `OdontoproDB`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE `OdontoproDB`;

CREATE TABLE IF NOT EXISTS `semestres` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `numero` INT NOT NULL,
  `etiqueta` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_semestres_numero` (`numero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `asignaturas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(180) NOT NULL,
  `semestre_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asignaturas` (`nombre`, `semestre_id`),
  KEY `idx_asignaturas_semestre` (`semestre_id`),
  CONSTRAINT `fk_asignaturas_semestre`
    FOREIGN KEY (`semestre_id`) REFERENCES `semestres` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `procedimientos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item` INT NOT NULL,
  `nombre` VARCHAR(220) NOT NULL,
  `semestre_id` INT NOT NULL,
  `asignatura_id` INT NOT NULL,
  `revisado` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_procedimientos_item` (`item`),
  KEY `idx_procedimientos_semestre` (`semestre_id`),
  KEY `idx_procedimientos_asignatura` (`asignatura_id`),
  KEY `idx_procedimientos_nombre` (`nombre`),
  CONSTRAINT `fk_procedimientos_semestre`
    FOREIGN KEY (`semestre_id`) REFERENCES `semestres` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_procedimientos_asignatura`
    FOREIGN KEY (`asignatura_id`) REFERENCES `asignaturas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `materiales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(220) NOT NULL,
  `clave` VARCHAR(220) NOT NULL,
  `categoria` VARCHAR(60) NOT NULL DEFAULT 'insumos',
  `unidad` VARCHAR(40) NOT NULL DEFAULT 'unidad',
  `stock` DECIMAL(12,3) NOT NULL DEFAULT 0,
  `stock_minimo` DECIMAL(12,3) NOT NULL DEFAULT 0,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materiales_clave` (`clave`),
  KEY `idx_materiales_categoria` (`categoria`),
  KEY `idx_materiales_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `procedimiento_materiales` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `procedimiento_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `nombre_original` VARCHAR(220) NOT NULL,
  `cantidad_texto` VARCHAR(80) NOT NULL,
  `cantidad` DECIMAL(12,3) NOT NULL DEFAULT 0,
  `unidad` VARCHAR(40) NOT NULL DEFAULT 'unidad',
  `orden` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pm` (`procedimiento_id`, `material_id`, `orden`),
  KEY `idx_pm_material` (`material_id`),
  KEY `idx_pm_procedimiento` (`procedimiento_id`),
  CONSTRAINT `fk_pm_procedimiento`
    FOREIGN KEY (`procedimiento_id`) REFERENCES `procedimientos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pm_material`
    FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `movimientos_materiales` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `material_id` INT NOT NULL,
  `tipo` ENUM('ENTRADA','SALIDA') NOT NULL,
  `cantidad` DECIMAL(12,3) NOT NULL,
  `motivo` VARCHAR(180) NOT NULL DEFAULT 'Movimiento de inventario',
  `usuario` VARCHAR(100) DEFAULT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movmat_material` (`material_id`),
  KEY `idx_movmat_fecha` (`fecha`),
  CONSTRAINT `fk_movmat_material`
    FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `solicitudes_insumos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `estudiante` VARCHAR(120) NOT NULL DEFAULT 'Estudiante',
  `semestre_id` INT DEFAULT NULL,
  `procedimiento_id` INT DEFAULT NULL,
  `material_id` INT NOT NULL,
  `cantidad` DECIMAL(12,3) NOT NULL DEFAULT 1,
  `cantidad_texto` VARCHAR(80) DEFAULT NULL,
  `estado` ENUM('pendiente','aprobado','entregado','rechazado') NOT NULL DEFAULT 'pendiente',
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sol_material` (`material_id`),
  KEY `idx_sol_estado` (`estado`),
  KEY `idx_sol_fecha` (`fecha`),
  CONSTRAINT `fk_sol_material`
    FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sol_procedimiento`
    FOREIGN KEY (`procedimiento_id`) REFERENCES `procedimientos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sol_semestre`
    FOREIGN KEY (`semestre_id`) REFERENCES `semestres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `contactos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `pais` VARCHAR(80) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `mensaje` TEXT,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- Vistas de apoyo
-- =============================================================================

CREATE OR REPLACE VIEW `vw_procedimientos_catalogo` AS
SELECT
  pr.id,
  pr.item,
  pr.nombre AS procedimiento,
  pr.revisado,
  s.etiqueta AS semestre,
  s.numero AS semestreNumero,
  a.nombre AS asignatura,
  COUNT(pm.id) AS totalMateriales,
  pr.updated_at AS actualizado
FROM procedimientos pr
JOIN semestres s ON s.id = pr.semestre_id
JOIN asignaturas a ON a.id = pr.asignatura_id
LEFT JOIN procedimiento_materiales pm ON pm.procedimiento_id = pr.id
GROUP BY pr.id, pr.item, pr.nombre, pr.revisado, s.etiqueta, s.numero, a.nombre, pr.updated_at;

CREATE OR REPLACE VIEW `vw_materiales_uso` AS
SELECT
  m.id,
  m.nombre,
  m.clave,
  m.categoria,
  m.unidad,
  m.stock,
  m.stock_minimo AS stockMinimo,
  m.precio,
  m.activo,
  COUNT(DISTINCT pm.procedimiento_id) AS procedimientos,
  COUNT(pm.id) AS usos,
  COALESCE(SUM(pm.cantidad), 0) AS cantidadRequerida,
  m.updated_at AS actualizado
FROM materiales m
LEFT JOIN procedimiento_materiales pm ON pm.material_id = m.id
GROUP BY m.id, m.nombre, m.clave, m.categoria, m.unidad, m.stock, m.stock_minimo, m.precio, m.activo, m.updated_at;

CREATE OR REPLACE VIEW `vw_catalogo_resumen` AS
SELECT
  (SELECT COUNT(*) FROM procedimientos) AS procedimientos,
  (SELECT COUNT(*) FROM materiales) AS materiales,
  (SELECT COUNT(*) FROM asignaturas) AS asignaturas,
  (SELECT COUNT(*) FROM semestres) AS semestres,
  (SELECT COUNT(*) FROM procedimiento_materiales) AS relaciones,
  (SELECT COUNT(*) FROM procedimientos WHERE revisado = 1) AS revisados,
  (SELECT COUNT(*) FROM materiales WHERE stock_minimo > 0 AND stock < stock_minimo) AS stockBajo,
  (SELECT COALESCE(SUM(stock * precio), 0) FROM materiales) AS valorTotal;
