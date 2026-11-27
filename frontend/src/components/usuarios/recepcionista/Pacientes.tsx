import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { ClinicaResumen, Historial, Paciente, PacientePayload, Tratamiento } from '../../../services/clinicaApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
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

function esEsteMes(fecha: string): boolean {
  const ahora = new Date();
  const [anio, mes] = fecha.slice(0, 10).split('-').map(Number);
  return anio === ahora.getFullYear() && mes === ahora.getMonth() + 1;
}

interface PacientesProps {
  userType?: 'recepcionista' | 'administrador';
}

const Pacientes: React.FC<PacientesProps> = ({ userType = 'recepcionista' }) => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Recepcionista');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [activeTab, setActiveTab] = useState<'todos' | Paciente['estado']>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    edad: '',
    telefono: '',
    email: '',
    estado: 'activo' as Paciente['estado'],
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [pacientesData, tratamientosData, historialData, resumenData] = await Promise.all([
        clinicaApi.pacientes(),
        clinicaApi.tratamientos(),
        clinicaApi.historial(),
        clinicaApi.resumen(),
      ]);
      setPacientes(pacientesData);
      setTratamientos(tratamientosData);
      setHistorial(historialData);
      setResumen(resumenData);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

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

  const visitasPorPaciente = useMemo(() => {
    const mapa = new Map<number, string>();
    [...historial]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .forEach((registro) => {
        if (!mapa.has(registro.paciente_id)) mapa.set(registro.paciente_id, registro.fecha);
      });
    return mapa;
  }, [historial]);

  const filtrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pacientes.filter((paciente) => {
      const matchesTab = activeTab === 'todos' || paciente.estado === activeTab;
      const matchesSearch =
        !term ||
        paciente.nombre.toLowerCase().includes(term) ||
        (paciente.telefono || '').includes(term) ||
        (paciente.email || '').toLowerCase().includes(term) ||
        String(paciente.id).includes(term);
      return matchesTab && matchesSearch;
    });
  }, [pacientes, activeTab, searchTerm]);

  const activos = pacientes.filter((paciente) => paciente.estado === 'activo').length;
  const pendientes = pacientes.filter((paciente) => paciente.estado === 'pendiente').length;
  const completados = pacientes.filter((paciente) => paciente.estado === 'completado').length;
  const nuevosEsteMes = pacientes.filter((paciente) => esEsteMes(paciente.created_at)).length;

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario({ nombre: '', edad: '', telefono: '', email: '', estado: 'activo' });
    setShowModal(true);
  };

  const abrirEdicion = (paciente: Paciente) => {
    setEditando(paciente);
    setFormulario({
      nombre: paciente.nombre,
      edad: paciente.edad === null ? '' : String(paciente.edad),
      telefono: paciente.telefono || '',
      email: paciente.email || '',
      estado: paciente.estado,
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const payload: PacientePayload = {
      nombre: formulario.nombre.trim(),
      edad: formulario.edad ? Number(formulario.edad) : null,
      telefono: formulario.telefono || null,
      email: formulario.email || null,
      estado: formulario.estado,
      doctor_id: editando?.doctor_id ?? null,
      estudiante_id: editando?.estudiante_id ?? null,
    };
    try {
      if (editando) {
        await clinicaApi.actualizarPaciente(editando.id, payload);
      } else {
        await clinicaApi.crearPaciente(payload);
      }
      setShowModal(false);
      await cargarDatos();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <DashboardLayout userType={userType} userName={userName}>
      <div className="ext-page">
        <div className="ext-header">
          <div>
            <h1>Pacientes</h1>
            <p className="ext-sub">Registra y consulta la información de contacto de los pacientes de la clínica.</p>
          </div>
          <div className="ext-actions">
            <button className="add-button" onClick={abrirNuevo}>
              <span className="material-icons">person_add</span>
              Nuevo Paciente
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
            <span className="ext-stat-icon"><span className="material-icons">groups</span></span>
            <div><strong>{resumen?.pacientes ?? pacientes.length}</strong><span>Pacientes registrados</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#16a34a' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">how_to_reg</span></span>
            <div><strong>{activos}</strong><span>Activos</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#f59e0b' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">pending_actions</span></span>
            <div><strong>{pendientes}</strong><span>Pendientes</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#db2777' } as CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">calendar_month</span></span>
            <div><strong>{nuevosEsteMes}</strong><span>Nuevos este mes</span></div>
          </div>
        </div>

        <div className="ext-toolbar">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>
              Todos <span className="ext-tab-count">{pacientes.length}</span>
            </button>
            <button className={`tab ${activeTab === 'activo' ? 'active' : ''}`} onClick={() => setActiveTab('activo')}>
              Activos <span className="ext-tab-count">{activos}</span>
            </button>
            <button className={`tab ${activeTab === 'pendiente' ? 'active' : ''}`} onClick={() => setActiveTab('pendiente')}>
              Pendientes <span className="ext-tab-count">{pendientes}</span>
            </button>
            <button className={`tab ${activeTab === 'completado' ? 'active' : ''}`} onClick={() => setActiveTab('completado')}>
              Completados <span className="ext-tab-count">{completados}</span>
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar por nombre, registro o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ext-card">
          {cargando ? (
            <div className="ext-empty">
              <span className="material-icons">hourglass_empty</span>
              <h3>Cargando pacientes</h3>
            </div>
          ) : filtrados.length > 0 ? (
            <div className="ext-table-wrap">
              <table className="ext-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Registro</th>
                    <th>Contacto</th>
                    <th>Última visita</th>
                    <th>Estado</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((paciente) => (
                    <tr key={paciente.id}>
                      <td>
                        <div className="ext-name">
                          <span className="ext-avatar">{paciente.nombre.charAt(0)}</span>
                          <div>
                            <strong>{paciente.nombre}</strong>
                            <span>{paciente.email || 'Sin correo registrado'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="ext-muted">#{paciente.id}</td>
                      <td>
                        <div className="ext-name">
                          <div>
                            <strong>{paciente.telefono || 'Sin teléfono'}</strong>
                            <span>{paciente.edad === null ? 'Edad sin registrar' : `${paciente.edad} años`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="ext-muted">
                        {visitasPorPaciente.has(paciente.id)
                          ? formatearFecha(visitasPorPaciente.get(paciente.id) as string)
                          : tratamientosPorPaciente.has(paciente.id)
                            ? 'Sin visita registrada'
                            : 'Sin registros'}
                      </td>
                      <td>
                        <span className={`ext-pill ${paciente.estado}`}>{ETIQUETAS_ESTADO[paciente.estado]}</span>
                      </td>
                      <td>
                        <div className="ext-actions-cell">
                          <button className="icon-button" aria-label="Agendar cita" onClick={() => navigate('/recepcionista/citas')}>
                            <span className="material-icons">event</span>
                          </button>
                          <button className="icon-button" aria-label="Editar paciente" onClick={() => abrirEdicion(paciente)}>
                            <span className="material-icons">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ext-empty">
              <span className="material-icons">person_search</span>
              <h3>Sin pacientes</h3>
              <p>No hay registros reales registrados.</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>{editando ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
                  <p className="ext-sub" style={{ marginTop: '0.2rem' }}>Completa los datos que están registrados en la base de datos.</p>
                </div>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre completo*</label>
                    <input id="nombre" name="nombre" type="text" value={formulario.nombre} onChange={handleChange} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edad">Edad</label>
                      <input id="edad" name="edad" type="number" value={formulario.edad} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="telefono">Teléfono</label>
                      <input id="telefono" name="telefono" type="tel" value={formulario.telefono} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input id="email" name="email" type="email" value={formulario.email} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="estado">Estado</label>
                    <select id="estado" name="estado" value={formulario.estado} onChange={handleChange}>
                      <option value="activo">Activo</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={guardando}>
                    {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Paciente'}
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
