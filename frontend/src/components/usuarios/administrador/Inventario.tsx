import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Inventario.css';
import { formatBs } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Material } from '../../../services/catalogoApi';

type TipoMovimiento = 'ENTRADA' | 'SALIDA';

function iconoCategoria(categoria: string): string {
  if (categoria === 'materiales') return 'science';
  if (categoria === 'insumos') return 'healing';
  if (categoria === 'instrumentos') return 'build';
  if (categoria === 'medicamentos') return 'medication';
  return 'inventory_2';
}

const Inventario: React.FC = () => {
  const userName = 'Admin Principal';
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [movimientoForm, setMovimientoForm] = useState({
    materialId: 0,
    tipo: 'ENTRADA' as TipoMovimiento,
    cantidad: 1,
    motivo: '',
  });
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);
  const [movimientoExito, setMovimientoExito] = useState('');
  const [movimientoError, setMovimientoError] = useState('');
  const [editando, setEditando] = useState<Material | null>(null);
  const [edicionForm, setEdicionForm] = useState({
    nombre: '',
    categoria: '',
    unidad: '',
    stock: 0,
    stockMinimo: 0,
    precio: 0,
    activo: true,
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [edicionExito, setEdicionExito] = useState('');
  const [edicionError, setEdicionError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await catalogoApi.materiales();
      setMateriales(datos);
      if (datos.length > 0) {
        setMovimientoForm(prev => (prev.materialId ? prev : { ...prev, materialId: datos[0].id }));
      }
    } catch (err) {
      setMateriales([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el inventario desde la base de datos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => { void cargar(); }, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const filteredProductos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return materiales.filter(material => {
      const matchesTab = activeTab === 'todos' || (activeTab === 'bajo-stock' && material.stock < material.stockMinimo) ||
        activeTab === material.categoria;
      const matchesSearch = !term ||
        material.nombre.toLowerCase().includes(term) ||
        material.clave.toLowerCase().includes(term) ||
        material.categoria.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [materiales, activeTab, searchTerm]);

  const stats = useMemo(() => ({
    total: materiales.length,
    bajoStock: materiales.filter(m => m.stock < m.stockMinimo).length,
  valorTotal: materiales.reduce((sum, m) => sum + (m.stock * m.precio), 0),
    categorias: new Set(materiales.map(m => m.categoria)).size,
  }), [materiales]);

  const handleProductClick = (material: Material) => {
    window.alert(
      `Detalles del material: ${material.nombre}\n` +
      `Clave: ${material.clave}\n` +
      `Categoría: ${material.categoria}\n` +
      `Stock: ${material.stock} ${material.unidad}\n` +
      `Stock mínimo: ${material.stockMinimo}\n` +
      `Precio: ${formatBs(material.precio)}\n` +
      `Valor en almacén: ${formatBs(material.stock * material.precio)}\n` +
      `Procedimientos: ${material.procedimientos}\n` +
      `Usos: ${material.usos}\n` +
      `Estado: ${material.activo === 1 ? 'Activo' : 'Inactivo'}`
    );
  };

  const abrirMovimiento = () => {
    setMovimientoForm({ materialId: materiales[0]?.id ?? 0, tipo: 'ENTRADA', cantidad: 1, motivo: '' });
    setMovimientoExito('');
    setMovimientoError('');
    setEditando(null);
    setShowMovimientoModal(true);
  };

  const handleMovimientoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMovimientoForm(prev => ({
      ...prev,
      [name]: name === 'materialId' || name === 'cantidad' ? Number(value) : value,
    }));
  };

  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovimientoError('');
    setMovimientoExito('');
    if (movimientoForm.materialId <= 0 || movimientoForm.cantidad <= 0) {
      setMovimientoError('Selecciona un material y una cantidad mayor a cero.');
      return;
    }
    setGuardandoMovimiento(true);
    try {
      await catalogoApi.registrarMovimiento({
        materialId: movimientoForm.materialId,
        tipo: movimientoForm.tipo,
        cantidad: movimientoForm.cantidad,
        motivo: movimientoForm.motivo.trim() || undefined,
      });
      setMovimientoExito('Entrada registrada y stock actualizado en la base de datos.');
      await cargar();
    } catch (err) {
      setMovimientoError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.');
    } finally {
      setGuardandoMovimiento(false);
    }
  };

  const abrirEdicion = (material: Material) => {
    setEditando(material);
    setEdicionForm({
      nombre: material.nombre,
      categoria: material.categoria,
      unidad: material.unidad,
      stock: material.stock,
      stockMinimo: material.stockMinimo,
      precio: material.precio,
      activo: material.activo === 1,
    });
    setEdicionExito('');
    setEdicionError('');
    setShowMovimientoModal(false);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setEdicionError('');
    setEdicionExito('');
    if (!edicionForm.nombre.trim() || !edicionForm.categoria.trim() || !edicionForm.unidad.trim() ||
        edicionForm.stock < 0 || edicionForm.stockMinimo < 0 || edicionForm.precio < 0) {
      setEdicionError('Completa nombre, categoría y unidad, y usa valores numéricos no negativos.');
      return;
    }
    setGuardandoEdicion(true);
    try {
      await catalogoApi.actualizarMaterial(editando.id, {
        nombre: edicionForm.nombre.trim(),
        categoria: edicionForm.categoria.trim(),
        unidad: edicionForm.unidad.trim(),
        stock: edicionForm.stock,
        stockMinimo: edicionForm.stockMinimo,
        precio: edicionForm.precio,
        activo: edicionForm.activo ? 1 : 0,
      });
      setEdicionExito('Material actualizado correctamente en la base de datos.');
      await cargar();
    } catch (err) {
      setEdicionError(err instanceof Error ? err.message : 'No se pudo actualizar el material.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleDarDeBaja = async (material: Material) => {
    if (!window.confirm(`¿Dar de baja "${material.nombre}" Dejará de estar activo en el catálogo.`)) return;
    try {
      await catalogoApi.actualizarMaterial(material.id, { activo: 0 });
      window.alert('Material dado de baja correctamente.');
      await cargar();
    } catch (err) {
      window.alert(`No se pudo dar de baja el material: ${err instanceof Error ? err.message : 'error desconocido'}`);
    }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="inventario-container">
        <div className="page-header">
          <h1>Gestión de Inventario</h1>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="add-button" onClick={() => void cargar()} disabled={cargando}>
              <span className="material-icons">refresh</span>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button className="add-button" onClick={abrirMovimiento}>
              <span className="material-icons">add_circle</span>
              Registrar entrada de stock
            </button>
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
            <button
              className={`tab ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              Todos
            </button>
            <button
              className={`tab ${activeTab === 'bajo-stock' ? 'active' : ''}`}
              onClick={() => setActiveTab('bajo-stock')}
            >
              Bajo Stock
            </button>
            <button
              className={`tab ${activeTab === 'materiales' ? 'active' : ''}`}
              onClick={() => setActiveTab('materiales')}
            >
              Materiales
            </button>
            <button
              className={`tab ${activeTab === 'insumos' ? 'active' : ''}`}
              onClick={() => setActiveTab('insumos')}
            >
              Insumos
            </button>
            <button
              className={`tab ${activeTab === 'instrumentos' ? 'active' : ''}`}
              onClick={() => setActiveTab('instrumentos')}
            >
              Instrumentos
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="productos-grid">
          {error ? (
            <div className="no-results" role="alert">
              <span className="material-icons">cloud_off</span>
              <p>{error}</p>
              <button className="cancel-button" onClick={() => void cargar()}>Reintentar</button>
            </div>
          ) : cargando ? (
            <div className="no-results">
              <span className="material-icons">sync</span>
              <p>Cargando inventario desde la base de datos…</p>
            </div>
          ) : filteredProductos.length > 0 ? (
            filteredProductos.map(producto => (
              <div key={producto.id} className="producto-card" onClick={() => handleProductClick(producto)}>
                <div className={`producto-icon ${producto.stock < producto.stockMinimo ? 'bajo' : ''}`}>
                  <span className="material-icons">{iconoCategoria(producto.categoria)}</span>
                </div>
                <div className="producto-info">
                  <h3>{producto.nombre}</h3>
                  <p className="producto-categoria">{producto.categoria}{producto.activo === 0 ? ' · Inactivo' : ''}</p>
                  <div className="producto-meta">
                    <span className={`producto-stock ${producto.stock < producto.stockMinimo ? 'bajo' : 'normal'}`}>
                      <span className="material-icons">{producto.stock < producto.stockMinimo ? 'warning' : 'check_circle'}</span>
                     Stock: {producto.stock} {producto.unidad}
                    </span>
                    <span className="producto-precio">{formatBs(producto.precio)}</span>
                  </div>
                  <p className="producto-proveedor">Clave: {producto.clave} · Mínimo: {producto.stockMinimo}</p>
                </div>
                <div className="producto-actions">
                  <button className="icon-button" onClick={(e) => { e.stopPropagation(); abrirEdicion(producto); }} aria-label="Editar">
                    <span className="material-icons">edit</span>
                  </button>
                  <button className="icon-button danger" onClick={(e) => { e.stopPropagation(); void handleDarDeBaja(producto); }} aria-label="Eliminar">
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <span className="material-icons">inventory_2</span>
              <p>No hay materiales registrados con los filtros seleccionados</p>
            </div>
          )}
        </div>

        {showMovimientoModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Registrar entrada de stock</h2>
                <button className="close-button" onClick={() => setShowMovimientoModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              {movimientoExito ? (
                <div className="success-message">
                  <span className="material-icons">check_circle</span>
                  <p>{movimientoExito}</p>
                  <button className="submit-button" onClick={() => setShowMovimientoModal(false)}>Cerrar</button>
                </div>
              ) : (
                <form onSubmit={handleRegistrarMovimiento}>
                  <div className="form-group">
                    <label htmlFor="materialId">Material*</label>
                    <select id="materialId" name="materialId" value={movimientoForm.materialId} onChange={handleMovimientoChange} required>
                      {materiales.length === 0 && <option value={0}>No hay materiales disponibles</option>}
                      {materiales.map(material => (
                        <option key={material.id} value={material.id}>{material.nombre} · stock {material.stock} {material.unidad}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="tipo">Tipo*</label>
                      <select id="tipo" name="tipo" value={movimientoForm.tipo} onChange={handleMovimientoChange} required>
                        <option value="ENTRADA">Entrada</option>
                        <option value="SALIDA">Salida</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cantidad">Cantidad*</label>
                      <input type="number" id="cantidad" name="cantidad" min="1" value={movimientoForm.cantidad} onChange={handleMovimientoChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="motivo">Motivo</label>
                    <input type="text" id="motivo" name="motivo" value={movimientoForm.motivo} onChange={handleMovimientoChange} placeholder="Ej. Reposición de stock" />
                  </div>
                  {movimientoError && (
                    <div className="form-group" style={{ color: '#dc2626' }} role="alert">
                      <span className="material-icons" style={{ verticalAlign: 'middle' }}>error</span> {movimientoError}
                    </div>
                  )}
                  <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={() => setShowMovimientoModal(false)}>Cancelar</button>
                    <button type="submit" className="submit-button" disabled={guardandoMovimiento || materiales.length === 0}>
                      {guardandoMovimiento ? 'Guardando…' : 'Registrar movimiento'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {editando && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Editar {editando.nombre}</h2>
                <button className="close-button" onClick={() => setEditando(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              {edicionExito ? (
                <div className="success-message">
                  <span className="material-icons">check_circle</span>
                  <p>{edicionExito}</p>
                  <button className="submit-button" onClick={() => setEditando(null)}>Cerrar</button>
                </div>
              ) : (
                <form onSubmit={handleGuardarEdicion}>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre*</label>
                    <input type="text" id="nombre" value={edicionForm.nombre} onChange={(e) => setEdicionForm(prev => ({ ...prev, nombre: e.target.value }))} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="categoria">Categoría*</label>
                      <input type="text" id="categoria" value={edicionForm.categoria} onChange={(e) => setEdicionForm(prev => ({ ...prev, categoria: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="unidad">Unidad*</label>
                      <input type="text" id="unidad" value={edicionForm.unidad} onChange={(e) => setEdicionForm(prev => ({ ...prev, unidad: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="stock">Stock*</label>
                      <input type="number" id="stock" min="0" value={edicionForm.stock} onChange={(e) => setEdicionForm(prev => ({ ...prev, stock: Number(e.target.value) }))} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="stockMinimo">Stock mínimo*</label>
                      <input type="number" id="stockMinimo" min="0" value={edicionForm.stockMinimo} onChange={(e) => setEdicionForm(prev => ({ ...prev, stockMinimo: Number(e.target.value) }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="precio">Precio unitario (Bs)*</label>
                    <input type="number" id="precio" min="0" step="0.01" value={edicionForm.precio} onChange={(e) => setEdicionForm(prev => ({ ...prev, precio: Number(e.target.value) }))} required />
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="activo" checked={edicionForm.activo} onChange={(e) => setEdicionForm(prev => ({ ...prev, activo: e.target.checked }))} />
                    <label htmlFor="activo">Material activo</label>
                  </div>
                  {edicionError && (
                    <div className="form-group" style={{ color: '#dc2626' }} role="alert">
                      <span className="material-icons" style={{ verticalAlign: 'middle' }}>error</span> {edicionError}
                    </div>
                  )}
                  <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={() => setEditando(null)}>Cancelar</button>
                    <button type="submit" className="submit-button" disabled={guardandoEdicion}>
                      {guardandoEdicion ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventario;