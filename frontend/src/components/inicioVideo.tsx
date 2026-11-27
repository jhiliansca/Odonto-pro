import React from 'react';
import { Link } from 'react-router-dom';
import dentalVideo from '../assets/dental.mp4';
import './inicioVideo.css';

const trustItems = [
  { icon: 'verified', text: 'Especialistas certificados' },
  { icon: 'biotech', text: 'Tecnología de vanguardia' },
  { icon: 'favorite', text: 'Atención cercana y personalizada' },
];

const stats = [
  { value: '+15', label: 'Años de experiencia', icon: 'workspace_premium' },
  { value: '+5.000', label: 'Pacientes atendidos', icon: 'groups' },
  { value: '12', label: 'Especialistas', icon: 'medical_services' },
  { value: '98%', label: 'Satisfacción', icon: 'sentiment_satisfied_alt' },
];

const reasons = [
  {
    icon: 'biotech',
    title: 'Diagnóstico preciso',
    text: 'Estudios y equipos digitales que nos permiten detectar a tiempo lo que tu sonrisa necesita.',
  },
  {
    icon: 'health_and_safety',
    title: 'Protocolos seguros',
    text: 'Bioseguridad, esterilización y materiales certificados en cada tratamiento.',
  },
  {
    icon: 'favorite',
    title: 'Atención humana',
    text: 'Escuchamos tus necesidades y explicamos cada paso para que te sientas en confianza.',
  },
  {
    icon: 'calendar_month',
    title: 'Citas flexibles',
    text: 'Horarios pensados para tu rutina, con recordatorios y seguimiento personalizado.',
  },
];

const featuredServices = [
  {
    title: 'Limpieza dental',
    text: 'Prevención y frescura para toda la familia.',
    image: '/dientesfondo.jpg',
    icon: 'cleaning_services',
    link: '/contactosservicio=Limpieza%20dental',
  },
  {
    title: 'Ortodoncia',
    text: 'Alineamos tu sonrisa con opciones discretas y cómodas.',
    image: '/Digital.jpg',
    icon: 'bubble_chart',
    link: '/contactosservicio=Ortodoncia',
  },
  {
    title: 'Implantes dentales',
    text: 'Recupera la función y la estética de tu sonrisa.',
    image: '/fondodont.jpg',
    icon: 'healing',
    link: '/contactosservicio=Implantes%20dentales',
  },
];

const InicioVideo: React.FC = () => {
  return (
    <>
      <section id="inicio" className="inicio-container">
        <video autoPlay loop muted playsInline poster="/dientesfondo.jpg" className="inicio-video">
          <source src={dentalVideo} type="video/mp4" />
        </video>
        <div className="inicio-overlay" />

        <div className="hero-content">
          <div className="overlay-text">
            <span className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true" />
              Clínica Odontológica Unifranz
            </span>
            <h1>
              Tu sonrisa merece
              <span className="hero-highlight">atención de expertos</span>
            </h1>
            <p>
              Cuidamos tu salud bucal con tecnología de punta y un equipo profesional
              dedicado a tu bienestar. Una experiencia cómoda, segura y pensada para ti.
            </p>
            <div className="hero-actions">
              <Link to="/contactos" className="hero-btn hero-btn-primary">
                <span className="material-icons">calendar_month</span>
                Agendar una cita
              </Link>
              <Link to="/servicio" className="hero-btn hero-btn-ghost">
                Conocer servicios
                <span className="material-icons">arrow_forward</span>
              </Link>
            </div>
            <ul className="hero-trust">
              {trustItems.map((item) => (
                <li key={item.text}>
                  <span className="material-icons">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <aside className="hero-card" aria-label="Información rápida de la clínica">
            <div className="hero-card-header">
              <span className="hero-card-icon material-icons">health_and_safety</span>
              <div>
                <span className="hero-card-label">Atención odontológica integral</span>
                <strong className="hero-card-title">Cuidamos cada detalle de tu sonrisa</strong>
              </div>
            </div>

            <div className="hero-card-hours">
              <div>
                <span className="material-icons">schedule</span>
                <div>
                  <small>Lun – Vie</small>
                  <strong>8:00 – 20:00</strong>
                </div>
              </div>
              <div>
                <span className="material-icons">event_available</span>
                <div>
                  <small>Sábados</small>
                  <strong>9:00 – 14:00</strong>
                </div>
              </div>
            </div>

            <div className="hero-card-footer">
              <div className="hero-rating">
                <span className="material-icons">star</span>
                <strong>4.9</strong>
                <small>/ 5 · +5.000 pacientes</small>
              </div>
              <a href="tel:+59112345678" className="hero-card-link">
                Llamar
                <span className="material-icons">call</span>
              </a>
            </div>
          </aside>
        </div>

        <a href="#por-que-elegirnos" className="hero-scroll" aria-label="Ver más información">
          <span>Descubre más</span>
          <span className="material-icons">expand_more</span>
        </a>
      </section>

      <section className="home-stats" aria-label="Indicadores de la clínica">
        <div className="home-stats-grid">
          {stats.map((stat) => (
            <div className="home-stat" key={stat.label}>
              <span className="material-icons">{stat.icon}</span>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="por-que-elegirnos" className="home-section home-why">
        <div className="home-heading">
          <span className="home-eyebrow">¿Por qué elegirnos</span>
          <h2>Más que un tratamiento, una experiencia de cuidado</h2>
          <p>
            Combinamos experiencia profesional, tecnología y calidez humana para que
            cada visita sea tranquila y confiable.
          </p>
        </div>
        <div className="home-reasons">
          {reasons.map((reason) => (
            <article className="home-reason-card" key={reason.title}>
              <span className="home-reason-icon material-icons">{reason.icon}</span>
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-featured">
        <div className="home-heading home-heading-row">
          <div>
            <span className="home-eyebrow">Tratamientos destacados</span>
            <h2>Soluciones para cada etapa de tu sonrisa</h2>
          </div>
          <Link to="/servicio" className="home-link">
            Ver todos los servicios
            <span className="material-icons">arrow_forward</span>
          </Link>
        </div>

        <div className="home-featured-grid">
          {featuredServices.map((service) => (
            <Link to={service.link} className="home-featured-card" key={service.title}>
              <div className="home-featured-image">
                <img src={service.image} alt={service.title} loading="lazy" />
                <span className="home-featured-icon material-icons">{service.icon}</span>
              </div>
              <div className="home-featured-body">
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span className="home-featured-cta">
                  Agendar valoración
                  <span className="material-icons">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section home-cta">
        <div className="home-cta-card">
          <div className="home-cta-copy">
            <span className="home-cta-eyebrow">Tu primera consulta</span>
            <h2>Da el primer paso hacia una sonrisa más sana</h2>
            <p>
              Agenda tu valoración y recibe un plan de tratamiento claro, sin compromiso
              y adaptado a tus necesidades.
            </p>
          </div>
          <div className="home-cta-actions">
            <Link to="/contactos" className="home-cta-button">
              <span className="material-icons">event</span>
              Agendar cita
            </Link>
            <a href="tel:+59112345678" className="home-cta-phone">
              <span className="material-icons">call</span>
              +591 12345678
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default InicioVideo;
