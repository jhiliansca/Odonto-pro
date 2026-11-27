import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Services.css';

const categories = [
  'Todos',
  'Prevención',
  'Estética',
  'Ortodoncia',
  'Rehabilitación',
  'Infantil',
  'Urgencias',
];

const services = [
  {
    icon: 'cleaning_services',
    title: 'Limpieza Dental Profesional',
    description: 'Eliminación de placa y sarro con tecnología ultrasónica para una sonrisa brillante.',
    image: '/dientesfondo.jpg',
    category: 'Prevención',
    duration: '45 min',
    tag: 'Más solicitado',
  },
  {
    icon: 'auto_awesome',
    title: 'Blanqueamiento Dental',
    description: 'Tratamientos avanzados para aclarar el tono de tus dientes de forma segura y efectiva.',
    image: '/muestra.jpg',
    category: 'Estética',
    duration: '60 min',
  },
  {
    icon: 'bubble_chart',
    title: 'Ortodoncia',
    description: 'Brackets tradicionales, transparentes e invisibles para corregir la alineación dental.',
    image: '/Digital.jpg',
    category: 'Ortodoncia',
    duration: 'Evaluación 30 min',
  },
  {
    icon: 'healing',
    title: 'Implantes Dentales',
    description: 'Soluciones permanentes para reemplazar dientes perdidos con resultados naturales.',
    image: '/fondodont.jpg',
    category: 'Rehabilitación',
    duration: 'Valoración 40 min',
  },
  {
    icon: 'child_care',
    title: 'Odontopediatría',
    description: 'Cuidado dental especializado para niños en un ambiente amigable y seguro.',
    image: '/dientesfondo.jpg',
    category: 'Infantil',
    duration: '30 min',
    tag: 'Para toda la familia',
  },
  {
    icon: 'biotech',
    title: 'Endodoncia',
    description: 'Tratamientos de conducto con mínimo dolor y máxima precisión para salvar tus dientes.',
    image: '/muestra.jpg',
    category: 'Rehabilitación',
    duration: '60 – 90 min',
  },
  {
    icon: 'face',
    title: 'Estética Dental',
    description: 'Carillas, coronas y restauraciones para transformar completamente tu sonrisa.',
    image: '/Digital.jpg',
    category: 'Estética',
    duration: 'Valoración 40 min',
  },
  {
    icon: 'water_drop',
    title: 'Periodoncia',
    description: 'Diagnóstico y tratamiento de encías para detener la pérdida de soporte dental.',
    image: '/dientesfondo.jpg',
    category: 'Prevención',
    duration: '45 min',
  },
  {
    icon: 'emergency',
    title: 'Urgencias Dentales',
    description: 'Atención inmediata para dolor intenso, inflamación o traumatismos dentales.',
    image: '/fondodont.jpg',
    category: 'Urgencias',
    duration: 'Atención prioritaria',
    tag: 'Atención inmediata',
  },
];

const steps = [
  { icon: 'search', title: 'Elige tu tratamiento', text: 'Explora las opciones y filtra por lo que necesitas.' },
  { icon: 'calendar_month', title: 'Agenda tu cita', text: 'Escríbenos y coordinamos el horario que más te convenga.' },
  { icon: 'sentiment_satisfied_alt', title: 'Sonríe con confianza', text: 'Recibe un plan claro y un acompañamiento cercano.' },
];

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filteredServices = useMemo(
    () =>
      activeCategory === 'Todos' ? services
        : services.filter((service) => service.category === activeCategory),
    [activeCategory]
  );

  return (
    <section className="services-page">
      <div className="services-container">
        <div className="services-heading">
          <span className="services-eyebrow">¿Qué podemos hacer por ti</span>
          <h1 className="services-title">Nuestros Servicios</h1>
          <p className="services-subtitle">
            Tratamientos de alta calidad con materiales de última generación y un equipo
            altamente capacitado. Encuentra el cuidado que tu sonrisa necesita.
          </p>
        </div>

        <div className="services-steps">
          {steps.map((step, index) => (
            <div className="services-step" key={step.title}>
              <span className="services-step-number">{index + 1}</span>
              <span className="services-step-icon material-icons">{step.icon}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="services-toolbar">
          <div className="services-filters" role="group" aria-label="Filtrar servicios por categoría">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`services-filter ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
          <span className="services-count" aria-live="polite">
            {filteredServices.length} de {services.length} tratamientos
          </span>
        </div>

        {filteredServices.length > 0 ? (
          <div className="services-grid">
            {filteredServices.map((service) => (
              <article className="service-card" key={service.title}>
                <div className="service-image-container">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="service-image"
                    loading="lazy"
                  />
                  <span className="service-category">{service.category}</span>
                  {service.tag && <span className="service-tag">{service.tag}</span>}
                  <span className="service-icon">
                    <span className="material-icons">{service.icon}</span>
                  </span>
                </div>
                <div className="service-body">
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                  <div className="service-meta">
                    <span className="material-icons">schedule</span>
                    {service.duration}
                  </div>
                  <Link
                    to={`/contactosservicio=${encodeURIComponent(service.title)}`}
                    className="service-button"
                  >
                    Agendar cita
                    <span className="material-icons">arrow_forward</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="services-empty">
            <span className="material-icons">search_off</span>
            <h2>No encontramos servicios en esta categoría</h2>
            <p>Prueba con otra categoría o contáctanos para orientarte.</p>
            <button type="button" className="services-filter active" onClick={() => setActiveCategory('Todos')}>
              Ver todos los servicios
            </button>
          </div>
        )}

        <div className="services-help">
          <span className="services-help-icon material-icons">support_agent</span>
          <div className="services-help-copy">
            <h2>¿No sabes qué tratamiento necesitas</h2>
            <p>
              Agenda una valoración y te ayudamos a encontrar la mejor opción para tu
              salud bucal, sin compromiso.
            </p>
          </div>
          <div className="services-help-actions">
            <Link to="/contactos" className="services-help-button">
              <span className="material-icons">event</span>
              Agendar valoración
            </Link>
            <a href="tel:+59112345678" className="services-help-phone">
              <span className="material-icons">call</span>
              +591 12345678
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
