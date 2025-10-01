import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Inventario.css';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  proveedor: string;
}

const Inventario: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState('Admin Principal');
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Nuevo estado para el formulario
  const [nuevoProducto, setNuevoProducto] = useState<Omit<Producto, 'id'>>({ 
    nombre: '', 
    categoria: 'materiales', 
    stock: 0, 
    stockMinimo: 0, 
    precio: 0, 
    proveedor: '' 
  });
  
  // Datos simulados de productos
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: 'Resina compuesta', categoria: 'materiales', stock: 25, stockMinimo: 10, precio: 150, proveedor: 'Dental Supplies S.A.' },
    { id: 2, nombre: 'Guantes de látex (caja)', categoria: 'insumos', stock: 42, stockMinimo: 20, precio: 80, proveedor: 'Medical Products Inc.' },
    { id: 3, nombre: 'Anestesia dental', categoria: 'medicamentos', stock: 30, stockMinimo: 15, precio: 120, proveedor: 'Pharma Dental' },
    { id: 4, nombre: 'Fresas dentales', categoria: 'instrumentos', stock: 50, stockMinimo: 20, precio: 90, proveedor: 'Dental Tools Co.' },
    { id: 5, nombre: 'Algodón (paquete)', categoria: 'insumos', stock: 35, stockMinimo: 15, precio: 40, proveedor: 'Medical Products Inc.' },
    { id: 6, nombre: 'Amalgama dental', categoria: 'materiales', stock: 8, stockMinimo: 10, precio: 200, proveedor: 'Dental Supplies S.A.' },
    { id: 7, nombre: 'Cubetas de impresión', categoria: 'instrumentos', stock: 18, stockMinimo: 10, precio: 60, proveedor: 'Dental Tools Co.' },
    { id: 8, nombre: 'Ionómero de vidrio', categoria: 'materiales', stock: 12, stockMinimo: 8, precio: 180, proveedor: 'Dental Supplies S.A.' },
  ]);

  // Filtrar productos según la pestaña activa y término de búsqueda
  const filteredProductos = productos.filter(producto => {
    const matchesTab = activeTab === 'todos' || 
                      (activeTab === 'bajo-stock' && producto.stock < producto.stockMinimo) ||
                      (activeTab === producto.categoria);
                      
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
                         
    return matchesTab && matchesSearch;
  });

  // Estadísticas de inventario
  const stats = {
    total: productos.length,
    bajoStock: productos.filter(p => p.stock < p.stockMinimo).length,
    valorTotal: productos.reduce((sum, p) => sum + (p.stock * p.precio), 0),
    categorias: new Set(productos.map(p => p.categoria)).size
  };

  // Función para manejar el clic en una card de producto
  const handleProductClick = (producto: Producto) => {
    console.log('Producto seleccionado:', producto);
    // Aquí se podría abrir un modal o navegar a la página de detalle del producto
    alert(`Detalles del producto: ${producto.nombre}\nCategoría: ${producto.categoria}\nStock: ${producto.stock}\nPrecio: $${producto.precio}\nProveedor: ${producto.proveedor}`);
  };

  // Función para manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoProducto({
      ...nuevoProducto,
      [name]: name === 'stock' || name === 'stockMinimo' || name === 'precio' 
        ? Number(value) 
        : value
    });
  };

  // Función para agregar un nuevo producto
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que todos los campos estén completos
    if (!nuevoProducto.nombre || !nuevoProducto.proveedor || nuevoProducto.precio <= 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Crear nuevo producto con ID único
    const newId = Math.max(...productos.map(p => p.id)) + 1;
    const productoCompleto = { ...nuevoProducto, id: newId };
    
    // Agregar a la lista de productos
    setProductos([...productos, productoCompleto]);
    
    // Mostrar mensaje de éxito
    setFormSuccess(true);
    
    // Resetear el formulario después de 2 segundos
    setTimeout(() => {
      setFormSuccess(false);
      setShowModal(false);
      setNuevoProducto({ 
        nombre: '', 
        categoria: 'materiales', 
        stock: 0, 
        stockMinimo: 0, 
        precio: 0, 
        proveedor: '' 
      });
    }, 2000);
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="inventario-container">
        <div className="page-header">
          <h1>Gestión de Inventario</h1>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <span className="material-icons">add_circle</span>
            Nuevo Producto
          </button>
        </div>

        <div className="stats-grid">
          <Card 
            title="Total Productos" 
            value={stats.total} 
            icon="inventory_2" 
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
          />
          <Card 
            title="Bajo Stock" 
            value={stats.bajoStock} 
            icon="warning" 
            iconColor="#dc3545"
            backgroundColor="#fde0e3"
          />
          <Card 
            title="Valor Total" 
            value={`$${stats.valorTotal.toLocaleString()}`} 
            icon="attach_money" 
            iconColor="#28a745"
            backgroundColor="#d4edda"
          />
          <Card 
            title="Categorías" 
            value={stats.categorias} 
            icon="category" 
            iconColor="#ffc107"
            backgroundColor="#fff3cd"
          />
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
          {filteredProductos.length > 0 ? (
            filteredProductos.map(producto => (
              <div key={producto.id} className="producto-card" onClick={() => handleProductClick(producto)}>
                <div className="producto-icon" style={{ 
                  backgroundColor: producto.stock < producto.stockMinimo ? '#fde0e3' : '#e3f2fd',
                  color: producto.stock < producto.stockMinimo ? '#dc3545' : '#007bff'
                }}>
                  <span className="material-icons">
                    {producto.categoria === 'materiales' ? 'science' :
                     producto.categoria === 'insumos' ? 'healing' :
                     producto.categoria === 'instrumentos' ? 'build' : 'medication'}
                  </span>
                </div>
                <div className="producto-info">
                  <h3>{producto.nombre}</h3>
                  <p className="producto-categoria">{producto.categoria}</p>
                  <div className="producto-meta">
                    <span className={`producto-stock ${producto.stock < producto.stockMinimo ? 'bajo' : 'normal'}`}>
                      <span className="material-icons">{producto.stock < producto.stockMinimo ? 'warning' : 'check_circle'}</span>
                      Stock: {producto.stock}
                    </span>
                    <span className="producto-precio">${producto.precio}</span>
                  </div>
                  <p className="producto-proveedor">{producto.proveedor}</p>
                </div>
                <div className="producto-actions">
                  <button className="action-icon">
                    <span className="material-icons">edit</span>
                  </button>
                  <button className="action-icon">
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <span className="material-icons">inventory_2</span>
              <p>No se encontraron productos con los filtros seleccionados</p>
            </div>
          )}
        </div>

        {/* Modal para agregar nuevo producto */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Agregar Nuevo Producto</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              {formSuccess ? (
                <div className="success-message">
                  <span className="material-icons">check_circle</span>
                  <p>¡Producto agregado exitosamente!</p>
                </div>
              ) : (
                <form onSubmit={handleAddProduct}>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre del Producto*</label>
                    <input 
                      type="text" 
                      id="nombre" 
                      name="nombre" 
                      value={nuevoProducto.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="categoria">Categoría*</label>
                    <select 
                      id="categoria" 
                      name="categoria" 
                      value={nuevoProducto.categoria}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="materiales">Materiales</option>
                      <option value="insumos">Insumos</option>
                      <option value="instrumentos">Instrumentos</option>
                      <option value="medicamentos">Medicamentos</option>
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="stock">Stock Actual*</label>
                      <input 
                        type="number" 
                        id="stock" 
                        name="stock" 
                        min="0"
                        value={nuevoProducto.stock}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="stockMinimo">Stock Mínimo*</label>
                      <input 
                        type="number" 
                        id="stockMinimo" 
                        name="stockMinimo" 
                        min="0"
                        value={nuevoProducto.stockMinimo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="precio">Precio Unitario ($)*</label>
                    <input 
                      type="number" 
                      id="precio" 
                      name="precio" 
                      min="0"
                      step="0.01"
                      value={nuevoProducto.precio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="proveedor">Proveedor*</label>
                    <input 
                      type="text" 
                      id="proveedor" 
                      name="proveedor" 
                      value={nuevoProducto.proveedor}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="submit-button">
                      Guardar Producto
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