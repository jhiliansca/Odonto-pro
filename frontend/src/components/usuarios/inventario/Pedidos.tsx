import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './InventarioPages.css';
import './Pedidos.css';
import { formatNumero } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { EstadoSolicitud, Material, Procedimiento, Solicitud } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

type Estado = EstadoSolicitud;
type Orden = 'recientes' | 'cantidad' | 'estado';

const ESTADOS: Estado[] = ['pendiente', 'aprobado', 'entregado', 'rechazado'];

const ESTADO_META: Record<Estado, { label: string; icon: string; color: string; clase: string }> = {
  pendiente: { label: 'Pendiente', icon: 'pending_actions', color: '#f59e0b', clase: 'pendiente' },
  aprobado: { label: 'Aprobado', icon: 'local_shipping', color: '#0ea5e9', clase: 'en_transito' },
  entregado: { label: 'Entregado', icon: 'check_circle', color: '#16a34a', clase: 'entregado' },
  rechazado: { label: 'Rechazado', icon: 'cancel', color: '#94a3b8', clase: 'cancelado' },
};

function formatearFecha(fecha: string): string {
  if (!fecha) return '—';
  const parte = fecha.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(parte)) {
    const [anio, mes, dia] = parte.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  const convertida = new Date(fecha);
  return Number.isNaN(convertida.getTime()) ? fecha : convertida.toLocaleDateString('es-ES');
}

const InventarioPedidos: React.FC = () => {
  const userName = useCurrentUserName('Inventario');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'todos' | Estado>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [orden, setOrden] = useState<Orden>('recientes');
  const [showModal, setShowModal] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId] = useState<number | null>(null);
  const [nuevoPedido, setNuevoPedido] = useState({
    materialId: 0,
    cantidad: 1,
    procedimientoId: 0,
    estudiante: '',
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosSolicitudes, datosMateriales, datosProcedimientos] = await Promise.all([
        catalogoApi.solicitudes(),
        catalogoApi.materiales(),
        catalogoApi.procedimientos(),
      ]);
      setSolicitudes(datosSolicitudes);
      setMateriales(datosMateriales);
      setProcedimientos(datosProcedimientos);
      setNuevoPedido(prev =>
        prev.materialId === 0 && datosMateriales.length > 0 ? { ...prev, materialId: datosMateriales[0].id }
          : prev
      );
    } catch (err) {
      setSolicitudes([]);
      setMateriales([]);
      setProcedimientos([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo real.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const intervalo = window.setInterval(() => {
      void cargar();
    }, 15000);
    return () => window.clearInterval(intervalo);
  }, [cargar]);

  const itemSeleccionado = materiales.find(m => m.id === nuevoPedido.materialId) || null;
  const pedidoDetalle = solicitudes.find(s => s.id === detalleId) || null;
  const materialDetalle = materiales.find(m => m.id === pedidoDetalle?.materialId) || null;

  const conteos = useMemo(
    () =>
      ESTADOS.reduce(
        (acc, estado) => ({ ...acc, [estado]: solicitudes.filter(s => s.estado === estado).length }),
        {} as Record<Estado, number>
      ),
    [solicitudes]
  );

  const stats = useMemo(
    () => ({
      total: solicitudes.length,
      pendientes: conteos.pendiente,
      aprobados: conteos.aprobado,
      catalogo: materiales.length,
    }),
    [solicitudes.length, conteos, materiales.length]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const resultado = solicitudes.filter(solicitud => {
      const matchesTab = activeTab === 'todos' || solicitud.estado === activeTab;
      const matchesSearch =
        !term ||
        `sol-${solicitud.id}`.includes(term) ||
        solicitud.material.toLowerCase().includes(term) ||
        (solicitud.procedimiento || '').toLowerCase().includes(term) ||
        (solicitud.estudiante || '').toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });

    return [...resultado].sort((a, b) => {
      if (orden === 'cantidad') return b.cantidad - a.cantidad;
      if (orden === 'estado') return a.estado.localeCompare(b.estado);
      return b.id - a.id;
    });
  }, [solicitudes, activeTab, searchTerm, orden]);

  const resetForm = () =>
    setNuevoPedido({
      materialId: materiales[0]?.id || 0,
      cantidad: 1,
      procedimientoId: 0,
      estudiante: '',
    });

  const handleNuevoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoPedido(prev => ({
      ...prev,
      [name]:
        name === 'cantidad' || name === 'materialId' || name === 'procedimientoId'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSeleccionado || guardando) return;

    setGuardando(true);
    setError(null);
    try {
      await catalogoApi.crearSolicitud({
        materialId: itemSeleccionado.id,
        cantidad: nuevoPedido.cantidad,
        estudiante: nuevoPedido.estudiante.trim() || undefined,
        procedimientoId: nuevoPedido.procedimientoId || undefined,
      });
      setShowModal(false);
      resetForm();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (solicitud: Solicitud, estado: Estado) => {
    setAccionId(solicitud.id);
    setError(null);
    try {
      await catalogoApi.cambiarEstadoSolicitud(solicitud.id, estado);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setAccionId(null);
    }
  };

  const pasos: Estado[] = ['pendiente', 'aprobado', 'entregado'];
  const indiceEstado = pedidoDetalle ? pasos.indexOf(pedidoDetalle.estado) : -1;

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="inv-container ped-container">
        <div className="page-header">
          <div>
            <h1>Pedidos</h1>
            <p className="ped-subtitulo">
              Gestiona las solicitudes reales de insumos registradas desde el catálogo MySQL.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="cancel-button"
              onClick={() => void cargar()}
              disabled={cargando}
              style={{ marginRight: '0.6rem' }}
            >
              <span className="material-icons">refresh</span>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button className="add-button" onClick={() => setShowModal(true)} disabled={materiales.length === 0}>
              <span className="material-icons">add_circle</span>
              Nueva solicitud
            </button>
          </div>
        </div>

        {error ? (
          <div className="no-results" role="alert">
            <span className="material-icons">error_outline</span>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="stats-grid">
          <Card title="Total solicitudes" value={stats.total} icon="receipt_long" color="#8b5cf6" />
          <Card title="Pendientes" value={stats.pendientes} icon="pending_actions" color="#f59e0b" />
          <Card title="Aprobadas" value={stats.aprobados} icon="local_shipping" color="#0ea5e9" />
          <Card title="Materiales en catálogo" value={stats.catalogo} icon="inventory_2" color="#16a34a" />
        </div>

        <div className="ped-resumen">
          {ESTADOS.map(estado => {
            const meta = ESTADO_META[estado];
            const cantidad = conteos[estado];
            const porcentaje = stats.total > 0 ? Math.round((cantidad / stats.total) * 100) : 0;
            return (
              <button
                key={estado}
                type="button"
                className={`ped-resumen-item ${activeTab === estado ? 'activo' : ''}`}
                style={{ '--estado-color': meta.color } as React.CSSProperties}
                onClick={() => setActiveTab(activeTab === estado ? 'todos' : estado)}
              >
                <span className="material-icons">{meta.icon}</span>
                <div className="ped-resumen-datos">
                  <strong>{cantidad}</strong>
                  <span>{meta.label}</span>
                  <div className="ped-resumen-barra">
                    <span style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
                <span className="ped-resumen-pct">{porcentaje}%</span>
              </button>
            );
          })}
        </div>

        <div className="filter-container ped-toolbar">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>
              Todos <span className="ped-tab-count">{stats.total}</span>
            </button>
            {ESTADOS.map(estado => (
              <button
                key={estado}
                className={`tab ${activeTab === estado ? 'active' : ''}`}
                onClick={() => setActiveTab(estado)}
              >
                {ESTADO_META[estado].label} <span className="ped-tab-count">{conteos[estado]}</span>
              </button>
            ))}
          </div>

          <div className="ped-toolbar-right">
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Buscar por material, procedimiento o solicitante..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sort-box">
              <span className="material-icons">swap_vert</span>
              <select value={orden} onChange={e => setOrden(e.target.value as Orden)} aria-label="Ordenar solicitudes">
                <option value="recientes">Más recientes</option>
                <option value="cantidad">Mayor cantidad</option>
                <option value="estado">Estado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="dashboard-panel ped-panel">
          {filtered.length > 0 ? (
            <>
              <div className="ped-tabla-wrap">
                <table className="ped-tabla">
                  <thead>
                    <tr>
                      <th>Solicitud</th>
                      <th>Procedimiento</th>
                      <th>Cantidad</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(solicitud => {
                      const meta = ESTADO_META[solicitud.estado];
                      const deshabilitado = accionId === solicitud.id;
                      return (
                        <tr key={solicitud.id} className={`ped-fila estado-${meta.clase}`}>
                          <td>
                            <div className="ped-producto">
                              <span className="ped-avatar">
                                <span className="material-icons">{meta.icon}</span>
                              </span>
                              <div>
                                <strong>{solicitud.material}</strong>
                                <span className="ped-codigo">SOL-{String(solicitud.id).padStart(4, '0')}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="ped-proveedor">{solicitud.procedimiento || 'Sin procedimiento'}</span>
                          </td>
                          <td>
                            <span className="ped-cantidad">{formatNumero(solicitud.cantidad)}</span>
                          </td>
                          <td>
                            <span className={`ped-estado ${meta.clase}`}>{meta.label}</span>
                          </td>
                          <td>
                            <div className="ped-fechas">
                              <span>
                                <span className="material-icons">event</span>
                                {formatearFecha(solicitud.fecha)}
                              </span>
                              <span className="ped-entrega">{solicitud.estudiante || 'Solicitud registrada'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="ped-acciones">
                              <button
                                className="icon-button"
                                aria-label={`Ver detalle de SOL-${solicitud.id}`}
                                title="Ver detalle"
                                onClick={() => setDetalleId(solicitud.id)}
                              >
                                <span className="material-icons">visibility</span>
                              </button>
                              {solicitud.estado === 'pendiente' ? (
                                <>
                                  <button
                                    className="icon-button"
                                    aria-label={`Aprobar SOL-${solicitud.id}`}
                                    title="Aprobar"
                                    disabled={deshabilitado}
                                    onClick={() => void cambiarEstado(solicitud, 'aprobado')}
                                  >
                                    <span className="material-icons">check_circle</span>
                                  </button>
                                  <button
                                    className="icon-button"
                                    aria-label={`Rechazar SOL-${solicitud.id}`}
                                    title="Rechazar"
                                    disabled={deshabilitado}
                                    onClick={() => void cambiarEstado(solicitud, 'rechazado')}
                                  >
                                    <span className="material-icons">cancel</span>
                                  </button>
                                </>
                              ) : null}
                              {solicitud.estado === 'aprobado' ? (
                                <>
                                  <button
                                    className="icon-button"
                                    aria-label={`Entregar SOL-${solicitud.id}`}
                                    title="Entregar"
                                    disabled={deshabilitado}
                                    onClick={() => void cambiarEstado(solicitud, 'entregado')}
                                  >
                                    <span className="material-icons">local_shipping</span>
                                  </button>
                                  <button
                                    className="icon-button"
                                    aria-label={`Rechazar SOL-${solicitud.id}`}
                                    title="Rechazar"
                                    disabled={deshabilitado}
                                    onClick={() => void cambiarEstado(solicitud, 'rechazado')}
                                  >
                                    <span className="material-icons">cancel</span>
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ped-pie">
                <span>
                  Mostrando <strong>{filtered.length}</strong> de <strong>{solicitudes.length}</strong> solicitudes
                </span>
                <span> Pendientes: <strong>{stats.pendientes}</strong>
                </span>
              </div>
            </>
          ) : (
            <div className="no-results">
              <span className="material-icons">receipt_long</span>
              <h3>Sin solicitudes</h3>
              <p>
                {error ? 'No fue posible obtener las solicitudes del catálogo real.'
                  : 'No se encontraron solicitudes con los filtros seleccionados.'}
              </p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content ped-modal">
              <div className="modal-header">
                <div>
                  <h2>Nueva solicitud de insumos</h2>
                  <p className="ped-modal-sub">Registra una solicitud usando el catálogo real de materiales.</p>
                </div>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="materialId">Material*</label>
                    <select
                      id="materialId"
                      name="materialId"
                      value={nuevoPedido.materialId}
                      onChange={handleNuevoChange}
                      required
                    >
                      <option value={0}>Seleccionar material</option>
                      {materiales.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.nombre} · stock {formatNumero(material.stock)} {material.unidad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cantidad">Cantidad*</label>
                      <input
                        type="number"
                        id="cantidad"
                        name="cantidad"
                        min="1"
                        value={nuevoPedido.cantidad}
                        onChange={handleNuevoChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="estudiante">Solicitante</label>
                      <input
                        type="text"
                        id="estudiante"
                        name="estudiante"
                        value={nuevoPedido.estudiante}
                        onChange={handleNuevoChange}
                        placeholder="Nombre del solicitante"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="procedimientoId">Procedimiento</label>
                    <select
                      id="procedimientoId"
                      name="procedimientoId"
                      value={nuevoPedido.procedimientoId}
                      onChange={handleNuevoChange}
                    >
                      <option value={0}>Sin procedimiento</option>
                      {procedimientos.map(procedimiento => (
                        <option key={procedimiento.id} value={procedimiento.id}>
                          {procedimiento.procedimiento} · {procedimiento.semestre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ped-resumen-orden">
                    <div>
                      <span>Unidad</span>
                      <strong>{itemSeleccionado?.unidad || '—'}</strong>
                    </div>
                    <div>
                      <span>Stock disponible</span>
                      <strong>
                        {itemSeleccionado ? formatNumero(itemSeleccionado.stock) : '—'}
                      </strong>
                    </div>
                    <div>
                      <span>Categoría</span>
                      <strong className="ped-total-destacado">{itemSeleccionado?.categoria || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="submit-button" disabled={guardando || !itemSeleccionado}>
                    <span className="material-icons">add_shopping_cart</span>
                    {guardando ? 'Registrando…' : 'Crear solicitud'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {pedidoDetalle && (
          <div className="modal-overlay" onClick={() => setDetalleId(null)}>
            <div className="modal-content ped-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Detalle de la solicitud</h2>
                  <p className="ped-modal-sub">
                    SOL-{String(pedidoDetalle.id).padStart(4, '0')} · {pedidoDetalle.material}
                  </p>
                </div>
                <button className="close-button" onClick={() => setDetalleId(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="modal-body">
                <div className="ped-detalle-estado">
                  <span className={`ped-estado ${ESTADO_META[pedidoDetalle.estado].clase}`}>
                    {ESTADO_META[pedidoDetalle.estado].label}
                  </span>
                  <strong>
                    {formatNumero(pedidoDetalle.cantidad)} {materialDetalle?.unidad || ''}
                  </strong>
                </div>

                <div className="ped-detalle-grid">
                  <div>
                    <span>Material</span>
                    <strong>{pedidoDetalle.material}</strong>
                  </div>
                  <div>
                    <span>Procedimiento</span>
                    <strong>{pedidoDetalle.procedimiento || 'Sin procedimiento'}</strong>
                  </div>
                  <div>
                    <span>Cantidad</span>
                    <strong>{formatNumero(pedidoDetalle.cantidad)}</strong>
                  </div>
                  <div>
                    <span>Solicitante</span>
                    <strong>{pedidoDetalle.estudiante || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span>Fecha</span>
                    <strong>{formatearFecha(pedidoDetalle.fecha)}</strong>
                  </div>
                  <div>
                    <span>Código</span>
                    <strong>SOL-{String(pedidoDetalle.id).padStart(4, '0')}</strong>
                  </div>
                </div>

                {pedidoDetalle.estado === 'rechazado' ? (
                  <div className="ped-cancelado">
                    <span className="material-icons">cancel</span>
                    Esta solicitud fue rechazada.
                  </div>
                ) : (
                  <div className="ped-timeline">
                    {pasos.map((paso, i) => (
                      <div
                        key={paso}
                        className={`ped-paso ${i <= indiceEstado ? 'completado' : ''} ${i === indiceEstado ? 'actual' : ''}`}
                      >
                        <span className="ped-paso-icono material-icons">
                          {i <= indiceEstado ? 'check' : ESTADO_META[paso].icon}
                        </span>
                        <span className="ped-paso-label">{ESTADO_META[paso].label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={() => setDetalleId(null)}>
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

export default InventarioPedidos;
