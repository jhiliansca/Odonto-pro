import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { dashboardPath, getStoredUser, uiRole, type UIRole } from '../../services/authApi';

interface ProtectedRouteProps {
  roles: UIRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(uiRole(user.rol))) {
    return <Navigate to={dashboardPath(user.rol)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
