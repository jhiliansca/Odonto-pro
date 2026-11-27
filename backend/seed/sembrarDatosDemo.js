"use strict";

require("../loadEnv");
const mysql = require("mysql2/promise");
const { pool } = require("../db");
const asegurarEsquema = require("./asegurarEsquema");
const sembrarUsuarios = require("./sembrarUsuarios");

const CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "OdontoproDB",
  charset: "utf8mb4",
  multipleStatements: true,
};

const PACIENTES = [
  ["Camila Rojas", 34, "75201101", "camila.rojas@example.com", "activo"],
  ["Diego Fernández", 42, "75201102", "diego.fernandez@example.com", "pendiente"],
  ["Valeria Álvarez", 27, "75201103", "valeria.alvarez@example.com", "completado"],
  ["Andrés Vargas", 51, "75201104", "andres.vargas@example.com", "activo"],
  ["Lucía Paredes", 19, "75201105", "lucia.paredes@example.com", "pendiente"],
  ["Mateo Silva", 38, "75201106", "mateo.silva@example.com", "completado"],
  ["Fernanda Cruz", 45, "75201107", "fernanda.cruz@example.com", "activo"],
  ["Sebastián Lora", 29, "75201108", "sebastian.lora@example.com", "activo"],
];

const TRATAMIENTOS = [
  ["Caries profunda en pieza 16", 1250, "activo", 4, 2],
  ["Limpieza y profilaxis", 380, "completado", 1, 1],
  ["Endodoncia unirradicular", 1680, "activo", 3, 1],
  ["Resina compuesta pieza 21", 620, "pendiente", 2, 0],
  ["Exodoncia simple", 890, "completado", 1, 1],
  ["Corona metal cerámica", 2450, "pendiente", 5, 0],
  ["Sellado de fisuras", 290, "activo", 2, 1],
  ["Rebasado de prótesis", 740, "completado", 3, 3],
];

const CURSOS = [
  ["Odontología preventiva", "Fundamentos de prevención y promoción de salud bucal."],
  ["Operatoria dental", "Técnicas de restauración directa e indirecta."],
  ["Endodoncia clínica", "Diagnóstico y tratamiento de patologías pulpares."],
  ["Prostodoncia fija y removible", "Planificación y rehabilitación protésica."],
];

const MODULOS = [
  [["Introducción", "Conceptos base", "Casos clínicos", "Práctica guiada", "Evaluación"]],
  [["Preparación cavidad", "Materiales", "Adhesión", "Restauración", "Evaluación"]],
  [["Diagnóstico", "Instrumentación", "Obturación", "Control radiográfico", "Evaluación"]],
  [["Pruebas funcionales", "Diseño de prótesis", "Toma de impresión", "Ajuste", "Evaluación"]],
];

const INSUMOS = [
  ["OPERATORIA I", "RESINA SIMPLE", 8, 1],
  ["CIRUGÍA BUCAL I", "EXODONCIA SIMPLE", 6, 0],
  ["OPERATORIA II", "INCRUSTACIÓN", 7, 1],
  ["ENDODONCIA", "ENDODONCIA ANTERIOR", 9, 1],
  ["PRÓTESIS FIJA I", "CORONA METAL-CERÁMICA", 8, 0],
  ["PERIODONCIA I", "PROFILAXIS", 7, 0],
];

const CONFIGURACION = [
  ["general.nombre", "Nombre de la clínica", "Razón social del sistema", "Clínica Odontológica Unifranz", "texto", null, "general"],
  ["general.ciudad", "Ciudad", "Ubicación principal", "Cochabamba", "texto", null, "general"],
  ["general.moneda", "Moneda", "Moneda de los montos", "Bs", "texto", null, "general"],
  ["seguridad.sesion", "Duración de sesión (min)", "Minutos de inactividad permitidos", "60", "numero", null, "seguridad"],
  ["seguridad.intentos", "Intentos de acceso permitidos", "Intentos fallidos antes de bloquear", "5", "numero", null, "seguridad"],
  ["seguridad.2fa", "Verificación en dos pasos", "Activar MFA para usuarios", "1", "toggle", null, "seguridad"],
  ["notificaciones.citas", "Recordatorio de citas", "Avisos previos a cada cita", "1", "toggle", null, "notificaciones"],
  ["notificaciones.stock", "Alertas de stock", "Alertas de reposición de inventario", "1", "toggle", null, "notificaciones"],
  ["notificaciones.canal", "Canal preferido", "Medio de notificación por defecto", "correo", "select", ["correo", "sms", "ambos"], "notificaciones"],
  ["sistema.backup", "Copias de seguridad", "Frecuencia de respaldo automático", "diario", "select", ["diario", "semanal", "mensual"], "sistema"],
  ["sistema.version", "Versión del sistema", "Versión actual desplegada", "1.0.0", "texto", null, "sistema"],
  ["sistema.mantenimiento", "Modo mantenimiento", "Bloquea el acceso temporalmente", "0", "toggle", null, "sistema"],
];

const REPORTES = [
  ["general", "administrador", "Resumen mensual de pacientes", "Pacientes registrados y estados durante el mes."],
  ["general", "administrador", "Ocupación de la agenda", "Distribución de citas por estado y profesional."],
  ["financiero", "administrador", "Ingresos por tratamiento", "Montos de tratamientos activos y completados."],
  ["academico", "administrador", "Avance de prácticas", "Prácticas registradas por estado y estudiante."],
  ["operativo", "administrador", "Actividad del sistema", "Acciones recientes registradas por los usuarios."],
  ["general", "administrador", "Indicadores de atención", "Citas, pacientes y tratamientos del periodo."],
  ["consumo", "inventario", "Consumo histórico de insumos", "Salidas registradas en el periodo seleccionado."],
  ["consumo", "inventario", "Proyección de demanda", "Pronóstico de consumo basado en movimientos."],
  ["categorias", "inventario", "Valoración por categoría", "Valor económico del stock por categoría."],
  ["alertas", "inventario", "Alertas de reposición", "Materiales con stock crítico, bajo y por agotar."],
  ["caducidad", "inventario", "Control de caducidad", "Lotes activos, por vencer y vencidos."],
  ["valorado", "inventario", "Movimientos recientes", "Últimas entradas y salidas del almacén."],
];

function dos(numero) {
  return String(numero).padStart(2, "0");
}

function fechaRelativa(dias, hora = "09:00:00") {
  const ahora = new Date();
  const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + dias);
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${hora}`;
}

function soloFecha(dias) {
  return fechaRelativa(dias).slice(0, 10);
}

async function insertarLotes(conexion, tabla, columnas, filas) {
  if (!filas.length) return;
  const marcadores = `(${columnas.map(() => "?").join(", ")})`;
  const sql = `INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES ${marcadores}`;
  for (const fila of filas) {
    try {
      await conexion.query(sql, fila);
    } catch (error) {
      throw new Error(`${tabla}: ${error.message} (fila=${JSON.stringify(fila)})`);
    }
  }
}

async function main() {
  let conexion;
  try {
    await asegurarEsquema();
    await sembrarUsuarios();
    conexion = await mysql.createConnection(CONFIG);

    const tablas = [
      "pagos",
      "insumos_solicitud_detalle",
      "insumos_solicitudes",
      "practicas",
      "historial_clinico",
      "tratamientos",
      "citas",
      "curso_modulos",
      "cursos",
      "pacientes",
      "actividad",
      "transacciones",
      "eventos",
      "chatbot_respuestas",
      "configuracion",
    ];
    for (const tabla of tablas) await conexion.query(`DELETE FROM ${tabla}`);
    await conexion.query("DELETE FROM contactos WHERE mensaje LIKE 'Mensaje demo %'");
    await conexion.query("DELETE FROM reportes WHERE generado_por = 'Datos demo'");

    const [filasUsuarios] = await conexion.query("SELECT id, email, nombre, apellido FROM usuarios");
    const usuarios = new Map(filasUsuarios.map((fila) => [String(fila.email), fila]));
    const admin = usuarios.get("admin@odontopro.local");
    const doctor = usuarios.get("docente@odontopro.local");
    const estudiante = usuarios.get("estudiante@odontopro.local");
    const recepcion = usuarios.get("recepcionista@odontopro.local");
    const cajero = usuarios.get("cajero@odontopro.local");
    const proveedor = usuarios.get("proveedor@odontopro.local");
    if (!admin || !doctor || !estudiante || !recepcion || !cajero || !proveedor) {
      throw new Error("Faltan usuarios demo. Ejecuta primero npm run db:users");
    }

    const [filasProveedores] = await conexion.query("SELECT id FROM proveedores ORDER BY id ASC LIMIT 1");
    if (filasProveedores.length) {
      await conexion.query("UPDATE usuarios SET proveedor_id = ? WHERE id = ?", [filasProveedores[0].id, proveedor.id]);
    }

    const pacientes = PACIENTES.map((fila, indice) => [
      fila[0], fila[1], fila[2], fila[3], fila[4], doctor.id, estudiante.id,
      fechaRelativa(-40 + indice * 4, "10:15:00"),
    ]);
    await insertarLotes(
      conexion,
      "pacientes",
      ["nombre", "edad", "telefono", "email", "estado", "doctor_id", "estudiante_id", "created_at"],
      pacientes
    );
    const [filasPacientes] = await conexion.query("SELECT id, nombre FROM pacientes ORDER BY id ASC");
    const idsPacientes = filasPacientes.map((fila) => fila.id);

    const tratamientos = TRATAMIENTOS.map((fila, indice) => [
      idsPacientes[indice % idsPacientes.length],
      doctor.id,
      estudiante.id,
      fila[0],
      soloFecha(-30 + indice * 3),
      soloFecha(12 + indice * 2),
      fila[1],
      fila[2],
      fila[3],
      fila[4],
      fechaRelativa(-30 + indice * 3, "11:00:00"),
    ]);
    await insertarLotes(
      conexion,
      "tratamientos",
      ["paciente_id", "doctor_id", "estudiante_id", "diagnostico", "fecha_inicio", "fecha_estimada", "costo", "estado", "sesiones", "sesiones_realizadas", "created_at"],
      tratamientos
    );

    const estadosCitas = ["pendiente", "confirmada", "completada", "cancelada"];
    const nombresTratamientos = TRATAMIENTOS.map((fila) => fila[0]);
    const citas = [];
    for (let indice = 0; indice < 16; indice += 1) {
      citas.push([
        idsPacientes[indice % idsPacientes.length],
        doctor.id,
        estudiante.id,
        soloFecha(-8 + indice),
        `${dos(8 + (indice % 9))}:${indice % 2 ? "30" : "00"}:00`,
        nombresTratamientos[indice % nombresTratamientos.length],
        estadosCitas[indice % estadosCitas.length],
        PACIENTES[indice % PACIENTES.length][2],
        fechaRelativa(-20 + indice, "08:00:00"),
      ]);
    }
    await insertarLotes(
      conexion,
      "citas",
      ["paciente_id", "doctor_id", "estudiante_id", "fecha", "hora", "tratamiento", "estado", "telefono", "created_at"],
      citas
    );

    const procedimientos = JSON.stringify([1, 2, 5, 17, 41, 92]);
    const historial = [];
    for (let indice = 0; indice < 12; indice += 1) {
      historial.push([
        idsPacientes[indice % idsPacientes.length],
        doctor.id,
        soloFecha(-35 + indice * 3),
        TRATAMIENTOS[indice % TRATAMIENTOS.length][0],
        `Evolución favorable. Sesión ${(indice % 3) + 1} de ${TRATAMIENTOS[indice % TRATAMIENTOS.length][3]}.`,
        "Sin complicaciones. Se recomienda control y mantenimiento.",
        procedimientos,
        fechaRelativa(-35 + indice * 3, "12:00:00"),
      ]);
    }
    await insertarLotes(
      conexion,
      "historial_clinico",
      ["paciente_id", "doctor_id", "fecha", "diagnostico", "tratamiento", "notas", "procedimientos", "created_at"],
      historial
    );

    const cursosFilas = CURSOS.map((fila, indice) => [
      fila[0], doctor.id, `${doctor.nombre} ${doctor.apellido}`, fila[1],
      soloFecha(-60 + indice * 15), soloFecha(30 + indice * 10),
      [100, 80, 60, 40][indice], indice === 0 ? "completado" : "en_curso",
      fechaRelativa(-60 + indice * 15, "08:00:00"),
    ]);
    await insertarLotes(
      conexion,
      "cursos",
      ["nombre", "instructor_id", "instructor", "descripcion", "fecha_inicio", "fecha_fin", "progreso", "estado", "created_at"],
      cursosFilas
    );
    const [filasCursos] = await conexion.query("SELECT id FROM cursos ORDER BY id ASC");
    const modulos = [];
    for (let cursoIndice = 0; cursoIndice < filasCursos.length; cursoIndice += 1) {
      MODULOS[cursoIndice][0].forEach((nombre, moduloIndice) => {
        modulos.push([
          filasCursos[cursoIndice].id,
          nombre,
          moduloIndice < ([4, 3, 2, 1][cursoIndice] ?? 1) ? 1 : 0,
          moduloIndice + 1,
        ]);
      });
    }
    await insertarLotes(conexion, "curso_modulos", ["curso_id", "nombre", "completado", "orden"], modulos);

    const estadosPracticas = ["pendiente", "completada", "evaluada"];
    const practicas = [];
    for (let indice = 0; indice < 12; indice += 1) {
      const completo = indice % 3 !== 0;
      practicas.push([
        estudiante.id,
        idsPacientes[indice % idsPacientes.length],
        PACIENTES[indice % PACIENTES.length][0],
        `${nombresTratamientos[indice % nombresTratamientos.length]} · Práctica ${indice + 1}`,
        soloFecha(-25 + indice * 2),
        doctor.id,
        `${doctor.nombre} ${doctor.apellido}`,
        estadosPracticas[indice % estadosPracticas.length],
        completo ? 82 + (indice % 18) : null,
        completo ? "Desarrollo correcto del procedimiento." : "Pendiente de evaluación docente.",
        "Registro de demostración con pacientes y procedimientos del catálogo.",
        fechaRelativa(-25 + indice * 2, "14:00:00"),
      ]);
    }
    await insertarLotes(
      conexion,
      "practicas",
      ["estudiante_id", "paciente_id", "paciente", "nombre", "fecha", "supervisor_id", "supervisor", "estado", "calificacion", "comentarios", "detalles", "created_at"],
      practicas
    );

    const [filasMateriales] = await conexion.query("SELECT id, nombre FROM materiales ORDER BY id ASC LIMIT 24");
    const insumosFilas = INSUMOS.map((fila, indice) => [
      estudiante.id, fila[0], fila[1], fila[2], indice % 2 === 0 ? "asignado" : "pendiente",
      indice % 3 === 1 ? 1 : 0, fechaRelativa(-18 + indice * 3, "10:00:00"),
    ]);
    await insertarLotes(
      conexion,
      "insumos_solicitudes",
      ["estudiante_id", "asignatura", "procedimiento", "semestre", "estado", "requiere_pago", "created_at"],
      insumosFilas
    );
    const [filasInsumos] = await conexion.query("SELECT id FROM insumos_solicitudes ORDER BY id ASC");
    const detalles = [];
    for (let indice = 0; indice < filasInsumos.length; indice += 1) {
      for (let materialIndice = 0; materialIndice < 3; materialIndice += 1) {
        const material = filasMateriales[(indice * 3 + materialIndice) % filasMateriales.length];
        detalles.push([filasInsumos[indice].id, material.nombre, `${2 + materialIndice} unidad`, indice % 2 === 0 ? 1 : 0]);
      }
    }
    await insertarLotes(
      conexion,
      "insumos_solicitud_detalle",
      ["solicitud_id", "material", "cantidad", "asignado"],
      detalles
    );

    const estadosPago = ["verificado", "pendiente", "rechazado"];
    const pagos = filasInsumos.slice(0, 6).map((fila, indice) => [
      fila.id,
      estudiante.id,
      150 + indice * 125,
      `COMP-2026-${dos(indice + 1)}`,
      estadosPago[indice % estadosPago.length],
      fechaRelativa(-12 + indice * 2, "16:00:00"),
    ]);
    await insertarLotes(
      conexion,
      "pagos",
      ["solicitud_id", "estudiante_id", "monto", "comprobante", "estado", "fecha"],
      pagos
    );

    const actividades = [
      [admin, "Inició sesión en el panel administrativo", "login"],
      [doctor, "Registró una nueva cita clínica", "event"],
      [recepcion, "Actualizó la ficha de un paciente", "person"],
      [estudiante, "Registró una práctica de operatoria", "school"],
      [proveedor, "Actualizó el catálogo de insumos", "local_shipping"],
      [cajero, "Verificó un comprobante de pago", "payments"],
      [admin, "Generó un reporte de indicadores", "assessment"],
      [doctor, "Completó un historial clínico", "assignment"],
      [recepcion, "Confirmó una cita pendiente", "event_available"],
      [estudiante, "Solicitó insumos para práctica", "inventory_2"],
    ].map(([usuario, accion, icono], indice) => [
      `${usuario.nombre} ${usuario.apellido}`, accion, icono, fechaRelativa(-9 + indice, "09:30:00"),
    ]);
    await insertarLotes(conexion, "actividad", ["usuario", "accion", "icono", "fecha"], actividades);

    const transacciones = [
      ["Camila Rojas", "Limpieza y profilaxis", 380, "completed"],
      ["Diego Fernández", "Resina compuesta", 620, "pendiente"],
      ["Valeria Álvarez", "Endodoncia", 1680, "completed"],
      ["Andrés Vargas", "Exodoncia simple", 890, "completed"],
      ["Lucía Paredes", "Sellado de fisuras", 290, "pendiente"],
      ["Mateo Silva", "Corona metal cerámica", 2450, "completed"],
      ["Fernanda Cruz", "Rebasado de prótesis", 740, "completed"],
      ["Sebastián Lora", "Operatoria dental", 560, "pendiente"],
    ].map((fila, indice) => [fila[0], fila[1], fila[2], fila[3], fechaRelativa(-7 + indice, "15:20:00")]);
    await insertarLotes(conexion, "transacciones", ["cliente", "servicio", "monto", "estado", "fecha"], transacciones);

    await insertarLotes(
      conexion,
      "eventos",
      ["titulo", "fecha_evento", "ubicacion", "created_at"],
      [
        ["Jornada de prevención bucal", fechaRelativa(4, "08:00:00"), "Auditorio principal", fechaRelativa(-20)],
        ["Seminario de endodoncia", fechaRelativa(11, "09:00:00"), "Sala de clínica", fechaRelativa(-18)],
        ["Evaluación de prácticas", fechaRelativa(18, "14:00:00"), "Laboratorio dental", fechaRelativa(-15)],
        ["Feria de salud odontológica", fechaRelativa(25, "10:00:00"), "Plaza universitaria", fechaRelativa(-12)],
      ]
    );

    await insertarLotes(
      conexion,
      "chatbot_respuestas",
      ["palabras_clave", "respuesta", "prioridad", "activo"],
      [
        ["cita horario", "El horario de atención es de lunes a viernes de 08:00 a 18:00.", 10, 1],
        ["pagos comprobante", "Los comprobantes se registran en el módulo de Pagos del panel correspondiente.", 9, 1],
        ["inventario stock", "Las alertas de stock se actualizan cada 15 segundos en el módulo de inventario.", 8, 1],
        ["practicas insumos", "Las solicitudes de insumos se gestionan desde el módulo de Prácticas.", 7, 1],
        ["pacientes registro", "Los pacientes se registran desde el módulo de Recepción o Pacientes.", 6, 1],
        ["reportes descargar", "Los reportes pueden generarse desde el módulo de Reportes.", 5, 1],
      ]
    );

    await insertarLotes(
      conexion,
      "configuracion",
      ["id", "nombre", "descripcion", "valor", "tipo", "opciones", "categoria"],
      CONFIGURACION.map((fila) => [
        fila[0], fila[1], fila[2], fila[3], fila[4],
        fila[5] ? JSON.stringify(fila[5]) : null, fila[6],
      ])
    );

    const [filasResumenInventario] = await conexion.query(`
      SELECT
        (SELECT COUNT(*) FROM materiales) AS materiales,
        (SELECT COUNT(*) FROM movimientos_materiales) AS movimientos,
        (SELECT COALESCE(SUM(cantidad), 0) FROM movimientos_materiales
          WHERE tipo = 'SALIDA' AND fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)) AS salidas90,
        (SELECT COUNT(*) FROM lotes_materiales) AS lotes,
        (SELECT COUNT(*) FROM lotes_materiales
          WHERE estado = 'activo' AND fecha_vencimiento < CURDATE()) AS vencidos,
        (SELECT COUNT(*) FROM lotes_materiales
          WHERE estado = 'activo' AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS porVencer,
        (SELECT COALESCE(SUM(stock * precio), 0) FROM materiales) AS valorTotal
    `);
    const resumenInventario = filasResumenInventario[0];
    const [materialesReporte] = await conexion.query(
      "SELECT nombre, categoria, stock, precio FROM materiales ORDER BY stock * precio DESC LIMIT 8"
    );

    await insertarLotes(
      conexion,
      "reportes",
      ["tipo", "modulo", "titulo", "descripcion", "parametros", "datos", "generado_por", "generado_por_id", "formato", "created_at"],
      REPORTES.map((fila, indice) => {
        const parametros = { periodo: indice < 6 ? "último mes" : "últimos 60 días", tipo: fila[0] };
        const datos = fila[1] === "inventario"
          ? {
              tipo: fila[0],
              columnas: ["Indicador", "Valor"],
              filas: [
                ["Materiales registrados", resumenInventario.materiales],
                ["Movimientos registrados", resumenInventario.movimientos],
                ["Salidas en 90 días", resumenInventario.salidas90],
                ["Lotes registrados", resumenInventario.lotes],
                ["Lotes vencidos", resumenInventario.vencidos],
                ["Lotes por vencer", resumenInventario.porVencer],
                ["Valor total en almacén", Number(resumenInventario.valorTotal)],
                ...materialesReporte.map((material) => [material.nombre, Number(material.stock)]),
              ],
              parametros,
              generadoEn: fechaRelativa(-10 + indice, "10:00:00"),
              resumen: [
                { label: "Materiales", value: resumenInventario.materiales },
                { label: "Movimientos", value: resumenInventario.movimientos },
                { label: "Salidas 90d", value: resumenInventario.salidas90 },
                { label: "Valor almacén", value: `Bs ${Number(resumenInventario.valorTotal).toFixed(2)}` },
              ],
              notas: "Datos reales de inventario registrados en Clínica Unifranz al momento de la generación.",
            }
          : { registros: 20 + indice * 3, estado: "disponible" };
        return [
          fila[0], fila[1], fila[2], fila[3],
          JSON.stringify(parametros),
          JSON.stringify(datos),
          "Datos demo", admin.id, "PDF", fechaRelativa(-10 + indice, "10:00:00"),
        ];
      })
    );

    await insertarLotes(
      conexion,
      "contactos",
      ["nombre", "email", "pais", "telefono", "mensaje", "fecha"],
      [
        ["Marcelo Quispe", "marcelo@example.com", "Bolivia", "71234567", "Mensaje demo: consulta sobre horarios de atención."],
        ["Roxana Mendoza", "roxana@example.com", "Bolivia", "71234568", "Mensaje demo: solicitud de información sobre prácticas."],
        ["Jhonny Vargas", "jhonny@example.com", "Bolivia", "71234569", "Mensaje demo: consulta sobre registro de pacientes."],
      ].map((fila) => [...fila, fechaRelativa(-6, "17:00:00")])
    );

    const [resumen] = await conexion.query(`
      SELECT
        (SELECT COUNT(*) FROM pacientes) AS pacientes,
        (SELECT COUNT(*) FROM citas) AS citas,
        (SELECT COUNT(*) FROM tratamientos) AS tratamientos,
        (SELECT COUNT(*) FROM historial_clinico) AS historial,
        (SELECT COUNT(*) FROM cursos) AS cursos,
        (SELECT COUNT(*) FROM practicas) AS practicas,
        (SELECT COUNT(*) FROM pagos) AS pagos,
        (SELECT COUNT(*) FROM transacciones) AS transacciones,
        (SELECT COUNT(*) FROM reportes) AS reportes,
        (SELECT COUNT(*) FROM actividad) AS actividad,
        (SELECT COUNT(*) FROM configuracion) AS configuracion
    `);
    console.log("📊 Datos demo cargados:", resumen[0]);
  } catch (error) {
    console.error("❌ Error al cargar datos demo:", error.message);
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
    try {
      await pool.end();
    } catch {
      process.exitCode = process.exitCode || 0;
    }
  }
}

main();
