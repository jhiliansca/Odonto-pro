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

  useEffect(() => {
    const state = location.state as any;
    if (state?.simulatedLogin) {
      setEmail(state.userEmail || '');
      setPassword(state.userPassword || '123456');
      setUserType(state.userType);
      setUserName(state.userName);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password) {
        await new Promise(resolve => setTimeout(resolve, 1000));

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
          userRole = 'estudiante';
          name = 'Estudiante';
        }

        setUserType(userRole);
        setUserName(name);
        setAuthenticated(true);
      } else {
        setError('Por favor, complete todos los campos');
      }
    } catch {
      setError('Error al iniciar sesión. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (authenticated && userType && userName) {
    return <UserRedirect userType={userType} userName={userName} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <img src="/logoclinica.jpg" alt="Logo" />
            <div>
              <h2>Clínica Odontológica Unifranz</h2>
              <p>Portal de usuarios</p>
            </div>
          </div>
          <div className="auth-brand-quote">
            <h3>Tu salud bucal, en buenas manos</h3>
            <p>Accede al panel de administración, agenda tus citas, gestiona inventario y mucho más desde un solo lugar.</p>
          </div>
          <ul className="auth-benefits">
            <li><span className="material-icons">check_circle</span> Gestión de citas y pacientes</li>
            <li><span className="material-icons">check_circle</span> Control de inventario y proveedores</li>
            <li><span className="material-icons">check_circle</span> Historial clínico y reportes</li>
            <li><span className="material-icons">check_circle</span> Acceso por rol especializado</li>
          </ul>
        </div>
      </div>

      <div className="auth-card-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-eyebrow">Bienvenido de nuevo</span>
            <h1>Iniciar Sesión</h1>
            <p>Ingresa tus credenciales para acceder al portal.</p>
          </div>

          {error && <div className="auth-alert"><span className="material-icons">error_outline</span>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <div className="input-control">
                <span className="material-icons">mail_outline</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-control">
                <span className="material-icons">lock_outline</span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Procesando...</> : 'Ingresar al Portal'}
            </button>
          </form>

          <div className="auth-links">
            <a href="#" className="forgot-password">¿Olvidó su contraseña?</a>
            <button className="auth-link-button" onClick={() => navigate('/register')}>¿No tiene cuenta? Regístrese</button>
          </div>

          <div className="auth-demo">
            <p className="auth-demo-title"><span className="material-icons">info_outline</span> Modo demostración</p>
            <p>Use un correo con la palabra del rol para ingresar:</p>
            <div className="auth-demo-chips">
              <span>admin@correo.com</span>
              <span>doctor@correo.com</span>
              <span>estudiante@correo.com</span>
              <span>cajero@correo.com</span>
              <span>inventario@correo.com</span>
              <span>proveedor@correo.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;