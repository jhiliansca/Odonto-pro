import type { UIRole } from '../../services/authApi';

export type AppRole = UIRole | 'docente';

export const roleMeta: Record<AppRole, { color: string; label: string; icon: string }> = { administrador: { color: '#0d9488', label: 'Administrador', icon: 'admin_panel_settings' },
  recepcionista: { color: '#db2777', label: 'Recepcionista', icon: 'support_agent' },
  cajero: { color: '#7c3aed', label: 'Asistente de Caja', icon: 'point_of_sale' },
  doctor: { color: '#0284c7', label: 'Doctor / Docente', icon: 'medical_services' },
  docente: { color: '#0284c7', label: 'Docente', icon: 'medical_services' },
  estudiante: { color: '#f59e0b', label: 'Estudiante', icon: 'school' },
  inventario: { color: '#059669', label: 'Control de Inventario', icon: 'inventory_2' },
  proveedor: { color: '#ea580c', label: 'Proveedor', icon: 'local_shipping' },
};
