import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FaSignInAlt } from 'react-icons/fa';
import './menubar.css';

const menubar: React.FC = () => {
  return (
    <nav className="menubar">
      <div className="menubar-inner">
        <ul className="menu-list">
          <li className="menu-item">
            <NavLink to="/" end className="menu-link">
              Inicio
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/acerca-de" className="menu-link">
              Acerca de
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/servicio" className="menu-link">
              Servicios
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/contactos" className="menu-link">
              Contacto
            </NavLink>
          </li>
        </ul>
        <Link to="/login" className="portal-link">
          <FaSignInAlt />
          <span>Portal</span>
        </Link>
      </div>
    </nav>
  );
};

export default menubar;