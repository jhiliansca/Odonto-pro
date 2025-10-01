import React from 'react';
import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title: string;
  value?: string | number;
  icon?: string;
  iconColor?: string; // Propiedad para el color del ícono
  backgroundColor?: string; // Propiedad para el color de fondo de la tarjeta
  children?: ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  backgroundColor, 
  children,
  onClick 
}) => {
  return (
    <div 
      className={`dashboard-card ${onClick ? 'clickable' : ''}`} 
      style={{ backgroundColor: backgroundColor || '#ffffff' }}
      onClick={onClick}
    >
      <div 
        className="card-icon"
        style={{ backgroundColor: iconColor }}
      >
        {icon && <span className="material-icons">{icon}</span>}
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        {value !== undefined && <p className="card-value">{value}</p>}
        {children && <div className="card-details">{children}</div>}
      </div>
    </div>
  );
};

export default Card;
