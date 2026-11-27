import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Persona } from '../../../services/clinicaApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import './DoctorPages.css';

type TabEstudiante = 'todos' | 'activo' | 'inactivo';

function nombreCompleto(estudiante: Persona): string {
  return estudiante.nombreCompleto || `${estudiante.nombre}${estudiante.apellido ? ` ${estudiante.apellido}` : ''}`;
}

const DoctorEstudiantes: React.FC = () => {
  const userName = useCurrentUserName('Docente');
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabEstudiante>('todos');
  const [detalleId, setDetalleId] = useState<number | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const datos = await clinicaApi.estudiantes();
        if (activo) setEstudiantes(datos);
      } catch {
        if (activo) setError('No fue posible cargar los estudiantes reales.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const filtered = estudiantes.filter(estudiante => {
    const texto = [nombreCompleto(estudiante), estudiante.semestre || '', estudiante.email || '', estudiante.telefono || '']
      .join(' ')
      .toLowerCase();
    const matchesSearch = texto.includes(searchTerm.toLowerCase());
    if (activeTab === 'todos') return matchesSearch;
    return matchesSearch && estudiante.estado === activeTab;
  });

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="doctor-page-container">
        <div className="page-header">
          <h1>Estudiantes Asignados</h1>
        </div>

        {error && <div className="empty-state">{error}</div>}

        <div className="filter-container">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>Todos</button>
            <button className={`tab ${activeTab === 'activo' ? 'active' : ''}`} onClick={() => setActiveTab('activo')}>Activos</button>
            <button className={`tab ${activeTab === 'inactivo' ? 'active' : ''}`} onClick={() => setActiveTab('inactivo')}>Inactivos</button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input type="text" placeholder="Buscar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="doctor-grid">
          {cargando && <div className="empty-state">Cargando datos reales...</div>}
          {!cargando && filtered.length === 0 && (
            <div className="empty-state">No hay registros reales registrados</div>
          )}
          {filtered.map(estudiante => (
            <div key={estudiante.id} className={`doctor-card ${estudiante.estado || ''}`}>
              <div className={`doctor-avatar ${estudiante.estado === 'inactivo' ? 'inactivo' : ''}`}>
                {nombreCompleto(estudiante).charAt(0)}
              </div>
              <div className="doctor-info">
                <h3>{nombreCompleto(estudiante)}</h3>
                <p className="doctor-especialidad">{estudiante.semestre || 'Sin semestre registrado'}</p>
                <p className="doctor-email">{estudiante.email || 'Sin email registrado'}</p>
                <div className="doctor-meta">
                  <span className="doctor-pacientes">
                    <span className="material-icons">call</span>
                    {estudiante.telefono || 'Sin teléfono registrado'}
                  </span>
                  <span className={`status-badge ${estudiante.estado || ''}`}>
                    {estudiante.estado || 'Sin estado registrado'}
                  </span>
                </div>
                {detalleId === estudiante.id && (
                  <div className="doctor-email" style={{ marginTop: '0.5rem' }}>
                    ID: {estudiante.id} | Semestre: {estudiante.semestre || 'Sin semestre registrado'} | Email: {estudiante.email || 'Sin email registrado'} | Teléfono: {estudiante.telefono || 'Sin teléfono registrado'}
                  </div>
                )}
              </div>
              <div className="doctor-actions">
                <button className="quick-action-btn small" onClick={() => setDetalleId(detalleId === estudiante.id ? null : estudiante.id)}>
                  <span className="material-icons">visibility</span>
                  <span>{detalleId === estudiante.id ? 'Ocultar' : 'Ver'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorEstudiantes;
