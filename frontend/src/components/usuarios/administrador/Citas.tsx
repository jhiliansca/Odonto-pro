import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import '../RoleExtra.css';
import './Citas.css';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Cita } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';

type EstadoCita = Cita['estado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const ETIQUETAS: Record<EstadoCita,string> = { pendiente:'Pendiente', confirmada:'Confirmada', completada:'Atendida', cancelada:'Cancelada' };
const ICONOS: Record<EstadoCita,string> = { pendiente:'schedule', confirmada:'event_available', completada:'task_alt', cancelada:'event_busy' };

const AdminCitas: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto ?? 'Administrador';
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | EstadoCita>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('todos');
  const [accion, setAccion] = useState<{id:number; estado:EstadoCita}|null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setCitas(await clinicaApi.citas()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo consultar la informacin.'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const doctores = useMemo(() => Array.from(new Set(citas.map(c => c.doctor ?? '').filter(Boolean))), [citas]);
  const filtradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return citas.filter(c => {
      const matchesTab = activeTab === 'todas' || c.estado === activeTab;
      const matchesDoctor = doctorFilter === 'todos' || c.doctor === doctorFilter;
      const matchesSearch = !term || (c.paciente||'').toLowerCase().includes(term) || c.tratamiento.toLowerCase().includes(term) || (c.doctor||'').toLowerCase().includes(term);
      return matchesTab && matchesDoctor && matchesSearch;
    });
  }, [citas, activeTab, doctorFilter, searchTerm]);

  const conteos = useMemo(() => ({ todas:citas.length, pendiente:citas.filter(c=>c.estado==='pendiente').length, confirmada:citas.filter(c=>c.estado==='confirmada').length, completada:citas.filter(c=>c.estado==='completada').length, cancelada:citas.filter(c=>c.estado==='cancelada').length }), [citas]);
  const formatearFecha = (fecha: string) => { const [a,m,d]=fecha.split('-').map(Number); return `${d} de ${MESES[(m||1)-1]} ${a}`; };
  const iniciales = (n: string|null) => (n||'').split(' ').filter(Boolean).slice(0,2).map(p=>p[0].toUpperCase()).join('');

  const cambiarEstado = async () => {
    if (!accion) return;
    const {id, estado} = accion; setAccion(null); setError('');
    try { await clinicaApi.cambiarEstadoCita(id, estado); setCitas(p => p.map(c => c.id===id ? {...c, estado} : c)); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar la cita.'); }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="ext-page citas-page">
        <div className="ext-header citas-hero">
          <div>
            <span className="citas-kicker">Agenda clnica</span>
            <h1>Gestin de Citas</h1>
            <p className="ext-sub">Supervisa la agenda, confirma citas y controla el estado de atencin en Odonto-Pro.</p>
          </div>
          <div className="citas-hero-stat"><span className="material-icons">calendar_month</span><div><strong>{conteos.todas}</strong><span>Citas totales</span></div></div>
        </div>

        {error && <ErrorState message={error} onRetry={() => void cargar()} />}

        <div className="citas-stats">
          {(['pendiente','confirmada','completada','cancelada'] as EstadoCita[]).map(est => (
            <button key={est} type="button" className={`citas-stat ${est} ${activeTab===est?'active':''}`} onClick={() => setActiveTab(activeTab===est?'todas':est)}>
              <span className="citas-stat-icon"><span className="material-icons">{ICONOS[est]}</span></span>
              <div><strong>{conteos[est]}</strong><span>{ETIQUETAS[est]}</span></div>
            </button>
          ))}
        </div>

        <div className="ext-toolbar citas-toolbar">
          <div className="tabs">
            {(['todas','pendiente','confirmada','completada','cancelada'] as const).map(tab => (
              <button key={tab} className={`tab ${activeTab===tab?'active':''}`} onClick={()=>setActiveTab(tab)}>
                {tab==='todas'?'Todas':ETIQUETAS[tab]} <span className="ext-tab-count">{conteos[tab]}</span>
              </button>
            ))}
          </div>
          <div className="ext-actions">
            <select className="ext-select" value={doctorFilter} onChange={e=>setDoctorFilter(e.target.value)}><option value="todos">Todos los doctores</option>{doctores.map(d=><option key={d} value={d}>{d}</option>)}</select>
            <div className="search-box"><span className="material-icons">search</span><input type="text" placeholder="Buscar paciente, tratamiento o doctor..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
          </div>
        </div>

        <div className="citas-grid">
          {cargando ? <LoadingState label="Cargando citas..." />
          : filtradas.length ? filtradas.map(cita => (
            <article key={cita.id} className={`cita-card estado-${cita.estado}`}>
              <div className="cita-card-top">
                <div className="cita-fecha"><span className="cita-hora">{cita.hora}</span><span>{formatearFecha(cita.fecha)}</span></div>
                <span className={`status-badge ${cita.estado}`}>{ETIQUETAS[cita.estado]}</span>
              </div>
              <div className="cita-persona"><span className="cita-avatar">{iniciales(cita.paciente)}</span><div><strong>{cita.paciente || 'Paciente sin nombre'}</strong><span>{cita.telefono || 'Sin telfono'}</span></div></div>
              <div className="cita-detalles">
                <div className="cita-detalle"><span className="material-icons">healing</span><div><small>Tratamiento</small><strong>{cita.tratamiento}</strong></div></div>
                <div className="cita-detalle"><span className="material-icons">medical_services</span><div><small>Doctor</small><strong>{cita.doctor || 'Sin asignar'}</strong></div></div>
                <div className="cita-detalle"><span className="material-icons">school</span><div><small>Estudiante</small><strong>{cita.estudiante || 'No asignado'}</strong></div></div>
              </div>
              <div className="cita-acciones">
                {cita.estado === 'pendiente' && <button className="cita-btn confirmar" onClick={()=>setAccion({id:cita.id,estado:'confirmada'})}><span className="material-icons">check_circle</span>Confirmar</button>}
                {cita.estado === 'confirmada' && <button className="cita-btn completar" onClick={()=>setAccion({id:cita.id,estado:'completada'})}><span className="material-icons">task_alt</span>Marcar atendida</button>}
                {cita.estado !== 'cancelada' && cita.estado !== 'completada' && <button className="cita-btn cancelar" onClick={()=>setAccion({id:cita.id,estado:'cancelada'})}><span className="material-icons">cancel</span>Cancelar</button>}
                {(cita.estado === 'cancelada' || cita.estado === 'completada') && <span className="cita-finalizada">Sin acciones pendientes</span>}
              </div>
            </article>
          )) : <EmptyState message={citas.length===0 ? 'No hay citas registradas en la base de datos.' : 'No hay citas que coincidan con los filtros seleccionados.'} />}
        </div>

        {accion && (
          <ConfirmDialog
            title={accion.estado==='cancelada'?'Cancelar cita':accion.estado==='completada'?'Marcar cita como atendida':'Confirmar cita'}
            message={accion.estado==='cancelada'?'Cancelar esta cita. Esta acción actualizará su estado.':accion.estado==='completada'?'Marcar esta cita como atendida':'Confirmar esta cita pendiente'}
            confirmLabel={accion.estado==='cancelada'?'Cancelar cita':accion.estado==='completada'?'Marcar atendida':'Confirmar'}
            onConfirm={() => void cambiarEstado()}
            onCancel={() => setAccion(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCitas;
