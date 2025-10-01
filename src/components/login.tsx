import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserRedirect from './usuarios/UserRedirect';
import './login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor' | null>(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar si viene de la sroles
  useEffect(() => {
    const state = location.state as any;
    if (state?.simulatedLogin) {
      // Establecer los datos del usuario simulado
      setEmail(state.userEmail || '');
      setPassword(state.userPassword || '123456');
      setUserType(state.userType);
      setUserName(state.userName);
      
      // Si queremos autenticar automáticamente, descomentar la siguiente línea
      // setAuthenticated(true);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Aquí se implementaría la lógica de autenticación real
    // Por ahora, solo simulamos un proceso de autenticación
    try {
      // Simulación de verificación
      if (email && password) {
        // Simulación de tiempo de respuesta del servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulación de determinación del tipo de usuario basado en el correo
        // En una aplicación real, esto vendría del backend
        let userRole: 'administrador' | 'cajero' | 'doctor' | 'estudiante' | 'inventario' | 'proveedor';
        let name = '';
        
        if (email.includes('admin')) {
          userRole = 'administrador';
          name = 'Admin Principal';
        } else if (email.includes('cajero')) {
          userRole = 'cajero';
          name = 'Juan Pérez';
        } else if (email.includes('doctor') || email.includes('docente')) {
          userRole = 'doctor';
          name = 'Dr. Carlos Mendoza';
        } else if (email.includes('estudiante')) {
          userRole = 'estudiante';
          name = 'Pedro Gómez';
        } else if (email.includes('inventario')) {
          userRole = 'inventario';
          name = 'María López';
        } else if (email.includes('proveedor')) {
          userRole = 'proveedor';
          name = 'Dental Supplies S.A.';
        } else {
          // Por defecto, asignamos rol de estudiante
          userRole = 'estudiante';
          name = 'Estudiante';
        }
        
        // Autenticación exitosa (simulada)
        console.log('Usuario autenticado:', email, 'Tipo:', userRole);
        setUserType(userRole);
        setUserName(name);
        setAuthenticated(true);
      } else {
        setError('Por favor, complete todos los campos');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtelo de nuevo.');
      console.error('Error de autenticación:', err);
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario está autenticado, redirigir al dashboard correspondiente
  if (authenticated && userType && userName) {
    return <UserRedirect userType={userType} userName={userName} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Iniciar Sesión</h2>
          <div className="login-separator"></div>
        </div>
        
        {error && <div className="login-error">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </button>
          </div>
          
          <div className="login-links">
            <a href="#" className="forgot-password">¿Olvidó su contraseña?</a>
            <a onClick={() => navigate('/register')} className="register-link">Registrarse</a>
          </div>
        </form>
        
        <div className="login-hint">
        </div>
      </div>
    </div>
  );
};

export default Login;