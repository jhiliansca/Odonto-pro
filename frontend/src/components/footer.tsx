import React from 'react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section footer-brand">
          <div className="footer-logo">
            <img src="/logoclinica.jpg" alt="Logo Clínica Odontológica Unifranz" />
            <div>
              <h3>Clínica Odontológica Unifranz</h3>
              <p className="slogan">Cuidando tu sonrisa con profesionalismo y tecnología</p>
            </div>
          </div>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Síguenos en Facebook">
              <FaFacebook className="social-icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Síguenos en Instagram">
              <FaInstagram className="social-icon" />
            </a>
            <a href="https://wa.me/59112345678" target="_blank" rel="noopener noreferrer" title="Contáctanos por WhatsApp">
              <FaWhatsapp className="social-icon" />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Información de Contacto</h4>
          <ul className="contact-info">
            <li><FaMapMarkerAlt /> Av. Santa Cruz y C. Tomás Frías, Edif. Continental, Cochabamba, Bolivia</li>
            <li><FaPhone /> +591 12345678</li>
            <li><FaEnvelope /> contacto@clinicaunifranz.com</li>
            <li><FaClock /> Lunes a Viernes: 8:00 – 20:00 · Sábados: 9:00 – 14:00</li>
            <li className="emergency-text">Urgencias dentales: +591 12345679</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Servicios Principales</h4>
          <ul className="services-list">
            <li>Limpieza Dental</li>
            <li>Blanqueamiento</li>
            <li>Ortodoncia</li>
            <li>Implantes Dentales</li>
            <li>Odontopediatría</li>
            <li>Estética Dental</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Clínica Odontológica Unifranz - Todos los derechos reservados</p>
        <p className="footer-links">
          <a href="/privacidad">Política de Privacidad</a> | 
          <a href="/terminos">Términos y Condiciones</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;