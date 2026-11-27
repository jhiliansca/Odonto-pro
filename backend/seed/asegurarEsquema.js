"use strict";

require("../loadEnv");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "..", "mysql", "odontopro_schema.sql");

const COLUMNAS_POR_TABLA = {
  usuarios: [
    ["direccion", "VARCHAR(200) DEFAULT NULL"],
    ["fecha_nacimiento", "DATE DEFAULT NULL"],
    ["genero", "ENUM('femenino','masculino','otro','prefiero_no_decir') DEFAULT NULL"],
    ["titulo_academico", "VARCHAR(150) DEFAULT NULL"],
    ["departamento", "VARCHAR(120) DEFAULT NULL"],
    ["horario_atencion", "VARCHAR(150) DEFAULT NULL"],
    ["biografia", "TEXT DEFAULT NULL"],
    ["tipo_semestre", "VARCHAR(60) DEFAULT NULL"],
    ["carrera", "VARCHAR(150) DEFAULT NULL"],
    ["grupo", "VARCHAR(40) DEFAULT NULL"],
    ["turno", "VARCHAR(40) DEFAULT NULL"],
    ["observaciones", "TEXT DEFAULT NULL"],
  ],
  materiales: [
    ["requiere_caducidad", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["dias_alerta_caducidad", "INT NOT NULL DEFAULT 30"],
    ["ubicacion", "VARCHAR(120) DEFAULT NULL"],
  ],
};

async function asegurarColumnas(conexion, tabla, columnas) {
  const [columnasExistentes] = await conexion.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tabla]
  );
  const existentes = new Set(columnasExistentes.map((columna) => columna.COLUMN_NAME));
  for (const [nombre, definicion] of columnas) {
    if (!existentes.has(nombre)) {
      await conexion.query(`ALTER TABLE \`${tabla}\` ADD COLUMN \`${nombre}\` ${definicion}`);
    }
  }
}

async function asegurarEsquema() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    charset: "utf8mb4",
    multipleStatements: true,
  });

  try {
    const nombreBase = process.env.DB_NAME || "OdontoproDB";
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${nombreBase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await conexion.query(`USE \`${nombreBase}\``);
    for (const [tabla, columnas] of Object.entries(COLUMNAS_POR_TABLA)) {
      await asegurarColumnas(conexion, tabla, columnas);
    }
    await conexion.query(fs.readFileSync(SCHEMA_PATH, "utf8"));
    for (const [tabla, columnas] of Object.entries(COLUMNAS_POR_TABLA)) {
      await asegurarColumnas(conexion, tabla, columnas);
    }
    await conexion.query(`CREATE TABLE IF NOT EXISTS reportes (
      id BIGINT NOT NULL AUTO_INCREMENT, tipo VARCHAR(60) NOT NULL, modulo VARCHAR(60) NOT NULL, titulo VARCHAR(200) NOT NULL,
      descripcion TEXT DEFAULT NULL, parametros JSON DEFAULT NULL, datos JSON DEFAULT NULL, generado_por VARCHAR(150) DEFAULT NULL,
      generado_por_id INT DEFAULT NULL, formato VARCHAR(20) NOT NULL DEFAULT 'PDF', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id), KEY idx_reportes_modulo(modulo), KEY idx_reportes_fecha(created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    return true;
  } finally {
    await conexion.end();
  }
}

if (require.main === module) {
  asegurarEsquema()
    .then(() => console.log("✅ Esquema de OdontoproDB asegurado"))
    .catch((error) => {
      console.error("❌ No se pudo asegurar OdontoproDB:", error.message);
      process.exitCode = 1;
    });
}

module.exports = asegurarEsquema;
