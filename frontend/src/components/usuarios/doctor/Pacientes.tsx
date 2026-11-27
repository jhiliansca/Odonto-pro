import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Paciente, Tratamiento } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import '../estudiante/Pacientes.css';
import './DoctorPages.css';

type TabPaciente = 'todos' | Paciente['estado'];

interface FormPaciente {
  nombre: string;
  edad: string;
  telefono: string;
  email: string;
  estado: Paciente['estado'];
}

interface CambioEstado {
  id: number;
  estado: Paciente['estado'];
}

const TABS: Array<{ valor: TabPaciente; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'completado', etiqueta: 'Completados' },
];

const FORM_VACIO: FormPaciente = { nombre: '', edad: '', telefono: '', email: '', estado: 'activo' };

function etiquetaEstado(estado: Paciente['estado']): string {
  if (estado === 'activo') return 'Activo';
  if (estado === 'pendiente') return 'Pendiente';
  return 'Completado';
}

function fechaRegistro(fecha: string): string {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? 'No registrada' : valor.toLocaleDateString('es-ES');
}

const DoctorPacientes: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Docente';
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabPaciente>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormPaciente>(FORM_VACIO);
  const [pacienteAEliminar, setPacienteAEliminar] = useState<Paciente | null>(null);
  const [cambioEstado, setCambioEstado] = useState<CambioEstado | null>(null);

  useEffect(() => {
    if (!user) {
      setCargando(false);
      return;
    }
    let activo = true;
    const cargar = async () => {
      try {
        const [pacientesApi, tratamientosApi] = await Promise.all([
          clinicaApi.pacientes(),
          clinicaApi.tratamientos(),
        ]);
        if (!activo) return;
        setPacientes(pacientesApi.filter(paciente => paciente.doctor_id === user.id));
        setTratamientos(tratamientosApi.filter(tratamiento => tratamiento.doctor_id === user.id));
      } catch {
        if (activo) setError('No fue posible cargar los pacientes reales.');
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

  const handleVer = (paciente: Paciente) => {
    setEditandoId(paciente.id);
    setForm({
      nombre: paciente.nombre,
      edad: paciente.edad !== null ? String(paciente.edad) : '',
  telefono: paciente.telefono || '',
      email: paciente.email || '',
      estado: paciente.estado,
    });
    setShowModal(true);
  };

  const guardarPaciente = async () => {
    if (!user || !form.nombre.trim()) {
      setError('El nombre del paciente es obligatorio.');
      return;
    }
    const pacienteActual = editandoId === null ? undefined : pacientes.find(item => item.id === editandoId);
    const payload = {
      nombre: form.nombre.trim(),
      edad: form.edad ? Number(form.edad) : null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      estado: form.estado,
      doctor_id: user.id,
      estudiante_id: pacienteActual?.estudiante_id ?? null,
    };
    try {
      if (editandoId !== null) {
        const actualizado = await clinicaApi.actualizarPaciente(editandoId, payload);
        setPacientes(prev => prev.map(paciente => (paciente.id === actualizado.id ? actualizado : paciente)));
      } else {
        const creado = await clinicaApi.crearPaciente(payload);
        setPacientes(prev => [creado, ...prev]);
      }
      setError(null);
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar el paciente.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pacienteActual = editandoId === null ? undefined : pacientes.find(item => item.id === editandoId);
    if (pacienteActual && pacienteActual.estado !== form.estado) {
      setCambioEstado({ id: pacienteActual.id, estado: form.estado });
      return;
    }
    void guardarPaciente();
  };

  const eliminarPaciente = async (id: number) => {
    try {
      await clinicaApi.eliminarPaciente(id);
      setPacientes(prev => prev.filter(paciente => paciente.id !== id));
      setTratamientos(prev => prev.filter(tratamiento => tratamiento.paciente_id !== id));
      setError(null);
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible eliminar el paciente.');
    }
  };

  const filteredPacientes = pacientes.filter(paciente => {
    const tratamiento = tratamientos.find(item => item.paciente_id === paciente.id);
    const texto = [paciente.nombre, paciente.telefono || '', paciente.email || '', tratamiento?.diagnostico || '']
      .join(' ')
      .toLowerCase();
    const matchesSearch = texto.includes(searchTerm.toLowerCase());
    if (activeTab === 'todos') return matchesSearch;
    return matchesSearch && paciente.estado === activeTab;
  });

  if (!user) {
    return (
      <DashboardLayout userType="doctor" userName={userName}>
        <div className="pacientes-container">
          <div className="page-header"><h1>Gestión de Pacientes</h1></div>
          <EmptyState message="No se pudo identificar al doctor. Inicia sesión nuevamente para ver sus pacientes." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="pacientes-container">
        <div className="page-header">
          <h1>Gestión de Pacientes</h1>
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
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={handleNuevo}>
            <span className="material-icons">person_add</span>
            Nuevo Paciente
          </button>
        </div>

        <div className="pacientes-list">
          {cargando && <LoadingState label="Cargando pacientes..." />}
          {!cargando && filteredPacientes.length === 0 && (
            <EmptyState message="No hay pacientes asignados a este doctor." />
          )}
          {filteredPacientes.map(paciente => {
            const tratamiento = tratamientos.find(item => item.paciente_id === paciente.id);
            return (
              <div key={paciente.id} className={`paciente-card ${paciente.estado}`}>
                <div className="paciente-avatar">{paciente.nombre.charAt(0)}</div>
                <div className="paciente-info">
                  <h3>{paciente.nombre}</h3>
                  <div className="paciente-edad">Edad: {paciente.edad ?? 'No registrada'}</div>
                  <div className="paciente-tratamiento">Tratamiento: {tratamiento?.diagnostico || 'Sin tratamiento registrado'}</div>
                  <div className="paciente-fecha">Registro: {fechaRegistro(paciente.created_at)}</div>
                  <div className="paciente-fecha">Contacto: {paciente.telefono || 'Sin teléfono registrado'} | {paciente.email || 'Sin email registrado'}</div>
                </div>
                <div className="paciente-status">
                  <span className={`status-badge ${paciente.estado}`}>{etiquetaEstado(paciente.estado)}</span>
                </div>
                <div className="paciente-actions">
                  <button className="quick-action-btn small" onClick={() => handleVer(paciente)}>
                    <span className="material-icons">visibility</span>
                    <span>Ver</span>
                  </button>
                  <button className="quick-action-btn small" onClick={() => handleVer(paciente)}>
                    <span className="material-icons">edit</span>
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editandoId !== null ? 'Paciente Registrado' : 'Nuevo Paciente'}</h2>
                <button className="close-button" onClick={cerrarModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre</label>
                    <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleInputChange} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edad">Edad</label>
                      <input id="edad" name="edad" type="number" min="0" value={form.edad} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="estado">Estado</label>
                      <select id="estado" name="estado" value={form.estado} onChange={handleInputChange}>
                        <option value="activo">Activo</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="completado">Completado</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="telefono">Teléfono</label>
                      <input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input id="email" name="email" type="email" value={form.email} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {editandoId !== null && (
                    <button type="button" className="cancel-button" onClick={() => setPacienteAEliminar(pacientes.find(item => item.id === editandoId) || null)}>
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

        {pacienteAEliminar && (
          <ConfirmDialog
            title="Eliminar paciente"
            message={`¿Eliminar a ${pacienteAEliminar.nombre} Se borrarán sus registros asociados.`}
            confirmLabel="Eliminar"
            onConfirm={() => {
              const id = pacienteAEliminar.id;
              setPacienteAEliminar(null);
              void eliminarPaciente(id);
            }}
            onCancel={() => setPacienteAEliminar(null)}
          />
        )}

        {cambioEstado && (
          <ConfirmDialog
            title="Cambiar estado del paciente"
            message={`¿Cambiar el estado a ${etiquetaEstado(cambioEstado.estado)}`}
            confirmLabel="Cambiar estado"
            onConfirm={() => {
              setCambioEstado(null);
              void guardarPaciente();
            }}
            onCancel={() => setCambioEstado(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPacientes;
