import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { academicoApi } from '../../../services/academicoApi';
import type { Pago } from '../../../services/academicoApi';
import { getStoredUser } from '../../../services/authApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import { formatBs } from '../../../utils/formato';
import '../academico/Pagos.css';

type TabEstado = 'todos' | 'pendiente' | 'verificado' | 'rechazado';

const etiquetasEstado: Record<string, string> = { pendiente: 'Pendiente',
  verificado: 'Verificado',
  rechazado: 'Rechazado',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado al consultar tus pagos.';
}

function normalizar(valor: string | null | undefined): string {
  return (valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const EstudiantePagos: React.FC = () => {
  const userName = useCurrentUserName('Estudiante');
  const usuario = useMemo(() => getStoredUser(), []);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabEstado>('todos');
  const [busqueda, setBusqueda] = useState('');

  const cargarPagos = useCallback(async () => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    try {
      setPagos(await academicoApi.pagos({ estudianteId: usuario.id }));
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    void cargarPagos();
  }, [cargarPagos]);

  const stats = useMemo(() => {
    const verificados = pagos.filter((pago) => pago.estado === 'verificado');
    return {
      total: pagos.length,
      verificados: verificados.length,
      pendientes: pagos.filter((pago) => pago.estado === 'pendiente').length,
  montoVerificado: verificados.reduce((total, pago) => {
        const monto = Number(pago.monto);
        return total + (Number.isFinite(monto) ? monto : 0);
      }, 0),
    };
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return pagos.filter((pago) => {
      const coincideTab = tab === 'todos' || pago.estado === tab;
      const texto = normalizar(`${pago.procedimiento || ''} ${pago.asignatura || ''} ${pago.comprobante || ''} ${pago.estudiante || ''}`);
      return coincideTab && (!termino || texto.includes(termino));
    });
  }, [pagos, tab, busqueda]);

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="pagos-page">
        <div className="page-header">
          <div>
            <h1>Mis Pagos Académicos</h1>
            <p>Consulta el estado y el monto de tus pagos registrados en el sistema.</p>
          </div>
        </div>

        {!usuario ? (
          <EmptyState message="Inicia sesión como estudiante para consultar tus pagos académicos." />
        ) : (
          <>
            <div className="pagos-nota">
              <span className="material-icons">info</span>
              <span>Estos registros corresponden a pagos de insumos académicos utilizados en prácticas y procedimientos, no a tratamientos clínicos.</span>
            </div>

            <div className="stats-grid">
              <Card title="Total de pagos" value={stats.total} icon="receipt_long" color="var(--brand-600)" />
              <Card title="Verificados" value={stats.verificados} icon="verified" color="var(--success)" />
              <Card title="Pendientes" value={stats.pendientes} icon="pending_actions" color="var(--warning)" />
              <Card title="Monto verificado" value={formatBs(stats.montoVerificado, 2)} icon="payments" color="var(--info)" />
            </div>

            <div className="filter-container">
              <div className="tabs" role="tablist" aria-label="Filtrar mis pagos por estado">
                <button type="button" className={`tab ${tab === 'todos' ? 'active' : ''}`} onClick={() => setTab('todos')}>Todos</button>
                <button type="button" className={`tab ${tab === 'pendiente' ? 'active' : ''}`} onClick={() => setTab('pendiente')}>Pendientes</button>
                <button type="button" className={`tab ${tab === 'verificado' ? 'active' : ''}`} onClick={() => setTab('verificado')}>Verificados</button>
                <button type="button" className={`tab ${tab === 'rechazado' ? 'active' : ''}`} onClick={() => setTab('rechazado')}>Rechazados</button>
              </div>
              <div className="search-box">
                <span className="material-icons">search</span>
                <input
                  type="text"
                  placeholder="Buscar procedimiento o comprobante..."
                  aria-label="Buscar mis pagos"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>
            </div>

            <div className="surface-card">
              <h2 className="section-heading">Historial de pagos</h2>
              {cargando ? (
                <LoadingState label="Cargando tus pagos académicos..." />
              ) : error ? (
                <ErrorState message={error} onRetry={() => void cargarPagos()} />
              ) : pagosFiltrados.length === 0 ? (
                <EmptyState message="Aún no tienes pagos registrados con estos filtros. Los pagos de esta sección corresponden a insumos académicos de práctica, no a tratamientos clínicos." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Procedimiento</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Comprobante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosFiltrados.map((pago) => (
                        <tr key={pago.id}>
                          <td>
                            <div className="pagos-registro">{pago.procedimiento || 'Sin procedimiento'}</div>
                            <span className="pagos-sin-datos">{pago.asignatura || 'Sin asignatura'}</span>
                          </td>
                          <td className="pagos-monto">{formatBs(Number(pago.monto) || 0, 2)}</td>
                          <td>
                            <span className={`status-badge ${pago.estado}`}>{etiquetasEstado[pago.estado] || pago.estado}</span>
                          </td>
                          <td className="pagos-texto">{pago.fecha || '—'}</td>
                          <td className="pagos-texto">{pago.comprobante || <span className="pagos-sin-datos">Sin comprobante</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EstudiantePagos;
