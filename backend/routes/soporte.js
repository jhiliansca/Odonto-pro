"use strict";

const express = require("express");
const { query } = require("../db");
const { asyncHandler, httpError } = require("../utils");

const router = express.Router();

router.get(
  "/configuracion",
  asyncHandler(async (_req, res) => {
    const filas = await query(
      `SELECT id, nombre, descripcion, valor, tipo, opciones, categoria,
              DATE_FORMAT(updated_at,'%d/%m/%Y %H:%i') AS actualizado
       FROM configuracion
       ORDER BY FIELD(categoria, 'general', 'seguridad', 'notificaciones', 'sistema'), id ASC`
    );
    res.json(filas);
  })
);

router.put(
  "/configuracion/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "");
    const valor = req.body && req.body.valor !== undefined ? String(req.body.valor) : null;
    if (!id || valor === null) throw httpError(400, "id y valor son obligatorios");
    await query("UPDATE configuracion SET valor = ? WHERE id = ?", [valor, id]);
    const fila = await query(
      `SELECT id, nombre, descripcion, valor, tipo, opciones, categoria,
              DATE_FORMAT(updated_at,'%d/%m/%Y %H:%i') AS actualizado
       FROM configuracion WHERE id = ?`,
      [id]
    );
    if (!fila.length) throw httpError(404, "Configuración no encontrada");
    res.json(fila[0]);
  })
);

router.get(
  "/transacciones",
  asyncHandler(async (req, res) => {
    const limite = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filas = await query(
      `SELECT id, cliente, servicio, CAST(monto AS DECIMAL(10,2)) AS monto, estado,
              DATE_FORMAT(fecha,'%d/%m/%Y %H:%i') AS fecha, fecha AS fechaISO
       FROM transacciones ORDER BY fecha DESC, id DESC LIMIT ${limite}`
    );
    res.json(filas);
  })
);

module.exports = router;
