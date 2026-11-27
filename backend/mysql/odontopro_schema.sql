-- =============================================================================
-- ODONTO-PRO · Esquema unificado de OdontoproDB (MySQL 8.0+)
-- =============================================================================
-- Base de datos real única del sistema. No contiene datos simulados.
-- Incluye catálogo real de insumos, usuarios por rol y módulos clínicos.
-- Idempotente: se puede ejecutar las veces que sea necesario.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `OdontoproDB`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE `OdontoproDB`;

-- -----------------------------------------------------------------------------
-- Catálogo real de insumos por procedimiento
-- -----------------------------------------------------------------------------

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
  `requiere_caducidad` TINYINT(1) NOT NULL DEFAULT 0,
  `dias_alerta_caducidad` INT NOT NULL DEFAULT 30,
  `ubicacion` VARCHAR(120) DEFAULT NULL,
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

-- -----------------------------------------------------------------------------
-- Usuarios y roles reales
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

CREATE TABLE IF NOT EXISTS `material_proveedores` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `material_id` INT NOT NULL,
  `proveedor_id` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `es_principal` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_proveedor` (`material_id`, `proveedor_id`),
  KEY `idx_mp_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_mp_material` FOREIGN KEY (`material_id`)
    REFERENCES `materiales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mp_proveedor` FOREIGN KEY (`proveedor_id`)
    REFERENCES `proveedores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lotes_materiales` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `material_id` INT NOT NULL,
  `codigo_lote` VARCHAR(80) NOT NULL,
  `fecha_ingreso` DATE NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `cantidad_inicial` DECIMAL(12,3) NOT NULL,
  `cantidad_actual` DECIMAL(12,3) NOT NULL,
  `unidad` VARCHAR(40) NOT NULL DEFAULT 'unidad',
  `proveedor_id` INT DEFAULT NULL,
  `ubicacion` VARCHAR(120) DEFAULT NULL,
  `estado` ENUM('activo','agotado','descartado') NOT NULL DEFAULT 'activo',
  `observaciones` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lotes_material_codigo` (`material_id`, `codigo_lote`),
  KEY `idx_lotes_vencimiento` (`fecha_vencimiento`),
  KEY `idx_lotes_estado` (`estado`),
  KEY `idx_lotes_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_lotes_material` FOREIGN KEY (`material_id`)
    REFERENCES `materiales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lotes_proveedor` FOREIGN KEY (`proveedor_id`)
    REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador','docente','estudiante','recepcionista','inventario','cajero','proveedor') NOT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `ci` VARCHAR(30) DEFAULT NULL,
  `direccion` VARCHAR(200) DEFAULT NULL,
  `fecha_nacimiento` DATE DEFAULT NULL,
  `genero` ENUM('femenino','masculino','otro','prefiero_no_decir') DEFAULT NULL,
  `especialidad` VARCHAR(120) DEFAULT NULL,
  `titulo_academico` VARCHAR(150) DEFAULT NULL,
  `departamento` VARCHAR(120) DEFAULT NULL,
  `horario_atencion` VARCHAR(150) DEFAULT NULL,
  `biografia` TEXT DEFAULT NULL,
  `semestre` VARCHAR(30) DEFAULT NULL,
  `tipo_semestre` VARCHAR(60) DEFAULT NULL,
  `carrera` VARCHAR(150) DEFAULT NULL,
  `grupo` VARCHAR(40) DEFAULT NULL,
  `turno` VARCHAR(40) DEFAULT NULL,
  `empresa` VARCHAR(150) DEFAULT NULL,
  `proveedor_id` INT DEFAULT NULL,
  `estado` ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  `observaciones` TEXT DEFAULT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_usuarios_proveedor` FOREIGN KEY (`proveedor_id`)
    REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Módulos clínicos
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
-- Académico y pagos
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
-- Soporte del sistema
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

CREATE TABLE IF NOT EXISTS `actividad` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario` VARCHAR(150) NOT NULL,
  `accion` VARCHAR(255) NOT NULL,
  `icono` VARCHAR(60) NOT NULL DEFAULT 'notifications',
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_actividad_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `eventos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `fecha_evento` DATETIME NOT NULL,
  `ubicacion` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
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

CREATE TABLE IF NOT EXISTS `chatbot_respuestas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `palabras_clave` VARCHAR(255) NOT NULL,
  `respuesta` TEXT NOT NULL,
  `prioridad` INT NOT NULL DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `reportes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tipo` VARCHAR(60) NOT NULL,
  `modulo` VARCHAR(60) NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `parametros` JSON DEFAULT NULL,
  `datos` JSON DEFAULT NULL,
  `generado_por` VARCHAR(150) DEFAULT NULL,
  `generado_por_id` INT DEFAULT NULL,
  `formato` VARCHAR(20) NOT NULL DEFAULT 'PDF',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reportes_modulo` (`modulo`),
  KEY `idx_reportes_tipo` (`tipo`),
  KEY `idx_reportes_fecha` (`created_at`),
  CONSTRAINT `fk_reportes_usuario` FOREIGN KEY (`generado_por_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Vistas de apoyo
-- -----------------------------------------------------------------------------

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
  m.requiere_caducidad AS requiereCaducidad,
  m.dias_alerta_caducidad AS diasAlertaCaducidad,
  m.ubicacion,
  COUNT(DISTINCT pm.procedimiento_id) AS procedimientos,
  COUNT(pm.id) AS usos,
  COALESCE(SUM(pm.cantidad), 0) AS cantidadRequerida,
  m.updated_at AS actualizado
FROM materiales m
LEFT JOIN procedimiento_materiales pm ON pm.material_id = m.id
GROUP BY m.id, m.nombre, m.clave, m.categoria, m.unidad, m.stock, m.stock_minimo, m.precio, m.activo,
  m.requiere_caducidad, m.dias_alerta_caducidad, m.ubicacion, m.updated_at;

CREATE OR REPLACE VIEW `vw_lotes_caducidad` AS
SELECT
  l.id,
  l.material_id AS materialId,
  m.nombre AS material,
  m.clave,
  m.categoria,
  m.unidad,
  l.codigo_lote AS codigoLote,
  l.fecha_ingreso AS fechaIngreso,
  l.fecha_vencimiento AS fechaVencimiento,
  CAST(l.cantidad_inicial AS DECIMAL(12,3)) AS cantidadInicial,
  CAST(l.cantidad_actual AS DECIMAL(12,3)) AS cantidadActual,
  m.precio,
  CAST(l.cantidad_actual * m.precio AS DECIMAL(14,2)) AS valor,
  p.id AS proveedorId,
  p.nombre AS proveedor,
  l.ubicacion,
  l.estado,
  l.observaciones,
  m.requiere_caducidad AS requiereCaducidad,
  m.dias_alerta_caducidad AS diasAlertaCaducidad,
  DATEDIFF(l.fecha_vencimiento, CURDATE()) AS diasRestantes,
  CASE
    WHEN l.estado <> 'activo' THEN 'cerrado'
    WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) < 0 THEN 'vencido'
    WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) = 0 THEN 'hoy'
    WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) <= m.dias_alerta_caducidad THEN 'proximo'
    ELSE 'normal'
  END AS estadoCaducidad,
  l.created_at AS creado,
  l.updated_at AS actualizado
FROM lotes_materiales l
JOIN materiales m ON m.id = l.material_id
LEFT JOIN proveedores p ON p.id = l.proveedor_id;

CREATE OR REPLACE VIEW `vw_catalogo_resumen` AS
SELECT
  (SELECT COUNT(*) FROM procedimientos) AS procedimientos,
  (SELECT COUNT(*) FROM materiales) AS materiales,
  (SELECT COUNT(*) FROM asignaturas) AS asignaturas,
  (SELECT COUNT(*) FROM semestres) AS semestres,
  (SELECT COUNT(*) FROM procedimiento_materiales) AS relaciones,
  (SELECT COUNT(*) FROM procedimientos WHERE revisado = 1) AS revisados,
  (SELECT COUNT(*) FROM materiales WHERE stock_minimo > 0 AND stock < stock_minimo) AS stockBajo,
  (SELECT COALESCE(SUM(stock * precio), 0) FROM materiales) AS valorTotal,
  (SELECT COUNT(*) FROM lotes_materiales WHERE estado = 'activo' AND cantidad_actual > 0) AS lotesActivos,
  (SELECT COUNT(*) FROM lotes_materiales WHERE estado = 'activo' AND cantidad_actual > 0 AND fecha_vencimiento < CURDATE()) AS lotesVencidos,
  (SELECT COUNT(*) FROM lotes_materiales WHERE estado = 'activo' AND cantidad_actual > 0 AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS lotesPorVencer,
  (SELECT COUNT(DISTINCT id) FROM materiales WHERE requiere_caducidad = 1) AS materialesConCaducidad,
  (SELECT COALESCE(SUM(l.cantidad_actual * m.precio), 0)
     FROM lotes_materiales l JOIN materiales m ON m.id = l.material_id
    WHERE l.estado = 'activo' AND l.cantidad_actual > 0 AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS valorCaducidadRiesgo;

CREATE OR REPLACE VIEW `vw_usuarios_resumen` AS
SELECT
  COUNT(*) AS total,
  SUM(rol = 'administrador') AS administradores,
  SUM(rol = 'docente') AS docentes,
  SUM(rol = 'estudiante') AS estudiantes,
  SUM(rol = 'recepcionista') AS recepcionistas,
  SUM(rol = 'inventario') AS inventario,
  SUM(estado = 'activo') AS activos,
  SUM(estado = 'inactivo') AS inactivos
FROM usuarios;

CREATE OR REPLACE VIEW `vw_citas_resumen` AS
SELECT
  COUNT(*) AS total,
  SUM(estado = 'pendiente') AS pendientes,
  SUM(estado = 'confirmada') AS confirmadas,
  SUM(estado = 'completada') AS completadas,
  SUM(estado = 'cancelada') AS canceladas,
  SUM(fecha = CURDATE()) AS hoy
FROM citas;

CREATE OR REPLACE VIEW `vw_pacientes_resumen` AS
SELECT
  COUNT(*) AS total,
  SUM(estado = 'activo') AS activos,
  SUM(estado = 'pendiente') AS pendientes,
  SUM(estado = 'completado') AS completados
FROM pacientes;

CREATE OR REPLACE VIEW `vw_tratamientos_resumen` AS
SELECT
  COUNT(*) AS total,
  SUM(estado = 'pendiente') AS pendientes,
  SUM(estado = 'activo') AS activos,
  SUM(estado = 'completado') AS completados,
  COALESCE(SUM(costo), 0) AS valorTotal
FROM tratamientos;
