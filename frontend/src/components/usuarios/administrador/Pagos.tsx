import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { academicoApi } from '../../../services/academicoApi';
import type { Pago } from '../../../services/academicoApi';
import { clinicaApi } from '../../../services/clinicaApi';
import type { Persona } from '../../../services/clinicaApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import { formatBs } from '../../../utils/formato';
import '../academico/Pagos.css';

type EstadoDestino = 'verificado' | 'rechazado';
type EstadoInicial = 'pendiente' | 'verificado';

interface FormularioPago {
  estudianteId: string;
  solicitudId: string;
  monto: string;
  comprobante: string;
  estado: EstadoInicial;
}

const formularioVacio: FormularioPago = {
  estudianteId: '',
  solicitudId: '',
  monto: '',
  comprobante: '',
  estado: 'pendiente',
};

const etiquetasEstado: Record<string, string> = { pendiente: 'Pendiente',
  verificado: 'Verificado',
  rechazado: 'Rechazado',
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function normalizar(valor: string | null | undefined): string {
  return (valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function nombreEstudiante(persona: Persona): string {
  return persona.nombreCompleto || [persona.nombre, persona.apellido].filter(Boolean).join(' ') || `Estudiante ${persona.id}`;
}

const Pagos: React.FC = () => {
  const userName = useCurrentUserName('Administrador');
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(true);
  const [error, setError] = useState('');
  const [errorEstudiantes, setErrorEstudiantes] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [formulario, setFormulario] = useState<FormularioPago>(formularioVacio);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ pago: Pago; estado: EstadoDestino } | null>(null);
  const [pagoEditando, setPagoEditando] = useState<Pago | null>(null);
  const [montoEdicion, setMontoEdicion] = useState('');

  const cargarPagos = useCallback(async (mostrarCargando: boolean = true) => {
    if (mostrarCargando) setCargando(true);
    setError('');
    try {
      setPagos(await academicoApi.pagos());
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      if (mostrarCargando) setCargando(false);
    }
  }, []);

  const cargarEstudiantes = useCallback(async () => {
    setCargandoEstudiantes(true);
    setErrorEstudiantes('');
    try {
      setEstudiantes(await clinicaApi.estudiantes());
    } catch (e) {
      setErrorEstudiantes(mensajeError(e));
    } finally {
      setCargandoEstudiantes(false);
    }
  }, []);

  useEffect(() => {
    void cargarPagos();
    void cargarEstudiantes();
  }, [cargarPagos, cargarEstudiantes]);

  const stats = useMemo(() => {
    const verificados = pagos.filter((pago) => pago.estado === 'verificado');
    return {
      total: pagos.length,
      verificados: verificados.length,
      pendientes: pagos.filter((pago) => pago.estado === 'pendiente').length,
  montoVerificado: verificados.reduce((total, pago) => {
        const monto = Number(pago.monto);
        return total + (Number.isFinite(monto) ? monto : 0);
      }, 0),
    };
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return pagos.filter((pago) => {
      const coincideEstado = !filtroEstado || pago.estado === filtroEstado;
      const texto = normalizar(`${pago.estudiante || ''} ${pago.procedimiento || ''} ${pago.asignatura || ''} ${pago.comprobante || ''}`);
      return coincideEstado && (!termino || texto.includes(termino));
    });
  }, [pagos, filtroEstado, busqueda]);

  const abrirCrear = () => {
    setFormulario(formularioVacio);
    setFormError('');
    setMensaje('');
    setMostrarCrear(true);
  };

  const cerrarCrear = () => {
    setMostrarCrear(false);
    setFormulario(formularioVacio);
    setFormError('');
  };

  const cambiarFormulario = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormulario((anterior) => {
      switch (name) {
        case 'estudianteId':
          return { ...anterior, estudianteId: value };
        case 'solicitudId':
          return { ...anterior, solicitudId: value };
        case 'monto':
          return { ...anterior, monto: value };
        case 'comprobante':
          return { ...anterior, comprobante: value };
        case 'estado':
          return { ...anterior, estado: value === 'verificado' ? 'verificado' : 'pendiente' };
        default:
          return anterior;
      }
    });
    setFormError('');
  };

  const crearPago = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const estudianteId = Number(formulario.estudianteId);
    const monto = Number(formulario.monto);
    if (!formulario.estudianteId || !Number.isInteger(estudianteId) || estudianteId <= 0) {
      setFormError('Selecciona un estudiante válido.');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setFormError('Ingresa un monto mayor que cero.');
      return;
    }
    const textoSolicitud = formulario.solicitudId.trim();
    const solicitudId = textoSolicitud === '' ? undefined : Number(textoSolicitud);
    if (solicitudId !== undefined && (!Number.isInteger(solicitudId) || solicitudId <= 0)) {
      setFormError('La solicitud debe ser un número entero positivo.');
      return;
    }
    setGuardando(true);
    try {
      await academicoApi.crearPago({
        estudianteId,
        solicitudId,
        monto,
        comprobante: formulario.comprobante.trim() || undefined,
        estado: formulario.estado,
      });
      cerrarCrear();
      setMensaje('Pago académico registrado correctamente.');
      await cargarPagos(false);
    } catch (e) {
      setFormError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarCambioEstado = async () => {
    if (!confirmacion) return;
    const { pago, estado } = confirmacion;
    setConfirmacion(null);
    setGuardando(true);
    setMensaje('');
    setError('');
    try {
      await academicoApi.actualizarPago(pago.id, { estado });
      setMensaje(`Pago #${pago.id} marcado como ${etiquetasEstado[estado].toLowerCase()} correctamente.`);
      await cargarPagos(false);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicion = (pago: Pago) => {
    setPagoEditando(pago);
    setMontoEdicion(String(pago.monto));
    setFormError('');
    setMensaje('');
  };

  const cerrarEdicion = () => {
    setPagoEditando(null);
    setMontoEdicion('');
    setFormError('');
  };

  const guardarMonto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pagoEditando) return;
    setFormError('');
    const monto = Number(montoEdicion);
    if (!Number.isFinite(monto) || monto <= 0) {
      setFormError('Ingresa un monto mayor que cero.');
      return;
    }
    setGuardando(true);
    try {
      await academicoApi.actualizarPago(pagoEditando.id, { monto });
      cerrarEdicion();
      setMensaje(`Monto del pago #${pagoEditando.id} actualizado correctamente.`);
      await cargarPagos(false);
    } catch (e) {
      setFormError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="pagos-page">
        <div className="page-header">
          <div>
            <h1>Gestión de Pagos Académicos</h1>
            <p>Registros reales de pagos de insumos académicos: pendiente, verificado o rechazado.</p>
          </div>
          <button type="button" className="add-button" onClick={abrirCrear}>
            <span className="material-icons">add</span>
            Nuevo Pago
          </button>
        </div>

        {mensaje && (
          <div className="pagos-alert exito" role="status">
            <span className="material-icons">check_circle</span>
            <span>{mensaje}</span>
            <button type="button" className="icon-button" aria-label="Cerrar aviso" onClick={() => setMensaje('')}>
              <span className="material-icons">close</span>
            </button>
          </div>
        )}
        {error && (
          <div className="pagos-alert error" role="alert">
            <span className="material-icons">error_outline</span>
            <span>{error}</span>
            <button type="button" className="icon-button" aria-label="Cerrar aviso" onClick={() => setError('')}>
              <span className="material-icons">close</span>
            </button>
          </div>
        )}

        <div className="stats-grid">
          <Card title="Total registros" value={stats.total} icon="receipt_long" color="var(--brand-600)" />
          <Card title="Verificados" value={stats.verificados} icon="verified" color="var(--success)" />
          <Card title="Pendientes" value={stats.pendientes} icon="pending_actions" color="var(--warning)" />
          <Card title="Monto verificado" value={formatBs(stats.montoVerificado, 2)} icon="payments" color="var(--info)" />
        </div>

        <div className="filter-container">
          <div className="tabs" role="tablist" aria-label="Filtrar pagos por estado">
            <button type="button" className={`tab ${filtroEstado === '' ? 'active' : ''}`} onClick={() => setFiltroEstado('')}>Todos</button>
            <button type="button" className={`tab ${filtroEstado === 'pendiente' ? 'active' : ''}`} onClick={() => setFiltroEstado('pendiente')}>Pendientes</button>
            <button type="button" className={`tab ${filtroEstado === 'verificado' ? 'active' : ''}`} onClick={() => setFiltroEstado('verificado')}>Verificados</button>
            <button type="button" className={`tab ${filtroEstado === 'rechazado' ? 'active' : ''}`} onClick={() => setFiltroEstado('rechazado')}>Rechazados</button>
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar estudiante, procedimiento o comprobante..."
              aria-label="Buscar pagos"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        </div>

        <div className="surface-card">
          <div className="pagos-card-head">
            <div>
              <h2>Registro de pagos</h2>
              <p>Verifica el estado y edita el monto de los pagos registrados en el sistema.</p>
            </div>
          </div>
          {cargando ? (
            <LoadingState label="Cargando pagos académicos..." />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void cargarPagos()} />
          ) : pagosFiltrados.length === 0 ? (
            <EmptyState message="No hay pagos que coincidan con los filtros seleccionados." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Procedimiento</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Comprobante</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map((pago) => (
                    <tr key={pago.id}>
                      <td>
                        <div className="pagos-registro">{pago.estudiante || `Estudiante #${pago.estudianteId ?? '—'}`}</div>
                        <span className="pagos-sin-datos">
                          Registro #{pago.id}{pago.solicitudId ? ` · Solicitud #${pago.solicitudId}` : ''}
                        </span>
                      </td>
                      <td>
                        <div className="pagos-texto">{pago.procedimiento || 'Sin procedimiento'}</div>
                        <span className="pagos-sin-datos">{pago.asignatura || 'Sin asignatura'}</span>
                      </td>
                      <td className="pagos-monto">{formatBs(Number(pago.monto) || 0, 2)}</td>
                      <td>
                        <span className={`status-badge ${pago.estado}`}>{etiquetasEstado[pago.estado] || pago.estado}</span>
                      </td>
                      <td className="pagos-texto">{pago.fecha || '—'}</td>
                      <td className="pagos-texto">{pago.comprobante || <span className="pagos-sin-datos">Sin comprobante</span>}</td>
                      <td>
                        <div className="row-actions">
                          {pago.estado !== 'verificado' && (
                            <button
                              type="button"
                              className="icon-button"
                              title="Verificar pago"
                              aria-label={`Verificar pago #${pago.id}`}
                              onClick={() => setConfirmacion({ pago, estado: 'verificado' })}
                            >
                              <span className="material-icons">check_circle</span>
                            </button>
                          )}
                          {pago.estado !== 'rechazado' && (
                            <button
                              type="button"
                              className="icon-button danger"
                              title="Rechazar pago"
                              aria-label={`Rechazar pago #${pago.id}`}
                              onClick={() => setConfirmacion({ pago, estado: 'rechazado' })}
                            >
                              <span className="material-icons">cancel</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-button"
                            title="Editar monto"
                            aria-label={`Editar monto del pago #${pago.id}`}
                            onClick={() => abrirEdicion(pago)}
                          >
                            <span className="material-icons">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {mostrarCrear && (
          <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) cerrarCrear();
          }}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="pagos-crear-titulo">
              <div className="modal-header">
                <h2 id="pagos-crear-titulo">Nuevo pago académico</h2>
                <button type="button" className="close-button" aria-label="Cerrar" onClick={cerrarCrear}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(event) => void crearPago(event)}>
                <div className="modal-body">
                  {formError && (
                    <div className="pagos-alert error" role="alert">
                      <span className="material-icons">error_outline</span>
                      <span>{formError}</span>
                    </div>
                  )}
                  {errorEstudiantes && (
                    <div className="pagos-alert error" role="alert">
                      <span className="material-icons">cloud_off</span>
                      <span>No se pudo cargar la lista de estudiantes: {errorEstudiantes}</span>
                      <button type="button" className="view-all-button" onClick={() => void cargarEstudiantes()}>Reintentar</button>
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="pagos-estudiante">Estudiante*</label>
                    <select
                      id="pagos-estudiante"
                      name="estudianteId"
                      value={formulario.estudianteId}
                      onChange={cambiarFormulario}
                      disabled={cargandoEstudiantes}
                      required
                    >
                      <option value="">Seleccionar estudiante</option>
                      {estudiantes.map((persona) => (
                        <option key={persona.id} value={persona.id}>{nombreEstudiante(persona)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pagos-monto">Monto*</label>
                      <input
                        id="pagos-monto"
                        name="monto"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formulario.monto}
                        onChange={cambiarFormulario}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pagos-solicitud">Solicitud (opcional)</label>
                      <input
                        id="pagos-solicitud"
                        name="solicitudId"
                        type="number"
                        min="1"
                        step="1"
                        value={formulario.solicitudId}
                        onChange={cambiarFormulario}
                        placeholder="ID de solicitud"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pagos-comprobante">Comprobante (opcional)</label>
                    <input
                      id="pagos-comprobante"
                      name="comprobante"
                      type="text"
                      value={formulario.comprobante}
                      onChange={cambiarFormulario}
                      placeholder="Número o referencia del comprobante"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pagos-estado">Estado inicial</label>
                    <select id="pagos-estado" name="estado" value={formulario.estado} onChange={cambiarFormulario}>
                      <option value="pendiente">Pendiente</option>
                      <option value="verificado">Verificado</option>
                    </select>
                  </div>
                  <div className="pagos-nota">
                    <span className="material-icons">info</span>
                    <span>Los pagos corresponden a insumos académicos. El comprobante y la solicitud son opcionales.</span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={cerrarCrear}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={guardando || cargandoEstudiantes}>
                    {guardando ? 'Guardando...' : 'Registrar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {pagoEditando && (
          <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) cerrarEdicion();
          }}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="pagos-editar-titulo">
              <div className="modal-header">
                <h2 id="pagos-editar-titulo">Editar monto</h2>
                <button type="button" className="close-button" aria-label="Cerrar" onClick={cerrarEdicion}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(event) => void guardarMonto(event)}>
                <div className="modal-body">
                  {formError && (
                    <div className="pagos-alert error" role="alert">
                      <span className="material-icons">error_outline</span>
                      <span>{formError}</span>
                    </div>
                  )}
                  <p className="pagos-texto">
                    Pago #{pagoEditando.id} · {pagoEditando.estudiante || 'Estudiante'}
                  </p>
                  <div className="form-group">
                    <label htmlFor="pagos-editar-monto">Nuevo monto*</label>
                    <input
                      id="pagos-editar-monto"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={montoEdicion}
                      onChange={(event) => {
                        setMontoEdicion(event.target.value);
                        setFormError('');
                      }}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={cerrarEdicion}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Monto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmacion && (
          <ConfirmDialog
            title={confirmacion.estado === 'verificado' ? 'Verificar pago' : 'Rechazar pago'}
            message={`¿Deseas marcar el pago #${confirmacion.pago.id} de ${confirmacion.pago.estudiante || 'este estudiante'} como ${etiquetasEstado[confirmacion.estado].toLowerCase()} El registro se actualizará de inmediato.`}
            confirmLabel={confirmacion.estado === 'verificado' ? 'Verificar' : 'Rechazar'}
            onConfirm={() => void confirmarCambioEstado()}
            onCancel={() => setConfirmacion(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pagos;
