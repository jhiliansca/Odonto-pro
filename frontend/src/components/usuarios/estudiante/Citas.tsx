import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Cita, Paciente, Persona } from '../../../services/clinicaApi';
import { getStoredUser } from '../../../services/authApi';
import type { AuthUser } from '../../../services/authApi';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import './Citas.css';
import '../RoleExtra.css';
import '../administrador/Citas.css';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const ETIQUETAS_ESTADO: Record<Cita['estado'], string> = { pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

interface AccionEstado {
  id: number;
  estado: Cita['estado'];
}

interface CeldaCalendario {
  clave: string;
  dia: number | null;
  fecha: string | null;
  tieneCita: boolean;
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la información.';
}

function fechaISO(date: Date): string {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function soloFecha(fecha: string): string {
  return fecha.includes('T') ? fecha.slice(0, 10) : fecha;
}

function diaDelMes(fecha: string): string {
  const partes = soloFecha(fecha).split('-');
  return partes.length === 3 ? partes[2] : '';
}

function mesDelAnio(fecha: string): string {
  const partes = soloFecha(fecha).split('-');
  const mes = Number(partes[1]);
  return mes >= 1 && mes <= 12 ? MESES_CORTOS[mes - 1] : '';
}

const Citas: React.FC = () => {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const userName = user?.nombreCompleto || 'Estudiante';
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Persona[]>([]);
  const [estado, setEstado] = useState<'todos' | Cita['estado']>('todos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [accion, setAccion] = useState<AccionEstado | null>(null);
  const [mesVisible, setMesVisible] = useState(() => {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  });
  const [nuevaCita, setNuevaCita] = useState({
    pacienteId: '',
    fecha: fechaISO(new Date()),
    hora: '',
    tratamiento: '',
    doctorId: '',
    telefono: '',
  });

  const cargarCitas = useCallback(async () => {
    if (!user) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    try {
      const [citasData, pacientesData, doctoresData] = await Promise.all([
        clinicaApi.citas(),
        clinicaApi.pacientes(),
        clinicaApi.doctores(),
      ]);
      setCitas(citasData.filter(cita => cita.estudiante_id === user.id));
      setPacientes(pacientesData.filter(paciente => paciente.estudiante_id === user.id));
      setDoctores(doctoresData);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarCitas();
  }, [cargarCitas]);

  const filtradas = useMemo(
    () => (estado === 'todos' ? citas : citas.filter((cita) => cita.estado === estado)),
    [citas, estado],
  );

  const conteos = useMemo(() => ({
    todas: citas.length,
    pendiente: citas.filter((cita) => cita.estado === 'pendiente').length,
  confirmada: citas.filter((cita) => cita.estado === 'confirmada').length,
  completada: citas.filter((cita) => cita.estado === 'completada').length,
  cancelada: citas.filter((cita) => cita.estado === 'cancelada').length,
  }), [citas]);

  const celdasCalendario = useMemo<CeldaCalendario[]>(() => {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    const desplazamiento = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const celdas: CeldaCalendario[] = [];
    for (let i = 0; i < desplazamiento; i += 1) {
      celdas.push({ clave: `vacia-${i}`, dia: null, fecha: null, tieneCita: false });
    }
    for (let dia = 1; dia <= totalDias; dia += 1) {
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      celdas.push({
        clave: fecha,
        dia,
        fecha,
        tieneCita: citas.some((cita) => soloFecha(cita.fecha) === fecha),
      });
    }
    return celdas;
  }, [mesVisible, citas]);

  const cambiarMes = (desplazamiento: number) => {
    setMesVisible((actual) => new Date(actual.getFullYear(), actual.getMonth() + desplazamiento, 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'pacienteId') {
      const paciente = pacientes.find((item) => String(item.id) === value);
      setNuevaCita((actual) => ({ ...actual, pacienteId: value, telefono: paciente?.telefono || '' }));
      return;
    }
    setNuevaCita((actual) => ({ ...actual, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const pacienteId = Number(nuevaCita.pacienteId);
    if (!pacienteId || !nuevaCita.fecha || !nuevaCita.hora || !nuevaCita.tratamiento.trim()) {
      setError('Completa todos los datos obligatorios de la cita.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await clinicaApi.crearCita({
        pacienteId,
        doctor_id: nuevaCita.doctorId ? Number(nuevaCita.doctorId) : null,
        estudiante_id: user.id,
        fecha: nuevaCita.fecha,
        hora: nuevaCita.hora,
        tratamiento: nuevaCita.tratamiento.trim(),
        telefono: nuevaCita.telefono || null,
      });
      setShowModal(false);
      setNuevaCita({ pacienteId: '', fecha: fechaISO(new Date()), hora: '', tratamiento: '', doctorId: '', telefono: '' });
      await cargarCitas();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async () => {
    if (!accion) return;
    const { id, estado: nuevoEstado } = accion;
    setAccion(null);
    setError('');
    try {
      await clinicaApi.cambiarEstadoCita(id, nuevoEstado);
      await cargarCitas();
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  if (!user) {
    return (
      <DashboardLayout userType="estudiante" userName={userName}>
        <div className="citas-container">
          <div className="page-header"><h1>Mis Citas</h1></div>
          <EmptyState message="No se pudo identificar al estudiante. Inicia sesión nuevamente para ver sus citas." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="estudiante" userName={userName}>
      <div className="citas-container">
        <div className="page-header">
          <h1>Mis Citas</h1>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <span className="material-icons">add</span>
            <span>Nueva Cita</span>
          </button>
        </div>

        {error && <ErrorState message={error} onRetry={() => void cargarCitas()} />}

        <div className="calendar-view">
          <div className="calendar-header">
            <h2>{mesVisible.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <div className="calendar-navigation">
              <button className="nav-button" aria-label="Mes anterior" onClick={() => cambiarMes(-1)}>
                <span className="material-icons">chevron_left</span>
              </button>
              <button className="nav-button" aria-label="Mes siguiente" onClick={() => cambiarMes(1)}>
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            <div className="calendar-day header">Lun</div>
            <div className="calendar-day header">Mar</div>
            <div className="calendar-day header">Mié</div>
            <div className="calendar-day header">Jue</div>
            <div className="calendar-day header">Vie</div>
            <div className="calendar-day header">Sáb</div>
            <div className="calendar-day header">Dom</div>
            {celdasCalendario.map((celda) => (
              <div
                key={celda.clave}
                className={`calendar-day${celda.dia === null ? ' disabled' : ''}${celda.tieneCita ? ' has-event' : ''}`}
                title={celda.fecha || undefined}
              >
                {celda.dia ?? ''}
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {(['todos', 'pendiente', 'confirmada', 'completada', 'cancelada'] as const).map((opcion) => (
            <button
              key={opcion}
              className={`tab ${estado === opcion ? 'active' : ''}`}
              onClick={() => setEstado(opcion)}
            >
              {opcion === 'todos' ? `Todas (${conteos.todas})`
                : `${ETIQUETAS_ESTADO[opcion]} (${conteos[opcion]})`}
            </button>
          ))}
        </div>

        <div className="citas-list">
          <h2>Citas registradas</h2>
          {cargando ? (
            <LoadingState label="Cargando citas..." />
          ) : filtradas.length === 0 ? (
            <EmptyState message="No hay citas registradas para este estudiante." />
          ) : (
            filtradas.map((cita) => (
              <div key={cita.id} className={`cita-card ${cita.estado}`}>
                <div className="cita-fecha">
                  <div className="fecha-dia">{diaDelMes(cita.fecha)}</div>
                  <div className="fecha-mes">{mesDelAnio(cita.fecha)}</div>
                </div>
                <div className="cita-info">
                  <h3>{cita.paciente || 'Sin nombre registrado'}</h3>
                  <div className="cita-detalles">
                    <div className="cita-hora">
                      <span className="material-icons">schedule</span>
                      <span>{cita.hora}</span>
                    </div>
                    <div className="cita-tratamiento">
                      <span className="material-icons">medical_services</span>
                      <span>{cita.tratamiento}</span>
                    </div>
                    <div className="cita-supervisor">
                      <span className="material-icons">person</span>
                      <span>{cita.doctor || 'Sin doctor asignado'}</span>
                    </div>
                  </div>
                </div>
                <div className="cita-estado">
                  <span className={`status-badge ${cita.estado}`}>{ETIQUETAS_ESTADO[cita.estado]}</span>
                </div>
                <div className="cita-acciones">
                  {cita.estado === 'pendiente' && (
                    <button className="icon-button" aria-label="Confirmar cita" onClick={() => setAccion({ id: cita.id, estado: 'confirmada' })}>
                      <span className="material-icons">check</span>
                    </button>
                  )}
                  {cita.estado === 'confirmada' && (
                    <button className="icon-button" aria-label="Marcar como completada" onClick={() => setAccion({ id: cita.id, estado: 'completada' })}>
                      <span className="material-icons">task_alt</span>
                    </button>
                  )}
                  {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                    <button className="icon-button danger" aria-label="Cancelar cita" onClick={() => setAccion({ id: cita.id, estado: 'cancelada' })}>
                      <span className="material-icons">cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Solicitar Nueva Cita</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="form-group">
                  <label>Paciente</label>
                  <select name="pacienteId" value={nuevaCita.pacienteId} onChange={handleInputChange} required>
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>{paciente.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha</label>
                  <input type="date" name="fecha" value={nuevaCita.fecha} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input type="time" name="hora" value={nuevaCita.hora} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Tratamiento</label>
                  <input
                    type="text"
                    name="tratamiento"
                    value={nuevaCita.tratamiento}
                    onChange={handleInputChange}
                    placeholder="Tratamiento solicitado"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" name="telefono" value={nuevaCita.telefono} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Doctor</label>
                  <select name="doctorId" value={nuevaCita.doctorId} onChange={handleInputChange}>
                    <option value="">Sin doctor asignado</option>
                    {doctores.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>{doctor.nombreCompleto || doctor.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="submit-button" disabled={guardando || pacientes.length === 0}>
                    {guardando ? 'Guardando...' : 'Solicitar Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {accion && (
          <ConfirmDialog
            title={accion.estado === 'cancelada' ? 'Cancelar cita' : 'Cambiar estado de la cita'}
            message={
              accion.estado === 'cancelada' ? '¿Cancelar esta cita Esta acción no se puede deshacer.'
                : `¿Cambiar el estado de la cita a ${ETIQUETAS_ESTADO[accion.estado].toLowerCase()}`
            }
            confirmLabel={accion.estado === 'cancelada' ? 'Cancelar cita' : 'Cambiar estado'}
            onConfirm={() => void cambiarEstado()}
            onCancel={() => setAccion(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Citas;
