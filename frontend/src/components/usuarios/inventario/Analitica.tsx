import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Analitica.css';
import { formatBs, formatNumero } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { AlertasResponse, CaducidadesResponse, Material, MovimientoMaterial, Prediccion } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

const PALETA = ['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#64748b'];
function diaCorto(iso: string) { const [, m, d] = iso.slice(0, 10).split('-'); return m && d ? `${d}/${m}` : iso; }

const Analitica: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Inventario');
  const [dias, setDias] = useState(60);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoMaterial[]>([]);
  const [prediccion, setPrediccion] = useState<Prediccion | null>(null);
  const [alertasDetalladas, setAlertasDetalladas] = useState<AlertasResponse | null>(null);
  const [caducidades, setCaducidades] = useState<CaducidadesResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState('todas');

  const cargar = useCallback(async (r: number) => {
    setCargando(true); setError(null);
    try {
      const [mats, movs, pred, alertas, lotes] = await Promise.all([
        catalogoApi.materiales(),
        catalogoApi.movimientos({ limit: 5000 }),
        catalogoApi.prediccion({ dias: r, horizonte: 7 }),
        catalogoApi.alertas(),
        catalogoApi.caducidades({ estado: 'todos', incluirCerrados: false }),
      ]);
      setMateriales(mats); setMovimientos(movs); setPrediccion(pred); setAlertasDetalladas(alertas); setCaducidades(lotes);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar la analítica'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { void cargar(dias); const t = window.setInterval(() => void cargar(dias), 20000); return () => clearInterval(t); }, [cargar, dias]);

  const limite = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - dias); return d; }, [dias]);
  const movsPeriodo = useMemo(() => movimientos.filter(m => new Date(m.fecha) >= limite), [movimientos, limite]);
  const matsFiltrados = useMemo(() => categoriaActiva === 'todas' ? materiales : materiales.filter(m => m.categoria === categoriaActiva), [materiales, categoriaActiva]);
  const categorias = useMemo(() => ['todas', ...Array.from(new Set(materiales.map(m => m.categoria)))], [materiales]);

  const resumen = useMemo(() => {
    const valorTotal = materiales.reduce((s, m) => s + m.stock * m.precio, 0);
    const criticos = materiales.filter(m => m.stockMinimo > 0 && m.stock < m.stockMinimo).length;
    const agotados = materiales.filter(m => m.stock <= 0).length;
    const salidas = movsPeriodo.filter(m => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.cantidad), 0);
    return { valorTotal, criticos, agotados, salidas };
  }, [materiales, movsPeriodo]);

  const serie = useMemo(() => {
    const map = new Map<string, { dia: string; entradas: number; salidas: number }>();
    for (const m of movsPeriodo) {
      const dia = m.fecha.slice(0, 10);
      const p = map.get(dia) || { dia, entradas: 0, salidas: 0 };
      if (m.tipo === 'ENTRADA') p.entradas += Number(m.cantidad); else p.salidas += Number(m.cantidad);
      map.set(dia, p);
    }
    return [...map.values()].sort((a, b) => a.dia.localeCompare(b.dia));
  }, [movsPeriodo]);

  const linea = useMemo(() => {
    const w = 920, h = 320, p = { t: 20, r: 20, b: 42, l: 50 };
    const uw = w - p.l - p.r, uh = h - p.t - p.b, n = serie.length;
    const max = Math.max(1, ...serie.map(s => Math.max(s.entradas, s.salidas)));
    const x = (i: number) => p.l + (uw * i) / Math.max(1, n - 1);
    const y = (v: number) => p.t + uh - (uh * v) / max;
    const pts = (k: 'entradas' | 'salidas') => serie.map((s, i) => `${x(i)},${y(s[k])}`).join(' ');
    const area = n ? [`M ${x(0)} ${y(0)}`, ...serie.map((s, i) => `L ${x(i)} ${y(s.salidas)}`), `L ${x(n - 1)} ${y(0)}`, 'Z'].join(' ') : '';
    const labels = serie.map((s, i) => ({ i, dia: s.dia })).filter(({ i }) => i % Math.max(1, Math.ceil(n / 7)) === 0 || i === n - 1);
    return { w, h, p, max, x, y, ptsE: pts('entradas'), ptsS: pts('salidas'), area, labels };
  }, [serie]);

  const donut = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of materiales) map.set(m.categoria, (map.get(m.categoria) || 0) + m.stock * m.precio);
    const items = [...map.entries()].map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
    const total = items.reduce((s, i) => s + i.valor, 0) || 1;
    const r = 70, c = 2 * Math.PI * r; let acc = 0;
    return { total, r, c, items: items.map((it, i) => { const f = it.valor / total; const seg = { ...it, f, off: acc, color: PALETA[i % PALETA.length] }; acc += f; return seg; }) };
  }, [materiales]);

  const topConsumo = useMemo(() => {
    const map = new Map<number, { nombre: string; total: number }>();
    for (const m of movsPeriodo.filter(x => x.tipo === 'SALIDA')) { const it = map.get(m.materialId) || { nombre: m.material, total: 0 }; it.total += Number(m.cantidad); map.set(m.materialId, it); }
    const arr = [...map.values()].sort((a, b) => b.total - a.total).slice(0, 8);
    return { arr, max: Math.max(1, ...arr.map(i => i.total)) };
  }, [movsPeriodo]);

  const alertas = useMemo(() => matsFiltrados.filter(m => m.stockMinimo > 0 && m.stock < m.stockMinimo).sort((a,b)=>(a.stock/(a.stockMinimo||1))-(b.stock/(b.stockMinimo||1))).slice(0,8), [matsFiltrados]);

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="analitica-container">
        <div className="page-header">
          <div>
            <h1>Analítica de Inventario</h1>
            <p className="analitica-subtitulo">Visualiza el comportamiento real del inventario: movimientos, valor, consumo y riesgo de stock.</p>
          </div>
          <div className="analitica-header-acciones">
            <select className="analitica-rango" value={dias} onChange={e => setDias(Number(e.target.value))} aria-label="Rango">
              <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={60}>Últimos 60 días</option><option value={90}>Últimos 90 días</option>
            </select>
            <button className="analitica-btn" onClick={() => void cargar(dias)} disabled={cargando}><span className="material-icons">refresh</span>{cargando ? 'Actualizando...' : 'Actualizar'}</button>
          </div>
        </div>

        {error && <div className="analitica-aviso" role="alert"><span className="material-icons">cloud_off</span><div><strong>No se pudo cargar la analítica.</strong><p>{error}</p></div></div>}

        <div className="stats-grid">
          <Card title="Valor total" value={formatBs(resumen.valorTotal, 2)} icon="payments" color="#059669" />
          <Card title="Bajo stock mínimo" value={formatNumero(resumen.criticos)} icon="warning" color="#ef4444" />
          <Card title="Agotados" value={formatNumero(resumen.agotados)} icon="error" color="#f59e0b" />
          <Card title="Salidas del periodo" value={formatNumero(resumen.salidas)} icon="outbound" color="#0ea5e9" />
          <Card title="Alertas detalladas" value={formatNumero(alertasDetalladas?.resumen.total ?? 0)} icon="notifications" color="#dc2626" />
          <Card title="Lotes por vencer" value={formatNumero(caducidades?.resumen.porVencer ?? 0)} icon="event" color="#f59e0b" />
        </div>

        <div className="analitica-filtros">
          {categorias.map(c => <button key={c} className={`analitica-chip-filtro ${categoriaActiva===c?'active':''}`} onClick={() => setCategoriaActiva(c)}>{c === 'todas' ? 'Todas las categorías' : c}</button>)}
        </div>

        <div className="analitica-grid dos">
          <div className="dashboard-panel analitica-panel-amplio">
            <div className="panel-header"><div><h2>Consumo temporal</h2><p className="analitica-panel-sub">Entradas vs salidas en los Últimos {dias} días. Permite detectar picos de consumo, reposiciones y días con mayor movimiento.</p></div>
              <div className="analitica-leyenda"><span className="analitica-leyenda-item"><span className="analitica-leyenda-color salidas"/>Salidas</span><span className="analitica-leyenda-item"><span className="analitica-leyenda-color entradas"/>Entradas</span></div>
            </div>
            {serie.length ? (
              <svg className="analitica-svg" viewBox={`0 0 ${linea.w} ${linea.h}`} role="img" aria-label="Consumo temporal">
                <defs><linearGradient id="areaSal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.22"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0.02"/></linearGradient></defs>
                {[0,.25,.5,.75,1].map(t => { const v=linea.max*t; return <g key={t}><line x1={linea.p.l} y1={linea.y(v)} x2={linea.w-linea.p.r} y2={linea.y(v)} className="analitica-grid-line"/><text x={linea.p.l-8} y={linea.y(v)+4} textAnchor="end" className="analitica-eje-texto">{formatNumero(v)}</text></g>; })}
                <path d={linea.area} fill="url(#areaSal)"/>
                <polyline points={linea.ptsE} className="analitica-linea entradas"/><polyline points={linea.ptsS} className="analitica-linea salidas"/>
                {serie.map((s,i)=><g key={s.dia}><circle cx={linea.x(i)} cy={linea.y(s.salidas)} r="3" className="analitica-punto salidas"><title>{`${diaCorto(s.dia)} Salidas: ${s.salidas}`}</title></circle><circle cx={linea.x(i)} cy={linea.y(s.entradas)} r="2.5" className="analitica-punto entradas"><title>{`${diaCorto(s.dia)} Entradas: ${s.entradas}`}</title></circle></g>)}
                {linea.labels.map(l => <text key={l.i} x={linea.x(l.i)} y={linea.h-linea.p.b+20} textAnchor="middle" className="analitica-eje-texto">{diaCorto(l.dia)}</text>)}
              </svg>
            ) : <p className="analitica-vacio">Sin movimientos registrados en el periodo.</p>}
            <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> la línea roja representa salidas/consumo; la verde, entradas/reposición. Si las salidas se mantienen por encima de las entradas, el stock tiende a bajar.</p>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Valor por categoría</h2><p className="analitica-panel-sub">Distribución del valor económico del stock actual por categoría de material.</p></div></div>
            <div className="analitica-donut">
              <svg viewBox="0 0 180 180" role="img" aria-label="Valor por categoría">
                <g transform="rotate(-90 90 90)"><circle cx="90" cy="90" r={donut.r} className="analitica-donut-track"/>
                  {donut.items.map(s => <circle key={s.categoria} cx="90" cy="90" r={donut.r} className="analitica-donut-segmento" stroke={s.color} strokeDasharray={`${s.f*donut.c} ${donut.c}`} strokeDashoffset={-s.off*donut.c}><title>{`${s.categoria}: ${formatBs(s.valor,2)}`}</title></circle>)}
                </g>
                <text x="90" y="86" textAnchor="middle" className="analitica-donut-total">{formatBs(donut.total,0)}</text>
                <text x="90" y="104" textAnchor="middle" className="analitica-donut-label">valor total</text>
              </svg>
              <ul className="analitica-donut-leyenda">{donut.items.map(s => <li key={s.categoria}><span className="analitica-donut-swatch" style={{backgroundColor:s.color}}/><span className="analitica-donut-nombre">{s.categoria}</span><span className="analitica-donut-porcentaje">{formatNumero(s.f*100,1)}%</span><span className="analitica-donut-valor">{formatBs(s.valor,0)}</span></li>)}</ul>
            </div>
            <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> muestra dónde está concentrado el dinero del inventario. Categorías grandes requieren mayor control y planificación de compra.</p>
          </div>
        </div>

        <div className="analitica-grid dos">
          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Top insumos consumidos</h2><p className="analitica-panel-sub">Insumos con mayor volumen de salidas en el periodo. Sirve para priorizar reposición y compras.</p></div></div>
            <div className="analitica-barras">
              {topConsumo.arr.length ? topConsumo.arr.map((it,i) => (
                <div className="analitica-barra-row" key={it.nombre}><span className="analitica-barra-nombre" title={it.nombre}>{it.nombre}</span><span className="analitica-barra-track"><span className="analitica-barra-fill" style={{width:`${(it.total/topConsumo.max)*100}%`, backgroundColor:PALETA[i%PALETA.length]}}/></span><span className="analitica-barra-valor">{formatNumero(it.total)}</span></div>
              )) : <p className="analitica-vacio">Sin consumo registrado.</p>}
            </div>
            <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> barras más largas indican mayor consumo. Úsalo para identificar insumos críticos de alta rotación.</p>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Pronóstico y riesgo</h2><p className="analitica-panel-sub">Estimación basada en regresión lineal del consumo real. Resume demanda esperada y materiales con riesgo de quiebre.</p></div></div>
            <div className="analitica-pronostico">
              <div className="analitica-kpis">
                <div className="analitica-kpi"><span>Consumo total</span><strong>{formatNumero(prediccion?.resumen?.consumoTotal ?? 0)}</strong></div>
                <div className="analitica-kpi"><span>Proyección {prediccion?.horizonte ?? 7}d</span><strong>{formatNumero(prediccion?.resumen?.proyectadoTotal ?? 0)}</strong></div>
                <div className="analitica-kpi"><span>Tendencia</span><strong className={(prediccion?.resumen?.tendencia ?? 0) > 0 ? 'up' : 'down'}>{(prediccion?.resumen?.tendencia ?? 0) > 0 ? '↗' : '↘'} {formatNumero(Math.abs(prediccion?.resumen?.tendencia ?? 0),3)}</strong></div>
                <div className="analitica-kpi"><span>R² modelo</span><strong>{formatNumero((prediccion?.resumen?.r2 ?? 0)*100,1)}%</strong></div>
              </div>
              <div className="analitica-riesgo-lista">
                {(prediccion?.materiales ?? []).slice(0,5).map(m => (
                  <div key={m.id} className={`analitica-riesgo-item ${m.riesgo}`}>
                    <div><strong>{m.material}</strong><small>Cobertura {formatNumero(m.coberturaMeses,1)} meses · stock {m.stock}</small></div>
                    <span className={`analitica-chip ${m.riesgo==='critico'?'danger':m.riesgo==='alto'?'warning':'por_vencer'}`}>{m.riesgo === 'critico' ? 'Crítico' : m.riesgo === 'alto' ? 'Alto' : 'Normal'}</span>
                  </div>
                ))}
                {!prediccion?.materiales?.length && <p className="analitica-vacio">Sin datos suficientes para pronóstico.</p>}
              </div>
            </div>
            <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> R² indica qué tan bien el modelo explica el consumo histórico. Riesgo alto/crítico sugiere revisar reposición antes de agotar stock.</p>
          </div>
        </div>

        <div className="analitica-grid dos">
          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Alertas de stock</h2><p className="analitica-panel-sub">Insumos cuyo stock actual está por debajo del mínimo configurado. Requieren atención inmediata.</p></div><span className="analitica-badge danger">{alertas.length}</span></div>
            <div className="analitica-tabla-wrapper"><table className="analitica-tabla"><thead><tr><th>Insumo</th><th>Stock</th><th>Mínimo</th><th>Dif.</th><th>Valor</th></tr></thead><tbody>
              {alertas.map(a => <tr key={a.id}><td><strong>{a.nombre}</strong><small>{a.categoria} · {a.unidad}</small></td><td>{formatNumero(a.stock)}</td><td>{formatNumero(a.stockMinimo)}</td><td><span className="analitica-chip danger">{formatNumero(a.stock-a.stockMinimo)}</span></td><td>{formatBs(a.stock*a.precio,2)}</td></tr>)}
              {!alertas.length && <tr><td colSpan={5} className="analitica-vacio">Sin alertas de stock.</td></tr>}
            </tbody></table></div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Actividad reciente</h2><p className="analitica-panel-sub">Últimos movimientos de inventario. Ayuda a auditar quién movió qué, cuándo y por qué motivo.</p></div></div>
            <ul className="analitica-actividad">
              {movsPeriodo.slice(0,8).map(m => (
                <li key={m.id}><span className={`analitica-actividad-icono ${m.tipo.toLowerCase()}`}><span className="material-icons">{m.tipo==='ENTRADA'?'south_west':'north_east'}</span></span>
                  <div className="analitica-actividad-detalle"><strong>{m.material}</strong><span>{m.motivo} · {m.usuario || 'Sistema'}</span></div>
                  <div className="analitica-actividad-cantidad"><span className={m.tipo==='ENTRADA'?'entrada':'salida'}>{m.tipo==='ENTRADA'?'+':'-'}{formatNumero(m.cantidad)}</span><small>{diaCorto(m.fecha)}</small></div>
                </li>
              ))}
              {!movsPeriodo.length && <li className="analitica-vacio">Sin movimientos recientes.</li>}
            </ul>
          </div>
        </div>

        <div className="analitica-grid dos">
          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Alertas de stock detalladas</h2><p className="analitica-panel-sub">Proveedor, cobertura, último movimiento y acción recomendada calculados desde la base de datos.</p></div><span className="analitica-badge danger">{alertasDetalladas?.resumen.total ?? 0}</span></div>
            <div className="analitica-tabla-wrapper"><table className="analitica-tabla"><thead><tr><th>Insumo</th><th>Severidad</th><th>Cobertura</th><th>Proveedor</th><th>Acción</th></tr></thead><tbody>
              {(alertasDetalladas?.alertas ?? []).slice(0,8).map(a => <tr key={`detalle-${a.id}`}><td><strong>{a.producto}</strong><small>Faltan {formatNumero(a.faltante)} {a.unidad}</small></td><td><span className={`analitica-chip ${a.severidad === 'critico' ? 'danger' : 'warning'}`}>{a.severidad}</span></td><td>{a.diasCobertura === null ? '—' : `${formatNumero(a.diasCobertura,1)} días`}</td><td>{a.proveedor || '—'}</td><td className="analitica-accion-tabla">{a.accion}</td></tr>)}
              {!alertasDetalladas?.alertas?.length && <tr><td colSpan={5} className="analitica-vacio">Sin alertas detalladas.</td></tr>}
            </tbody></table></div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header"><div><h2>Riesgo por caducidad</h2><p className="analitica-panel-sub">Lotes activos con vencimiento próximo o ya vencido. Valor en riesgo Bs {formatNumero(caducidades?.resumen.valorEnRiesgo ?? 0,2)}.</p></div><button className="analitica-btn" onClick={() => navigate('/inventario/caducidades')}><span className="material-icons">event_available</span>Abrir control</button></div>
            <div className="analitica-tabla-wrapper"><table className="analitica-tabla"><thead><tr><th>Insumo / lote</th><th>Vencimiento</th><th>Cantidad</th><th>Ubicación</th><th>Estado</th></tr></thead><tbody>
              {(caducidades?.lotes ?? []).slice(0,8).map(l => <tr key={`cad-${l.id}`}><td><strong>{l.material}</strong><small>{l.codigoLote}</small></td><td>{diaCorto(l.fechaVencimiento)}</td><td>{formatNumero(l.cantidadActual,1)} {l.unidad}</td><td>{l.ubicacion || '—'}</td><td><span className={`analitica-chip ${l.estadoCaducidad === 'vencido' || l.estadoCaducidad === 'hoy' ? 'danger' : l.estadoCaducidad === 'proximo' ? 'warning' : 'por_vencer'}`}>{l.diasRestantes < 0 ? `Vencido ${Math.abs(l.diasRestantes)}d` : `${l.diasRestantes}d`}</span></td></tr>)}
              {!caducidades?.lotes?.length && <tr><td colSpan={5} className="analitica-vacio">Sin lotes por vencer.</td></tr>}
            </tbody></table></div>
            <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> los lotes en rojo requieren retiro y registrar salida; los lotes en ámbar deben consumirse primero. Ambos procesos quedan registrados en movimientos.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analitica;
