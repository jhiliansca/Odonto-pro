import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Doctores.css';

interface Doctor {
  id: number;
  nombre: string;
  especialidad: string;
  email: string;
  telefono: string;
  pacientes: number;
  estado: 'activo' | 'inactivo';
}

const Doctores: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState('Admin Principal');
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datos simulados de doctores
  const [doctores] = useState<Doctor[]>([
    { id: 1, nombre: 'Dr. Carlos Mendoza', especialidad: 'Ortodoncia', email: 'carlos@clinica.com', telefono: '555-1234', pacientes: 28, estado: 'activo' },
    { id: 2, nombre: 'Dra. Ana Rodríguez', especialidad: 'Endodoncia', email: 'ana@clinica.com', telefono: '555-2345', pacientes: 15, estado: 'inactivo' },
    { id: 3, nombre: 'Dr. Roberto Sánchez', especialidad: 'Periodoncia', email: 'roberto@clinica.com', telefono: '555-3456', pacientes: 22, estado: 'activo' },
    { id: 4, nombre: 'Dra. Carmen Vargas', especialidad: 'Ortodoncia', email: 'carmen@clinica.com', telefono: '555-4567', pacientes: 30, estado: 'activo' },
    { id: 5, nombre: 'Dr. Miguel Ángel Torres', especialidad: 'Cirugía Maxilofacial', email: 'miguel@clinica.com', telefono: '555-5678', pacientes: 18, estado: 'activo' },
    { id: 6, nombre: 'Dra. Laura Gutiérrez', especialidad: 'Odontopediatría', email: 'laura@clinica.com', telefono: '555-6789', pacientes: 25, estado: 'activo' },
  ]);

  // Filtrar doctores según la pestaña activa y término de búsqueda
  const filteredDoctores = doctores.filter(doctor => {
    const matchesTab = activeTab === 'todos' || 
                      (activeTab === 'activos' && doctor.estado === 'activo') ||
                      (activeTab === 'inactivos' && doctor.estado === 'inactivo') ||
                      (activeTab === doctor.especialidad);
                      
    const matchesSearch = doctor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.especialidad.toLowerCase().includes(searchTerm.toLowerCase());
                         
    return matchesTab && matchesSearch;
  });

  // Estadísticas de doctores
  const stats = {
    total: doctores.length,
    activos: doctores.filter(d => d.estado === 'activo').length,
    especialidades: new Set(doctores.map(d => d.especialidad)).size,
    pacientesTotal: doctores.reduce((sum, d) => sum + d.pacientes, 0)
  };

  // Función para manejar el clic en una card de doctor
  const handleDoctorClick = (doctor: Doctor) => {
    console.log('Doctor seleccionado:', doctor);
    // Aquí se podría abrir un modal o navegar a la página de detalle del doctor
    alert(`Detalles del doctor: ${doctor.nombre}\nEspecialidad: ${doctor.especialidad}\nEmail: ${doctor.email}\nTeléfono: ${doctor.telefono}\nPacientes: ${doctor.pacientes}`);
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="doctores-container">
        <div className="page-header">
          <h1>Gestión de Doctores</h1>
          <button className="add-button">
            <span className="material-icons">person_add</span>
            Nuevo Doctor
          </button>
        </div>

        <div className="stats-grid">
          <Card 
            title="Total Doctores" 
            value={stats.total} 
            icon="medical_services" 
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
          />
          <Card 
            title="Doctores Activos" 
            value={stats.activos} 
            icon="check_circle" 
            iconColor="#28a745"
            backgroundColor="#d4edda"
          />
          <Card 
            title="Especialidades" 
            value={stats.especialidades} 
            icon="category" 
            iconColor="#ffc107"
            backgroundColor="#fff3cd"
          />
          <Card 
            title="Total Pacientes" 
            value={stats.pacientesTotal} 
            icon="people" 
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
              className={`tab ${activeTab === 'Ortodoncia' ? 'active' : ''}`}
              onClick={() => setActiveTab('Ortodoncia')}
            >
              Ortodoncia
            </button>
            <button 
              className={`tab ${activeTab === 'Endodoncia' ? 'active' : ''}`}
              onClick={() => setActiveTab('Endodoncia')}
            >
              Endodoncia
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Buscar doctor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="doctores-grid">
          {filteredDoctores.length > 0 ? (
            filteredDoctores.map(doctor => (
              <div key={doctor.id} className="doctor-card" onClick={() => handleDoctorClick(doctor)}>
                <div className="doctor-avatar" style={{ backgroundColor: doctor.estado === 'activo' ? '#00BCD4' : '#9e9e9e' }}>
                  {doctor.nombre.split(' ')[1].charAt(0).toUpperCase()}
                </div>
                <div className="doctor-info">
                  <h3>{doctor.nombre}</h3>
                  <p className="doctor-especialidad">{doctor.especialidad}</p>
                  <p className="doctor-email">{doctor.email}</p>
                  <div className="doctor-meta">
                    <span className="doctor-pacientes">
                      <span className="material-icons">people</span>
                      {doctor.pacientes} pacientes
                    </span>
                    <span className={`doctor-estado ${doctor.estado}`}>{doctor.estado}</span>
                  </div>
                </div>
                <div className="doctor-actions">
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
              <p>No se encontraron doctores con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Doctores;