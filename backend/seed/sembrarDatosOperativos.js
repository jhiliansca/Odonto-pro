"use strict";

require("../loadEnv");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

const CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  charset: "utf8mb4",
  multipleStatements: true,
};

const SCHEMA_PATH = path.join(__dirname, "..", "mysql", "odontopro_schema.sql");
const DIAS_HISTORIA = 75;
const USUARIO_SEED = "Datos operativos";

const PROVEEDORES = [
  ["Dental Sur S.R.L.", "Rosa Alvarez", "77928097", "ventas@dentalsur.bo", "insumos"],
  ["Insumos Odontológicos CBB", "Mario CONDORI", "77928097", "pedidos@cbb-insumos.bo", "insumos"],
  ["FarmaDent Bolivia", "Carla Mendoza", "77928097", "contacto@farmadent.bo", "medicamentos"],
  ["Distribuidora EndoPlus", "Javier Rojas", "77928097", "distribucion@endoplus.bo", "materiales"],
  ["Cirúrgicos del Oriente", "Lidia Camacho", "77928097", "ventas@cirurgicosoriente.bo", "instrumentos"],
  ["Proveedora Andina de Salud", "Néstor Quispe", "77928097", "compras@andinasalud.bo", "general"],
];

const PROVEEDOR_POR_CATEGORIA = {
  insumos: ["Dental Sur S.R.L.", "Insumos Odontológicos CBB", "Proveedora Andina de Salud"],
  materiales: ["Distribuidora EndoPlus", "Proveedora Andina de Salud", "Dental Sur S.R.L."],
  instrumentos: ["Cirúrgicos del Oriente", "Proveedora Andina de Salud"],
  medicamentos: ["FarmaDent Bolivia", "Proveedora Andina de Salud"],
};

const ALERTAS_POR_NOMBRE = new Map([
  ["Tubo de anestesia", { stock: 5, minimo: 30 }],
  ["Clorhexidina", { stock: 8, minimo: 40 }],
  ["Conos de gutapercha de 1ra serie", { stock: 3, minimo: 20 }],
  ["Aguja para carpule", { stock: 18, minimo: 30 }],
  ["Porción de gasas", { stock: 22, minimo: 40 }],
  ["Resina", { stock: 12, minimo: 20 }],
]);

const CADUCIDADES_POR_NOMBRE = new Map([
  ["Tubo de anestesia", { diasAlerta: 20, vencimientos: [-12, 5, 40] }],
  ["Clorhexidina", { diasAlerta: 25, vencimientos: [0, 18, 90] }],
  ["Conos de gutapercha de 1ra serie", { diasAlerta: 15, vencimientos: [-25, 9, 60] }],
  ["Aguja para carpule", { diasAlerta: 30, vencimientos: [3, 25, 120] }],
  ["Porción de gasas", { diasAlerta: 20, vencimientos: [12, 45, 200] }],
  ["Resina", { diasAlerta: 35, vencimientos: [-5, 15, 150] }],
]);

const MOTIVOS = [
  "Consumo en práctica clínica",
  "Procedimiento de laboratorio",
  "Solicitud de insumos",
  "Consumo de estudiantes",
];

function crearAzar(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

function precioDe(id, categoria) {
  const rangos = {
    insumos: [12, 95],
    materiales: [45, 520],
    instrumentos: [140, 980],
    medicamentos: [22, 240],
  };
  const [minimo, maximo] = rangos[categoria] || [20, 200];
  const factor = ((id * 37) % 97) / 97;
  return Math.round((minimo + factor * (maximo - minimo)) * 100) / 100;
}

function stockInicialDe(id, categoria) {
  const base = { insumos: 90, materiales: 70, instrumentos: 32, medicamentos: 60 }[categoria] || 50;
  return base + ((id * 13) % 45);
}

function minimoDe(id, categoria) {
  const base = { insumos: 25, materiales: 20, instrumentos: 10, medicamentos: 18 }[categoria] || 15;
  return base + ((id * 7) % 12);
}

function fechaDe(diasAgo, hora, minuto) {
  const ahora = new Date();
  const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasAgo, hora, minuto, 0);
  const dos = (numero) => String(numero).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(hora)}:${dos(minuto)}:00`;
}

function fechaFutura(dias) {
  return fechaDe(-dias, 8, 0).slice(0, 10);
}

function repartirCantidad(total, fracciones) {
  const valores = fracciones.slice(0, -1).map((fraccion) => Math.round(total * fraccion * 1000) / 1000);
  const usado = valores.reduce((suma, valor) => suma + valor, 0);
  valores.push(Math.round((total - usado) * 1000) / 1000);
  return valores;
}

async function insertarEnLotes(conexion, filas) {
  const tamano = 100;
  for (let inicio = 0; inicio < filas.length; inicio += tamano) {
    const lote = filas.slice(inicio, inicio + tamano);
    const marcadores = lote.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
    const parametros = [];
    for (const fila of lote) {
      parametros.push(fila.materialId, fila.tipo, fila.cantidad, fila.motivo, USUARIO_SEED, fila.fecha);
    }
    await conexion.query(
      `INSERT INTO movimientos_materiales (material_id, tipo, cantidad, motivo, usuario, fecha) VALUES ${marcadores}`,
      parametros
    );
  }
}

async function main() {
  let conexion;
  try {
    conexion = await mysql.createConnection(CONFIG);
    await conexion.query(fs.readFileSync(SCHEMA_PATH, "utf8"));
    console.log("✅ Esquema asegurado");

    await conexion.query("DELETE FROM movimientos_materiales WHERE usuario = ? ", [USUARIO_SEED]);
    await conexion.query("DELETE FROM material_proveedores");
    await conexion.query("DELETE FROM solicitudes_insumos WHERE estudiante LIKE 'Estudiante demo %'");

    for (const proveedor of PROVEEDORES) {
      await conexion.query(
        `INSERT INTO proveedores (nombre, contacto, telefono, email, categoria, estado)
         VALUES (?, ?, ?, ?, ?, 'activo')
         ON DUPLICATE KEY UPDATE
           contacto = VALUES(contacto), telefono = VALUES(telefono),
           email = VALUES(email), categoria = VALUES(categoria), estado = 'activo'`,
        proveedor
      );
    }
    const [filasProveedores] = await conexion.query("SELECT id, nombre FROM proveedores ORDER BY id ASC");
    const proveedoresPorNombre = new Map(filasProveedores.map((fila) => [fila.nombre, fila.id]));

    const [materiales] = await conexion.query(
      "SELECT id, nombre, clave, categoria, unidad, procedimientos FROM vw_materiales_uso ORDER BY id ASC"
    );
    if (!materiales.length) {
      throw new Error("No hay materiales registrados. Ejecuta primero npm run db:seed");
    }

    const movimientos = [];
    const precios = [];

    for (const material of materiales) {
      const id = Number(material.id);
      const alerta = ALERTAS_POR_NOMBRE.get(String(material.nombre));
      const precio = precioDe(id, material.categoria);
      const minimo = alerta ? alerta.minimo : minimoDe(id, material.categoria);
      const inicial = stockInicialDe(id, material.categoria);
      const azar = crearAzar(id * 7919);
      let stock = inicial;

      const proveedoresCategoria = PROVEEDOR_POR_CATEGORIA[material.categoria] || PROVEEDOR_POR_CATEGORIA.insumos;
      const nombreProveedor = proveedoresCategoria[id % proveedoresCategoria.length];
      const proveedorId = proveedoresPorNombre.get(nombreProveedor) || filasProveedores[0].id;
      await conexion.query(
        `INSERT INTO material_proveedores (material_id, proveedor_id, precio_unitario, es_principal)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE precio_unitario = VALUES(precio_unitario), es_principal = 1`,
        [id, proveedorId, precio]
      );

      movimientos.push({
        materialId: id,
        tipo: "ENTRADA",
        cantidad: inicial,
        motivo: "Histórico · Inventario inicial",
        fecha: fechaDe(DIAS_HISTORIA, 8, id % 60),
      });

      for (let diasAgo = DIAS_HISTORIA - 1; diasAgo >= 1; diasAgo -= 1) {
        const faseBaja = Boolean(alerta) && diasAgo <= 12;
        if (!faseBaja && stock <= minimo + 4) {
          const reposicion = minimo * 2 + Math.floor(azar() * 15) - stock;
          if (reposicion > 0) {
            movimientos.push({
              materialId: id,
              tipo: "ENTRADA",
              cantidad: reposicion,
              motivo: "Histórico · Reposición de stock",
              fecha: fechaDe(diasAgo, 9, (id + diasAgo) % 60),
            });
            stock += reposicion;
          }
        }

        const progreso = (DIAS_HISTORIA - diasAgo) / DIAS_HISTORIA;
        const probabilidad = 0.18 + progreso * 0.32;
        if (azar() < probabilidad) {
          const tope = Math.max(2, Math.ceil(minimo / 3)) + Math.floor(progreso * 4);
          const cantidad = Math.min(1 + Math.floor(azar() * tope), stock);
          if (cantidad > 0) {
            movimientos.push({
              materialId: id,
              tipo: "SALIDA",
              cantidad,
              motivo: `Histórico · ${MOTIVOS[Math.floor(azar() * MOTIVOS.length)]}`,
              fecha: fechaDe(diasAgo, 10 + (diasAgo % 8), (id * 3 + diasAgo) % 60),
            });
            stock -= cantidad;
          }
        }
      }

      if (alerta) {
        if (stock > alerta.stock) {
          movimientos.push({
            materialId: id,
            tipo: "SALIDA",
            cantidad: stock - alerta.stock,
            motivo: "Histórico · Ajuste de inventario",
            fecha: fechaDe(1, 16, id % 60),
          });
        } else if (stock < alerta.stock) {
          movimientos.push({
            materialId: id,
            tipo: "ENTRADA",
            cantidad: alerta.stock - stock,
            motivo: "Histórico · Ajuste de inventario",
            fecha: fechaDe(1, 16, id % 60),
          });
        }
        stock = alerta.stock;
      } else if (stock < minimo) {
        const reposicion = minimo - stock + 2;
        movimientos.push({
          materialId: id,
          tipo: "ENTRADA",
          cantidad: reposicion,
          motivo: "Histórico · Reposición de stock",
          fecha: fechaDe(1, 15, id % 60),
        });
        stock += reposicion;
      }

      precios.push([precio, minimo, stock, id]);
    }

    for (const [precio, minimo, stock, id] of precios) {
      await conexion.query("UPDATE materiales SET precio = ? , stock_minimo = ? , stock =  ? WHERE id = ? ", [
        precio,
        minimo,
        stock,
        id,
      ]);
    }

    await insertarEnLotes(conexion, movimientos);

    await conexion.query("DELETE FROM lotes_materiales WHERE codigo_lote LIKE 'LOTE-DEMO-%'");
    const [filasProveedoresMaterial] = await conexion.query(
      "SELECT material_id, proveedor_id FROM material_proveedores WHERE es_principal = 1"
    );
    const proveedorPorMaterial = new Map(
      filasProveedoresMaterial.map((fila) => [Number(fila.material_id), Number(fila.proveedor_id)])
    );
    const stockPorMaterial = new Map(precios.map((fila) => [Number(fila[3]), Number(fila[2])]));
    let lotesInsertados = 0;

    for (let indice = 0; indice < materiales.length; indice += 1) {
      const material = materiales[indice];
      const id = Number(material.id);
      const config = CADUCIDADES_POR_NOMBRE.get(String(material.nombre));
      const seleccionado = config || (indice % 9 === 0 ? { diasAlerta: 30, vencimientos: [10, 75] } : null);
      if (!seleccionado) continue;

      const stock = stockPorMaterial.get(id) ?? Number(material.stock);
      if (!Number.isFinite(stock) || stock <= 0) continue;
      const cantidades = repartirCantidad(stock, config ? [0.3, 0.45, 0.25] : [0.6, 0.4]);
      const letra = String.fromCharCode(65 + (indice % 6));
      const ubicacion = `Almacén ${letra}-${String(1 + (indice % 4)).padStart(2, "0")}`;

      await conexion.query(
        "UPDATE materiales SET requiere_caducidad = 1, dias_alerta_caducidad = ?, ubicacion = ? WHERE id = ?",
        [seleccionado.diasAlerta, ubicacion, id]
      );

      for (let loteIndice = 0; loteIndice < seleccionado.vencimientos.length; loteIndice += 1) {
        const vencimiento = seleccionado.vencimientos[loteIndice];
        const cantidad = cantidades[loteIndice];
        await conexion.query(
          `INSERT INTO lotes_materiales
            (material_id, codigo_lote, fecha_ingreso, fecha_vencimiento, cantidad_inicial,
             cantidad_actual, unidad, proveedor_id, ubicacion, estado, observaciones)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)`,
          [
            id,
            `LOTE-DEMO-${id}-${String(loteIndice + 1).padStart(2, "0")}`,
            fechaFutura(vencimiento + 70),
            fechaFutura(vencimiento),
            cantidad,
            cantidad,
            material.unidad,
            proveedorPorMaterial.get(id) || null,
            ubicacion,
            `Lote demo · ${config ? "control por caducidad" : "rotación normal"}`,
          ]
        );
        lotesInsertados += 1;
      }

      if (config) {
        await conexion.query(
          `INSERT INTO lotes_materiales
            (material_id, codigo_lote, fecha_ingreso, fecha_vencimiento, cantidad_inicial,
             cantidad_actual, unidad, proveedor_id, ubicacion, estado, observaciones)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 'descartado', ?)`,
          [
            id,
            `LOTE-DEMO-${id}-DESC`,
            fechaFutura(40),
            fechaFutura(-30),
            Math.max(1, Math.round(stock * 0.15)),
            material.unidad,
            proveedorPorMaterial.get(id) || null,
            ubicacion,
            "Lote demo · descartado por vencimiento",
          ]
        );
        lotesInsertados += 1;
      }
    }

    const idsPorNombre = new Map(materiales.map((material) => [String(material.nombre), Number(material.id)]));
    const solicitudes = [
      ["Tubo de anestesia", 2, "pendiente"],
      ["Clorhexidina", 5, "pendiente"],
      ["Resina", 3, "pendiente"],
      ["Conos de gutapercha de 1ra serie", 1, "pendiente"],
      ["Hilo de sutura 000 nylon", 2, "aprobado"],
      ["Hipoclorito de sodio", 10, "pendiente"],
      ["Porción de pasta profiláctica", 4, "aprobado"],
      ["Clorhexidina 0.12%", 6, "pendiente"],
    ];
    for (const [nombre, cantidad, estado] of solicitudes) {
      const materialId = idsPorNombre.get(nombre);
      if (!materialId) continue;
      await conexion.query(
        `INSERT INTO solicitudes_insumos (estudiante, material_id, cantidad, cantidad_texto, estado, observaciones, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `Estudiante demo ${nombre}`,
          materialId,
          cantidad,
          `${cantidad} unidad`,
          estado,
          "Registro de demostración con datos del catálogo",
          fechaDe(2 + (materialId % 4), 11, materialId % 60),
        ]
      );
    }

    const [resumen] = await conexion.query(`
      SELECT
        (SELECT COUNT(*) FROM proveedores) AS proveedores,
        (SELECT COUNT(*) FROM material_proveedores) AS relaciones,
        (SELECT COUNT(*) FROM materiales WHERE precio > 0) AS conPrecio,
        (SELECT COUNT(*) FROM materiales WHERE stock_minimo > 0 AND stock < stock_minimo) AS bajoStock,
        (SELECT COUNT(*) FROM movimientos_materiales) AS movimientos,
        (SELECT COUNT(*) FROM lotes_materiales) AS lotes,
        (SELECT COUNT(*) FROM lotes_materiales WHERE estado = 'activo' AND fecha_vencimiento < CURDATE()) AS lotesVencidos,
        (SELECT COALESCE(SUM(stock * precio), 0) FROM materiales) AS valorTotal
    `);
    console.log("📊 Datos operativos cargados:", { ...resumen[0], lotesInsertados });
  } catch (error) {
    console.error("❌ Error al cargar datos operativos:", error.message);
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
  }
}

main();
