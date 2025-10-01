import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SimulacionRoles.css';

interface RolInfo {
  tipo: 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor';
  nombre: string;
  email: string;
  descripcion: string;
  funciones: string[];
  rutas: { ruta: string; descripcion: string }[];
}

const SimulacionRoles: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRol, setSelectedRol] = useState<RolInfo | null>(null);

  const roles: RolInfo[] = [
    {
      tipo: 'administrador',
      nombre: 'Admin Principal',
      email: 'admin@clinica.com',
      descripcion: 'Acceso completo al sistema. Gestiona usuarios, inventario, doctores, estudiantes y configuración general.',
      funciones: [
        'Gestión de usuarios',
        'Administración de inventario',
        'Supervisión de doctores y estudiantes',
        'Generación de reportes',
        'Configuración del sistema'
      ],
      rutas: [
        { ruta: '/admin/dashboard', descripcion: 'Panel principal con estadísticas y actividad reciente' },
        { ruta: '/admin/usuarios', descripcion: 'Gestión de todos los usuarios del sistema' },
        { ruta: '/admin/inventario', descripcion: 'Supervisión del inventario general' },
        { ruta: '/admin/doctores', descripcion: 'Administración de doctores y docentes' },
        { ruta: '/admin/estudiantes', descripcion: 'Gestión de estudiantes' },
        { ruta: '/admin/reportes', descripcion: 'Generación y visualización de reportes' },
        { ruta: '/admin/configuracion', descripcion: 'Configuración general del sistema' }
      ]
    },
    {
      tipo: 'cajero',
      nombre: 'Juan Pérez',
      email: 'cajero@clinica.com',
      descripcion: 'Gestiona pagos, facturas y transacciones financieras de la clínica.',
      funciones: [
        'Procesamiento de pagos',
        'Emisión de facturas',
        'Gestión de clientes',
        'Reportes financieros',
        'Control de caja diaria'
      ],
      rutas: [
        { ruta: '/cajero/dashboard', descripcion: 'Panel principal con ingresos del día y transacciones recientes' },
        { ruta: '/cajero/pagos', descripcion: 'Procesamiento de pagos de servicios' },
        { ruta: '/cajero/facturas', descripcion: 'Emisión y gestión de facturas' },
        { ruta: '/cajero/clientes', descripcion: 'Gestión de información de clientes' },
        { ruta: '/cajero/reportes', descripcion: 'Reportes financieros y de transacciones' }
      ]
    },
    {
      tipo: 'doctor',
      nombre: 'Dr. Carlos Mendoza',
      email: 'doctor@clinica.com',
      descripcion: 'Gestiona pacientes, citas, tratamientos y supervisa a estudiantes en prácticas.',
      funciones: [
        'Atención de pacientes',
        'Gestión de citas',
        'Supervisión de tratamientos',
        'Tutoría de estudiantes',
        'Mantenimiento de historiales clínicos'
      ],
      rutas: [
        { ruta: '/doctor/dashboard', descripcion: 'Panel principal con citas del día y estudiantes asignados' },
        { ruta: '/doctor/pacientes', descripcion: 'Gestión de pacientes y sus datos' },
        { ruta: '/doctor/citas', descripcion: 'Calendario y gestión de citas' },
        { ruta: '/doctor/tratamientos', descripcion: 'Seguimiento de tratamientos activos' },
        { ruta: '/doctor/estudiantes', descripcion: 'Supervisión de estudiantes asignados' },
        { ruta: '/doctor/historial', descripcion: 'Acceso a historiales clínicos de pacientes' }
      ]
    },
    {
      tipo: 'estudiante',
      nombre: 'Pedro Gómez',
      email: 'estudiante@clinica.com',
      descripcion: 'Realiza prácticas clínicas supervisadas, gestiona pacientes asignados y cursos.',
      funciones: [
        'Atención supervisada de pacientes',
        'Seguimiento de prácticas clínicas',
        'Gestión de cursos y materias',
        'Coordinación de citas con supervisores',
        'Registro de procedimientos realizados'
      ],
      rutas: [
        { ruta: '/estudiante/dashboard', descripcion: 'Panel principal con prácticas pendientes y cursos actuales' },
        { ruta: '/estudiante/pacientes', descripcion: 'Pacientes asignados para prácticas' },
        { ruta: '/estudiante/citas', descripcion: 'Calendario de citas con pacientes' },
        { ruta: '/estudiante/cursos', descripcion: 'Cursos actuales y progreso académico' },
        { ruta: '/estudiante/practicas', descripcion: 'Registro y seguimiento de prácticas clínicas' }
      ]
    },
    {
      tipo: 'inventario',
      nombre: 'María López',
      email: 'inventario@clinica.com',
      descripcion: 'Administra el inventario de insumos, equipos y materiales de la clínica.',
      funciones: [
        'Control de stock',
        'Gestión de proveedores',
        'Procesamiento de pedidos',
        'Alertas de bajo stock',
        'Reportes de inventario'
      ],
      rutas: [
        { ruta: '/inventario/dashboard', descripcion: 'Panel principal con productos de bajo stock y órdenes recientes' },
        { ruta: '/inventario/productos', descripcion: 'Catálogo completo de productos en inventario' },
        { ruta: '/inventario/proveedores', descripcion: 'Gestión de proveedores de insumos' },
        { ruta: '/inventario/pedidos', descripcion: 'Seguimiento de pedidos realizados' },
        { ruta: '/inventario/reportes', descripcion: 'Reportes de movimientos de inventario' },
        { ruta: '/inventario/alertas', descripcion: 'Alertas de productos con bajo stock' }
      ]
    },
    {
      tipo: 'proveedor',
      nombre: 'Dental Supplies S.A.',
      email: 'proveedor@clinica.com',
      descripcion: 'Gestiona productos, pedidos y entregas a la clínica.',
      funciones: [
        'Catálogo de productos',
        'Gestión de pedidos',
        'Coordinación de entregas',
        'Facturación',
        'Seguimiento de ventas'
      ],
      rutas: [
        { ruta: '/proveedor/dashboard', descripcion: 'Panel principal con órdenes pendientes y productos más vendidos' },
        { ruta: '/proveedor/productos', descripcion: 'Gestión del catálogo de productos ofrecidos' },
        { ruta: '/proveedor/pedidos', descripcion: 'Seguimiento de pedidos recibidos' },
        { ruta: '/proveedor/entregas', descripcion: 'Coordinación y seguimiento de entregas' },
        { ruta: '/proveedor/facturas', descripcion: 'Gestión de facturas emitidas' }
      ]
    }
  ];

  const handleLogin = (rol: RolInfo) => {
    // Simular inicio de sesión con el rol seleccionado
    console.log(`Iniciando sesión como ${rol.tipo}: ${rol.nombre}`);
    // Redirigir al login con los datos del rol seleccionado
    navigate(`/login`, { 
      state: { 
        simulatedLogin: true,
        userType: rol.tipo,
        userName: rol.nombre,
        userEmail: rol.email,
        userPassword: '123456', // Contraseña predeterminada para simulación
        fromSimulation: true
      } 
    });
  };

  return (
    <div className="simulacion-container">
      <h1>Simulación de Roles - Clínica Odontológica Unifranz</h1>
      <p className="descripcion-general">
        Esta página permite simular el acceso a la plataforma con diferentes roles de usuario.
        Seleccione un rol para ver sus detalles y acceder a su interfaz correspondiente.
      </p>

      <div className="roles-grid">
        {roles.map((rol) => (
          <div 
            key={rol.tipo} 
            className={`rol-card ${selectedRol?.tipo === rol.tipo ? 'selected' : ''}`}
            onClick={() => setSelectedRol(rol)}
            style={{ borderColor: selectedRol?.tipo === rol.tipo ? '#00BCD4' : '#ddd' }}
          >
            <div className="rol-icon" style={{ backgroundColor: '#00BCD4' }}>
              <span className="material-icons">
                {rol.tipo === 'administrador' ? 'admin_panel_settings' :
                 rol.tipo === 'cajero' ? 'payments' :
                 rol.tipo === 'doctor' ? 'medical_services' :
                 rol.tipo === 'estudiante' ? 'school' :
                 rol.tipo === 'inventario' ? 'inventory' : 'local_shipping'}
              </span>
            </div>
            <h3>{rol.nombre}</h3>
            <p className="rol-tipo">{rol.tipo.charAt(0).toUpperCase() + rol.tipo.slice(1)}</p>
            <p className="rol-email">{rol.email}</p>
          </div>
        ))}
      </div>

      {selectedRol && (
        <div className="rol-detalle">
          <h2>Detalles del Rol: {selectedRol.tipo.charAt(0).toUpperCase() + selectedRol.tipo.slice(1)}</h2>
          <p className="rol-descripcion">{selectedRol.descripcion}</p>
          
          <div className="rol-info-container">
            <div className="rol-funciones">
              <h3>Funciones Principales</h3>
              <ul>
                {selectedRol.funciones.map((funcion, index) => (
                  <li key={index}>{funcion}</li>
                ))}
              </ul>
            </div>
            
            <div className="rol-rutas">
              <h3>Navegación Disponible</h3>
              <ul>
                {selectedRol.rutas.map((ruta, index) => (
                  <li key={index}>
                    <strong>{ruta.ruta}</strong> - {ruta.descripcion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <button 
            className="login-button" 
            onClick={() => handleLogin(selectedRol)}
          >
            Iniciar como {selectedRol.nombre}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimulacionRoles;