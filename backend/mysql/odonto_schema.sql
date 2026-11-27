-- =============================================================================
-- ODONTO-PRO · Esquema completo de la Clínica Odontológica Unifranz
-- MySQL 8.0+ / 9.x · Idempotente
-- =============================================================================
-- Este esquema reemplaza los datos simulados del frontend por tablas reales
-- que persisten toda la información del sistema.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `OdontoproDB`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE `OdontoproDB`;

-- -----------------------------------------------------------------------------
-- Proveedores
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
-- Usuarios del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador','cajero','doctor','estudiante','inventario','proveedor') NOT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `ci` VARCHAR(30) DEFAULT NULL,
  `especialidad` VARCHAR(120) DEFAULT NULL,
  `semestre` VARCHAR(30) DEFAULT NULL,
  `empresa` VARCHAR(150) DEFAULT NULL,
  `proveedor_id` INT DEFAULT NULL,
  `estado` ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_usuarios_proveedor` FOREIGN KEY (`proveedor_id`)
    REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Contactos (formulario público)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contactos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `pais` VARCHAR(80) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `mensaje` TEXT NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Pacientes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pacientes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `edad` INT DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `estado` ENUM('activo','pendiente','completado') NOT NULL DEFAULT 'activo',
  `doctor_id` INT DEFAULT NULL,
  `estudiante_id` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pacientes_doctor` (`doctor_id`),
  KEY `idx_pacientes_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_pacientes_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pacientes_estudiante` FOREIGN KEY (`estudiante_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Citas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `citas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `paciente_id` INT NOT NULL,
  `doctor_id` INT DEFAULT NULL,
  `estudiante_id` INT DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `tratamiento` VARCHAR(150) NOT NULL,
  `estado` ENUM('pendiente','confirmada','completada','cancelada') NOT NULL DEFAULT 'pendiente',
  `telefono` VARCHAR(30) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_citas_fecha` (`fecha`),
  KEY `idx_citas_doctor` (`doctor_id`),
  KEY `idx_citas_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_citas_paciente` FOREIGN KEY (`paciente_id`)
    REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_citas_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_citas_estudiante` FOREIGN KEY (`estudiante_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Tratamientos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tratamientos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `paciente_id` INT NOT NULL,
  `doctor_id` INT DEFAULT NULL,
  `estudiante_id` INT DEFAULT NULL,
  `diagnostico` VARCHAR(200) NOT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_estimada` DATE DEFAULT NULL,
  `costo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('pendiente','activo','completado') NOT NULL DEFAULT 'pendiente',
  `sesiones` INT NOT NULL DEFAULT 1,
  `sesiones_realizadas` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trat_paciente` (`paciente_id`),
  KEY `idx_trat_doctor` (`doctor_id`),
  CONSTRAINT `fk_trat_paciente` FOREIGN KEY (`paciente_id`)
    REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trat_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_trat_estudiante` FOREIGN KEY (`estudiante_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Historial clínico
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `historial_clinico` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `paciente_id` INT NOT NULL,
  `doctor_id` INT DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `diagnostico` VARCHAR(250) NOT NULL,
  `tratamiento` VARCHAR(250) NOT NULL,
  `notas` TEXT,
  `procedimientos` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hist_paciente` (`paciente_id`),
  KEY `idx_hist_doctor` (`doctor_id`),
  CONSTRAINT `fk_hist_paciente` FOREIGN KEY (`paciente_id`)
    REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hist_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Cursos y módulos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cursos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `instructor_id` INT DEFAULT NULL,
  `instructor` VARCHAR(150) DEFAULT NULL,
  `descripcion` TEXT,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `progreso` INT NOT NULL DEFAULT 0,
  `estado` ENUM('en_curso','completado','pendiente') NOT NULL DEFAULT 'en_curso',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cursos_instructor` FOREIGN KEY (`instructor_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `curso_modulos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `curso_id` INT NOT NULL,
  `nombre` VARCHAR(200) NOT NULL,
  `completado` TINYINT(1) NOT NULL DEFAULT 0,
  `orden` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_modulos_curso` (`curso_id`),
  CONSTRAINT `fk_modulos_curso` FOREIGN KEY (`curso_id`)
    REFERENCES `cursos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Prácticas clínicas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `practicas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estudiante_id` INT NOT NULL,
  `paciente_id` INT DEFAULT NULL,
  `paciente` VARCHAR(150) DEFAULT NULL,
  `nombre` VARCHAR(200) NOT NULL,
  `fecha` DATE NOT NULL,
  `supervisor_id` INT DEFAULT NULL,
  `supervisor` VARCHAR(150) DEFAULT NULL,
  `estado` ENUM('pendiente','completada','evaluada') NOT NULL DEFAULT 'pendiente',
  `calificacion` DECIMAL(3,1) DEFAULT NULL,
  `comentarios` TEXT,
  `detalles` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_practicas_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_practicas_estudiante` FOREIGN KEY (`estudiante_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_practicas_paciente` FOREIGN KEY (`paciente_id`)
    REFERENCES `pacientes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_practicas_supervisor` FOREIGN KEY (`supervisor_id`)
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Solicitudes de insumos de estudiantes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `insumos_solicitudes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estudiante_id` INT NOT NULL,
  `asignatura` VARCHAR(120) NOT NULL,
  `procedimiento` VARCHAR(150) NOT NULL,
  `semestre` INT NOT NULL DEFAULT 1,
  `estado` ENUM('asignado','pendiente') NOT NULL DEFAULT 'pendiente',
  `requiere_pago` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_insumos_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_insumos_estudiante` FOREIGN KEY (`estudiante_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `insumos_solicitud_detalle` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `solicitud_id` INT NOT NULL,
  `material` VARCHAR(200) NOT NULL,
  `cantidad` VARCHAR(50) NOT NULL,
  `asignado` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_detalle_solicitud` (`solicitud_id`),
  CONSTRAINT `fk_detalle_solicitud` FOREIGN KEY (`solicitud_id`)
    REFERENCES `insumos_solicitudes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pagos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `solicitud_id` INT DEFAULT NULL,
  `estudiante_id` INT NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `comprobante` LONGTEXT,
  `estado` ENUM('pendiente','verificado','rechazado') NOT NULL DEFAULT 'pendiente',
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pagos_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_pagos_solicitud` FOREIGN KEY (`solicitud_id`)
    REFERENCES `insumos_solicitudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pagos_estudiante` FOREIGN KEY (`estudiante_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Inventario
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

-- -----------------------------------------------------------------------------
-- Pedidos / órdenes de compra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(30) NOT NULL,
  `producto_id` INT DEFAULT NULL,
  `producto_nombre` VARCHAR(150) NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `proveedor_id` INT DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `fecha_entrega` DATE DEFAULT NULL,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('pendiente','en_transito','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pedidos_codigo` (`codigo`),
  KEY `idx_pedidos_proveedor` (`proveedor_id`),
  KEY `idx_pedidos_producto` (`producto_id`),
  CONSTRAINT `fk_pedidos_proveedor` FOREIGN KEY (`proveedor_id`)
    REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pedidos_producto` FOREIGN KEY (`producto_id`)
    REFERENCES `productos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Reportes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reportes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `modulo` ENUM('admin','inventario') NOT NULL DEFAULT 'admin',
  `titulo` VARCHAR(200) NOT NULL,
  `tipo` VARCHAR(40) NOT NULL,
  `periodo` VARCHAR(120) DEFAULT NULL,
  `registros` INT NOT NULL DEFAULT 0,
  `fecha` DATE NOT NULL,
  `generado_por` VARCHAR(150) DEFAULT NULL,
  `usuario_asignado` VARCHAR(150) DEFAULT NULL,
  `descargas` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reportes_modulo` (`modulo`),
  KEY `idx_reportes_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Configuración del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `configuracion` (
  `id` VARCHAR(60) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `valor` TEXT,
  `tipo` ENUM('texto','numero','toggle','select') NOT NULL DEFAULT 'texto',
  `opciones` JSON DEFAULT NULL,
  `categoria` ENUM('general','seguridad','notificaciones','sistema') NOT NULL DEFAULT 'general',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Eventos / actividad / caja
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `fecha_evento` DATETIME NOT NULL,
  `ubicacion` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `actividad` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario` VARCHAR(150) NOT NULL,
  `accion` VARCHAR(255) NOT NULL,
  `icono` VARCHAR(60) NOT NULL DEFAULT 'notifications',
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_actividad_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `transacciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cliente` VARCHAR(150) NOT NULL,
  `servicio` VARCHAR(150) NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('pendiente','completed') NOT NULL DEFAULT 'pendiente',
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transacciones_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Matrícula mensual (variable explicativa del modelo de predicción)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `matricula_mensual` (
  `mes` DATE NOT NULL,
  `estudiantes` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Chatbot
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chatbot_respuestas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `palabras_clave` VARCHAR(255) NOT NULL,
  `respuesta` TEXT NOT NULL,
  `prioridad` INT NOT NULL DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- Vistas de apoyo
-- =============================================================================
CREATE OR REPLACE VIEW `vw_valoracion_inventario` AS
SELECT
  COUNT(*)                                            AS total_productos,
  COALESCE(SUM(p.stock > 0), 0)                       AS productos_con_stock,
  COALESCE(SUM(p.stock < p.stock_minimo), 0)          AS productos_criticos,
  COALESCE(SUM(p.precio * p.stock), 0)                AS valor_total,
  COALESCE(SUM(p.precio * p.stock_minimo), 0)         AS valor_stock_minimo
FROM productos p;

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

CREATE OR REPLACE VIEW `vw_consumo_diario` AS
SELECT
  DATE(m.fecha)                                       AS dia,
  SUM(CASE WHEN m.tipo = 'SALIDA'  THEN m.cantidad ELSE 0 END) AS salidas,
  SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE 0 END) AS entradas,
  ROUND(SUM(CASE WHEN m.tipo = 'SALIDA'
            THEN m.cantidad * COALESCE(m.precio_unitario, 0) ELSE 0 END), 2) AS valor_consumido
FROM movimientos_inventario m
GROUP BY DATE(m.fecha);
