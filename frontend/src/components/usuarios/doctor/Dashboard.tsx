import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import MiniBars from '../MiniBars';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Cita, ClinicaResumen, Persona, Tratamiento } from '../../../services/clinicaApi';
import { useCurrentUser, useCurrentUserName } from '../../../hooks/useCurrentUser';
import './Dashboard.css';

function fechaHoy(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function etiquetaEstado(estado: Cita['estado']): string {
  if (estado === 'confirmada') return 'Confirmada';
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'completada') return 'Completada';
  return 'Cancelada';
}

function nombrePersona(persona: Persona): string {
  return persona.nombreCompleto || `${persona.nombre}${persona.apellido ? ` ${persona.apellido}` : ''}`;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Docente');
  const user = useCurrentUser();
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const [resumenApi, citasApi, tratamientosApi, estudiantesApi] = await Promise.all([
          clinicaApi.resumen(),
          clinicaApi.citas(),
          clinicaApi.tratamientos(),
          clinicaApi.estudiantes(),
        ]);
        if (!activo) return;
        setResumen(resumenApi);
        setCitas(user?.id != null ? citasApi.filter(cita => cita.doctor_id === user.id) : citasApi);
        setTratamientos(tratamientosApi);
        setEstudiantes(estudiantesApi);
      } catch {
        if (activo) setError('No fue posible cargar los datos reales.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [user?.id]);

  const hoy = fechaHoy();
  const citasHoy = citas.filter(cita => cita.fecha.slice(0, 10) === hoy);
  const tratamientosPendientes = tratamientos.filter(tratamiento => tratamiento.estado === 'pendiente').length;

  const stats = {
    totalPatients: resumen?.pacientes || 0,
    todayAppointments: citasHoy.length,
    pendingTreatments: tratamientosPendientes,
    assignedStudents: estudiantes.length,
  };
  const tratamientosPorEstado = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const tratamiento of tratamientos) {
      conteo.set(tratamiento.estado, (conteo.get(tratamiento.estado) || 0) + 1);
    }
    return [...conteo.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  }, [tratamientos]);

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="doctor-dashboard" style={{ '--role-color': '#0284c7' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Doctor</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Consultas</span>
            <h2>Bienvenido, {userName}</h2>
            <p>Revisa tus citas del día, supervisa tratamientos y coordina a los estudiantes asignados.</p>
          </div>
          <span className="welcome-icon material-icons">medical_services</span>
        </div>

        {cargando && <div className="empty-state">Cargando datos reales...</div>}
        {error && <div className="empty-state">{error}</div>}

        <div className="stats-grid">
          <Card
            title="Pacientes Totales"
            value={stats.totalPatients}
            icon="people"
            color="#0ea5e9"
            onClick={() => navigate('/doctor/pacientes')}
          />
          <Card
            title="Citas de Hoy"
            value={stats.todayAppointments}
            icon="event"
            color="#16a34a"
            onClick={() => navigate('/doctor/citas')}
          />
          <Card
            title="Tratamientos Pendientes"
            value={stats.pendingTreatments}
            icon="healing"
            color="#f59e0b"
            onClick={() => navigate('/doctor/tratamientos')}
          />
          <Card
            title="Estudiantes Asignados"
            value={stats.assignedStudents}
            icon="school"
            color="#8b5cf6"
            onClick={() => navigate('/doctor/estudiantes')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Citas del Día</h2>
                <button className="view-all-button" onClick={() => navigate('/doctor/citas')}>Ver todas</button>
              </div>
              <div className="appointments-list">
                {!cargando && !error && citasHoy.length === 0 && (
                  <div className="empty-state">No hay registros reales registrados</div>
                )}
                {citasHoy.map(cita => (
                  <div key={cita.id} className="appointment-item">
                    <div className="appointment-time">{cita.hora.slice(0, 5)}</div>
                    <div className="appointment-details">
                      <div className="appointment-patient">{cita.paciente ?? `Paciente #${cita.paciente_id}`}</div>
                      <div className="appointment-treatment">{cita.tratamiento}</div>
                    </div>
                    <div className="appointment-status">
                      <span className={`status-badge ${cita.estado}`}>{etiquetaEstado(cita.estado)}</span>
                    </div>
                    <div className="appointment-actions">
                      <button className="icon-button" aria-label="Ver cita" onClick={() => navigate('/doctor/citas')}>
                        <span className="material-icons">visibility</span>
                      </button>
                      <button className="icon-button" aria-label="Editar cita" onClick={() => navigate('/doctor/citas')}>
                        <span className="material-icons">edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Estudiantes Asignados</h2>
                <button className="view-all-button" onClick={() => navigate('/doctor/estudiantes')}>Ver todos</button>
              </div>
              <div className="students-list">
                {!cargando && !error && estudiantes.length === 0 && (
                  <div className="empty-state">No hay registros reales registrados</div>
                )}
                {estudiantes.map(estudiante => (
                  <div key={estudiante.id} className="student-item">
                    <div className="student-avatar">{nombrePersona(estudiante).charAt(0)}</div>
                    <div className="student-details">
                      <div className="student-name">{nombrePersona(estudiante)}</div>
                      <div className="student-info">
                        <span>{estudiante.semestre || 'Sin semestre registrado'}</span> • <span>{estudiante.email || 'Sin email registrado'}</span>
                      </div>
                    </div>
                    <button className="icon-button" aria-label="Opciones" onClick={() => navigate('/doctor/estudiantes')}>
                      <span className="material-icons">more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col full-width">
            <MiniBars titulo="Tratamientos por estado" datos={tratamientosPorEstado} />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Acciones Rápidas</h2>
              </div>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate('/doctor/citas')}>
                  <span className="material-icons">add_circle</span>
                  <span>Nueva Cita</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/doctor/pacientes')}>
                  <span className="material-icons">person_add</span>
                  <span>Nuevo Paciente</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/doctor/historial')}>
                  <span className="material-icons">assignment</span>
                  <span>Historial Clínico</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/doctor/estudiantes')}>
                  <span className="material-icons">school</span>
                  <span>Asignar Estudiante</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;