'use strict';
/* =============================================================================
 * ODONTO-PRO · Cargador de variables de entorno (cero dependencias)
 * =============================================================================
 * Lee backend/.env y vuelca sus claves en process.env SIN sobrescribir las
 * variables ya definidas en el sistema. Se ejecuta al hacer require() para que
 * las rutas (que leen process.env al cargarse) vean los valores a tiempo.
 *
 * Formato admitido:  CLAVE=valor   (líneas con # son comentarios, se permiten
 * comillas simples o dobles alrededor del valor).
 * ========================================================================== */

const fs = require('fs');
const path = require('path');

function parseEnv(contents) {
  const out = {};
  for (const rawLine of String(contents).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnv(file = path.join(__dirname, '.env')) {
  if (!fs.existsSync(file)) return {};
  const parsed = parseEnv(fs.readFileSync(file, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return parsed;
}

const parsed = loadEnv();
loadEnv.parsed = parsed;
loadEnv.parseEnv = parseEnv;

module.exports = loadEnv;
