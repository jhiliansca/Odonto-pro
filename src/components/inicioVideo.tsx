import React from 'react';
import './inicioVideo.css';

const inicioVideo: React.FC = () => {
  return (
    <section id="inicio" className="inicio-container">
      <video autoPlay loop muted playsInline className="inicio-video">
        <source src="/src/assets/dental.mp4" type="video/mp4" />
      </video>
      <div className="inicio-overlay" />
      <div className="overlay-text">
        <span className="hero-badge">Clínica Odontológica Unifranz</span>
        <h2>Tu sonrisa merece<br />atención de expertos</h2>
        <p>Cuidamos de tu salud bucal con tecnología de punta y un equipo profesional dedicado a tu bienestar.</p>
        <div className="hero-actions">
          <a href="/contactos" className="hero-btn hero-btn-primary">
            Agendar una cita
          </a>
          <a href="/servicio" className="hero-btn hero-btn-ghost">
            Conocer servicios
          </a>
        </div>
      </div>
    </section>
  );
};

export default inicioVideo;