const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:3001';

export interface ConfiguracionItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  valor: string;
  tipo: 'texto' | 'numero' | 'toggle' | 'select';
  opciones: string[] | null;
  categoria: 'general' | 'seguridad' | 'notificaciones' | 'sistema';
  actualizado: string;
}

export interface Transaccion {
  id: number;
  cliente: string;
  servicio: string;
  monto: number;
  estado: 'pendiente' | 'completed';
  fecha: string;
  fechaISO: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || `Error ${respuesta.status}`);
  return datos as T;
}

export const soporteApi = {
  configuracion: () => request<ConfiguracionItem[]>('/api/configuracion'),
  actualizarConfiguracion: (id: string, valor: string) =>
    request<ConfiguracionItem>(`/api/configuracion/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ valor }),
    }),
  transacciones: (limit = 20) => request<Transaccion[]>(`/api/transacciones?limit=${limit}`),
};
