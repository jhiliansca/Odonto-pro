import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Cita } from '../../../services/clinicaApi';
import { useCurrentUser, useCurrentUserName } from '../../../hooks/useCurrentUser';
import '../RoleExtra.css';

interface Bloque {
  id: number;
  hora: string;
  etiqueta: string;
  paciente: string;
  estado: 'ocupado';
}

interface Dia {
  nombre: string;
  bloques: Bloque[];
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DoctorHorarios: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Docente');
  const user = useCurrentUser();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [estudiantes, setEstudiantes] = useState<number>(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const [citasApi, estudiantesApi] = await Promise.all([
          clinicaApi.citas(),
          clinicaApi.estudiantes(),
        ]);
        if (!activo) return;
        setCitas(user?.id != null ? citasApi.filter(cita => cita.doctor_id === user.id) : citasApi);
        setEstudiantes(estudiantesApi.length);
      } catch {
        if (activo) setError('No fue posible cargar las citas reales.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [user?.id]);

  const dias: Dia[] = DIAS.map((nombre, indice) => ({
    nombre,
    bloques: citas
      .filter(cita => {
        const fecha = new Date(`${cita.fecha.slice(0, 10)}T00:00:00`);
        return !Number.isNaN(fecha.getTime()) && (fecha.getDay() + 6) % 7 === indice;
      })
      .map(cita => ({
        id: cita.id,
        hora: cita.hora.slice(0, 5),
        etiqueta: cita.tratamiento,
        paciente: cita.paciente ?? `Paciente #${cita.paciente_id}`,
        estado: 'ocupado' as const,
      }))
      .sort((a, b) => a.hora.localeCompare(b.hora)),
  }));

  const pendientes = citas.filter(cita => cita.estado === 'pendiente').length;
  const completadas = citas.filter(cita => cita.estado === 'completada').length;
  const indiceHoy = (new Date().getDay() + 6) % 7;

  return (
    <DashboardLayout userType="doctor" userName={userName}>
      <div className="ext-page">
        <div className="ext-header">
          <div>
            <h1>Horarios y Disponibilidad</h1>
            <p className="ext-sub">Consulta las citas reales registradas por día y coordina tu agenda.</p>
          </div>
          <div className="ext-actions">
            <button className="add-button" onClick={() => navigate('/doctor/citas')}>
              <span className="material-icons">add_circle</span>
              Agendar cita
            </button>
          </div>
        </div>

        {error && <div className="empty-state">{error}</div>}

        <div className="ext-stats">
          <div className="ext-stat" style={{ '--stat-color': '#0284c7' } as React.CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">event_busy</span></span>
            <div><strong>{citas.length}</strong><span>Citas registradas</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#f59e0b' } as React.CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">hourglass_top</span></span>
            <div><strong>{pendientes}</strong><span>Citas pendientes</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#16a34a' } as React.CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">event_available</span></span>
            <div><strong>{completadas}</strong><span>Citas completadas</span></div>
          </div>
          <div className="ext-stat" style={{ '--stat-color': '#7c3aed' } as React.CSSProperties}>
            <span className="ext-stat-icon"><span className="material-icons">school</span></span>
            <div><strong>{estudiantes}</strong><span>Estudiantes registrados</span></div>
          </div>
        </div>

        <div className="ext-card">
          <div className="ext-card-head">
            <div>
              <h2>Agenda de citas</h2>
              <p>Cada bloque corresponde a una cita real registrada en el sistema.</p>
            </div>
            <div className="ext-actions">
              <span className="ext-pill confirmada">Citas</span>
              <span className="ext-pill activo">Por día</span>
            </div>
          </div>
          <div className="ext-card-body">
            {cargando && <div className="empty-state">Cargando datos reales...</div>}
            {!cargando && citas.length === 0 && (
              <div className="empty-state">No hay registros reales registrados</div>
            )}
            <div className="ext-week">
              {dias.map((dia, index) => (
                <div key={dia.nombre} className={`ext-day ${index === indiceHoy ? 'hoy' : ''}`}>
                  <h3>{dia.nombre}</h3>
                  <ul>
                    {dia.bloques.map(bloque => (
                      <li key={bloque.id} className={bloque.estado}>
                        <strong>{bloque.hora}</strong>
                        {bloque.etiqueta}
                        <small>{bloque.paciente}</small>
                      </li>
                    ))}
                    {dia.bloques.length === 0 && (
                      <li className="ext-empty">Sin citas registradas</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHorarios;