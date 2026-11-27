import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import MiniBars from '../MiniBars';
import { clinicaApi } from '../../../services/clinicaApi';
import type {
  Cita,
  ClinicaResumen,
  Historial,
  Paciente,
  Persona,
  Tratamiento,
} from '../../../services/clinicaApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import '../RoleExtra.css';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información de la clínica.';
}

function fechaISO(date: Date): string {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function soloFecha(fecha: string): string {
  return fecha.includes('T') ? fecha.slice(0, 10) : fecha;
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = soloFecha(fecha).split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} ${MESES_CORTOS[mes - 1] ?? ''} ${anio}`;
}

const RecepcionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Recepcionista');
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [actividad, setActividad] = useState<{ id: number; usuario: string; accion: string; icono: string; fecha: string }[]>([]);
  const [doctores, setDoctores] = useState<Persona[]>([]);
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [resumenData, citasData, pacientesData, tratamientosData, historialData, actividadData, doctoresData, estudiantesData] =
        await Promise.all([
          clinicaApi.resumen(),
          clinicaApi.citas(),
          clinicaApi.pacientes(),
          clinicaApi.tratamientos(),
          clinicaApi.historial(),
          clinicaApi.actividad(),
          clinicaApi.doctores(),
          clinicaApi.estudiantes(),
        ]);
      setResumen(resumenData);
      setCitas(citasData);
      setPacientes(pacientesData);
      setTratamientos(tratamientosData);
      setHistorial(historialData);
      setActividad(actividadData);
      setDoctores(doctoresData);
      setEstudiantes(estudiantesData);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const hoy = fechaISO(new Date());
  const citasHoy = citas.filter((cita) => soloFecha(cita.fecha) === hoy);
  const pendientesHoy = citasHoy.filter((cita) => cita.estado === 'pendiente');
  const ultimosPacientes = [...pacientes].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
  const ultimoHistorial = [...historial].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
  const tratamientosPendientes = tratamientos.filter((tratamiento) => tratamiento.estado === 'pendiente').slice(0, 3);

  const nombreDoctor = (cita: Cita): string => {
    if (cita.doctor) return cita.doctor;
    const doctor = doctores.find((item) => item.id === cita.doctor_id);
    return doctor ? (doctor.nombreCompleto || doctor.nombre) : 'Sin doctor asignado';
  };
  const citasPorEstado = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const cita of citas) conteo.set(cita.estado, (conteo.get(cita.estado) || 0) + 1);
    return [...conteo.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  }, [citas]);

  const quickActions = [
    { icon: 'add_circle', label: 'Nueva Cita', path: '/recepcionista/citas' },
    { icon: 'person_add', label: 'Registrar Paciente', path: '/recepcionista/pacientes' },
    { icon: 'point_of_sale', label: 'Ver Pagos', path: '/recepcionista/pagos' },
    { icon: 'event_available', label: 'Ver Agenda', path: '/recepcionista/citas' },
  ];

  return (
    <DashboardLayout userType="recepcionista" userName={userName}>
      <div className="ext-page recepcion-dashboard" style={{ '--role-color': '#db2777' } as CSSProperties}>
        <div className="ext-header">
          <div>
            <h1>Panel de Recepción</h1>
            <p className="ext-sub">
              Gestiona la agenda del día, la llegada de pacientes y la información registrada de la clínica.
            </p>
          </div>
          <div className="date-display">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Recepción · {estudiantes.length} estudiantes registrados</span>
            <h2>Bienvenida, {userName}</h2>
            <p>Organiza las citas, recibe a los pacientes y consulta los registros clínicos.</p>
          </div>
          <span className="welcome-icon material-icons">support_agent</span>
        </div>

        {error && (
          <div className="ext-form-note">
            <span className="material-icons">error_outline</span>
            <span>{error}</span>
            <button className="view-all-button" onClick={() => void cargarDatos()}>Reintentar</button>
          </div>
        )}

        {cargando ? (
          <div className="ext-empty">
            <span className="material-icons">hourglass_empty</span>
            <h3>Cargando información</h3>
            <p>Consultando los registros de la clínica.</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <Card
                title="Citas de hoy"
                value={resumen?.citasHoy ?? citasHoy.length}
                icon="event"
                color="#db2777"
                onClick={() => navigate('/recepcionista/citas')}
              />
              <Card
                title="Pacientes registrados"
                value={resumen?.pacientes ?? pacientes.length}
                icon="groups"
                color="#0ea5e9"
                onClick={() => navigate('/recepcionista/pacientes')}
              />
              <Card
                title="Citas registradas"
                value={resumen?.citas ?? citas.length}
                icon="event_available"
                color="#16a34a"
                onClick={() => navigate('/recepcionista/citas')}
              />
              <Card
                title="Tratamientos registrados"
                value={resumen?.tratamientos ?? tratamientos.length}
                icon="medical_services"
                color="#8b5cf6"
              />
            </div>

            <div className="dashboard-row">
              <div className="dashboard-col full-width">
                <MiniBars titulo="Citas por estado" datos={citasPorEstado} />
              </div>
            </div>

            <div className="ext-grid">
              <div className="ext-card">
                <div className="ext-card-head">
                  <div>
                    <h2>Agenda de hoy</h2>
                    <p>Citas programadas para la fecha actual</p>
                  </div>
                  <button className="view-all-button" onClick={() => navigate('/recepcionista/citas')}>
                    Ver agenda completa
                  </button>
                </div>
                <div className="ext-table-wrap">
                  <table className="ext-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>Tratamiento</th>
                        <th>Doctor</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasHoy.map((cita) => (
                        <tr key={cita.id}>
                          <td>
                            <span className="ext-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span className="material-icons" style={{ fontSize: '0.95rem' }}>schedule</span>
                              {cita.hora}
                            </span>
                          </td>
                          <td>
                            <div className="ext-name">
                              <span className="ext-avatar">{(cita.paciente || '?').charAt(0)}</span>
                              <div><strong>{cita.paciente || 'Sin nombre registrado'}</strong></div>
                            </div>
                          </td>
                          <td>{cita.tratamiento}</td>
                          <td className="ext-muted">{nombreDoctor(cita)}</td>
                          <td><span className={`ext-pill ${cita.estado}`}>{cita.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {citasHoy.length === 0 && (
                    <div className="ext-empty">
                      <span className="material-icons">event_busy</span>
                      <h3>Sin citas</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ext-stack">
                <div className="ext-card">
                  <div className="ext-card-head">
                    <h2>Pendientes de hoy</h2>
                    <span className="ext-pill pendiente">{pendientesHoy.length} pendientes</span>
                  </div>
                  <div className="ext-card-body">
                    <div className="ext-waiting">
                      {pendientesHoy.map((cita) => (
                        <div key={cita.id} className="ext-waiting-item">
                          <span className="ext-avatar">{(cita.paciente || '?').charAt(0)}</span>
                          <div className="ext-waiting-body">
                            <strong>{cita.paciente || 'Sin nombre registrado'}</strong>
                            <span>{nombreDoctor(cita)}</span>
                          </div>
                          <span className="ext-muted">{cita.hora}</span>
                        </div>
                      ))}
                      {pendientesHoy.length === 0 && (
                        <div className="ext-empty">
                          <span className="material-icons">event_available</span>
                          <h3>Sin pendientes</h3>
                          <p>No hay registros reales registrados.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ext-card">
                  <div className="ext-card-head">
                    <h2>Actividad reciente</h2>
                    <button className="view-all-button" onClick={() => navigate('/recepcionista/pacientes')}>
                      Ver pacientes
                    </button>
                  </div>
                  <div className="ext-list">
                    {actividad.map((item) => (
                      <div key={item.id} className="ext-list-item">
                        <span className="ext-list-icon">
                          <span className="material-icons">{item.icono || 'bolt'}</span>
                        </span>
                        <div className="ext-list-body">
                          <strong>{item.usuario}</strong>
                          <span>{item.accion}</span>
                        </div>
                        <div className="ext-list-meta">
                          <span className="ext-muted">{formatearFecha(item.fecha)}</span>
                        </div>
                      </div>
                    ))}
                    {actividad.length === 0 && (
                      <div className="ext-empty">
                        <span className="material-icons">history</span>
                        <h3>Sin actividad</h3>
                        <p>No hay registros reales registrados.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ext-grid" style={{ marginTop: '1.25rem' }}>
              <div className="ext-card">
                <div className="ext-card-head">
                  <h2>Últimos pacientes registrados</h2>
                </div>
                <div className="ext-list">
                  {ultimosPacientes.map((paciente) => (
                    <div key={paciente.id} className="ext-list-item">
                      <span className="ext-avatar">{paciente.nombre.charAt(0)}</span>
                      <div className="ext-list-body">
                        <strong>{paciente.nombre}</strong>
                        <span>{paciente.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div className="ext-list-meta">
                        <span className="ext-muted">{formatearFecha(paciente.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {ultimosPacientes.length === 0 && (
                    <div className="ext-empty">
                      <span className="material-icons">people</span>
                      <h3>Sin pacientes</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ext-stack">
                <div className="ext-card">
                  <div className="ext-card-head">
                    <h2>Tratamientos pendientes</h2>
                  </div>
                  <div className="ext-list">
                    {tratamientosPendientes.map((tratamiento) => (
                      <div key={tratamiento.id} className="ext-list-item">
                        <span className="ext-list-icon"><span className="material-icons">medical_services</span></span>
                        <div className="ext-list-body">
                          <strong>{tratamiento.diagnostico}</strong>
                          <span>{tratamiento.paciente || 'Sin nombre registrado'}</span>
                        </div>
                        <span className="ext-pill pendiente">{tratamiento.estado}</span>
                      </div>
                    ))}
                    {tratamientosPendientes.length === 0 && (
                      <div className="ext-empty">
                        <span className="material-icons">medical_services</span>
                        <h3>Sin tratamientos</h3>
                        <p>No hay registros reales registrados.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ext-card">
                  <div className="ext-card-head">
                    <h2>Últimos registros clínicos</h2>
                  </div>
                  <div className="ext-list">
                    {ultimoHistorial.map((registro) => (
                      <div key={registro.id} className="ext-list-item">
                        <span className="ext-list-icon"><span className="material-icons">description</span></span>
                        <div className="ext-list-body">
                          <strong>{registro.tratamiento}</strong>
                          <span>{registro.paciente || 'Sin nombre registrado'}</span>
                        </div>
                        <div className="ext-list-meta">
                          <span className="ext-muted">{formatearFecha(registro.fecha)}</span>
                        </div>
                      </div>
                    ))}
                    {ultimoHistorial.length === 0 && (
                      <div className="ext-empty">
                        <span className="material-icons">history</span>
                        <h3>Sin registros</h3>
                        <p>No hay registros reales registrados.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ext-card" style={{ marginTop: '1.25rem' }}>
              <div className="ext-card-head">
                <h2>Acciones rápidas</h2>
              </div>
              <div className="ext-card-body">
                <div className="quick-actions">
                  {quickActions.map((action) => (
                    <button key={action.label} className="quick-action-btn" onClick={() => navigate(action.path)}>
                      <span className="material-icons">{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecepcionDashboard;
