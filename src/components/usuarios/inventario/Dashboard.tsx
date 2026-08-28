import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '..//DashboardLayout';
import Card from '..//Card';
import './Dashboard.css';

const InventarioDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats] = useState({
    totalProducts: 342,
    lowStock: 15,
    pendingOrders: 8,
    totalSuppliers: 24
  });

  const [lowStockProducts] = useState([
    { id: 1, name: 'Guantes de látex', currentStock: 25, minStock: 50, supplier: 'Medical Supplies S.A.' },
    { id: 2, name: 'Anestesia local', currentStock: 10, minStock: 30, supplier: 'Farmadent' },
    { id: 3, name: 'Algodón dental', currentStock: 15, minStock: 40, supplier: 'Dental Care' },
    { id: 4, name: 'Resina compuesta', currentStock: 5, minStock: 20, supplier: 'Dental Materials Inc.' },
  ]);

  const [recentOrders] = useState([
    { id: 1, product: 'Guantes de látex', quantity: 100, supplier: 'Medical Supplies S.A.', date: '10/06/2023', status: 'pending' },
    { id: 2, name: 'Anestesia local', quantity: 50, supplier: 'Farmadent', date: '08/06/2023', status: 'delivered' },
    { id: 3, name: 'Instrumental quirúrgico', quantity: 10, supplier: 'Dental Care', date: '05/06/2023', status: 'delivered' },
    { id: 4, name: 'Resina compuesta', quantity: 30, supplier: 'Dental Materials Inc.', date: '01/06/2023', status: 'delivered' },
  ]);

  return (
    <DashboardLayout userType="inventario" userName="María López">
      <div className="inventario-dashboard" style={{ '--role-color': '#059669' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Inventario</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Control de inventario</span>
            <h2>Bienvenida, María López</h2>
            <p>Supervisa el stock de insumos, coordina pedidos y mantén al día a tus proveedores.</p>
          </div>
          <span className="welcome-icon material-icons">inventory_2</span>
        </div>

        <div className="stats-grid">
          <Card
            title="Total de Productos"
            value={stats.totalProducts}
            icon="inventory_2"
            color="#8b5cf6"
            onClick={() => navigate('/inventario/productos')}
          />
          <Card
            title="Productos Bajo Stock"
            value={stats.lowStock}
            icon="warning"
            color="#ef4444"
            onClick={() => navigate('/inventario/alertas')}
          />
          <Card
            title="Órdenes Pendientes"
            value={stats.pendingOrders}
            icon="shopping_cart"
            color="#f59e0b"
            onClick={() => navigate('/inventario/pedidos')}
          />
          <Card
            title="Proveedores"
            value={stats.totalSuppliers}
            icon="local_shipping"
            color="#16a34a"
            onClick={() => navigate('/inventario/proveedores')}
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
                {lowStockProducts.map(product => (
                  <div key={product.id} className="low-stock-item">
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-supplier">{product.supplier}</div>
                    </div>
                    <div className="stock-info">
                      <div className="stock-bar-container">
                        <div
                          className="stock-bar"
                          style={{
                            width: `${Math.min(100, (product.currentStock / product.minStock) * 100)}%`,
                            backgroundColor: product.currentStock < product.minStock / 2 ? '#ef4444' : '#f59e0b'
                          }}
                        ></div>
                      </div>
                      <div className="stock-text">
                        <span>{product.currentStock}</span> / <span>{product.minStock}</span>
                      </div>
                    </div>
                    <button className="quick-action-btn small" onClick={() => navigate('/inventario/pedidos')}>
                      <span className="material-icons">add_shopping_cart</span>
                      <span>Ordenar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Órdenes Recientes</h2>
                <button className="view-all-button" onClick={() => navigate('/inventario/pedidos')}>Ver todas</button>
              </div>
              <div className="orders-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-status-icon">
                      <span className="material-icons">
                        {order.status === 'delivered' ? 'check_circle' : 'pending_actions'}
                      </span>
                    </div>
                    <div className="order-details">
                      <div className="order-product">{order.product || order.name}</div>
                      <div className="order-info">
                        <span>Cantidad: {order.quantity}</span> • <span>Fecha: {order.date}</span>
                      </div>
                      <div className="order-supplier">{order.supplier}</div>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${order.status}`}>
                        {order.status === 'delivered' ? 'Entregado' : 'Pendiente'}
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
                <button className="quick-action-btn" onClick={() => navigate('/inventario/productos')}>
                  <span className="material-icons">add_circle</span>
                  <span>Nuevo Producto</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/inventario/pedidos')}>
                  <span className="material-icons">shopping_cart</span>
                  <span>Nueva Orden</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/inventario/productos')}>
                  <span className="material-icons">qr_code_scanner</span>
                  <span>Escanear Producto</span>
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