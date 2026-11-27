"use strict";

/* =============================================================================
 * ODONTO-PRO · Seeder del catálogo REAL (157 ítems)
 * =============================================================================
 * Aplica el esquema, elimina el inventario simulado anterior y carga únicamente
 * los datos de la planilla institucional de insumos por procedimiento.
 *
 *   npm run db:seed
 *   npm run db:seed -- --solo-esquema
 * ========================================================================== */

require("../loadEnv");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const { FILAS } = require("./catalogoDatos");

const SCHEMA_PATH = path.join(__dirname, "..", "mysql", "odontopro_schema.sql");
const SOLO_ESQUEMA = process.argv.includes("--solo-esquema");

const CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  charset: "utf8mb4",
  multipleStatements: true,
};

function claveMaterial(nombre) {
  return String(nombre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^1\s+tubo de\s+/, "tubo de ")
    .replace(/^porciones\s+de\s+/, "")
    .replace(/^medidas\s+de\s+/, "")
    .replace(/^gotas\s+de\s+/, "gotas ")
    .replace(/^gota\s+de\s+/, "gota ")
    .replace(/chorhexidina/g, "clorhexidina")
    .replace(/pocion/g, "porcion")
    .replace(/fisiologico/g, "fisilogico")
    .replace(/acrilico/g, "acrilico")
    .replace(/[.]+$/g, "")
    .trim();
}

function categoriaMaterial(nombre) {
  const n = nombre.toLowerCase();
  if (/anestesia|aguja|clorhexidina|chorhexidina|gasa|povidona|sutura|bisturi|suero|algodon|papel|godiva|tarterite|oxigenada|cavitron|reveladora/.test(n)) {
    return "insumos";
  }
  if (/hipoclorito|edta|formocresol|eugenol|fluor|otazol|alcohol|antisept|ota/.test(n)) {
    return "medicamentos";
  }
  if (/alambre|placa base|rodete|fresa|trenzado|hoja de papel/.test(n)) {
    return "instrumentos";
  }
  return "materiales";
}

function unidadMaterial(nombre) {
  const n = nombre.toLowerCase();
  if (/alambre/.test(n)) return "cm";
  if (/placa radiografica|placas radiograficas/.test(n)) return "placa";
  if (/gasa/.test(n)) return "paquete";
  if (/tubo de anestesia/.test(n)) return "tubo";
  if (/aguja/.test(n)) return "unidad";
  if (/suero|hipoclorito|clorhexidina|tarterite|oxigenada|formocresol|edta|fluor|eugenol/.test(n)) return "ml";
  return "unidad";
}

function parsearCantidad(valor) {
  const texto = String(valor).trim();
  const normalizado = texto.replace(",", ".");
  const fraccion = normalizado.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraccion) {
    const denominador = Number(fraccion[2]);
    return {
      texto,
      cantidad: denominador ? Math.round((Number(fraccion[1]) / denominador) * 1000) / 1000 : 0,
      unidad: "unidad",
    };
  }
  const numero = normalizado.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!numero) return { texto, cantidad: 0, unidad: "unidad" };
  let unidad = numero[2].trim().replace(/\s+/g, " ");
  unidad = unidad
    .replace(/^paq\.$/i, "paquete")
    .replace(/^mgr$/i, "mg")
    .replace(/^ml$/i, "ml")
    .replace(/^cm$/i, "cm")
    .replace(/^gr$/i, "g");
  return {
    texto,
    cantidad: Number(numero[1]),
    unidad: unidad || "unidad",
  };
}

async function main() {
  let conexion;
  try {
    conexion = await mysql.createConnection(CONFIG);

    const esquema = fs.readFileSync(SCHEMA_PATH, "utf8");
    await conexion.query(esquema);
    console.log("✅ Esquema del catálogo aplicado");

    if (SOLO_ESQUEMA) {
      console.log("ℹ️  --solo-esquema: no se modificaron los datos");
      return;
    }

    const simuladas = [
      "movimientos_inventario",
      "lotes",
      "pedidos",
      "reportes",
      "matricula_mensual",
      "productos",
      "movimientos_materiales",
      "solicitudes_insumos",
      "procedimiento_materiales",
      "procedimientos",
      "asignaturas",
      "semestres",
      "materiales",
    ];
    for (const tabla of simuladas) {
      try {
        await conexion.query(`DELETE FROM \`${tabla}\``);
      } catch (error) {
        if (error.code !== "ER_NO_SUCH_TABLE") throw error;
      }
    }
    console.log("🧹 Inventario simulado eliminado");

    const semestres = new Map();
    const asignaturas = new Map();
    const materiales = new Map();
    const procedimientos = [];

    let semestreActual = "";
    let asignaturaActual = "";

    for (const [item, semestre, asignatura, procedimiento, receta] of FILAS) {
      const etiquetaSemestre = semestre || semestreActual;
      const nombreAsignatura = asignatura || asignaturaActual;
      if (semestre) semestreActual = semestre;
      if (asignatura) asignaturaActual = asignatura;

      const numeroSemestre = parseInt(String(etiquetaSemestre), 10);
      if (!Number.isFinite(numeroSemestre)) {
        throw new Error(`Semestre inválido en el ítem ${item}`);
      }
      if (!semestres.has(numeroSemestre)) {
        const [resultado] = await conexion.query(
          "INSERT INTO semestres (numero, etiqueta) VALUES (?, ?)",
          [numeroSemestre, etiquetaSemestre]
        );
        semestres.set(numeroSemestre, resultado.insertId);
      }
      if (!asignaturas.has(nombreAsignatura)) {
        const [resultado] = await conexion.query(
          "INSERT INTO asignaturas (nombre, semestre_id) VALUES (?, ?)",
          [nombreAsignatura, semestres.get(numeroSemestre)]
        );
        asignaturas.set(nombreAsignatura, resultado.insertId);
      }

      if (receta.cant.length !== receta.mat.length) {
        throw new Error(`Cantidades y materiales no coinciden en el ítem ${item}`);
      }

      const [resultadoProcedimiento] = await conexion.query(
        `INSERT INTO procedimientos (item, nombre, semestre_id, asignatura_id, revisado)
         VALUES (?, ?, ?, ?, 1)`,
        [item, procedimiento.replace(/\s+/g, " ").trim(), semestres.get(numeroSemestre), asignaturas.get(nombreAsignatura)]
      );
      const procedimientoId = resultadoProcedimiento.insertId;
      procedimientos.push(procedimientoId);

      for (let i = 0; i < receta.mat.length; i += 1) {
        const nombreOriginal = receta.mat[i];
        const clave = claveMaterial(nombreOriginal);
        if (!materiales.has(clave)) {
          const [resultadoMaterial] = await conexion.query(
            `INSERT INTO materiales (nombre, clave, categoria, unidad, stock, stock_minimo, precio)
             VALUES (?, ?, ?, ?, 0, 0, 0)`,
            [
              nombreOriginal.replace(/\s+/g, " ").trim(),
              clave,
              categoriaMaterial(nombreOriginal),
              unidadMaterial(nombreOriginal),
            ]
          );
          materiales.set(clave, resultadoMaterial.insertId);
        }
        const cantidad = parsearCantidad(receta.cant[i]);
        await conexion.query(
          `INSERT INTO procedimiento_materiales
            (procedimiento_id, material_id, nombre_original, cantidad_texto, cantidad, unidad, orden)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            procedimientoId,
            materiales.get(clave),
            nombreOriginal.replace(/\s+/g, " ").trim(),
            cantidad.texto,
            cantidad.cantidad,
            cantidad.unidad,
            i + 1,
          ]
        );
      }
    }

    const [resumen] = await conexion.query(`
      SELECT
        (SELECT COUNT(*) FROM procedimientos) AS procedimientos,
        (SELECT COUNT(*) FROM materiales) AS materiales,
        (SELECT COUNT(*) FROM asignaturas) AS asignaturas,
        (SELECT COUNT(*) FROM semestres) AS semestres,
        (SELECT COUNT(*) FROM procedimiento_materiales) AS relaciones
    `);

    console.log("📊 Catálogo cargado:", {
      items: FILAS.length,
      ...resumen[0],
    });

    if (Number(resumen[0].procedimientos) !== FILAS.length) {
      throw new Error("La cantidad de procedimientos insertados no coincide con la fuente");
    }
    console.log("🎯 Catálogo real listo para consumirse desde la API");
  } catch (error) {
    console.error("❌ Error al sembrar el catálogo:", error.message);
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
  }
}

main();
