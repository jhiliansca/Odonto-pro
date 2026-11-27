import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import MiniBars from '../MiniBars';
import { catalogoApi, type ResumenCatalogo } from '../../../services/catalogoApi';
import { clinicaApi, type ClinicaResumen } from '../../../services/clinicaApi';
import { reportesApi, type Reporte } from '../../../services/reportesApi';
import { getStoredUser } from '../../../services/authApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import { descargarReportePdf } from '../../../utils/pdfReporte';
import './Reportes.css';

const AdminReportes: React.FC = () => {
  const userName = useCurrentUserName('Administrador');
  const [catalogo, setCatalogo] = useState<ResumenCatalogo | null>(null);
  const [clinica, setClinica] = useState<ClinicaResumen | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const [c, cl, r] = await Promise.all([catalogoApi.resumen(), clinicaApi.resumen(), reportesApi.listar({ modulo: 'administrador', limit: 20 })]);
      setCatalogo(c); setClinica(cl); setReportes(r);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar reportes'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const tipos = useMemo(() => ([
    { tipo:'clinico', titulo:'Reporte clínico general', desc:'Pacientes, citas, tratamientos y actividad clínica.', icon:'medical_information', color:'#0ea5e9' },
    { tipo:'inventario', titulo:'Reporte de inventario', desc:'Stock, valor, materiales críticos y movimientos.', icon:'inventory_2', color:'#059669' },
    { tipo:'usuarios', titulo:'Reporte de usuarios', desc:'Usuarios por rol, estado y registro.', icon:'groups', color:'#8b5cf6' },
    { tipo:'financiero', titulo:'Reporte financiero/resumen', desc:'Valor de inventario y métricas operativas.', icon:'payments', color:'#f59e0b' },
  ]), []);

  const indicadores = useMemo(() => {
    if (!catalogo || !clinica) return [];
    return [
      { etiqueta: 'Pacientes', valor: clinica.pacientes },
      { etiqueta: 'Citas', valor: clinica.citas },
      { etiqueta: 'Tratamientos', valor: clinica.tratamientos },
      { etiqueta: 'Materiales', valor: catalogo.materiales },
      { etiqueta: 'Procedimientos', valor: catalogo.procedimientos },
    ];
  }, [catalogo, clinica]);

  const generar = async (tipo: string, titulo: string) => {
    if (!catalogo || !clinica) return;
    setGenerando(tipo);
    const user = getStoredUser();
    const resumen = [
      { label:'Pacientes', value: clinica.pacientes }, { label:'Citas', value: clinica.citas }, { label:'Tratamientos', value: clinica.tratamientos },
      { label:'Materiales', value: catalogo.materiales }, { label:'Stock bajo', value: catalogo.stockBajo }, { label:'Valor inventario', value: `Bs ${Number(catalogo.valorTotal||0).toFixed(2)}` },
    ];
    const filas = [
      ['Pacientes registrados', clinica.pacientes, 'Clnica'],
      ['Citas registradas', clinica.citas, 'Clnica'],
      ['Tratamientos', clinica.tratamientos, 'Clnica'],
      ['Docentes', clinica.docentes, 'Usuarios'],
      ['Estudiantes', clinica.estudiantes, 'Usuarios'],
      ['Materiales', catalogo.materiales, 'Inventario'],
      ['Procedimientos', catalogo.procedimientos, 'Catálogo'],
      ['Stock bajo', catalogo.stockBajo, 'Inventario'],
    ];
    try {
      await reportesApi.crear({ tipo, modulo:'administrador', titulo, descripcion:`Reporte ${tipo} generado desde Odonto-Pro`, parametros:{ fecha:new Date().toISOString() }, datos:{ catalogo, clinica }, generadoPor:user?.nombreCompleto || userName, generadoPorId:user?.id ?? null, formato:'PDF' });
      descargarReportePdf({ titulo, modulo:'Administrador', generadoPor:user?.nombreCompleto || userName, resumen, columnas:['Indicador','Valor','Módulo'], filas, notas:'Datos reales obtenidos de Odonto-Pro al momento de la generación.' });
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo generar el reporte'); }
    finally { setGenerando(''); }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="reportes-container">
        <div className="page-header"><div><h1>Reportes del Sistema</h1><p>Genera, registra y descarga reportes PDF con el logo de Odonto-Pro.</p></div>
          <button type="button" className="cancel-button" onClick={() => void cargar()}><span className="material-icons">refresh</span>Actualizar</button></div>
        {error && <div className="no-results" role="alert"><span className="material-icons">error_outline</span><p>{error}</p></div>}
        {catalogo && clinica && (
          <div className="stats-grid">
            <Card title="Procedimientos" value={catalogo.procedimientos} icon="list_alt" color="#0ea5e9" />
            <Card title="Materiales" value={catalogo.materiales} icon="inventory_2" color="#059669" />
            <Card title="Pacientes" value={clinica.pacientes} icon="people" color="#8b5cf6" />
            <Card title="Citas" value={clinica.citas} icon="event" color="#f59e0b" />
          </div>
        )}
        {indicadores.length > 0 && <MiniBars titulo="Indicadores generales" datos={indicadores} />}
        <div className="reportes-grid">
          {tipos.map(t => (
            <div className="reporte-card" key={t.tipo}>
              <div className="reporte-icon" style={{background:`${t.color}18`,color:t.color}}><span className="material-icons">{t.icon}</span></div>
              <div className="reporte-info"><h3>{t.titulo}</h3><p className="reporte-meta"><span>{t.desc}</span></p><div className="reporte-tipo-container"><span className="reporte-tipo operativo">PDF</span><span className="reporte-tipo financiero">Registrado en BD</span></div></div>
              <div className="reporte-actions"><button className="icon-button" title="Generar y descargar PDF" disabled={!!generando} onClick={() => void generar(t.tipo, t.titulo)}><span className="material-icons">{generando===t.tipo?'hourglass_top':'picture_as_pdf'}</span></button></div>
            </div>
          ))}
        </div>
        <div className="dashboard-panel" style={{marginTop:'1.5rem'}}>
          <div className="panel-header"><div><h2>Reportes generados</h2><p className="panel-subtitulo">Historial real registrado en la base de datos</p></div></div>
          {cargando ? <div className="no-results"><p>Cargando...</p></div> : reportes.length ? (
            <table className="reporte-tabla"><thead><tr><th>Título</th><th>Tipo</th><th>Generado por</th><th>Fecha</th><th>Formato</th></tr></thead><tbody>
              {reportes.map(r => <tr key={r.id}><td><strong>{r.titulo}</strong><small>{r.descripcion || ''}</small></td><td>{r.tipo}</td><td>{r.generadoPor || 'Sistema'}</td><td>{r.fecha}</td><td><span className="reporte-tipo operativo">{r.formato}</span></td></tr>)}
            </tbody></table>
          ) : <div className="no-results"><span className="material-icons">assessment</span><p>No hay reportes generados aún. Genera uno para registrarlo.</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportes;
