import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Estudiantes.css';

interface Estudiante {
  id: number;
  nombre: string;
  semestre: number;
  email: string;
  telefono: string;
  practicas: number;
  promedio: number;
  estado: 'activo' | 'inactivo';
}

const Estudiantes: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState('Admin Principal');
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datos simulados de estudiantes
  const [estudiantes] = useState<Estudiante[]>([
    { id: 1, nombre: 'Pedro Gómez', semestre: 8, email: 'pedro@unifranz.edu', telefono: '555-1111', practicas: 15, promedio: 85, estado: 'activo' },
    { id: 2, nombre: 'Luis Torres', semestre: 6, email: 'luis@unifranz.edu', telefono: '555-2222', practicas: 10, promedio: 78, estado: 'activo' },
    { id: 3, nombre: 'María Fernández', semestre: 9, email: 'maria@unifranz.edu', telefono: '555-3333', practicas: 20, promedio: 92, estado: 'activo' },
    { id: 4, nombre: 'Sofía Ramírez', semestre: 7, email: 'sofia@unifranz.edu', telefono: '555-4444', practicas: 12, promedio: 81, estado: 'inactivo' },
    { id: 5, nombre: 'Jorge Martínez', semestre: 5, email: 'jorge@unifranz.edu', telefono: '555-5555', practicas: 8, promedio: 75, estado: 'activo' },
    { id: 6, nombre: 'Valentina López', semestre: 8, email: 'valentina@unifranz.edu', telefono: '555-6666', practicas: 18, promedio: 88, estado: 'activo' },
    { id: 7, nombre: 'Daniel Herrera', semestre: 7, email: 'daniel@unifranz.edu', telefono: '555-7777', practicas: 14, promedio: 83, estado: 'activo' },
    { id: 8, nombre: 'Camila Díaz', semestre: 9, email: 'camila@unifranz.edu', telefono: '555-8888', practicas: 22, promedio: 95, estado: 'inactivo' },
  ]);

  // Filtrar estudiantes según la pestaña activa y término de búsqueda
  const filteredEstudiantes = estudiantes.filter(estudiante => {
    const matchesTab = activeTab === 'todos' || 
                      (activeTab === 'activos' && estudiante.estado === 'activo') ||
                      (activeTab === 'inactivos' && estudiante.estado === 'inactivo') ||
                      (activeTab === estudiante.semestre.toString());
                      
    const matchesSearch = estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estudiante.email.toLowerCase().includes(searchTerm.toLowerCase());
                         
    return matchesTab && matchesSearch;
  });

  // Estadísticas de estudiantes
  const stats = {
    total: estudiantes.length,
    activos: estudiantes.filter(e => e.estado === 'activo').length,
    practicasTotal: estudiantes.reduce((sum, e) => sum + e.practicas, 0),
    promedioGeneral: Math.round(estudiantes.reduce((sum, e) => sum + e.promedio, 0) / estudiantes.length)
  };

  // Función para manejar el clic en una card de estudiante
  const handleEstudianteClick = (estudiante: Estudiante) => {
    console.log('Estudiante seleccionado:', estudiante);
    // Aquí se podría abrir un modal o navegar a la página de detalle del estudiante
    alert(`Detalles del estudiante: ${estudiante.nombre}\nSemestre: ${estudiante.semestre}\nEmail: ${estudiante.email}\nTeléfono: ${estudiante.telefono}\nPrácticas: ${estudiante.practicas}\nPromedio: ${estudiante.promedio}`);
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="estudiantes-container">
        <div className="page-header">
          <h1>Gestión de Estudiantes</h1>
          <button className="add-button">
            <span className="material-icons">person_add</span>
            Nuevo Estudiante
          </button>
        </div>

        <div className="stats-grid">
          <Card 
            title="Total Estudiantes" 
            value={stats.total} 
            icon="school" 
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
          />
          <Card 
            title="Estudiantes Activos" 
            value={stats.activos} 
            icon="check_circle" 
            iconColor="#28a745"
            backgroundColor="#d4edda"
          />
          <Card 
            title="Total Prácticas" 
            value={stats.practicasTotal} 
            icon="science" 
            iconColor="#ffc107"
            backgroundColor="#fff3cd"
          />
          <Card 
            title="Promedio General" 
            value={stats.promedioGeneral} 
            icon="grade" 
            iconColor="#dc3545"
            backgroundColor="#fde0e3"
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
              className={`tab ${activeTab === '5' ? 'active' : ''}`}
              onClick={() => setActiveTab('5')}
            >
              Semestre 5
            </button>
            <button 
              className={`tab ${activeTab === '6' ? 'active' : ''}`}
              onClick={() => setActiveTab('6')}
            >
              Semestre 6
            </button>
            <button 
              className={`tab ${activeTab === '7' ? 'active' : ''}`}
              onClick={() => setActiveTab('7')}
            >
              Semestre 7
            </button>
            <button 
              className={`tab ${activeTab === '8' ? 'active' : ''}`}
              onClick={() => setActiveTab('8')}
            >
              Semestre 8
            </button>
            <button 
              className={`tab ${activeTab === '9' ? 'active' : ''}`}
              onClick={() => setActiveTab('9')}
            >
              Semestre 9
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Buscar estudiante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="estudiantes-grid">
          {filteredEstudiantes.length > 0 ? (
            filteredEstudiantes.map(estudiante => (
              <div key={estudiante.id} className="estudiante-card" onClick={() => handleEstudianteClick(estudiante)}>
                <div className="estudiante-avatar" style={{ backgroundColor: estudiante.estado === 'activo' ? '#00BCD4' : '#9e9e9e' }}>
                  {estudiante.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="estudiante-info">
                  <h3>{estudiante.nombre}</h3>
                  <p className="estudiante-semestre">Semestre {estudiante.semestre}</p>
                  <p className="estudiante-email">{estudiante.email}</p>
                  <div className="estudiante-meta">
                    <span className="estudiante-practicas">
                      <span className="material-icons">science</span>
                      {estudiante.practicas} prácticas
                    </span>
                    <span className="estudiante-promedio" style={{
                      backgroundColor: estudiante.promedio >= 90 ? '#d4edda' : 
                                      estudiante.promedio >= 80 ? '#fff3cd' : 
                                      estudiante.promedio >= 70 ? '#fde0e3' : '#f8d7da',
                      color: estudiante.promedio >= 90 ? '#28a745' : 
                             estudiante.promedio >= 80 ? '#ffc107' : 
                             estudiante.promedio >= 70 ? '#dc3545' : '#dc3545'
                    }}>
                      <span className="material-icons">grade</span>
                      {estudiante.promedio}
                    </span>
                    <span className={`estudiante-estado ${estudiante.estado}`}>{estudiante.estado}</span>
                  </div>
                </div>
                <div className="estudiante-actions">
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
              <p>No se encontraron estudiantes con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Estudiantes;