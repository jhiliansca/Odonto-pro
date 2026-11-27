import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import '../administrador/Inventario.css';
import './InventarioPages.css';
import { formatBs } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Material } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

type Categoria = 'materiales' | 'insumos' | 'instrumentos' | 'medicamentos';
type TipoMovimiento = 'ENTRADA' | 'SALIDA';

const CATEGORIAS: Record<Categoria, string> = { materiales: 'Materiales', insumos: 'Insumos', instrumentos: 'Instrumentos', medicamentos: 'Medicamentos' };
const ICONOS_CATEGORIA: Record<Categoria, string> = { materiales: 'science', insumos: 'healing', instrumentos: 'build', medicamentos: 'medication' };
function iconoCategoria(c: string) { return ICONOS_CATEGORIA[c as Categoria] || 'inventory_2'; }
function etiquetaCategoria(c: string) { return CATEGORIAS[c as Categoria] || c; }
function formatearFecha(fecha: string) {
  if (!fecha) return '';
  const parte = fecha.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(parte)) { const [a,m,d]=parte.split('-'); return `${d}/${m}/${a}`; }
  const f = new Date(fecha); return Number.isNaN(f.getTime()) ? fecha : f.toLocaleDateString('es-ES');
}

const InventarioProductos: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Inventario');
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'stock' | 'precio' | 'valor'>('nombre');
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [movimientoForm, setMovimientoForm] = useState({ materialId: 0, tipo: 'ENTRADA' as TipoMovimiento, cantidad: 1, motivo: '' });
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);
  const [movimientoExito, setMovimientoExito] = useState('');
  const [movimientoError, setMovimientoError] = useState('');
  const [editando, setEditando] = useState<Material | null>(null);
  const [edicionForm, setEdicionForm] = useState({ stockMinimo: 0, precio: 0, requiereCaducidad: 0, diasAlertaCaducidad: 15, ubicacion: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [edicionExito, setEdicionExito] = useState('');
  const [edicionError, setEdicionError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const datos = await catalogoApi.materiales();
      setMateriales(datos);
      if (datos.length > 0) setMovimientoForm(p => (p.materialId ? p : { ...p, materialId: datos[0].id }));
      setSeleccionadoId(prev => prev && datos.some(d => d.id === prev) ? prev : (datos[0]?.id ?? null));
    } catch (err) { setMateriales([]); setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo de materiales.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { void cargar(); const i = setInterval(() => { void cargar(); }, 15000); return () => clearInterval(i); }, [cargar]);

  const sortedProductos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtrados = materiales.filter(m => {
      const matchesTab = activeTab === 'todos' || (activeTab === 'bajo-stock' && m.stock < m.stockMinimo) || activeTab === m.categoria;
      const matchesSearch = !term || m.nombre.toLowerCase().includes(term) || m.clave.toLowerCase().includes(term) || m.categoria.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
    return [...filtrados].sort((a,b) => {
      if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre,'es');
      if (sortBy === 'stock') return a.stock - b.stock;
      if (sortBy === 'precio') return a.precio - b.precio;
      return (a.stock*a.precio) - (b.stock*b.precio);
    });
  }, [materiales, activeTab, searchTerm, sortBy]);

  const seleccionado = useMemo(() => materiales.find(m => m.id === seleccionadoId) || sortedProductos[0] || null, [materiales, seleccionadoId, sortedProductos]);
  useEffect(() => { if (seleccionado && seleccionado.id !== seleccionadoId) setSeleccionadoId(seleccionado.id); }, [seleccionado, seleccionadoId]);

  const stats = useMemo(() => ({
    total: materiales.length,
    bajoStock: materiales.filter(m => m.stock < m.stockMinimo).length,
  valorTotal: materiales.reduce((s,m) => s + m.stock*m.precio, 0),
    categorias: new Set(materiales.map(m => m.categoria)).size,
  }), [materiales]);

  const porCategoria = useMemo(() => Array.from(new Set(materiales.map(m => m.categoria))).map(categoria => {
    const items = materiales.filter(m => m.categoria === categoria);
    return { categoria, etiqueta: etiquetaCategoria(categoria), icono: iconoCategoria(categoria), cantidad: items.length, unidades: items.reduce((s,m)=>s+m.stock,0), valor: items.reduce((s,m)=>s+m.stock*m.precio,0), bajos: items.filter(m=>m.stock<m.stockMinimo).length };
  }), [materiales]);

  const abrirMovimiento = (material?: Material) => {
    setMovimientoForm({ materialId: material?.id ?? seleccionado?.id ?? materiales[0]?.id ?? 0, tipo:'ENTRADA', cantidad:1, motivo:'' });
    setMovimientoExito(''); setMovimientoError(''); setEditando(null); setShowMovimientoModal(true);
  };
  const handleMovimientoChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    const {name,value} = e.target; setMovimientoForm(p => ({...p, [name]: name==='materialId'||name==='cantidad' ? Number(value) : value}));
  };
  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault(); setMovimientoError(''); setMovimientoExito('');
    if (movimientoForm.materialId <= 0 || movimientoForm.cantidad <= 0) { setMovimientoError('Selecciona un material y una cantidad mayor a cero.'); return; }
    setGuardandoMovimiento(true);
    try {
      await catalogoApi.registrarMovimiento({ materialId: movimientoForm.materialId, tipo: movimientoForm.tipo, cantidad: movimientoForm.cantidad, motivo: movimientoForm.motivo.trim() || undefined });
      setMovimientoExito('Movimiento registrado correctamente. El stock se actualizó en la base de datos.'); await cargar();
    } catch (err) { setMovimientoError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.'); }
    finally { setGuardandoMovimiento(false); }
  };
  const abrirEdicion = (material: Material) => { setEditando(material); setEdicionForm({ stockMinimo: material.stockMinimo, precio: material.precio, requiereCaducidad: material.requiereCaducidad, diasAlertaCaducidad: material.diasAlertaCaducidad, ubicacion: material.ubicacion || '' }); setEdicionExito(''); setEdicionError(''); setShowMovimientoModal(false); };
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editando) return; setEdicionError(''); setEdicionExito('');
    if (edicionForm.stockMinimo < 0 || edicionForm.precio < 0 || edicionForm.diasAlertaCaducidad < 1) { setEdicionError('Los valores no pueden ser negativos y los días de alerta deben ser al menos 1.'); return; }
    setGuardandoEdicion(true);
    try {
      await catalogoApi.actualizarMaterial(editando.id, {
        stockMinimo: edicionForm.stockMinimo,
        precio: edicionForm.precio,
        requiereCaducidad: edicionForm.requiereCaducidad,
        diasAlertaCaducidad: edicionForm.diasAlertaCaducidad,
        ubicacion: edicionForm.ubicacion.trim() || null,
      });
      setEdicionExito('Stock mínimo, precio y control por caducidad actualizados correctamente.');
      await cargar();
    }
    catch (err) { setEdicionError(err instanceof Error ? err.message : 'No se pudo actualizar el material.'); }
    finally { setGuardandoEdicion(false); }
  };
  const handleDarDeBaja = async (material: Material) => {
    if (!window.confirm(`Dar de baja "${material.nombre}" Dejar de estar activo en el catálogo.`)) return;
    try { await catalogoApi.actualizarMaterial(material.id, { activo: 0 }); await cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo dar de baja el material.'); }
  };

  const detalle = seleccionado;
  const detalleBajo = detalle ? detalle.stock < detalle.stockMinimo : false;
  const detallePct = detalle ? Math.min(100, Math.round((detalle.stock / Math.max(detalle.stockMinimo * 2, 1)) * 100)) : 0;

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="inventario-container">
        <div className="page-header">
          <h1>Productos</h1>
          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
            <button className="add-button" onClick={() => void cargar()} disabled={cargando}><span className="material-icons">refresh</span>{cargando ? 'Actualizando...' : 'Actualizar'}</button>
            <button className="add-button" onClick={() => abrirMovimiento()}><span className="material-icons">add_circle</span>Registrar movimiento</button>
          </div>
        </div>

        <div className="stats-grid">
          <Card title="Total Productos" value={stats.total} icon="inventory_2" color="#059669" />
          <Card title="Bajo Stock" value={stats.bajoStock} icon="warning" color="#dc2626" />
          <Card title="Valor Total" value={formatBs(stats.valorTotal)} icon="attach_money" color="#16a34a" />
          <Card title="Categorías" value={stats.categorias} icon="category" color="#f59e0b" />
        </div>

        <div className="filter-container">
          <div className="tabs">
            <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>Todos</button>
            <button className={`tab ${activeTab === 'bajo-stock' ? 'active' : ''}`} onClick={() => setActiveTab('bajo-stock')}>Bajo Stock</button>
            {(Object.keys(CATEGORIAS) as Categoria[]).map(cat => <button key={cat} className={`tab ${activeTab === cat ? 'active' : ''}`} onClick={() => setActiveTab(cat)}>{CATEGORIAS[cat]}</button>)}
          </div>
          <div className="search-box"><span className="material-icons">search</span><input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
          <div className="sort-box"><span className="material-icons">sort</span><select value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)}><option value="nombre">Nombre</option><option value="stock">Menor stock</option><option value="precio">Precio</option><option value="valor">Valor en almacén</option></select></div>
        </div>

        <div className="categoria-resumen">
          {porCategoria.map(cat => (
            <div key={cat.categoria} className="categoria-item">
              <span className={`categoria-icon ${cat.bajos > 0 ? 'alerta' : ''}`}><span className="material-icons">{cat.icono}</span></span>
              <div className="categoria-datos"><strong>{cat.etiqueta}</strong><span>{cat.cantidad} productos · {cat.unidades} unidades</span><span className="categoria-valor">{formatBs(cat.valor)}</span></div>
              {cat.bajos > 0 && <span className="categoria-alerta-badge">{cat.bajos} bajo stock</span>}
            </div>
          ))}
        </div>

        {error ? <div className="no-results" role="alert"><span className="material-icons">cloud_off</span><p>{error}</p><button className="cancel-button" onClick={()=>void cargar()}>Reintentar</button></div>
        : cargando ? <div className="no-results"><span className="material-icons">sync</span><p>Cargando materiales desde la base de datos...</p></div>
        : <div className="producto-layout">
            <div className="productos-lista">
              {sortedProductos.length ? sortedProductos.map(producto => {
                const bajoStock = producto.stock < producto.stockMinimo;
                const activo = producto.id === detalle.id;
                return (
                  <button key={producto.id} type="button" className={`producto-card producto-card-select ${activo ? 'selected' : ''}`} onClick={() => setSeleccionadoId(producto.id)}>
                    <div className={`producto-icon ${bajoStock ? 'bajo' : ''}`}><span className="material-icons">{iconoCategoria(producto.categoria)}</span></div>
                    <div className="producto-info">
                      <h3>{producto.nombre}</h3>
                      <p className="producto-categoria">{etiquetaCategoria(producto.categoria)}{producto.activo===0 ? ' · Inactivo' : ''}</p>
                      <div className="producto-meta">
                        <span className={`producto-stock ${bajoStock ? 'bajo' : 'normal'}`}><span className="material-icons">{bajoStock ? 'warning' : 'check_circle'}</span>Stock: {producto.stock} {producto.unidad}</span>
                        <span className="producto-precio">{formatBs(producto.precio)}</span>
                      </div>
                      <p className="producto-proveedor">Mín: {producto.stockMinimo} {producto.unidad} · {producto.procedimientos} procedimientos{producto.requiereCaducidad === 1 ? ' · Control por caducidad' : ''}</p>
                    </div>
                    <span className="material-icons producto-ver">chevron_right</span>
                  </button>
                );
              }) : <div className="no-results"><span className="material-icons">inventory_2</span><p>No hay materiales registrados con los filtros seleccionados</p></div>}
            </div>

            <div className="producto-detalle">
              {detalle ? (
                <>
                  <div className="producto-detalle-head">
                    <div className={`producto-detalle-icon ${detalleBajo ? 'bajo' : ''}`}><span className="material-icons">{iconoCategoria(detalle.categoria)}</span></div>
                    <div>
                      <span className="producto-detalle-kicker">Detalle del producto</span>
                      <h2>{detalle.nombre}</h2>
                      <p>{etiquetaCategoria(detalle.categoria)} · Clave {detalle.clave} · {detalle.activo===0 ? 'Inactivo' : 'Activo'}</p>
                    </div>
                  </div>
                  <div className="producto-detalle-stats">
                    <div className="detalle-stat"><span>Stock actual</span><strong className={detalleBajo ? 'danger' : ''}>{detalle.stock} {detalle.unidad}</strong></div>
                    <div className="detalle-stat"><span>Stock mínimo</span><strong>{detalle.stockMinimo} {detalle.unidad}</strong></div>
                    <div className="detalle-stat"><span>Precio unitario</span><strong>{formatBs(detalle.precio)}</strong></div>
                    <div className="detalle-stat"><span>Valor en almacén</span><strong>{formatBs(detalle.stock*detalle.precio)}</strong></div>
                    <div className="detalle-stat"><span>Control por caducidad</span><strong>{detalle.requiereCaducidad === 1 ? 'Activo' : 'No requiere'}</strong></div>
                    <div className="detalle-stat"><span>Ubicación</span><strong>{detalle.ubicacion || '—'}</strong></div>
                  </div>
                  <div className="producto-detalle-barra">
                    <div className="detalle-barra-label"><span>Nivel de stock</span><span className={detalleBajo ? 'danger' : ''}>{detalleBajo ? 'Bajo stock' : 'Normal'}</span></div>
                    <div className="detalle-barra-track"><div className={`detalle-barra-fill ${detalleBajo ? 'bajo' : ''}`} style={{width:`${detallePct}%`}} /></div>
                  </div>
                  <div className="producto-detalle-grid">
                    <div className="detalle-item"><span className="material-icons">category</span><div><small>Categoría</small><strong>{etiquetaCategoria(detalle.categoria)}</strong></div></div>
                    <div className="detalle-item"><span className="material-icons">straighten</span><div><small>Unidad</small><strong>{detalle.unidad}</strong></div></div>
                    <div className="detalle-item"><span className="material-icons">medical_services</span><div><small>Procedimientos</small><strong>{detalle.procedimientos}</strong></div></div>
                    <div className="detalle-item"><span className="material-icons">inventory</span><div><small>Usos registrados</small><strong>{detalle.usos}</strong></div></div>
                    <div className="detalle-item"><span className="material-icons">event</span><div><small>Alerta de caducidad</small><strong>{detalle.requiereCaducidad === 1 ? `${detalle.diasAlertaCaducidad} días antes` : 'No aplica'}</strong></div></div>
                    <div className="detalle-item"><span className="material-icons">update</span><div><small>Última actualización</small><strong>{formatearFecha(detalle.actualizado)}</strong></div></div>
                    <div className="detalle-item"><span className="material-icons">qr_code_2</span><div><small>Identificador</small><strong>{detalle.clave}</strong></div></div>
                  </div>
                  <div className="producto-detalle-actions">
                    <button className="add-button" onClick={() => abrirMovimiento(detalle)}><span className="material-icons">swap_vert</span>Registrar movimiento</button>
                    <button className="cancel-button" onClick={() => abrirEdicion(detalle)}><span className="material-icons">edit</span>Editar</button>
                    <button className="cancel-button" onClick={() => navigate(`/inventario/caducidades?material=${detalle.id}`)}><span className="material-icons">event_available</span>Ver lotes</button>
                    <button className="cancel-button danger-text" onClick={() => void handleDarDeBaja(detalle)}><span className="material-icons">block</span>Dar de baja</button>
                  </div>
                </>
              ) : <div className="no-results"><span className="material-icons">inventory_2</span><p>Selecciona un producto para ver su detalle.</p></div>}
            </div>
          </div>}

        {showMovimientoModal && (
          <div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h2>Registrar movimiento de stock</h2><button className="close-button" onClick={()=>setShowMovimientoModal(false)}><span className="material-icons">close</span></button></div>
            {movimientoExito ? <div className="success-message"><span className="material-icons">check_circle</span><p>{movimientoExito}</p><button className="submit-button" onClick={()=>setShowMovimientoModal(false)}>Cerrar</button></div>
            : <form onSubmit={handleRegistrarMovimiento}>
              <div className="form-group"><label htmlFor="materialId">Material*</label><select id="materialId" name="materialId" value={movimientoForm.materialId} onChange={handleMovimientoChange} required>{materiales.map(m=><option key={m.id} value={m.id}>{m.nombre} - stock {m.stock} {m.unidad}</option>)}</select></div>
              <div className="form-row"><div className="form-group"><label htmlFor="tipo">Tipo*</label><select id="tipo" name="tipo" value={movimientoForm.tipo} onChange={handleMovimientoChange} required><option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option></select></div><div className="form-group"><label htmlFor="cantidad">Cantidad*</label><input type="number" id="cantidad" name="cantidad" min="1" value={movimientoForm.cantidad} onChange={handleMovimientoChange} required /></div></div>
              <div className="form-group"><label htmlFor="motivo">Motivo</label><input type="text" id="motivo" name="motivo" value={movimientoForm.motivo} onChange={handleMovimientoChange} placeholder="Ej. Reposición de stock" /></div>
              {movimientoError && <div className="form-group" style={{color:'#dc2626'}} role="alert"><span className="material-icons" style={{verticalAlign:'middle'}}>error</span> {movimientoError}</div>}
              <div className="form-actions"><button type="button" className="cancel-button" onClick={()=>setShowMovimientoModal(false)}>Cancelar</button><button type="submit" className="submit-button" disabled={guardandoMovimiento||materiales.length===0}>{guardandoMovimiento ? 'Guardando...' : 'Registrar movimiento'}</button></div>
            </form>}
          </div></div>
        )}

        {editando && (
          <div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h2>Editar {editando.nombre}</h2><button className="close-button" onClick={()=>setEditando(null)}><span className="material-icons">close</span></button></div>
            {edicionExito ? <div className="success-message"><span className="material-icons">check_circle</span><p>{edicionExito}</p><button className="submit-button" onClick={()=>setEditando(null)}>Cerrar</button></div>
            : <form onSubmit={handleGuardarEdicion}>
              <div className="form-group"><label htmlFor="stockMinimo">Stock mínimo ({editando.unidad})*</label><input type="number" id="stockMinimo" min="0" value={edicionForm.stockMinimo} onChange={e=>setEdicionForm(p=>({...p,stockMinimo:Number(e.target.value)}))} required /></div>
              <div className="form-group"><label htmlFor="precio">Precio unitario (Bs)*</label><input type="number" id="precio" min="0" step="0.01" value={edicionForm.precio} onChange={e=>setEdicionForm(p=>({...p,precio:Number(e.target.value)}))} required /></div>
              <label className="caducidades-check"><input type="checkbox" checked={edicionForm.requiereCaducidad === 1} onChange={e=>setEdicionForm(p=>({...p,requiereCaducidad:e.target.checked ? 1 : 0}))} /> Requiere control por caducidad</label>
              <div className="form-row">
                <div className="form-group"><label htmlFor="diasAlertaCaducidad">Días de alerta antes del vencimiento</label><input type="number" id="diasAlertaCaducidad" min="1" value={edicionForm.diasAlertaCaducidad} onChange={e=>setEdicionForm(p=>({...p,diasAlertaCaducidad:Number(e.target.value)}))} required /></div>
                <div className="form-group"><label htmlFor="ubicacion">Ubicación</label><input type="text" id="ubicacion" value={edicionForm.ubicacion} onChange={e=>setEdicionForm(p=>({...p,ubicacion:e.target.value}))} placeholder="Ej. Almacén A - Estante 2" /></div>
              </div>
              {edicionError && <div className="form-group" style={{color:'#dc2626'}} role="alert"><span className="material-icons" style={{verticalAlign:'middle'}}>error</span> {edicionError}</div>}
              <div className="form-actions"><button type="button" className="cancel-button" onClick={()=>setEditando(null)}>Cancelar</button><button type="submit" className="submit-button" disabled={guardandoEdicion}>{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button></div>
            </form>}
          </div></div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventarioProductos;
