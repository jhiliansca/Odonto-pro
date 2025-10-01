// src/components/usuarios/administrador/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '..//DashboardLayout';
import Card from '..//Card'; // <-- RUTA CORREGIDA
import './Dashboard.css';

// Importa los componentes de funcionalidad
import QuickActions from './features/QuickActions';
import RecentActivity from './features/RecentActivity';
import InventorySummary from './features/InventorySummary';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
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
    { id: 1, title: 'Reunión de personal', date: 'Hoy, 15:00', location: 'Sala 1' },
    { id: 2, title: 'Capacitación del sistema', date: 'Mañana, 10:00', location: 'Aula 201' },
  ]);

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Panel de Administración</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <h2>Bienvenido, {userName}</h2>
            <p>Aquí tienes un resumen rápido de las estadísticas y la actividad más importante.</p>
          </div>
        </div>

        <div className="stats-grid">
          <Card 
            title="Usuarios" 
            value={stats.totalUsers} 
            icon="people" 
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
            onClick={() => console.log('Navegando a usuarios')}
          />
          <Card 
            title="Docentes" 
            value={stats.activeTeachers} 
            icon="school" 
            iconColor="#28a745"
            backgroundColor="#d4edda"
            onClick={() => console.log('Navegando a docentes')}
          />
          <Card 
            title="Inventario" 
            value={stats.inventoryItems} 
            icon="inventory_2" 
            iconColor="#ffc107"
            backgroundColor="#fff3cd"
            onClick={() => console.log('Navegando a inventario')}
          />
          <Card 
            title="Pendientes" 
            value={stats.pendingRequests} 
            icon="notifications" 
            iconColor="#dc3545"
            backgroundColor="#fde0e3"
            onClick={() => console.log('Navegando a solicitudes')}
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
                <button className="view-all-button">Ver calendario</button>
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