import type { ChangeEvent, CSSProperties, FC, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { catalogoApi } from '../../../services/catalogoApi';
import type {
  EstadoSolicitud,
  EstadoStock,
  Material,
  Procedimiento,
  ProcedimientoDetalle,
  Solicitud,
} from '../../../services/catalogoApi';
import '../RoleExtra.css';

const formatoNumero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

const etiquetasEstado: Record<EstadoSolicitud, string> = { pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
};

const clasesEstado: Record<EstadoSolicitud, string> = { pendiente: 'pendiente',
  aprobado: 'confirmada',
  entregado: 'entregado',
  rechazado: 'no_pagado',
};

const etiquetasStock: Record<EstadoStock, string> = { agotado: 'Agotado',
  bajo: 'Bajo',
  normal: 'Normal',
};

const clasesStock: Record<EstadoStock, string> = { agotado: 'no_pagado',
  bajo: 'no_pagado',
  normal: 'pagado',
};

type MaterialRequerido = ProcedimientoDetalle['materiales'][number];

interface FormularioSolicitud {
  procedimientoId: string;
  materialId: string;
  cantidad: string;
  cantidadTexto: string;
}

const formularioVacio: FormularioSolicitud = {
  procedimientoId: '',
  materialId: '',
  cantidad: '',
  cantidadTexto: '',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Error inesperado al consultar el catálogo.';
}

function formatearNumero(valor: number): string {
  const numero = Number(valor);
  return formatoNumero.format(Number.isFinite(numero) ? numero : 0);
}

const EstudianteInsumos: FC = () => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');
  const [filtroStock, setFiltroStock] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nuevo, setNuevo] = useState<FormularioSolicitud>(formularioVacio);
  const [detalle, setDetalle] = useState<ProcedimientoDetalle | null>(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState('');
  const [notificacion, setNotificacion] = useState('');
  const peticionRef = useRef(0);
  const montadoRef = useRef(true);

  const cargarDatos = useCallback(async () => {
    const id = ++peticionRef.current;
    setActualizando(true);
    setError('');
    try {
      const [materialesData, procedimientosData, solicitudesData] = await Promise.all([
        catalogoApi.materiales(),
        catalogoApi.procedimientos(),
        catalogoApi.solicitudes(),
      ]);
      if (!montadoRef.current || id !== peticionRef.current) return;
      setMateriales(materialesData);
      setProcedimientos(procedimientosData);
      setSolicitudes(solicitudesData);
    } catch (e) {
      if (!montadoRef.current || id !== peticionRef.current) return;
      setError(mensajeError(e));
    } finally {
      if (montadoRef.current && id === peticionRef.current) {
        setActualizando(false);
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    void cargarDatos();
    const temporizador = window.setInterval(() => {
      void cargarDatos();
    }, 15000);
    return () => {
      montadoRef.current = false;
      window.clearInterval(temporizador);
    };
  }, [cargarDatos]);

  useEffect(() => {
    if (!showModal || nuevo.procedimientoId === '') {
      setDetalle(null);
      setDetalleCargando(false);
      setDetalleError('');
      return;
    }
    let activo = true;
    setDetalleCargando(true);
    setDetalleError('');
    catalogoApi
      .procedimiento(Number(nuevo.procedimientoId))
      .then((respuesta) => {
        if (activo) setDetalle(respuesta);
      })
      .catch((e: unknown) => {
        if (activo) {
          setDetalle(null);
          setDetalleError(mensajeError(e));
        }
      })
      .finally(() => {
        if (activo) setDetalleCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [showModal, nuevo.procedimientoId]);

  const materialesActivos = useMemo(() => materiales.filter((m) => m.activo !== 0), [materiales]);

  const categorias = useMemo(
    () => Array.from(new Set(materialesActivos.map((m) => m.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [materialesActivos],
  );

  const estadosSolicitud = useMemo(
    () => Array.from(new Set(solicitudes.map((s) => s.estado))).sort((a, b) => a.localeCompare(b, 'es')),
    [solicitudes],
  );

  const materialesFiltrados = useMemo(() => {
    const termino = searchTerm.trim().toLowerCase();
    return materialesActivos.filter((m) => {
      const coincideTexto =
        !termino ||
        m.nombre.toLowerCase().includes(termino) ||
        m.categoria.toLowerCase().includes(termino) ||
        m.clave.toLowerCase().includes(termino) ||
        m.unidad.toLowerCase().includes(termino);
      return (
        coincideTexto &&
        (!categoria || m.categoria === categoria) && (!filtroStock || m.estadoStock === filtroStock)
      );
    });
  }, [materialesActivos, searchTerm, categoria, filtroStock]);

  const solicitudesFiltradas = useMemo(
    () => solicitudes.filter((s) => !filtroEstado || s.estado === filtroEstado),
    [solicitudes, filtroEstado],
  );

  const pendientes = useMemo(
    () => solicitudes.filter((s) => s.estado === 'pendiente').length,
    [solicitudes],
  );

  const entregados = useMemo(
    () => solicitudes.filter((s) => s.estado === 'entregado').length,
    [solicitudes],
  );

  const conStockBajo = useMemo(
    () => materialesActivos.filter((m) => m.estadoStock !== 'normal').length,
    [materialesActivos],
  );

  const nombreEstudiante = useMemo(() => {
    const nombre = solicitudes.find((s) => s.estudiante.trim())?.estudiante.trim() || '';
    return nombre || 'Estudiante';
  }, [solicitudes]);

  const abrirSolicitud = (material?: Material) => {
    setNuevo({ ...formularioVacio, materialId: material ? String(material.id) : '' });
    setFormError('');
    setNotificacion('');
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const elegirMaterialRequerido = (material: MaterialRequerido) => {
    setNuevo((anterior) => ({
      ...anterior,
      materialId: String(material.materialId),
      cantidad: material.cantidad > 0 ? String(material.cantidad) : '',
  cantidadTexto: material.cantidadTexto || '',
    }));
    setFormError('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevo((anterior) => ({ ...anterior, [name]: value }));
    setFormError('');
  };

  const handleMaterialChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    const requerido = detalle?.materiales.find((m) => String(m.materialId) === materialId);
    setNuevo((anterior) => ({
      ...anterior,
      materialId,
      cantidad: requerido && requerido.cantidad > 0 ? String(requerido.cantidad) : '',
  cantidadTexto: requerido?.cantidadTexto || '',
    }));
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    const cantidad = Number(nuevo.cantidad);
    if (nuevo.procedimientoId === '') {
      setFormError('Selecciona un procedimiento del catálogo.');
      return;
    }
    if (nuevo.materialId === '') {
      setFormError('Selecciona un material del catálogo.');
      return;
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setFormError('Ingresa una cantidad mayor que cero.');
      return;
    }
    setEnviando(true);
    try {
      await catalogoApi.crearSolicitud({
        materialId: Number(nuevo.materialId),
        procedimientoId: Number(nuevo.procedimientoId),
        cantidad,
        cantidadTexto: nuevo.cantidadTexto.trim() || undefined,
        estudiante: nombreEstudiante,
      });
      if (montadoRef.current) {
        setShowModal(false);
        setNuevo(formularioVacio);
        setNotificacion('Solicitud registrada correctamente.');
      }
      void cargarDatos();
    } catch (e) {
      if (montadoRef.current) setFormError(mensajeError(e));
    } finally {
      if (montadoRef.current) setEnviando(false);
    }
  };

  return (
    <DashboardLayout userType="estudiante" userName={nombreEstudiante}>
      <div className="ext-page">
        <div className="ext-header">
          <div>
            <h1>Insumos de Práctica</h1>
            <p className="ext-sub">Consulta el catálogo real de materiales y registra solicitudes para tus procedimientos.</p>
          </div>
          <div className="ext-actions">
            <button className="add-button" onClick={() => void cargarDatos()} disabled={actualizando}>
              <span className="material-icons">refresh</span>
              {actualizando ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button className="add-button" onClick={() => abrirSolicitud()}>
              <span className="material-icons">add_shopping_cart</span>
              Nueva Solicitud
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="ext-empty">
            <span className="material-icons">hourglass_empty</span>
            <h3>Cargando catálogo</h3>
            <p>Consultando materiales, procedimientos y solicitudes.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="ext-form-note">
                <span className="material-icons">error_outline</span>
                <span>{error}</span>
                <button className="view-all-button" onClick={() => void cargarDatos()}>Reintentar</button>
              </div>
            )}
            {notificacion && (
              <div className="ext-form-note">
                <span className="material-icons">check_circle</span>
                <span>{notificacion}</span>
              </div>
            )}

            <div className="ext-stats">
              <div className="ext-stat" style={{ '--stat-color': '#f59e0b' } as CSSProperties}>
                <span className="ext-stat-icon"><span className="material-icons">pending_actions</span></span>
                <div><strong>{pendientes}</strong><span>Solicitudes pendientes</span></div>
              </div>
              <div className="ext-stat" style={{ '--stat-color': '#0ea5e9' } as CSSProperties}>
                <span className="ext-stat-icon"><span className="material-icons">inventory_2</span></span>
                <div><strong>{materialesActivos.length}</strong><span>Insumos disponibles</span></div>
              </div>
              <div className="ext-stat" style={{ '--stat-color': '#16a34a' } as CSSProperties}>
                <span className="ext-stat-icon"><span className="material-icons">task_alt</span></span>
                <div><strong>{entregados}</strong><span>Entregados</span></div>
              </div>
              <div className="ext-stat" style={{ '--stat-color': '#7c3aed' } as CSSProperties}>
                <span className="ext-stat-icon"><span className="material-icons">warning_amber</span></span>
                <div><strong>{conStockBajo}</strong><span>Materiales con stock bajo</span></div>
              </div>
            </div>

            <div className="ext-grid">
              <div className="ext-card">
                <div className="ext-card-head">
                  <div>
                    <h2>Insumos disponibles</h2>
                    <p>Materiales registrados en el catálogo de MySQL.</p>
                  </div>
                  <div className="ext-actions">
                    <div className="search-box">
                      <span className="material-icons">search</span>
                      <input
                        type="text"
                        placeholder="Buscar insumo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select className="ext-select" value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Filtrar por categoría">
                      <option value="">Todas las categorías</option>
                      {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <select className="ext-select" value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} aria-label="Filtrar por estado de stock">
                      <option value="">Todo el stock</option>
                      <option value="agotado">Agotado</option>
                      <option value="bajo">Bajo</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>
                </div>
                <div className="ext-table-wrap">
                  <table className="ext-table">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {materialesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <div className="ext-empty">
                              <span className="material-icons">search_off</span>
                              <h3>Sin materiales</h3>
                              <p>No hay materiales que coincidan con los filtros.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        materialesFiltrados.map((material) => (
                          <tr key={material.id}>
                            <td>
                              <div className="ext-name">
                                <span className="ext-avatar"><span className="material-icons" style={{ fontSize: '1rem' }}>inventory_2</span></span>
                                <div><strong>{material.nombre}</strong><span>{material.clave || material.unidad}</span></div>
                              </div>
                            </td>
                            <td className="ext-muted">{material.categoria}</td>
                            <td>
                              <span className={`ext-pill ${clasesStock[material.estadoStock]}`}>
                                {formatearNumero(material.stock)} {material.unidad} · {etiquetasStock[material.estadoStock]}
                              </span>
                            </td>
                            <td>
                              <div className="ext-actions-cell">
                                <button
                                  className="add-button"
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                                  onClick={() => abrirSolicitud(material)}
                                >
                                  <span className="material-icons" style={{ fontSize: '0.95rem' }}>add</span>
                                  Solicitar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ext-card">
                <div className="ext-card-head">
                  <div>
                    <h2>Mis solicitudes</h2>
                    <p>Seguimiento de las solicitudes registradas.</p>
                  </div>
                  <select className="ext-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar solicitudes por estado">
                    <option value="">Todos los estados</option>
                    {estadosSolicitud.map((estado) => (
                      <option key={estado} value={estado}>{etiquetasEstado[estado]}</option>
                    ))}
                  </select>
                </div>
                <div className="ext-list">
                  {solicitudesFiltradas.length === 0 ? (
                    <div className="ext-empty">
                      <span className="material-icons">fact_check</span>
                      <h3>Sin solicitudes</h3>
                      <p>No hay solicitudes registradas con este filtro.</p>
                    </div>
                  ) : (
                    solicitudesFiltradas.map((solicitud) => (
                      <div key={solicitud.id} className="ext-list-item">
                        <span className="ext-list-icon"><span className="material-icons">science</span></span>
                        <div className="ext-list-body">
                          <strong>{solicitud.material}</strong>
                          <span>{solicitud.cantidadTexto || formatearNumero(solicitud.cantidad)} · {solicitud.fecha}</span>
                          <span>{solicitud.procedimiento || 'Sin procedimiento'} · {solicitud.estudiante}</span>
                        </div>
                        <span className={`ext-pill ${clasesEstado[solicitud.estado]}`}>
                          {etiquetasEstado[solicitud.estado]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>Nueva Solicitud</h2>
                  <p className="ext-sub" style={{ marginTop: '0.2rem' }}>Selecciona un procedimiento y un material del catálogo.</p>
                </div>
                <button className="close-button" onClick={cerrarModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && (
                    <div className="ext-form-note">
                      <span className="material-icons">error_outline</span>
                      <span>{formError}</span>
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="procedimiento">Procedimiento*</label>
                    <select id="procedimiento" name="procedimientoId" value={nuevo.procedimientoId} onChange={handleChange} required>
                      <option value="">Seleccionar procedimiento</option>
                      {procedimientos.length === 0 && <option value="" disabled>No hay procedimientos registrados</option>}
                      {procedimientos.map((procedimiento) => (
                        <option key={procedimiento.id} value={procedimiento.id}>
                          {procedimiento.procedimiento} · {procedimiento.asignatura} · {procedimiento.semestre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ext-card">
                    <div className="ext-card-head">
                      <div>
                        <h2>Materiales requeridos</h2>
                        <p>Cantidad_texto registrada para el procedimiento seleccionado.</p>
                      </div>
                    </div>
                    {detalleCargando ? (
                      <div className="ext-empty">
                        <span className="material-icons">hourglass_empty</span>
                        <h3>Cargando detalle</h3>
                      </div>
                    ) : detalleError ? (
                      <div className="ext-empty">
                        <span className="material-icons">error_outline</span>
                        <h3>No se pudo cargar el detalle</h3>
                        <p>{detalleError}</p>
                      </div>
                    ) : !detalle ? (
                      <div className="ext-empty">
                        <span className="material-icons">tune</span>
                        <h3>Selecciona un procedimiento</h3>
                        <p>Aquí se mostrarán sus materiales requeridos.</p>
                      </div>
                    ) : detalle.materiales.length === 0 ? (
                      <div className="ext-empty">
                        <span className="material-icons">inventory_2</span>
                        <h3>Sin materiales registrados</h3>
                        <p>Este procedimiento no tiene materiales asociados en el catálogo.</p>
                      </div>
                    ) : (
                      <div className="ext-table-wrap">
                        <table className="ext-table">
                          <thead>
                            <tr>
                              <th>Material</th>
                              <th>Cantidad registrada</th>
                              <th>Stock</th>
                              <th aria-label="Acciones" />
                            </tr>
                          </thead>
                          <tbody>
                            {detalle.materiales.map((material) => (
                              <tr key={material.relacionId}>
                                <td>{material.material || material.nombreOriginal}</td>
                                <td className="ext-strong">{material.cantidadTexto}</td>
                                <td className="ext-muted">{formatearNumero(material.stock)}</td>
                                <td>
                                  <button type="button" className="view-all-button" onClick={() => elegirMaterialRequerido(material)}>
                                    Elegir
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="material">Material*</label>
                    <select id="material" name="materialId" value={nuevo.materialId} onChange={handleMaterialChange} required>
                      <option value="">Seleccionar material</option>
                      {materialesActivos.length === 0 && <option value="" disabled>No hay materiales registrados</option>}
                      {materialesActivos.map((material) => (
                        <option key={material.id} value={material.id}>{material.nombre} · {material.unidad}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cantidad">Cantidad*</label>
                    <input id="cantidad" name="cantidad" type="number" min="0.001" step="any" value={nuevo.cantidad} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cantidadTexto">Cantidad (texto)</label>
                    <input
                      id="cantidadTexto"
                      name="cantidadTexto"
                      type="text"
                      value={nuevo.cantidadTexto}
                      onChange={handleChange}
                      placeholder="Cantidad en texto (opcional)"
                    />
                  </div>
                  <div className="ext-form-note">
                    <span className="material-icons">info</span>
                    <span>La solicitud quedará pendiente hasta que inventario la apruebe.</span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={enviando}>
                    {enviando ? 'Enviando...' : 'Enviar Solicitud'}
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

export default EstudianteInsumos;
