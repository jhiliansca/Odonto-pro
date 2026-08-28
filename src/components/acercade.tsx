import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AcercaDe.css';

const AcercaDe: React.FC = () => {
  const navigate = useNavigate();
  const images = [
    { src: '/dientesfondo.jpg', alt: 'Consultorio dental' },
    { src: '/Digital.jpg', alt: 'Tecnología dental' },
    { src: '/muestra.jpg', alt: 'Tratamientos dentales' },
    { src: '/fondodont.jpg', alt: 'Equipo odontológico' },
    { src: '/logoclinica.jpg', alt: 'Logo Clínica Odontológica Unifranz' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div id="acerca-de" className="acerca-de-container">
      <div className="acerca-de-content">
        <div className="texto-container">
          <div className="texto-inner">
            <span className="acerca-eyebrow">Conócenos</span>
            <h2>Acerca de Nosotros</h2>
            <div className="separator"></div>
            <p>
              Bienvenidos a la Clínica Odontológica Unifranz, tu clínica odontológica de confianza en Cochabamba, Bolivia. Con años de experiencia en el cuidado y tratamiento dental, nuestro equipo de profesionales odontólogos está comprometido con la salud bucal y el bienestar de toda tu familia.
            </p>
            <p>
              Ofrecemos una amplia gama de servicios odontológicos, incluyendo limpiezas profesionales, blanqueamientos, ortodoncia, implantes, endodoncia y odontopediatría. Nuestras instalaciones están equipadas con tecnología de vanguardia para garantizar el mejor cuidado dental.
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="material-icons">verified</span>
                <span><strong>Equipo especializado:</strong> odontólogos con amplia experiencia.</span>
              </div>
              <div className="feature-item">
                <span className="material-icons">biotech</span>
                <span><strong>Tecnología de vanguardia:</strong> instalaciones modernas y seguras.</span>
              </div>
              <div className="feature-item">
                <span className="material-icons">favorite</span>
                <span><strong>Atención familiar:</strong> cuidados para todas las edades.</span>
              </div>
            </div>
            <div className="ubicacion-container">
              <h3><span className="material-icons">place</span> Nuestra Ubicación</h3>
              <p>Estamos ubicados en la Av. Santa Cruz esquina y Calle Tomás Frías. Edificio Continental: Planta Baja.</p>
              <p className="ubicacion-horario"><span className="material-icons">schedule</span> Horario: Lunes a viernes</p>
              <a href="https://share.google/STcR7B0xZ9S6MaxwL" target="_blank" rel="noopener noreferrer" className="mapa-button">
                <span className="material-icons">map</span>
                Ver en Google Maps
              </a>
            </div>
            <button 
              className="login-redirect-button" 
              onClick={() => navigate('/login')}
            >
              Acceder al Portal
            </button>
          </div>
        </div>
        <div className="imagen-container">
          <button className="carousel-button prev" onClick={prevImage} aria-label="Anterior">
            <span className="material-icons">chevron_left</span>
          </button>
          <div className="carousel-images">
            {images.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className={`acerca-de-imagen ${index === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
          <button className="carousel-button next" onClick={nextImage} aria-label="Siguiente">
            <span className="material-icons">chevron_right</span>
          </button>
          <div className="carousel-dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcercaDe;