import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import './Cursos.css';

const Cursos: React.FC = () => {
  const [cursos] = useState([
    { 
      id: 1, 
      nombre: 'Odontopediatría', 
      instructor: 'Dra. Ana García', 
      progreso: 65, 
      estado: 'en_curso',
      descripcion: 'Curso especializado en el tratamiento dental de niños y adolescentes.',
      fechaInicio: '2025-03-15',
      fechaFin: '2025-07-30',
      modulos: [
        { id: 1, nombre: 'Introducción a la Odontopediatría', completado: true },
        { id: 2, nombre: 'Desarrollo dental en niños', completado: true },
        { id: 3, nombre: 'Técnicas de manejo de conducta', completado: true },
        { id: 4, nombre: 'Prevención en Odontopediatría', completado: false },
        { id: 5, nombre: 'Tratamientos restauradores', completado: false },
      ]
    },
    { 
      id: 2, 
      nombre: 'Ortodoncia Básica', 
      instructor: 'Dr. Carlos Mendoza', 
      progreso: 80, 
      estado: 'en_curso',
      descripcion: 'Fundamentos de ortodoncia y técnicas básicas de alineación dental.',
      fechaInicio: '2025-02-10',
      fechaFin: '2025-06-30',
      modulos: [
        { id: 1, nombre: 'Principios de ortodoncia', completado: true },
        { id: 2, nombre: 'Diagnóstico ortodóntico', completado: true },
        { id: 3, nombre: 'Aparatología fija y removible', completado: true },
        { id: 4, nombre: 'Biomecánica ortodóntica', completado: true },
        { id: 5, nombre: 'Casos clínicos', completado: false },
      ]
    },
    { 
      id: 3, 
      nombre: 'Periodoncia', 
      instructor: 'Dr. Luis Ramírez', 
      progreso: 45, 
      estado: 'en_curso',
      descripcion: 'Estudio de las enfermedades que afectan a los tejidos que dan soporte a los dientes.',
      fechaInicio: '2025-04-05',
      fechaFin: '2025-08-15',
      modulos: [
        { id: 1, nombre: 'Anatomía del periodonto', completado: true },
        { id: 2, nombre: 'Enfermedades periodontales', completado: true },
        { id: 3, nombre: 'Diagnóstico periodontal', completado: false },
        { id: 4, nombre: 'Tratamiento no quirúrgico', completado: false },
        { id: 5, nombre: 'Cirugía periodontal', completado: false },
      ]
    },
    { 
      id: 4, 
      nombre: 'Endodoncia', 
      instructor: 'Dra. Sofía Torres', 
      progreso: 30, 
      estado: 'en_curso',
      descripcion: 'Tratamiento de conductos radiculares y patologías pulpares.',
      fechaInicio: '2025-05-10',
      fechaFin: '2025-09-20',
      modulos: [
        { id: 1, nombre: 'Anatomía pulpar y radicular', completado: true },
        { id: 2, nombre: 'Diagnóstico en endodoncia', completado: false },
        { id: 3, nombre: 'Instrumentación manual', completado: false },
        { id: 4, nombre: 'Instrumentación rotatoria', completado: false },
        { id: 5, nombre: 'Obturación de conductos', completado: false },
      ]
    },
    { 
      id: 5, 
      nombre: 'Prótesis Dental', 
      instructor: 'Dr. Javier Morales', 
      progreso: 0, 
      estado: 'pendiente',
      descripcion: 'Diseño y fabricación de prótesis para reemplazar piezas dentales perdidas.',
      fechaInicio: '2025-08-01',
      fechaFin: '2025-12-15',
      modulos: [
        { id: 1, nombre: 'Introducción a la prótesis dental', completado: false },
        { id: 2, nombre: 'Prótesis fija', completado: false },
        { id: 3, nombre: 'Prótesis removible', completado: false },
        { id: 4, nombre: 'Prótesis sobre implantes', completado: false },
        { id: 5, nombre: 'Casos clínicos', completado: false },
      ]
    },
  ]);

  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');

  // Filtrar cursos según la pestaña activa
  const filteredCursos = cursos.filter(curso => {
    if (activeTab === 'todos') return true;
    return curso.estado === activeTab;
  });

  // Función para mostrar detalles del curso
  const handleShowCursoDetails = (curso: any) => {
    setSelectedCurso(curso);
    setShowModal(true);
  };

  return (
    <DashboardLayout userType="estudiante" userName="Pedro Gómez">
      <div className="cursos-container">
        <div className="page-header">
          <h1>Mis Cursos</h1>
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
              className={`tab ${activeTab === 'en_curso' ? 'active' : ''}`}
              onClick={() => setActiveTab('en_curso')}
            >
              En Curso
            </button>
            <button 
              className={`tab ${activeTab === 'completado' ? 'active' : ''}`}
              onClick={() => setActiveTab('completado')}
            >
              Completados
            </button>
            <button 
              className={`tab ${activeTab === 'pendiente' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendiente')}
            >
              Pendientes
            </button>
          </div>
        </div>

        <div className="cursos-grid">
          {filteredCursos.map(curso => (
            <div key={curso.id} className={`curso-card ${curso.estado}`} onClick={() => handleShowCursoDetails(curso)}>
              <div className="curso-header">
                <h3>{curso.nombre}</h3>
                <div className="curso-instructor">{curso.instructor}</div>
              </div>
              <div className="curso-progress-container">
                <div className="curso-progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${curso.progreso}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">{curso.progreso}%</div>
              </div>
              <div className="curso-dates">
                <div className="curso-date">
                  <span className="material-icons">event</span>
                  <span>Inicio: {new Date(curso.fechaInicio).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="curso-date">
                  <span className="material-icons">event_available</span>
                  <span>Fin: {new Date(curso.fechaFin).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
              <div className="curso-status">
                <span className={`status-badge ${curso.estado}`}>
                  {curso.estado === 'en_curso' ? 'En Curso' : 
                   curso.estado === 'completado' ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de detalles del curso */}
        {showModal && selectedCurso && (
          <div className="modal-overlay">
            <div className="modal-content curso-detail-modal">
              <div className="modal-header">
                <h2>{selectedCurso.nombre}</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="curso-detail-section">
                  <h3>Información General</h3>
                  <div className="curso-info-grid">
                    <div className="info-item">
                      <span className="info-label">Instructor:</span>
                      <span className="info-value">{selectedCurso.instructor}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Progreso:</span>
                      <span className="info-value">{selectedCurso.progreso}%</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fecha de inicio:</span>
                      <span className="info-value">{new Date(selectedCurso.fechaInicio).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fecha de finalización:</span>
                      <span className="info-value">{new Date(selectedCurso.fechaFin).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Descripción:</span>
                      <span className="info-value">{selectedCurso.descripcion}</span>
                    </div>
                  </div>
                </div>

                <div className="curso-detail-section">
                  <h3>Módulos del Curso</h3>
                  <div className="modulos-list">
                    {selectedCurso.modulos.map((modulo: any) => (
                      <div key={modulo.id} className={`modulo-item ${modulo.completado ? 'completado' : ''}`}>
                        <div className="modulo-status">
                          <span className="material-icons">
                            {modulo.completado ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </div>
                        <div className="modulo-info">
                          <div className="modulo-nombre">{modulo.nombre}</div>
                          <div className="modulo-estado">
                            {modulo.completado ? 'Completado' : 'Pendiente'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="curso-detail-section">
                  <h3>Recursos del Curso</h3>
                  <div className="recursos-list">
                    <div className="recurso-item">
                      <span className="material-icons">description</span>
                      <span>Manual del curso.pdf</span>
                    </div>
                    <div className="recurso-item">
                      <span className="material-icons">video_library</span>
                      <span>Video introductorio.mp4</span>
                    </div>
                    <div className="recurso-item">
                      <span className="material-icons">slideshow</span>
                      <span>Presentación de la clase 1.pptx</span>
                    </div>
                    <div className="recurso-item">
                      <span className="material-icons">article</span>
                      <span>Artículo científico.pdf</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={() => setShowModal(false)}>
                  Cerrar
                </button>
                <button className="submit-button">
                  Ir al Aula Virtual
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cursos;