"use strict";

const express = require("express");
const { query, one } = require("../db");
const { asyncHandler, httpError, requireFields } = require("../utils");

const router = express.Router();

const PACIENTE_SELECT = `
  SELECT p.*,
         CONCAT_WS(' ', ud.nombre, ud.apellido) AS doctor,
         CONCAT_WS(' ', ue.nombre, ue.apellido) AS estudiante
  FROM pacientes p
  LEFT JOIN usuarios ud ON ud.id = p.doctor_id
  LEFT JOIN usuarios ue ON ue.id = p.estudiante_id
`;

const CITA_SELECT = `
  SELECT c.*,
         p.nombre AS paciente,
         CONCAT_WS(' ', ud.nombre, ud.apellido) AS doctor,
         CONCAT_WS(' ', ue.nombre, ue.apellido) AS estudiante
  FROM citas c
  JOIN pacientes p ON p.id = c.paciente_id
  LEFT JOIN usuarios ud ON ud.id = c.doctor_id
  LEFT JOIN usuarios ue ON ue.id = c.estudiante_id
`;

const TRATAMIENTO_SELECT = `
  SELECT t.*,
         p.nombre AS paciente,
         CONCAT_WS(' ', ud.nombre, ud.apellido) AS doctor,
         CONCAT_WS(' ', ue.nombre, ue.apellido) AS estudiante
  FROM tratamientos t
  JOIN pacientes p ON p.id = t.paciente_id
  LEFT JOIN usuarios ud ON ud.id = t.doctor_id
  LEFT JOIN usuarios ue ON ue.id = t.estudiante_id
`;

const HISTORIAL_SELECT = `
  SELECT h.*,
         p.nombre AS paciente,
         CONCAT_WS(' ', ud.nombre, ud.apellido) AS doctor
  FROM historial_clinico h
  JOIN pacientes p ON p.id = h.paciente_id
  LEFT JOIN usuarios ud ON ud.id = h.doctor_id
`;

router.get(
  "/resumen",
  asyncHandler(async (_req, res) => {
    const resumen = await query(`
      SELECT
        (SELECT COUNT(*) FROM pacientes) AS pacientes,
        (SELECT COUNT(*) FROM citas) AS citas,
        (SELECT COUNT(*) FROM tratamientos) AS tratamientos,
        (SELECT COUNT(*) FROM historial_clinico) AS historial,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'docente') AS docentes,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante') AS estudiantes,
        (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE()) AS citasHoy
    `);
    res.json(resumen[0] || {});
  })
);

router.get(
  "/doctores",
  asyncHandler(async (_req, res) => {
    res.json(
      await query(
        `SELECT id, nombre, apellido, CONCAT_WS(' ', nombre, apellido) AS nombreCompleto,
                email, telefono, especialidad, estado
         FROM usuarios WHERE rol IN ('docente','doctor') ORDER BY nombre ASC`
      )
    );
  })
);

router.get(
  "/estudiantes",
  asyncHandler(async (_req, res) => {
    res.json(
      await query(
        `SELECT id, nombre, apellido, CONCAT_WS(' ', nombre, apellido) AS nombreCompleto,
                email, telefono, semestre, estado
         FROM usuarios WHERE rol = 'estudiante' ORDER BY nombre ASC`
      )
    );
  })
);

router.get(
  "/pacientes",
  asyncHandler(async (req, res) => {
    const filters = [];
    const values = [];
    if (req.query.estado) {
      filters.push("p.estado = ?");
      values.push(req.query.estado);
    }
    if (req.query.buscar) {
      filters.push("(p.nombre LIKE ? OR p.telefono LIKE ? OR p.email LIKE ?)");
      const term = `%${req.query.buscar}%`;
      values.push(term, term, term);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    res.json(await query(`${PACIENTE_SELECT} ${where} ORDER BY p.id DESC`, values));
  })
);

router.get(
  "/pacientes/:id",
  asyncHandler(async (req, res) => {
    const row = await one(`${PACIENTE_SELECT} WHERE p.id =  ? LIMIT 1`, [req.params.id]);
    if (!row) throw httpError(404, "Paciente no encontrado");
    res.json(row);
  })
);

router.post(
  "/pacientes",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["nombre"]);
    const result = await query(
      `INSERT INTO pacientes (nombre, edad, telefono, email, estado, doctor_id, estudiante_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.nombre,
        body.edad || null,
        body.telefono || null,
        body.email || null,
        body.estado || "activo",
        body.doctorId || null,
        body.estudianteId || null,
      ]
    );
    const created = await one(`${PACIENTE_SELECT} WHERE p.id = ? `, [result.insertId]);
    res.status(201).json(created);
  })
);

router.put(
  "/pacientes/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["nombre"]);
    await query(
      `UPDATE pacientes
       SET nombre = ? , edad = ? , telefono = ? , email = ? , estado = ? , doctor_id = ? , estudiante_id =
       ? WHERE id = ? `,
      [
        body.nombre,
        body.edad || null,
        body.telefono || null,
        body.email || null,
        body.estado || "activo",
        body.doctorId || null,
        body.estudianteId || null,
        req.params.id,
      ]
    );
    const updated = await one(`${PACIENTE_SELECT} WHERE p.id = ? `, [req.params.id]);
    if (!updated) throw httpError(404, "Paciente no encontrado");
    res.json(updated);
  })
);

router.delete(
  "/pacientes/:id",
  asyncHandler(async (req, res) => {
    const result = await query("DELETE FROM pacientes WHERE id = ? ", [req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Paciente no encontrado");
    res.status(204).end();
  })
);

router.get(
  "/citas",
  asyncHandler(async (req, res) => {
    const filters = [];
    const values = [];
    if (req.query.fecha) {
      filters.push("c.fecha = ?");
      values.push(req.query.fecha);
    }
    if (req.query.estado) {
      filters.push("c.estado = ?");
      values.push(req.query.estado);
    }
    if (req.query.doctorId) {
      filters.push("c.doctor_id = ?");
      values.push(req.query.doctorId);
    }
    if (req.query.estudianteId) {
      filters.push("c.estudiante_id = ?");
      values.push(req.query.estudianteId);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    res.json(await query(`${CITA_SELECT} ${where} ORDER BY c.fecha DESC, c.hora DESC`, values));
  })
);

router.get(
  "/citas/:id",
  asyncHandler(async (req, res) => {
    const row = await one(`${CITA_SELECT} WHERE c.id =  ? LIMIT 1`, [req.params.id]);
    if (!row) throw httpError(404, "Cita no encontrada");
    res.json(row);
  })
);

router.post(
  "/citas",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["pacienteId", "fecha", "hora", "tratamiento"]);
    const result = await query(
      `INSERT INTO citas (paciente_id, doctor_id, estudiante_id, fecha, hora, tratamiento, estado, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.pacienteId,
        body.doctorId || null,
        body.estudianteId || null,
        body.fecha,
        body.hora,
        body.tratamiento,
        body.estado || "pendiente",
        body.telefono || null,
      ]
    );
    const created = await one(`${CITA_SELECT} WHERE c.id = ? `, [result.insertId]);
    res.status(201).json(created);
  })
);

router.put(
  "/citas/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["pacienteId", "fecha", "hora", "tratamiento"]);
    await query(
      `UPDATE citas
       SET paciente_id = ? , doctor_id = ? , estudiante_id = ? , fecha = ? , hora = ? ,
           tratamiento = ? , estado = ? , telefono =
       ? WHERE id = ? `,
      [
        body.pacienteId,
        body.doctorId || null,
        body.estudianteId || null,
        body.fecha,
        body.hora,
        body.tratamiento,
        body.estado || "pendiente",
        body.telefono || null,
        req.params.id,
      ]
    );
    const updated = await one(`${CITA_SELECT} WHERE c.id = ? `, [req.params.id]);
    if (!updated) throw httpError(404, "Cita no encontrada");
    res.json(updated);
  })
);

router.patch(
  "/citas/:id/estado",
  asyncHandler(async (req, res) => {
    const { estado } = req.body || {};
    if (!estado) throw httpError(400, "El estado es obligatorio");
    const result = await query("UPDATE citas SET estado =  ? WHERE id = ? ", [estado, req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Cita no encontrada");
    res.json(await one(`${CITA_SELECT} WHERE c.id = ? `, [req.params.id]));
  })
);

router.delete(
  "/citas/:id",
  asyncHandler(async (req, res) => {
    const result = await query("DELETE FROM citas WHERE id = ? ", [req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Cita no encontrada");
    res.status(204).end();
  })
);

router.get(
  "/tratamientos",
  asyncHandler(async (req, res) => {
    const filters = [];
    const values = [];
    if (req.query.estado) {
      filters.push("t.estado = ?");
      values.push(req.query.estado);
    }
    if (req.query.pacienteId) {
      filters.push("t.paciente_id = ?");
      values.push(req.query.pacienteId);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    res.json(await query(`${TRATAMIENTO_SELECT} ${where} ORDER BY t.id DESC`, values));
  })
);

router.get(
  "/tratamientos/:id",
  asyncHandler(async (req, res) => {
    const row = await one(`${TRATAMIENTO_SELECT} WHERE t.id =  ? LIMIT 1`, [req.params.id]);
    if (!row) throw httpError(404, "Tratamiento no encontrado");
    res.json(row);
  })
);

router.post(
  "/tratamientos",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["pacienteId", "diagnostico"]);
    const result = await query(
      `INSERT INTO tratamientos
        (paciente_id, doctor_id, estudiante_id, diagnostico, fecha_inicio, fecha_estimada,
         costo, estado, sesiones, sesiones_realizadas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.pacienteId,
        body.doctorId || null,
        body.estudianteId || null,
        body.diagnostico,
        body.fechaInicio || null,
        body.fechaEstimada || null,
        body.costo || 0,
        body.estado || "pendiente",
        body.sesiones || 1,
        body.sesionesRealizadas || 0,
      ]
    );
    const created = await one(`${TRATAMIENTO_SELECT} WHERE t.id = ? `, [result.insertId]);
    res.status(201).json(created);
  })
);

router.put(
  "/tratamientos/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["pacienteId", "diagnostico"]);
    await query(
      `UPDATE tratamientos
       SET paciente_id = ? , doctor_id = ? , estudiante_id = ? , diagnostico = ? , fecha_inicio = ? ,
           fecha_estimada = ? , costo = ? , estado = ? , sesiones = ? , sesiones_realizadas =
       ? WHERE id = ? `,
      [
        body.pacienteId,
        body.doctorId || null,
        body.estudianteId || null,
        body.diagnostico,
        body.fechaInicio || null,
        body.fechaEstimada || null,
        body.costo || 0,
        body.estado || "pendiente",
        body.sesiones || 1,
        body.sesionesRealizadas || 0,
        req.params.id,
      ]
    );
    const updated = await one(`${TRATAMIENTO_SELECT} WHERE t.id = ? `, [req.params.id]);
    if (!updated) throw httpError(404, "Tratamiento no encontrado");
    res.json(updated);
  })
);

router.delete(
  "/tratamientos/:id",
  asyncHandler(async (req, res) => {
    const result = await query("DELETE FROM tratamientos WHERE id = ? ", [req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Tratamiento no encontrado");
    res.status(204).end();
  })
);

router.get(
  "/historial",
  asyncHandler(async (req, res) => {
    const filters = [];
    const values = [];
    if (req.query.pacienteId) {
      filters.push("h.paciente_id = ?");
      values.push(req.query.pacienteId);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    res.json(await query(`${HISTORIAL_SELECT} ${where} ORDER BY h.fecha DESC, h.id DESC`, values));
  })
);

router.post(
  "/historial",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["pacienteId", "fecha", "diagnostico", "tratamiento"]);
    const result = await query(
      `INSERT INTO historial_clinico
        (paciente_id, doctor_id, fecha, diagnostico, tratamiento, notas, procedimientos)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.pacienteId,
        body.doctorId || null,
        body.fecha,
        body.diagnostico,
        body.tratamiento,
        body.notas || null,
        body.procedimientos ? JSON.stringify(body.procedimientos) : null,
      ]
    );
    const created = await one(`${HISTORIAL_SELECT} WHERE h.id = ? `, [result.insertId]);
    res.status(201).json(created);
  })
);

router.get(
  "/actividad",
  asyncHandler(async (_req, res) => {
    res.json(await query("SELECT * FROM actividad ORDER BY fecha DESC LIMIT 50"));
  })
);

router.post(
  "/actividad",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ["usuario", "accion"]);
    const result = await query(
      "INSERT INTO actividad (usuario, accion, icono) VALUES (?, ?, ?)",
      [body.usuario, body.accion, body.icono || "notifications"]
    );
    res.status(201).json(await one("SELECT * FROM actividad WHERE id = ? ", [result.insertId]));
  })
);

module.exports = router;