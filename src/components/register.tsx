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
    especialidad: '', // Solo para doctores/docentes
    semestre: '', // Solo para estudiantes
    empresa: '', // Solo para proveedores
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
    
    // Validación básica
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
      // Simulación de registro en el servidor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Usuario registrado:', formData);
      // Redirigir al usuario a la página de login después del registro
      navigate('/login');
    } catch (err) {
      setError('Error al registrar usuario. Inténtelo de nuevo.');
      console.error('Error de registro:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizado condicional de campos adicionales según el tipo de usuario
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
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Registrarse</h2>
          <div className="register-separator"></div>
        </div>
        
        {error && <div className="register-error">{error}</div>}
        
        <form className="register-form" onSubmit={handleSubmit}>
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
          
          <div className="form-group">
            <label htmlFor="tipoUsuario">Tipo de Usuario</label>
            <select
              id="tipoUsuario"
              name="tipoUsuario"
              value={formData.tipoUsuario}
              onChange={handleChange}
              required
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
          
          {renderCamposAdicionales()}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="register-button" 
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Registrarse'}
            </button>
          </div>
          
          <div className="register-links">
            <span>¿Ya tienes una cuenta?</span>
            <a onClick={() => navigate('/login')} className="login-link">Iniciar Sesión</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;