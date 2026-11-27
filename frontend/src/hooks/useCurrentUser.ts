import { useMemo } from 'react';
import { getStoredUser, type AuthUser } from '../services/authApi';

export function useCurrentUser(): AuthUser | null {
  return useMemo(() => getStoredUser(), []);
}

export function useCurrentUserName(fallback = 'Usuario'): string {
  const user = useCurrentUser();
  if (!user) return fallback;
  return user.nombreCompleto || `${user.nombre} ${user.apellido || ''}`.trim();
}
