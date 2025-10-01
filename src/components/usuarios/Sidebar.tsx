import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  userType: 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor';
  userName: string;
  userImage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userType, userName, userImage }) => {
  const location = useLocation();
  
  // Menú de opciones según el tipo de usuario
  const getMenuOptions = () => {
    switch (userType) {
      case 'administrador':
        return [
          { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/admin/usuarios', icon: 'people', label: 'Usuarios' },
          { path: '/admin/inventario', icon: 'inventory', label: 'Inventario' },
          { path: '/admin/doctores', icon: 'medical_services', label: 'Doctores' },
          { path: '/admin/estudiantes', icon: 'school', label: 'Estudiantes' },
          { path: '/admin/reportes', icon: 'assessment', label: 'Reportes' },
          { path: '/admin/configuracion', icon: 'settings', label: 'Configuración' },
        ];
      case 'cajero':
        return [
          { path: '/cajero/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/cajero/pagos', icon: 'payments', label: 'Pagos' },
          { path: '/cajero/facturas', icon: 'receipt', label: 'Facturas' },
          { path: '/cajero/clientes', icon: 'people', label: 'Clientes' },
          { path: '/cajero/reportes', icon: 'assessment', label: 'Reportes' },
        ];
      case 'doctor':
        return [
          { path: '/doctor/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/doctor/pacientes', icon: 'people', label: 'Pacientes' },
          { path: '/doctor/citas', icon: 'event', label: 'Citas' },
          { path: '/doctor/tratamientos', icon: 'healing', label: 'Tratamientos' },
          { path: '/doctor/estudiantes', icon: 'school', label: 'Estudiantes' },
          { path: '/doctor/historial', icon: 'history', label: 'Historial Clínico' },
        ];
      case 'estudiante':
        return [
          { path: '/estudiante/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/estudiante/pacientes', icon: 'people', label: 'Pacientes' },
          { path: '/estudiante/citas', icon: 'event', label: 'Citas' },
          { path: '/estudiante/cursos', icon: 'book', label: 'Cursos' },
          { path: '/estudiante/practicas', icon: 'science', label: 'Prácticas' },
        ];
      case 'inventario':
        return [
          { path: '/inventario/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/inventario/productos', icon: 'inventory_2', label: 'Productos' },
          { path: '/inventario/proveedores', icon: 'local_shipping', label: 'Proveedores' },
          { path: '/inventario/pedidos', icon: 'shopping_cart', label: 'Pedidos' },
          { path: '/inventario/reportes', icon: 'assessment', label: 'Reportes' },
          { path: '/inventario/alertas', icon: 'notifications', label: 'Alertas' },
        ];
      case 'proveedor':
        return [
          { path: '/proveedor/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/proveedor/productos', icon: 'inventory_2', label: 'Mis Productos' },
          { path: '/proveedor/pedidos', icon: 'shopping_cart', label: 'Pedidos' },
          { path: '/proveedor/entregas', icon: 'local_shipping', label: 'Entregas' },
          { path: '/proveedor/facturas', icon: 'receipt', label: 'Facturas' },
        ];
      default:
        return [];
    }
  };

  // Colores según el tipo de usuario
  const getUserColor = () => {
    switch (userType) {
      case 'administrador':
        return '#00BCD4'; // Celeste
      case 'cajero':
        return '#00BCD4'; // Celeste
      case 'doctor':
        return '#00BCD4'; // Celeste
      case 'estudiante':
        return '#00BCD4'; // Celeste
      case 'inventario':
        return '#00BCD4'; // Celeste
      case 'proveedor':
        return '#00BCD4'; // Celeste
      default:
        return '#00BCD4'; // Celeste
    }
  };

  const menuOptions = getMenuOptions();
  const userColor = getUserColor();

  return (
    <div className="sidebar" style={{ '--user-color': userColor } as React.CSSProperties}>
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="user-image">
            {userImage ? (
              <img src={userImage} alt={userName} />
            ) : (
              <div className="user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-info">
            <h3>{userName}</h3>
            <p className="user-role">{userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuOptions.map((option, index) => (
            <li key={index} className={location.pathname === option.path ? 'active' : ''}>
              <Link to={option.path}>
                <span className="material-icons">{option.icon}</span>
                <span className="menu-label">{option.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link to="/login" className="logout-button">
          <span className="material-icons">logout</span>
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;