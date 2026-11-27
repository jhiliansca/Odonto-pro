import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Cita, Paciente } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import '../estudiante/Citas.css';
import './DoctorPages.css';

type TabCita = 'todas' | Cita['estado'];

interface FormCita {
  pacienteId: string;
  fecha: string;
  hora: string;
  tratamiento: string;
}

interface AccionCita {
  tipo: 'confirmar' | 'cancelar' | 'eliminar';
  cita: Cita;
}

const TABS: Array<{ valor: TabCita; etiqueta: string }> = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'confirmada', etiqueta: 'Confirmadas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'completada', etiqueta: 'Completadas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
];

const FORM_VACIO: FormCita = { pacienteId: '', fecha: '', hora: '', tratamiento: '' };

function etiquetaEstado(estado: Cita['estado']): string {
  if (estado === 'confirmada') return 'Confirmada';
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'completada') return 'Completada';
  return 'Cancelada';
}

function diaFecha(fecha: string): string {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? '--' : String(valor.getDate());
}

function mesFecha(fecha: string): string {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? '--' : valor.toLocaleString('es-ES', { month: 'short' });
}

const DoctorCitas: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Docente';
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Cita | null>(null);
  const [activeTab, setActiveTab] = useState<TabCita>('todas');
  const [newCita, setNewCita] = useState<FormCita>(FORM_VACIO);
  const [accion, setAccion] = useState<AccionCita | null>(null);

  useEffect(() => {
    if (!user) {
      setCargando(false);
      return;
    }
    let activo = true;
    const cargar = async () => {
      try {
        const [citasApi, pacientesApi] = await Promise.all([clinicaApi.citas(), clinicaApi.pacientes()]);
        if (!activo) return;
        setCitas(citasApi.filter(cita => cita.doctor_id === user.id));
        setPacientes(pacientesApi.filter(paciente => paciente.doctor_id === user.id));
      } catch {
        if (activo) setError('No fue posible cargar las citas reales.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    void cargar();
    return () => {
      activo = false;
    };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCita(prev => ({ ...prev, [name]: value }));
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditandoId(null);
    setNewCita(FORM_VACIO);
  };

  const handleNueva = () => {
    setEditandoId(null);
    setNewCita(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (cita: Cita) => {
    setEditandoId(cita.id);
    setNewCita({
      pacienteId: String(cita.paciente_id),
      fecha: cita.fecha.slice(0, 10),
      hora: cita.hora.slice(0, 5),
      tratamiento: cita.tratamiento,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const pacienteId = Number(newCita.pacienteId);
    if (!pacienteId || !newCita.fecha || !newCita.hora || !newCita.tratamiento.trim()) {
      setError('Completa todos los datos obligatorios de la cita.');
      return;
    }
    try {
      const payload = {
        pacienteId,
        doctor_id: user.id,
        estudiante_id: null,
        fecha: newCita.fecha,
        hora: newCita.hora,
        tratamiento: newCita.tratamiento.trim(),
      };
      if (editandoId !== null) {
        const actualizada = await clinicaApi.actualizarCita(editandoId, payload);
        setCitas(prev => prev.map(cita => (cita.id === actualizada.id ? actualizada : cita)));
      } else {
        const creada = await clinicaApi.crearCita(payload);
        setCitas(prev => [creada, ...prev]);
      }
      setError(null);
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar la cita.');
    }
  };

  const ejecutarAccion = async () => {
    if (!accion) return;
    const { cita, tipo } = accion;
    setAccion(null);
    try {
      if (tipo === 'eliminar') {
        await clinicaApi.eliminarCita(cita.id);
        setCitas(prev => prev.filter(item => item.id !== cita.id));
      } else {
        const estado = tipo === 'confirmar' ? 'confirmada' : 'cancelada';
        const actualizada = await clinicaApi.cambiarEstadoCita(cita.id, estado);
        setCitas(prev => prev.map(item => (item.id === actualizada.id ? actualizada : item)));
      }
      setError(null);
      cerrarModal();
      setDetalle(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la cita.');
    }
  };

  const filteredCitas = citas.filter(cita => activeTab === 'todas' || cita.estado === activeTab);

  if (!user) {
    return (
      <DashboardLayout userType="doctor" userName={userName}>
        <div className="citas-container">
          <div className="page-header"><h1>Mis Citas</h1></div>
          <EmptyState message="No se pudo identificar al doctor. Inicia sesión nuevamente para ver sus citas." />
        </div>
      </DashboardLayout>
    );
  }

  const mensajeAccion = accion
    ? accion.tipo === 'eliminar'
      ? `¿Eliminar la cita de ${accion.cita.paciente || `Paciente #${accion.cita.paciente_id}`}?`
      : accion.tipo === 'confirmar'
        ? `¿Confirmar la cita de ${accion.cita.paciente || `Paciente #${accion.cita.paciente_id}`}?`
        : `¿Cancelar la cita de ${accion.cita.paciente || `Paciente #${accion.cita.paciente_id}`}?`
    : '';

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="citas-container">
        <div className="page-header">
          <h1>Mis Citas</h1>
          <button className="add-button" onClick={handleNueva}>
            <span className="material-icons">add</span>
            <span>Nueva Cita</span>
          </button>
        </div>

        {error && <ErrorState message={error} />}

        <div className="filter-container">
          <div className="tabs">
            {TABS.map(tab => (
              <button
                key={tab.valor}
                className={`tab ${activeTab === tab.valor ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.valor)}
              >
                {tab.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="citas-list">
          <h2>Agenda de Consultas</h2>
          {cargando && <LoadingState label="Cargando citas..." />}
          {!cargando && filteredCitas.length === 0 && (
            <EmptyState message="No hay citas asignadas a este doctor." />
          )}
          {filteredCitas.map(cita => (
            <div key={cita.id} className={`cita-card ${cita.estado}`}>
              <div className="cita-fecha">
                <div className="fecha-dia">{diaFecha(cita.fecha)}</div>
                <div className="fecha-mes">{mesFecha(cita.fecha)}</div>
              </div>
              <div className="cita-info">
                <h3>{cita.paciente ?? `Paciente #${cita.paciente_id}`}</h3>
                <div className="cita-detalles">
                  <div className="cita-hora">
                    <span className="material-icons">schedule</span>
                    <span>{cita.hora.slice(0, 5)}</span>
                  </div>
                  <div className="cita-tratamiento">
                    <span className="material-icons">medical_services</span>
                    <span>{cita.tratamiento}</span>
                  </div>
                  <div className="cita-supervisor">
                    <span className="material-icons">call</span>
                    <span>{cita.telefono ?? 'Sin teléfono registrado'}</span>
                  </div>
                </div>
              </div>
              <div className="cita-estado">
                <span className={`status-badge ${cita.estado}`}>{etiquetaEstado(cita.estado)}</span>
              </div>
              <div className="cita-acciones">
                {cita.estado === 'pendiente' && (
                  <button className="quick-action-btn small" onClick={() => setAccion({ tipo: 'confirmar', cita })}>
                    <span className="material-icons">check</span>
                    <span>Confirmar</span>
                  </button>
                )}
                {cita.estado === 'confirmada' && (
                  <button className="quick-action-btn small" onClick={() => setAccion({ tipo: 'cancelar', cita })}>
                    <span className="material-icons">cancel</span>
                    <span>Cancelar</span>
                  </button>
                )}
                <button className="icon-button" aria-label="Ver cita" onClick={() => setDetalle(cita)}>
                  <span className="material-icons">visibility</span>
                </button>
                <button className="icon-button" aria-label="Editar cita" onClick={() => handleEditar(cita)}>
                  <span className="material-icons">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {detalle && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Detalle de la Cita</h2>
                <button className="close-button" onClick={() => setDetalle(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Paciente:</strong> {detalle.paciente ?? `Paciente #${detalle.paciente_id}`}</p>
                <p><strong>Fecha:</strong> {detalle.fecha}</p>
                <p><strong>Hora:</strong> {detalle.hora.slice(0, 5)}</p>
                <p><strong>Tratamiento:</strong> {detalle.tratamiento}</p>
                <p><strong>Estado:</strong> {etiquetaEstado(detalle.estado)}</p>
                <p><strong>Teléfono:</strong> {detalle.telefono ?? 'Sin teléfono registrado'}</p>
                <p><strong>Doctor:</strong> {detalle.doctor || 'Sin doctor registrado'}</p>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editandoId !== null ? 'Editar Cita' : 'Agendar Nueva Cita'}</h2>
                <button className="close-button" onClick={cerrarModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="paciente">Paciente</label>
                    <select id="paciente" name="pacienteId" value={newCita.pacienteId} onChange={handleInputChange} required>
                      <option value="">Seleccionar paciente</option>
                      {pacientes.map(paciente => (
                        <option key={paciente.id} value={paciente.id}>{paciente.nombre}</option>
                      ))}
                    </select>
                    {pacientes.length === 0 && <p>No hay pacientes asignados a este doctor.</p>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fecha">Fecha</label>
                      <input type="date" id="fecha" name="fecha" value={newCita.fecha} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="hora">Hora</label>
                      <input type="time" id="hora" name="hora" value={newCita.hora} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tratamiento">Tratamiento</label>
                    <input
                      type="text"
                      id="tratamiento"
                      name="tratamiento"
                      value={newCita.tratamiento}
                      onChange={handleInputChange}
                      placeholder="Tratamiento registrado en la cita"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  {editandoId !== null && (
                    <button type="button" className="cancel-button" onClick={() => {
                      const cita = citas.find(item => item.id === editandoId);
                      if (cita) setAccion({ tipo: 'eliminar', cita });
                    }}>
                      Eliminar
                    </button>
                  )}
                  <button type="button" className="cancel-button" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="submit-button">{editandoId !== null ? 'Guardar' : 'Agendar Cita'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {accion && (
          <ConfirmDialog
            title={accion.tipo === 'eliminar' ? 'Eliminar cita' : accion.tipo === 'confirmar' ? 'Confirmar cita' : 'Cancelar cita'}
            message={mensajeAccion}
            confirmLabel={accion.tipo === 'eliminar' ? 'Eliminar' : accion.tipo === 'confirmar' ? 'Confirmar' : 'Cancelar cita'}
            onConfirm={() => void ejecutarAccion()}
            onCancel={() => setAccion(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorCitas;
