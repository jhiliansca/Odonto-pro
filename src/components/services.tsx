import React from 'react';
import './Services.css';

const services = [
  {
    title: 'Limpieza Dental Profesional',
    description: 'Eliminación de placa y sarro con tecnología ultrasónica para una sonrisa brillante.',
    image: '/dientesfondo.jpg',
    button: 'Agendar cita',
  },
  {
    title: 'Blanqueamiento Dental',
    description: 'Tratamientos avanzados para aclarar el tono de tus dientes de forma segura y efectiva.',
    image: '/muestra.jpg',
    button: 'Ver opciones',
  },
  {
    title: 'Ortodoncia',
    description: 'Brackets tradicionales, transparentes e invisibles para corregir la alineación dental.',
    image: '/Digital.jpg',
    button: 'Consulta gratis',
  },
  {
    title: 'Implantes Dentales',
    description: 'Soluciones permanentes para reemplazar dientes perdidos con resultados naturales.',
    image: '/fondodont.jpg',
    button: 'Más información',
  },
  {
    title: 'Odontopediatría',
    description: 'Cuidado dental especializado para niños en un ambiente amigable y seguro.',
    image: '/dientesfondo.jpg',
    button: 'Reservar consulta',
  },
  {
    title: 'Endodoncia',
    description: 'Tratamientos de conducto con mínimo dolor y máxima precisión para salvar tus dientes.',
    image: '/muestra.jpg',
    button: 'Conocer más',
  },
  {
    title: 'Estética Dental',
    description: 'Carillas, coronas y restauraciones para transformar completamente tu sonrisa.',
    image: '/Digital.jpg',
    button: 'Ver tratamientos',
  },
];

const Services = () => {
  return (
    <div className="services-container">
      <h1 className="services-title">Nuestros Servicios</h1>
      <p className="services-subtitle">Cuidamos a tus mascotas con amor y profesionalismo</p>
      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-image-container">
              <img src={service.image} alt={service.title} className="service-image" />
            </div>
            <h2>{service.title}</h2>
            <p>{service.description}</p>
            <button className="service-button">{service.button}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;