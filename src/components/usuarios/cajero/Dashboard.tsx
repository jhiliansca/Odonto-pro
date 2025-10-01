import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Dashboard.css';

const CajeroDashboard: React.FC = () => {
  // Datos de ejemplo para el dashboard
  const [stats] = useState({
    dailyIncome: 'Bs. 3,450',
    pendingPayments: 12,
    completedPayments: 28,
    totalClients: 156
  });

  // Datos de ejemplo para las transacciones recientes
  const [recentTransactions] = useState([
    { id: 1, client: 'Laura Martínez', service: 'Limpieza dental', amount: 'Bs. 250', time: '10:30 AM', status: 'completed' },
    { id: 2, client: 'Carlos Rodríguez', service: 'Consulta general', amount: 'Bs. 180', time: '09:45 AM', status: 'completed' },
    { id: 3, client: 'Ana García', service: 'Ortodoncia', amount: 'Bs. 1,200', time: '09:15 AM', status: 'pending' },
    { id: 4, client: 'Roberto Sánchez', service: 'Radiografía', amount: 'Bs. 350', time: 'Ayer', status: 'completed' },
    { id: 5, client: 'María López', service: 'Blanqueamiento', amount: 'Bs. 500', time: 'Ayer', status: 'pending' },
  ]);

  return (
    <DashboardLayout userType="cajero" userName="Juan Pérez">
      <div className="cajero-dashboard">
        <div className="dashboard-header">
          <h1>Panel de Caja</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="stats-grid">
          <Card 
            title="Ingresos del Día" 
            value={stats.dailyIncome} 
            icon="payments" 
            color="#4caf50"
          />
          <Card 
            title="Pagos Pendientes" 
            value={stats.pendingPayments} 
            icon="pending_actions" 
            color="#ff9800"
            onClick={() => console.log('Navegando a pagos pendientes')}
          />
          <Card 
            title="Pagos Completados" 
            value={stats.completedPayments} 
            icon="check_circle" 
            color="#2196f3"
            onClick={() => console.log('Navegando a pagos completados')}
          />
          <Card 
            title="Total de Clientes" 
            value={stats.totalClients} 
            icon="people" 
            color="#9c27b0"
            onClick={() => console.log('Navegando a clientes')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <h2>Transacciones Recientes</h2>
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Monto</th>
                      <th>Hora</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.client}</td>
                        <td>{transaction.service}</td>
                        <td>{transaction.amount}</td>
                        <td>{transaction.time}</td>
                        <td>
                          <span className={`status-badge ${transaction.status}`}>
                            {transaction.status === 'completed' ? 'Completado' : 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="icon-button">
                              <span className="material-icons">receipt</span>
                            </button>
                            <button className="icon-button">
                              <span className="material-icons">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="dashboard-col narrow-col">
            <div className="dashboard-panel">
              <h2>Acciones Rápidas</h2>
              <div className="quick-actions-vertical">
                <button className="action-button">
                  <span className="material-icons">add_circle</span>
                  <span>Nuevo Pago</span>
                </button>
                <button className="action-button">
                  <span className="material-icons">receipt_long</span>
                  <span>Generar Factura</span>
                </button>
                <button className="action-button">
                  <span className="material-icons">person_add</span>
                  <span>Nuevo Cliente</span>
                </button>
                <button className="action-button">
                  <span className="material-icons">summarize</span>
                  <span>Reporte Diario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CajeroDashboard;