const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:3001'
).replace(/\/api$/, '');

export interface Reporte {
  id: number;
  tipo: string;
  modulo: string;
  titulo: string;
  descripcion: string | null;
  parametros: unknown;
  generadoPor: string | null;
  generadoPorId: number | null;
  formato: string;
  fecha: string;
  createdAt: string;
  datos?: ReporteGenerado | null;
}

export interface ReporteGenerado {
  tipo?: string;
  resumenBase?: Record<string, unknown>;
  columnas: string[];
  filas: (string | number)[][];
  parametros: Record<string, unknown>;
  generadoEn: string;
  resumen?: { label: string; value: string | number }[];
  notas?: string;
}

export interface ReporteDetalle extends Reporte {
  datos: ReporteGenerado | null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data as T;
}

export const reportesApi = {
  listar: (filtros: Partial<{ modulo: string; tipo: string; limit: number }> = {}) => {
    const q = new URLSearchParams();
    if (filtros.modulo) q.set('modulo', filtros.modulo);
    if (filtros.tipo) q.set('tipo', filtros.tipo);
    if (filtros.limit) q.set('limit', String(filtros.limit));
    const qs = q.toString();
    return request<Reporte[]>(`/api/reportes${qs ? `?${qs}` : ''}`);
  },
  crear: (payload: { tipo: string; modulo: string; titulo: string; descripcion: string; parametros: unknown; datos: unknown; generadoPor: string; generadoPorId: number | null; formato: string }) =>
    request<Reporte>('/api/reportes', { method: 'POST', body: JSON.stringify(payload) }),
  obtener: (id: number) => request<ReporteDetalle>(`/api/reportes/${id}`),
  generar: (payload: {
    tipo: string;
    titulo?: string;
    modulo?: string;
    descripcion?: string;
    parametros?: Record<string, unknown>;
    generadoPor: string;
    generadoPorId: number | null;
    formato?: string;
  }) => request<ReporteDetalle>('/api/reportes/generar', { method: 'POST', body: JSON.stringify(payload) }),
};
