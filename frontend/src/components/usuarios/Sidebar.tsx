import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearStoredUser } from '../../services/authApi';
import type { UIRole } from '../../services/authApi';
import { roleMeta } from './roleConfig';
import './Sidebar.css';

type UserType = UIRole;

interface SidebarProps {
  userType: UserType;
  userName: string;
  userImage?: string;
  isOpen: boolean;
  onClose: () => void;
}

type BadgeTone = 'primary' | 'danger' | 'warning' | 'neutral';

interface MenuOption {
  path: string;
  icon: string;
  label: string;
  badge?: number;
  badgeTone?: BadgeTone;
}

interface MenuGroup {
  title: string;
  items: MenuOption[];
}

const getMenuGroups = (userType: UserType): MenuGroup[] => {
  switch (userType) {
    case 'administrador':
      return [
        {
          title: 'Principal',
          items: [{ path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
        {
          title: 'Gestión de personas',
          items: [
            { path: '/admin/usuarios', icon: 'people', label: 'Usuarios' },
            { path: '/admin/pacientes', icon: 'groups', label: 'Pacientes' },
            { path: '/admin/doctores', icon: 'medical_services', label: 'Doctores' },
            { path: '/admin/estudiantes', icon: 'school', label: 'Estudiantes' },
          ],
        },
            {
              title: 'Operación de la clínica',
              items: [
                { path: '/admin/citas', icon: 'event', label: 'Citas' },
                { path: '/admin/pagos', icon: 'payments', label: 'Pagos' },
                { path: '/admin/inventario', icon: 'inventory', label: 'Inventario' },
                { path: '/admin/reportes', icon: 'assessment', label: 'Reportes' },
                { path: '/admin/actividad', icon: 'history', label: 'Actividad' },
              ],
            },
        {
          title: 'Sistema',
          items: [{ path: '/admin/configuracion', icon: 'settings', label: 'Configuración' }],
        },
      ];
    case 'recepcionista':
      return [
        {
          title: 'Principal',
          items: [{ path: '/recepcionista/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
            {
              title: 'Recepción',
              items: [
                { path: '/recepcionista/citas', icon: 'event', label: 'Agenda de Citas' },
                { path: '/recepcionista/pacientes', icon: 'groups', label: 'Pacientes' },
                { path: '/recepcionista/pagos', icon: 'payments', label: 'Pagos y Cobros' },
              ],
            },
      ];
    case 'cajero':
      return [
        {
          title: 'Principal',
          items: [{ path: '/cajero/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
      ];
    case 'doctor':
      return [
        {
          title: 'Principal',
          items: [{ path: '/doctor/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
            {
              title: 'Atención clínica',
              items: [
                { path: '/doctor/pacientes', icon: 'people', label: 'Pacientes' },
                { path: '/doctor/citas', icon: 'event', label: 'Citas' },
                { path: '/doctor/tratamientos', icon: 'healing', label: 'Tratamientos' },
                { path: '/doctor/historial', icon: 'history', label: 'Historial Clínico' },
              ],
            },
        {
          title: 'Docencia',
          items: [
            { path: '/doctor/estudiantes', icon: 'school', label: 'Estudiantes' },
            { path: '/doctor/cursos', icon: 'book', label: 'Cursos y módulos' },
            { path: '/doctor/horarios', icon: 'schedule', label: 'Horarios' },
          ],
        },
      ];
    case 'estudiante':
      return [
        {
          title: 'Principal',
          items: [{ path: '/estudiante/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
            {
              title: 'Práctica clínica',
              items: [
                { path: '/estudiante/pacientes', icon: 'people', label: 'Pacientes' },
                { path: '/estudiante/citas', icon: 'event', label: 'Citas' },
                { path: '/estudiante/practicas', icon: 'science', label: 'Prácticas' },
                { path: '/estudiante/insumos', icon: 'inventory_2', label: 'Insumos' },
              ],
            },
        {
          title: 'Académico',
          items: [
            { path: '/estudiante/cursos', icon: 'book', label: 'Cursos' },
            { path: '/estudiante/pagos', icon: 'payments', label: 'Mis Pagos' },
          ],
        },
      ];
    case 'inventario':
      return [
        {
          title: 'Principal',
          items: [{ path: '/inventario/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
            {
              title: 'Existencias',
              items: [
                { path: '/inventario/productos', icon: 'inventory_2', label: 'Productos' },
                { path: '/inventario/movimientos', icon: 'swap_vert', label: 'Movimientos' },
                { path: '/inventario/alertas', icon: 'notifications', label: 'Alertas' },
                { path: '/inventario/caducidades', icon: 'event_available', label: 'Caducidades' },
                { path: '/inventario/prediccion', icon: 'query_stats', label: 'Predicción' },
              ],
            },
            {
              title: 'Abastecimiento',
              items: [
                { path: '/inventario/proveedores', icon: 'local_shipping', label: 'Proveedores' },
                { path: '/inventario/pedidos', icon: 'shopping_cart', label: 'Pedidos' },
              ],
            },
        {
          title: 'Análisis',
          items: [
            { path: '/inventario/reportes', icon: 'assessment', label: 'Reportes' },
            { path: '/inventario/analitica', icon: 'insights', label: 'Analítica' },
          ],
        },
      ];
    case 'proveedor':
      return [
        {
          title: 'Principal',
          items: [{ path: '/proveedor/dashboard', icon: 'dashboard', label: 'Dashboard' }],
        },
      ];
    default:
      return [];
  }
};

const Sidebar: React.FC<SidebarProps> = ({
  userType,
  userName,
  userImage,
  isOpen = false,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = roleMeta[userType];
  const groups = getMenuGroups(userType);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      <aside
        className={`sidebar${isOpen ? ' is-open' : ''}`}
        style={{ '--user-color': meta.color } as React.CSSProperties}
        aria-label="Navegación principal"
      >
        <div className="sidebar-brand">
          <img src="/logoclinica.jpg" alt="Logo Clínica Unifranz" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Clínica Unifranz</span>
            <span className="sidebar-brand-sub">Portal de Gestión</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-image">
            {userImage ? (
              <img src={userImage} alt={userName} />
            ) : (
              <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div className="user-info">
            <h3 title={userName}>{userName}</h3>
            <p className="user-role" title={meta.label}>
              <span className="material-icons">{meta.icon}</span>
              <span className="user-role-label">{meta.label}</span>
            </p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group.title} className="sidebar-group">
              <p className="sidebar-nav-title">{group.title}</p>
              <ul>
                {group.items.map((option) => {
                  const active = isActive(option.path);
                  const tone: BadgeTone = option.badgeTone ?? 'primary';
                  return (
                    <li key={option.path} className={active ? 'active' : ''}>
                      <Link
                        to={option.path}
                        title={option.label}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="menu-icon">
                          <span className="material-icons">{option.icon}</span>
                        </span>
                        <span className="menu-label">{option.label}</span>
                        {option.badge ? (
                          <span className={`menu-badge ${tone}`}>
                            {option.badge > 99 ? '99+' : option.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="logout-button"
            onClick={() => {
              clearStoredUser();
              navigate('/login', { replace: true });
            }}
          >
            <span className="material-icons">logout</span>
            <span className="logout-label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div
        className={`sidebar-overlay${isOpen ? ' is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
};

export default Sidebar;
