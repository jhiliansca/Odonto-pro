const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001';

export type Role = 'administrador' | 'docente' | 'estudiante' | 'recepcionista' | 'inventario' | 'cajero' | 'proveedor';

export interface AuthUser {
  id: number;
  nombre: string;
  apellido: string | null;
  nombreCompleto: string;
  email: string;
  rol: Role;
  telefono: string | null;
  ci: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  genero: 'femenino' | 'masculino' | 'otro' | 'prefiero_no_decir' | null;
  especialidad: string | null;
  tituloAcademico: string | null;
  departamento: string | null;
  horarioAtencion: string | null;
  biografia: string | null;
  semestre: string | null;
  tipoSemestre: string | null;
  carrera: string | null;
  grupo: string | null;
  turno: string | null;
  empresa: string | null;
  proveedorId: number | null;
  estado: 'activo' | 'inactivo';
  observaciones: string | null;
  fechaRegistro: string;
  fechaRegistroISO: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  tipoUsuario: Role;
  telefono: string;
  ci?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: string;
  especialidad?: string;
  tituloAcademico?: string;
  departamento?: string;
  horarioAtencion?: string;
  biografia?: string;
  semestre?: string;
  tipoSemestre?: string;
  carrera?: string;
  grupo?: string;
  turno?: string;
  empresa?: string;
  observaciones?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }
  return data as T;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/api/auth/login', { method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/api/auth/register', { method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function fetchUsers(): Promise<AuthUser[]> {
  return request<AuthUser[]>('/api/auth/users');
}

export async function createUser(payload: RegisterPayload): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/api/auth/users', { method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export type PerfilUserPayload = Partial<Pick<AuthUser, 'nombre' | 'apellido' | 'email' | 'rol' | 'telefono' | 'ci' | 'direccion' | 'fechaNacimiento' | 'genero' | 'especialidad' | 'tituloAcademico' | 'departamento' | 'horarioAtencion' | 'biografia' | 'semestre' | 'tipoSemestre' | 'carrera' | 'grupo' | 'turno' | 'empresa' | 'estado' | 'observaciones'>> & { password?: string };

export async function actualizarUser(id: number, datos: PerfilUserPayload): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>(`/api/auth/users/${id}`, { method: 'PUT',
    body: JSON.stringify(datos),
  });
  return data.user;
}

export async function cambiarEstadoUser(id: number, estado: AuthUser['estado']): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>(`/api/auth/users/${id}/estado`, { method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  return data.user;
}

const SESSION_KEY = 'odontopro_user';

export type UIRole = Exclude<Role, 'docente'> | 'doctor';

export function uiRole(role: Role): UIRole {
  return role === 'docente' ? 'doctor' : role;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (!user.rol || user.estado !== 'activo') {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearStoredUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function displayName(user: AuthUser): string {
  return user.nombreCompleto || `${user.nombre} ${user.apellido || ''}`.trim();
}

export function dashboardPath(role: Role): string {
  if (role === 'administrador') return '/admin/dashboard';
  if (role === 'docente') return '/doctor/dashboard';
  return `/${role}/dashboard`;
}
