import React, { useState } from 'react';
import './Contact.css';
import { guardarContacto } from '../services/api';
import { FaMapMarkerAlt, FaPhoneAlt, FaClock, FaEnvelope } from 'react-icons/fa';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    pais: '',
    telefono: '',
    mensaje: ''
  });

  const [errors, setErrors] = useState({
    nombre: '',
    email: '',
    pais: '',
    telefono: '',
    mensaje: ''
  });

  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\+?[0-9]{8,15}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    const newErrors: any = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
      valid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es obligatorio.';
      valid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'El correo no es válido.';
      valid = false;
    }
    if (!formData.pais.trim()) {
      newErrors.pais = 'El país es obligatorio.';
      valid = false;
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio.';
      valid = false;
    } else if (!validatePhone(formData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido.';
      valid = false;
    }
    if (!formData.mensaje.trim()) {
      newErrors.mensaje = 'El mensaje es obligatorio.';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await guardarContacto(formData);
      setResultado({ success: true, message: `${response.message} (ID: ${response.id})` });
      setFormData({ nombre: '', email: '', pais: '', telefono: '', mensaje: '' });
    } catch (error: any) {
      setResultado({ success: false, message: error.message });
    }
  };

  const infoItems = [
    { icon: <FaMapMarkerAlt />, label: 'Dirección', value: 'Av. Santa Cruz y Calle Tomás Frías, Edificio Continental, Planta Baja' },
    { icon: <FaPhoneAlt />, label: 'Teléfono', value: '+591 12345678' },
    { icon: <FaClock />, label: 'Horario', value: 'Lunes a Viernes, 8:00 – 20:00' },
    { icon: <FaEnvelope />, label: 'Correo', value: 'contacto@clinicaunifranz.com' },
  ];

  return (
    <section className="contact-section">
      <div className="contact-header">
        <span className="contact-eyebrow">Estamos para ayudarte</span>
        <h2>Contáctanos</h2>
        <p>Tienes alguna duda o deseas agendar una cita? Escríbenos y te responderemos a la brevedad.</p>
      </div>

      <div className="contact-layout">
        <div className="contact-info">
          {infoItems.map((item, index) => (
            <div className="contact-info-card" key={index}>
              <span className="contact-info-icon">{item.icon}</span>
              <div>
                <p className="contact-info-label">{item.label}</p>
                <p className="contact-info-value">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="contact-map-card">
            <span className="contact-info-icon"><FaMapMarkerAlt /></span>
            <div>
              <p className="contact-info-label">¿Cómo llegar?</p>
              <a
                href="https://share.google/STcR7B0xZ9S6MaxwL"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-link"
              >
                Ver en Google Maps
                <span className="material-icons">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        <div className="contact-form-card">
          <h3>Envíanos un mensaje</h3>
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Su nombre completo"
                  value={formData.nombre}
                  onChange={handleChange}
                />
                {errors.nombre && <span className="error">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pais">País</label>
                <input
                  type="text"
                  id="pais"
                  name="pais"
                  placeholder="Bolivia"
                  value={formData.pais}
                  onChange={handleChange}
                />
                {errors.pais && <span className="error">{errors.pais}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  placeholder="+591 70000000"
                  value={formData.telefono}
                  onChange={handleChange}
                />
                {errors.telefono && <span className="error">{errors.telefono}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea
                id="mensaje"
                name="mensaje"
                placeholder="Cuéntanos en qué podemos ayudarte..."
                value={formData.mensaje}
                onChange={handleChange}
              ></textarea>
              {errors.mensaje && <span className="error">{errors.mensaje}</span>}
            </div>

            <button type="submit" className="contact-submit">
              <span className="material-icons">send</span>
              Enviar Mensaje
            </button>

            {resultado && (
              <div className={`form-feedback ${resultado.success ? 'success' : 'error-feedback'}`}>
                {resultado.success && <span className="material-icons">check_circle</span>}
                {!resultado.success && <span className="material-icons">error_outline</span>}
                {resultado.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;