import React from 'react';
import { FaPhoneAlt, FaClock } from 'react-icons/fa';
import './header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <img src="/logoclinica.jpg" alt="Logo Clínica Odontológica Unifranz" className="logo" />
          <div className="brand-text">
            <h1 className="title">Clínica Odontológica Unifranz</h1>
            <p className="subtitle">Tu sonrisa, nuestra prioridad</p>
          </div>
        </div>
        <div className="header-contact">
          <div className="contact-item">
            <span className="contact-icon"><FaClock /></span>
            <div>
              <span className="contact-label">Horario</span>
              <span className="contact-value">Lun–Vie 8:00–20:00</span>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon"><FaPhoneAlt /></span>
            <div>
              <span className="contact-label">Teléfono</span>
              <span className="contact-value">+591 12345678</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;