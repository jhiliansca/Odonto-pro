import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import DashboardLayout from '../DashboardLayout';
import { academicoApi } from '../../../services/academicoApi';
import type { Curso } from '../../../services/academicoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/StateViews';
import './Cursos.css';

type TabCurso = 'todos' | 'en_curso' | 'completado' | 'pendiente';

const TABS: { clave: TabCurso; etiqueta: string }[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'en_curso', etiqueta: 'En curso' },
  { clave: 'completado', etiqueta: 'Completados' },
  { clave: 'pendiente', etiqueta: 'Pendientes' },
];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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

const Cursos: FC = () => {
  const userName = useCurrentUserName('Estudiante');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tabActiva, setTabActiva] = useState<TabCurso>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Curso | null>(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [detalleIntento, setDetalleIntento] = useState(0);

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
    if (detalleId === null) return;
    let activo = true;
    setDetalle(null);
    setDetalleError('');
    setDetalleCargando(true);
    academicoApi
      .curso(detalleId)
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
  }, [detalleId, detalleIntento]);

  const conteos = useMemo(
    () => ({
      todos: cursos.length,
      en_curso: cursos.filter((curso) => normalizarEstado(curso.estado) === 'en_curso').length,
  completado: cursos.filter((curso) => normalizarEstado(curso.estado) === 'completado').length,
  pendiente: cursos.filter((curso) => normalizarEstado(curso.estado) === 'pendiente').length,
    }),
    [cursos],
  );

  const cursosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    return cursos.filter((curso) => {
      const coincideTab = tabActiva === 'todos' || normalizarEstado(curso.estado) === tabActiva;
      const coincideTexto =
        !termino ||
        curso.nombre.toLocaleLowerCase('es').includes(termino) ||
        (curso.instructor || '').toLocaleLowerCase('es').includes(termino);
      return coincideTab && coincideTexto;
    });
  }, [busqueda, cursos, tabActiva]);

  const cerrarDetalle = () => {
    setDetalleId(null);
    setDetalle(null);
    setDetalleError('');
  };

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="acad-cursos-container">
        <div className="page-header">
          <div>
            <h1>Mis cursos</h1>
            <p>Consulta el avance real de tu formación académica.</p>
          </div>
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
              placeholder="Buscar por curso o instructor"
              aria-label="Buscar cursos"
            />
          </div>
        </div>

        {cargando ? (
          <LoadingState label="Cargando cursos..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void cargarCursos()} />
        ) : cursosFiltrados.length === 0 ? (
          <EmptyState message="No hay cursos que coincidan con los filtros seleccionados." />
        ) : (
          <div className="acad-cursos-grid">
            {cursosFiltrados.map((curso) => {
              const estado = normalizarEstado(curso.estado);
              const avance = porcentaje(curso.progreso);
              const completados = curso.modulos.filter((modulo) => modulo.completado).length;
              return (
                <article key={curso.id} className={`surface-card acad-curso-card ${estado}`}>
                  <div className="acad-curso-card-head">
                    <div>
                      <h3>{curso.nombre}</h3>
                      <p className="acad-curso-instructor">
                        <span className="material-icons">person</span>
                        {curso.instructor || 'Sin instructor registrado'}
                      </p>
                    </div>
                    <span className={`status-badge ${estado}`}>{etiquetaEstado(curso.estado)}</span>
                  </div>

                  <p className="acad-curso-descripcion">
                    {curso.descripcion || 'Sin descripción registrada.'}
                  </p>

                  <div className="acad-curso-fechas">
                    <span>
                      <span className="material-icons">event</span>
                      {formatearFecha(curso.fechaInicio)}
                    </span>
                    <span>
                      <span className="material-icons">event_available</span>
                      {formatearFecha(curso.fechaFin)}
                    </span>
                  </div>

                  <div className="acad-progress">
                    <div
                      className="acad-progress-track"
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

                  <div className="acad-curso-card-footer">
                    <span>
                      {completados} de {curso.modulos.length} módulos completados
                    </span>
                    <button type="button" className="view-all-button" onClick={() => setDetalleId(curso.id)}>
                      Ver detalle
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {detalleId !== null && (
          <div className="modal-overlay">
            <div className="modal-content acad-cursos-modal" role="dialog" aria-modal="true" aria-labelledby="acad-curso-detalle-titulo">
              <div className="modal-header">
                <div>
                  <h2 id="acad-curso-detalle-titulo">{detalle?.nombre || 'Detalle del curso'}</h2>
                  <p className="acad-cursos-modal-subtitle">Información del curso y estado de sus módulos.</p>
                </div>
                <button type="button" className="close-button" onClick={cerrarDetalle} aria-label="Cerrar detalle">
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="modal-body">
                {detalleCargando ? (
                  <LoadingState label="Cargando detalle del curso..." />
                ) : detalleError ? (
                  <ErrorState message={detalleError} onRetry={() => setDetalleIntento((valor) => valor + 1)} />
                ) : detalle ? (
                  <>
                    <div className="acad-detalle-resumen">
                      <div className="acad-detalle-item">
                        <span className="acad-detalle-label">Instructor</span>
                        <strong>{detalle.instructor || 'Sin instructor registrado'}</strong>
                      </div>
                      <div className="acad-detalle-item">
                        <span className="acad-detalle-label">Estado</span>
                        <span className={`status-badge ${normalizarEstado(detalle.estado)}`}>
                          {etiquetaEstado(detalle.estado)}
                        </span>
                      </div>
                      <div className="acad-detalle-item">
                        <span className="acad-detalle-label">Inicio</span>
                        <strong>{formatearFecha(detalle.fechaInicio)}</strong>
                      </div>
                      <div className="acad-detalle-item">
                        <span className="acad-detalle-label">Fin</span>
                        <strong>{formatearFecha(detalle.fechaFin)}</strong>
                      </div>
                      <div className="acad-detalle-item full">
                        <span className="acad-detalle-label">Descripción</span>
                        <span>{detalle.descripcion || 'Sin descripción registrada.'}</span>
                      </div>
                      <div className="acad-detalle-item full">
                        <span className="acad-detalle-label">Progreso general</span>
                        <div className="acad-progress">
                          <div
                            className="acad-progress-track"
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
                    {detalle.modulos.length === 0 ? (
                      <EmptyState message="Este curso todavía no tiene módulos registrados." />
                    ) : (
                      <ul className="acad-modulos-list">
                        {detalle.modulos
                          .slice()
                          .sort((a, b) => a.orden - b.orden)
                          .map((modulo) => (
                            <li key={modulo.id} className={`acad-modulo-item ${modulo.completado ? 'completado' : ''}`}>
                              <span className="acad-modulo-icon material-icons">
                                {modulo.completado ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              <span className="acad-modulo-nombre">{modulo.nombre}</span>
                              <span className="acad-modulo-estado">
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
                <button type="button" className="cancel-button" onClick={cerrarDetalle}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cursos;
