import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import './Citas.css';

const Citas: React.FC = () => {
  const [citas] = useState([
    { 
      id: 1, 
      paciente: 'Laura Martínez', 
      fecha: '2025-06-15', 
      hora: '10:00', 
      tratamiento: 'Limpieza dental', 
      supervisor: 'Dr. Carlos Mendoza',
      estado: 'confirmada'
    },
    { 
      id: 2, 
      paciente: 'Roberto Sánchez', 
      fecha: '2025-06-18', 
      hora: '11:30', 
      tratamiento: 'Aplicación de selladores', 
      supervisor: 'Dra. Ana García',
      estado: 'pendiente'
    },
    { 
      id: 3, 
      paciente: 'María López', 
      fecha: '2025-06-20', 
      hora: '09:00', 
      tratamiento: 'Toma de impresiones', 
      supervisor: 'Dr. Carlos Mendoza',
      estado: 'confirmada'
    },
    { 
      id: 4, 
      paciente: 'Juan Pérez', 
      fecha: '2025-06-22', 
      hora: '15:30', 
      tratamiento: 'Radiografía panorámica', 
      supervisor: 'Dr. Luis Ramírez',
      estado: 'pendiente'
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newCita, setNewCita] = useState({
    paciente: '',
    fecha: '',
    hora: '',
    tratamiento: '',
    supervisor: ''
  });

  // Función para manejar el cambio en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCita({
      ...newCita,
      [name]: value
    });
  };

  // Función para simular la creación de una nueva cita
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Solicitud de cita enviada con éxito. Pendiente de aprobación por el supervisor.');
    setShowModal(false);
    setNewCita({
      paciente: '',
      fecha: '',
      hora: '',
      tratamiento: '',
      supervisor: ''
    });
  };

  return (
    <DashboardLayout userType="estudiante" userName="Pedro Gómez">
      <div className="citas-container">
        <div className="page-header">
          <h1>Mis Citas</h1>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <span className="material-icons">add</span>
            <span>Nueva Cita</span>
          </button>
        </div>

        <div className="calendar-view">
          <div className="calendar-header">
            <h2>Octubre 2025</h2>
            <div className="calendar-navigation">
              <button className="nav-button">
                <span className="material-icons">chevron_left</span>
              </button>
              <button className="nav-button">
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {/* Simulación de un calendario */}
            <div className="calendar-day header">Lun</div>
            <div className="calendar-day header">Mar</div>
            <div className="calendar-day header">Mié</div>
            <div className="calendar-day header">Jue</div>
            <div className="calendar-day header">Vie</div>
            <div className="calendar-day header">Sáb</div>
            <div className="calendar-day header">Dom</div>
            
            {/* Primera semana */}
            <div className="calendar-day disabled">29</div>
            <div className="calendar-day disabled">30</div>
            <div className="calendar-day disabled">31</div>
            <div className="calendar-day">1</div>
            <div className="calendar-day">2</div>
            <div className="calendar-day">3</div>
            <div className="calendar-day">4</div>
            
            {/* Segunda semana */}
            <div className="calendar-day">5</div>
            <div className="calendar-day">6</div>
            <div className="calendar-day">7</div>
            <div className="calendar-day">8</div>
            <div className="calendar-day">9</div>
            <div className="calendar-day">10</div>
            <div className="calendar-day">11</div>
            
            {/* Tercera semana */}
            <div className="calendar-day">12</div>
            <div className="calendar-day">13</div>
            <div className="calendar-day">14</div>
            <div className="calendar-day has-event">15</div>
            <div className="calendar-day">16</div>
            <div className="calendar-day">17</div>
            <div className="calendar-day">18</div>
            
            {/* Cuarta semana */}
            <div className="calendar-day">19</div>
            <div className="calendar-day has-event">20</div>
            <div className="calendar-day">21</div>
            <div className="calendar-day has-event">22</div>
            <div className="calendar-day">23</div>
            <div className="calendar-day">24</div>
            <div className="calendar-day">25</div>
            
            {/* Quinta semana */}
            <div className="calendar-day">26</div>
            <div className="calendar-day">27</div>
            <div className="calendar-day">28</div>
            <div className="calendar-day">29</div>
            <div className="calendar-day">30</div>
            <div className="calendar-day disabled">1</div>
            <div className="calendar-day disabled">2</div>
          </div>
        </div>

        <div className="citas-list">
          <h2>Próximas Citas</h2>
          {citas.map(cita => (
            <div key={cita.id} className={`cita-card ${cita.estado}`}>
              <div className="cita-fecha">
                <div className="fecha-dia">{new Date(cita.fecha).getDate()}</div>
                <div className="fecha-mes">{new Date(cita.fecha).toLocaleString('es-ES', { month: 'short' })}</div>
              </div>
              <div className="cita-info">
                <h3>{cita.paciente}</h3>
                <div className="cita-detalles">
                  <div className="cita-hora">
                    <span className="material-icons">schedule</span>
                    <span>{cita.hora}</span>
                  </div>
                  <div className="cita-tratamiento">
                    <span className="material-icons">medical_services</span>
                    <span>{cita.tratamiento}</span>
                  </div>
                  <div className="cita-supervisor">
                    <span className="material-icons">person</span>
                    <span>{cita.supervisor}</span>
                  </div>
                </div>
              </div>
              <div className="cita-estado">
                <span className={`estado-badge ${cita.estado}`}>
                  {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                </span>
              </div>
              <div className="cita-acciones">
                <button className="icon-button">
                  <span className="material-icons">visibility</span>
                </button>
                <button className="icon-button">
                  <span className="material-icons">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal para nueva cita */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Solicitar Nueva Cita</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Paciente</label>
                  <select 
                    name="paciente" 
                    value={newCita.paciente} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    <option value="Laura Martínez">Laura Martínez</option>
                    <option value="Roberto Sánchez">Roberto Sánchez</option>
                    <option value="María López">María López</option>
                    <option value="Juan Pérez">Juan Pérez</option>
                    <option value="Ana Torres">Ana Torres</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    name="fecha" 
                    value={newCita.fecha} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input 
                    type="time" 
                    name="hora" 
                    value={newCita.hora} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tratamiento</label>
                  <select 
                    name="tratamiento" 
                    value={newCita.tratamiento} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar tratamiento</option>
                    <option value="Limpieza dental">Limpieza dental</option>
                    <option value="Aplicación de selladores">Aplicación de selladores</option>
                    <option value="Toma de impresiones">Toma de impresiones</option>
                    <option value="Radiografía panorámica">Radiografía panorámica</option>
                    <option value="Extracción dental">Extracción dental</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supervisor</label>
                  <select 
                    name="supervisor" 
                    value={newCita.supervisor} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar supervisor</option>
                    <option value="Dr. Carlos Mendoza">Dr. Carlos Mendoza</option>
                    <option value="Dra. Ana García">Dra. Ana García</option>
                    <option value="Dr. Luis Ramírez">Dr. Luis Ramírez</option>
                    <option value="Dra. Sofía Torres">Dra. Sofía Torres</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="submit-button">
                    Solicitar Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Citas;