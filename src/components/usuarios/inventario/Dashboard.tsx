// src/components/usuarios/inventario/Dashboard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para navegar entre páginas
import DashboardLayout from '..//DashboardLayout'; // <-- CORRECT PATH
import Card from '..//Card'; // <-- CORRECT PATH
import './Dashboard.css';

const InventarioDashboard: React.FC = () => {
    const navigate = useNavigate(); // Hook para la navegación
    
    // Datos de ejemplo para el dashboard
    const [stats] = useState({
        totalProducts: 342,
        lowStock: 15,
        pendingOrders: 8,
        totalSuppliers: 24
    });

    // Datos de ejemplo para productos con bajo stock
    const [lowStockProducts] = useState([
        { id: 1, name: 'Guantes de látex', currentStock: 25, minStock: 50, supplier: 'Medical Supplies S.A.' },
        { id: 2, name: 'Anestesia local', currentStock: 10, minStock: 30, supplier: 'Farmadent' },
        { id: 3, name: 'Algodón dental', currentStock: 15, minStock: 40, supplier: 'Dental Care' },
        { id: 4, name: 'Resina compuesta', currentStock: 5, minStock: 20, supplier: 'Dental Materials Inc.' },
    ]);

    // Datos de ejemplo para órdenes recientes
    const [recentOrders] = useState([
        { id: 1, product: 'Guantes de látex', quantity: 100, supplier: 'Medical Supplies S.A.', date: '10/06/2023', status: 'pending' },
        { id: 2, name: 'Anestesia local', quantity: 50, supplier: 'Farmadent', date: '08/06/2023', status: 'delivered' },
        { id: 3, name: 'Instrumental quirúrgico', quantity: 10, supplier: 'Dental Care', date: '05/06/2023', status: 'delivered' },
        { id: 4, name: 'Resina compuesta', quantity: 30, supplier: 'Dental Materials Inc.', date: '01/06/2023', status: 'delivered' },
    ]);

    return (
        <DashboardLayout userType="inventario" userName="María López">
            <div className="inventario-dashboard">
                <div className="dashboard-header">
                    <h1>Panel de Inventario</h1>
                    <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>

                <div className="stats-grid">
                    <Card
                        title="Total de Productos"
                        value={stats.totalProducts}
                        icon="inventory_2"
                        iconColor="#9c27b0"
                        onClick={() => navigate('/inventario/productos')} // Simula navegación
                    />
                    <Card
                        title="Productos Bajo Stock"
                        value={stats.lowStock}
                        icon="warning"
                        iconColor="#f44336"
                        onClick={() => navigate('/inventario/productos-bajo-stock')} // Simula navegación
                    />
                    <Card
                        title="Órdenes Pendientes"
                        value={stats.pendingOrders}
                        icon="shopping_cart"
                        iconColor="#ff9800"
                        onClick={() => navigate('/inventario/ordenes')} // Simula navegación
                    />
                    <Card
                        title="Proveedores"
                        value={stats.totalSuppliers}
                        icon="local_shipping"
                        iconColor="#4caf50"
                        onClick={() => navigate('/inventario/proveedores')} // Simula navegación
                    />
                </div>

                <div className="dashboard-row">
                    <div className="dashboard-col">
                        <div className="dashboard-panel">
                            <div className="panel-header">
                                <h2>Productos Bajo Stock</h2>
                                <button className="view-all-button" onClick={() => navigate('/inventario/productos-bajo-stock')}>Ver todos</button>
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
                                                        backgroundColor: product.currentStock < product.minStock / 2 ? '#f44336' : '#ff9800'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="stock-text">
                                                <span>{product.currentStock}</span> / <span>{product.minStock}</span>
                                            </div>
                                        </div>
                                        <button className="action-button small">
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
                                <button className="view-all-button" onClick={() => navigate('/inventario/ordenes')}>Ver todas</button>
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
                            <h2>Acciones Rápidas</h2>
                            <div className="quick-actions">
                                <button className="action-button">
                                    <span className="material-icons">add_circle</span>
                                    <span>Nuevo Producto</span>
                                </button>
                                <button className="action-button">
                                    <span className="material-icons">shopping_cart</span>
                                    <span>Nueva Orden</span>
                                </button>
                                <button className="action-button">
                                    <span className="material-icons">qr_code_scanner</span>
                                    <span>Escanear Producto</span>
                                </button>
                                <button className="action-button">
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