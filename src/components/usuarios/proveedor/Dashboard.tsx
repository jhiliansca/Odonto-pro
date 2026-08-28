import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Dashboard.css';

const ProveedorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    activeProducts: 48,
    pendingOrders: 12,
    completedOrders: 156,
    totalRevenue: 'Bs. 25,450'
  });

  const [pendingOrders] = useState([
    { id: 1, product: 'Guantes de látex', quantity: 100, client: 'Clínica Dental Central', date: '10/06/2023', total: 'Bs. 1,200' },
    { id: 2, name: 'Anestesia local', quantity: 50, client: 'Hospital Odontológico', date: '12/06/2023', total: 'Bs. 2,500' },
    { id: 3, name: 'Algodón dental', quantity: 200, client: 'Consultorio Dr. Mendoza', date: '15/06/2023', total: 'Bs. 800' },
    { id: 4, name: 'Resina compuesta', quantity: 30, client: 'Facultad de Odontología', date: '18/06/2023', total: 'Bs. 3,000' },
  ]);

  const [topProducts] = useState([
    { id: 1, name: 'Guantes de látex', sales: 1250, revenue: 'Bs. 15,000', trend: 'up' },
    { id: 2, name: 'Anestesia local', sales: 850, revenue: 'Bs. 42,500', trend: 'up' },
    { id: 3, name: 'Algodón dental', sales: 1800, revenue: 'Bs. 7,200', trend: 'down' },
    { id: 4, name: 'Resina compuesta', sales: 620, revenue: 'Bs. 18,600', trend: 'up' },
  ]);

  return (
    <DashboardLayout userType="proveedor" userName="Dental Supplies S.A.">
      <div className="proveedor-dashboard" style={{ '--role-color': '#ea580c' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Proveedor</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Suministros</span>
            <h2>Bienvenido, Dental Supplies S.A.</h2>
            <p>Gestiona tus productos, procesa pedidos y coordina las entregas con la clínica.</p>
          </div>
          <span className="welcome-icon material-icons">local_shipping</span>
        </div>

        <div className="stats-grid">
          <Card
            title="Productos Activos"
            value={stats.activeProducts}
            icon="inventory_2"
            color="#ef4444"
            onClick={() => navigate('/proveedor/productos')}
          />
          <Card
            title="Órdenes Pendientes"
            value={stats.pendingOrders}
            icon="shopping_cart"
            color="#f59e0b"
            onClick={() => navigate('/proveedor/pedidos')}
          />
          <Card
            title="Órdenes Completadas"
            value={stats.completedOrders}
            icon="local_shipping"
            color="#16a34a"
            onClick={() => navigate('/proveedor/entregas')}
          />
          <Card
            title="Ingresos Totales"
            value={stats.totalRevenue}
            icon="payments"
            color="#0ea5e9"
            onClick={() => navigate('/proveedor/facturas')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Órdenes Pendientes</h2>
                <button className="view-all-button" onClick={() => navigate('/proveedor/pedidos')}>Ver todas</button>
              </div>
              <div className="orders-list">
                {pendingOrders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-icon">
                      <span className="material-icons">shopping_cart</span>
                    </div>
                    <div className="order-details">
                      <div className="order-product">{order.product || order.name}</div>
                      <div className="order-info">
                        <span>Cantidad: {order.quantity}</span> • <span>Cliente: {order.client}</span>
                      </div>
                      <div className="order-date">Fecha de entrega: {order.date}</div>
                    </div>
                    <div className="order-total">{order.total}</div>
                    <div className="order-actions">
                      <button className="quick-action-btn small" onClick={() => navigate('/proveedor/entregas')}>
                        <span className="material-icons">check_circle</span>
                        <span>Procesar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Productos Más Vendidos</h2>
                <button className="view-all-button" onClick={() => navigate('/proveedor/productos')}>Ver todos</button>
              </div>
              <div className="products-list">
                {topProducts.map(product => (
                  <div key={product.id} className="product-item">
                    <div className="product-rank">{product.id}</div>
                    <div className="product-details">
                      <div className="product-name">{product.name}</div>
                      <div className="product-stats">
                        <span>Ventas: {product.sales}</span> • <span>Ingresos: {product.revenue}</span>
                      </div>
                    </div>
                    <div className="product-trend">
                      <span className={`trend-icon ${product.trend}`}>
                        <span className="material-icons">
                          {product.trend === 'up' ? 'trending_up' : 'trending_down'}
                        </span>
                      </span>
                    </div>
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
                <h2>Acciones Rápidas</h2>
              </div>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate('/proveedor/productos')}>
                  <span className="material-icons">add_circle</span>
                  <span>Nuevo Producto</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/proveedor/entregas')}>
                  <span className="material-icons">local_shipping</span>
                  <span>Registrar Entrega</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/proveedor/facturas')}>
                  <span className="material-icons">receipt</span>
                  <span>Generar Factura</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/proveedor/pedidos')}>
                  <span className="material-icons">assessment</span>
                  <span>Ver Estadísticas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProveedorDashboard;