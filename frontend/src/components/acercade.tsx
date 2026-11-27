import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AcercaDe.css';

const images = [
  { src: '/dientesfondo.jpg', alt: 'Consultorio dental', caption: 'Instalaciones modernas y seguras' },
  { src: '/Digital.jpg', alt: 'Tecnología dental', caption: 'Tecnología al servicio de tu sonrisa' },
  { src: '/muestra.jpg', alt: 'Tratamientos dentales', caption: 'Tratamientos personalizados' },
  { src: '/fondodont.jpg', alt: 'Equipo odontológico', caption: 'Equipo especializado y cercano' },
  { src: '/logoclinica.jpg', alt: 'Logo Clínica Odontológica Unifranz', caption: 'Clínica Odontológica Unifranz' },
];

const stats = [
  { value: '+15', label: 'Años de experiencia', icon: 'workspace_premium' },
  { value: '+5.000', label: 'Pacientes atendidos', icon: 'groups' },
  { value: '12', label: 'Especialistas', icon: 'medical_services' },
  { value: '98%', label: 'Satisfacción', icon: 'sentiment_satisfied_alt' },
];

const values = [
  {
    icon: 'verified',
    title: 'Excelencia',
    text: 'Odontólogos con amplia experiencia y protocolos de calidad en cada tratamiento.',
  },
  {
    icon: 'biotech',
    title: 'Innovación',
    text: 'Instalaciones modernas y equipos de vanguardia para diagnósticos más precisos.',
  },
  {
    icon: 'favorite',
    title: 'Empatía',
    text: 'Atención familiar y cercana, pensada para todas las edades y necesidades.',
  },
];

const AcercaDe: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <section id="acerca-de" className="acerca-de-container">
      <div className="acerca-de-content">
        <div className="texto-container">
          <div className="texto-inner">
            <span className="acerca-eyebrow">Conócenos</span>
            <h2>Acerca de Nosotros</h2>
            <div className="separator" aria-hidden="true"></div>
            <p className="acerca-lead">
              Bienvenidos a la Clínica Odontológica Unifranz, tu clínica odontológica de
              confianza en Cochabamba, Bolivia. Con años de experiencia en el cuidado y
              tratamiento dental, nuestro equipo está comprometido con la salud bucal y el
              bienestar de toda tu familia.
            </p>
            <p>
              Ofrecemos una amplia gama de servicios odontológicos, incluyendo limpiezas
              profesionales, blanqueamientos, ortodoncia, implantes, endodoncia y
              odontopediatría. Nuestras instalaciones están equipadas con tecnología de
              vanguardia para garantizar el mejor cuidado dental.
            </p>

            <div className="about-values">
              {values.map((value) => (
                <article className="value-card" key={value.title}>
                  <span className="material-icons">{value.icon}</span>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </article>
              ))}
            </div>

            <div className="ubicacion-container">
              <div className="ubicacion-header">
                <span className="material-icons">place</span>
                <div>
                  <h3>Nuestra Ubicación</h3>
                  <p>Cochabamba, Bolivia</p>
                </div>
              </div>
              <div className="ubicacion-grid">
                <div className="ubicacion-item">
                  <span className="material-icons">location_on</span>
                  <div>
                    <strong>Dirección</strong>
                    <p>Av. Santa Cruz esquina y Calle Tomás Frías. Edificio Continental: Planta Baja.</p>
                  </div>
                </div>
                <div className="ubicacion-item">
                  <span className="material-icons">schedule</span>
                  <div>
                    <strong>Horario de atención</strong>
                    <p>Lunes a viernes · 8:00 a 20:00</p>
                  </div>
                </div>
              </div>
              <a
                href="https://share.google/STcR7B0xZ9S6MaxwL"
                target="_blank"
                rel="noopener noreferrer"
                className="mapa-button"
              >
                <span className="material-icons">map</span>
                Ver en Google Maps
              </a>
            </div>

            <div className="about-actions">
              <Link to="/contactos" className="about-primary">
                <span className="material-icons">event</span>
                Agendar una cita
              </Link>
              <Link to="/login" className="about-secondary">
                Acceder al Portal
                <span className="material-icons">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="imagen-container">
          <div className="carousel-images" aria-live="polite">
            {images.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className={`acerca-de-imagen ${index === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="carousel-caption">
            <span className="carousel-badge">
              <span className="material-icons">verified</span>
              Clínica certificada
            </span>
            <p>{images[currentIndex].caption}</p>
          </div>

          <button className="carousel-button prev" onClick={prevImage} aria-label="Imagen anterior">
            <span className="material-icons">chevron_left</span>
          </button>
          <button className="carousel-button next" onClick={nextImage} aria-label="Imagen siguiente">
            <span className="material-icons">chevron_right</span>
          </button>

          <div className="carousel-dots">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ver imagen ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>

          <div className="carousel-progress" aria-hidden="true">
            <span style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="about-stats">
        {stats.map((stat) => (
          <div className="about-stat" key={stat.label}>
            <span className="material-icons">{stat.icon}</span>
            <div>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AcercaDe;
