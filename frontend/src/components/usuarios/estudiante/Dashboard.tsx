import type { CSSProperties, FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import './Dashboard.css';
import '../RoleExtra.css';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

type Detalle =
  | { tipo: 'cita'; dato: Cita }
  | { tipo: 'paciente'; dato: Paciente }
  | { tipo: 'tratamiento'; dato: Tratamiento };

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información de la clínica.';
}

function soloFecha(fecha: string): string {
  return fecha.includes('T') ? fecha.slice(0, 10) : fecha;
}

function partesFecha(fecha: string): [number, number, number] {
  const [anio, mes, dia] = soloFecha(fecha).split('-').map(Number);
  return [anio || 0, mes || 0, dia || 0];
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = partesFecha(fecha);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} ${MESES_CORTOS[mes - 1] || ''} ${anio}`;
}

function fechaHora(fecha: string, hora: string): string {
  return `${formatearFecha(fecha)} · ${hora}`;
}

const EstudianteDashboard: FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Estudiante');
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [actividad, setActividad] = useState<{ id: number; usuario: string; accion: string; icono: string; fecha: string }[]>([]);
  const [doctores, setDoctores] = useState<Persona[]>([]);
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState<Detalle | null>(null);

  const cargarDatos = useCallback(async () => {
    setActualizando(true);
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
      setActualizando(false);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const totalSesiones = useMemo(
    () => tratamientos.reduce((total, item) => total + (item.sesiones || 0), 0),
    [tratamientos],
  );
  const tratamientosPorEstado = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const tratamiento of tratamientos) {
      conteo.set(tratamiento.estado, (conteo.get(tratamiento.estado) || 0) + 1);
    }
    return [...conteo.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  }, [tratamientos]);

  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderDetalle = () => {
    if (!detalle) return null;
    if (detalle.tipo === 'cita') {
      const cita = detalle.dato;
      return (
        <div className="supply-detail-info">
          <p><strong>Paciente:</strong> {cita.paciente || 'Sin nombre registrado'}</p>
          <p><strong>Tratamiento:</strong> {cita.tratamiento}</p>
          <p><strong>Fecha y hora:</strong> {fechaHora(soloFecha(cita.fecha), cita.hora)}</p>
          <p><strong>Doctor:</strong> {cita.doctor || 'Sin asignar'}</p>
          <p><strong>Teléfono:</strong> {cita.telefono || 'Sin registrar'}</p>
          <p><strong>Estado:</strong> {cita.estado}</p>
        </div>
      );
    }
    if (detalle.tipo === 'paciente') {
      const paciente = detalle.dato;
      return (
        <div className="supply-detail-info">
          <p><strong>Nombre:</strong> {paciente.nombre}</p>
          <p><strong>Edad:</strong> {paciente.edad === null ? 'Sin registrar' : paciente.edad}</p>
          <p><strong>Teléfono:</strong> {paciente.telefono || 'Sin registrar'}</p>
          <p><strong>Correo:</strong> {paciente.email || 'Sin registrar'}</p>
          <p><strong>Estado:</strong> {paciente.estado}</p>
          <p><strong>Registro:</strong> {formatearFecha(paciente.created_at)}</p>
        </div>
      );
    }
    const tratamiento = detalle.dato;
    return (
      <div className="supply-detail-info">
        <p><strong>Diagnóstico:</strong> {tratamiento.diagnostico}</p>
        <p><strong>Paciente:</strong> {tratamiento.paciente || 'Sin nombre registrado'}</p>
        <p><strong>Doctor:</strong> {tratamiento.doctor || 'Sin asignar'}</p>
        <p><strong>Estado:</strong> {tratamiento.estado}</p>
        <p><strong>Sesiones:</strong> {tratamiento.sesiones_realizadas} de {tratamiento.sesiones}</p>
        <p><strong>Inicio:</strong> {tratamiento.fecha_inicio ? formatearFecha(tratamiento.fecha_inicio) : 'Sin registrar'}</p>
        <p><strong>Estimada:</strong> {tratamiento.fecha_estimada ? formatearFecha(tratamiento.fecha_estimada) : 'Sin registrar'}</p>
      </div>
    );
  };

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="estudiante-dashboard" style={{ '--role-color': '#f59e0b' } as CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Estudiante</h1>
          <div className="ext-actions">
            <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <button className="add-button" onClick={() => void cargarDatos()} disabled={actualizando}>
              <span className="material-icons">refresh</span>
              {actualizando ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">{resumen ? 'Datos registrados en la clínica' : 'Estudiante'}</span>
            <h2>Bienvenido, {userName}</h2>
            <p>Consulta las citas, pacientes, tratamientos y actividad registrados en la base de datos.</p>
          </div>
          <span className="welcome-icon material-icons">school</span>
        </div>

        {cargando ? (
          <div className="ext-empty">
            <span className="material-icons">hourglass_empty</span>
            <h3>Cargando información</h3>
            <p>Consultando el resumen y los registros clínicos.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="ext-form-note">
                <span className="material-icons">error_outline</span>
                <span>{error}</span>
                <button className="view-all-button" onClick={() => void cargarDatos()}>Reintentar</button>
              </div>
            )}

            {resumen && (
              <div className="stats-grid">
                <Card title="Citas registradas" value={resumen.citas} icon="event" color="#0ea5e9" onClick={() => irASeccion('clinica-citas')} />
                <Card title="Pacientes registrados" value={resumen.pacientes} icon="people" color="#16a34a" onClick={() => navigate('/estudiante/pacientes')} />
                <Card title="Tratamientos registrados" value={resumen.tratamientos} icon="medical_services" color="#7c3aed" onClick={() => irASeccion('clinica-tratamientos')} />
                <Card title="Registros de historial" value={resumen.historial} icon="history" color="#f59e0b" onClick={() => irASeccion('clinica-historial')} />
                <Card title="Citas de hoy" value={resumen.citasHoy} icon="event_available" color="#ef4444" onClick={() => navigate('/estudiante/citas')} />
                <Card title="Docentes registrados" value={resumen.docentes} icon="school" color="#0284c7" onClick={() => irASeccion('clinica-equipo')} />
              </div>
            )}

            <div className="dashboard-row">
              <div className="dashboard-col full-width">
                <MiniBars titulo="Tratamientos por estado" datos={tratamientosPorEstado} />
              </div>
            </div>

            <div className="dashboard-row">
              <div className="dashboard-col">
                <div className="dashboard-panel" id="clinica-citas">
                  <div className="panel-header">
                    <h2>Citas registradas</h2>
                    <button className="view-all-button" onClick={() => navigate('/estudiante/citas')}>Ver todas</button>
                  </div>
                  {citas.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">event_busy</span>
                      <h3>Sin citas</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  ) : (
                    <div className="practices-list">
                      {citas.map((cita) => (
                        <div key={cita.id} className="practice-item">
                          <div className="practice-icon">
                            <span className="material-icons">event</span>
                          </div>
                          <div className="practice-details">
                            <div className="practice-name">{cita.tratamiento}</div>
                            <div className="practice-info">
                              <span>{cita.paciente || 'Sin nombre registrado'}</span>
                              <span>{cita.doctor || 'Sin doctor asignado'}</span>
                            </div>
                            <div className="practice-supervisor">{fechaHora(soloFecha(cita.fecha), cita.hora)} · {cita.estado}</div>
                          </div>
                          <button className="quick-action-btn small" onClick={() => setDetalle({ tipo: 'cita', dato: cita })}>
                            <span className="material-icons">visibility</span>
                            <span>Ver</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-col">
                <div className="dashboard-panel" id="clinica-pacientes">
                  <div className="panel-header">
                    <h2>Pacientes registrados</h2>
                    <button className="view-all-button" onClick={() => navigate('/estudiante/pacientes')}>Ver todos</button>
                  </div>
                  {pacientes.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">people</span>
                      <h3>Sin pacientes</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  ) : (
                    <div className="supplies-list">
                      {pacientes.map((paciente) => (
                        <div key={paciente.id} className="supply-item">
                          <div className="supply-icon">
                            <span className="material-icons">person</span>
                          </div>
                          <div className="supply-details">
                            <div className="supply-name">{paciente.nombre}</div>
                            <div className="supply-info">
                              <span>{paciente.edad === null ? 'Edad sin registrar' : `${paciente.edad} años`}</span>
                              <span>{paciente.telefono || 'Sin teléfono'}</span>
                            </div>
                            <div className="supply-semester">Estado: {paciente.estado} · Registro: {formatearFecha(paciente.created_at)}</div>
                          </div>
                          <button className="quick-action-btn small" onClick={() => setDetalle({ tipo: 'paciente', dato: paciente })}>
                            <span className="material-icons">visibility</span>
                            <span>Ver</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-row">
              <div className="dashboard-col">
                <div className="dashboard-panel" id="clinica-tratamientos">
                  <div className="panel-header">
                    <h2>Tratamientos registrados</h2>
                  </div>
                  {tratamientos.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">medical_services</span>
                      <h3>Sin tratamientos</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  ) : (
                    <div className="courses-list">
                      {tratamientos.map((tratamiento) => {
                        const porcentaje = tratamiento.sesiones > 0
                          ? Math.round((tratamiento.sesiones_realizadas / tratamiento.sesiones) * 100)
                          : 0;
                        return (
                          <div key={tratamiento.id} className="course-item">
                            <div className="course-header">
                              <div className="course-name">{tratamiento.diagnostico}</div>
                              <div className="course-instructor">{tratamiento.paciente || 'Sin nombre registrado'} · {tratamiento.estado}</div>
                            </div>
                            <div className="course-progress-container">
                              <div className="course-progress-bar">
                                <div className="course-progress-fill" style={{ width: `${porcentaje}%` }} />
                              </div>
                              <div className="course-progress-text">{tratamiento.sesiones_realizadas}/{tratamiento.sesiones} sesiones · {totalSesiones} en total</div>
                            </div>
                            <button className="quick-action-btn small" onClick={() => setDetalle({ tipo: 'tratamiento', dato: tratamiento })}>
                              <span className="material-icons">visibility</span>
                              <span>Ver</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-col">
                <div className="dashboard-panel" id="clinica-historial">
                  <div className="panel-header">
                    <h2>Historial clínico</h2>
                  </div>
                  {historial.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">history</span>
                      <h3>Sin historial</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  ) : (
                    <div className="practices-list">
                      {historial.map((registro) => (
                        <div key={registro.id} className="practice-item">
                          <div className="practice-icon">
                            <span className="material-icons">description</span>
                          </div>
                          <div className="practice-details">
                            <div className="practice-name">{registro.tratamiento}</div>
                            <div className="practice-info">
                              <span>{registro.paciente || 'Sin nombre registrado'}</span>
                              <span>{registro.doctor || 'Sin doctor registrado'}</span>
                            </div>
                            <div className="practice-supervisor">{formatearFecha(registro.fecha)} · {registro.diagnostico}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-row">
              <div className="dashboard-col">
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h2>Actividad reciente</h2>
                  </div>
                  {actividad.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">history</span>
                      <h3>Sin actividad</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  ) : (
                    <div className="practices-list">
                      {actividad.map((item) => (
                        <div key={item.id} className="practice-item">
                          <div className="practice-icon">
                            <span className="material-icons">{item.icono || 'bolt'}</span>
                          </div>
                          <div className="practice-details">
                            <div className="practice-name">{item.accion}</div>
                            <div className="practice-info"><span>{item.usuario}</span></div>
                            <div className="practice-supervisor">{formatearFecha(item.fecha)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-col" id="clinica-equipo">
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h2>Equipo registrado</h2>
                  </div>
                  {doctores.length === 0 && estudiantes.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">groups</span>
                      <h3>Sin equipo</h3>
                      <p>No hay registros reales registrados.</p>
                    </div>
                  ) : (
                    <div className="supplies-list">
                      {doctores.map((doctor) => (
                        <div key={`doctor-${doctor.id}`} className="supply-item">
                          <div className="supply-icon"><span className="material-icons">medical_services</span></div>
                          <div className="supply-details">
                            <div className="supply-name">{doctor.nombreCompleto || doctor.nombre}</div>
                            <div className="supply-info"><span>Docente</span><span>{doctor.especialidad || 'Sin especialidad'}</span></div>
                          </div>
                        </div>
                      ))}
                      {estudiantes.map((estudiante) => (
                        <div key={`estudiante-${estudiante.id}`} className="supply-item">
                          <div className="supply-icon"><span className="material-icons">school</span></div>
                          <div className="supply-details">
                            <div className="supply-name">{estudiante.nombreCompleto || estudiante.nombre}</div>
                            <div className="supply-info"><span>Estudiante</span><span>{estudiante.semestre || 'Sin semestre'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-row">
              <div className="dashboard-col wide-col">
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h2>Acciones Rápidas</h2>
                  </div>
                  <div className="quick-actions">
                    <button className="quick-action-btn" onClick={() => navigate('/estudiante/citas')}>
                      <span className="material-icons">event</span>
                      <span>Ver citas</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/estudiante/pacientes')}>
                      <span className="material-icons">people</span>
                      <span>Ver pacientes</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/estudiante/practicas')}>
                      <span className="material-icons">science</span>
                      <span>Ver prácticas</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/estudiante/cursos')}>
                      <span className="material-icons">book</span>
                      <span>Ver cursos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {detalle && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>
                  {detalle.tipo === 'cita' ? 'Detalle de la cita'
                    : detalle.tipo === 'paciente' ? 'Detalle del paciente'
                      : 'Detalle del tratamiento'}
                </h2>
                <button className="close-button" onClick={() => setDetalle(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">{renderDetalle()}</div>
              <div className="modal-footer">
                <button className="secondary-button" onClick={() => setDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EstudianteDashboard;
