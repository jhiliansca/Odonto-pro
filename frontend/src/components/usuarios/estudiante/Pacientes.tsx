import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { ClinicaResumen, Historial, Paciente, Tratamiento } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import './Pacientes.css';
import '../RoleExtra.css';

const ETIQUETAS_ESTADO: Record<Paciente['estado'], string> = { activo: 'Activo',
  pendiente: 'Pendiente',
  completado: 'Completado',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información.';
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

const Pacientes: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Estudiante';
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | Paciente['estado']>('todos');
  const [showModal, setShowModal] = useState(false);
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: '',
    edad: '',
    telefono: '',
    email: '',
    estado: 'activo' as Paciente['estado'],
  });

  const cargarDatos = useCallback(async () => {
    if (!user) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    try {
      const [pacientesData, tratamientosData, historialData, resumenData] = await Promise.all([
        clinicaApi.pacientes(),
        clinicaApi.tratamientos(),
        clinicaApi.historial(),
        clinicaApi.resumen(),
      ]);
      const misPacientes = pacientesData.filter(paciente => paciente.estudiante_id === user.id);
      const ids = new Set(misPacientes.map(paciente => paciente.id));
      setPacientes(misPacientes);
      setTratamientos(tratamientosData.filter(tratamiento => tratamiento.estudiante_id === user.id));
      setHistorial(historialData.filter(registro => ids.has(registro.paciente_id)));
      setResumen(resumenData);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const tratamientosPorPaciente = useMemo(() => {
    const mapa = new Map<number, Tratamiento>();
    tratamientos.forEach((tratamiento) => {
      if (!mapa.has(tratamiento.paciente_id)) mapa.set(tratamiento.paciente_id, tratamiento);
    });
    return mapa;
  }, [tratamientos]);

  const fechasPorPaciente = useMemo(() => {
    const mapa = new Map<number, string>();
    [...historial]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .forEach((registro) => {
        if (!mapa.has(registro.paciente_id)) mapa.set(registro.paciente_id, registro.fecha);
      });
    return mapa;
  }, [historial]);

  const filteredPacientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pacientes.filter((paciente) => {
      const tratamiento = tratamientosPorPaciente.get(paciente.id)?.diagnostico || '';
      const matchesSearch =
        !term ||
        paciente.nombre.toLowerCase().includes(term) ||
        (paciente.telefono || '').includes(term) ||
        (paciente.email || '').toLowerCase().includes(term) ||
        tratamiento.toLowerCase().includes(term);
      const matchesTab = activeTab === 'todos' || paciente.estado === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [pacientes, tratamientosPorPaciente, searchTerm, activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoPaciente((actual) => ({ ...actual, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!nuevoPaciente.nombre.trim()) {
      setError('El nombre del paciente es obligatorio.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await clinicaApi.crearPaciente({
        nombre: nuevoPaciente.nombre.trim(),
        edad: nuevoPaciente.edad ? Number(nuevoPaciente.edad) : null,
        telefono: nuevoPaciente.telefono.trim() || null,
        email: nuevoPaciente.email.trim() || null,
        estado: nuevoPaciente.estado,
        doctor_id: null,
        estudiante_id: user.id,
      });
      setShowModal(false);
      setNuevoPaciente({ nombre: '', edad: '', telefono: '', email: '', estado: 'activo' });
      await cargarDatos();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout userType="estudiante" userName={userName}>
        <div className="pacientes-container">
          <div className="page-header"><h1>Mis Pacientes Asignados</h1></div>
          <EmptyState message="No se pudo identificar al estudiante. Inicia sesión nuevamente para ver sus pacientes." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="pacientes-container">
        <div className="page-header">
          <h1>Mis Pacientes Asignados</h1>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <span className="material-icons">person_add</span>
            <span>Nuevo Paciente</span>
          </button>
        </div>

        {resumen && <div className="date-display">{resumen.pacientes} pacientes registrados en la clínica</div>}

        {error && <ErrorState message={error} onRetry={() => void cargarDatos()} />}

        <div className="filter-container">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>
              Todos
            </button>
            <button className={`tab ${activeTab === 'activo' ? 'active' : ''}`} onClick={() => setActiveTab('activo')}>
              Activos
            </button>
            <button className={`tab ${activeTab === 'pendiente' ? 'active' : ''}`} onClick={() => setActiveTab('pendiente')}>
              Pendientes
            </button>
            <button className={`tab ${activeTab === 'completado' ? 'active' : ''}`} onClick={() => setActiveTab('completado')}>
              Completados
            </button>
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
        </div>

        <div className="pacientes-list">
          {cargando ? (
            <LoadingState label="Cargando pacientes..." />
          ) : filteredPacientes.length === 0 ? (
            <EmptyState message="No hay pacientes asignados a este estudiante." />
          ) : (
            filteredPacientes.map((paciente) => {
              const tratamiento = tratamientosPorPaciente.get(paciente.id)?.diagnostico;
              const fechaHistorial = fechasPorPaciente.get(paciente.id);
              return (
                <div key={paciente.id} className={`paciente-card ${paciente.estado}`}>
                  <div className="paciente-avatar">{paciente.nombre.charAt(0)}</div>
                  <div className="paciente-info">
                    <h3>{paciente.nombre}</h3>
                    <div className="paciente-edad">Edad: {paciente.edad === null ? 'Sin registrar' : paciente.edad} años</div>
                    <div className="paciente-tratamiento">Tratamiento: {tratamiento || 'Sin tratamiento registrado'}</div>
                    <div className="paciente-fecha"> Fecha: {fechaHistorial ? formatearFecha(fechaHistorial) : formatearFecha(paciente.created_at)}
                    </div>
                    <div className="paciente-telefono">Teléfono: {paciente.telefono || 'Sin registrar'}</div>
                  </div>
                  <div className="paciente-status">
                    <span className={`status-badge ${paciente.estado}`}>{ETIQUETAS_ESTADO[paciente.estado]}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Nuevo Paciente</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input type="text" name="nombre" value={nuevoPaciente.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Edad</label>
                  <input type="number" name="edad" min="0" value={nuevoPaciente.edad} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" name="telefono" value={nuevoPaciente.telefono} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Correo electrónico</label>
                  <input type="email" name="email" value={nuevoPaciente.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={nuevoPaciente.estado} onChange={handleChange}>
                    <option value="activo">Activo</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Registrar Paciente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pacientes;
