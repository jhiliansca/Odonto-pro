require("./loadEnv"); // Carga backend/.env antes de las rutas
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const { query, testConnection } = require("./db");
const asegurarEsquema = require("./seed/asegurarEsquema");

const app = express();
const port = Number(process.env.PORT || 3001);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Endpoint: guardar contacto
app.post("/api/registro", (req, res) => {
  const { nombre, email, pais, telefono, mensaje } = req.body;
  console.log("📩 Datos recibidos en /api/registro:", req.body);

  if (!nombre || !email || !pais || !telefono) {
    return res.status(400).json({ error: "Nombre, email, país y teléfono son obligatorios." });
  }

  query("INSERT INTO contactos (nombre, email, pais, telefono, mensaje) VALUES (?, ?, ?, ?, ?)", [
    nombre, email, pais, telefono, mensaje,
  ])
    .then((results) => {
      res.status(201).json({
        message: "Datos guardados correctamente.",
        id: results.insertId,
      });
    })
    .catch((error) => {
      console.error("❌ Error al insertar datos en la tabla:", error);
      res.status(500).json({ error: "Error al guardar los datos." });
    });
});

// Chatbot con Ollama sin streaming (compatible con React)
app.post("/ollama-prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Se requiere un prompt" });
    }

    // Configuración del sistema para el modelo
    const systemPrompt = `Eres un asistente virtual de la Clínica Odontológica Unifranz.
Responde preguntas sobre procedimientos odontológicos, asignaturas, semestres e insumos de práctica.
Si te preguntan por precios específicos, indica que los precios son referenciales y pueden variar.
Siempre sé amable y profesional.`;

    // Combinar el system prompt con la pregunta del usuario
    const fullPrompt = `${systemPrompt}\n\nUsuario: ${prompt}\n\nAsistente:`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3",
        prompt: fullPrompt,
        stream: false // Cambiado a false para una respuesta única
      }
    );

    res.json({ response: response.data.response });
  } catch (error) {
    console.error("Error al procesar la solicitud de Ollama:", error);
    res.status(500).json({
      error: "Error al procesar la solicitud",
      details: error.message
    });
  }
});

// Compatibilidad: los insumos reales se exponen en /api/catalogo/materiales
app.get("/api/productos", async (_req, res, next) => {
  try {
    res.status(200).json(await query("SELECT * FROM materiales ORDER BY nombre ASC"));
  } catch (error) {
    next(error);
  }
});

// Endpoint base
app.get("/", (req, res) => {
  res.send("¡Hola desde mi backend con Express!");
});

app.get("/servicio", (req, res) => {
  res.send("¡Hola desde mi backend con Express! Servicio");
});

const analiticaRouter = require("./routes/analitica");
const catalogoRouter = require("./routes/catalogo");
const authRouter = require("./routes/auth");
const clinicaRouter = require("./routes/clinica");
const academicoRouter = require("./routes/academico");
const reportesRouter = require("./routes/reportes");
const inventarioRouter = require("./routes/inventario");
const usuariosRouter = require("./routes/usuarios");
const soporteRouter = require("./routes/soporte");

app.use("/api", catalogoRouter);
app.use("/api/auth", authRouter);
app.use("/api/clinica", clinicaRouter);
app.use("/api/academico", academicoRouter);
app.use("/api", reportesRouter);
app.use("/api", inventarioRouter);
app.use("/api", soporteRouter);
app.use("/api", usuariosRouter);
app.use("/api", analiticaRouter);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Manejo centralizado de errores de la API
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("❌ Error en la API:", err);
  }
  res.status(status).json({ error: err.message || "Error interno del servidor" });
});

asegurarEsquema()
  .then(() => testConnection())
  .then(() => {
    console.log("✅ OdontoproDB conectada y esquema asegurado");
    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ No se pudo iniciar el backend:", err.message);
    process.exit(1);
  });
