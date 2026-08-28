import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '..//DashboardLayout';
import Card from '..//Card';
import './Dashboard.css';

import QuickActions from './features/QuickActions';
import RecentActivity from './features/RecentActivity';
import InventorySummary from './features/InventorySummary';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin Principal');

  useEffect(() => {
    const state = location.state as any;
    if (state?.userName) {
      setUserName(state.userName);
    }
  }, [location]);

  const [stats] = useState({
    totalUsers: 15,
    activeTeachers: 4,
    inventoryItems: 32,
    pendingRequests: 2
  });

  const [upcomingEvents] = useState([
    { id: 1, title: 'Reunión de personal', date: 'Hoy 15:00', location: 'Sala 1' },
    { id: 2, title: 'Capacitación del sistema', date: 'Mañana 10:00', location: 'Aula 201' },
  ]);

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Panel de Administración</h1>
          <div className="date-display">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Panel general</span>
            <h2>Bienvenido, {userName}</h2>
            <p>Aquí tienes un resumen rápido de las estadísticas y la actividad más importante.</p>
          </div>
          <span className="welcome-icon material-icons">admin_panel_settings</span>
        </div>

        <div className="stats-grid">
          <Card
            title="Usuarios"
            value={stats.totalUsers}
            icon="people"
            color="#0ea5e9"
            onClick={() => navigate('/admin/usuarios')}
          />
          <Card
            title="Docentes"
            value={stats.activeTeachers}
            icon="school"
            color="#8b5cf6"
            onClick={() => navigate('/admin/doctores')}
          />
          <Card
            title="Inventario"
            value={stats.inventoryItems}
            icon="inventory_2"
            color="#0d9488"
            onClick={() => navigate('/admin/inventario')}
          />
          <Card
            title="Pendientes"
            value={stats.pendingRequests}
            icon="notifications"
            color="#f59e0b"
            onClick={() => navigate('/admin/reportes')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <RecentActivity />
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Próximos Eventos</h2>
                <button className="view-all-button" onClick={() => navigate('/admin/configuracion')}>Ver calendario</button>
              </div>
              <div className="events-list">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      <span className="material-icons">event</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="event-details">
                      <div className="event-title">{event.title}</div>
                      <div className="event-location">
                        <span className="material-icons">location_on</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col full-width">
            <InventorySummary />
          </div>
        </div>

        <QuickActions />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;