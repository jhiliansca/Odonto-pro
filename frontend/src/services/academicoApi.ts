const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001';

export interface Modulo {
  id: number;
  cursoId: number;
  nombre: string;
  completado: boolean;
  orden: number;
}

export interface Curso {
  id: number;
  nombre: string;
  instructorId: number | null;
  instructor: string;
  descripcion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  progreso: number;
  estado: string;
  modulos: Modulo[];
}

export type CursoPayload = {
  nombre: string;
  instructorId: number | null;
  instructor: string;
  descripcion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: string;
  modulos?: { nombre: string; completado: boolean }[];
};

export interface Practica {
  id: number;
  estudianteId: number;
  pacienteId: number | null;
  paciente: string;
  nombre: string;
  fecha: string;
  fechaISO: string;
  supervisorId: number | null;
  supervisor: string;
  estado: string;
  calificacion: number | null;
  comentarios: string;
  detalles: string;
  fechaRegistro: string;
}

export type PracticaPayload = {
  nombre: string;
  fecha: string;
  estudianteId: number;
  pacienteId: number | null;
  paciente: string;
  supervisorId?: number | null;
  supervisor?: string;
  estado: string;
  calificacion?: number | null;
  comentarios?: string;
  detalles: string;
};

export interface Pago {
  id: number;
  solicitudId: number | null;
  estudianteId: number | null;
  estudiante: string;
  monto: number;
  comprobante: string | null;
  estado: string;
  fecha: string;
  procedimiento: string | null;
  asignatura: string | null;
}

export interface InsumoAcademico {
  id: number;
  estudianteId: number;
  estudiante: string;
  asignatura: string;
  procedimiento: string;
  semestre: number;
  estado: string;
  requierePago: boolean;
  fecha: string;
  fechaISO: string;
  materiales: { id: number; material: string; cantidad: string; asignado: boolean }[];
  pago: { id: number; monto: number; estado: string; fecha: string } | null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }
  return data as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `${text}` : '';
}

export const academicoApi = {
  cursos: () => request<Curso[]>('/api/academico/cursos'),
  curso: (id: number) => request<Curso>(`/api/academico/cursos/${id}`),
  crearCurso: (payload: CursoPayload) =>
    request<Curso>('/api/academico/cursos', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarCurso: (id: number, payload: Partial<CursoPayload>) =>
    request<Curso>(`/api/academico/cursos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  agregarModulo: (id: number, nombre: string) =>
    request<Curso>(`/api/academico/cursos/${id}/modulos`, { method: 'POST',
      body: JSON.stringify({ nombre }),
    }),
  toggleModulo: (id: number, moduloId: number, completado: boolean) =>
    request<Curso>(`/api/academico/cursos/${id}/modulos/${moduloId}`, { method: 'PUT',
      body: JSON.stringify({ completado }),
    }),
  eliminarCurso: (id: number) =>
    request<{ message: string; id: number }>(`/api/academico/cursos/${id}`, { method: 'DELETE' }),

  practicas: (filtros: Partial<{ estudianteId: number; supervisorId: number; estado: string; search: string }> = {}) =>
    request<Practica[]>(`/api/academico/practicas${query(filtros)}`),
  crearPractica: (payload: PracticaPayload) =>
    request<Practica>('/api/academico/practicas', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarPractica: (id: number, payload: Partial<PracticaPayload>) =>
    request<Practica>(`/api/academico/practicas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  eliminarPractica: (id: number) =>
    request<{ message: string; id: number }>(`/api/academico/practicas/${id}`, { method: 'DELETE' }),

  pagos: (filtros: Partial<{ estudianteId: number; estado: string }> = {}) =>
    request<Pago[]>(`/api/academico/pagos${query(filtros)}`),
  crearPago: (payload: { estudianteId: number; solicitudId?: number | null; monto: number; comprobante?: string; estado?: string }) =>
    request<Pago>('/api/academico/pagos', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarPago: (id: number, payload: Partial<{ estado: string; monto: number }>) =>
    request<Pago>(`/api/academico/pagos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  insumos: (filtros: Partial<{ estudianteId: number; estado: string }> = {}) =>
    request<InsumoAcademico[]>(`/api/academico/insumos${query(filtros)}`),
  insumo: (id: number) => request<InsumoAcademico>(`/api/academico/insumos/${id}`),
};

export { API_BASE };
