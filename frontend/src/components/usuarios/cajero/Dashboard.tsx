import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import MiniBars from '../MiniBars';
import { clinicaApi } from '../../../services/clinicaApi';
import { soporteApi } from '../../../services/soporteApi';
import type { ClinicaResumen } from '../../../services/clinicaApi';
import type { Transaccion } from '../../../services/soporteApi';
import { formatBs } from '../../../utils/formato';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import './Dashboard.css';

function cortarFecha(iso: string): string {
  const parte = iso.slice(0, 10);
  const partes = parte.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}` : parte;
}

const CajeroDashboard: React.FC = () => {
  const userName = useCurrentUserName('Cajero');
  const [resumen, setResumen] = useState<ClinicaResumen | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosResumen, datosTransacciones] = await Promise.all([
        clinicaApi.resumen(),
        soporteApi.transacciones(8),
      ]);
      setResumen(datosResumen);
      setTransacciones(datosTransacciones);
    } catch (err) {
      setResumen(null);
      setTransacciones([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información real.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const total = useMemo(
    () => transacciones.reduce((suma, item) => suma + Number(item.monto), 0),
    [transacciones]
  );
  const completadas = transacciones.filter((item) => item.estado === 'completed').length;
  const pendientes = transacciones.filter((item) => item.estado === 'pendiente').length;
  const porDia = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const item of transacciones) {
      const dia = cortarFecha(item.fechaISO);
      mapa.set(dia, (mapa.get(dia) || 0) + Number(item.monto));
    }
    return [...mapa.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  }, [transacciones]);

  return (
    <DashboardLayout userType="cajero" userName={userName}>
      <div className="cajero-dashboard" style={{ '--role-color': '#7c3aed' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Caja</h1>
          <div className="date-display">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Caja</span>
            <h2>Bienvenido, {userName}</h2>
            <p>Consulta los cobros registrados, su estado y la evolución diaria de la facturación.</p>
          </div>
          <span className="welcome-icon material-icons">point_of_sale</span>
        </div>

        {error && (
          <div className="no-results" role="alert">
            <span className="material-icons">error_outline</span>
            <p>{error}</p>
          </div>
        )}

        <div className="stats-grid">
          <Card title="Total facturado" value={formatBs(total, 2)} icon="payments" color="#8b5cf6" />
          <Card title="Transacciones" value={transacciones.length} icon="receipt_long" color="#0ea5e9" />
          <Card title="Completadas" value={completadas} icon="check_circle" color="#16a34a" />
          <Card title="Pendientes" value={pendientes} icon="schedule" color="#f59e0b" />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Transacciones Recientes</h2>
                <button type="button" className="view-all-button" onClick={() => void cargar()} disabled={cargando}>
                  {cargando ? 'Actualizando…' : 'Actualizar'}
                </button>
              </div>
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Monto</th>
                      <th>Hora</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.map((item) => (
                      <tr key={item.id}>
                        <td>{item.cliente}</td>
                        <td>{item.servicio}</td>
                        <td>{formatBs(item.monto, 2)}</td>
                        <td>{item.fecha}</td>
                        <td>
                          <span className={`status-badge ${item.estado === 'completed' ? 'completada' : 'pendiente'}`}>
                            {item.estado === 'completed' ? 'Completada' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="dashboard-col narrow-col">
            <MiniBars titulo="Facturación por día" datos={porDia} sufijo=" Bs" />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col full-width">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Contexto de la clínica</h2>
              </div>
              <div className="stats-grid">
                <Card title="Pacientes registrados" value={resumen?.pacientes ?? 0} icon="people" color="#0ea5e9" />
                <Card title="Citas registradas" value={resumen?.citas ?? 0} icon="event" color="#f59e0b" />
                <Card title="Tratamientos registrados" value={resumen?.tratamientos ?? 0} icon="medical_services" color="#16a34a" />
                <Card title="Historiales registrados" value={resumen?.historial ?? 0} icon="description" color="#8b5cf6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CajeroDashboard;
