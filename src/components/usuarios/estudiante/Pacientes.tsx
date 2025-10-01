import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import './Pacientes.css';

const Pacientes: React.FC = () => {
  const [pacientes] = useState([
    { id: 1, nombre: 'Laura Martínez', edad: 35, tratamiento: 'Limpieza dental', fecha: '15/06/2025', estado: 'activo' },
    { id: 2, nombre: 'Roberto Sánchez', edad: 42, tratamiento: 'Aplicación de selladores', fecha: '18/06/2025', estado: 'activo' },
    { id: 3, nombre: 'María López', edad: 28, tratamiento: 'Toma de impresiones', fecha: '20/06/2025', estado: 'completado' },
    { id: 4, nombre: 'Juan Pérez', edad: 50, tratamiento: 'Radiografía panorámica', fecha: '22/06/2025', estado: 'pendiente' },
    { id: 5, nombre: 'Ana Torres', edad: 31, tratamiento: 'Extracción dental', fecha: '25/06/2025', estado: 'activo' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  // Filtrar pacientes según la pestaña activa y el término de búsqueda
  const filteredPacientes = pacientes.filter(paciente => {
    const matchesSearch = paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          paciente.tratamiento.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'todos') return matchesSearch;
    return matchesSearch && paciente.estado === activeTab;
  });

  return (
    <DashboardLayout userType="estudiante" userName="Pedro Gómez">
      <div className="pacientes-container">
        <div className="page-header">
          <h1>Mis Pacientes Asignados</h1>
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
              className={`tab ${activeTab === 'activo' ? 'active' : ''}`}
              onClick={() => setActiveTab('activo')}
            >
              Activos
            </button>
            <button 
              className={`tab ${activeTab === 'pendiente' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendiente')}
            >
              Pendientes
            </button>
            <button 
              className={`tab ${activeTab === 'completado' ? 'active' : ''}`}
              onClick={() => setActiveTab('completado')}
            >
              Completados
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="pacientes-list">
          {filteredPacientes.map(paciente => (
            <div key={paciente.id} className={`paciente-card ${paciente.estado}`}>
              <div className="paciente-avatar">
                {paciente.nombre.charAt(0)}
              </div>
              <div className="paciente-info">
                <h3>{paciente.nombre}</h3>
                <div className="paciente-edad">Edad: {paciente.edad} años</div>
                <div className="paciente-tratamiento">Tratamiento: {paciente.tratamiento}</div>
                <div className="paciente-fecha">Fecha: {paciente.fecha}</div>
              </div>
              <div className="paciente-status">
                <span className={`status-badge ${paciente.estado}`}>
                  {paciente.estado === 'activo' ? 'Activo' : 
                   paciente.estado === 'pendiente' ? 'Pendiente' : 'Completado'}
                </span>
              </div>
              <div className="paciente-actions">
                <button className="action-button small">
                  <span className="material-icons">visibility</span>
                  <span>Ver</span>
                </button>
                <button className="action-button small">
                  <span className="material-icons">edit</span>
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Pacientes;