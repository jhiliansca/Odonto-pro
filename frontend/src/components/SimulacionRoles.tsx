import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, displayName, dashboardPath } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import './SimulacionRoles.css';

function iconoRol(rol: AuthUser['rol']): string {
  if (rol === 'administrador') return 'admin_panel_settings';
  if (rol === 'docente') return 'medical_services';
  if (rol === 'recepcionista') return 'support_agent';
  if (rol === 'cajero') return 'payments';
  if (rol === 'estudiante') return 'school';
  if (rol === 'inventario') return 'inventory';
  if (rol === 'proveedor') return 'local_shipping';
  return 'person';
}

const SimulacionRoles: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<AuthUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    fetchUsers()
      .then(datos => {
        if (!activo) return;
        setUsuarios(datos);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setUsuarios([]);
        setSelectedUser(null);
        setError(err instanceof Error ? err.message : 'No se pudo cargar la información real.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="simulacion-container">
      <h1>Simulación de Roles - Clínica Odontológica Unifranz</h1>
      <p className="descripcion-general">
        Cuentas iniciales reales registradas en el sistema. Seleccione una para consultar sus datos.
      </p>

      {error ? (
        <div className="rol-detalle" role="alert">
          <p className="rol-descripcion">{error}</p>
        </div>
      ) : null}

      {cargando ? (
        <div className="rol-detalle">
          <p className="rol-descripcion">Cargando cuentas registradas…</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="rol-detalle">
          <p className="rol-descripcion">No hay registros reales registrados</p>
        </div>
      ) : (
        <>
          <div className="roles-grid">
            {usuarios.map(usuario => (
              <div
                key={usuario.id}
                className={`rol-card ${selectedUser?.id === usuario.id ? 'selected' : ''}`}
                onClick={() => setSelectedUser(usuario)}
                style={{ borderColor: selectedUser?.id === usuario.id ? '#00BCD4' : '#ddd' }}
              >
                <div className="rol-icon" style={{ backgroundColor: '#00BCD4' }}>
                  <span className="material-icons">{iconoRol(usuario.rol)}</span>
                </div>
                <h3>{displayName(usuario)}</h3>
                <p className="rol-tipo">{usuario.rol}</p>
                <p className="rol-email">{usuario.email}</p>
              </div>
            ))}
          </div>

          {selectedUser ? (
            <div className="rol-detalle">
              <h2>Cuenta registrada: {displayName(selectedUser)}</h2>
              <p className="rol-descripcion">
                Rol {selectedUser.rol}. Estado {selectedUser.estado}. No se almacenan contraseñas en esta vista.
              </p>

              <div className="rol-info-container">
                <div className="rol-funciones">
                  <h3>Datos de la cuenta</h3>
                  <ul>
                    <li>Correo: {selectedUser.email}</li>
                    <li>Rol: {selectedUser.rol}</li>
                    <li>Estado: {selectedUser.estado}</li>
                    {selectedUser.empresa ? <li>Empresa: {selectedUser.empresa}</li> : null}
                    {selectedUser.especialidad ? <li>Especialidad: {selectedUser.especialidad}</li> : null}
                    {selectedUser.semestre ? <li>Semestre: {selectedUser.semestre}</li> : null}
                  </ul>
                </div>

                <div className="rol-rutas">
                  <h3>Acceso según rol</h3>
                  <ul>
                    <li>{dashboardPath(selectedUser.rol)}</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                className="login-button"
                onClick={() => navigate('/login', { state: { userEmail: selectedUser.email } })}
              >
                Continuar con {selectedUser.email}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default SimulacionRoles;
