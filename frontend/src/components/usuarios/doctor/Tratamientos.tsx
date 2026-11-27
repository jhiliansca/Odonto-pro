import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Paciente, Tratamiento } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import { formatBs } from '../../../utils/formato';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import './DoctorPages.css';

type TabTratamiento = 'todos' | Tratamiento['estado'];

interface FormTratamiento {
  pacienteId: string;
  diagnostico: string;
  fechaInicio: string;
  fechaEstimada: string;
  costo: string;
  estado: Tratamiento['estado'];
  sesiones: string;
  sesionesRealizadas: string;
}

interface CambioEstado {
  id: number;
  estado: Tratamiento['estado'];
}

const TABS: Array<{ valor: TabTratamiento; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'completado', etiqueta: 'Completados' },
];

const FORM_VACIO: FormTratamiento = {
  pacienteId: '',
  diagnostico: '',
  fechaInicio: '',
  fechaEstimada: '',
  costo: '',
  estado: 'pendiente',
  sesiones: '1',
  sesionesRealizadas: '0',
};

function etiquetaEstado(estado: Tratamiento['estado']): string {
  if (estado === 'activo') return 'Activo';
  if (estado === 'pendiente') return 'Pendiente';
  return 'Completado';
}

function fechaLegible(fecha: string | null): string {
  if (!fecha) return 'No registrada';
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? 'No registrada' : valor.toLocaleDateString('es-ES');
}

const DoctorTratamientos: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Docente';
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabTratamiento>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormTratamiento>(FORM_VACIO);
  const [tratamientoAEliminar, setTratamientoAEliminar] = useState<Tratamiento | null>(null);
  const [cambioEstado, setCambioEstado] = useState<CambioEstado | null>(null);

  useEffect(() => {
    if (!user) {
      setCargando(false);
      return;
    }
    let activo = true;
    const cargar = async () => {
      try {
        const [tratamientosApi, pacientesApi] = await Promise.all([
          clinicaApi.tratamientos(),
          clinicaApi.pacientes(),
        ]);
        if (!activo) return;
        setTratamientos(tratamientosApi.filter(tratamiento => tratamiento.doctor_id === user.id));
        setPacientes(pacientesApi.filter(paciente => paciente.doctor_id === user.id));
      } catch {
        if (activo) setError('No fue posible cargar los tratamientos reales.');
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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
  };

  const handleNuevo = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setShowModal(true);
  };

  const handleVer = (tratamiento: Tratamiento) => {
    setEditandoId(tratamiento.id);
    setForm({
      pacienteId: String(tratamiento.paciente_id),
      diagnostico: tratamiento.diagnostico,
      fechaInicio: tratamiento.fecha_inicio || '',
      fechaEstimada: tratamiento.fecha_estimada || '',
      costo: String(tratamiento.costo),
      estado: tratamiento.estado,
      sesiones: String(tratamiento.sesiones),
      sesionesRealizadas: String(tratamiento.sesiones_realizadas),
    });
    setShowModal(true);
  };

  const guardarTratamiento = async () => {
    if (!user) return;
    const pacienteId = Number(form.pacienteId);
    if (!pacienteId || !form.diagnostico.trim()) {
      setError('Selecciona un paciente e indica el diagnóstico.');
      return;
    }
    const tratamientoActual = editandoId === null ? undefined
      : tratamientos.find(item => item.id === editandoId);
    try {
      const payload = {
        pacienteId,
        doctor_id: user.id,
        estudiante_id: tratamientoActual?.estudiante_id ?? null,
        diagnostico: form.diagnostico.trim(),
        fecha_inicio: form.fechaInicio || null,
        fecha_estimada: form.fechaEstimada || null,
        costo: Number(form.costo) || 0,
        estado: form.estado,
        sesiones: Number(form.sesiones) || 1,
        sesiones_realizadas: Number(form.sesionesRealizadas) || 0,
      };
      if (editandoId !== null) {
        const actualizado = await clinicaApi.actualizarTratamiento(editandoId, payload);
        setTratamientos(prev => prev.map(item => (item.id === actualizado.id ? actualizado : item)));
      } else {
        const creado = await clinicaApi.crearTratamiento(payload);
        setTratamientos(prev => [creado, ...prev]);
      }
      setError(null);
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar el tratamiento.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tratamientoActual = editandoId === null ? undefined
      : tratamientos.find(item => item.id === editandoId);
    if (tratamientoActual && tratamientoActual.estado !== form.estado) {
      setCambioEstado({ id: tratamientoActual.id, estado: form.estado });
      return;
    }
    void guardarTratamiento();
  };

  const eliminarTratamiento = async (id: number) => {
    try {
      await clinicaApi.eliminarTratamiento(id);
      setTratamientos(prev => prev.filter(item => item.id !== id));
      setError(null);
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible eliminar el tratamiento.');
    }
  };

  const filteredTratamientos = tratamientos.filter(tratamiento => {
    const texto = `${tratamiento.paciente || ''} ${tratamiento.diagnostico}`.toLowerCase();
    const matchesSearch = texto.includes(searchTerm.toLowerCase());
    if (activeTab === 'todos') return matchesSearch;
    return matchesSearch && tratamiento.estado === activeTab;
  });

  if (!user) {
    return (
      <DashboardLayout userType="doctor" userName={userName}>
        <div className="doctor-page-container">
          <div className="page-header"><h1>Tratamientos</h1></div>
          <EmptyState message="No se pudo identificar al doctor. Inicia sesión nuevamente para ver sus tratamientos." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="doctor-page-container">
        <div className="page-header">
          <h1>Tratamientos</h1>
          <button className="add-button" onClick={handleNuevo}>
            <span className="material-icons">add_circle</span>
            Nuevo Tratamiento
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
          <div className="search-box">
            <span className="material-icons">search</span>
            <input type="text" placeholder="Buscar tratamiento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="doctor-grid">
          {cargando && <LoadingState label="Cargando tratamientos..." />}
          {!cargando && filteredTratamientos.length === 0 && (
            <EmptyState message="No hay tratamientos registrados para este doctor." />
          )}
          {filteredTratamientos.map(tratamiento => (
            <div key={tratamiento.id} className={`doctor-card ${tratamiento.estado}`}>
              <div className="doctor-avatar">
                <span className="material-icons">healing</span>
              </div>
              <div className="doctor-info">
                <h3>{tratamiento.paciente || `Paciente #${tratamiento.paciente_id}`}</h3>
                <p className="doctor-especialidad">{tratamiento.diagnostico}</p>
                <p className="doctor-email">Inicio: {fechaLegible(tratamiento.fecha_inicio)} | Estimado: {fechaLegible(tratamiento.fecha_estimada)}</p>
                <div className="doctor-meta">
                  <span className="doctor-pacientes">
                    <span className="material-icons">event</span>
                    {tratamiento.sesiones_realizadas}/{tratamiento.sesiones} sesiones
                  </span>
                  <span className={`status-badge ${tratamiento.estado}`}>{etiquetaEstado(tratamiento.estado)}</span>
                </div>
                <p className="doctor-email" style={{ marginTop: '0.5rem' }}>Costo: {formatBs(tratamiento.costo)}</p>
                <p className="doctor-email">Doctor: {tratamiento.doctor || 'Sin doctor registrado'}</p>
              </div>
              <div className="doctor-actions">
                <button className="quick-action-btn small" onClick={() => handleVer(tratamiento)}>
                  <span className="material-icons">visibility</span>
                  <span>Ver</span>
                </button>
                <button className="quick-action-btn small" onClick={() => handleVer(tratamiento)}>
                  <span className="material-icons">edit</span>
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editandoId !== null ? 'Tratamiento Registrado' : 'Nuevo Tratamiento'}</h2>
                <button className="close-button" onClick={cerrarModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="paciente">Paciente</label>
                    <select id="paciente" name="pacienteId" value={form.pacienteId} onChange={handleInputChange} required>
                      <option value="">Seleccionar paciente</option>
                      {pacientes.map(paciente => (
                        <option key={paciente.id} value={paciente.id}>{paciente.nombre}</option>
                      ))}
                    </select>
                    {pacientes.length === 0 && <p>No hay pacientes asignados a este doctor.</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="diagnostico">Diagnóstico</label>
                    <input id="diagnostico" name="diagnostico" type="text" value={form.diagnostico} onChange={handleInputChange} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fechaInicio">Fecha de inicio</label>
                      <input id="fechaInicio" name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="fechaEstimada">Fecha estimada</label>
                      <input id="fechaEstimada" name="fechaEstimada" type="date" value={form.fechaEstimada} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="costo">Costo</label>
                      <input id="costo" name="costo" type="number" min="0" value={form.costo} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="estado">Estado</label>
                      <select id="estado" name="estado" value={form.estado} onChange={handleInputChange}>
                        <option value="pendiente">Pendiente</option>
                        <option value="activo">Activo</option>
                        <option value="completado">Completado</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="sesiones">Sesiones</label>
                      <input id="sesiones" name="sesiones" type="number" min="1" value={form.sesiones} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sesionesRealizadas">Sesiones realizadas</label>
                      <input id="sesionesRealizadas" name="sesionesRealizadas" type="number" min="0" value={form.sesionesRealizadas} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {editandoId !== null && (
                    <button type="button" className="cancel-button" onClick={() => {
                      const tratamiento = tratamientos.find(item => item.id === editandoId);
                      if (tratamiento) setTratamientoAEliminar(tratamiento);
                    }}>
                      Eliminar
                    </button>
                  )}
                  <button type="button" className="cancel-button" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="submit-button">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tratamientoAEliminar && (
          <ConfirmDialog
            title="Eliminar tratamiento"
            message={'?Eliminar el tratamiento "' + tratamientoAEliminar.diagnostico + '"?'}
            confirmLabel="Eliminar"
            onConfirm={() => {
              const id = tratamientoAEliminar.id;
              setTratamientoAEliminar(null);
              void eliminarTratamiento(id);
            }}
            onCancel={() => setTratamientoAEliminar(null)}
          />
        )}

        {cambioEstado && (
          <ConfirmDialog
            title="Cambiar estado del tratamiento"
            message={'?Cambiar el estado a ' + etiquetaEstado(cambioEstado.estado) + '?'}
            confirmLabel="Cambiar estado"
            onConfirm={() => {
              setCambioEstado(null);
              void guardarTratamiento();
            }}
            onCancel={() => setCambioEstado(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorTratamientos;
