import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import MiniBars from '../MiniBars';
import './Dashboard.css';
import { formatBs } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Material, MovimientoMaterial, ResumenCatalogo, Solicitud } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

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

const InventarioDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Inventario');
  const [resumen, setResumen] = useState<ResumenCatalogo | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoMaterial[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosResumen, datosStockBajo, datosMovimientos, datosSolicitudes] = await Promise.all([
        catalogoApi.resumen(),
        catalogoApi.materiales({ stockBajo: true }),
        catalogoApi.movimientos({ limit: 4 }),
        catalogoApi.solicitudes('pendiente'),
      ]);
      setResumen(datosResumen);
      setMateriales(datosStockBajo);
      setMovimientos(datosMovimientos);
      setSolicitudes(datosSolicitudes);
    } catch (err) {
      setResumen(null);
      setMateriales([]);
      setMovimientos([]);
      setSolicitudes([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el panel de inventario.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => { void cargar(); }, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const stockCritico = useMemo(
    () => materiales.slice(0, 6).map((material) => ({ etiqueta: material.nombre, valor: material.stock })),
    [materiales]
  );

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="inventario-dashboard" style={{ '--role-color': '#059669' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Inventario</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <button className="add-button" onClick={() => void cargar()} disabled={cargando}>
              <span className="material-icons">refresh</span>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Control de inventario</span>
            <h2>Bienvenida, {userName}</h2>
            <p>
              Supervisa el stock de insumos, coordina pedidos, controla vencimientos y mantén al día a tus proveedores.
              {resumen ? ` Valor en almacén: ${formatBs(resumen.valorTotal)}.` : ''}
              {resumen ? ` ${resumen.lotesPorVencer} lote(s) por vencer y ${resumen.lotesVencidos} vencido(s).` : ''}
              {resumen?.actualizado ? ` Datos actualizados: ${formatearFecha(resumen.actualizado)}.` : ''}
            </p>
          </div>
          <span className="welcome-icon material-icons">inventory_2</span>
        </div>

        {error && (
          <div className="no-results" role="alert">
            <span className="material-icons">cloud_off</span>
            <p>{error}</p>
            <button className="cancel-button" onClick={() => void cargar()}>Reintentar</button>
          </div>
        )}

        <div className="stats-grid">
          <Card
            title="Total de Materiales"
            value={resumen?.materiales || 0}
            icon="inventory_2"
            color="#8b5cf6"
            onClick={() => navigate('/inventario/productos')}
          />
          <Card
            title="Productos Bajo Stock"
            value={materiales.length}
            icon="warning"
            color="#ef4444"
            onClick={() => navigate('/inventario/alertas')}
          />
          <Card
            title="Solicitudes Pendientes"
            value={solicitudes.length}
            icon="shopping_cart"
            color="#f59e0b"
            onClick={() => navigate('/inventario/pedidos')}
          />
          <Card
            title="Procedimientos"
            value={resumen?.procedimientos || 0}
            icon="local_shipping"
            color="#16a34a"
            onClick={() => navigate('/inventario/reportes')}
          />
          <Card
            title="Lotes por vencer"
            value={resumen?.lotesPorVencer || 0}
            icon="event"
            color="#f59e0b"
            onClick={() => navigate('/inventario/caducidades')}
          />
          <Card
            title="Caducidad en riesgo"
            value={formatBs(resumen?.valorCaducidadRiesgo || 0)}
            icon="event_busy"
            color="#dc2626"
            onClick={() => navigate('/inventario/caducidades')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Productos Bajo Stock</h2>
                <button className="view-all-button" onClick={() => navigate('/inventario/alertas')}>Ver todos</button>
              </div>
              <div className="low-stock-list">
                {cargando && !error ? (
                  <div className="no-results"><p>Cargando materiales…</p></div>
                ) : !error && materiales.length === 0 ? (
                  <div className="no-results"><p>No hay materiales con stock bajo.</p></div>
                ) : (
                  materiales.map(material => {
                    const proporcion = material.stockMinimo > 0 ? (material.stock / material.stockMinimo) * 100 : 100;
                    return (
                      <div key={material.id} className="low-stock-item">
                        <div className="product-info">
                          <div className="product-name">{material.nombre}</div>
                          <div className="product-supplier">{material.clave} · {material.categoria}</div>
                        </div>
                        <div className="stock-info">
                          <div className="stock-bar-container">
                            <div
                              className="stock-bar"
                              style={{
                                width: `${Math.min(100, Math.max(0, proporcion))}%`,
                                backgroundColor: material.stockMinimo > 0 && material.stock < material.stockMinimo / 2 ? '#ef4444' : '#f59e0b',
                              }}
                            ></div>
                          </div>
                          <div className="stock-text">
                            <span>{material.stock}</span> / <span>{material.stockMinimo}</span>
                          </div>
                        </div>
                        <button className="quick-action-btn small" onClick={() => navigate('/inventario/movimientos')}>
                          <span className="material-icons">add_shopping_cart</span>
                          <span>Reponer</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Movimientos Recientes</h2>
                <button className="view-all-button" onClick={() => navigate('/inventario/movimientos')}>Ver todos</button>
              </div>
              <div className="orders-list">
                {cargando && !error ? (
                  <div className="no-results"><p>Cargando movimientos…</p></div>
                ) : !error && movimientos.length === 0 ? (
                  <div className="no-results"><p>No hay movimientos registrados.</p></div>
                ) : (
                  movimientos.map(movimiento => (
                    <div key={movimiento.id} className="order-item">
                      <div className="order-status-icon">
                        <span className="material-icons">
                          {movimiento.tipo === 'ENTRADA' ? 'add_box' : 'outbox'}
                        </span>
                      </div>
                      <div className="order-details">
                        <div className="order-product">{movimiento.material}</div>
                        <div className="order-info">
                          <span>Cantidad: {movimiento.cantidad}</span> • <span>Fecha: {formatearFecha(movimiento.fecha)}</span>
                        </div>
                        <div className="order-supplier">{movimiento.usuario || 'Sistema'}</div>
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${movimiento.tipo === 'ENTRADA' ? 'delivered' : 'pending'}`}>
                          {movimiento.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col full-width">
            <MiniBars titulo="Stock de materiales críticos" datos={stockCritico} />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Acciones Rápidas</h2>
              </div>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate('/inventario/productos')}>
                  <span className="material-icons">add_circle</span>
                  <span>Registrar Movimiento</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/inventario/pedidos')}>
                  <span className="material-icons">shopping_cart</span>
                  <span>Nueva Orden</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/inventario/movimientos')}>
                  <span className="material-icons">swap_vert</span>
                  <span>Ver Movimientos</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/inventario/caducidades')}>
                  <span className="material-icons">event_available</span>
                  <span>Control de Caducidad</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/inventario/reportes')}>
                  <span className="material-icons">assessment</span>
                  <span>Generar Reporte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventarioDashboard;
