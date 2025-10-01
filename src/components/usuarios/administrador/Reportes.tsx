import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Reportes.css';

interface Reporte {
  id: number;
  titulo: string;
  tipo: 'financiero' | 'operativo' | 'inventario' | 'estudiantes' | 'personal';
  fecha: string;
  generadoPor: string;
  descargas: number;
  usuarioAsignado?: string;
}

const Reportes: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState('Admin Principal');
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reporteForm, setReporteForm] = useState({
    titulo: '',
    tipo: 'financiero',
    usuarioAsignado: '',
    personalizado: false
  });
  
  // Datos simulados de reportes
  const [reportes, setReportes] = useState<Reporte[]>([
    { id: 1, titulo: 'Ingresos mensuales - Agosto 2023', tipo: 'financiero', fecha: '01/09/2023', generadoPor: 'Juan Pérez', descargas: 12 },
    { id: 2, titulo: 'Inventario de materiales dentales', tipo: 'inventario', fecha: '15/08/2023', generadoPor: 'María López', descargas: 8 },
    { id: 3, titulo: 'Rendimiento de estudiantes - Semestre 1-2023', tipo: 'estudiantes', fecha: '30/07/2023', generadoPor: 'Admin Principal', descargas: 15 },
    { id: 4, titulo: 'Procedimientos realizados - Julio 2023', tipo: 'operativo', fecha: '05/08/2023', generadoPor: 'Dr. Carlos Mendoza', descargas: 10 },
    { id: 5, titulo: 'Productos bajo stock', tipo: 'inventario', fecha: '10/08/2023', generadoPor: 'María López', descargas: 7 },
    { id: 6, titulo: 'Ingresos por tipo de servicio - Julio 2023', tipo: 'financiero', fecha: '03/08/2023', generadoPor: 'Juan Pérez', descargas: 9 },
    { id: 7, titulo: 'Asistencia de estudiantes - Julio 2023', tipo: 'estudiantes', fecha: '02/08/2023', generadoPor: 'Admin Principal', descargas: 6 },
    { id: 8, titulo: 'Eficiencia operativa - Q2 2023', tipo: 'operativo', fecha: '20/07/2023', generadoPor: 'Dr. Carlos Mendoza', descargas: 11 },
    { id: 9, titulo: 'Reporte personal - Dr. Carlos Mendoza', tipo: 'personal', fecha: '25/08/2023', generadoPor: 'Admin Principal', descargas: 3, usuarioAsignado: 'Dr. Carlos Mendoza' },
    { id: 10, titulo: 'Reporte personal - María López', tipo: 'personal', fecha: '27/08/2023', generadoPor: 'Admin Principal', descargas: 2, usuarioAsignado: 'María López' },
  ]);

  // Lista de usuarios para asignar reportes personales
  const usuarios = [
    'Dr. Carlos Mendoza',
    'María López',
    'Juan Pérez',
    'Pedro Gómez',
    'Ana Rodríguez',
    'Luis Torres',
    'Carmen Vargas',
    'Roberto Sánchez'
  ];

  // Filtrar reportes según la pestaña activa y término de búsqueda
  const filteredReportes = reportes.filter(reporte => {
    const matchesTab = activeTab === 'todos' || activeTab === reporte.tipo;
                      
    const matchesSearch = reporte.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reporte.generadoPor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (reporte.usuarioAsignado && reporte.usuarioAsignado.toLowerCase().includes(searchTerm.toLowerCase()));
                         
    return matchesTab && matchesSearch;
  });

  // Estadísticas de reportes
  const stats = {
    total: reportes.length,
    financieros: reportes.filter(r => r.tipo === 'financiero').length,
    inventario: reportes.filter(r => r.tipo === 'inventario').length,
    personales: reportes.filter(r => r.tipo === 'personal').length,
    descargasTotal: reportes.reduce((sum, r) => sum + r.descargas, 0)
  };

  // Función para manejar el clic en una card de reporte
  const handleReporteClick = (reporte: Reporte) => {
    console.log('Reporte seleccionado:', reporte);
    // Aquí se podría abrir un modal o navegar a la página de detalle del reporte
    alert(`Detalles del reporte: ${reporte.titulo}\nTipo: ${reporte.tipo}\nFecha: ${reporte.fecha}\nGenerado por: ${reporte.generadoPor}\nDescargas: ${reporte.descargas}${reporte.usuarioAsignado ? '\nAsignado a: ' + reporte.usuarioAsignado : ''}`);
  };

  // Función para abrir el modal de generación de reporte
  const handleGenerarReporte = () => {
    setShowModal(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setReporteForm({
      titulo: '',
      tipo: 'financiero',
      usuarioAsignado: '',
      personalizado: false
    });
  };

  // Función para manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setReporteForm(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Función para guardar el nuevo reporte
  const handleSaveReporte = () => {
    if (reporteForm.titulo) {
      const newId = Math.max(...reportes.map(r => r.id)) + 1;
      const newReporte: Reporte = {
        id: newId,
        titulo: reporteForm.titulo,
        tipo: reporteForm.personalizado ? 'personal' : reporteForm.tipo as any,
        fecha: new Date().toLocaleDateString('es-ES'),
        generadoPor: userName,
        descargas: 0
      };

      if (reporteForm.personalizado && reporteForm.usuarioAsignado) {
        newReporte.usuarioAsignado = reporteForm.usuarioAsignado;
      }
      
      setReportes([...reportes, newReporte]);
      alert(`Reporte "${reporteForm.titulo}" generado exitosamente`);
      handleCloseModal();
    } else {
      alert('Por favor ingrese un título para el reporte');
    }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="reportes-container">
        <div className="page-header">
          <h1>Gestión de Reportes</h1>
          <button className="add-button" onClick={handleGenerarReporte}>
            <span className="material-icons">add_chart</span>
            Generar Reporte
          </button>
        </div>

        <div className="stats-grid">
          <Card 
            title="Total Reportes" 
            value={stats.total} 
            icon="assessment" 
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
          />
          <Card 
            title="Reportes Financieros" 
            value={stats.financieros} 
            icon="attach_money" 
            iconColor="#28a745"
            backgroundColor="#d4edda"
          />
          <Card 
            title="Reportes Personales" 
            value={stats.personales} 
            icon="person" 
            iconColor="#6f42c1"
            backgroundColor="#e6d9f2"
          />
          <Card 
            title="Total Descargas" 
            value={stats.descargasTotal} 
            icon="cloud_download" 
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
              className={`tab ${activeTab === 'financiero' ? 'active' : ''}`}
              onClick={() => setActiveTab('financiero')}
            >
              Financieros
            </button>
            <button 
              className={`tab ${activeTab === 'operativo' ? 'active' : ''}`}
              onClick={() => setActiveTab('operativo')}
            >
              Operativos
            </button>
            <button 
              className={`tab ${activeTab === 'inventario' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventario')}
            >
              Inventario
            </button>
            <button 
              className={`tab ${activeTab === 'estudiantes' ? 'active' : ''}`}
              onClick={() => setActiveTab('estudiantes')}
            >
              Estudiantes
            </button>
            <button 
              className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personales
            </button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Buscar reporte..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="reportes-grid">
          {filteredReportes.length > 0 ? (
            filteredReportes.map(reporte => (
              <div key={reporte.id} className="reporte-card" onClick={() => handleReporteClick(reporte)}>
                <div className={`reporte-icon ${reporte.tipo}`}>
                  <span className="material-icons">
                    {reporte.tipo === 'financiero' ? 'attach_money' :
                     reporte.tipo === 'operativo' ? 'trending_up' :
                     reporte.tipo === 'inventario' ? 'inventory' :
                     reporte.tipo === 'personal' ? 'person' : 'school'}
                  </span>
                </div>
                <div className="reporte-info">
                  <h3>{reporte.titulo}</h3>
                  <div className="reporte-meta">
                    <span className="reporte-fecha">
                      <span className="material-icons">event</span>
                      {reporte.fecha}
                    </span>
                    <span className="reporte-autor">
                      <span className="material-icons">person</span>
                      {reporte.generadoPor}
                    </span>
                  </div>
                  <div className="reporte-tipo-container">
                    <span className={`reporte-tipo ${reporte.tipo}`}>{reporte.tipo}</span>
                    {reporte.usuarioAsignado && (
                      <span className="reporte-asignado">
                        <span className="material-icons">assignment_ind</span>
                        {reporte.usuarioAsignado}
                      </span>
                    )}
                    <span className="reporte-descargas">
                      <span className="material-icons">cloud_download</span>
                      {reporte.descargas}
                    </span>
                  </div>
                </div>
                <div className="reporte-actions">
                  <button className="action-icon" title="Descargar">
                    <span className="material-icons">download</span>
                  </button>
                  <button className="action-icon" title="Eliminar">
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <span className="material-icons">search_off</span>
              <p>No se encontraron reportes con los filtros seleccionados</p>
            </div>
          )}
        </div>

        {/* Modal para generar reporte */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Generar Nuevo Reporte</h2>
                <button className="close-button" onClick={handleCloseModal}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Título del Reporte</label>
                  <input 
                    type="text" 
                    name="titulo" 
                    value={reporteForm.titulo} 
                    onChange={handleInputChange} 
                    placeholder="Título descriptivo del reporte"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Reporte</label>
                  <select 
                    name="tipo" 
                    value={reporteForm.tipo} 
                    onChange={handleInputChange}
                    disabled={reporteForm.personalizado}
                  >
                    <option value="financiero">Financiero</option>
                    <option value="operativo">Operativo</option>
                    <option value="inventario">Inventario</option>
                    <option value="estudiantes">Estudiantes</option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="personalizado" 
                    name="personalizado" 
                    checked={reporteForm.personalizado} 
                    onChange={handleInputChange}
                  />
                  <label htmlFor="personalizado">Reporte Personal (asignado a un usuario específico)</label>
                </div>
                {reporteForm.personalizado && (
                  <div className="form-group">
                    <label>Usuario Asignado</label>
                    <select 
                      name="usuarioAsignado" 
                      value={reporteForm.usuarioAsignado} 
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione un usuario</option>
                      {usuarios.map((usuario, index) => (
                        <option key={index} value={usuario}>{usuario}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={handleCloseModal}>Cancelar</button>
                <button className="save-button" onClick={handleSaveReporte}>Generar Reporte</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reportes;