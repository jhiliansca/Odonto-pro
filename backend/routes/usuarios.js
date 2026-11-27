const express = require('express');
const { query, one } = require('../db');
const { asyncHandler, httpError, requireFields, hashPassword } = require('../utils');
const { USER_FIELDS, ensureProveedor } = require('./auth');

const router = express.Router();

const ROLE_VALUES = ['administrador', 'docente', 'recepcionista', 'estudiante', 'inventario', 'cajero', 'proveedor'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rol, estado, search } = req.query;
    const conditions = [];
    const params = [];

    if (rol) {
      conditions.push('u.rol = ?');
      params.push(rol);
    }
    if (estado) {
      conditions.push('u.estado = ?');
      params.push(estado);
    }
    if (search) {
      conditions.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT ${USER_FIELDS} FROM usuarios u ${where} ORDER BY u.id ASC`, params);
    res.json(rows);
  })
);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const row = await one(
      `SELECT
        COUNT(*) AS total,
        SUM(estado = 'activo') AS activos,
        SUM(rol = 'docente') AS docentes,
        SUM(rol = 'estudiante') AS estudiantes,
        SUM(rol = 'inventario') AS inventario,
        SUM(rol = 'proveedor') AS proveedores
       FROM usuarios`
    );
    res.json(row);
  })
);

router.get(
  '/doctores',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT
        u.id, u.nombre, u.apellido,
        TRIM(CONCAT(COALESCE(u.nombre,''), ' ', COALESCE(u.apellido,''))) AS nombreCompleto,
        COALESCE(u.especialidad, 'General') AS especialidad,
        u.titulo_academico AS tituloAcademico, u.departamento, u.horario_atencion AS horarioAtencion, u.biografia,
        u.email, COALESCE(u.telefono, '') AS telefono, COALESCE(u.ci,'') AS ci,
        COUNT(DISTINCT p.id) AS pacientes, u.estado,
        DATE_FORMAT(u.fecha_registro, '%d/%m/%Y') AS fechaRegistro
       FROM usuarios u
       LEFT JOIN pacientes p ON p.doctor_id = u.id
       WHERE u.rol = 'docente'
       GROUP BY u.id
       ORDER BY u.id ASC`
    );
    res.json(rows);
  })
);

router.get(
  '/estudiantes',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT
        u.id, u.nombre, u.apellido,
        TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido, ''))) AS nombreCompleto,
        COALESCE(u.semestre, '') AS semestre, COALESCE(u.tipo_semestre,'') AS tipoSemestre,
        COALESCE(u.carrera,'') AS carrera, COALESCE(u.grupo,'') AS grupo, COALESCE(u.turno,'') AS turno,
        u.email, COALESCE(u.telefono, '') AS telefono, COALESCE(u.ci,'') AS ci,
        COUNT(DISTINCT pr.id) AS practicas, COALESCE(ROUND(AVG(pr.calificacion), 1), 0) AS promedio,
        u.estado, DATE_FORMAT(u.fecha_registro, '%d/%m/%Y') AS fechaRegistro
       FROM usuarios u
       LEFT JOIN practicas pr ON pr.estudiante_id = u.id
       WHERE u.rol = 'estudiante'
       GROUP BY u.id
       ORDER BY u.id ASC`
    );
    res.json(rows);
  })
);

router.get(
  '/options',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT id, TRIM(CONCAT(nombre, ' ', COALESCE(apellido, ''))) AS nombre, rol
       FROM usuarios ORDER BY nombre ASC`
    );
    res.json(rows);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ? `, [req.params.id]);
    if (!user) throw httpError(404, 'Usuario no encontrado');
    res.json(user);
  })
);

function txt(v){ if(v===undefined||v===null) return null; const t=String(v).trim(); return t||null; }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre', 'email', 'password', 'rol']);
    let rol=String(body.rol||'').toLowerCase(); if(rol==='doctor') rol='docente'; if (!ROLE_VALUES.includes(rol)) throw httpError(400, 'Rol invlido');
    const exists = await one('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [body.email]);
    if (exists) throw httpError(409, 'Ya existe un usuario con ese correo');
    let proveedorId = body.proveedorId || null;
    if (!proveedorId && rol === 'proveedor') proveedorId = await ensureProveedor(body.empresa, body);
    const result = await query(
      `INSERT INTO usuarios
        (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, fecha_nacimiento, genero, especialidad, titulo_academico, departamento, horario_atencion, biografia, semestre, tipo_semestre, carrera, grupo, turno, empresa, proveedor_id, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txt(body.nombre), txt(body.apellido), txt(body.email), hashPassword(body.password), rol, txt(body.telefono), txt(body.ci), txt(body.direccion), txt(body.fechaNacimiento), txt(body.genero), txt(body.especialidad), txt(body.tituloAcademico), txt(body.departamento), txt(body.horarioAtencion), txt(body.biografia), rol==='estudiante' ? txt(body.semestre) : null, rol==='estudiante' ? txt(body.tipoSemestre) : null, rol==='estudiante' ? txt(body.carrera) : null, rol==='estudiante' ? txt(body.grupo) : null, rol==='estudiante' ? txt(body.turno) : null, txt(body.empresa), proveedorId, body.estado === 'inactivo' ? 'inactivo' : 'activo', txt(body.observaciones)]
    );
    const created = await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ? `, [result.insertId]);
    res.status(201).json(created);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT * FROM usuarios WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Usuario no encontrado');
    const fields = []; const params = []; const assign = (column, value) => { fields.push(`${column} = ?`); params.push(value); };
    let rol = current.rol;
    if (body.nombre !== undefined) assign('nombre', txt(body.nombre));
    if (body.apellido !== undefined) assign('apellido', txt(body.apellido));
    if (body.email !== undefined) assign('email', txt(body.email));
    if (body.rol !== undefined) { rol=String(body.rol||'').toLowerCase(); if(rol==='doctor') rol='docente'; if (!ROLE_VALUES.includes(rol)) throw httpError(400, 'Rol invlido'); assign('rol', rol); }
    const mapa = { telefono:'telefono', ci:'ci', direccion:'direccion', fechaNacimiento:'fecha_nacimiento', genero:'genero', especialidad:'especialidad', tituloAcademico:'titulo_academico', departamento:'departamento', horarioAtencion:'horario_atencion', biografia:'biografia', semestre:'semestre', tipoSemestre:'tipo_semestre', carrera:'carrera', grupo:'grupo', turno:'turno', empresa:'empresa', observaciones:'observaciones' };
    for (const [k,c] of Object.entries(mapa)) if (body[k] !== undefined) assign(c, txt(body[k]));
    if (body.estado !== undefined) assign('estado', body.estado === 'inactivo' ? 'inactivo' : 'activo');
    if (body.password) assign('password_hash', hashPassword(body.password));
    if (!fields.length) return res.json(await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ? `, [req.params.id]));
    params.push(req.params.id);
    await query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ? `, params);
    res.json(await one(`SELECT ${USER_FIELDS} FROM usuarios u WHERE u.id = ? `, [req.params.id]));
  })
);

router.patch(
  '/:id/estado',
  asyncHandler(async (req, res) => {
    const estado = req.body.estado === 'inactivo' ? 'inactivo' : 'activo';
    await query('UPDATE usuarios SET estado =  ? WHERE id = ? ', [estado, req.params.id]);
    res.json({ id: Number(req.params.id), estado });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await one('SELECT id, rol, proveedor_id FROM usuarios WHERE id = ? ', [req.params.id]);
    if (!user) throw httpError(404, 'Usuario no encontrado');
    await query('DELETE FROM usuarios WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Usuario eliminado', id: Number(req.params.id) });
  })
);

module.exports = router;