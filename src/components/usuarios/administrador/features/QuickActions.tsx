import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickActions.css';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: 'person_add', label: 'Nuevo Usuario', path: '/admin/usuarios' },
    { icon: 'assessment', label: 'Generar Reporte', path: '/admin/reportes' },
    { icon: 'settings', label: 'Configuración', path: '/admin/configuracion' },
    { icon: 'event', label: 'Programar Evento', path: '/admin/configuracion' },
  ];

  return (
    <div className="quick-actions-panel">
      <div className="panel-header">
        <h2>Acciones Rápidas</h2>
      </div>
      <div className="quick-actions">
        {actions.map((action, index) => (
          <button key={index} className="quick-action-btn" onClick={() => navigate(action.path)}>
            <span className="material-icons">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;