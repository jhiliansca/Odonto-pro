import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import './InventarioPages.css';
import { catalogoApi } from '../../../services/catalogoApi';
import type { AlertaStock, AlertasResponse, CaducidadesResponse } from '../../../services/catalogoApi';
import { formatBs } from '../../../utils/formato';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

type Severidad = AlertaStock['severidad'];

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

const InventarioAlertas: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Inventario');
  const [datos, setDatos] = useState<AlertasResponse | null>(null);
  const [caducidades, setCaducidades] = useState<CaducidadesResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [alertas, lotes] = await Promise.all([
        catalogoApi.alertas(),
        catalogoApi.caducidades({ estado: 'proximo', dias: 30 }),
      ]);
      setDatos(alertas);
      setCaducidades(lotes);
    } catch (err) {
      setDatos(null);
      setCaducidades(null);
      setError(err instanceof Error ? err.message : 'No se pudo cargar las alertas de stock.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => { void cargar(); }, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const alertas = datos?.alertas || [];

  const filtered = alertas.filter((alerta) => {
    const matchesTab = activeTab === 'todas' || alerta.severidad === activeTab;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      alerta.producto.toLowerCase().includes(term) ||
      alerta.clave.toLowerCase().includes(term) ||
      alerta.categoria.toLowerCase().includes(term) ||
      (alerta.proveedor || '').toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  const getSevLabel = (sev: Severidad) =>
    sev === 'critico' ? 'Crítico' : sev === 'bajo' ? 'Stock Bajo' : 'Por Agotar';

  const getSevIcon = (sev: Severidad) =>
    sev === 'critico' ? 'error' : sev === 'bajo' ? 'warning' : 'hourglass_bottom';

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="inv-container">
        <div className="page-header">
          <h1>Alertas de Stock Detalladas</h1>
          <button className="add-button" onClick={() => void cargar()} disabled={cargando}>
            <span className="material-icons">refresh</span>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="alertas-summary">
          <div className="alerta-summary-card critico">
            <span className="material-icons">error</span>
            <div><strong>{datos?.resumen.critico ?? 0}</strong><p>Stock crítico</p></div>
          </div>
          <div className="alerta-summary-card bajo">
            <span className="material-icons">warning</span>
            <div><strong>{datos?.resumen.bajo ?? 0}</strong><p>Stock bajo</p></div>
          </div>
          <div className="alerta-summary-card por_agotar">
            <span className="material-icons">hourglass_bottom</span>
            <div><strong>{datos?.resumen.porAgotar ?? 0}</strong><p>Por agotar</p></div>
          </div>
          <div className="alerta-summary-card caducidad">
            <span className="material-icons">event_busy</span>
            <div><strong>{caducidades?.resumen.porVencer ?? 0}</strong><p>Lotes por vencer</p></div>
          </div>
        </div>

        {(caducidades?.resumen.vencidos ?? 0) > 0 || (caducidades?.resumen.porVencer ?? 0) > 0 ? (
          <div className="alertas-caducidad-banner">
            <span className="material-icons">event_busy</span>
            <div>
              <strong>Control por caducidad</strong>
              <p>
                {caducidades?.resumen.vencidos ?? 0} lote(s) vencido(s) y {caducidades?.resumen.porVencer ?? 0} por vencer.
                 Valor en riesgo: {formatBs(caducidades?.resumen.valorEnRiesgo ?? 0)}.
              </p>
            </div>
            <button className="cancel-button" onClick={() => navigate('/inventario/caducidades')}>
              Ver control de caducidad <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        ) : null}

        <div className="filter-container">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todas' ? 'active' : ''}`} onClick={() => setActiveTab('todas')}>Todas</button>
            <button className={`tab ${activeTab === 'critico' ? 'active' : ''}`} onClick={() => setActiveTab('critico')}>Críticas</button>
            <button className={`tab ${activeTab === 'bajo' ? 'active' : ''}`} onClick={() => setActiveTab('bajo')}>Stock Bajo</button>
            <button className={`tab ${activeTab === 'por_agotar' ? 'active' : ''}`} onClick={() => setActiveTab('por_agotar')}>Por Agotar</button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input type="text" placeholder="Buscar producto, clave o proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="inv-list">
          {error ? (
            <div className="no-results" role="alert"><span className="material-icons">cloud_off</span><p>{error}</p><button className="cancel-button" onClick={() => void cargar()}>Reintentar</button></div>
          ) : cargando ? (
            <div className="no-results"><span className="material-icons sync-spin">sync</span><p>Cargando alertas desde la base de datos...</p></div>
          ) : filtered.length > 0 ? (
            filtered.map((alerta, i) => {
              const movimiento = alerta.ultimoMovimiento;
              const color = alerta.severidad === 'critico' ? '#ef4444' : alerta.severidad === 'bajo' ? '#f59e0b' : '#eab308';
              const lotes = [...alerta.lotesVencidos, ...alerta.lotesProximos];
              return (
                <div key={alerta.id} className={`inv-card alerta alerta-rich ${alerta.severidad}`} style={{ animationDelay: `${i * 45}ms` }}>
                  <div className={`inv-avatar alerta-icon pulse-${alerta.severidad}`}><span className="material-icons">{getSevIcon(alerta.severidad)}</span></div>
                  <div className="inv-info">
                    <div className="alerta-title-row">
                      <h3>{alerta.producto}</h3>
                      <span className={`inv-badge ${alerta.severidad}`}>{getSevLabel(alerta.severidad)}</span>
                    </div>
                    <p className="inv-categoria">
                      {alerta.categoria} · Clave: {alerta.clave} · Unidad: {alerta.unidad}
                      {alerta.proveedor ? ` · Proveedor: ${alerta.proveedor}` : ' · Sin proveedor asignado'}
                    </p>
                    <div className="stock-bar-container stock-bar-rich">
                      <div className="stock-bar" style={{ width: `${alerta.porcentajeMinimo}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                      <span className="stock-bar-pct">{Math.round(alerta.porcentajeMinimo)}%</span>
                    </div>
                    <div className="alerta-kpi-grid">
                      <div className="alerta-kpi"><small>Stock actual</small><strong>{alerta.stock}</strong></div>
                      <div className="alerta-kpi"><small>Stock mínimo</small><strong>{alerta.stockMinimo}</strong></div>
                      <div className="alerta-kpi"><small>Faltante</small><strong style={{color}}>{alerta.faltante}</strong></div>
                      <div className="alerta-kpi"><small>Cobertura</small><strong>{alerta.diasCobertura === null ? '—' : `${alerta.diasCobertura} días`}</strong></div>
                      <div className="alerta-kpi"><small>Consumo 30d</small><strong>{alerta.consumo30}</strong></div>
                      <div className="alerta-kpi"><small>Entradas 30d</small><strong>{alerta.entradas30}</strong></div>
                      <div className="alerta-kpi"><small>Promedio diario</small><strong>{alerta.promedioDiario}</strong></div>
                      <div className="alerta-kpi"><small>Detectado</small><strong>{formatearFecha(alerta.fechaDeteccion)}</strong></div>
                    </div>
                    <p className="inv-dato">
                      <span className="material-icons">swap_vert</span>
                      {movimiento
                        ? `Último movimiento: ${movimiento.tipo} ${movimiento.cantidad} · ${movimiento.motivo || 'Sin motivo'} · ${formatearFecha(movimiento.fecha)} · ${movimiento.usuario}`
                        : 'Sin movimientos registrados'}
                    </p>
                    {lotes.length > 0 ? (
                      <div className="alerta-lotes">
                        <span className="material-icons">inventory_2</span>
                        <div>
                          <strong>Lotes con caducidad cercana</strong>
                          {lotes.slice(0, 3).map((lote) => (
                            <p key={lote.id}>
                              {lote.codigoLote} · {lote.cantidadActual} {lote.unidad} ·
                              {lote.diasRestantes < 0 ? ` vencido hace ${Math.abs(lote.diasRestantes)} días` : ` ${lote.diasRestantes} días restantes`}
                              {lote.ubicacion ? ` · ${lote.ubicacion}` : ''}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="alerta-sugerencia"><span className="material-icons">lightbulb</span>{alerta.accion}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results"><span className="material-icons">check_circle</span><p>No hay alertas de stock con los filtros seleccionados</p></div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventarioAlertas;
