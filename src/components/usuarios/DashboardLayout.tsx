import React from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor';
  userName: string;
  userImage?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  userType, 
  userName, 
  userImage 
}) => {
  return (
    <div className="dashboard-layout">
      <Sidebar 
        userType={userType} 
        userName={userName} 
        userImage={userImage} 
      />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
