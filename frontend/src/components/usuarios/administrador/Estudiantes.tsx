import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Estudiantes.css';
import { displayName, fetchUsers, type AuthUser } from '../../../services/authApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

function ini(nombre: string) { return nombre.trim().charAt(0).toUpperCase() || ''; }

const Estudiantes: React.FC = () => {
  const userName = useCurrentUserName();
  const [estudiantes, setEstudiantes] = useState<AuthUser[]>([]);
  const [cargando, setCargando] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sel, setSel] = useState<AuthUser | null>(null);

  useEffect(() => { let a=true; fetchUsers().then(u=>{if(a) setEstudiantes(u.filter(x=>x.rol==='estudiante'));}).catch(()=>{if(a) setEstudiantes([]);}).finally(()=>{if(a) setCargando(false);}); return ()=>{a=false}; }, []);

  const semestres = useMemo(() => Array.from(new Set(estudiantes.map(e => e.semestre || '').filter(Boolean))), [estudiantes]);
  const filtered = estudiantes.filter(e => {
    const matchTab = activeTab==='todos' || (activeTab==='activos'&&e.estado==='activo') || (activeTab==='inactivos'&&e.estado==='inactivo') || activeTab===e.semestre;
    const term = searchTerm.toLowerCase();
    return matchTab && (!term || displayName(e).toLowerCase().includes(term) || (e.email||'').toLowerCase().includes(term) || (e.carrera||'').toLowerCase().includes(term) || (e.tipoSemestre||'').toLowerCase().includes(term));
  });
  const stats = { total: estudiantes.length, activos: estudiantes.filter(e=>e.estado==='activo').length, inactivos: estudiantes.filter(e=>e.estado==='inactivo').length, semestres: semestres.length };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="estudiantes-container">
        <div className="page-header"><h1>Gestin de Estudiantes</h1><div className="page-header-note"><span className="material-icons">info</span>Perfil acadmico completo desde la base de datos</div></div>
        <div className="stats-grid">
          <Card title="Total Estudiantes" value={stats.total} icon="school" color="#f59e0b" />
          <Card title="Activos" value={stats.activos} icon="check_circle" color="#16a34a" />
          <Card title="Inactivos" value={stats.inactivos} icon="block" color="#dc2626" />
          <Card title="Semestres" value={stats.semestres} icon="category" color="#8b5cf6" />
        </div>
        <div className="filter-container">
          <div className="tabs">
            {['todos','activos','inactivos',...semestres].map(t => <button key={t} className={`tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{t==='todos'?'Todos':t==='activos'?'Activos':t==='inactivos'?'Inactivos':`Semestre ${t}`}</button>)}
          </div>
          <div className="search-box"><span className="material-icons">search</span><input placeholder="Buscar estudiante, carrera, tipo semestre..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
        </div>

        <div className="estudiantes-grid">
          {filtered.length ? filtered.map(e => (
            <div key={e.id} className={`estudiante-card perfil-card ${sel?.id===e.id?'selected':''}`} onClick={()=>setSel(sel?.id===e.id ? null : e)}>
              <div className="perfil-card-top">
                <div className={`estudiante-avatar ${e.estado}`}>{ini(displayName(e))}</div>
                <div className="estudiante-info">
                  <h3>{displayName(e)}</h3>
                  <p className="estudiante-semestre">Semestre {e.semestre || ''} {e.tipoSemestre ? ` ${e.tipoSemestre}` : ''}</p>
                  <div className="usuario-meta"><span className={`status-badge ${e.estado}`}>{e.estado}</span>{e.carrera && <span className="rol-badge estudiante">{e.carrera}</span>}</div>
                </div>
              </div>
              <div className="perfil-details-grid">
                <div className="perfil-detail"><span className="material-icons">mail</span><div><small>Email</small><span>{e.email}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">call</span><div><small>Telfono</small><span>{e.telefono || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">badge</span><div><small>CI</small><span>{e.ci || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">groups</span><div><small>Grupo</small><span>{e.grupo || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">wb_sunny</span><div><small>Turno</small><span>{e.turno || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">event</span><div><small>Registro</small><span>{e.fechaRegistro}</span></div></div>
              </div>
              {sel?.id===e.id && <div className="perfil-extra"><p><strong>Tipo de semestre:</strong> {e.tipoSemestre || ''} <strong>Carrera:</strong> {e.carrera || ''}</p><p><strong>Direccin:</strong> {e.direccion || ''} <strong>Obs:</strong> {e.observaciones || ''}</p></div>}
            </div>
          )) : <div className="no-results"><span className="material-icons">search_off</span><p>{cargando?'Cargando estudiantes...':'No hay estudiantes registrados con estos filtros.'}</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Estudiantes;
