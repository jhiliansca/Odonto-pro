import './Services.css';

const services = [
  {
    icon: 'cleaning_services',
    title: 'Limpieza Dental Profesional',
    description: 'Eliminación de placa y sarro con tecnología ultrasónica para una sonrisa brillante.',
    image: '/dientesfondo.jpg',
    button: 'Agendar cita',
  },
  {
    icon: 'auto_awesome',
    title: 'Blanqueamiento Dental',
    description: 'Tratamientos avanzados para aclarar el tono de tus dientes de forma segura y efectiva.',
    image: '/muestra.jpg',
    button: 'Ver opciones',
  },
  {
    icon: 'bubble_chart',
    title: 'Ortodoncia',
    description: 'Brackets tradicionales, transparentes e invisibles para corregir la alineación dental.',
    image: '/Digital.jpg',
    button: 'Consulta gratis',
  },
  {
    icon: 'link',
    title: 'Implantes Dentales',
    description: 'Soluciones permanentes para reemplazar dientes perdidos con resultados naturales.',
    image: '/fondodont.jpg',
    button: 'Más información',
  },
  {
    icon: 'child_care',
    title: 'Odontopediatría',
    description: 'Cuidado dental especializado para niños en un ambiente amigable y seguro.',
    image: '/dientesfondo.jpg',
    button: 'Reservar consulta',
  },
  {
    icon: 'healing',
    title: 'Endodoncia',
    description: 'Tratamientos de conducto con mínimo dolor y máxima precisión para salvar tus dientes.',
    image: '/muestra.jpg',
    button: 'Conocer más',
  },
  {
    icon: 'face',
    title: 'Estética Dental',
    description: 'Carillas, coronas y restauraciones para transformar completamente tu sonrisa.',
    image: '/Digital.jpg',
    button: 'Ver tratamientos',
  },
];

const Services = () => {
  return (
    <div className="services-container">
      <div className="services-heading">
        <span className="services-eyebrow">¿Qué podemos hacer por ti?</span>
        <h1 className="services-title">Nuestros Servicios</h1>
        <p className="services-subtitle">Tratamientos de alta calidad con materiales de última generación y un equipo altamente capacitado.</p>
      </div>
      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-image-container">
              <img src={service.image} alt={service.title} className="service-image" />
              <span className="service-icon"><span className="material-icons">{service.icon}</span></span>
            </div>
            <div className="service-body">
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <button className="service-button">
                {service.button}
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;