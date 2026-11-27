import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentActivity.css';
import { clinicaApi } from '../../../../services/clinicaApi';

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  time: string;
  icon: string;
}

const RecentActivity: React.FC = () => {
  const navigate = useNavigate();
  const [actividad, setActividad] = useState<ActivityItem[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    clinicaApi.actividad()
      .then(data => {
        if (activo) {
          setActividad(data.map(item => ({
            id: item.id,
            user: item.usuario,
            action: item.accion,
            time: item.fecha,
            icon: item.icono,
          })));
        }
      })
      .catch(() => { if (activo) setActividad([]); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  return (
    <div className="recent-activity-panel">
      <div className="panel-header">
        <h2>Actividad Reciente</h2>
        <button className="view-all-button" onClick={() => navigate('/admin/actividad')}>Ver todo</button>
      </div>
      <div className="activity-list">
        {actividad.length > 0 ? (
          actividad.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                <span className="material-icons">{activity.icon}</span>
              </div>
              <div className="activity-details">
                <div className="activity-user">{activity.user}</div>
                <div className="activity-action">{activity.action}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="activity-item">
            <div className="activity-details">
              <div className="activity-action">{cargando ? 'Cargando datos reales...' : 'No hay registros reales registrados'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
