// src/components/usuarios/administrador/features/InventorySummary.tsx
import React from 'react';
import './InventorySummary.css';

const InventorySummary: React.FC = () => {
    return (
        <div className="inventory-summary-panel">
            <div className="panel-header">
                <h2>Resumen de Inventario</h2>
                <button className="view-all-button">Ver inventario completo</button>
            </div>
            <div className="inventory-summary-list">
                <div className="inventory-category">
                    <h3>Materiales Dentales</h3>
                    <div className="inventory-progress">
                        <div className="progress-bar" style={{ width: '75%', backgroundColor: '#448aff' }}></div>
                    </div>
                    <div className="inventory-stats">15 ítems</div>
                </div>
                <div className="inventory-category">
                    <h3>Equipamiento</h3>
                    <div className="inventory-progress">
                        <div className="progress-bar" style={{ width: '90%', backgroundColor: '#ff9800' }}></div>
                    </div>
                    <div className="inventory-stats">8 ítems</div>
                </div>
            </div>
        </div>
    );
};

export default InventorySummary;