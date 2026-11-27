import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Cita, Paciente, Persona } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import ConfirmDialog from '../../ui/ConfirmDialog';
import '../RoleExtra.css';
import '../administrador/Citas.css';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const ETIQUETAS_ESTADO: Record<Cita['estado'], string> = { pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Atendida',
  cancelada: 'Cancelada',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información.';
}

function fechaISO(date: Date): string {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} ${MESES_CORTOS[mes - 1] || ''} ${anio}`;
}

interface AccionEstado {
  id: number;
  estado: Cita['estado'];
}

const Citas: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Recepcionista';
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Persona[]>([]);
  const [activeTab, setActiveTab] = useState<'todas' | Cita['estado']>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [accion, setAccion] = useState<AccionEstado | null>(null);
  const [nuevaCita, setNuevaCita] = useState({
    pacienteId: '',
    telefono: '',
    fecha: fechaISO(new Date()),
    hora: '',
    tratamiento: '',
    doctorId: '',
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [citasData, pacientesData, doctoresData] = await Promise.all([
        clinicaApi.citas(),
        clinicaApi.pacientes(),
        clinicaApi.doctores(),
      ]);
      setCitas(citasData);
      setPacientes(pacientesData);
      setDoctores(doctoresData);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const filtradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return citas
      .filter((cita) => {
        const matchesTab = activeTab === 'todas' || cita.estado === activeTab;
        const matchesSearch =
          !term ||
          (cita.paciente || '').toLowerCase().includes(term) ||
          (cita.doctor || '').toLowerCase().includes(term) ||
          cita.tratamiento.toLowerCase().includes(term);
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  }, [citas, activeTab, searchTerm]);

  const conteos = useMemo(() => ({
    todas: citas.length,
    pendiente: citas.filter((cita) => cita.estado === 'pendiente').length,
  confirmada: citas.filter((cita) => cita.estado === 'confirmada').length,
  completada: citas.filter((cita) => cita.estado === 'completada').length,
  cancelada: citas.filter((cita) => cita.estado === 'cancelada').length,
  }), [citas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'pacienteId') {
      const paciente = pacientes.find((item) => String(item.id) === value);
      setNuevaCita((actual) => ({ ...actual, pacienteId: value, telefono: paciente?.telefono || '' }));
      return;
    }
    setNuevaCita((actual) => ({ ...actual, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await clinicaApi.crearCita({
        pacienteId: Number(nuevaCita.pacienteId),
        doctor_id: nuevaCita.doctorId ? Number(nuevaCita.doctorId) : null,
        fecha: nuevaCita.fecha,
        hora: nuevaCita.hora,
        tratamiento: nuevaCita.tratamiento.trim(),
        telefono: nuevaCita.telefono || null,
      });
      setShowModal(false);
      setNuevaCita({ pacienteId: '', telefono: '', fecha: fechaISO(new Date()), hora: '', tratamiento: '', doctorId: '' });
      await cargarDatos();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async () => {
    if (!accion) return;
    const { id, estado } = accion;
    setAccion(null);
    setError('');
    try {
      await clinicaApi.cambiarEstadoCita(id, estado);
      await cargarDatos();
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  return (
    <DashboardLayout userType="recepcionista" userName={userName}>
      <div className="ext-page citas-page">
        <div className="ext-header citas-hero">
          <div>
            <h1>Agenda de Citas</h1>
            <p className="ext-sub">Programa, confirma y controla la llegada de los pacientes a la clínica.</p>
          </div>
          <div className="ext-actions">
            <button className="add-button" onClick={() => setShowModal(true)}>
              <span className="material-icons">add_circle</span>
              Nueva Cita
            </button>
          </div>
        </div>

        {error && (
          <div className="ext-form-note">
            <span className="material-icons">error_outline</span>
            <span>{error}</span>
            <button className="view-all-button" onClick={() => void cargarDatos()}>Reintentar</button>
          </div>
        )}

        <div className="ext-stats">
          <div className="ext-stat" style={{ '--stat-color': '#0ea5e9' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">event</span></span>
            <div><strong>{conteos.todas}</strong><span>Citas registradas</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#f59e0b' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">pending_actions</span></span>
            <div><strong>{conteos.pendiente}</strong><span>Por confirmar</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#0284c7' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">event_available</span></span>
            <div><strong>{conteos.confirmada}</strong><span>Confirmadas</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#16a34a' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">task_alt</span></span>
            <div><strong>{conteos.completada}</strong><span>Atendidas</span></div>
          </div>
        </div>

        <div className="ext-toolbar">
          <div className="tabs">
            {(['todas', 'pendiente', 'confirmada', 'completada', 'cancelada'] as const).map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'todas' ? 'Todas' : ETIQUETAS_ESTADO[tab]}
                <span className="ext-tab-count">{conteos[tab]}</span>
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar paciente, doctor o tratamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ext-card">
          {cargando ? (
            <div className="ext-empty">
              <span className="material-icons">hourglass_empty</span>
              <h3>Cargando citas</h3>
            </div>
          ) : filtradas.length > 0 ? (
            <div className="ext-table-wrap">
              <table className="ext-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Paciente</th>
                    <th>Tratamiento</th>
                    <th>Doctor</th>
                    <th>Estado</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((cita) => (
                    <tr key={cita.id}>
                      <td>
                        <div className="ext-name">
                          <span className="ext-avatar">{cita.hora}</span>
                          <div>
                            <strong>{formatearFecha(cita.fecha)}</strong>
                            <span>{cita.hora}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ext-name">
                          <span className="ext-avatar">{cita.paciente.charAt(0) || ''}</span>
                          <div>
                            <strong>{cita.paciente || 'Sin nombre registrado'}</strong>
                            <span>{cita.telefono || 'Sin teléfono'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{cita.tratamiento}</td>
                      <td className="ext-muted">{cita.doctor || 'Sin doctor asignado'}</td>
                      <td>
                        <span className={`ext-pill ${cita.estado}`}>{ETIQUETAS_ESTADO[cita.estado]}</span>
                      </td>
                      <td>
                        <div className="ext-actions-cell">
                          {cita.estado === 'pendiente' && (
                            <button className="icon-button" aria-label="Confirmar cita" onClick={() => setAccion({ id: cita.id, estado: 'confirmada' })}>
                              <span className="material-icons">check</span>
                            </button>
                          )}
                          {cita.estado === 'confirmada' && (
                            <button className="icon-button" aria-label="Marcar como atendida" onClick={() => setAccion({ id: cita.id, estado: 'completada' })}>
                              <span className="material-icons">task_alt</span>
                            </button>
                          )}
                          {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                            <button className="icon-button danger" aria-label="Cancelar cita" onClick={() => setAccion({ id: cita.id, estado: 'cancelada' })}>
                              <span className="material-icons">cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ext-empty">
              <span className="material-icons">event_busy</span>
              <h3>Sin citas</h3>
              <p>No hay registros reales registrados.</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>Nueva Cita</h2>
                  <p className="ext-sub" style={{ marginTop: '0.2rem' }}>Registra la cita y quedará como pendiente de confirmación.</p>
                </div>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="modal-body">
                  <div className="ext-form-note">
                    <span className="material-icons">info</span>
                    <span>Verifica la disponibilidad del doctor antes de confirmar la cita.</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pacienteId">Paciente*</label>
                    <select id="pacienteId" name="pacienteId" value={nuevaCita.pacienteId} onChange={handleChange} required>
                      <option value="">Seleccionar paciente</option>
                      {pacientes.map((paciente) => (
                        <option key={paciente.id} value={paciente.id}>{paciente.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="telefono">Teléfono</label>
                      <input id="telefono" name="telefono" type="tel" value={nuevaCita.telefono} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="tratamiento">Tratamiento*</label>
                      <input id="tratamiento" name="tratamiento" type="text" value={nuevaCita.tratamiento} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fecha">Fecha*</label>
                      <input id="fecha" name="fecha" type="date" value={nuevaCita.fecha} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="hora">Hora*</label>
                      <input id="hora" name="hora" type="time" value={nuevaCita.hora} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="doctorId">Doctor asignado</label>
                    <select id="doctorId" name="doctorId" value={nuevaCita.doctorId} onChange={handleChange}>
                      <option value="">Sin doctor asignado</option>
                      {doctores.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>{doctor.nombreCompleto || doctor.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={guardando || pacientes.length === 0}>
                    {guardando ? 'Guardando...' : 'Programar Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {accion && (
          <ConfirmDialog
            title={accion.estado === 'cancelada' ? 'Cancelar cita' : 'Cambiar estado de la cita'}
            message={
              accion.estado === 'cancelada' ? '¿Cancelar esta cita Esta acción no se puede deshacer.'
                : '?Cambiar el estado de la cita?'
            }
            confirmLabel={accion.estado === 'cancelada' ? 'Cancelar cita' : 'Cambiar estado'}
            onConfirm={() => void cambiarEstado()}
            onCancel={() => setAccion(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Citas;
