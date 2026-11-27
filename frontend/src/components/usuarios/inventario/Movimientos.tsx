import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import '../RoleExtra.css';
import './Movimientos.css';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Material, MovimientoMaterial } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

type FiltroTipo = 'todos' | 'ENTRADA' | 'SALIDA';

function formatearFecha(fecha: string): string {
  if (!fecha) return '—';
  const parte = fecha.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(parte)) {
    const [anio, mes, dia] = parte.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  const fechaConvertida = new Date(fecha);
  return Number.isNaN(fechaConvertida.getTime()) ? fecha : fechaConvertida.toLocaleDateString('es-ES');
}

function partesFecha(fecha: string): { fecha: string; hora: string } {
  const coincidencia = fecha.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (coincidencia) {
    return { fecha: formatearFecha(coincidencia[1]), hora: coincidencia[2] };
  }
  const fechaConvertida = new Date(fecha);
  if (Number.isNaN(fechaConvertida.getTime())) return { fecha: fecha || '—', hora: '' };
  return {
    fecha: fechaConvertida.toLocaleDateString('es-ES'),
    hora: fechaConvertida.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

const InventarioMovimientos: React.FC = () => {
  const userName = useCurrentUserName('Inventario');
  const [movimientos, setMovimientos] = useState<MovimientoMaterial[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FiltroTipo>('todos');
  const [filtroMaterialId, setFiltroMaterialId] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [nuevo, setNuevo] = useState({
    materialId: 0,
    tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA',
    cantidad: 1,
    motivo: '',
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosMovimientos, datosMateriales] = await Promise.all([
        catalogoApi.movimientos(filtroMaterialId > 0 ? { materialId: filtroMaterialId } : {}),
        catalogoApi.materiales(),
      ]);
      setMovimientos(datosMovimientos);
      setMateriales(datosMateriales);
      if (datosMateriales.length > 0) {
        setNuevo(prev => (prev.materialId ? prev : { ...prev, materialId: datosMateriales[0].id }));
      }
    } catch (err) {
      setMovimientos([]);
      setMateriales([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar los movimientos.');
    } finally {
      setCargando(false);
    }
  }, [filtroMaterialId]);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => { void cargar(); }, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const filtrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return movimientos.filter(movimiento => {
      const matchesTab = activeTab === 'todos' || movimiento.tipo === activeTab;
      const matchesSearch = !term ||
        movimiento.material.toLowerCase().includes(term) ||
        (movimiento.motivo || '').toLowerCase().includes(term) ||
        (movimiento.usuario || '').toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [movimientos, activeTab, searchTerm]);

  const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').reduce((s, m) => s + m.cantidad, 0);
  const salidas = movimientos.filter(m => m.tipo === 'SALIDA').reduce((s, m) => s + m.cantidad, 0);
  const saldo = entradas - salidas;
  const nEntradas = movimientos.filter(m => m.tipo === 'ENTRADA').length;
  const nSalidas = movimientos.filter(m => m.tipo === 'SALIDA').length;
  const totalMov = movimientos.length;
  const pct = (n: number) => (totalMov ? Math.round((n / totalMov) * 100) : 0);

  const kpis: {
    clave: string;
    filtro: FiltroTipo;
    icon: string;
    label: string;
    value: number;
    meta: string;
    color: string;
    bar: number;
  }[] = [
    { clave: 'entrada', filtro: 'ENTRADA', icon: 'add_box', label: 'Unidades ingresadas', value: entradas, meta: `${nEntradas} movimientos`, color: '#16a34a', bar: pct(nEntradas) },
    { clave: 'salida', filtro: 'SALIDA', icon: 'outbox', label: 'Unidades retiradas', value: salidas, meta: `${nSalidas} movimientos`, color: '#dc2626', bar: pct(nSalidas) },
    { clave: 'saldo', filtro: 'todos', icon: 'tune', label: 'Saldo neto de unidades', value: saldo, meta: `${materiales.length} materiales en catálogo`, color: '#f59e0b', bar: pct(nEntradas) },
    { clave: 'total', filtro: 'todos', icon: 'receipt_long', label: 'Movimientos totales', value: totalMov, meta: `${entradas + salidas} u. registradas`, color: '#059669', bar: 100 },
  ];

  const abrirModal = () => {
    setNuevo({ materialId: materiales[0]?.id || 0, tipo: 'ENTRADA', cantidad: 1, motivo: '' });
    setFormSuccess('');
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevo(prev => ({
      ...prev,
      [name]: name === 'materialId' || name === 'cantidad' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (nuevo.materialId <= 0 || nuevo.cantidad <= 0) {
      setFormError('Selecciona un material y una cantidad mayor a cero.');
      return;
    }
    setGuardando(true);
    try {
      await catalogoApi.registrarMovimiento({
        materialId: nuevo.materialId,
        tipo: nuevo.tipo,
        cantidad: nuevo.cantidad,
        motivo: nuevo.motivo.trim() || undefined,
      });
      setFormSuccess('Movimiento registrado correctamente. El stock se actualizó en la base de datos.');
      await cargar();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="ext-page">
        <div className="ext-header">
          <div>
            <h1>Movimientos de Inventario</h1>
            <p className="ext-sub">Registra entradas y salidas reales para mantener el stock actualizado y trazable.</p>
          </div>
          <div className="ext-actions">
            <button className="add-button" onClick={() => void cargar()} disabled={cargando}>
              <span className="material-icons">refresh</span>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button className="add-button" onClick={abrirModal}>
              <span className="material-icons">swap_vert</span>
              Registrar Movimiento
            </button>
          </div>
        </div>

        <div className="mov-kpis">
          {kpis.map(kpi => (
            <button
              key={kpi.clave}
              type="button"
              className={`mov-kpi ${activeTab === kpi.filtro && kpi.clave !== 'saldo' ? 'is-active' : ''}`}
              style={{ '--kpi-color': kpi.color } as React.CSSProperties}
              onClick={() => setActiveTab(kpi.filtro)}
              aria-pressed={activeTab === kpi.filtro}
            >
              <span className="mov-kpi-top">
                <span className="mov-kpi-icon">
                  <span className="material-icons">{kpi.icon}</span>
                </span>
                <span className="mov-kpi-value">{kpi.value}</span>
              </span>
              <span className="mov-kpi-label">{kpi.label}</span>
              <span className="mov-kpi-meta">{kpi.meta}</span>
              <span className="mov-kpi-bar">
                <span style={{ width: `${kpi.bar}%` }} />
              </span>
            </button>
          ))}
        </div>

        <div className="ext-toolbar">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>
              Todos <span className="ext-tab-count">{movimientos.length}</span>
            </button>
            <button className={`tab ${activeTab === 'ENTRADA' ? 'active' : ''}`} onClick={() => setActiveTab('ENTRADA')}>
              Entradas <span className="ext-tab-count">{nEntradas}</span>
            </button>
            <button className={`tab ${activeTab === 'SALIDA' ? 'active' : ''}`} onClick={() => setActiveTab('SALIDA')}>
              Salidas <span className="ext-tab-count">{nSalidas}</span>
            </button>
          </div>
          <select
            className="ext-select"
            aria-label="Filtrar por material"
            value={filtroMaterialId}
            onChange={e => setFiltroMaterialId(Number(e.target.value))}
          >
            <option value={0}>Todos los materiales</option>
            {materiales.map(material => (
              <option key={material.id} value={material.id}>{material.nombre}</option>
            ))}
          </select>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar producto, motivo o usuario..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ext-card">
          {error ? (
            <div className="ext-empty" role="alert">
              <span className="material-icons">cloud_off</span>
              <h3>Error al cargar</h3>
              <p>{error}</p>
              <button className="cancel-button" onClick={() => void cargar()}>Reintentar</button>
            </div>
          ) : cargando ? (
            <div className="ext-empty">
              <span className="material-icons">sync</span>
              <h3>Cargando movimientos…</h3>
              <p>Consultando la base de datos.</p>
            </div>
          ) : filtrados.length > 0 ? (
            <div className="ext-table-wrap">
              <table className="ext-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="col-tipo">Tipo</th>
                    <th className="num">Cantidad</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(movimiento => {
                    const esEntrada = movimiento.tipo === 'ENTRADA';
                    const tipoClase = movimiento.tipo.toLowerCase();
                    const fechaHora = partesFecha(movimiento.fecha);
                    return (
                      <tr key={movimiento.id}>
                        <td>
                          <div className="ext-name">
                            <span className={`ext-avatar mov-${tipoClase}`}>
                              <span className="material-icons" style={{ fontSize: '1rem' }}>inventory_2</span>
                            </span>
                            <div>
                              <strong>{movimiento.material}</strong>
                              <span>{fechaHora.hora}</span>
                            </div>
                          </div>
                        </td>
                        <td className="col-tipo">
                          <span className={`ext-pill ${tipoClase}`}>
                            <span className="material-icons">{esEntrada ? 'add_box' : 'outbox'}</span>
                            {esEntrada ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="num">
                          <strong className="ext-strong" style={{ color: esEntrada ? '#16a34a' : '#dc2626' }}>
                            {esEntrada ? '+' : '-'}{movimiento.cantidad}
                          </strong>
                        </td>
                        <td className="ext-muted">{movimiento.motivo || '—'}</td>
                        <td>{movimiento.usuario || 'Sistema'}</td>
                        <td className="ext-muted">{fechaHora.fecha}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ext-empty">
              <span className="material-icons">swap_vert</span>
              <h3>Sin movimientos</h3>
              <p>No hay movimientos que coincidan con los filtros seleccionados.</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>Registrar Movimiento</h2>
                  <p className="ext-sub" style={{ marginTop: '0.2rem' }}>El movimiento se registra con la fecha actual y actualiza el stock en la base de datos.</p>
                </div>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              {formSuccess ? (
                <div className="success-message">
                  <span className="material-icons">check_circle</span>
                  <p>{formSuccess}</p>
                  <button className="submit-button" onClick={() => setShowModal(false)}>Cerrar</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="materialId">Material*</label>
                      <select id="materialId" name="materialId" value={nuevo.materialId} onChange={handleChange} required>
                        {materiales.length === 0 && <option value={0}>No hay materiales disponibles</option>}
                        {materiales.map(material => (
                          <option key={material.id} value={material.id}>{material.nombre} · stock {material.stock} {material.unidad}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="tipo">Tipo de movimiento*</label>
                        <select id="tipo" name="tipo" value={nuevo.tipo} onChange={handleChange} required>
                          <option value="ENTRADA">Entrada</option>
                          <option value="SALIDA">Salida</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="cantidad">Cantidad*</label>
                        <input id="cantidad" name="cantidad" type="number" min="1" value={nuevo.cantidad} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="motivo">Motivo</label>
                      <input id="motivo" name="motivo" type="text" value={nuevo.motivo} onChange={handleChange} placeholder="Ej. Compra a proveedor" />
                    </div>
                    {formError && (
                      <div className="form-group" style={{ color: '#dc2626' }} role="alert">
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>error</span> {formError}
                      </div>
                    )}
                    <div className="ext-form-note">
                      <span className="material-icons">info</span>
                      <span>Las entradas suman unidades al stock y las salidas las descuentan.</span>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancelar</button>
                    <button type="submit" className="submit-button" disabled={guardando || materiales.length === 0}>
                      {guardando ? 'Guardando…' : 'Guardar Movimiento'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventarioMovimientos;
