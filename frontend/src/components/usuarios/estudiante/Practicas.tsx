import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FC, FormEvent } from 'react';
import DashboardLayout from '../DashboardLayout';
import { academicoApi } from '../../../services/academicoApi';
import type { Practica, PracticaPayload } from '../../../services/academicoApi';
import { getStoredUser } from '../../../services/authApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import './Practicas.css';

type TabPractica = 'todas' | 'pendientes' | 'completadas';
type ModalPractica = { tipo: 'crear' } | { tipo: 'editar'; practica: Practica } | null;

interface FormularioPractica {
  nombre: string;
  fecha: string;
  paciente: string;
  detalles: string;
}

const TABS: { clave: TabPractica; etiqueta: string }[] = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'pendientes', etiqueta: 'Pendientes' },
  { clave: 'completadas', etiqueta: 'Completadas' },
];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formularioVacio: FormularioPractica = {
  nombre: '',
  fecha: '',
  paciente: '',
  detalles: '',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información de prácticas.';
}

function normalizarEstado(estado: string): string {
  return estado.trim().toLowerCase().replace(/\s+/g, '_');
}

function etiquetaEstado(estado: string): string {
  const normalizado = normalizarEstado(estado);
  const etiquetas: Record<string, string> = { pendiente: 'Pendiente',
    completada: 'Completada',
    evaluada: 'Evaluada',
  };
  return etiquetas[normalizado] ?? (estado.trim() || 'Sin estado');
}

function esCompletada(estado: string): boolean {
  const normalizado = normalizarEstado(estado);
  return normalizado === 'completada' || normalizado === 'evaluada';
}

function soloFecha(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 10) : '';
}

function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return 'No definida';
  const partes = valor.slice(0, 10).split('-');
  if (partes.length !== 3) return valor;
  const anio = partes[0];
  const mes = Number(partes[1]);
  const dia = partes[2];
  return mes >= 1 && mes <= 12 ? `${dia} ${MESES[mes - 1]} ${anio}` : valor;
}

function fechaHoy(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

const Practicas: FC = () => {
  const userName = useCurrentUserName('Estudiante');
  const currentUser = useMemo(() => getStoredUser(), []);
  const estudianteId = currentUser?.id ?? null;
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tabActiva, setTabActiva] = useState<TabPractica>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState<Practica | null>(null);
  const [modalForm, setModalForm] = useState<ModalPractica>(null);
  const [form, setForm] = useState<FormularioPractica>({ ...formularioVacio });
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [practicaEliminar, setPracticaEliminar] = useState<Practica | null>(null);

  const cargarPracticas = useCallback(async () => {
    if (estudianteId === null) {
      setCargando(false);
      setError('No se pudo identificar al estudiante en la sesión actual.');
      return;
    }
    setCargando(true);
    setError('');
    try {
      setPracticas(await academicoApi.practicas({ estudianteId }));
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [estudianteId]);

  useEffect(() => {
    void cargarPracticas();
  }, [cargarPracticas]);

  const conteos = useMemo(
    () => ({
      todas: practicas.length,
      pendientes: practicas.filter((practica) => normalizarEstado(practica.estado) === 'pendiente').length,
  completadas: practicas.filter((practica) => esCompletada(practica.estado)).length,
    }),
    [practicas],
  );

  const practicasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    return practicas.filter((practica) => {
      const coincideTab =
        tabActiva === 'todas' || (tabActiva === 'pendientes' && normalizarEstado(practica.estado) === 'pendiente') || (tabActiva === 'completadas' && esCompletada(practica.estado));
      const coincideTexto =
        !termino ||
        practica.nombre.toLocaleLowerCase('es').includes(termino) ||
        (practica.paciente || '').toLocaleLowerCase('es').includes(termino) ||
        (practica.supervisor || '').toLocaleLowerCase('es').includes(termino);
      return coincideTab && coincideTexto;
    });
  }, [busqueda, practicas, tabActiva]);

  const abrirCrear = () => {
    if (estudianteId === null) {
      setError('No se pudo identificar al estudiante en la sesión actual.');
      return;
    }
    setForm({ ...formularioVacio, fecha: fechaHoy() });
    setFormError('');
    setModalForm({ tipo: 'crear' });
  };

  const abrirEditar = (practica: Practica) => {
    if (practica.estudianteId !== estudianteId || normalizarEstado(practica.estado) !== 'pendiente') return;
    setForm({
      nombre: practica.nombre,
      fecha: soloFecha(practica.fechaISO || practica.fecha),
      paciente: practica.paciente || '',
      detalles: practica.detalles || '',
    });
    setFormError('');
    setModalForm({ tipo: 'editar', practica });
  };

  const cerrarFormulario = () => {
    setModalForm(null);
    setFormError('');
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (estudianteId === null) {
      setFormError('No se pudo identificar al estudiante en la sesión actual.');
      return;
    }
    if (!modalForm) {
      setFormError('Selecciona una práctica para continuar.');
      return;
    }
    if (modalForm.tipo === 'editar' && normalizarEstado(modalForm.practica.estado) !== 'pendiente') {
      setFormError('Solo se pueden editar prácticas pendientes.');
      return;
    }

    const nombre = form.nombre.trim();
    if (!nombre) {
      setFormError('El nombre de la práctica es obligatorio.');
      return;
    }
    if (!form.fecha) {
      setFormError('Selecciona la fecha de la práctica.');
      return;
    }

    const payload: PracticaPayload = {
      nombre,
      fecha: form.fecha,
      estudianteId,
      pacienteId: null,
      paciente: form.paciente.trim() || '',
      detalles: form.detalles.trim(),
      estado: 'pendiente',
    };

    setGuardando(true);
    try {
      if (modalForm.tipo === 'editar') {
        await academicoApi.actualizarPractica(modalForm.practica.id, payload);
      } else {
        await academicoApi.crearPractica(payload);
      }
      cerrarFormulario();
      await cargarPracticas();
    } catch (e) {
      setFormError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!practicaEliminar || practicaEliminar.estudianteId !== estudianteId) {
      setPracticaEliminar(null);
      return;
    }
    try {
      await academicoApi.eliminarPractica(practicaEliminar.id);
      setPracticas((actuales) => actuales.filter((practica) => practica.id !== practicaEliminar.id));
      if (detalle?.id === practicaEliminar.id) setDetalle(null);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setPracticaEliminar(null);
    }
  };

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="acad-practicas-container">
        <div className="page-header">
          <div>
            <h1>Mis prácticas clínicas</h1>
            <p>Registra y consulta tus prácticas académicas reales.</p>
          </div>
          <button type="button" className="add-button" onClick={abrirCrear}>
            <span className="material-icons">add</span>
            Nueva práctica
          </button>
        </div>

        <div className="filter-container">
          <div className="tabs">
            {TABS.map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                className={`tab ${tabActiva === opcion.clave ? 'active' : ''}`}
                onClick={() => setTabActiva(opcion.clave)}
              >
                {opcion.etiqueta} ({conteos[opcion.clave]})
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por práctica, paciente o supervisor"
              aria-label="Buscar prácticas"
            />
          </div>
        </div>

        {cargando ? (
          <LoadingState label="Cargando prácticas..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void cargarPracticas()} />
        ) : practicasFiltradas.length === 0 ? (
          <EmptyState message="No hay prácticas que coincidan con los filtros seleccionados." />
        ) : (
          <div className="table-wrap acad-practicas-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Práctica</th>
                  <th>Paciente</th>
                  <th>Supervisor</th>
                  <th>Estado</th>
                  <th>Calificación</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {practicasFiltradas.map((practica) => {
                  const esPropia = practica.estudianteId === estudianteId;
                  const esPendiente = normalizarEstado(practica.estado) === 'pendiente';
                  return (
                    <tr key={practica.id}>
                      <td>{formatearFecha(practica.fechaISO || practica.fecha)}</td>
                      <td>
                        <div className="acad-practicas-nombre">
                          <strong>{practica.nombre}</strong>
                          {practica.detalles && <span>{practica.detalles}</span>}
                        </div>
                      </td>
                      <td>{practica.paciente || 'Sin paciente'}</td>
                      <td>{practica.supervisor || 'Sin supervisor'}</td>
                      <td>
                        <span className={`status-badge ${normalizarEstado(practica.estado)}`}>
                          {etiquetaEstado(practica.estado)}
                        </span>
                      </td>
                      <td>{practica.calificacion !== null ? practica.calificacion : '—'}</td>
                      <td>
                        <div className="acad-practicas-acciones">
                          <button type="button" className="view-all-button" onClick={() => setDetalle(practica)}>
                            Ver detalle
                          </button>
                          {esPropia && esPendiente && (
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Editar ${practica.nombre}`}
                              onClick={() => abrirEditar(practica)}
                            >
                              <span className="material-icons">edit</span>
                            </button>
                          )}
                          {esPropia && (
                            <button
                              type="button"
                              className="icon-button danger"
                              aria-label={`Eliminar ${practica.nombre}`}
                              onClick={() => setPracticaEliminar(practica)}
                            >
                              <span className="material-icons">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {detalle && (
          <div className="modal-overlay">
            <div className="modal-content acad-practicas-modal" role="dialog" aria-modal="true" aria-labelledby="acad-practica-detalle-titulo">
              <div className="modal-header">
                <div>
                  <h2 id="acad-practica-detalle-titulo">{detalle.nombre}</h2>
                  <p className="acad-practicas-modal-subtitle">
                    Registro del {formatearFecha(detalle.fechaISO || detalle.fecha)}
                  </p>
                </div>
                <button type="button" className="close-button" onClick={() => setDetalle(null)} aria-label="Cerrar detalle">
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="modal-body">
                <div className="section-heading">Información general</div>
                <div className="acad-practicas-detail-grid">
                  <div className="acad-practicas-detail-item">
                    <span className="acad-practicas-label">Fecha</span>
                    <strong>{formatearFecha(detalle.fechaISO || detalle.fecha)}</strong>
                  </div>
                  <div className="acad-practicas-detail-item">
                    <span className="acad-practicas-label">Estado</span>
                    <span className={`status-badge ${normalizarEstado(detalle.estado)}`}>
                      {etiquetaEstado(detalle.estado)}
                    </span>
                  </div>
                  <div className="acad-practicas-detail-item">
                    <span className="acad-practicas-label">Paciente</span>
                    <strong>{detalle.paciente || 'Sin paciente registrado'}</strong>
                  </div>
                  <div className="acad-practicas-detail-item">
                    <span className="acad-practicas-label">Supervisor</span>
                    <strong>{detalle.supervisor || 'Sin supervisor registrado'}</strong>
                  </div>
                  <div className="acad-practicas-detail-item">
                    <span className="acad-practicas-label">Calificación</span>
                    <strong>{detalle.calificacion !== null ? detalle.calificacion : 'Sin calificación'}</strong>
                  </div>
                  <div className="acad-practicas-detail-item">
                    <span className="acad-practicas-label">Fecha de registro</span>
                    <strong>{formatearFecha(detalle.fechaRegistro)}</strong>
                  </div>
                  <div className="acad-practicas-detail-item full">
                    <span className="acad-practicas-label">Detalles</span>
                    <span>{detalle.detalles || 'Sin detalles registrados.'}</span>
                  </div>
                  <div className="acad-practicas-detail-item full">
                    <span className="acad-practicas-label">Comentarios del supervisor</span>
                    <span>{detalle.comentarios || 'Sin comentarios registrados.'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={() => setDetalle(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalForm && (
          <div className="modal-overlay">
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="acad-practica-form-titulo">
              <div className="modal-header">
                <h2 id="acad-practica-form-titulo">
                  {modalForm.tipo === 'crear' ? 'Registrar práctica' : 'Editar práctica'}
                </h2>
                <button type="button" className="close-button" onClick={cerrarFormulario} aria-label="Cerrar formulario">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(event) => void handleSubmit(event)}>
                <div className="modal-body">
                  {formError && (
                    <div className="acad-practicas-alert">
                      <span className="material-icons">error_outline</span>
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="acad-practica-nombre">Nombre*</label>
                    <input
                      id="acad-practica-nombre"
                      name="nombre"
                      type="text"
                      value={form.nombre}
                      onChange={handleFormChange}
                      placeholder="Nombre de la práctica"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="acad-practica-fecha">Fecha*</label>
                      <input
                        id="acad-practica-fecha"
                        name="fecha"
                        type="date"
                        value={form.fecha}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="acad-practica-paciente">Paciente (opcional)</label>
                      <input
                        id="acad-practica-paciente"
                        name="paciente"
                        type="text"
                        value={form.paciente}
                        onChange={handleFormChange}
                        placeholder="Nombre del paciente"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="acad-practica-detalles">Detalles</label>
                    <textarea
                      id="acad-practica-detalles"
                      name="detalles"
                      value={form.detalles}
                      onChange={handleFormChange}
                      placeholder="Describe la práctica clínica realizada"
                    />
                  </div>

                  <div className="acad-practicas-hint">
                    <span className="material-icons">info</span>
                    <span>
                      {modalForm.tipo === 'crear' ? 'La práctica se registrará como pendiente.'
                        : 'La práctica conservará su estado pendiente.'}
                    </span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={cerrarFormulario}>
                    Cancelar
                  </button>
                  <button type="submit" className="submit-button" disabled={guardando}>
                    {guardando ? 'Guardando...'
                      : modalForm.tipo === 'crear' ? 'Registrar práctica'
                        : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {practicaEliminar && (
          <ConfirmDialog
            title="Eliminar práctica"
            message={`¿Deseas eliminar la práctica "${practicaEliminar.nombre}" Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            onConfirm={() => void confirmarEliminacion()}
            onCancel={() => setPracticaEliminar(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Practicas;