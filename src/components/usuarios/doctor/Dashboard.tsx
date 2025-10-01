import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Dashboard.css';

const DoctorDashboard: React.FC = () => {
  // Datos de ejemplo para el dashboard
  const [stats] = useState({
    totalPatients: 78,
    todayAppointments: 12,
    pendingTreatments: 15,
    assignedStudents: 8
  });

  // Datos de ejemplo para las citas del día
  const [todayAppointments] = useState([
    { id: 1, patient: 'Laura Martínez', time: '10:30 AM', treatment: 'Limpieza dental', status: 'confirmed' },
    { id: 2, patient: 'Carlos Rodríguez', time: '11:45 AM', treatment: 'Consulta general', status: 'confirmed' },
    { id: 3, patient: 'Ana García', time: '13:15 PM', treatment: 'Ortodoncia', status: 'pending' },
    { id: 4, patient: 'Roberto Sánchez', time: '15:00 PM', treatment: 'Radiografía', status: 'confirmed' },
    { id: 5, patient: 'María López', time: '16:30 PM', treatment: 'Blanqueamiento', status: 'pending' },
  ]);

  // Datos de ejemplo para los estudiantes asignados
  const [assignedStudents] = useState([
    { id: 1, name: 'Pedro Gómez', semester: '8vo semestre', specialty: 'Ortodoncia' },
    { id: 2, name: 'Lucía Fernández', semester: '7mo semestre', specialty: 'Odontopediatría' },
    { id: 3, name: 'Miguel Torres', semester: '9no semestre', specialty: 'Periodoncia' },
    { id: 4, name: 'Sofía Ramírez', semester: '8vo semestre', specialty: 'Endodoncia' },
  ]);

  return (
    <DashboardLayout userType="doctor" userName="Dr. Carlos Mendoza">
      <div className="doctor-dashboard">
        <div className="dashboard-header">
          <h1>Panel de Doctor</h1>
          <div className="date-display">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="stats-grid">
          <Card 
            title="Pacientes Totales" 
            value={stats.totalPatients} 
            icon="people" 
            color="#2196f3"
            onClick={() => console.log('Navegando a pacientes')}
          />
          <Card 
            title="Citas de Hoy" 
            value={stats.todayAppointments} 
            icon="event" 
            color="#4caf50"
            onClick={() => console.log('Navegando a citas')}
          />
          <Card 
            title="Tratamientos Pendientes" 
            value={stats.pendingTreatments} 
            icon="healing" 
            color="#ff9800"
            onClick={() => console.log('Navegando a tratamientos')}
          />
          <Card 
            title="Estudiantes Asignados" 
            value={stats.assignedStudents} 
            icon="school" 
            color="#9c27b0"
            onClick={() => console.log('Navegando a estudiantes')}
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Citas del Día</h2>
                <button className="view-all-button">Ver todas</button>
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
            </div>
          </div>
          <div className="dashboard-col">
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Estudiantes Asignados</h2>
                <button className="view-all-button">Ver todos</button>
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
                    <button className="icon-button">
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
              <h2>Acciones Rápidas</h2>
              <div className="quick-actions">
                <button className="action-button">
                  <span className="material-icons">add_circle</span>
                  <span>Nueva Cita</span>
                </button>
                <button className="action-button">
                  <span className="material-icons">person_add</span>
                  <span>Nuevo Paciente</span>
                </button>
                <button className="action-button">
                  <span className="material-icons">assignment</span>
                  <span>Historial Clínico</span>
                </button>
                <button className="action-button">
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