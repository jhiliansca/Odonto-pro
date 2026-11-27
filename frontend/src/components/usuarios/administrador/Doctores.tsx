import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Doctores.css';
import { displayName, fetchUsers, type AuthUser } from '../../../services/authApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

function ini(nombre: string) { const p = nombre.trim().split(/\s+/); return (p[1]?.[0] ?? p[0]?.[0] ?? '').toUpperCase(); }

const Doctores: React.FC = () => {
  const userName = useCurrentUserName();
  const [doctores, setDoctores] = useState<AuthUser[]>([]);
  const [cargando, setCargando] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sel, setSel] = useState<AuthUser | null>(null);

  useEffect(() => { let a=true; fetchUsers().then(u=>{if(a) setDoctores(u.filter(x=>x.rol==='docente'));}).catch(()=>{if(a) setDoctores([]);}).finally(()=>{if(a) setCargando(false);}); return ()=>{a=false}; }, []);

  const especialidades = useMemo(() => Array.from(new Set(doctores.map(d => d.especialidad || '').filter(Boolean))), [doctores]);
  const filtered = doctores.filter(d => {
    const matchTab = activeTab==='todos' || (activeTab==='activos'&&d.estado==='activo') || (activeTab==='inactivos'&&d.estado==='inactivo') || activeTab===d.especialidad;
    const term = searchTerm.toLowerCase();
    return matchTab && (!term || displayName(d).toLowerCase().includes(term) || (d.email||'').toLowerCase().includes(term) || (d.especialidad||'').toLowerCase().includes(term) || (d.departamento||'').toLowerCase().includes(term));
  });
  const stats = { total: doctores.length, activos: doctores.filter(d=>d.estado==='activo').length, inactivos: doctores.filter(d=>d.estado==='inactivo').length, especialidades: especialidades.length };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="doctores-container">
        <div className="page-header"><h1>Gestin de Docentes</h1><div className="page-header-note"><span className="material-icons">info</span>Datos detallados desde la base de datos</div></div>
        <div className="stats-grid">
          <Card title="Total Docentes" value={stats.total} icon="medical_services" color="#0284c7" />
          <Card title="Activos" value={stats.activos} icon="check_circle" color="#16a34a" />
          <Card title="Inactivos" value={stats.inactivos} icon="block" color="#dc2626" />
          <Card title="Especialidades" value={stats.especialidades} icon="category" color="#f59e0b" />
        </div>
        <div className="filter-container">
          <div className="tabs">
            {['todos','activos','inactivos',...especialidades].map(t => <button key={t} className={`tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{t==='todos'?'Todos':t==='activos'?'Activos':t==='inactivos'?'Inactivos':t}</button>)}
          </div>
          <div className="search-box"><span className="material-icons">search</span><input placeholder="Buscar docente, especialidad, departamento..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
        </div>

        <div className="doctores-grid">
          {filtered.length ? filtered.map(d => (
            <div key={d.id} className={`doctor-card perfil-card ${sel?.id===d.id?'selected':''}`} onClick={()=>setSel(sel?.id===d.id ? null : d)}>
              <div className="perfil-card-top">
                <div className={`doctor-avatar ${d.estado}`}>{ini(displayName(d))}</div>
                <div className="doctor-info">
                  <h3>{displayName(d)}</h3>
                  <p className="doctor-especialidad">{d.especialidad || 'Especialidad no registrada'}</p>
                  <div className="usuario-meta"><span className={`status-badge ${d.estado}`}>{d.estado}</span>{d.tituloAcademico && <span className="rol-badge docente">{d.tituloAcademico}</span>}</div>
                </div>
              </div>
              <div className="perfil-details-grid">
                <div className="perfil-detail"><span className="material-icons">mail</span><div><small>Email</small><span>{d.email}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">call</span><div><small>Telfono</small><span>{d.telefono || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">apartment</span><div><small>Departamento</small><span>{d.departamento || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">schedule</span><div><small>Horario</small><span>{d.horarioAtencion || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">badge</span><div><small>CI</small><span>{d.ci || ''}</span></div></div>
                <div className="perfil-detail"><span className="material-icons">event</span><div><small>Registro</small><span>{d.fechaRegistro}</span></div></div>
              </div>
              {sel?.id===d.id && <div className="perfil-extra"><p><strong>Biografa:</strong> {d.biografia || 'Sin biografa registrada.'}</p><p><strong>Direccin:</strong> {d.direccion || ''} <strong>Obs:</strong> {d.observaciones || ''}</p></div>}
            </div>
          )) : <div className="no-results"><span className="material-icons">search_off</span><p>{cargando?'Cargando docentes...':'No hay docentes registrados con estos filtros.'}</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Doctores;
