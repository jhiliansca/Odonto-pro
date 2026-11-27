import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserRedirect from './usuarios/UserRedirect';
import { login, displayName, type AuthUser, type Role } from '../services/authApi';
import './login.css';

const CUENTAS: { rol: Role; email: string; password: string }[] = [
  { rol: 'administrador', email: 'admin@odontopro.local', password: 'Admin123!' },
  { rol: 'docente', email: 'docente@odontopro.local', password: 'Docente123!' },
  { rol: 'estudiante', email: 'estudiante@odontopro.local', password: 'Estudiante123!' },
  { rol: 'recepcionista', email: 'recepcionista@odontopro.local', password: 'Recepcion123!' },
  { rol: 'inventario', email: 'inventario@odontopro.local', password: 'Inventario123!' },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { userEmail: string; userPassword: string } | null;
    if (state?.userEmail) {
      setEmail(state.userEmail);
      setPassword(state.userPassword || '123456');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email, password });
      localStorage.setItem('odontopro_user', JSON.stringify(user));
      setAuthenticatedUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (authenticatedUser) {
    return (
      <UserRedirect
        userType={authenticatedUser.rol}
        userName={displayName(authenticatedUser)}
      />
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <img src="/logoclinica.jpg" alt="Logo" />
            <div>
              <h2>Clínica Odontológica Unifranz</h2>
              <p>Sistema de gestin odontolgica Odonto-Pro</p>
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
            <p>Ingresa tus credenciales registradas para acceder al portal.</p>
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
                  placeholder="nombre@odontopro.local"
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
            <button type="button" className="auth-link-button" onClick={() => navigate('/')}> Volver al inicio</button>
            <button type="button" className="auth-link-button" onClick={() => navigate('/register')}>No tiene cuenta Regístrese</button>
          </div>

          <div className="auth-demo">
            <p className="auth-demo-title"><span className="material-icons">info_outline</span> Cuentas iniciales registradas</p>
            <div className="auth-demo-chips">
              {CUENTAS.map((cuenta) => (
                <span key={cuenta.email}>{cuenta.email} / {cuenta.password}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
