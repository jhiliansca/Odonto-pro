import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import '../administrador/Reportes.css';
import './InventarioPages.css';
import './ReportesInventario.css';
import { formatBs, formatNumero } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Material, Prediccion, ResumenCatalogo } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import { getStoredUser } from '../../../services/authApi';
import { reportesApi, type Reporte, type ReporteDetalle } from '../../../services/reportesApi';
import { descargarReportePdf } from '../../../utils/pdfReporte';

interface DatosReporte { resumen: ResumenCatalogo; prediccion: Prediccion; materiales: Material[]; }

function descargarSnapshot(reporte: ReporteDetalle) {
  const snapshot = reporte.datos;
  if (!snapshot) throw new Error('El reporte no tiene datos persistidos para descargar.');
  descargarReportePdf({
    titulo: reporte.titulo,
    modulo: reporte.modulo,
    generadoPor: reporte.generadoPor || 'Sistema',
    fecha: reporte.fecha,
    resumen: snapshot.resumen || [],
    columnas: snapshot.columnas,
    filas: snapshot.filas,
    notas: snapshot.notas || 'Reporte generado con datos reales del inventario Clínica Unifranz.',
  });
}

const InventarioReportes: React.FC = () => {
  const userName = useCurrentUserName('Inventario');
  const [datos, setDatos] = useState<DatosReporte | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState('');
  const [descargando, setDescargando] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const [resumen, prediccion, materiales, regs] = await Promise.all([
        catalogoApi.resumen(), catalogoApi.prediccion({ dias: 90, horizonte: 1 }), catalogoApi.materiales(), reportesApi.listar({ modulo: 'inventario', limit: 20 }),
      ]);
      setDatos({ resumen, prediccion, materiales }); setReportes(regs);
    } catch (err) { setDatos(null); setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo real.'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const mensual = useMemo(() => {
    const agrupado = new Map<string, number>();
    for (const p of datos?.prediccion?.serie ?? []) { const k=p.dia.slice(0,7); agrupado.set(k,(agrupado.get(k)||0)+p.cantidad); }
    const meses = [...agrupado.entries()].sort(([a],[b])=>a.localeCompare(b));
    const max = Math.max(1,...meses.map(([,v])=>v));
    return meses.map(([clave, valor]) => { const [a,m]=clave.split('-'); return { etiqueta:`${m}/${a.slice(2)}`, valor, altura:(valor/max)*100 }; });
  }, [datos]);

  const categorias = useMemo(() => {
    const mapa = new Map<string,{categoria:string;valor:number;unidades:number}>();
    for (const m of datos?.materiales || []) { const a=mapa.get(m.categoria) || {categoria:m.categoria,valor:0,unidades:0}; a.valor+=m.stock*m.precio; a.unidades+=m.stock; mapa.set(m.categoria,a); }
    return [...mapa.values()].sort((a,b)=>b.valor-a.valor);
  }, [datos]);

  const hayConsumo = !datos?.prediccion?.sinDatos && mensual.some(m => m.valor > 0);

  const generar = async (tipo: string, titulo: string) => {
    if (!datos) return;
    setGenerando(tipo);
    setError(null);
    const user = getStoredUser();
    try {
      const reporte = await reportesApi.generar({
        tipo,
        titulo,
        modulo: 'inventario',
        descripcion: `Reporte de inventario ${tipo} generado desde Clínica Unifranz`,
        parametros: { tipo, dias: 90, fecha: new Date().toISOString() },
        generadoPor: user?.nombreCompleto || userName,
        generadoPorId: user?.id ?? null,
        formato: 'PDF',
      });
      descargarSnapshot(reporte);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el reporte');
    } finally {
      setGenerando('');
    }
  };

  const descargarHistorial = async (id: number) => {
    setDescargando(id);
    setError(null);
    try {
      descargarSnapshot(await reportesApi.obtener(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar el reporte.');
    } finally {
      setDescargando(0);
    }
  };

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="reportes-container">
        <div className="page-header"><div><h1>Reportes de Inventario</h1><p>Genera, registra y descarga reportes PDF con logo de Clínica Unifranz.</p></div>
          <button type="button" className="cancel-button" onClick={() => void cargar()} disabled={cargando}><span className="material-icons">refresh</span>{cargando ? 'Actualizando...' : 'Actualizar'}</button></div>
        {error ? <div className="no-results" role="alert"><span className="material-icons">error_outline</span><p>{error}</p><button className="cancel-button" onClick={() => void cargar()}>Reintentar</button></div> : null}
        {datos && <>
          <div className="stats-grid">
            <Card title="Materiales registrados" value={datos.resumen.materiales} icon="inventory_2" color="#059669" />
            <Card title="Procedimientos registrados" value={datos.resumen.procedimientos} icon="list_alt" color="#0ea5e9" />
            <Card title="Salidas en 90 días" value={formatNumero(datos.prediccion.resumen?.consumoTotal ?? 0)} icon="swap_vert" color="#f59e0b" />
            <Card title="Valor total en almacén" value={formatBs(datos.resumen.valorTotal, 2)} icon="payments" color="#7c3aed" />
            <Card title="Alertas de stock" value={datos.resumen.stockBajo} icon="warning" color="#dc2626" />
            <Card title="Lotes por vencer" value={datos.resumen.lotesPorVencer} icon="event" color="#f59e0b" />
          </div>

          <div className="reportes-grid" style={{marginBottom:'1rem'}}>
            {[
              {tipo:'consumo',titulo:'Reporte de consumo y predicción',desc:'Salidas reales por insumo en el periodo.',icon:'analytics',color:'#0ea5e9'},
              {tipo:'categorias',titulo:'Reporte de valoración por categoría',desc:'Unidades y valor por categoría.',icon:'category',color:'#059669'},
              {tipo:'alertas',titulo:'Reporte detallado de alertas',desc:'Stock, proveedor, cobertura y acciones.',icon:'warning',color:'#dc2626'},
              {tipo:'caducidad',titulo:'Reporte de caducidad',desc:'Lotes, vencimientos, ubicación y riesgo.',icon:'event_busy',color:'#f59e0b'},
              {tipo:'valorado',titulo:'Reporte valorado de inventario',desc:'Valoración de existencias por insumo.',icon:'payments',color:'#7c3aed'},
            ].map(r => (
              <div className="reporte-card" key={r.tipo}><div className="reporte-icon" style={{background:`${r.color}18`,color:r.color}}><span className="material-icons">{r.icon}</span></div><div className="reporte-info"><h3>{r.titulo}</h3><p className="reporte-meta"><span>{r.desc}</span></p><div className="reporte-tipo-container"><span className="reporte-tipo operativo">PDF</span><span className="reporte-tipo financiero">BD</span></div></div><div className="reporte-actions"><button className="icon-button" title="Generar y descargar PDF" disabled={!!generando} onClick={() => void generar(r.tipo, r.titulo)}><span className="material-icons">{generando===r.tipo ? 'hourglass_top' : 'picture_as_pdf'}</span></button></div></div>
            ))}
          </div>

          <div className="reporte-historico dashboard-panel"><div className="panel-header"><div><h2>Consumo mensual de insumos</h2><p className="panel-subtitulo">Unidades salidas registradas en los últimos 90 días</p></div></div>
            {hayConsumo ? <div className="reporte-barras">{mensual.map(m => <div className="reporte-barra" key={m.etiqueta}><strong>{formatNumero(m.valor)}</strong><span style={{height:`${m.altura}%`}} /><small>{m.etiqueta}</small></div>)}</div> : <div className="no-results"><p>No hay movimientos en el periodo.</p></div>}
          </div>

          <div className="reportes-grid" style={{ marginTop: '1rem' }}>
            <div className="dashboard-panel"><div className="panel-header"><h2>Insumos más consumidos</h2></div><table className="reporte-tabla"><thead><tr><th>Insumo</th><th>Consumido</th><th>Proyección</th></tr></thead><tbody>{(datos.prediccion.materiales ?? []).slice(0,6).map(m => <tr key={m.id}><td><strong>{m.material}</strong><small>{m.unidad}</small></td><td>{formatNumero(m.consumido,1)}</td><td className="reporte-valor">{formatNumero(m.proyectado,1)}</td></tr>)}{(datos.prediccion.materiales ?? []).length === 0 && <tr><td colSpan={3} className="reporte-valor">No hay datos disponibles.</td></tr>}</tbody></table></div>
            <div className="dashboard-panel"><div className="panel-header"><h2>Valoración por categoría</h2></div><table className="reporte-tabla"><thead><tr><th>Categoría</th><th>Unidades</th><th>Valor</th></tr></thead><tbody>{categorias.map(c => <tr key={c.categoria}><td><strong>{c.categoria}</strong></td><td>{formatNumero(c.unidades,1)}</td><td className="reporte-valor">{formatBs(c.valor,2)}</td></tr>)}{categorias.length === 0 && <tr><td colSpan={3} className="reporte-valor">No hay datos disponibles.</td></tr>}</tbody></table></div>
          </div>

          <div className="dashboard-panel" style={{marginTop:'1rem'}}><div className="panel-header"><div><h2>Reportes generados</h2><p className="panel-subtitulo">Historial real registrado en la base de datos</p></div></div>
            {reportes.length ? <table className="reporte-tabla"><thead><tr><th>Título</th><th>Tipo</th><th>Generado por</th><th>Fecha</th><th>Formato</th><th>Acción</th></tr></thead><tbody>{reportes.map(r => <tr key={r.id}><td><strong>{r.titulo}</strong><small>{r.descripcion||''}</small></td><td>{r.tipo}</td><td>{r.generadoPor||'Sistema'}</td><td>{r.fecha}</td><td><span className="reporte-tipo operativo">{r.formato}</span></td><td><button className="icon-button" title="Descargar reporte persistido" disabled={descargando===r.id} onClick={() => void descargarHistorial(r.id)}><span className="material-icons">{descargando===r.id ? 'hourglass_top' : 'picture_as_pdf'}</span></button></td></tr>)}</tbody></table>
            : <div className="no-results"><span className="material-icons">assessment</span><p>No hay reportes generados aún.</p></div>}
          </div>
        </>}
      </div>
    </DashboardLayout>
  );
};

export default InventarioReportes;