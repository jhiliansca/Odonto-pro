const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001';

export interface Persona {
  id: number;
  nombre: string;
  apellido: string | null;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  especialidad: string | null;
  semestre: string | null;
  estado: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  edad: number | null;
  telefono: string | null;
  email: string | null;
  estado: 'activo' | 'pendiente' | 'completado';
  doctor_id: number | null;
  estudiante_id: number | null;
  doctor: string;
  estudiante: string;
  created_at: string;
}

export interface Cita {
  id: number;
  paciente_id: number;
  doctor_id: number | null;
  estudiante_id: number | null;
  fecha: string;
  hora: string;
  tratamiento: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  telefono: string | null;
  paciente: string;
  doctor: string;
  estudiante: string;
}

export interface Tratamiento {
  id: number;
  paciente_id: number;
  doctor_id: number | null;
  estudiante_id: number | null;
  diagnostico: string;
  fecha_inicio: string | null;
  fecha_estimada: string | null;
  costo: number;
  estado: 'pendiente' | 'activo' | 'completado';
  sesiones: number;
  sesiones_realizadas: number;
  paciente: string;
  doctor: string;
}

export interface Historial {
  id: number;
  paciente_id: number;
  doctor_id: number | null;
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  notas: string | null;
  procedimientos: unknown;
  paciente: string;
  doctor: string;
}

export interface ClinicaResumen {
  pacientes: number;
  citas: number;
  tratamientos: number;
  historial: number;
  docentes: number;
  estudiantes: number;
  citasHoy: number;
}

export type PacientePayload = Partial<Paciente> & { nombre: string };
export type CitaPayload = Partial<Cita> & { pacienteId: number; fecha: string; hora: string; tratamiento: string };
export type TratamientoPayload = Partial<Tratamiento> & { pacienteId: number; diagnostico: string };
export type HistorialPayload = Partial<Historial> & { pacienteId: number; fecha: string; diagnostico: string; tratamiento: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }
  return data as T;
}

function toPacientePayload(p: PacientePayload) {
  return {
    nombre: p.nombre,
    edad: p.edad || null,
    telefono: p.telefono || null,
    email: p.email || null,
    estado: p.estado || 'activo',
    doctorId: p.doctor_id || null,
    estudianteId: p.estudiante_id || null,
  };
}

function toCitaPayload(c: CitaPayload) {
  return {
    pacienteId: c.pacienteId,
    doctorId: c.doctor_id || null,
    estudianteId: c.estudiante_id || null,
    fecha: c.fecha,
    hora: c.hora,
    tratamiento: c.tratamiento,
    estado: c.estado || 'pendiente',
    telefono: c.telefono || null,
  };
}

function toTratamientoPayload(t: TratamientoPayload) {
  return {
    pacienteId: t.pacienteId,
    doctorId: t.doctor_id || null,
    estudianteId: t.estudiante_id || null,
    diagnostico: t.diagnostico,
    fechaInicio: t.fecha_inicio || null,
    fechaEstimada: t.fecha_estimada || null,
    costo: t.costo || 0,
    estado: t.estado || 'pendiente',
    sesiones: t.sesiones || 1,
    sesionesRealizadas: t.sesiones_realizadas || 0,
  };
}

export const clinicaApi = {
  resumen: () => request<ClinicaResumen>('/api/clinica/resumen'),
  doctores: () => request<Persona[]>('/api/clinica/doctores'),
  estudiantes: () => request<Persona[]>('/api/clinica/estudiantes'),
  pacientes: () => request<Paciente[]>('/api/clinica/pacientes'),
  crearPaciente: (p: PacientePayload) =>
    request<Paciente>('/api/clinica/pacientes', { method: 'POST', body: JSON.stringify(toPacientePayload(p)) }),
  actualizarPaciente: (id: number, p: PacientePayload) =>
    request<Paciente>(`/api/clinica/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(toPacientePayload(p)) }),
  eliminarPaciente: (id: number) =>
    request<void>(`/api/clinica/pacientes/${id}`, { method: 'DELETE' }),
  citas: (params: Record<string, string | number> = {}) => {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) search.set(key, String(value));
    }
    const query = search.toString();
    return request<Cita[]>(`/api/clinica/citas${query ? `?${query}` : ''}`);
  },
  crearCita: (c: CitaPayload) =>
    request<Cita>('/api/clinica/citas', { method: 'POST', body: JSON.stringify(toCitaPayload(c)) }),
  actualizarCita: (id: number, c: CitaPayload) =>
    request<Cita>(`/api/clinica/citas/${id}`, { method: 'PUT', body: JSON.stringify(toCitaPayload(c)) }),
  cambiarEstadoCita: (id: number, estado: Cita['estado']) =>
    request<Cita>(`/api/clinica/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  eliminarCita: (id: number) => request<void>(`/api/clinica/citas/${id}`, { method: 'DELETE' }),
  tratamientos: () => request<Tratamiento[]>('/api/clinica/tratamientos'),
  crearTratamiento: (t: TratamientoPayload) =>
    request<Tratamiento>('/api/clinica/tratamientos', { method: 'POST', body: JSON.stringify(toTratamientoPayload(t)) }),
  actualizarTratamiento: (id: number, t: TratamientoPayload) =>
    request<Tratamiento>(`/api/clinica/tratamientos/${id}`, { method: 'PUT', body: JSON.stringify(toTratamientoPayload(t)) }),
  eliminarTratamiento: (id: number) => request<void>(`/api/clinica/tratamientos/${id}`, { method: 'DELETE' }),
  historial: (pacienteId?: number) =>
    request<Historial[]>(`/api/clinica/historial${pacienteId ? `?pacienteId=${pacienteId}` : ''}`),
  crearHistorial: (h: HistorialPayload) =>
    request<Historial>('/api/clinica/historial', { method: 'POST',
      body: JSON.stringify({
        pacienteId: h.pacienteId,
        doctorId: h.doctor_id || null,
        fecha: h.fecha,
        diagnostico: h.diagnostico,
        tratamiento: h.tratamiento,
        notas: h.notas || null,
        procedimientos: h.procedimientos || null,
      }),
    }),

  actividad: () => request<{ id: number; usuario: string; accion: string; icono: string; fecha: string }[]>('/api/clinica/actividad'),
};
