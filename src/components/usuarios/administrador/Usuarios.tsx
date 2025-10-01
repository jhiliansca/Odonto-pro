import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [userName, setUserName] = useState('Admin Principal');
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

  // Datos simulados de usuarios
  const [usuarios] = useState<Usuario[]>([
    { id: 1, nombre: 'Carlos Mendoza', email: 'carlos@clinica.com', rol: 'doctor', estado: 'activo', fechaRegistro: '15/01/2023' },
    { id: 2, nombre: 'María López', email: 'maria@clinica.com', rol: 'inventario', estado: 'activo', fechaRegistro: '20/02/2023' },
    { id: 3, nombre: 'Juan Pérez', email: 'juan@clinica.com', rol: 'cajero', estado: 'activo', fechaRegistro: '05/03/2023' },
    { id: 4, nombre: 'Pedro Gómez', email: 'pedro@clinica.com', rol: 'estudiante', estado: 'activo', fechaRegistro: '10/04/2023' },
    { id: 5, nombre: 'Ana Rodríguez', email: 'ana@clinica.com', rol: 'doctor', estado: 'inactivo', fechaRegistro: '25/05/2023' },
    { id: 6, nombre: 'Luis Torres', email: 'luis@clinica.com', rol: 'estudiante', estado: 'activo', fechaRegistro: '30/06/2023' },
    { id: 7, nombre: 'Carmen Vargas', email: 'carmen@clinica.com', rol: 'doctor', estado: 'activo', fechaRegistro: '15/07/2023' },
    { id: 8, nombre: 'Roberto Sánchez', email: 'roberto@clinica.com', rol: 'proveedor', estado: 'inactivo', fechaRegistro: '20/08/2023' },
  ]);

  // Filtrar usuarios según la pestaña activa y término de búsqueda
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesTab = activeTab === 'todos' || 
                      (activeTab === 'activos' && usuario.estado === 'activo') ||
                      (activeTab === 'inactivos' && usuario.estado === 'inactivo') ||
                      (activeTab === usuario.rol);
                      
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
                         
    return matchesTab && matchesSearch;
  });

  // Estadísticas de usuarios
  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === 'activo').length,
    doctores: usuarios.filter(u => u.rol === 'doctor').length,
    estudiantes: usuarios.filter(u => u.rol === 'estudiante').length
  };

  // Función para manejar el clic en una card de usuario
  const handleUserClick = (usuario: Usuario) => {
    console.log('Usuario seleccionado:', usuario);
    // Aquí se podría abrir un modal o navegar a la página de detalle del usuario
    alert(`Detalles del usuario: ${usuario.nombre}\nEmail: ${usuario.email}\nRol: ${usuario.rol}\nEstado: ${usuario.estado}`);
  };

  // Función para manejar el clic en el botón de nuevo usuario
  const handleAddUser = () => {
    setShowModal(true);
  };

  // Función para cerrar el modal
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

  // Función para manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para guardar el nuevo usuario
  const handleSaveUser = () => {
    // Aquí iría la lógica para guardar el usuario en la base de datos
    // Por ahora, solo simulamos añadirlo a la lista local
    if (newUser.nombre && newUser.email && newUser.password && newUser.password === newUser.confirmPassword) {
      const newId = Math.max(...usuarios.map(u => u.id)) + 1;
      const newUsuario: Usuario = {
        id: newId,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        estado: 'activo',
        fechaRegistro: new Date().toLocaleDateString('es-ES')
      };
      
      // En un caso real, aquí se enviaría una petición al servidor
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
          <button className="add-button" onClick={handleAddUser}>
            <span className="material-icons">person_add</span>
            Nuevo Usuario
          </button>
        </div>

        <div className="stats-grid">
          <Card 
            title="Total Usuarios" 
            value={stats.total} 
            icon="people" 
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
          />
          <Card 
            title="Usuarios Activos" 
            value={stats.activos} 
            icon="check_circle" 
            iconColor="#28a745"
            backgroundColor="#d4edda"
          />
          <Card 
            title="Doctores" 
            value={stats.doctores} 
            icon="medical_services" 
            iconColor="#dc3545"
            backgroundColor="#fde0e3"
          />
          <Card 
            title="Estudiantes" 
            value={stats.estudiantes} 
            icon="school" 
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
              className={`tab ${activeTab === 'activos' ? 'active' : ''}`}
              onClick={() => setActiveTab('activos')}
            >
              Activos
            </button>
            <button 
              className={`tab ${activeTab === 'inactivos' ? 'active' : ''}`}
              onClick={() => setActiveTab('inactivos')}
            >
              Inactivos
            </button>
            <button 
              className={`tab ${activeTab === 'doctor' ? 'active' : ''}`}
              onClick={() => setActiveTab('doctor')}
            >
              Doctores
            </button>
            <button 
              className={`tab ${activeTab === 'estudiante' ? 'active' : ''}`}
              onClick={() => setActiveTab('estudiante')}
            >
              Estudiantes
            </button>
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
                <div className="usuario-avatar" style={{ backgroundColor: usuario.estado === 'activo' ? '#00BCD4' : '#9e9e9e' }}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="usuario-info">
                  <h3>{usuario.nombre}</h3>
                  <p className="usuario-email">{usuario.email}</p>
                  <div className="usuario-meta">
                    <span className={`usuario-rol ${usuario.rol}`}>{usuario.rol}</span>
                    <span className={`usuario-estado ${usuario.estado}`}>{usuario.estado}</span>
                  </div>
                </div>
                <div className="usuario-actions">
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
              <span className="material-icons">search_off</span>
              <p>No se encontraron usuarios con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;