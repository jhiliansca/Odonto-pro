"use strict";

const { query, pool } = require("../db");
const { hashPassword } = require("../utils");
const asegurarEsquema = require("./asegurarEsquema");

const USUARIOS = [
  {
    nombre: "Ana",
    apellido: "Administradora",
    email: "admin@odontopro.local",
    password: "Admin123!",
    rol: "administrador",
    telefono: "77928097",
    ci: "1000001",
    direccion: "Av. Ballivián 123, La Paz",
    fecha_nacimiento: "1988-04-12",
    genero: "femenino",
    titulo_academico: "Magíster en Gestión de Salud",
    departamento: "Dirección General",
    horario_atencion: "Lun a Vie · 08:00 - 17:00",
    biografia: "Responsable de la gestión académica y operativa de la clínica odontológica.",
    observaciones: "Perfil completo para demostración del panel administrativo.",
  },
  {
    nombre: "Carlos",
    apellido: "Docente",
    email: "docente@odontopro.local",
    password: "Docente123!",
    rol: "docente",
    telefono: "77928097",
    ci: "1000002",
    direccion: "Calle México 45, La Paz",
    fecha_nacimiento: "1982-09-03",
    genero: "masculino",
    especialidad: "Odontología general",
    titulo_academico: "Especialista en Operatoria Dental",
    departamento: "Clínica Odontológica",
    horario_atencion: "Lun a Vie · 09:00 - 18:00",
    biografia: "Docente clínico encargado de supervisar prácticas y tratamientos de estudiantes.",
    observaciones: "Perfil completo para demostración del panel docente.",
  },
  {
    nombre: "Elena",
    apellido: "Estudiante",
    email: "estudiante@odontopro.local",
    password: "Estudiante123!",
    rol: "estudiante",
    telefono: "77928097",
    ci: "1000003",
    direccion: "Av. Universitaria 12, Cochabamba",
    fecha_nacimiento: "2001-02-18",
    genero: "femenino",
    semestre: "8",
    tipo_semestre: "Regular",
    carrera: "Odontología",
    grupo: "A",
    turno: "Mañana",
    observaciones: "Perfil completo para demostración del panel estudiantil.",
  },
  {
    nombre: "Lucía",
    apellido: "Recepción",
    email: "recepcionista@odontopro.local",
    password: "Recepcion123!",
    rol: "recepcionista",
    telefono: "77928097",
    ci: "1000004",
    direccion: "Calle Sucre 78, La Paz",
    fecha_nacimiento: "1994-06-25",
    genero: "femenino",
    departamento: "Atención al paciente",
    horario_atencion: "Lun a Vie · 08:00 - 16:00",
    observaciones: "Perfil completo para demostración del panel de recepción.",
  },
  {
    nombre: "María",
    apellido: "Almacén",
    email: "inventario@odontopro.local",
    password: "Inventario123!",
    rol: "inventario",
    telefono: "77928097",
    ci: "1000005",
    direccion: "Av. Comercio 301, La Paz",
    fecha_nacimiento: "1990-11-09",
    genero: "femenino",
    departamento: "Logística y almacén",
    horario_atencion: "Lun a Vie · 08:30 - 17:30",
    observaciones: "Perfil completo para demostración del panel de inventario.",
  },
  {
    nombre: "Ricardo",
    apellido: "Cajero",
    email: "cajero@odontopro.local",
    password: "Cajero123!",
    rol: "cajero",
    telefono: "77928100",
    ci: "1000006",
    direccion: "Av. Arce 210, La Paz",
    fecha_nacimiento: "1992-03-14",
    genero: "masculino",
    departamento: "Tesorería",
    horario_atencion: "Lun a Vie · 09:00 - 18:00",
    observaciones: "Perfil completo para demostración del panel de caja.",
  },
  {
    nombre: "Dental Sur",
    apellido: "Proveedor",
    email: "proveedor@odontopro.local",
    password: "Proveedor123!",
    rol: "proveedor",
    telefono: "77928101",
    ci: "1000007",
    direccion: "Av. Banzer 640, Santa Cruz",
    fecha_nacimiento: "1986-07-21",
    genero: "otro",
    empresa: "Dental Sur S.R.L.",
    departamento: "Ventas institucionales",
    horario_atencion: "Lun a Vie · 08:00 - 17:00",
    observaciones: "Perfil completo para demostración del panel de proveedor.",
  },
];

async function sembrarUsuarios() {
  await asegurarEsquema();

  for (const usuario of USUARIOS) {
    await query(
      `INSERT INTO usuarios
        (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, fecha_nacimiento, genero, especialidad, titulo_academico, departamento, horario_atencion, biografia, semestre, tipo_semestre, carrera, grupo, turno, empresa, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)
       ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre), apellido = VALUES(apellido), password_hash = VALUES(password_hash), rol = VALUES(rol),
        telefono = VALUES(telefono), ci = VALUES(ci), direccion = VALUES(direccion), fecha_nacimiento = VALUES(fecha_nacimiento), genero = VALUES(genero),
        especialidad = VALUES(especialidad), titulo_academico = VALUES(titulo_academico), departamento = VALUES(departamento), horario_atencion = VALUES(horario_atencion),
        biografia = VALUES(biografia), semestre = VALUES(semestre), tipo_semestre = VALUES(tipo_semestre), carrera = VALUES(carrera), grupo = VALUES(grupo), turno = VALUES(turno),
        empresa = VALUES(empresa), estado = 'activo', observaciones = VALUES(observaciones)`,
      [
        usuario.nombre, usuario.apellido, usuario.email, hashPassword(usuario.password), usuario.rol,
        usuario.telefono || null, usuario.ci || null, usuario.direccion || null, usuario.fecha_nacimiento || null, usuario.genero || null,
        usuario.especialidad || null, usuario.titulo_academico || null, usuario.departamento || null, usuario.horario_atencion || null,
        usuario.biografia || null, usuario.semestre || null, usuario.tipo_semestre || null, usuario.carrera || null, usuario.grupo || null, usuario.turno || null,
        usuario.empresa || null, usuario.observaciones || null,
      ]
    );
  }

  const resumen = await query(`
    SELECT
      COUNT(*) AS total,
      SUM(rol = 'administrador') AS administradores,
      SUM(rol = 'docente') AS docentes,
      SUM(rol = 'estudiante') AS estudiantes,
      SUM(rol = 'recepcionista') AS recepcionistas,
      SUM(rol = 'inventario') AS inventario,
      SUM(rol = 'cajero') AS cajeros,
      SUM(rol = 'proveedor') AS proveedores
    FROM usuarios
  `);

  return resumen[0];
}

if (require.main === module) {
  sembrarUsuarios()
    .then(async (resumen) => {
      console.log("✅ Usuarios por rol registrados:", resumen);
      console.log("🔐 Credenciales iniciales documentadas en README.md");
      await pool.end();
    })
    .catch(async (error) => {
      console.error("❌ Error al registrar usuarios:", error.message);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = sembrarUsuarios;
module.exports.USUARIOS = USUARIOS;
