import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RolDetalle from './RolDetalle';
import './UserRedirect.css';

interface UserRedirectProps {
  userType: 'administrador' | 'docente' | 'doctor' | 'cajero' | 'estudiante' | 'inventario' | 'proveedor' | 'recepcionista';
  userName: string;
}

const UserRedirect: React.FC<UserRedirectProps> = ({ userType, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar si viene de la página de simulación
    const state = location.state as { fromSimulation: boolean } | null;
    const fromSimulation = state?.fromSimulation;
    
    if (fromSimulation) {
      // Mostrar detalles del rol
      setShowDetails(true);
    } else {
      // Redirigir al usuario al dashboard correspondiente según su tipo
      // Corregir la ruta para el administrador
      const redirectPath = userType === 'administrador'
        ? '/admin/dashboard'
        : userType === 'docente'
          ? '/doctor/dashboard'
          : `/${userType}/dashboard`;
      
      // Simular una pequeña carga antes de redirigir
      const timer = setTimeout(() => {
        navigate(redirectPath, { 
          state: { userName } 
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userType, userName, navigate, location]);

  // Si se debe mostrar los detalles del rol, renderizar el componente RolDetalle
  if (showDetails) {
    return <RolDetalle userType={userType} userName={userName} />;
  }
  
  // De lo contrario, mostrar el loader de redirección
  return (
    <div className="user-redirect-container">
      <div className="redirect-loader">
        <div className="loader-spinner"></div>
        <p>Redirigiendo al panel de {userType}...</p>
      </div>
    </div>
  );
};

export default UserRedirect;