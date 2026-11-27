import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FC, FormEvent } from 'react';
import DashboardLayout from '../DashboardLayout';
import { academicoApi } from '../../../services/academicoApi';
import type { Curso, CursoPayload, Modulo } from '../../../services/academicoApi';
import { getStoredUser } from '../../../services/authApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import './Cursos.css';

type ModalCurso = 'crear' | 'editar' | 'detalle' | null;

interface CursoFormulario {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formularioInicial: CursoFormulario = {
  nombre: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  estado: 'pendiente',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información académica.';
}

function normalizarEstado(estado: string): string {
  return estado.trim().toLowerCase().replace(/\s+/g, '_');
}

function etiquetaEstado(estado: string): string {
  const normalizado = normalizarEstado(estado);
  const etiquetas: Record<string, string> = { en_curso: 'En curso',
    completado: 'Completado',
    pendiente: 'Pendiente',
  };
  return etiquetas[normalizado] ?? (estado.trim() || 'Sin estado');
}

function soloFecha(valor: string | null): string {
  return valor ? valor.slice(0, 10) : '';
}

function formatearFecha(valor: string | null): string {
  if (!valor) return 'No definida';
  const partes = valor.slice(0, 10).split('-');
  if (partes.length !== 3) return valor;
  const anio = partes[0];
  const mes = Number(partes[1]);
  const dia = partes[2];
  return mes >= 1 && mes <= 12 ? `${dia} ${MESES[mes - 1]} ${anio}` : valor;
}

function porcentaje(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(100, Math.max(0, Math.round(valor)));
}

function formularioDesdeCurso(curso: Curso): CursoFormulario {
  return {
    nombre: curso.nombre,
    descripcion: curso.descripcion,
    fechaInicio: soloFecha(curso.fechaInicio),
    fechaFin: soloFecha(curso.fechaFin),
    estado: normalizarEstado(curso.estado) || 'pendiente',
  };
}

const Cursos: FC = () => {
  const nombreDocente = useCurrentUserName('Docente');
  const currentUser = useMemo(() => getStoredUser(), []);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<ModalCurso>(null);
  const [cursoId, setCursoId] = useState<number | null>(null);
  const [form, setForm] = useState<CursoFormulario>({ ...formularioInicial });
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState<Curso | null>(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [detalleIntento, setDetalleIntento] = useState(0);
  const [nombreModulo, setNombreModulo] = useState('');
  const [accionError, setAccionError] = useState('');
  const [agregandoModulo, setAgregandoModulo] = useState(false);
  const [moduloProcesandoId, setModuloProcesandoId] = useState<number | null>(null);
  const [cursoEliminar, setCursoEliminar] = useState<Curso | null>(null);

  const cargarCursos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setCursos(await academicoApi.cursos());
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarCursos();
  }, [cargarCursos]);

  useEffect(() => {
    if (modal !== 'detalle' || cursoId === null) return;
    let activo = true;
    setDetalle(null);
    setDetalleError('');
    setAccionError('');
    setNombreModulo('');
    setDetalleCargando(true);
    academicoApi
      .curso(cursoId)
      .then((respuesta) => {
        if (activo) setDetalle(respuesta);
      })
      .catch((e: unknown) => {
        if (activo) setDetalleError(mensajeError(e));
      })
      .finally(() => {
        if (activo) setDetalleCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [cursoId, detalleIntento, modal]);

  const cursosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    return cursos.filter((curso) => {
      const coincideTexto =
        !termino ||
        curso.nombre.toLocaleLowerCase('es').includes(termino) ||
        (curso.instructor || '').toLocaleLowerCase('es').includes(termino);
      return coincideTexto;
    });
  }, [busqueda, cursos]);

  const actualizarCursoEnLista = useCallback((cursoActualizado: Curso) => {
    setCursos((actuales) => actuales.map((curso) => (curso.id === cursoActualizado.id ? cursoActualizado : curso)));
  }, []);

  const cerrarModal = () => {
    setModal(null);
    setCursoId(null);
    setFormError('');
    setDetalle(null);
    setDetalleError('');
    setAccionError('');
    setNombreModulo('');
  };

  const abrirCrear = () => {
    setForm({ ...formularioInicial });
    setFormError('');
    setCursoId(null);
    setModal('crear');
  };

  const abrirEditar = (curso: Curso) => {
    setForm(formularioDesdeCurso(curso));
    setFormError('');
    setCursoId(curso.id);
    setModal('editar');
  };

  const abrirDetalle = (id: number) => {
    setCursoId(id);
    setModal('detalle');
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const nombre = form.nombre.trim();
    if (!nombre) {
      setFormError('El nombre del curso es obligatorio.');
      return;
    }
    if (form.fechaInicio && form.fechaFin && form.fechaInicio > form.fechaFin) {
      setFormError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    const datos = {
      nombre,
      descripcion: form.descripcion.trim(),
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
      estado: form.estado,
    };

    setGuardando(true);
    try {
      if (modal === 'crear') {
        const payload: CursoPayload = {
          ...datos,
          instructorId: currentUser?.id ?? null,
          instructor: currentUser?.nombreCompleto || nombreDocente,
        };
        const creado = await academicoApi.crearCurso(payload);
        setCursos((actuales) => [creado, ...actuales]);
      } else if (modal === 'editar' && cursoId !== null) {
        const actualizado = await academicoApi.actualizarCurso(cursoId, datos);
        actualizarCursoEnLista(actualizado);
      }
      cerrarModal();
    } catch (e) {
      setFormError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarModulo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modal !== 'detalle' || cursoId === null || detalle === null) return;
    const nombre = nombreModulo.trim();
    if (!nombre) {
      setAccionError('Escribe el nombre del módulo que deseas agregar.');
      return;
    }

    setAccionError('');
    setAgregandoModulo(true);
    try {
      const actualizado = await academicoApi.agregarModulo(cursoId, nombre);
      setDetalle(actualizado);
      actualizarCursoEnLista(actualizado);
      setNombreModulo('');
    } catch (e) {
      setAccionError(mensajeError(e));
    } finally {
      setAgregandoModulo(false);
    }
  };

  const alternarModulo = async (modulo: Modulo) => {
    if (modal !== 'detalle' || cursoId === null || detalle === null) return;
    setAccionError('');
    setModuloProcesandoId(modulo.id);
    try {
      const actualizado = await academicoApi.toggleModulo(cursoId, modulo.id, !modulo.completado);
      setDetalle(actualizado);
      actualizarCursoEnLista(actualizado);
    } catch (e) {
      setAccionError(mensajeError(e));
    } finally {
      setModuloProcesandoId(null);
    }
  };

  const confirmarEliminacion = async () => {
    if (!cursoEliminar) return;
    try {
      await academicoApi.eliminarCurso(cursoEliminar.id);
      setCursos((actuales) => actuales.filter((curso) => curso.id !== cursoEliminar.id));
      if (cursoId === cursoEliminar.id) cerrarModal();
      setCursoEliminar(null);
    } catch (e) {
      setError(mensajeError(e));
      setCursoEliminar(null);
    }
  };

  return (
    <DashboardLayout userType="doctor" userName={nombreDocente}>
      <div className="doc-cursos-container">
        <div className="page-header">
          <div>
            <h1>Cursos y módulos</h1>
            <p>Administra los cursos académicos y el avance de cada módulo.</p>
          </div>
          <button type="button" className="add-button" onClick={abrirCrear}>
            <span className="material-icons">add</span>
            Nuevo curso
          </button>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por curso o instructor"
              aria-label="Buscar cursos"
            />
          </div>
          <span className="doc-cursos-count">{cursosFiltrados.length} curso(s)</span>
        </div>

        {cargando ? (
          <LoadingState label="Cargando cursos..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void cargarCursos()} />
        ) : cursosFiltrados.length === 0 ? (
          <EmptyState message="No hay cursos que coincidan con la búsqueda." />
        ) : (
          <div className="doc-cursos-grid">
            {cursosFiltrados.map((curso) => {
              const estado = normalizarEstado(curso.estado);
              const avance = porcentaje(curso.progreso);
              const completados = curso.modulos.filter((modulo) => modulo.completado).length;
              return (
                <article key={curso.id} className={`surface-card doc-curso-card ${estado}`}>
                  <div className="doc-curso-card-head">
                    <div>
                      <h3>{curso.nombre}</h3>
                      <p className="doc-curso-meta">
                        <span className="material-icons">person</span>
                        {curso.instructor || 'Sin instructor registrado'}
                      </p>
                    </div>
                    <span className={`status-badge ${estado}`}>{etiquetaEstado(curso.estado)}</span>
                  </div>

                  <p className="doc-curso-descripcion">
                    {curso.descripcion || 'Sin descripción registrada.'}
                  </p>

                  <div className="doc-cursos-progress">
                    <div
                      className="doc-cursos-progress-track"
                      role="progressbar"
                      aria-label={`Progreso de ${curso.nombre}`}
                      aria-valuenow={avance}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: `${avance}%` }} />
                    </div>
                    <strong>{avance}%</strong>
                  </div>

                  <div className="doc-curso-modulos">
                    <span className="material-icons">view_list</span>
                    {curso.modulos.length === 0 ? 'Sin módulos registrados'
                      : `${completados} de ${curso.modulos.length} módulos completados`}
                  </div>

                  <div className="doc-curso-actions">
                    <button type="button" className="view-all-button" onClick={() => abrirDetalle(curso.id)}>
                      Gestionar módulos
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Editar ${curso.nombre}`}
                      onClick={() => abrirEditar(curso)}
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button
                      type="button"
                      className="icon-button danger"
                      aria-label={`Eliminar ${curso.nombre}`}
                      onClick={() => setCursoEliminar(curso)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {(modal === 'crear' || modal === 'editar') && (
          <div className="modal-overlay">
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="doc-curso-form-titulo">
              <div className="modal-header">
                <h2 id="doc-curso-form-titulo">{modal === 'crear' ? 'Nuevo curso' : 'Editar curso'}</h2>
                <button type="button" className="close-button" onClick={cerrarModal} aria-label="Cerrar formulario">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(event) => void handleSubmit(event)}>
                <div className="modal-body">
                  {formError && (
                    <div className="doc-cursos-alert">
                      <span className="material-icons">error_outline</span>
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="doc-curso-nombre">Nombre*</label>
                    <input
                      id="doc-curso-nombre"
                      name="nombre"
                      type="text"
                      value={form.nombre}
                      onChange={handleFormChange}
                      placeholder="Nombre del curso"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="doc-curso-descripcion">Descripción</label>
                    <textarea
                      id="doc-curso-descripcion"
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleFormChange}
                      placeholder="Descripción del curso"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="doc-curso-inicio">Fecha de inicio</label>
                      <input
                        id="doc-curso-inicio"
                        name="fechaInicio"
                        type="date"
                        value={form.fechaInicio}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="doc-curso-fin">Fecha de fin</label>
                      <input
                        id="doc-curso-fin"
                        name="fechaFin"
                        type="date"
                        value={form.fechaFin}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="doc-curso-estado">Estado</label>
                    <select id="doc-curso-estado" name="estado" value={form.estado} onChange={handleFormChange}>
                      <option value="pendiente">Pendiente</option>
                      <option value="en_curso">En curso</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>

                  {modal === 'crear' && (
                    <div className="doc-cursos-hint">
                      <span className="material-icons">info</span>
                      <span>El instructor se asigna automáticamente a {nombreDocente}.</span>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="submit-button" disabled={guardando}>
                    {guardando ? 'Guardando...' : modal === 'crear' ? 'Crear curso' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modal === 'detalle' && cursoId !== null && (
          <div className="modal-overlay">
            <div className="modal-content doc-cursos-modal" role="dialog" aria-modal="true" aria-labelledby="doc-curso-detalle-titulo">
              <div className="modal-header">
                <div>
                  <h2 id="doc-curso-detalle-titulo">{detalle?.nombre || 'Detalle del curso'}</h2>
                  <p className="doc-cursos-modal-subtitle">Gestiona los módulos y su estado de avance.</p>
                </div>
                <button type="button" className="close-button" onClick={cerrarModal} aria-label="Cerrar detalle">
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="modal-body">
                {detalleCargando ? (
                  <LoadingState label="Cargando módulos..." />
                ) : detalleError ? (
                  <ErrorState message={detalleError} onRetry={() => setDetalleIntento((valor) => valor + 1)} />
                ) : detalle ? (
                  <>
                    <div className="doc-cursos-detalle-resumen">
                      <div className="doc-cursos-detalle-item">
                        <span className="doc-cursos-label">Instructor</span>
                        <strong>{detalle.instructor || 'Sin instructor registrado'}</strong>
                      </div>
                      <div className="doc-cursos-detalle-item">
                        <span className="doc-cursos-label">Estado</span>
                        <span className={`status-badge ${normalizarEstado(detalle.estado)}`}>
                          {etiquetaEstado(detalle.estado)}
                        </span>
                      </div>
                      <div className="doc-cursos-detalle-item">
                        <span className="doc-cursos-label">Inicio</span>
                        <strong>{formatearFecha(detalle.fechaInicio)}</strong>
                      </div>
                      <div className="doc-cursos-detalle-item">
                        <span className="doc-cursos-label">Fin</span>
                        <strong>{formatearFecha(detalle.fechaFin)}</strong>
                      </div>
                      <div className="doc-cursos-detalle-item full">
                        <span className="doc-cursos-label">Descripción</span>
                        <span>{detalle.descripcion || 'Sin descripción registrada.'}</span>
                      </div>
                      <div className="doc-cursos-detalle-item full">
                        <span className="doc-cursos-label">Progreso general</span>
                        <div className="doc-cursos-progress">
                          <div
                            className="doc-cursos-progress-track"
                            role="progressbar"
                            aria-label={`Progreso de ${detalle.nombre}`}
                            aria-valuenow={porcentaje(detalle.progreso)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <span style={{ width: `${porcentaje(detalle.progreso)}%` }} />
                          </div>
                          <strong>{porcentaje(detalle.progreso)}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="section-heading">Módulos del curso</div>
                    <form className="doc-cursos-agregar-modulo" onSubmit={(event) => void handleAgregarModulo(event)}>
                      <input
                        type="text"
                        value={nombreModulo}
                        onChange={(event) => {
                          setNombreModulo(event.target.value);
                          setAccionError('');
                        }}
                        placeholder="Nombre del nuevo módulo"
                        aria-label="Nombre del nuevo módulo"
                      />
                      <button type="submit" className="submit-button" disabled={agregandoModulo || !nombreModulo.trim()}>
                        <span className="material-icons">add</span>
                        {agregandoModulo ? 'Agregando...' : 'Agregar módulo'}
                      </button>
                    </form>

                    {accionError && (
                      <div className="doc-cursos-alert">
                        <span className="material-icons">error_outline</span>
                        <span>{accionError}</span>
                      </div>
                    )}

                    {detalle.modulos.length === 0 ? (
                      <EmptyState message="Este curso todavía no tiene módulos registrados." />
                    ) : (
                      <ul className="doc-cursos-modulos">
                        {detalle.modulos
                          .slice()
                          .sort((a, b) => a.orden - b.orden)
                          .map((modulo) => (
                            <li key={modulo.id} className={`doc-cursos-modulo ${modulo.completado ? 'completado' : ''}`}>
                              <label className="checkbox-group">
                                <input
                                  type="checkbox"
                                  checked={modulo.completado}
                                  disabled={moduloProcesandoId !== null}
                                  onChange={() => void alternarModulo(modulo)}
                                  aria-label={`Marcar módulo ${modulo.nombre} como ${
                                    modulo.completado ? 'pendiente' : 'completado'
                                  }`}
                                />
                                <span className="doc-cursos-modulo-nombre">{modulo.nombre}</span>
                              </label>
                              <span className="doc-cursos-modulo-estado">
                                {modulo.completado ? 'Completado' : 'Pendiente'}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </>
                ) : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={cerrarModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {cursoEliminar && (
          <ConfirmDialog
            title="Eliminar curso"
            message={`¿Deseas eliminar el curso "${cursoEliminar.nombre}" Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            onConfirm={() => void confirmarEliminacion()}
            onCancel={() => setCursoEliminar(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cursos;
