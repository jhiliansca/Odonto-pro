// src/components/usuarios/administrador/features/RecentActivity.tsx
import React from 'react';
import './RecentActivity.css';

interface ActivityItem {
    id: number;
    user: string;
    action: string;
    time: string;
    icon: string;
}

const recentActivity: ActivityItem[] = [
    { id: 1, user: 'Dr. Carlos Mendoza', action: 'Registró un nuevo paciente', time: '10:30 AM', icon: 'person_add' },
    { id: 2, user: 'María López', action: 'Actualizó inventario', time: '09:45 AM', icon: 'inventory' },
    { id: 3, user: 'Juan Pérez', action: 'Generó reporte', time: 'Ayer', icon: 'assessment' },
];

const RecentActivity: React.FC = () => {
    return (
        <div className="recent-activity-panel">
            <div className="panel-header">
                <h2>Actividad Reciente</h2>
                <button className="view-all-button">Ver todo</button>
            </div>
            <div className="activity-list">
                {recentActivity.map(activity => (
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
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;