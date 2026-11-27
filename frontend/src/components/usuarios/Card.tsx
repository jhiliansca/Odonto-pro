import React from 'react';
import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title: string;
  value?: string | number;
  icon?: string;
  color?: string;
  iconColor?: string;
  backgroundColor?: string;
  children?: ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  iconColor, 
  backgroundColor, 
  children,
  onClick 
}) => {
  const accentColor = color || iconColor || 'var(--user-color, var(--brand-600))';

  return (
    <div 
      className={`dashboard-card ${onClick ? 'clickable' : ''}`} 
      style={{ 
        ...(backgroundColor && backgroundColor !== '#fff' && backgroundColor !== '#ffffff'
          ? { backgroundColor }
          : {}),
        ['--card-accent' as string]: accentColor,
      }}
      onClick={onClick}
    >
      <div className="card-top">
        <div className="card-icon">
          {icon && <span className="material-icons">{icon}</span>}
        </div>
        {children && <div className="card-extra">{children}</div>}
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        {value !== undefined && <p className="card-value">{value}</p>}
      </div>
    </div>
  );
};

export default Card;