import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import {
  actualizarUser,
  cambiarEstadoUser,
  createUser,
  displayName,
  fetchUsers,
  getStoredUser,
  type AuthUser,
  type Role,
} from '../../../services/authApi';
import './Usuarios.css';

const ROLES: { value: Role; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'docente', label: 'Docente' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'proveedor', label: 'Proveedor' },
];

interface UserForm {
  nombre: string; apellido: string; email: string; rol: Role; telefono: string; ci: string; direccion: string;
  fechaNacimiento: string; genero: string; especialidad: string; tituloAcademico: string; departamento: string;
  horarioAtencion: string; biografia: string; semestre: string; tipoSemestre: string; carrera: string; grupo: string;
  turno: string; empresa: string; observaciones: string; password: string; confirmPassword: string;
}

interface Feedback {
  tipo: 'ok' | 'error';
  texto: string;
}

const FORMULARIO_VACIO: UserForm = {
  nombre:'', apellido:'', email:'', rol:'estudiante', telefono:'', ci:'', direccion:'', fechaNacimiento:'', genero:'',
  especialidad:'', tituloAcademico:'', departamento:'', horarioAtencion:'', biografia:'', semestre:'', tipoSemestre:'',
  carrera:'', grupo:'', turno:'', empresa:'', observaciones:'', password:'', confirmPassword:'',
};

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<AuthUser | null>(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);
  const [formulario, setFormulario] = useState<UserForm>(FORMULARIO_VACIO);

  const userName = useMemo(() => {
    const usuario = getStoredUser();
    return usuario ? displayName(usuario) : 'Administrador';
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga('');
    try {
      setUsuarios(await fetchUsers());
      return true;
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesTab =
      activeTab === 'todos' || (activeTab === 'activos' && usuario.estado === 'activo') || (activeTab === 'inactivos' && usuario.estado === 'inactivo') ||
      activeTab === usuario.rol;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(term) ||
      (usuario.apellido || '').toLowerCase().includes(term) ||
      usuario.email.toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.estado === 'activo').length,
  docentes: usuarios.filter((u) => u.rol === 'docente').length,
  estudiantes: usuarios.filter((u) => u.rol === 'estudiante').length,
  };

  const mostrarError = (err: unknown, texto: string) => {
    setFeedback({
      tipo: 'error',
      texto: err instanceof Error ? err.message : texto,
    });
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const abrirNuevo = () => {
    setFeedback(null);
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setShowModal(true);
  };

  const abrirEdicion = (usuario: AuthUser) => {
    setFeedback(null); setEditandoId(usuario.id);
    setFormulario({
      nombre: usuario.nombre, apellido: usuario.apellido || '', email: usuario.email, rol: usuario.rol,
      telefono: usuario.telefono || '', ci: usuario.ci || '', direccion: usuario.direccion || '',
      fechaNacimiento: usuario.fechaNacimiento || '', genero: usuario.genero || '', especialidad: usuario.especialidad || '',
      tituloAcademico: usuario.tituloAcademico || '', departamento: usuario.departamento || '', horarioAtencion: usuario.horarioAtencion || '',
      biografia: usuario.biografia || '', semestre: usuario.semestre || '', tipoSemestre: usuario.tipoSemestre || '',
      carrera: usuario.carrera || '', grupo: usuario.grupo || '', turno: usuario.turno || '', empresa: usuario.empresa || '',
      observaciones: usuario.observaciones || '', password: '', confirmPassword: '',
    });
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async () => {
    const nombre = formulario.nombre.trim();
    const email = formulario.email.trim();

    if (!nombre || !email) {
      setFeedback({ tipo: 'error', texto: 'Por favor complete el nombre y el correo electrónico.' });
      return;
    }
    if (editandoId === null && (!formulario.password || formulario.password !== formulario.confirmPassword)) {
      setFeedback({ tipo: 'error', texto: 'La contraseña y su confirmación deben coincidir.' });
      return;
    }

    setGuardando(true);
    setFeedback(null);
    try {
      if (editandoId !== null) {
        await actualizarUser(editandoId, {
          nombre,
          apellido: formulario.apellido.trim(),
          email,
          rol: formulario.rol,
          telefono: formulario.telefono.trim(),
        });
      } else {
        await createUser({
          nombre,
          apellido: formulario.apellido.trim(),
          email,
          password: formulario.password,
          tipoUsuario: formulario.rol,
          telefono: formulario.telefono.trim(),
        });
      }
      if (await cargar()) {
        setFeedback({
          tipo: 'ok',
          texto: editandoId !== null ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.',
        });
        cerrarModal();
      }
    } catch (err) {
      mostrarError(err, editandoId !== null ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const solicitarCambioEstado = (usuario: AuthUser) => {
    if (usuario.estado === 'activo' && getStoredUser()?.id === usuario.id) {
      setFeedback({
        tipo: 'error',
        texto: 'No puedes desactivar tu propia cuenta. Solicita este cambio a otro administrador.',
      });
      return;
    }
    setFeedback(null);
    setConfirmacion(usuario);
  };

  const handleCambiarEstado = async () => {
    if (!confirmacion || procesandoEstado) return;
    const usuario = confirmacion;
    const estado = usuario.estado === 'activo' ? 'inactivo' : 'activo';

    setProcesandoEstado(true);
    try {
      await cambiarEstadoUser(usuario.id, estado);
      setConfirmacion(null);
      if (await cargar()) {
        setFeedback({
          tipo: 'ok',
          texto:
            estado === 'inactivo' ? `Usuario ${displayName(usuario)} desactivado correctamente.`
              : `Usuario ${displayName(usuario)} reactivado correctamente.`,
        });
      }
    } catch (err) {
      setConfirmacion(null);
      mostrarError(err, 'No se pudo cambiar el estado del usuario');
    } finally {
      setProcesandoEstado(false);
    }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="usuarios-container">
        <div className="page-header">
          <h1>Gestión de Usuarios</h1>
          <button type="button" className="add-button" onClick={abrirNuevo}>
            <span className="material-icons">person_add</span>
            Nuevo Usuario
          </button>
        </div>

        {feedback ? (
          <div className={`usuarios-mensaje ${feedback.tipo}`} role={feedback.tipo === 'error' ? 'alert' : 'status'}>
            {feedback.texto}
          </div>
        ) : null}

        {errorCarga ? <ErrorState message={errorCarga} onRetry={() => void cargar()} /> : null}

        <div className="stats-grid">
          <Card title="Total Usuarios" value={stats.total} icon="people" color="#0ea5e9" />
          <Card title="Usuarios Activos" value={stats.activos} icon="check_circle" color="#16a34a" />
          <Card title="Docentes" value={stats.docentes} icon="medical_services" color="#0284c7" />
          <Card title="Estudiantes" value={stats.estudiantes} icon="school" color="#f59e0b" />
        </div>

        <div className="filter-container">
          <div className="tabs">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'activos', label: 'Activos' },
              { key: 'inactivos', label: 'Inactivos' },
              { key: 'docente', label: 'Docentes' },
              { key: 'estudiante', label: 'Estudiantes' },
              { key: 'recepcionista', label: 'Recepcionistas' },
              { key: 'inventario', label: 'Inventario' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState label="Cargando usuarios registrados..." />
        ) : filteredUsuarios.length === 0 ? (
          <EmptyState message="No se encontraron usuarios registrados con los filtros seleccionados." />
        ) : (
          <div className="usuarios-grid">
            {filteredUsuarios.map((usuario) => (
              <div key={usuario.id} className="usuario-card">
                <div className={`usuario-avatar ${usuario.estado}`}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="usuario-info">
                  <h3>{displayName(usuario)}</h3>
                  <p className="usuario-email">{usuario.email}</p>
                  <div className="usuario-meta">
                    <span className={`rol-badge ${usuario.rol}`}>{usuario.rol}</span>
                    <span className={`status-badge ${usuario.estado}`}>{usuario.estado}</span>
                  </div>
                  <p className="usuario-email">{usuario.fechaRegistro}</p>
                </div>
                <div className="usuario-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Editar a ${displayName(usuario)}`}
                    title="Editar"
                    disabled={procesandoEstado}
                    onClick={() => abrirEdicion(usuario)}
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  {usuario.estado === 'activo' ? (
                    <button
                      type="button"
                      className="icon-button danger"
                      aria-label={`Desactivar a ${displayName(usuario)}`}
                      title="Desactivar"
                      disabled={procesandoEstado}
                      onClick={() => solicitarCambioEstado(usuario)}
                    >
                      <span className="material-icons">person_off</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Reactivar a ${displayName(usuario)}`}
                      title="Reactivar"
                      disabled={procesandoEstado}
                      onClick={() => solicitarCambioEstado(usuario)}
                    >
                      <span className="material-icons">check_circle</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal ? (
          <div className="modal-overlay">
            <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editandoId !== null ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <button type="button" className="close-button" onClick={cerrarModal} aria-label="Cerrar"><span className="material-icons">close</span></button>
              </div>
              <div className="modal-body">
                <div className="form-section-title">Informacin bsica</div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="nombre">Nombre*</label><input id="nombre" name="nombre" value={formulario.nombre} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label htmlFor="apellido">Apellido</label><input id="apellido" name="apellido" value={formulario.apellido} onChange={handleInputChange} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="email">Email*</label><input type="email" id="email" name="email" value={formulario.email} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label htmlFor="rol">Rol*</label><select id="rol" name="rol" value={formulario.rol} onChange={handleInputChange}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="telefono">Telfono</label><input id="telefono" name="telefono" value={formulario.telefono} onChange={handleInputChange} /></div>
                  <div className="form-group"><label htmlFor="ci">CI</label><input id="ci" name="ci" value={formulario.ci} onChange={handleInputChange} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="direccion">Direccin</label><input id="direccion" name="direccion" value={formulario.direccion} onChange={handleInputChange} /></div>
                  <div className="form-group"><label htmlFor="fechaNacimiento">Fecha de nacimiento</label><input type="date" id="fechaNacimiento" name="fechaNacimiento" value={formulario.fechaNacimiento.slice(0,10) || ''} onChange={handleInputChange} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="genero">Gnero</label><select id="genero" name="genero" value={formulario.genero} onChange={handleInputChange}><option value="">Seleccionar</option><option value="femenino">Femenino</option><option value="masculino">Masculino</option><option value="otro">Otro</option><option value="prefiero_no_decir">Prefiero no decir</option></select></div>
                  <div className="form-group"><label htmlFor="empresa">Empresa/Institucin</label><input id="empresa" name="empresa" value={formulario.empresa} onChange={handleInputChange} /></div>
                </div>

                {formulario.rol === 'estudiante' && (<>
                  <div className="form-section-title">Informacin acadmica del estudiante</div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="semestre">Semestre que cursa</label><input id="semestre" name="semestre" value={formulario.semestre} onChange={handleInputChange} placeholder="Ej. 8" /></div>
                    <div className="form-group"><label htmlFor="tipoSemestre">Tipo de semestre</label><select id="tipoSemestre" name="tipoSemestre" value={formulario.tipoSemestre} onChange={handleInputChange}><option value="">Seleccionar</option><option value="Regular">Regular</option><option value="Regular - ltimo ao">Regular - ltimo ao</option><option value="Verano">Verano</option><option value="Rezagado">Rezagado</option><option value="Internado">Internado</option></select></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="carrera">Carrera/Programa</label><input id="carrera" name="carrera" value={formulario.carrera} onChange={handleInputChange} placeholder="Ej. Odontologa" /></div>
                    <div className="form-group"><label htmlFor="grupo">Grupo/Paralelo</label><input id="grupo" name="grupo" value={formulario.grupo} onChange={handleInputChange} placeholder="Ej. A" /></div>
                  </div>
                  <div className="form-group"><label htmlFor="turno">Turno</label><select id="turno" name="turno" value={formulario.turno} onChange={handleInputChange}><option value="">Seleccionar</option><option value="Maana">Maana</option><option value="Tarde">Tarde</option><option value="Noche">Noche</option></select></div>
                </>)}

                {formulario.rol === 'docente' && (<>
                  <div className="form-section-title">Informacin del docente</div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="especialidad">Especialidad</label><input id="especialidad" name="especialidad" value={formulario.especialidad} onChange={handleInputChange} /></div>
                    <div className="form-group"><label htmlFor="tituloAcademico">Ttulo acadmico</label><input id="tituloAcademico" name="tituloAcademico" value={formulario.tituloAcademico} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="departamento">Departamento/rea</label><input id="departamento" name="departamento" value={formulario.departamento} onChange={handleInputChange} /></div>
                    <div className="form-group"><label htmlFor="horarioAtencion">Horario de atencin</label><input id="horarioAtencion" name="horarioAtencion" value={formulario.horarioAtencion} onChange={handleInputChange} placeholder="Ej. Lun-Mie 08:00-12:00" /></div>
                  </div>
                  <div className="form-group"><label htmlFor="biografia">Biografa/Perfil profesional</label><textarea id="biografia" name="biografia" value={formulario.biografia} onChange={(e)=>setFormulario(p=>({...p,biografia:e.target.value}))} rows={3} /></div>
                </>)}

                {!['estudiante','docente'].includes(formulario.rol) && (<>
                  <div className="form-section-title">Informacin del rol</div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="departamento">Departamento/rea</label><input id="departamento" name="departamento" value={formulario.departamento} onChange={handleInputChange} /></div>
                    <div className="form-group"><label htmlFor="horarioAtencion">Horario</label><input id="horarioAtencion" name="horarioAtencion" value={formulario.horarioAtencion} onChange={handleInputChange} /></div>
                  </div>
                </>)}

                <div className="form-group"><label htmlFor="observaciones">Observaciones</label><textarea id="observaciones" name="observaciones" value={formulario.observaciones} onChange={(e)=>setFormulario(p=>({...p,observaciones:e.target.value}))} rows={2} /></div>

                {editandoId === null ? (
                  <><div className="form-section-title">Credenciales</div><div className="form-row">
                    <div className="form-group"><label htmlFor="password">Contrasea*</label><input type="password" id="password" name="password" value={formulario.password} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label htmlFor="confirmPassword">Confirmar Contrasea*</label><input type="password" id="confirmPassword" name="confirmPassword" value={formulario.confirmPassword} onChange={handleInputChange} required /></div>
                  </div></>
                ) : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={cerrarModal}>Cancelar</button>
                <button type="button" className="submit-button" onClick={() => void handleSaveUser()} disabled={guardando}>{guardando ? 'Guardando...' : editandoId !== null ? 'Guardar Cambios' : 'Guardar Usuario'}</button>
              </div>
            </div>
          </div>
        ) : null}

        {confirmacion ? (
          <ConfirmDialog
            title={confirmacion.estado === 'activo' ? 'Desactivar usuario' : 'Reactivar usuario'}
            message={
              confirmacion.estado === 'activo' ? `¿Deseas desactivar a ${displayName(confirmacion)} El usuario no podrá iniciar sesión, pero su información se conservará.`
                : `¿Deseas reactivar a ${displayName(confirmacion)} El usuario podrá iniciar sesión nuevamente.`
            }
            confirmLabel={confirmacion.estado === 'activo' ? 'Desactivar' : 'Reactivar'}
            onConfirm={() => void handleCambiarEstado()}
            onCancel={() => setConfirmacion(null)}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
