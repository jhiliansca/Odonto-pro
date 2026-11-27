const express = require('express');
const { query, one, transaction } = require('../db');
const { asyncHandler, httpError, requireFields, toInt, bool } = require('../utils');

const router = express.Router();

/* ============================== CURSOS ================================== */

async function modulesFor(courseIds) {
  if (!courseIds.length) return new Map();
  const placeholders = courseIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT id, curso_id AS cursoId, nombre, completado, orden
     FROM curso_modulos WHERE curso_id IN (${placeholders})
     ORDER BY orden ASC, id ASC`,
    courseIds
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.cursoId)) map.set(row.cursoId, []);
    map.get(row.cursoId).push({ ...row, completado: Boolean(row.completado) });
  }
  return map;
}

async function getCurso(id) {
  const curso = await one(
    `SELECT id, nombre, instructor_id AS instructorId, COALESCE(instructor, '') AS instructor,
            COALESCE(descripcion, '') AS descripcion,
            DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fechaInicio,
            DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fechaFin,
            progreso, estado
     FROM cursos WHERE id = ? `,
    [id]
  );
  if (!curso) return null;
  const modules = await modulesFor([curso.id]);
  return { ...curso, modulos: modules.get(curso.id) || [] };
}

async function recalcProgreso(cursoId) {
  const row = await one(
    `SELECT COUNT(*) AS total, SUM(completado = 1) AS completados FROM curso_modulos WHERE curso_id = ? `,
    [cursoId]
  );
  const total = Number(row.total || 0);
  const completados = Number(row.completados || 0);
  const progreso = total > 0 ? Math.round((completados / total) * 100) : 0;
  await query('UPDATE cursos SET progreso =  ? WHERE id = ? ', [progreso, cursoId]);
  return progreso;
}

router.get(
  '/cursos',
  asyncHandler(async (_req, res) => {
    const cursos = await query(
      `SELECT id, nombre, instructor_id AS instructorId, COALESCE(instructor, '') AS instructor,
              COALESCE(descripcion, '') AS descripcion,
              DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fechaInicio,
              DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fechaFin,
              progreso, estado
       FROM cursos ORDER BY id ASC`
    );
    const modules = await modulesFor(cursos.map((c) => c.id));
    res.json(cursos.map((curso) => ({ ...curso, modulos: modules.get(curso.id) || [] })));
  })
);

router.get(
  '/cursos/:id',
  asyncHandler(async (req, res) => {
    const curso = await getCurso(req.params.id);
    if (!curso) throw httpError(404, 'Curso no encontrado');
    res.json(curso);
  })
);

router.post(
  '/cursos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre']);
    const result = await query(
      `INSERT INTO cursos (nombre, instructor_id, instructor, descripcion, fecha_inicio, fecha_fin, progreso, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.nombre,
        toInt(body.instructorId),
        body.instructor || null,
        body.descripcion || null,
        body.fechaInicio || null,
        body.fechaFin || null,
        toInt(body.progreso, 0),
        body.estado || 'en_curso',
      ]
    );
    if (Array.isArray(body.modulos)) {
      for (let i = 0; i < body.modulos.length; i += 1) {
        const modulo = body.modulos[i];
        await query(
          `INSERT INTO curso_modulos (curso_id, nombre, completado, orden) VALUES (?, ?, ?, ?)`,
          [result.insertId, modulo.nombre || `Módulo ${i + 1}`, bool(modulo.completado), i + 1]
        );
      }
      await recalcProgreso(result.insertId);
    }
    res.status(201).json(await getCurso(result.insertId));
  })
);

router.put(
  '/cursos/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT id FROM cursos WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Curso no encontrado');

    const fields = [];
    const params = [];
    const assign = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (body.nombre !== undefined) assign('nombre', body.nombre);
    if (body.instructorId !== undefined) assign('instructor_id', toInt(body.instructorId));
    if (body.instructor !== undefined) assign('instructor', body.instructor);
    if (body.descripcion !== undefined) assign('descripcion', body.descripcion);
    if (body.fechaInicio !== undefined) assign('fecha_inicio', body.fechaInicio || null);
    if (body.fechaFin !== undefined) assign('fecha_fin', body.fechaFin || null);
    if (body.progreso !== undefined) assign('progreso', toInt(body.progreso, 0));
    if (body.estado !== undefined) assign('estado', body.estado);

    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE cursos SET ${fields.join(', ')} WHERE id = ? `, params);
    }
    res.json(await getCurso(req.params.id));
  })
);

router.post(
  '/cursos/:id/modulos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre']);
    const row = await one('SELECT COALESCE(MAX(orden), 0) + 1 AS orden FROM curso_modulos WHERE curso_id = ? ', [req.params.id]);
    await query(
      `INSERT INTO curso_modulos (curso_id, nombre, completado, orden) VALUES (?, ?, ?, ?)`,
      [req.params.id, body.nombre, bool(body.completado), row.orden || 1]
    );
    await recalcProgreso(req.params.id);
    res.status(201).json(await getCurso(req.params.id));
  })
);

router.put(
  '/cursos/:id/modulos/:moduloId',
  asyncHandler(async (req, res) => {
    const completado = bool(req.body.completado);
    await query('UPDATE curso_modulos SET completado =  ? WHERE id =  ? AND curso_id = ? ', [
      completado,
      req.params.moduloId,
      req.params.id,
    ]);
    await recalcProgreso(req.params.id);
    res.json(await getCurso(req.params.id));
  })
);

router.delete(
  '/cursos/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM cursos WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Curso eliminado', id: Number(req.params.id) });
  })
);

/* ============================= PRACTICAS ================================ */

const PRACTICA_SELECT = `
  SELECT
    pr.id,
    pr.estudiante_id AS estudianteId,
    pr.paciente_id AS pacienteId,
    COALESCE(pr.paciente, p.nombre, 'Sin paciente') AS paciente,
    pr.nombre,
    DATE_FORMAT(pr.fecha, '%d/%m/%Y') AS fecha,
    DATE_FORMAT(pr.fecha, '%Y-%m-%d') AS fechaISO,
    pr.supervisor_id AS supervisorId,
    COALESCE(pr.supervisor, TRIM(CONCAT(COALESCE(d.nombre, ''), ' ', COALESCE(d.apellido, '')))) AS supervisor,
    pr.estado,
    pr.calificacion,
    COALESCE(pr.comentarios, '') AS comentarios,
    COALESCE(pr.detalles, '') AS detalles,
    DATE_FORMAT(pr.created_at, '%d/%m/%Y') AS fechaRegistro
  FROM practicas pr
  LEFT JOIN pacientes p ON p.id = pr.paciente_id
  LEFT JOIN usuarios d ON d.id = pr.supervisor_id
`;

async function getPractica(id) {
  return one(`${PRACTICA_SELECT} WHERE pr.id = ? `, [id]);
}

router.get(
  '/practicas',
  asyncHandler(async (req, res) => {
    const { estudianteId, supervisorId, estado, search } = req.query;
    const conditions = [];
    const params = [];
    if (estudianteId) {
      conditions.push('pr.estudiante_id = ?');
      params.push(estudianteId);
    }
    if (supervisorId) {
      conditions.push('pr.supervisor_id = ?');
      params.push(supervisorId);
    }
    if (estado) {
      conditions.push('pr.estado = ?');
      params.push(estado);
    }
    if (search) {
      conditions.push('(pr.nombre LIKE ? OR pr.paciente LIKE ? OR p.nombre LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`${PRACTICA_SELECT} ${where} ORDER BY pr.fecha DESC, pr.id DESC`, params);
    res.json(rows);
  })
);

router.post(
  '/practicas',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['nombre', 'fecha']);
    if (!body.estudianteId) throw httpError(400, 'Debe indicar el estudiante');

    let pacienteId = toInt(body.pacienteId);
    if (!pacienteId && body.paciente) {
      const found = await one('SELECT id FROM pacientes WHERE nombre =  ? LIMIT 1', [body.paciente]);
      pacienteId = found.id || null;
      if (!pacienteId) {
        const created = await query('INSERT INTO pacientes (nombre, estado, estudiante_id) VALUES (?, ?, ?)', [
          body.paciente,
          'activo',
          toInt(body.estudianteId),
        ]);
        pacienteId = created.insertId;
      }
    }

    const result = await query(
      `INSERT INTO practicas
        (estudiante_id, paciente_id, paciente, nombre, fecha, supervisor_id, supervisor, estado, calificacion, comentarios, detalles)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toInt(body.estudianteId),
        pacienteId,
        body.paciente || null,
        body.nombre,
        body.fecha,
        toInt(body.supervisorId),
        body.supervisor || null,
        body.estado || 'pendiente',
        body.calificacion ?? null,
        body.comentarios || null,
        body.detalles || null,
      ]
    );
    res.status(201).json(await getPractica(result.insertId));
  })
);

router.put(
  '/practicas/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT id FROM practicas WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Práctica no encontrada');

    const fields = [];
    const params = [];
    const assign = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (body.estudianteId !== undefined) assign('estudiante_id', toInt(body.estudianteId));
    if (body.pacienteId !== undefined) assign('paciente_id', toInt(body.pacienteId));
    if (body.paciente !== undefined) assign('paciente', body.paciente);
    if (body.nombre !== undefined) assign('nombre', body.nombre);
    if (body.fecha !== undefined) assign('fecha', body.fecha);
    if (body.supervisorId !== undefined) assign('supervisor_id', toInt(body.supervisorId));
    if (body.supervisor !== undefined) assign('supervisor', body.supervisor);
    if (body.estado !== undefined) assign('estado', body.estado);
    if (body.calificacion !== undefined) assign('calificacion', body.calificacion ?? null);
    if (body.comentarios !== undefined) assign('comentarios', body.comentarios);
    if (body.detalles !== undefined) assign('detalles', body.detalles);

    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE practicas SET ${fields.join(', ')} WHERE id = ? `, params);
    }
    res.json(await getPractica(req.params.id));
  })
);

router.delete(
  '/practicas/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM practicas WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Práctica eliminada', id: Number(req.params.id) });
  })
);

/* ========================== INSUMOS Y PAGOS ============================= */

const SOLICITUD_SELECT = `
  SELECT
    s.id,
    s.estudiante_id AS estudianteId,
    TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS estudiante,
    s.asignatura,
    s.procedimiento,
    s.semestre,
    s.estado,
    s.requiere_pago AS requierePago,
    DATE_FORMAT(s.created_at, '%d/%m/%Y') AS fecha,
    DATE_FORMAT(s.created_at, '%Y-%m-%d') AS fechaISO
  FROM insumos_solicitudes s
  LEFT JOIN usuarios u ON u.id = s.estudiante_id
`;

async function detailsFor(solicitudIds) {
  if (!solicitudIds.length) return new Map();
  const placeholders = solicitudIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT id, solicitud_id AS solicitudId, material, cantidad, asignado
     FROM insumos_solicitud_detalle WHERE solicitud_id IN (${placeholders}) ORDER BY id ASC`,
    solicitudIds
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.solicitudId)) map.set(row.solicitudId, []);
    map.get(row.solicitudId).push(row);
  }
  return map;
}

function mapSolicitud(row, detalles = [], pago = null) {
  const materials = detalles.map((d) => ({
    id: d.id,
    material: d.material,
    name: d.material,
    cantidad: d.cantidad,
    quantity: d.cantidad,
    asignado: Boolean(d.asignado),
    assigned: Boolean(d.asignado),
  }));
  return {
    ...row,
    requierePago: Boolean(row.requierePago),
    paymentRequired: Boolean(row.requierePago),
    subject: row.asignatura,
    procedure: row.procedimiento,
    status: row.estado === 'asignado' ? 'Asignado' : 'Pendiente',
    materiales: materials,
    materials,
    pago,
  };
}

async function getSolicitud(id) {
  const row = await one(`${SOLICITUD_SELECT} WHERE s.id = ? `, [id]);
  if (!row) return null;
  const details = await detailsFor([row.id]);
  const pago = await one(
    `SELECT id, monto, estado, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha FROM pagos WHERE solicitud_id =  ? ORDER BY id DESC LIMIT 1`,
    [id]
  );
  return mapSolicitud(row, details.get(row.id) || [], pago);
}

router.get(
  '/insumos',
  asyncHandler(async (req, res) => {
    const { estudianteId, estado } = req.query;
    const conditions = [];
    const params = [];
    if (estudianteId) {
      conditions.push('s.estudiante_id = ?');
      params.push(estudianteId);
    }
    if (estado) {
      conditions.push('s.estado = ?');
      params.push(estado);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`${SOLICITUD_SELECT} ${where} ORDER BY s.id DESC`, params);
    const details = await detailsFor(rows.map((r) => r.id));
    const pagos = rows.length
      ? await query(
          `SELECT id, solicitud_id AS solicitudId, monto, estado, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha
           FROM pagos WHERE solicitud_id IN (${rows.map(() => '?').join(',')}) ORDER BY id DESC`,
          rows.map((r) => r.id)
        )
      : [];
    const pagoPorSolicitud = new Map();
    for (const pago of pagos) {
      if (!pagoPorSolicitud.has(pago.solicitudId)) pagoPorSolicitud.set(pago.solicitudId, pago);
    }
    res.json(rows.map((row) => mapSolicitud(row, details.get(row.id) || [], pagoPorSolicitud.get(row.id) || null)));
  })
);

router.get(
  '/insumos/:id',
  asyncHandler(async (req, res) => {
    const row = await getSolicitud(req.params.id);
    if (!row) throw httpError(404, 'Solicitud no encontrada');
    res.json(row);
  })
);

router.post(
  '/insumos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['asignatura', 'procedimiento']);
    if (!body.estudianteId) throw httpError(400, 'Debe indicar el estudiante');

    const solicitudId = await transaction(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO insumos_solicitudes (estudiante_id, asignatura, procedimiento, semestre, estado, requiere_pago)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          toInt(body.estudianteId),
          body.asignatura,
          body.procedimiento,
          toInt(body.semestre, 1),
          body.estado === 'asignado' ? 'asignado' : 'pendiente',
          bool(body.requierePago),
        ]
      );
      const materiales = Array.isArray(body.materiales) ? body.materiales : [];
      for (const material of materiales) {
        if (!material.material && !material.name) continue;
        await connection.query(
          `INSERT INTO insumos_solicitud_detalle (solicitud_id, material, cantidad, asignado)
           VALUES (?, ?, ?, ?)`,
          [
            result.insertId,
            material.material || material.name,
            String(material.cantidad || material.quantity || '1'),
            bool(material.asignado ?? material.assigned),
          ]
        );
      }
      return result.insertId;
    });

    res.status(201).json(await getSolicitud(solicitudId));
  })
);

router.put(
  '/insumos/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await one('SELECT id FROM insumos_solicitudes WHERE id = ? ', [req.params.id]);
    if (!current) throw httpError(404, 'Solicitud no encontrada');

    const fields = [];
    const params = [];
    const assign = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (body.asignatura !== undefined) assign('asignatura', body.asignatura);
    if (body.procedimiento !== undefined) assign('procedimiento', body.procedimiento);
    if (body.semestre !== undefined) assign('semestre', toInt(body.semestre, 1));
    if (body.estado !== undefined) assign('estado', body.estado);
    if (body.requierePago !== undefined) assign('requiere_pago', bool(body.requierePago));

    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE insumos_solicitudes SET ${fields.join(', ')} WHERE id = ? `, params);
    }

    if (Array.isArray(body.materiales)) {
      await query('DELETE FROM insumos_solicitud_detalle WHERE solicitud_id = ? ', [req.params.id]);
      for (const material of body.materiales) {
        await query(
          `INSERT INTO insumos_solicitud_detalle (solicitud_id, material, cantidad, asignado) VALUES (?, ?, ?, ?)`,
          [
            req.params.id,
            material.material || material.name,
            String(material.cantidad || material.quantity || '1'),
            bool(material.asignado ?? material.assigned),
          ]
        );
      }
    }

    res.json(await getSolicitud(req.params.id));
  })
);

router.patch(
  '/insumos/:id/asignar',
  asyncHandler(async (req, res) => {
    await query('UPDATE insumos_solicitud_detalle SET asignado = 1 WHERE solicitud_id = ? ', [req.params.id]);
    await query("UPDATE insumos_solicitudes SET estado = 'asignado' WHERE id = ? ", [req.params.id]);
    res.json(await getSolicitud(req.params.id));
  })
);

router.delete(
  '/insumos/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM insumos_solicitudes WHERE id = ? ', [req.params.id]);
    res.json({ message: 'Solicitud eliminada', id: Number(req.params.id) });
  })
);

const PAGO_SELECT = `
  SELECT
    pg.id,
    pg.solicitud_id AS solicitudId,
    pg.estudiante_id AS estudianteId,
    TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS estudiante,
    pg.monto,
    pg.comprobante,
    pg.estado,
    DATE_FORMAT(pg.fecha, '%d/%m/%Y') AS fecha,
    s.procedimiento,
    s.asignatura
  FROM pagos pg
  LEFT JOIN usuarios u ON u.id = pg.estudiante_id
  LEFT JOIN insumos_solicitudes s ON s.id = pg.solicitud_id
`;

router.get(
  '/pagos',
  asyncHandler(async (req, res) => {
    const { estudianteId, estado } = req.query;
    const conditions = [];
    const params = [];
    if (estudianteId) {
      conditions.push('pg.estudiante_id = ?');
      params.push(estudianteId);
    }
    if (estado) {
      conditions.push('pg.estado = ?');
      params.push(estado);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    res.json(await query(`${PAGO_SELECT} ${where} ORDER BY pg.id DESC`, params));
  })
);

router.post(
  '/pagos',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['estudianteId', 'monto']);
    const result = await query(
      `INSERT INTO pagos (solicitud_id, estudiante_id, monto, comprobante, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [
        toInt(body.solicitudId),
        toInt(body.estudianteId),
        body.monto,
        body.comprobante || null,
        body.estado || 'pendiente',
      ]
    );
    res.status(201).json(await one(`${PAGO_SELECT} WHERE pg.id = ? `, [result.insertId]));
  })
);

router.put(
  '/pagos/:id',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const fields = [];
    const params = [];
    if (body.estado !== undefined) {
      fields.push('estado = ?');
      params.push(body.estado);
    }
    if (body.monto !== undefined) {
      fields.push('monto = ?');
      params.push(body.monto);
    }
    if (fields.length) {
      params.push(req.params.id);
      await query(`UPDATE pagos SET ${fields.join(', ')} WHERE id = ? `, params);
    }
    res.json(await one(`${PAGO_SELECT} WHERE pg.id = ? `, [req.params.id]));
  })
);

module.exports = router;