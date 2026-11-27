import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import './Seccion.css';

type UserType = 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor' | 'recepcionista';

interface SeccionProps {
  userType: UserType;
  userName: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const Seccion: React.FC<SeccionProps> = ({ userType, userName, title, icon, description, color }) => {
  const navigate = useNavigate();
  const dashboardPath = userType === 'administrador' ? '/admin/dashboard' : `/${userType}/dashboard`;

  return (
    <DashboardLayout userType={userType} userName={userName}>
      <div className="seccion-container" style={{ '--role-color': color } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>{title}</h1>
          <div className="date-display">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Módulo</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <span className="welcome-icon material-icons">{icon}</span>
        </div>

        <div className="dashboard-panel seccion-aviso">
          <span className="seccion-aviso-icon material-icons">construction</span>
          <h3>Módulo en construcción</h3>
          <p className="seccion-aviso-text">
            Esta sección estará disponible próximamente. Mientras tanto, puedes volver al panel principal.
          </p>
          <button className="add-button" onClick={() => navigate(dashboardPath)}>
            <span className="material-icons">dashboard</span>
            Volver al Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Seccion;