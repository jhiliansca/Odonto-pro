import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import '../RoleExtra.css';

interface ActividadItem {
  id: number;
  usuario: string;
  accion: string;
  icono: string;
  fecha: string;
}

function formatearFecha(fecha: string): string {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return fecha;
  return valor.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

const Actividad: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto ?? 'Administrador';
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setActividad(await clinicaApi.actividad());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar la información.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return actividad.filter(item => {
      const matchesTexto =
        !term ||
        item.usuario.toLowerCase().includes(term) ||
        item.accion.toLowerCase().includes(term);
      const matchesFecha = !fechaFiltro || item.fecha.slice(0, 10) === fechaFiltro;
      return matchesTexto && matchesFecha;
    });
  }, [actividad, searchTerm, fechaFiltro]);

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="ext-page">
        <div className="ext-header">
          <div>
            <h1>Actividad del Sistema</h1>
            <p className="ext-sub">Consulta las acciones registradas por los usuarios de la clínica.</p>
          </div>
        </div>

        {error && <ErrorState message={error} onRetry={() => void cargar()} />}

        <div className="toolbar">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar por usuario o acción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ext-actions">
            <input
              className="ext-select"
              type="date"
              aria-label="Filtrar por fecha"
              value={fechaFiltro}
              onChange={e => setFechaFiltro(e.target.value)}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSearchTerm('');
                setFechaFiltro('');
              }}
            >
              <span className="material-icons">filter_alt_off</span>
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="surface-card">
          {cargando ? (
            <LoadingState label="Cargando actividad..." />
          ) : filtradas.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Icono</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(item => (
                    <tr key={item.id}>
                      <td>{formatearFecha(item.fecha)}</td>
                      <td>{item.usuario}</td>
                      <td>{item.accion}</td>
                      <td>
                        <span className="status-badge" title={item.icono}>
                          <span className="material-icons">{item.icono}</span>
                          {item.icono}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No hay actividad registrada con los filtros seleccionados." />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Actividad;
