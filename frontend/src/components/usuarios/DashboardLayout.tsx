import React, { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor' | 'recepcionista';
  userName: string;
  userImage?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userType,
  userName,
  userImage
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  return (
    <div className="dashboard-layout">
      <Sidebar
        userType={userType}
        userName={userName}
        userImage={userImage}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <main className="dashboard-content">
        <div className="dashboard-mobile-bar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Abrir menú de navegación"
            aria-expanded={sidebarOpen}
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="mobile-bar-brand">
            <span className="mobile-bar-title">Clínica Unifranz</span>
            <span className="mobile-bar-sub">Portal de Gestión</span>
          </div>
          <div className="mobile-bar-user" title={userName}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
