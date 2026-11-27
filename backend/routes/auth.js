const express = require('express');
const { query, one } = require('../db');
const {
  asyncHandler,
  httpError,
  requireFields,
  hashPassword,
  verifyPassword,
  fullName,
} = require('../utils');

const router = express.Router();

const USER_FIELDS = `
  u.id,
  u.nombre,
  u.apellido,
  CONCAT_WS(' ', u.nombre, u.apellido) AS nombreCompleto,
  u.email,
  u.rol,
  u.telefono,
  u.ci,
  u.direccion,
  u.fecha_nacimiento AS fechaNacimiento,
  u.genero,
  u.especialidad,
  u.titulo_academico AS tituloAcademico,
  u.departamento,
  u.horario_atencion AS horarioAtencion,
  u.biografia,
  u.semestre,
  u.tipo_semestre AS tipoSemestre,
  u.carrera,
  u.grupo,
  u.turno,
  u.empresa,
  u.proveedor_id AS proveedorId,
  u.estado,
  u.observaciones,
  DATE_FORMAT(u.fecha_registro, '%d/%m/%Y') AS fechaRegistro,
  u.fecha_registro AS fechaRegistroISO
`;

const ROLES = ['administrador', 'docente', 'recepcionista', 'estudiante', 'inventario', 'cajero', 'proveedor'];
const GENEROS = ['femenino', 'masculino', 'otro', 'prefiero_no_decir'];

function normalizarRol(valor) {
  let rol = String(valor || '').toLowerCase();
  if (rol === 'jefe_inventario' || rol === 'encargado_almacen') rol = 'inventario';
  if (rol === 'doctor') rol = 'docente';
  if (!ROLES.includes(rol)) throw httpError(400, 'Tipo de usuario inválido');
  return rol;
}

function texto(valor) {
  if (valor === undefined || valor === null) return null;
  const t = String(valor).trim();
  return t ? t : null;
}

function datosPerfil(body = {}, rolActual) {
  const genero = texto(body.genero);
  if (genero && !GENEROS.includes(genero)) throw httpError(400, 'Género inválido');
  const rol = rolActual || normalizarRol(body.tipoUsuario || body.rol);
  return {
    nombre: texto(body.nombre),
    apellido: texto(body.apellido),
    email: texto(body.email),
    telefono: texto(body.telefono),
    ci: texto(body.ci),
    direccion: texto(body.direccion),
    fechaNacimiento: texto(body.fechaNacimiento),
    genero,
    especialidad: rol === 'docente' ? texto(body.especialidad) : texto(body.especialidad),
    tituloAcademico: rol === 'docente' ? texto(body.tituloAcademico) : null,
    departamento: rol === 'docente' ? texto(body.departamento) : null,
    horarioAtencion: rol === 'docente' ? texto(body.horarioAtencion) : null,
    biografia: texto(body.biografia),
    semestre: rol === 'estudiante' ? texto(body.semestre) : null,
    tipoSemestre: rol === 'estudiante' ? texto(body.tipoSemestre) : null,
    carrera: rol === 'estudiante' ? texto(body.carrera) : null,
    grupo: rol === 'estudiante' ? texto(body.grupo) : null,
    turno: rol === 'estudiante' ? texto(body.turno) : null,
    empresa: rol === 'proveedor' ? texto(body.empresa) : texto(body.empresa),
    observaciones: texto(body.observaciones),
  };
}

function publicUser(row) {
  if (!row) return null;
  const { password_hash: _omit, ...rest } = row;
  return rest;
}

async function ensureProveedor(empresa, userData = {}) {
  const nombre = empresa || userData.nombre;
  if (!nombre) return null;
  const existing = await one('SELECT id FROM proveedores WHERE nombre = ? LIMIT 1', [nombre]);
  if (existing) return existing.id;
  const result = await query(
    `INSERT INTO proveedores (nombre, contacto, telefono, email, categoria, estado)
     VALUES (?, ?, ?, ?, ?, 'activo')`,
    [
      nombre,
      fullName(userData),
      userData.telefono || null,
      userData.email || null,
      'Proveedor',
    ]
  );
  return result.insertId;
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw httpError(400, 'Correo y contraseña son obligatorios');
    }

    const user = await one(
      `SELECT ${USER_FIELDS}, u.password_hash
       FROM usuarios u
       WHERE LOWER(u.email) = LOWER(?)
       LIMIT 1`,
      [email]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      throw httpError(401, 'Credenciales incorrectas');
    }
    if (user.estado !== 'activo') {
      throw httpError(403, 'El usuario se encuentra inactivo');
    }

    res.json({
      message: 'Sesión iniciada correctamente',
      user: publicUser(user),
    });
  })
);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre', 'email', 'password', 'tipoUsuario']);
    const rol = normalizarRol(body.tipoUsuario);
    const perfil = datosPerfil(body, rol);
    if (!perfil.nombre || !perfil.email) throw httpError(400, 'Nombre y correo son obligatorios');

    const exists = await one('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [perfil.email]);
    if (exists) throw httpError(409, 'Ya existe un usuario registrado con ese correo');

    let proveedorId = null;
    if (rol === 'proveedor') proveedorId = await ensureProveedor(perfil.empresa, { ...perfil, ...body });

    const result = await query(
      `INSERT INTO usuarios
        (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, fecha_nacimiento, genero, especialidad, titulo_academico, departamento, horario_atencion, biografia, semestre, tipo_semestre, carrera, grupo, turno, empresa, proveedor_id, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)`,
      [
        perfil.nombre, perfil.apellido, perfil.email, hashPassword(body.password), rol,
        perfil.telefono, perfil.ci, perfil.direccion, perfil.fechaNacimiento, perfil.genero,
        perfil.especialidad, perfil.tituloAcademico, perfil.departamento, perfil.horarioAtencion, perfil.biografia,
        perfil.semestre, perfil.tipoSemestre, perfil.carrera, perfil.grupo, perfil.turno,
        perfil.empresa, proveedorId, perfil.observaciones,
      ]
    );

    const created = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ?`, [result.insertId]);
    res.status(201).json({ message: 'Usuario registrado correctamente', user: created, id: result.insertId });
  })
);

router.get(
  '/me/:id',
  asyncHandler(async (req, res) => {
    const user = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ?`, [req.params.id]);
    if (!user) throw httpError(404, 'Usuario no encontrado');
    res.json(user);
  })
);

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const rows = await query(`SELECT ${USER_FIELDS} FROM usuarios u ORDER BY u.id ASC`);
    res.json(rows);
  })
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre', 'email', 'password', 'tipoUsuario']);
    const rol = normalizarRol(body.tipoUsuario || body.rol);
    const perfil = datosPerfil(body, rol);
    if (!perfil.nombre || !perfil.email) throw httpError(400, 'Nombre y correo son obligatorios');
    const exists = await one('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [perfil.email]);
    if (exists) throw httpError(409, 'Ya existe un usuario registrado con ese correo');
    const proveedorId = rol === 'proveedor' ? await ensureProveedor(perfil.empresa, { ...perfil, ...body }) : null;
    const result = await query(
      `INSERT INTO usuarios
        (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, fecha_nacimiento, genero, especialidad, titulo_academico, departamento, horario_atencion, biografia, semestre, tipo_semestre, carrera, grupo, turno, empresa, proveedor_id, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [perfil.nombre, perfil.apellido, perfil.email, hashPassword(body.password), rol, perfil.telefono, perfil.ci, perfil.direccion, perfil.fechaNacimiento, perfil.genero, perfil.especialidad, perfil.tituloAcademico, perfil.departamento, perfil.horarioAtencion, perfil.biografia, perfil.semestre, perfil.tipoSemestre, perfil.carrera, perfil.grupo, perfil.turno, perfil.empresa, proveedorId, body.estado === 'inactivo' ? 'inactivo' : 'activo', perfil.observaciones]
    );
    const created = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ?`, [result.insertId]);
    res.status(201).json({ message: 'Usuario creado correctamente', user: created, id: result.insertId });
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!current) throw httpError(404, 'Usuario no encontrado');
    const rol = body.rol !== undefined || body.tipoUsuario !== undefined ? normalizarRol(body.rol || body.tipoUsuario) : current.rol;
    const perfil = datosPerfil(body, rol);
    const fields = []; const params = [];
    const assign = (column, value) => { fields.push(`${column} = ?`); params.push(value); };
    if (body.nombre !== undefined) { if (!perfil.nombre) throw httpError(400, 'El nombre es obligatorio'); assign('nombre', perfil.nombre); }
    if (body.apellido !== undefined) assign('apellido', perfil.apellido);
    if (body.email !== undefined) {
      if (!perfil.email) throw httpError(400, 'El correo es obligatorio');
      const duplicado = await one('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) AND id <> ? LIMIT 1', [perfil.email, req.params.id]);
      if (duplicado) throw httpError(409, 'Ya existe un usuario registrado con ese correo');
      assign('email', perfil.email);
    }
    if (body.rol !== undefined || body.tipoUsuario !== undefined) assign('rol', rol);
    const mapa = { telefono:'telefono', ci:'ci', direccion:'direccion', fechaNacimiento:'fecha_nacimiento', genero:'genero', especialidad:'especialidad', tituloAcademico:'titulo_academico', departamento:'departamento', horarioAtencion:'horario_atencion', biografia:'biografia', semestre:'semestre', tipoSemestre:'tipo_semestre', carrera:'carrera', grupo:'grupo', turno:'turno', empresa:'empresa', observaciones:'observaciones' };
    for (const [key, col] of Object.entries(mapa)) if (body[key] !== undefined) assign(col, perfil[key]);
    if (body.estado !== undefined) { if (!['activo','inactivo'].includes(body.estado)) throw httpError(400,'Estado invlido'); assign('estado', body.estado); }
    if (body.password) assign('password_hash', hashPassword(body.password));
    if (fields.length) { params.push(req.params.id); await query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params); }
    const updated = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ?`, [req.params.id]);
    res.json({ message: 'Usuario actualizado correctamente', user: updated });
  })
);

router.patch(
  '/users/:id/estado',
  asyncHandler(async (req, res) => {
    const { estado } = req.body || {};
    if (!['activo', 'inactivo'].includes(estado)) throw httpError(400, 'Estado inválido');
    const result = await query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
    if (!result.affectedRows) throw httpError(404, 'Usuario no encontrado');
    const updated = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ?`, [req.params.id]);
    res.json({ message: 'Estado del usuario actualizado', user: updated });
  })
);

module.exports = router;
module.exports.publicUser = publicUser;
module.exports.ensureProveedor = ensureProveedor;
module.exports.USER_FIELDS = USER_FIELDS;
