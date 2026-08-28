import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    ci: '',
    tipoUsuario: '',
    especialidad: '',
    semestre: '',
    empresa: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!formData.tipoUsuario) {
      setError('Por favor, seleccione un tipo de usuario');
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Usuario registrado:', formData);
      navigate('/login');
    } catch {
      setError('Error al registrar usuario. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderCamposAdicionales = () => {
    switch (formData.tipoUsuario) {
      case 'doctor':
        return (
          <div className="form-group">
            <label htmlFor="especialidad">Especialidad</label>
            <input
              type="text"
              id="especialidad"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              placeholder="Ej: Ortodoncia, Endodoncia, etc."
              required
            />
          </div>
        );
      case 'estudiante':
        return (
          <div className="form-group">
            <label htmlFor="semestre">Semestre</label>
            <input
              type="text"
              id="semestre"
              name="semestre"
              value={formData.semestre}
              onChange={handleChange}
              placeholder="Ej: 5to semestre"
              required
            />
          </div>
        );
      case 'proveedor':
        return (
          <div className="form-group">
            <label htmlFor="empresa">Empresa</label>
            <input
              type="text"
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              placeholder="Nombre de la empresa"
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="register-page">
      <div className="register-brand-panel">
        <div className="register-brand-inner">
          <div className="auth-logo">
            <img src="/logoclinica.jpg" alt="Logo" />
            <div>
              <h2>Clínica Odontológica Unifranz</h2>
              <p>Portal de usuarios</p>
            </div>
          </div>
          <div className="auth-brand-quote">
            <h3>Crea tu cuenta</h3>
            <p>Forma parte de la comunidad Unifranz. Accede como cajero, doctor, estudiante, control de inventario o proveedor.</p>
          </div>
          <ul className="auth-benefits">
            <li><span className="material-icons">check_circle</span> Registro rápido y seguro</li>
            <li><span className="material-icons">check_circle</span> Acceso personalizado según tu rol</li>
            <li><span className="material-icons">check_circle</span> Soporte a tu disposición</li>
          </ul>
        </div>
      </div>

      <div className="register-card-panel">
        <div className="register-card">
          <div className="auth-card-header">
            <span className="auth-eyebrow">Únete a nosotros</span>
            <h1>Registrarse</h1>
            <p>Complete la información solicitada para crear su cuenta.</p>
          </div>

          {error && <div className="auth-alert"><span className="material-icons">error_outline</span>{error}</div>}

          <form className="register-form" onSubmit={handleSubmit}>
            <h3 className="register-section-title"><span className="material-icons">person_outline</span> Datos personales</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ingrese su nombre"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Ingrese su apellido"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipoUsuario">Tipo de Usuario</label>
                <select
                  id="tipoUsuario"
                  name="tipoUsuario"
                  value={formData.tipoUsuario}
                  onChange={handleChange}
                  className="select-tipo-usuario"
                >
                  <option value="">Seleccione un tipo de usuario</option>
                  <option value="cajero">Cajero</option>
                  <option value="doctor">Doctor/Docente</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="jefe_inventario">Jefe Control de Inventario</option>
                  <option value="proveedor">Proveedor</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 70123456"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ci">Cédula de Identidad</label>
                <input
                  type="text"
                  id="ci"
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>
            </div>

            <h3 className="register-section-title"><span className="material-icons">lock_outline</span> Datos de acceso</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme su contraseña"
                  required
                />
              </div>
            </div>

            {renderCamposAdicionales()}

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Procesando...</> : 'Crear Cuenta'}
            </button>

            <div className="auth-links register-links">
              <span className="register-has-account">¿Ya tienes una cuenta?</span>
              <button
                className="auth-link-button"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;