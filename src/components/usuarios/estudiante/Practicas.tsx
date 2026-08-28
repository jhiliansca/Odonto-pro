import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import './Practicas.css';

interface Practica {
  id: number;
  nombre: string;
  paciente: string;
  fecha: string;
  supervisor: string;
  estado: 'pendiente' | 'completada' | 'evaluada';
  calificacion?: number;
  comentarios?: string;
}

const Practicas: React.FC = () => {
  const [userName] = useState('Pedro Gómez');
  const [activeTab, setActiveTab] = useState<'pendientes' | 'completadas' | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPractica, setSelectedPractica] = useState<Practica | null>(null);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [nuevaPractica, setNuevaPractica] = useState({
    nombre: '',
    paciente: '',
    fecha: '',
    supervisor: '',
    detalles: ''
  });

  // Datos simulados de prácticas
  const [practicas] = useState<Practica[]>([
    { 
      id: 1, 
      nombre: 'Limpieza dental', 
      paciente: 'Laura Martínez', 
      fecha: '15/06/2025', 
      supervisor: 'Dr. Carlos Mendoza',
      estado: 'evaluada',
      calificacion: 9,
      comentarios: 'Excelente trabajo, muy buena técnica de limpieza.'
    },
    { 
      id: 2, 
      nombre: 'Aplicación de selladores', 
      paciente: 'Roberto Sánchez', 
      fecha: '18/06/2025', 
      supervisor: 'Dra. Ana García',
      estado: 'completada'
    },
    { 
      id: 3, 
      nombre: 'Toma de impresiones', 
      paciente: 'María López', 
      fecha: '20/06/2025', 
      supervisor: 'Dr. Carlos Mendoza',
      estado: 'pendiente'
    },
    { 
      id: 4, 
      nombre: 'Radiografía panorámica', 
      paciente: 'Juan Pérez', 
      fecha: '22/06/2025', 
      supervisor: 'Dr. Luis Ramírez',
      estado: 'pendiente'
    },
    { 
      id: 5, 
      nombre: 'Extracción simple', 
      paciente: 'Carlos Rodríguez', 
      fecha: '25/06/2025', 
      supervisor: 'Dra. Sofía Torres',
      estado: 'evaluada',
      calificacion: 8,
      comentarios: 'Buen manejo del paciente, mejorar técnica de anestesia.'
    },
    { 
      id: 6, 
      nombre: 'Obturación con resina', 
      paciente: 'Ana Gómez', 
      fecha: '28/06/2025', 
      supervisor: 'Dr. Carlos Mendoza',
      estado: 'completada'
    },
  ]);

  // Filtrar prácticas según la pestaña activa y término de búsqueda
  const practicasFiltradas = practicas.filter(practica => {
    const matchesTab = 
      activeTab === 'todas' || 
      (activeTab === 'pendientes' && practica.estado === 'pendiente') ||
      (activeTab === 'completadas' && (practica.estado === 'completada' || practica.estado === 'evaluada'));
    
    const matchesSearch = 
      practica.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practica.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practica.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Función para mostrar detalles de una práctica
  const handleVerDetalles = (practica: Practica) => {
    setSelectedPractica(practica);
    setShowModal(true);
  };

  // Función para mostrar modal de registro de nueva práctica
  const handleShowRegistroModal = () => {
    setShowRegistroModal(true);
  };

  // Función para actualizar los datos de la nueva práctica
  const handleNuevaPracticaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevaPractica({
      ...nuevaPractica,
      [name]: value
    });
  };

  // Función para simular registro de nueva práctica
  const handleRegistrarPractica = () => {
    setShowRegistroModal(false);
    alert('Práctica registrada con éxito. Pendiente de aprobación por el supervisor.');
    // Aquí se podría agregar la nueva práctica al estado
  };

  // Función para simular completar una práctica
  const handleCompletarPractica = (id: number) => {
    alert(`Práctica #${id} marcada como completada. Pendiente de evaluación por el supervisor.`);
    // Aquí se podría actualizar el estado de la práctica
  };

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="practicas-container">
        <div className="page-header">
          <h1>Gestión de Prácticas Clínicas</h1>
          <button className="add-button" onClick={handleShowRegistroModal}>
            <span className="material-icons">add</span>
            Registrar Práctica
          </button>
        </div>

        <div className="filter-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'todas' ? 'active' : ''}`}
              onClick={() => setActiveTab('todas')}
            >
              Todas
            </button>
            <button 
              className={`tab ${activeTab === 'pendientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendientes')}
            >
              Pendientes
            </button>
            <button 
              className={`tab ${activeTab === 'completadas' ? 'active' : ''}`}
              onClick={() => setActiveTab('completadas')}
            >
              Completadas
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Buscar práctica..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="practicas-list">
          {practicasFiltradas.length === 0 ? (
            <div className="no-results">No se encontraron prácticas que coincidan con los criterios de búsqueda.</div>
          ) : (
            practicasFiltradas.map(practica => (
              <div key={practica.id} className={`practica-card ${practica.estado}`}>
                <div className="practica-header">
                  <h3>{practica.nombre}</h3>
                  <span className={`status-badge ${practica.estado}`}>
                    {practica.estado === 'pendiente' ? 'Pendiente' : 
                     practica.estado === 'completada' ? 'Completada' : 'Evaluada'}
                  </span>
                </div>
                <div className="practica-details">
                  <div className="detail-item">
                    <span className="material-icons">person</span>
                    <span>Paciente: {practica.paciente}</span>
                  </div>
                  <div className="detail-item">
                    <span className="material-icons">event</span>
                    <span>Fecha: {practica.fecha}</span>
                  </div>
                  <div className="detail-item">
                    <span className="material-icons">supervisor_account</span>
                    <span>Supervisor: {practica.supervisor}</span>
                  </div>
                  {practica.estado === 'evaluada' && (
                    <div className="detail-item">
                      <span className="material-icons">grade</span>
                      <span>Calificación: {practica.calificacion}/10</span>
                    </div>
                  )}
                </div>
                <div className="practica-actions">
                  <button className="quick-action-btn small" onClick={() => handleVerDetalles(practica)}>
                    <span className="material-icons">visibility</span>
                    <span>Ver Detalles</span>
                  </button>
                  {practica.estado === 'pendiente' && (
                    <button className="quick-action-btn small" onClick={() => handleCompletarPractica(practica.id)}>
                      <span className="material-icons">check_circle</span>
                      <span>Completar</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Detalles de Práctica */}
        {showModal && selectedPractica && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Detalles de la Práctica</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>{selectedPractica.nombre}</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Paciente:</span>
                      <span className="value">{selectedPractica.paciente}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Fecha:</span>
                      <span className="value">{selectedPractica.fecha}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Supervisor:</span>
                      <span className="value">{selectedPractica.supervisor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Estado:</span>
                      <span className={`value status ${selectedPractica.estado}`}>
                        {selectedPractica.estado === 'pendiente' ? 'Pendiente' : 
                         selectedPractica.estado === 'completada' ? 'Completada' : 'Evaluada'}
                      </span>
                    </div>
                    {selectedPractica.estado === 'evaluada' && (
                      <>
                        <div className="detail-item">
                          <span className="label">Calificación:</span>
                          <span className="value">{selectedPractica.calificacion}/10</span>
                        </div>
                        <div className="detail-item full-width">
                          <span className="label">Comentarios del Supervisor:</span>
                          <p className="value">{selectedPractica.comentarios}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {selectedPractica.estado === 'pendiente' && (
                  <div className="modal-actions">
                    <button className="submit-button" onClick={() => {
                      handleCompletarPractica(selectedPractica.id);
                      setShowModal(false);
                    }}>
                      <span className="material-icons">check_circle</span>
                      Marcar como Completada
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Registro de Nueva Práctica */}
        {showRegistroModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Registrar Nueva Práctica</h2>
                <button className="close-button" onClick={() => setShowRegistroModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <form className="form-grid">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre de la Práctica</label>
                    <input 
                      type="text" 
                      id="nombre" 
                      name="nombre" 
                      value={nuevaPractica.nombre}
                      onChange={handleNuevaPracticaChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="paciente">Paciente</label>
                    <input 
                      type="text" 
                      id="paciente" 
                      name="paciente" 
                      value={nuevaPractica.paciente}
                      onChange={handleNuevaPracticaChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fecha">Fecha</label>
                    <input 
                      type="date" 
                      id="fecha" 
                      name="fecha" 
                      value={nuevaPractica.fecha}
                      onChange={handleNuevaPracticaChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supervisor">Supervisor</label>
                    <select 
                      id="supervisor" 
                      name="supervisor" 
                      value={nuevaPractica.supervisor}
                      onChange={handleNuevaPracticaChange}
                      required
                    >
                      <option value="">Seleccionar supervisor</option>
                      <option value="Dr. Carlos Mendoza">Dr. Carlos Mendoza</option>
                      <option value="Dra. Ana García">Dra. Ana García</option>
                      <option value="Dr. Luis Ramírez">Dr. Luis Ramírez</option>
                      <option value="Dra. Sofía Torres">Dra. Sofía Torres</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="detalles">Detalles de la Práctica</label>
                    <textarea 
                      id="detalles" 
                      name="detalles" 
                      value={nuevaPractica.detalles}
                      onChange={handleNuevaPracticaChange}
                      rows={4}
                    ></textarea>
                  </div>
                </form>
                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => setShowRegistroModal(false)}>
                    Cancelar
                  </button>
                  <button className="submit-button" onClick={handleRegistrarPractica}>
                    Registrar Práctica
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Practicas;