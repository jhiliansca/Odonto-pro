import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RolDetalle.css';

interface RolDetalleProps {
  userType: 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor';
  userName: string;
}

const RolDetalle: React.FC<RolDetalleProps> = ({ userType, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Información detallada para cada rol
  const getRolInfo = () => {
    switch (userType) {
      case 'administrador':
        return {
          titulo: 'Panel de Administración',
          descripcion: 'Bienvenido al panel de administración de la Clínica Odontológica Unifranz. Desde aquí puede gestionar todos los aspectos del sistema.',
          funcionalidades: [
            { nombre: 'Gestión de Usuarios', descripcion: 'Administre todos los usuarios del sistema.' },
            { nombre: 'Inventario', descripcion: 'Supervise el inventario general de la clínica.' },
            { nombre: 'Doctores', descripcion: 'Gestione la información de doctores y docentes.' },
            { nombre: 'Estudiantes', descripcion: 'Administre los registros de estudiantes.' },
            { nombre: 'Reportes', descripcion: 'Genere y visualice reportes del sistema.' },
            { nombre: 'Configuración', descripcion: 'Configure los parámetros generales del sistema.' }
          ]
        };
      case 'cajero':
        return {
          titulo: 'Panel de Caja',
          descripcion: 'Bienvenido al panel de caja de la Clínica Odontológica Unifranz. Desde aquí puede gestionar pagos, facturas y clientes.',
          funcionalidades: [
            { nombre: 'Pagos', descripcion: 'Procese pagos de servicios odontológicos.' },
            { nombre: 'Facturas', descripcion: 'Emita y gestione facturas para los clientes.' },
            { nombre: 'Clientes', descripcion: 'Administre la información de los clientes.' },
            { nombre: 'Reportes', descripcion: 'Genere reportes financieros y de transacciones.' }
          ]
        };
      case 'doctor':
        return {
          titulo: 'Panel de Doctor',
          descripcion: 'Bienvenido al panel de doctor de la Clínica Odontológica Unifranz. Desde aquí puede gestionar pacientes, citas y tratamientos.',
          funcionalidades: [
            { nombre: 'Pacientes', descripcion: 'Gestione la información de sus pacientes.' },
            { nombre: 'Citas', descripcion: 'Administre su calendario de citas.' },
            { nombre: 'Tratamientos', descripcion: 'Supervise los tratamientos activos.' },
            { nombre: 'Estudiantes', descripcion: 'Gestione los estudiantes bajo su supervisión.' },
            { nombre: 'Historial Clínico', descripcion: 'Acceda a los historiales clínicos de pacientes.' }
          ]
        };
      case 'estudiante':
        return {
          titulo: 'Panel de Estudiante',
          descripcion: 'Bienvenido al panel de estudiante de la Clínica Odontológica Unifranz. Desde aquí puede gestionar sus prácticas clínicas y cursos.',
          funcionalidades: [
            { nombre: 'Pacientes', descripcion: 'Gestione los pacientes asignados para sus prácticas.' },
            { nombre: 'Citas', descripcion: 'Administre su calendario de citas con pacientes.' },
            { nombre: 'Cursos', descripcion: 'Acceda a información de sus cursos actuales.' },
            { nombre: 'Prácticas', descripcion: 'Registre y haga seguimiento de sus prácticas clínicas.' }
          ]
        };
      case 'inventario':
        return {
          titulo: 'Panel de Inventario',
          descripcion: 'Bienvenido al panel de inventario de la Clínica Odontológica Unifranz. Desde aquí puede gestionar productos, proveedores y pedidos.',
          funcionalidades: [
            { nombre: 'Productos', descripcion: 'Administre el catálogo de productos en inventario.' },
            { nombre: 'Proveedores', descripcion: 'Gestione la información de proveedores.' },
            { nombre: 'Pedidos', descripcion: 'Realice seguimiento de pedidos de insumos.' },
            { nombre: 'Reportes', descripcion: 'Genere reportes de movimientos de inventario.' },
            { nombre: 'Alertas', descripcion: 'Visualice alertas de productos con bajo stock.' }
          ]
        };
      case 'proveedor':
        return {
          titulo: 'Panel de Proveedor',
          descripcion: 'Bienvenido al panel de proveedor de la Clínica Odontológica Unifranz. Desde aquí puede gestionar sus productos, pedidos y entregas.',
          funcionalidades: [
            { nombre: 'Mis Productos', descripcion: 'Administre su catálogo de productos ofrecidos.' },
            { nombre: 'Pedidos', descripcion: 'Gestione los pedidos recibidos de la clínica.' },
            { nombre: 'Entregas', descripcion: 'Coordine y haga seguimiento de entregas.' },
            { nombre: 'Facturas', descripcion: 'Administre las facturas emitidas a la clínica.' }
          ]
        };
      default:
        return {
          titulo: 'Panel de Usuario',
          descripcion: 'Bienvenido al sistema de la Clínica Odontológica Unifranz.',
          funcionalidades: []
        };
    }
  };

  const rolInfo = getRolInfo();

  const handleContinuar = () => {
    // Redirigir al dashboard correspondiente
    navigate(`/${userType}/dashboard`);
  };

  const handleVolver = () => {
    // Volver a la página de simulación de roles
    navigate('/simulacion-roles');
  };

  return (
    <div className="rol-detalle-container">
      <div className="rol-detalle-header">
        <h1>{rolInfo.titulo}</h1>
        <div className="user-info">
          <div className="user-avatar" style={{ backgroundColor: '#00BCD4' }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h3>{userName}</h3>
            <p>{userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
          </div>
        </div>
      </div>

      <div className="rol-detalle-content">
        <p className="rol-descripcion">{rolInfo.descripcion}</p>

        <div className="funcionalidades-container">
          <h2>Funcionalidades Disponibles</h2>
          <div className="funcionalidades-grid">
            {rolInfo.funcionalidades.map((func, index) => (
              <div key={index} className="funcionalidad-card">
                <h3>{func.nombre}</h3>
                <p>{func.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rol-detalle-actions">
          <button className="action-button secondary" onClick={handleVolver}>
            Volver a Simulación
          </button>
          <button className="action-button primary" onClick={handleContinuar}>
            Continuar al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolDetalle;