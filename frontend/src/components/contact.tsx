import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Contact.css';
import { guardarContacto } from '../services/api';
import { FaMapMarkerAlt, FaPhoneAlt, FaClock, FaEnvelope, FaWhatsapp, FaCheckCircle } from 'react-icons/fa';

const motivos = [
  { label: 'Agendar cita', icon: 'event_available' },
  { label: 'Consulta general', icon: 'chat_bubble_outline' },
  { label: 'Urgencia dental', icon: 'emergency' },
];

const faqs = [
  {
    question: '¿Necesito agendar una cita para ser atendido',
    answer: 'Recomendamos agendar con anticipación para elegir el horario que prefieras. También atendemos urgencias dentales el mismo día según disponibilidad.',
  },
  {
    question: '¿Atienden urgencias dentales',
    answer: 'Sí. Si tienes dolor intenso, inflamación o un traumatismo dental, contáctanos por teléfono o WhatsApp y te orientaremos de inmediato.',
  },
  {
    question: '¿Qué métodos de pago aceptan',
    answer: 'Aceptamos efectivo, tarjetas de débito y crédito, y transferencias bancarias. Consulta por planes de pago para tratamientos extensos.',
  },
  {
    question: '¿Atienden a niños y adultos mayores',
    answer: 'Sí, contamos con odontopediatría y atención adaptada para adultos mayores en un ambiente cómodo y seguro para toda la familia.',
  },
];

const Contact: React.FC = () => {
  const [searchParams] = useSearchParams();
  const servicioParam = searchParams.get('servicio') ?? '';

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    pais: '',
    telefono: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState({
    nombre: '',
    email: '',
    pais: '',
    telefono: '',
    mensaje: '',
  });

  const [motivo, setMotivo] = useState('Consulta general');
  const [isSending, setIsSending] = useState(false);
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (servicioParam) {
      setMotivo('Agendar cita');
      setFormData((prev) => ({
        ...prev,
        mensaje: `Hola, me gustaría agendar una cita para ${servicioParam}.`,
      }));
    }
  }, [servicioParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\+[0-9]{8,15}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let valid = true;
    const newErrors: { [key: string]: string } = {};

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
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setIsSending(true);
    setResultado(null);

    const mensajeFinal =
      motivo === 'Consulta general'
        ? formData.mensaje
        : `Motivo: ${motivo}\n\n${formData.mensaje}`;

    try {
      const response = await guardarContacto({ ...formData, mensaje: mensajeFinal });
      setResultado({ success: true, message: `${response.message} (ID: ${response.id})` });
      setFormData({ nombre: '', email: '', pais: '', telefono: '', mensaje: '' });
      setMotivo('Consulta general');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el mensaje. Intenta nuevamente.';
      setResultado({ success: false, message });
    } finally {
      setIsSending(false);
    }
  };

  const channels = [
    {
      icon: <FaWhatsapp />,
      label: 'WhatsApp',
      value: '+591 12345678',
      href: 'https://wa.me/59112345678',
      external: true,
    },
    {
      icon: <FaPhoneAlt />,
      label: 'Llámanos',
      value: '+591 12345678',
      href: 'tel:+59112345678',
      external: false,
    },
    {
      icon: <FaEnvelope />,
      label: 'Escríbenos',
      value: 'contacto@clinicaunifranz.com',
      href: 'mailto:contacto@clinicaunifranz.com',
      external: false,
    },
    {
      icon: <FaMapMarkerAlt />,
      label: 'Visítanos',
      value: 'Av. Santa Cruz y C. Tomás Frías, Edificio Continental, Planta Baja',
      href: 'https://share.google/STcR7B0xZ9S6MaxwL',
      external: true,
    },
  ];

  return (
    <section id="contacto" className="contact-section">
      <div className="contact-header">
        <span className="contact-eyebrow">Estamos para ayudarte</span>
        <h2>Contáctanos</h2>
        <p>
          ¿Tienes alguna duda o deseas agendar una cita Escríbenos y te responderemos
          a la brevedad.
        </p>
      </div>

      <div className="contact-layout">
        <div className="contact-info">
          <div className="contact-info-intro">
            <span className="contact-info-eyebrow">Canales directos</span>
            <h3>Estamos cerca de ti</h3>
            <p>Elige el medio que prefieras. Nuestro equipo está listo para orientarte.</p>
          </div>

          <div className="contact-channels">
            {channels.map((channel) => (
              <a
                className="contact-info-card"
                key={channel.label}
                href={channel.href}
                {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="contact-info-icon">{channel.icon}</span>
                <div>
                  <p className="contact-info-label">{channel.label}</p>
                  <p className="contact-info-value">{channel.value}</p>
                </div>
                <span className="material-icons contact-info-arrow">arrow_outward</span>
              </a>
            ))}
          </div>

          <div className="contact-hours-card">
            <span className="contact-info-icon"><FaClock /></span>
            <div>
              <p className="contact-info-label">Horario de atención</p>
              <p className="contact-info-value">Lun – Vie · 8:00 a 20:00</p>
              <p className="contact-hours-note">Sábados · 9:00 a 14:00</p>
            </div>
            <span className="contact-status">
              <span className="contact-status-dot" />
              Abierto
            </span>
          </div>

          <p className="contact-response">
            <FaCheckCircle />
            Respondemos en menos de 24 horas hábiles.
          </p>
        </div>

        <div className="contact-form-card">
          <div className="contact-form-heading">
            <h3>Envíanos un mensaje</h3>
            <p>Completa tus datos y nos pondremos en contacto contigo.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-motivos" role="group" aria-label="Motivo de contacto">
              {motivos.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`contact-motivo ${motivo === item.label ? 'active' : ''}`}
                  onClick={() => setMotivo(item.label)}
                  aria-pressed={motivo === item.label}
                >
                  <span className="material-icons">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">
                  Nombre completo <span className="required">*</span>
                </label>
                <div className={`input-shell ${errors.nombre ? 'has-error' : ''}`}>
                  <span className="material-icons">person</span>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    placeholder="Ej. María Pérez"
                    value={formData.nombre}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
                {errors.nombre && (
                  <span className="error">
                    <span className="material-icons">error_outline</span>
                    {errors.nombre}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Correo electrónico <span className="required">*</span>
                </label>
                <div className={`input-shell ${errors.email ? 'has-error' : ''}`}>
                  <span className="material-icons">mail</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="error">
                    <span className="material-icons">error_outline</span>
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pais">
                  País <span className="required">*</span>
                </label>
                <div className={`input-shell ${errors.pais ? 'has-error' : ''}`}>
                  <span className="material-icons">public</span>
                  <input
                    type="text"
                    id="pais"
                    name="pais"
                    placeholder="Bolivia"
                    value={formData.pais}
                    onChange={handleChange}
                    autoComplete="country-name"
                  />
                </div>
                {errors.pais && (
                  <span className="error">
                    <span className="material-icons">error_outline</span>
                    {errors.pais}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="telefono">
                  Teléfono <span className="required">*</span>
                </label>
                <div className={`input-shell ${errors.telefono ? 'has-error' : ''}`}>
                  <span className="material-icons">call</span>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    placeholder="+591 77928097"
                    value={formData.telefono}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
                {errors.telefono && (
                  <span className="error">
                    <span className="material-icons">error_outline</span>
                    {errors.telefono}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="mensaje">
                  Mensaje <span className="required">*</span>
                </label>
                <span className="char-count">{formData.mensaje.length}/500</span>
              </div>
              <textarea
                id="mensaje"
                name="mensaje"
                placeholder="Cuéntanos en qué podemos ayudarte..."
                value={formData.mensaje}
                onChange={handleChange}
                maxLength={500}
                className={errors.mensaje ? 'has-error' : ''}
              ></textarea>
              {errors.mensaje && (
                <span className="error">
                  <span className="material-icons">error_outline</span>
                  {errors.mensaje}
                </span>
              )}
            </div>

            <button type="submit" className="contact-submit" disabled={isSending}>
              <span className={`material-icons ${isSending ? 'spinning' : ''}`}>
                {isSending ? 'progress_activity' : 'send'}
              </span>
              {isSending ? 'Enviando...' : 'Enviar mensaje'}
            </button>

            <p className="contact-privacy">
              <span className="material-icons">lock</span>
              Tus datos están protegidos y solo se usan para responderte.
            </p>

            {resultado && (
              <div
                className={`form-feedback ${resultado.success ? 'success' : 'error-feedback'}`}
                role="status"
                aria-live="polite"
              >
                <span className="material-icons">
                  {resultado.success ? 'check_circle' : 'error_outline'}
                </span>
                {resultado.message}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="contact-faq">
        <div className="contact-faq-heading">
          <span className="contact-eyebrow">Antes de escribirnos</span>
          <h2>Preguntas frecuentes</h2>
        </div>
        <div className="contact-faq-list">
          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>
                {faq.question}
                <span className="material-icons">expand_more</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Contact;
