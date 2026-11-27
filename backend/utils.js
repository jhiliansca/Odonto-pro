const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = String(stored).split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    // Compatibilidad con contraseñas antiguas en texto plano
    return String(password) === String(stored);
  }
  const [, salt, hash] = parts;
  const candidate = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    throw httpError(400, `Campos obligatorios: ${missing.join(', ')}`);
  }
}

function toInt(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value) {
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

function fullName(person) {
  if (!person) return '';
  return [person.nombre, person.apellido].filter(Boolean).join(' ').trim();
}

function formatDateUI(value) {
  if (!value) return '';
  const iso = String(value).slice(0, 10);
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year}`;
}

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function nowISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 19).replace('T', ' ');
}

function parseJSON(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function regresionLineal(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) {
    return { pendiente: 0, intercepto: 0, r2: 0, predecir: () => 0 };
  }
  if (n === 1) {
    return { pendiente: 0, intercepto: ys[0], r2: 1, predecir: () => ys[0] };
  }

  const mediaX = xs.reduce((suma, valor) => suma + valor, 0) / n;
  const mediaY = ys.reduce((suma, valor) => suma + valor, 0) / n;
  let numerador = 0;
  let denominador = 0;
  for (let i = 0; i < n; i += 1) {
    numerador += (xs[i] - mediaX) * (ys[i] - mediaY);
    denominador += (xs[i] - mediaX) ** 2;
  }
  const pendiente = denominador === 0 ? 0 : numerador / denominador;
  const intercepto = mediaY - pendiente * mediaX;
  const predecir = (x) => pendiente * x + intercepto;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i += 1) {
    ssRes += (ys[i] - predecir(xs[i])) ** 2;
    ssTot += (ys[i] - mediaY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { pendiente, intercepto, r2, predecir };
}

module.exports = {
  regresionLineal,
  hashPassword,
  verifyPassword,
  asyncHandler,
  httpError,
  requireFields,
  toInt,
  toNumber,
  bool,
  fullName,
  formatDateUI,
  todayISO,
  nowISO,
  parseJSON,
};
