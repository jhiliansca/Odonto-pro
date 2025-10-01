import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Dashboard.css';

const EstudianteDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [stats] = useState({
    assignedPatients: 5,
    pendingPractices: 8,
    completedPractices: 12,
    upcomingExams: 2,
    assignedSupplies: 15,
    pendingSupplies: 3
  });

  const [pendingPractices] = useState([
    { id: 1, name: 'Limpieza dental', patient: 'Laura Martínez', date: '15/06/2023', supervisor: 'Dr. Carlos Mendoza' },
    { id: 2, name: 'Aplicación de selladores', patient: 'Roberto Sánchez', date: '18/06/2023', supervisor: 'Dra. Ana García' },
    { id: 3, name: 'Toma de impresiones', patient: 'María López', date: '20/06/2023', supervisor: 'Dr. Carlos Mendoza' },
    { id: 4, name: 'Radiografía panorámica', patient: 'Juan Pérez', date: '22/06/2023', supervisor: 'Dr. Luis Ramírez' },
  ]);

  const [currentCourses] = useState([
    { id: 1, name: 'Odontopediatría', progress: 65, instructor: 'Dra. Ana García' },
    { id: 2, name: 'Ortodoncia Básica', progress: 80, instructor: 'Dr. Carlos Mendoza' },
    { id: 3, name: 'Periodoncia', progress: 45, instructor: 'Dr. Luis Ramírez' },
    { id: 4, name: 'Endodoncia', progress: 30, instructor: 'Dra. Sofía Torres' },
  ]);

  // Datos simulados de insumos asignados basados en la tabla de ejemplo
  const [assignedSupplies] = useState([
    { 
      id: 1, 
      subject: 'CIRUGÍA BUCAL', 
      procedure: 'EXODONCIA SIMPLE', 
      materials: [
        { id: 1, name: 'Tubo de anestesia', quantity: 1, assigned: true },
        { id: 2, name: 'Aguja para carpule (Mediana o larga)', quantity: 1, assigned: true },
        { id: 3, name: 'Clorhexidina', quantity: '1ml', assigned: true },
        { id: 4, name: 'Lidocaína', quantity: '1 Frasco', assigned: true },
        { id: 5, name: 'Povidona yodada', quantity: '1ml', assigned: true },
        { id: 6, name: 'Placa radiográfica', quantity: 1, assigned: true }
      ],
      semester: 6,
      status: 'Asignado'
    },
    { 
      id: 2, 
      subject: 'OPERATORIA', 
      procedure: 'RESINA SIMPLE', 
      materials: [
        { id: 1, name: 'Porción de ionómero de base (1 medida de polvo y 2 gotas de líquido)', quantity: 1, assigned: true },
        { id: 2, name: 'Porción de ácido grabador', quantity: 1, assigned: true },
        { id: 3, name: 'Gotas de adhesivo', quantity: 2, assigned: true },
        { id: 4, name: 'Resina', quantity: '1 porción', assigned: true }
      ],
      semester: 6,
      status: 'Asignado'
    },
    { 
      id: 3, 
      subject: 'OPERATORIA', 
      procedure: 'RESINA COMPUESTA', 
      materials: [
        { id: 1, name: 'Porción de ionómero de base (1 medida de polvo y 2 gotas de líquido)', quantity: 1, assigned: true },
        { id: 2, name: 'Porción de ácido grabador', quantity: 1, assigned: true },
        { id: 3, name: 'Gotas de adhesivo', quantity: 2, assigned: true },
        { id: 4, name: 'Resina', quantity: '1 porción', assigned: true }
      ],
      semester: 6,
      status: 'Asignado'
    }
  ]);

  // Datos simulados de insumos pendientes por asignar
  const [pendingSupplies] = useState([
    { 
      id: 4, 
      subject: 'OPERATORIA', 
      procedure: 'INCRUSTACIÓN', 
      materials: [
        { id: 1, name: 'Porción de ionómero de base (1 medida de polvo y 2 gotas de líquido)', quantity: 1, assigned: false },
        { id: 2, name: 'Medida de alginato', quantity: 1, assigned: false },
        { id: 3, name: 'Medida de yeso piedra', quantity: 1, assigned: false },
        { id: 4, name: 'Lámina de cera', quantity: 1, assigned: false },
        { id: 5, name: 'Porción de ionómero de cementación (1 medida de polvo y 2 gotas de líquido)', quantity: 1, assigned: false }
      ],
      semester: 6,
      status: 'Pendiente',
      paymentRequired: true
    },
    { 
      id: 5, 
      subject: 'ENDODONCIA', 
      procedure: 'ENDODONCIA', 
      materials: [
        { id: 1, name: 'Limas de primera serie', quantity: 6, assigned: false },
        { id: 2, name: 'Conos de gutapercha de 1ra serie', quantity: 20, assigned: false },
        { id: 3, name: 'Conos de gutapercha de 2da serie', quantity: 2, assigned: false },
        { id: 4, name: 'Conos de papel', quantity: 3, assigned: false },
        { id: 5, name: 'Hipoclorito de sodio', quantity: '10ml', assigned: false },
        { id: 6, name: 'Porción de cemento óxido de zinc - eugenol (1 medida de polvo y 2 gotas de líquido)', quantity: 1, assigned: false }
      ],
      semester: 6,
      status: 'Pendiente',
      paymentRequired: true
    }
  ]);

  // Estado para controlar los modales
  const [showSupplyDetailModal, setShowSupplyDetailModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProofImage, setPaymentProofImage] = useState('');
  const [showAddSupplyModal, setShowAddSupplyModal] = useState(false);
  const [newSupply, setNewSupply] = useState({
    subject: '',
    procedure: '',
    materials: [{ name: '', quantity: '' }],
    semester: 6
  });

  // Función para mostrar detalles de insumos
  const handleShowSupplyDetail = (supply: any) => {
    setSelectedSupply(supply);
    setShowSupplyDetailModal(true);
  };

  // Función para mostrar modal de pago
  const handleShowPaymentModal = () => {
    setShowPaymentModal(true);
  };

  // Función para simular subida de comprobante de pago
  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setPaymentProofImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Función para simular envío de comprobante de pago
  const handleSubmitPayment = () => {
    setShowPaymentModal(false);
    alert('Comprobante de pago enviado con éxito. Se revisará y se asignarán tus insumos pronto.');
  };

  // Función para agregar un nuevo material al formulario
  const handleAddMaterial = () => {
    setNewSupply({
      ...newSupply,
      materials: [...newSupply.materials, { name: '', quantity: '' }]
    });
  };

  // Función para actualizar los datos del nuevo insumo
  const handleNewSupplyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSupply({
      ...newSupply,
      [name]: value
    });
  };

  // Función para actualizar los datos de los materiales
  const handleMaterialChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedMaterials = [...newSupply.materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [name]: value
    };
    setNewSupply({
      ...newSupply,
      materials: updatedMaterials
    });
  };

  // Función para simular agregar un nuevo insumo
  const handleSubmitNewSupply = () => {
    setShowAddSupplyModal(false);
    alert('Solicitud de insumos enviada con éxito.');
  };

  return (
    <DashboardLayout userType="estudiante" userName="Pedro Gómez">
      <div className="estudiante-dashboard">
        <div className="dashboard-header">
          <h1>Panel de Estudiante</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="stats-grid">
          <Card 
            title="Pacientes Asignados" 
            value={stats.assignedPatients} 
            icon="group"
            iconColor="#007bff"
            backgroundColor="#e3f2fd"
            onClick={() => navigate('/estudiante/pacientes')}
          />
          <Card 
            title="Prácticas Pendientes" 
            value={stats.pendingPractices} 
            icon="pending_actions"
            iconColor="#dc3545"
            backgroundColor="#fde0e3"
            onClick={() => navigate('/estudiante/practicas')}
          />
          <Card 
            title="Insumos Asignados" 
            value={stats.assignedSupplies} 
            icon="inventory_2"
            iconColor="#28a745"
            backgroundColor="#d4edda"
            onClick={() => navigate('/estudiante/dashboard?section=assigned-supplies')}
          />
          <Card 
            title="Insumos Pendientes" 
            value={stats.pendingSupplies} 
            icon="inventory"
            iconColor="#ffc107"
            backgroundColor="#fff3cd"
            onClick={() => navigate('/estudiante/dashboard?section=pending-supplies')}
          />
        </div>

        {/* Sección de Insumos Asignados */}
        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Insumos Asignados</h2>
                <button className="view-all-button">Ver todos</button>
              </div>
              <div className="supplies-list">
                {assignedSupplies.map(supply => (
                  <div key={supply.id} className="supply-item">
                    <div className="supply-icon">
                      <span className="material-icons">
                        {supply.subject.includes('CIRUGÍA') ? 'medical_services' :
                         supply.subject.includes('OPERATORIA') ? 'construction' :
                         'science'}
                      </span>
                    </div>
                    <div className="supply-details">
                      <div className="supply-name">{supply.procedure}</div>
                      <div className="supply-info">
                        <span className="supply-subject">Asignatura: {supply.subject}</span>
                        <span className="supply-status">Estado: {supply.status}</span>
                      </div>
                      <div className="supply-semester">Semestre: {supply.semester}</div>
                    </div>
                    <button className="action-button small" onClick={() => handleShowSupplyDetail(supply)}>
                      <span className="material-icons">visibility</span>
                      <span>Ver</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Insumos Pendientes</h2>
                <button className="add-button" onClick={() => setShowAddSupplyModal(true)}>
                  <span className="material-icons">add</span>
                  <span>Solicitar</span>
                </button>
              </div>
              <div className="supplies-list">
                {pendingSupplies.map(supply => (
                  <div key={supply.id} className="supply-item pending">
                    <div className="supply-icon">
                      <span className="material-icons">
                        {supply.subject.includes('ENDODONCIA') ? 'biotech' : 'build'}
                      </span>
                    </div>
                    <div className="supply-details">
                      <div className="supply-name">{supply.procedure}</div>
                      <div className="supply-info">
                        <span className="supply-subject">Asignatura: {supply.subject}</span>
                        <span className="supply-status pending">Estado: {supply.status}</span>
                      </div>
                      <div className="supply-payment-required">
                        {supply.paymentRequired && (
                          <span className="payment-badge">Requiere pago de hito</span>
                        )}
                      </div>
                    </div>
                    <div className="supply-actions">
                      <button className="action-button small" onClick={() => handleShowSupplyDetail(supply)}>
                        <span className="material-icons">visibility</span>
                        <span>Ver</span>
                      </button>
                      {supply.paymentRequired && (
                        <button className="action-button small payment" onClick={handleShowPaymentModal}>
                          <span className="material-icons">payment</span>
                          <span>Pagar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Prácticas y Cursos */}
        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Prácticas Pendientes</h2>
                <button className="view-all-button" onClick={handleViewAllPractices}>Ver todas</button>
              </div>
              <div className="practices-list">
                {pendingPractices.map(practice => (
                  <div key={practice.id} className="practice-item">
                    <div className="practice-icon">
                      <span className="material-icons">
                        {practice.name.includes('Limpieza') ? 'cleaning_services' :
                         practice.name.includes('selladores') ? 'vaccines' :
                         practice.name.includes('impresiones') ? 'format_color_fill' :
                         'monitor_heart'}
                      </span>
                    </div>
                    <div className="practice-details">
                      <div className="practice-name">{practice.name}</div>
                      <div className="practice-info">
                        <span className="practice-patient">Paciente: {practice.patient}</span>
                        <span className="practice-date">Fecha: {practice.date}</span>
                      </div>
                      <div className="practice-supervisor">Supervisor: {practice.supervisor}</div>
                    </div>
                    <button className="action-button small" onClick={() => handleShowPracticeDetail(practice)}>
                      <span className="material-icons">visibility</span>
                      <span>Ver</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Mis Cursos</h2>
                <button className="view-all-button" onClick={handleViewAllCourses}>Ver todos</button>
              </div>
              <div className="courses-list">
                {currentCourses.map(course => (
                  <div key={course.id} className="course-item">
                    <div className="course-header">
                      <div className="course-name">{course.name}</div>
                      <div className="course-instructor">{course.instructor}</div>
                    </div>
                    <div className="course-progress-container">
                      <div className="course-progress-bar">
                        <div 
                          className="course-progress-fill" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <div className="course-progress-text">{course.progress}% completado</div>
                    </div>
                    <button className="icon-button" onClick={() => handleCourseClick(course)}>
                      <span className="material-icons">arrow_forward</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal para ver detalles de insumos */}
        {showSupplyDetailModal && selectedSupply && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Detalles de {selectedSupply.procedure}</h2>
                <button className="close-button" onClick={() => setShowSupplyDetailModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="supply-detail-info">
                  <p><strong>Asignatura:</strong> {selectedSupply.subject}</p>
                  <p><strong>Procedimiento:</strong> {selectedSupply.procedure}</p>
                  <p><strong>Semestre:</strong> {selectedSupply.semester}</p>
                  <p><strong>Estado:</strong> {selectedSupply.status}</p>
                </div>
                <div className="materials-table">
                  <h3>Materiales</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSupply.materials.map((material: any, index: number) => (
                        <tr key={index}>
                          <td>{material.name}</td>
                          <td>{material.quantity}</td>
                          <td>
                            <span className={`status-badge ${material.assigned ? 'assigned' : 'pending'}`}>
                              {material.assigned ? 'Asignado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="action-button" onClick={() => setShowSupplyDetailModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para subir comprobante de pago */}
        {showPaymentModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Subir Comprobante de Pago</h2>
                <button className="close-button" onClick={() => setShowPaymentModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Para recibir tus insumos, debes subir el comprobante de pago del hito correspondiente.</p>
                <div className="payment-upload-container">
                  <label htmlFor="payment-proof" className="upload-label">
                    <span className="material-icons">upload_file</span>
                    <span>Seleccionar imagen del comprobante</span>
                  </label>
                  <input 
                    type="file" 
                    id="payment-proof" 
                    accept="image/*" 
                    onChange={handlePaymentProofUpload} 
                    style={{ display: 'none' }}
                  />
                  {paymentProofImage && (
                    <div className="payment-proof-preview">
                      <img src={paymentProofImage} alt="Comprobante de pago" />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={() => setShowPaymentModal(false)}>Cancelar</button>
                <button 
                  className="action-button" 
                  onClick={handleSubmitPayment}
                  disabled={!paymentProofImage}
                >
                  Enviar Comprobante
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para solicitar nuevos insumos */}
        {showAddSupplyModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Solicitar Insumos</h2>
                <button className="close-button" onClick={() => setShowAddSupplyModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="subject">Asignatura</label>
                  <select 
                    id="subject" 
                    name="subject" 
                    value={newSupply.subject}
                    onChange={handleNewSupplyChange}
                    required
                  >
                    <option value="">Seleccionar asignatura</option>
                    <option value="CIRUGÍA BUCAL">CIRUGÍA BUCAL</option>
                    <option value="OPERATORIA">OPERATORIA</option>
                    <option value="ENDODONCIA">ENDODONCIA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="procedure">Procedimiento</label>
                  <input 
                    type="text" 
                    id="procedure" 
                    name="procedure" 
                    value={newSupply.procedure}
                    onChange={handleNewSupplyChange}
                    placeholder="Ej. EXODONCIA SIMPLE"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Materiales</label>
                  {newSupply.materials.map((material, index) => (
                    <div key={index} className="material-input-group">
                      <input 
                        type="text" 
                        name="name" 
                        value={material.name}
                        onChange={(e) => handleMaterialChange(index, e)}
                        placeholder="Nombre del material"
                        required
                      />
                      <input 
                        type="text" 
                        name="quantity" 
                        value={material.quantity}
                        onChange={(e) => handleMaterialChange(index, e)}
                        placeholder="Cantidad"
                        required
                      />
                    </div>
                  ))}
                  <button type="button" className="add-material-button" onClick={handleAddMaterial}>
                    <span className="material-icons">add</span>
                    <span>Agregar Material</span>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={() => setShowAddSupplyModal(false)}>Cancelar</button>
                <button className="action-button" onClick={handleSubmitNewSupply}>Enviar Solicitud</button>
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <h2>Acciones Rápidas</h2>
              <div className="quick-actions">
                <button className="action-button" onClick={handleRegisterPractice}>
                  <span className="material-icons">assignment</span>
                  <span>Registrar Práctica</span>
                </button>
                <button className="action-button" onClick={handleRequestSupplies}>
                  <span className="material-icons">inventory_2</span>
                  <span>Solicitar Insumos</span>
                </button>
                <button className="action-button" onClick={handleReviewPayments}>
                  <span className="material-icons">payment</span>
                  <span>Revisar Pagos</span>
                </button>
                <button className="action-button" onClick={handleConsultTeacher}>
                  <span className="material-icons">chat</span>
                  <span>Consultar a Docente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteDashboard;


// Función para mostrar detalles de práctica
const handleShowPracticeDetail = (practice: any) => {
  alert(`Detalles de la práctica: ${practice.name}\nPaciente: ${practice.patient}\nFecha: ${practice.date}\nSupervisor: ${practice.supervisor}`);
};

// Función para navegar a la página de cursos con el curso seleccionado
const handleCourseClick = (course: any) => {
  navigate(`/estudiante/cursos?curso=${course.id}`);
};

// Función para navegar a la página de prácticas
const handleViewAllPractices = () => {
  navigate('/estudiante/practicas');
};

// Función para navegar a la página de cursos
const handleViewAllCourses = () => {
  navigate('/estudiante/cursos');
};

// Funciones para las acciones rápidas
const handleRegisterPractice = () => {
  navigate('/estudiante/practicas?action=register');
};

const handleRequestSupplies = () => {
  setShowAddSupplyModal(true);
};

const handleReviewPayments = () => {
  alert('Funcionalidad de revisión de pagos simulada');
};

const handleConsultTeacher = () => {
  alert('Funcionalidad de consulta a docente simulada');
};
