import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Dashboard.css';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalPatients: 78,
    todayAppointments: 12,
    pendingTreatments: 15,
    assignedStudents: 8
  });

  const [todayAppointments] = useState([
    { id: 1, patient: 'Laura Martínez', time: '10:30 AM', treatment: 'Limpieza dental', status: 'confirmed' },
    { id: 2, patient: 'Carlos Rodríguez', time: '11:45 AM', treatment: 'Consulta general', status: 'confirmed' },
    { id: 3, patient: 'Ana García', time: '13:15 PM', treatment: 'Ortodoncia', status: 'pending' },
    { id: 4, patient: 'Roberto Sánchez', time: '15:00 PM', treatment: 'Radiografía', status: 'confirmed' },
    { id: 5, patient: 'María López', time: '16:30 PM', treatment: 'Blanqueamiento', status: 'pending' },
  ]);

  const [assignedStudents] = useState([
    { id: 1, name: 'Pedro Gómez', semester: '8vo semestre', specialty: 'Ortodoncia' },
    { id: 2, name: 'Lucía Fernández', semester: '7mo semestre', specialty: 'Odontopediatría' },
    { id: 3, name: 'Miguel Torres', semester: '9no semestre', specialty: 'Periodoncia' },
    { id: 4, name: 'Sofía Ramírez', semester: '8vo semestre', specialty: 'Endodoncia' },
  ]);

  return (
    <DashboardLayout userType="doctor" userName="Dr. Carlos Mendoza">
      <div className="doctor-dashboard" style={{ '--role-color': '#0284c7' } as React.CSSProperties}>
        <div className="dashboard-header">
          <h1>Panel de Doctor</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-message">
            <span className="welcome-badge">Consultas</span>
            <h2>Bienvenido, Dr. Carlos Mendoza</h2>
            <p>Revisa tus citas del día, supervisa tratamientos y coordina a los estudiantes asignados.</p>
          </div>
          <span className="welcome-icon material-icons">medical_services</span>
        </div>

        <div className="stats-grid">
          <Card
            title="Pacientes Totales"
            value={stats.totalPatients}
            icon="people"
            color="#0ea5e9"
            onClick={() => navigate('/doctor/pacientes')}
          />
          <Card
            title="Citas de Hoy"
            value={stats.todayAppointments}
            icon="event"
            color="#16a34a"
            onClick={() => navigate('/doctor/citas')}
          />
          <Card
            title="Tratamientos Pendientes"
            value={stats.pendingTreatments}
            icon="healing"
            color="#f59e0b"
            onClick={() => navigate('/doctor/tratamientos')}
          />
          <Card
            title="Estudiantes Asignados"
            value={stats.assignedStudents}
            icon="school"
            color="#8b5cf6"
            onClick={() => navigate('/doctor/estudiantes')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Citas del Día</h2>
                <button className="view-all-button" onClick={() => navigate('/doctor/citas')}>Ver todas</button>
              </div>
              <div className="appointments-list">
                {todayAppointments.map(appointment => (
                  <div key={appointment.id} className="appointment-item">
                    <div className="appointment-time">{appointment.time}</div>
                    <div className="appointment-details">
                      <div className="appointment-patient">{appointment.patient}</div>
                      <div className="appointment-treatment">{appointment.treatment}</div>
                    </div>
                    <div className="appointment-status">
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="appointment-actions">
                      <button className="icon-button" aria-label="Ver cita">
                        <span className="material-icons">visibility</span>
                      </button>
                      <button className="icon-button" aria-label="Editar cita">
                        <span className="material-icons">edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Estudiantes Asignados</h2>
                <button className="view-all-button" onClick={() => navigate('/doctor/estudiantes')}>Ver todos</button>
              </div>
              <div className="students-list">
                {assignedStudents.map(student => (
                  <div key={student.id} className="student-item">
                    <div className="student-avatar">
                      {student.name.charAt(0)}
                    </div>
                    <div className="student-details">
                      <div className="student-name">{student.name}</div>
                      <div className="student-info">
                        <span>{student.semester}</span> • <span>{student.specialty}</span>
                      </div>
                    </div>
                    <button className="icon-button" aria-label="Opciones">
                      <span className="material-icons">more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col wide-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Acciones Rápidas</h2>
              </div>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate('/doctor/citas')}>
                  <span className="material-icons">add_circle</span>
                  <span>Nueva Cita</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/doctor/pacientes')}>
                  <span className="material-icons">person_add</span>
                  <span>Nuevo Paciente</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/doctor/historial')}>
                  <span className="material-icons">assignment</span>
                  <span>Historial Clínico</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/doctor/estudiantes')}>
                  <span className="material-icons">school</span>
                  <span>Asignar Estudiante</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;