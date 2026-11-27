// Cliente del catálogo real de insumos. Toda la información se lee desde MySQL
// a través de /api/catalogo; nunca se usan arreglos locales de demostración.

const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001'
).replace(/\/api$/, '');

export interface ResumenCatalogo {
  procedimientos: number;
  materiales: number;
  asignaturas: number;
  semestres: number;
  relaciones: number;
  revisados: number;
  stockBajo: number;
  valorTotal: number;
  lotesActivos: number;
  lotesVencidos: number;
  lotesPorVencer: number;
  materialesConCaducidad: number;
  valorCaducidadRiesgo: number;
  actualizado: string | null;
  porSemestre: { semestre: string; procedimientos: number }[];
  servidor: string;
}

export interface Semestre {
  id: number;
  numero: number;
  etiqueta: string;
}

export interface Asignatura {
  id: number;
  asignatura: string;
  semestre: string;
  semestreNumero: number;
}

export interface Procedimiento {
  id: number;
  item: number;
  procedimiento: string;
  asignatura: string;
  semestre: string;
  semestreNumero: number;
  revisado: number;
  totalMateriales: number;
  actualizado: string;
}

export interface MaterialProcedimiento {
  id: number;
  item: number;
  procedimiento: string;
  asignatura: string;
  semestre: string;
  cantidadTexto: string;
  nombreOriginal: string;
}

export interface MaterialDetalle extends Omit<Material, 'procedimientos'> { procedimientos: MaterialProcedimiento[];
}

export interface ProcedimientoDetalle extends Procedimiento {
  materiales: {
    relacionId: number;
    materialId: number;
    nombreOriginal: string;
    cantidadTexto: string;
    cantidad: number;
    unidad: string;
    orden: number;
    material: string;
    categoria: string;
    stock: number;
    activo: number;
  }[];
}

export type EstadoStock = 'agotado' | 'bajo' | 'normal';
export type SeveridadAlerta = 'critico' | 'bajo' | 'por_agotar';

export interface Material {
  id: number;
  nombre: string;
  clave: string;
  categoria: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  activo: number;
  requiereCaducidad: number;
  diasAlertaCaducidad: number;
  ubicacion: string | null;
  procedimientos: number;
  usos: number;
  cantidadRequerida: number;
  actualizado: string;
  estadoStock: EstadoStock;
}

export interface MovimientoMaterial {
  id: number;
  materialId: number;
  material: string;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo: string;
  usuario: string;
  fecha: string;
}

export interface MovimientoResumen {
  id: number;
  materialId: number;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo: string;
  usuario: string;
  fecha: string;
}

export interface AlertaStock {
  id: number;
  materialId: number;
  producto: string;
  categoria: string;
  clave: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  faltante: number;
  porcentajeMinimo: number;
  severidad: SeveridadAlerta;
  proveedor: string | null;
  proveedorTelefono: string | null;
  consumo30: number;
  entradas30: number;
  promedioDiario: number;
  diasCobertura: number | null;
  ultimoMovimiento: MovimientoResumen | null;
  lotesProximos: LoteCaducidad[];
  lotesVencidos: LoteCaducidad[];
  totalLotesAfectados: number;
  diasAlertaCaducidad: number;
  reposicionSugerida: number;
  accion: string;
  prioridad: number;
  fechaDeteccion: string;
}

export interface AlertasResponse {
  generadoEn: string;
  resumen: { total: number; critico: number; bajo: number; porAgotar: number; conCaducidad: number };
  alertas: AlertaStock[];
}

export interface LoteCaducidad {
  id: number;
  materialId: number;
  material: string;
  clave: string;
  categoria: string;
  unidad: string;
  codigoLote: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  cantidadInicial: number;
  cantidadActual: number;
  precio: number;
  valor: number;
  proveedorId: number | null;
  proveedor: string | null;
  ubicacion: string | null;
  estado: 'activo' | 'agotado' | 'descartado';
  observaciones: string | null;
  requiereCaducidad: number;
  diasAlertaCaducidad: number;
  diasRestantes: number;
  estadoCaducidad: 'cerrado' | 'vencido' | 'hoy' | 'proximo' | 'normal';
  creado: string;
  actualizado: string;
}

export type EstadoCaducidadFiltro =
  | 'todos'
  | 'activo'
  | 'vencido'
  | 'hoy'
  | 'proximo'
  | 'critico'
  | 'normal'
  | 'cerrado'
  | 'descartado';

export interface CaducidadesResponse {
  generadoEn: string;
  resumen: {
    lotesActivos: number;
    vencidos: number;
    porVencer: number;
    descartados: number;
    valorActivo: number;
    valorEnRiesgo: number;
  };
  lotes: LoteCaducidad[];
}

export interface Solicitud {
  id: number;
  estudiante: string;
  materialId: number;
  material: string;
  procedimientoId: number | null;
  procedimiento: string | null;
  cantidad: number;
  cantidadTexto: string | null;
  estado: 'pendiente' | 'aprobado' | 'entregado' | 'rechazado';
  fecha: string;
}

export type EstadoSolicitud = Solicitud['estado'];

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  categoria: string | null;
  estado: 'activo' | 'inactivo';
  materiales: number;
  valorTotal: number;
}

export interface ProveedorMaterial {
  id: number;
  nombre: string;
  clave: string;
  categoria: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  precioProveedor: number;
  stockBajo: number;
}

export interface ProveedorDetalle extends Omit<Proveedor, 'materiales' | 'valorTotal'> { materiales: ProveedorMaterial[];
}

export interface PuntoHistorico {
  dia: string;
  cantidad: number;
}

export interface PuntoPronostico {
  dia: string;
  valor: number;
  inferior: number;
  superior: number;
}

export interface PrediccionMaterial {
  id: number;
  material: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  consumido: number;
  promedioDiario: number;
  proyectado: number;
  tendencia: number;
  r2: number;
  coberturaMeses: number;
  caducidadUnidades: number;
  caducidadLotes: number;
  stockDisponible: number;
  riesgo: 'critico' | 'alto' | 'normal';
}

export interface CaducidadesPrediccion {
  horizonte: number;
  totalUnidades: number;
  valorEnRiesgo: number;
  totalLotes: number;
  lotes: LoteCaducidad[];
}

export interface Prediccion {
  generadoEn: string;
  sinDatos: boolean;
  diasHistorial: number;
  horizonte: number;
  serie: PuntoHistorico[];
  pronostico: PuntoPronostico[];
  modelo: { pendiente: number; intercepto: number; r2: number };
  resumen: {
    consumoTotal: number;
    promedioDiario: number;
    tendencia: number;
    r2: number;
    proyectadoTotal: number;
    valorProyectado: number;
  };
  caducidades: CaducidadesPrediccion;
  materiales: PrediccionMaterial[];
}

async function request<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
  });
  if (!respuesta.ok) {
    let mensaje = `Error HTTP ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      mensaje = cuerpo.error || mensaje;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new Error(mensaje);
  }
  return respuesta.json() as Promise<T>;
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const buscador = new URLSearchParams();
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '' && valor !== null) {
      buscador.set(clave, String(valor));
    }
  });
  const texto = buscador.toString();
  return texto ? `?${texto}` : '';
}

export const catalogoApi = {
  resumen: () => request<ResumenCatalogo>('/api/catalogo/resumen'),
  semestres: () => request<Semestre[]>('/api/catalogo/semestres'),
  asignaturas: (semestre: number) =>
    request<Asignatura[]>(`/api/catalogo/asignaturas${query({ semestre })}`),
  procedimientos: (filtros: Partial<{ semestre: number; asignatura: string; buscar: string; revisado: boolean }> = {}) =>
    request<Procedimiento[]>(`/api/catalogo/procedimientos${query(filtros as Record<string, string | number | boolean | undefined>)}`),
  procedimiento: (id: number) => request<ProcedimientoDetalle>(`/api/catalogo/procedimientos/${id}`),
  materiales: (filtros: Partial<{ categoria: string; buscar: string; semestre: number; procedimiento: number; stockBajo: boolean }> = {}) =>
    request<Material[]>(`/api/catalogo/materiales${query(filtros as Record<string, string | number | boolean | undefined>)}`),
  material: (id: number) => request<MaterialDetalle>(`/api/catalogo/materiales/${id}`),
  alertas: () => request<AlertasResponse>('/api/catalogo/alertas'),
  caducidades: (filtros: Partial<{
    estado: EstadoCaducidadFiltro;
    materialId: number;
    dias: number;
    buscar: string;
    incluirCerrados: boolean;
  }> = {}) => request<CaducidadesResponse>(`/api/catalogo/caducidades${query(filtros as Record<string, string | number | boolean | undefined>)}`),
  movimientos: (filtros: Partial<{ materialId: number; limit: number }> = {}) =>
    request<MovimientoMaterial[]>(`/api/catalogo/movimientos${query(filtros)}`),
  solicitudes: (estado?: EstadoSolicitud) =>
    request<Solicitud[]>(`/api/catalogo/solicitudes${query({ estado })}`),

  registrarMovimiento: (datos: { materialId: number; tipo: 'ENTRADA' | 'SALIDA'; cantidad: number; motivo?: string; usuario?: string }) =>
    request<{ material: Material }>('/api/catalogo/movimientos', { method: 'POST',
      body: JSON.stringify(datos),
    }),

  actualizarMaterial: (id: number, datos: Partial<Pick<Material, 'nombre' | 'categoria' | 'unidad' | 'stock' | 'stockMinimo' | 'precio' | 'activo' | 'requiereCaducidad' | 'diasAlertaCaducidad' | 'ubicacion'>>) =>
    request<Material>(`/api/catalogo/materiales/${id}`, { method: 'PUT',
      body: JSON.stringify(datos),
    }),

  crearCaducidad: (datos: {
    materialId: number;
    codigoLote: string;
    fechaIngreso?: string;
    fechaVencimiento: string;
    cantidad: number;
    proveedorId?: number | null;
    ubicacion?: string;
    observaciones?: string;
    registrarEntrada?: boolean;
    usuario?: string;
  }) => request<LoteCaducidad>('/api/catalogo/caducidades', {
    method: 'POST',
    body: JSON.stringify(datos),
  }),

  actualizarCaducidad: (id: number, datos: {
    fechaVencimiento?: string;
    cantidadActual?: number;
    proveedorId?: number | null;
    ubicacion?: string | null;
    observaciones?: string | null;
    estado?: LoteCaducidad['estado'];
    usuario?: string;
  }) => request<LoteCaducidad>(`/api/catalogo/caducidades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  }),

  descartarCaducidad: (id: number, datos: { motivo?: string; usuario?: string } = {}) =>
    request<LoteCaducidad>(`/api/catalogo/caducidades/${id}/descartar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  crearSolicitud: (datos: {
    materialId: number;
    cantidad: number;
    cantidadTexto?: string;
    estudiante?: string;
    semestreId?: number;
    procedimientoId?: number;
  }) =>
    request<{ id: number; estado: EstadoSolicitud }>('/api/catalogo/solicitudes', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  cambiarEstadoSolicitud: (id: number, estado: EstadoSolicitud) =>
    request<{ id: number; estado: EstadoSolicitud }>(`/api/catalogo/solicitudes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  actualizarRevision: (id: number, revisado: boolean) =>
    request<{ id: number; revisado: number }>(`/api/catalogo/procedimientos/${id}/revisado`, {
      method: 'PATCH',
      body: JSON.stringify({ revisado }),
    }),

  proveedores: () => request<Proveedor[]>('/api/catalogo/proveedores'),
  proveedor: (id: number) => request<ProveedorDetalle>(`/api/catalogo/proveedores/${id}`),
  crearProveedor: (datos: Partial<Pick<Proveedor, 'nombre' | 'contacto' | 'telefono' | 'email' | 'categoria' | 'estado'>> & { nombre: string }) =>
    request<{ id: number; nombre: string; estado: string }>('/api/catalogo/proveedores', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  actualizarProveedor: (id: number, datos: Partial<Pick<Proveedor, 'nombre' | 'contacto' | 'telefono' | 'email' | 'categoria' | 'estado'>>) =>
    request<{ message: string; proveedor: Proveedor }>(`/api/catalogo/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  prediccion: (filtros: Partial<{ dias: number; horizonte: number }> = {}) =>
    request<Prediccion>(`/api/catalogo/prediccion${query(filtros)}`),
};

export { API_BASE };
