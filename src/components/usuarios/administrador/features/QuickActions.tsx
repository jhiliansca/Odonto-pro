// src/components/usuarios/administrador/features/QuickActions.tsx
import React from 'react';
import './QuickActions.css';

const QuickActions: React.FC = () => {
    return (
        <div className="quick-actions-panel">
            <h2>Acciones Rápidas</h2>
            <div className="quick-actions">
                <button className="action-button">
                    <span className="material-icons">person_add</span>
                    <span>Nuevo Usuario</span>
                </button>
                <button className="action-button">
                    <span className="material-icons">assessment</span>
                    <span>Generar Reporte</span>
                </button>
                <button className="action-button">
                    <span className="material-icons">settings</span>
                    <span>Configuración</span>
                </button>
                <button className="action-button">
                    <span className="material-icons">event</span>
                    <span>Programar Evento</span>
                </button>
            </div>
        </div>
    );
};

export default QuickActions;