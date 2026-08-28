import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Usuarios.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: 'activo' | 'inactivo';
  fechaRegistro: string;
}

const Usuarios: React.FC = () => {
  const userName = 'Admin Principal';
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    rol: 'estudiante',
    password: '',
    confirmPassword: ''
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, nombre: 'Carlos Mendoza', email: 'carlos@clinica.com', rol: 'doctor', estado: 'activo', fechaRegistro: '15/01/2023' },
    { id: 2, nombre: 'María López', email: 'maria@clinica.com', rol: 'inventario', estado: 'activo', fechaRegistro: '20/02/2023' },
    { id: 3, nombre: 'Juan Pérez', email: 'juan@clinica.com', rol: 'cajero', estado: 'activo', fechaRegistro: '05/03/2023' },
    { id: 4, nombre: 'Pedro Gómez', email: 'pedro@clinica.com', rol: 'estudiante', estado: 'activo', fechaRegistro: '10/04/2023' },
    { id: 5, nombre: 'Ana Rodríguez', email: 'ana@clinica.com', rol: 'doctor', estado: 'inactivo', fechaRegistro: '25/05/2023' },
    { id: 6, nombre: 'Luis Torres', email: 'luis@clinica.com', rol: 'estudiante', estado: 'activo', fechaRegistro: '30/06/2023' },
    { id: 7, nombre: 'Carmen Vargas', email: 'carmen@clinica.com', rol: 'doctor', estado: 'activo', fechaRegistro: '15/07/2023' },
    { id: 8, nombre: 'Roberto Sánchez', email: 'roberto@clinica.com', rol: 'proveedor', estado: 'inactivo', fechaRegistro: '20/08/2023' },
  ]);

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesTab = activeTab === 'todos' || 
                      (activeTab === 'activos' && usuario.estado === 'activo') ||
                      (activeTab === 'inactivos' && usuario.estado === 'inactivo') ||
                      (activeTab === usuario.rol);
                      
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
                         
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === 'activo').length,
    doctores: usuarios.filter(u => u.rol === 'doctor').length,
    estudiantes: usuarios.filter(u => u.rol === 'estudiante').length
  };

  const handleUserClick = (usuario: Usuario) => {
    alert(`Detalles del usuario: ${usuario.nombre}\nEmail: ${usuario.email}\nRol: ${usuario.rol}\nEstado: ${usuario.estado}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewUser({
      nombre: '',
      email: '',
      rol: 'estudiante',
      password: '',
      confirmPassword: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUser = () => {
    if (newUser.nombre && newUser.email && newUser.password && newUser.password === newUser.confirmPassword) {
      const newId = Math.max(...usuarios.map(u => u.id)) + 1;
      const nuevoUsuario: Usuario = {
        id: newId,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        estado: 'activo',
        fechaRegistro: new Date().toLocaleDateString('es-ES')
      };
      setUsuarios([...usuarios, nuevoUsuario]);
      alert(`Usuario ${newUser.nombre} creado exitosamente`);
      handleCloseModal();
    } else {
      alert('Por favor complete todos los campos correctamente');
    }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="usuarios-container">
        <div className="page-header">
          <h1>Gestión de Usuarios</h1>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <span className="material-icons">person_add</span>
            Nuevo Usuario
          </button>
        </div>

        <div className="stats-grid">
          <Card title="Total Usuarios" value={stats.total} icon="people" color="#0ea5e9" />
          <Card title="Usuarios Activos" value={stats.activos} icon="check_circle" color="#16a34a" />
          <Card title="Doctores" value={stats.doctores} icon="medical_services" color="#0284c7" />
          <Card title="Estudiantes" value={stats.estudiantes} icon="school" color="#f59e0b" />
        </div>

        <div className="filter-container">
          <div className="tabs">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'activos', label: 'Activos' },
              { key: 'inactivos', label: 'Inactivos' },
              { key: 'doctor', label: 'Doctores' },
              { key: 'estudiante', label: 'Estudiantes' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="usuarios-grid">
          {filteredUsuarios.length > 0 ? (
            filteredUsuarios.map(usuario => (
              <div key={usuario.id} className="usuario-card" onClick={() => handleUserClick(usuario)}>
                <div className={`usuario-avatar ${usuario.estado}`}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="usuario-info">
                  <h3>{usuario.nombre}</h3>
                  <p className="usuario-email">{usuario.email}</p>
                  <div className="usuario-meta">
                    <span className={`rol-badge ${usuario.rol}`}>{usuario.rol}</span>
                    <span className={`status-badge ${usuario.estado}`}>{usuario.estado}</span>
                  </div>
                </div>
                <div className="usuario-actions">
                  <button className="icon-button" onClick={(e) => e.stopPropagation()} aria-label="Editar">
                    <span className="material-icons">edit</span>
                  </button>
                  <button className="icon-button danger" onClick={(e) => e.stopPropagation()} aria-label="Eliminar">
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <span className="material-icons">search_off</span>
              <p>No se encontraron usuarios con los filtros seleccionados</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Nuevo Usuario</h2>
                <button className="close-button" onClick={handleCloseModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre Completo*</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={newUser.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre y apellido"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    placeholder="usuario@clinica.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rol">Rol*</label>
                  <select id="rol" name="rol" value={newUser.rol} onChange={handleInputChange} required>
                    <option value="estudiante">Estudiante</option>
                    <option value="doctor">Doctor</option>
                    <option value="cajero">Cajero</option>
                    <option value="inventario">Inventario</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Contraseña*</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar Contraseña*</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={newUser.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={handleCloseModal}>Cancelar</button>
                <button className="submit-button" onClick={handleSaveUser}>Guardar Usuario</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;