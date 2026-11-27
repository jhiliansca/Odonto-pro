import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import MiniBars from '../MiniBars';
import { catalogoApi } from '../../../services/catalogoApi';
import type { ProveedorDetalle, ProveedorMaterial, Solicitud } from '../../../services/catalogoApi';
import { getStoredUser } from '../../../services/authApi';
import { formatBs } from '../../../utils/formato';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import './Dashboard.css';

const ProveedorDashboard: React.FC = () => {
  const userName = useCurrentUserName('Proveedor');
  const [proveedor, setProveedor] = useState<ProveedorDetalle | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const proveedores = await catalogoApi.proveedores();
      const proveedorId = getStoredUser()?.proveedorId ?? proveedores[0]?.id;
      if (!proveedorId) throw new Error('No hay proveedores registrados en el catálogo.');
      const [detalle, pedidos] = await Promise.all([
        catalogoApi.proveedor(proveedorId),
        catalogoApi.solicitudes(),
      ]);
      setProveedor(detalle);
      setSolicitudes(pedidos);
    } catch (err) {
      setProveedor(null);
      setSolicitudes([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información del proveedor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const materiales = useMemo(() => proveedor?.materiales ?? [], [proveedor]);
  const valorMateriales = useMemo(
    () => materiales.reduce((suma, item) => suma + Number(item.precioProveedor || item.precio || 0) * Number(item.stock || 0), 0),
    [materiales]
  );
  const criticos = materiales.filter((item) => Number(item.stockBajo) === 1).length;
  const entregados = solicitudes.filter((item) => item.estado === 'entregado').length;
  const aprobados = solicitudes.filter((item) => item.estado === 'aprobado').length;
  const pendientes = solicitudes.filter((item) => item.estado === 'pendiente').length;
  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const item of materiales as ProveedorMaterial[]) {
      mapa.set(item.categoria || 'Sin categoría', (mapa.get(item.categoria || 'Sin categoría') || 0) + 1);
    }
    return [...mapa.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  }, [materiales]);

  return (
    <DashboardLayout userType="proveedor" userName={userName}>
      <div className="proveedor-dashboard" style={{ '--role-color': '#ea580c' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Proveedor</h1>
          <div className="date-display">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">{getStoredUser()?.empresa || proveedor?.nombre || 'Suministros'}</span>
            <h2>Bienvenido, {userName}</h2>
            <p>
              {proveedor
                ? `Materiales asignados, solicitudes y estado de entrega registrado para ${proveedor.nombre}.`
                : 'Consultando los registros reales del catálogo y las solicitudes de insumos.'}
            </p>
          </div>
          <span className="welcome-icon material-icons">local_shipping</span>
        </div>

        {error && (
          <div className="no-results" role="alert">
            <span className="material-icons">error_outline</span>
            <p>{error}</p>
          </div>
        )}

        <div className="stats-grid">
          <Card title="Materiales asignados" value={materiales.length} icon="inventory_2" color="#ef4444" />
          <Card title="Valor asignado" value={formatBs(valorMateriales, 2)} icon="payments" color="#16a34a" />
          <Card title="Stock a reponer" value={criticos} icon="warning" color="#f59e0b" />
          <Card title="Solicitudes activas" value={aprobados + pendientes} icon="shopping_cart" color="#0ea5e9" />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Pedidos y entregas</h2>
                <button type="button" className="view-all-button" onClick={() => void cargar()} disabled={cargando}>
                  {cargando ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>
              <div className="orders-list">
                {solicitudes.slice(0, 8).map((solicitud) => (
                  <div key={solicitud.id} className="order-item">
                    <div className="order-status-icon">
                      <span className="material-icons">local_shipping</span>
                    </div>
                    <div className="order-details">
                      <div className="order-product">{solicitud.procedimiento || 'Solicitud de insumos'}</div>
                      <div className="order-info">
                        <span>{solicitud.material || 'Material registrado'}</span> • <span>{solicitud.cantidad}</span>
                      </div>
                      <div className="order-supplier">{solicitud.estudiante}</div>
                    </div>
                    <div className="order-status">
                      <span className="status-badge">{solicitud.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col narrow-col">
            <MiniBars titulo="Materiales por categoría" datos={porCategoria} />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col full-width">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Catálogo de insumos asignados</h2>
              </div>
              <div className="products-list">
                {materiales.slice(0, 10).map((material) => (
                  <div key={material.id} className="product-item">
                    <div className="product-details">
                      <div className="product-name">{material.nombre}</div>
                      <div className="product-stats">
                        <span>{material.clave}</span> · <span>{material.unidad}</span> · <span>Stock: {material.stock}/{material.stockMinimo}</span>
                      </div>
                    </div>
                    <span className="status-badge">{formatBs(Number(material.precioProveedor || material.precio || 0), 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Estado de solicitudes</h2>
              </div>
              <div className="stats-grid">
                <Card title="Entregadas" value={entregados} icon="check_circle" color="#16a34a" />
                <Card title="Aprobadas" value={aprobados} icon="verified" color="#0ea5e9" />
                <Card title="Pendientes" value={pendientes} icon="schedule" color="#f59e0b" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProveedorDashboard;
