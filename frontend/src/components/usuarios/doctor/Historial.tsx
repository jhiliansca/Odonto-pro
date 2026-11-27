import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Historial, Paciente } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import './DoctorPages.css';

interface FormHistorial {
  pacienteId: string;
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  notas: string;
}

function fechaHoy(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function procedimientosLista(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.filter((item): item is string => typeof item === 'string');
  }
  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) return [];
    if (texto.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(texto);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        return [texto];
      }
    }
    return [texto];
  }
  return [];
}

function fechaValor(fecha: string): Date | null {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

const DoctorHistorial: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Docente';
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detalle, setDetalle] = useState<Historial | null>(null);
  const [form, setForm] = useState<FormHistorial>({ pacienteId: '',
    fecha: fechaHoy(),
    diagnostico: '',
    tratamiento: '',
    notas: '',
  });

  useEffect(() => {
    if (!user) {
      setCargando(false);
      return;
    }
    let activo = true;
    const cargar = async () => {
      try {
        const [historialApi, pacientesApi] = await Promise.all([
          clinicaApi.historial(),
          clinicaApi.pacientes(),
        ]);
        if (!activo) return;
        setHistorial(historialApi.filter(item => item.doctor_id === user.id));
        setPacientes(pacientesApi.filter(paciente => paciente.doctor_id === user.id));
      } catch {
        if (activo) setError('No fue posible cargar el historial real.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    void cargar();
    return () => {
      activo = false;
    };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const cerrarModal = () => {
    setShowModal(false);
    setForm({ pacienteId: '', fecha: fechaHoy(), diagnostico: '', tratamiento: '', notas: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const pacienteId = Number(form.pacienteId);
    if (!pacienteId || !form.fecha || !form.diagnostico.trim() || !form.tratamiento.trim()) {
      setError('Completa todos los datos obligatorios de la entrada.');
      return;
    }
    try {
      const creado = await clinicaApi.crearHistorial({
        pacienteId,
        doctor_id: user.id,
        fecha: form.fecha,
        diagnostico: form.diagnostico.trim(),
        tratamiento: form.tratamiento.trim(),
        notas: form.notas.trim() || null,
        procedimientos: [],
      });
      setHistorial(prev => [creado, ...prev]);
      setError(null);
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar la entrada.');
    }
  };

  const filtered = historial.filter(item => {
    const procedimientos = procedimientosLista(item.procedimientos);
    const texto = [item.paciente || '', item.diagnostico, item.tratamiento, ...procedimientos]
      .join(' ')
      .toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  const formatMes = (fecha: string) => {
    const valor = fechaValor(fecha);
    return valor ? valor.toLocaleString('es-ES', { month: 'short' }).toUpperCase() : '--';
  };
  const formatDia = (fecha: string) => {
    const valor = fechaValor(fecha);
    return valor ? String(valor.getDate()) : '--';
  };

  if (!user) {
    return (
      <DashboardLayout userType="doctor" userName={userName}>
        <div className="doctor-page-container">
          <div className="page-header"><h1>Historial Clínico</h1></div>
          <EmptyState message="No se pudo identificar al doctor. Inicia sesión nuevamente para ver el historial." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="doctor-page-container">
        <div className="page-header">
          <h1>Historial Clínico</h1>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <span className="material-icons">description</span>
            Nueva Entrada
          </button>
        </div>

        {error && <ErrorState message={error} />}

        <div className="filter-container">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="material-icons">search</span>
            <input type="text" placeholder="Buscar por paciente, diagnóstico o procedimiento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="historial-timeline">
          {cargando && <LoadingState label="Cargando historial..." />}
          {!cargando && filtered.length === 0 && (
            <EmptyState message="No hay entradas registradas para este doctor." />
          )}
          {filtered.map(item => {
            const procedimientos = procedimientosLista(item.procedimientos);
            return (
              <div key={item.id} className="historial-card">
                <div className="historial-fecha">
                  <div className="dia">{formatDia(item.fecha)}</div>
                  <div className="mes">{formatMes(item.fecha)}</div>
                </div>
                <div className="historial-body">
                  <h3>{item.tratamiento}</h3>
                  <div className="historial-paciente">
                    <span className="material-icons">person</span>
                    <span>{item.paciente ?? `Paciente #${item.paciente_id}`}</span>
                  </div>
                  <p className="historial-diagnostico">
                    <strong>Diagnóstico:</strong> {item.diagnostico}
                  </p>
                  <div className="historial-tags">
                    {procedimientos.map((proc, idx) => (
                      <span key={idx} className="historial-tag">
                        <span className="material-icons">healing</span>
                        {proc}
                      </span>
                    ))}
                    <span className="historial-tag">
                      <span className="material-icons">medical_services</span>
                      {item.doctor || 'Sin doctor registrado'}
                    </span>
                  </div>
                  {item.notas && (
                    <p className="historial-nota">
                      <strong>Notas:</strong> {item.notas}
                    </p>
                  )}
                </div>
                <div className="historial-actions">
                  <button className="icon-button" aria-label="Ver entrada" onClick={() => setDetalle(item)}>
                    <span className="material-icons">visibility</span>
                  </button>
                  <button className="icon-button" aria-label="Imprimir" onClick={() => window.print()}>
                    <span className="material-icons">print</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {detalle && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Detalle del Historial</h2>
                <button className="close-button" onClick={() => setDetalle(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Paciente:</strong> {detalle.paciente || `Paciente #${detalle.paciente_id}`}</p>
                <p><strong>Fecha:</strong> {detalle.fecha}</p>
                <p><strong>Diagnóstico:</strong> {detalle.diagnostico}</p>
                <p><strong>Tratamiento:</strong> {detalle.tratamiento}</p>
                <p><strong>Doctor:</strong> {detalle.doctor || 'Sin doctor registrado'}</p>
                <p><strong>Notas:</strong> {detalle.notas || 'Sin notas registradas'}</p>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Nueva Entrada</h2>
                <button className="close-button" onClick={cerrarModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)}>
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
                    <label htmlFor="fecha">Fecha</label>
                    <input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="diagnostico">Diagnóstico</label>
                    <input id="diagnostico" name="diagnostico" type="text" value={form.diagnostico} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tratamiento">Tratamiento</label>
                    <input id="tratamiento" name="tratamiento" type="text" value={form.tratamiento} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="notas">Notas</label>
                    <textarea id="notas" name="notas" value={form.notas} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="submit-button">Guardar Entrada</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorHistorial;
