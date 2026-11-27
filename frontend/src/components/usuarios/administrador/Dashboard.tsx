import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '..//DashboardLayout';
import Card from '..//Card';
import MiniBars from '../MiniBars';
import './Dashboard.css';

import QuickActions from './features/QuickActions';
import RecentActivity from './features/RecentActivity';
import InventorySummary from './features/InventorySummary';
import { clinicaApi } from '../../../services/clinicaApi';
import type { ClinicaResumen, Cita } from '../../../services/clinicaApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName();
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    Promise.all([clinicaApi.resumen(), clinicaApi.citas()])
      .then(([datosResumen, datosCitas]) => {
        if (activo) {
          setResumen(datosResumen);
          setCitas(datosCitas);
        }
      })
      .catch(() => {
        if (activo) {
          setResumen(null);
          setCitas([]);
        }
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const proximasCitas = citas.filter(cita => cita.fecha >= fechaHoy).slice(0, 5);
  const citasPorEstado = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const cita of citas) conteo.set(cita.estado, (conteo.get(cita.estado) || 0) + 1);
    return [...conteo.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  }, [citas]);

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
            title="Pacientes"
            value={resumen?.pacientes ?? '—'}
            icon="people"
            color="#0ea5e9"
            onClick={() => navigate('/admin/pacientes')}
          />
          <Card
            title="Docentes"
            value={resumen?.docentes ?? '—'}
            icon="school"
            color="#8b5cf6"
            onClick={() => navigate('/admin/doctores')}
          />
          <Card
            title="Estudiantes"
            value={resumen?.estudiantes ?? '—'}
            icon="groups"
            color="#0d9488"
            onClick={() => navigate('/admin/estudiantes')}
          />
          <Card
            title="Citas"
            value={resumen?.citas ?? '—'}
            icon="event"
            color="#f59e0b"
            onClick={() => navigate('/admin/citas')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <RecentActivity />
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Próximas Citas</h2>
                <button className="view-all-button" onClick={() => navigate('/admin/citas')}>Ver calendario</button>
              </div>
              <div className="events-list">
                {proximasCitas.length > 0 ? (
                  proximasCitas.map(cita => (
                    <div key={cita.id} className="event-item">
                      <div className="event-date">
                        <span className="material-icons">event</span>
                        <span>{`${cita.fecha} ${cita.hora}`.trim()}</span>
                      </div>
                      <div className="event-details">
                        <div className="event-title">{cita.paciente || 'Paciente sin nombre'}</div>
                        <div className="event-location">
                          <span className="material-icons">location_on</span>
                          <span>{cita.tratamiento}</span>
                          <span>{cita.doctor || 'Sin doctor asignado'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="event-item">
                    <div className="event-details">
                      <div className="event-title">{cargando ? 'Cargando datos reales...' : 'No hay registros reales registrados'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col full-width">
            <MiniBars titulo="Citas por estado" datos={citasPorEstado} />
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
