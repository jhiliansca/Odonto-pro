import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { formatBs, formatNumero } from '../../../utils/formato';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Proveedor, ProveedorDetalle } from '../../../services/catalogoApi';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import './InventarioPages.css';
import './Proveedores.css';

type ProveedorEditable = Pick<
  Proveedor,
  'id' | 'nombre' | 'contacto' | 'telefono' | 'email' | 'categoria' | 'estado'
>;

interface ProveedorForm {
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  categoria: string;
}

interface Feedback {
  tipo: 'ok' | 'error';
  texto: string;
}

interface ConfirmacionEstado {
  proveedor: ProveedorEditable;
  estado: 'activo' | 'inactivo';
}

const FORMULARIO_VACIO: ProveedorForm = {
  nombre: '',
  contacto: '',
  telefono: '',
  email: '',
  categoria: 'general',
};

const InventarioProveedores: React.FC = () => {
  const userName = useCurrentUserName('Inventario');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [detalle, setDetalle] = useState<ProveedorDetalle | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [formulario, setFormulario] = useState<ProveedorForm>(FORMULARIO_VACIO);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionEstado | null>(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setProveedores(await catalogoApi.proveedores());
      return true;
    } catch (err) {
      setProveedores([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar los proveedores.');
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirDetalle = async (id: number) => {
    try {
      setDetalle(await catalogoApi.proveedor(id));
    } catch (err) {
      setFeedback({
        tipo: 'error',
        texto: err instanceof Error ? err.message : 'No se pudo cargar el detalle del proveedor.',
      });
    }
  };

  const abrirNuevo = () => {
    setFeedback(null);
    setDetalle(null);
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (proveedor: ProveedorEditable) => {
    setFeedback(null);
    setDetalle(null);
    setEditandoId(proveedor.id);
    setFormulario({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      categoria: proveedor.categoria || 'general',
    });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const guardarProveedor = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const nombre = formulario.nombre.trim();
    if (!nombre) {
      setFeedback({ tipo: 'error', texto: 'El nombre del proveedor es obligatorio.' });
      return;
    }

    setGuardando(true);
    setFeedback(null);
    try {
      const datos =
        editandoId !== null
          ? {
              nombre,
              contacto: formulario.contacto.trim(),
              telefono: formulario.telefono.trim(),
              email: formulario.email.trim(),
              categoria: formulario.categoria,
            }
          : {
              nombre,
              contacto: formulario.contacto.trim() || undefined,
              telefono: formulario.telefono.trim() || undefined,
              email: formulario.email.trim() || undefined,
              categoria: formulario.categoria,
            };
      if (editandoId !== null) {
        await catalogoApi.actualizarProveedor(editandoId, datos);
      } else {
        await catalogoApi.crearProveedor(datos);
      }
      if (await cargar()) {
        setFeedback({
          tipo: 'ok',
          texto: editandoId !== null ? 'Proveedor actualizado correctamente.' : 'Proveedor registrado correctamente.',
        });
        cerrarFormulario();
      }
    } catch (err) {
      setFeedback({
        tipo: 'error',
        texto:
          err instanceof Error
            ? err.message
            : editandoId !== null ? 'No se pudo actualizar el proveedor.'
              : 'No se pudo registrar el proveedor.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const solicitarCambioEstado = (proveedor: ProveedorEditable) => {
    setFeedback(null);
    setDetalle(null);
    setConfirmacion({
      proveedor,
      estado: proveedor.estado === 'activo' ? 'inactivo' : 'activo',
    });
  };

  const cambiarEstado = async () => {
    if (!confirmacion || procesandoEstado) return;
    const { proveedor, estado } = confirmacion;

    setProcesandoEstado(true);
    try {
      await catalogoApi.actualizarProveedor(proveedor.id, { estado });
      setConfirmacion(null);
      if (await cargar()) {
        setFeedback({
          tipo: 'ok',
          texto:
            estado === 'inactivo' ? `Proveedor ${proveedor.nombre} desactivado correctamente.`
              : `Proveedor ${proveedor.nombre} activado correctamente.`,
        });
      }
    } catch (err) {
      setConfirmacion(null);
      setFeedback({
        tipo: 'error',
        texto: err instanceof Error ? err.message : 'No se pudo cambiar el estado del proveedor.',
      });
    } finally {
      setProcesandoEstado(false);
    }
  };

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return proveedores.filter(
      (proveedor) =>
        !termino ||
        proveedor.nombre.toLowerCase().includes(termino) ||
        (proveedor.contacto || '').toLowerCase().includes(termino) ||
        (proveedor.categoria || '').toLowerCase().includes(termino)
    );
  }, [proveedores, busqueda]);

  const totales = useMemo(
    () => ({
      activos: proveedores.filter((proveedor) => proveedor.estado === 'activo').length,
  materiales: proveedores.reduce((suma, proveedor) => suma + Number(proveedor.materiales), 0),
      valor: proveedores.reduce((suma, proveedor) => suma + Number(proveedor.valorTotal), 0),
    }),
    [proveedores]
  );

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="inv-container">
        <div className="page-header">
          <div>
            <h1>Proveedores</h1>
            <p className="prov-subtitulo">Proveedores vinculados a los insumos del catálogo y valoración en bolivianos.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="add-button" onClick={() => void cargar()} disabled={cargando}>
              <span className="material-icons">refresh</span>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button type="button" className="add-button" onClick={abrirNuevo}>
              <span className="material-icons">add_circle</span>
              Nuevo proveedor
            </button>
          </div>
        </div>

        {feedback ? (
          <div className={`prov-mensaje ${feedback.tipo}`} role={feedback.tipo === 'error' ? 'alert' : 'status'}>
            {feedback.texto}
          </div>
        ) : null}
        {error ? <ErrorState message={error} onRetry={() => void cargar()} /> : null}

        <div className="stats-grid">
          <Card title="Proveedores activos" value={totales.activos} icon="local_shipping" color="#059669" />
          <Card title="Insumos asignados" value={formatNumero(totales.materiales)} icon="inventory_2" color="#0ea5e9" />
          <Card title="Valor asignado" value={formatBs(totales.valor, 2)} icon="payments" color="#7c3aed" />
          <Card title="Proveedores registrados" value={proveedores.length} icon="business" color="#f59e0b" />
        </div>

        <div className="filter-container">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <LoadingState label="Cargando proveedores desde la base de datos…" />
        ) : filtrados.length === 0 ? (
          <EmptyState message="No hay proveedores con los filtros seleccionados." />
        ) : (
          <div className="prov-grid">
            {filtrados.map((proveedor) => (
              <div
                className="prov-card"
                key={proveedor.id}
                role="button"
                tabIndex={0}
                onClick={() => void abrirDetalle(proveedor.id)}
                onKeyDown={(evento) => {
                  if (evento.target !== evento.currentTarget) return;
                  if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    void abrirDetalle(proveedor.id);
                  }
                }}
              >
                <span className="prov-avatar"><span className="material-icons">local_shipping</span></span>
                <span className="prov-cuerpo">
                  <strong>{proveedor.nombre}</strong>
                  <span className="prov-categoria">{proveedor.categoria || 'general'}</span>
                  <span className="prov-dato"><span className="material-icons">person</span>{proveedor.contacto || 'Sin contacto'}</span>
                  <span className="prov-dato"><span className="material-icons">phone</span>{proveedor.telefono || 'Sin teléfono'}</span>
                  <span className="prov-dato"><span className="material-icons">email</span>{proveedor.email || 'Sin correo'}</span>
                  <span className="prov-footer">
                    <span>{proveedor.materiales} insumos</span>
                    <span className="prov-footer-derecho">
                      <strong>{formatBs(proveedor.valorTotal, 2)}</strong>
                      <span className="prov-acciones">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Editar a ${proveedor.nombre}`}
                          title="Editar"
                          disabled={procesandoEstado}
                          onClick={(evento) => {
                            evento.stopPropagation();
                            abrirEdicion(proveedor);
                          }}
                        >
                          <span className="material-icons">edit</span>
                        </button>
                        <button
                          type="button"
                          className={`icon-button ${proveedor.estado === 'activo' ? 'danger' : ''}`}
                          aria-label={`${proveedor.estado === 'activo' ? 'Desactivar' : 'Activar'} a ${proveedor.nombre}`}
                          title={proveedor.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          disabled={procesandoEstado}
                          onClick={(evento) => {
                            evento.stopPropagation();
                            solicitarCambioEstado(proveedor);
                          }}
                        >
                          <span className="material-icons">
                            {proveedor.estado === 'activo' ? 'person_off' : 'check_circle'}
                          </span>
                        </button>
                      </span>
                    </span>
                  </span>
                </span>
                <span className={`inv-badge ${proveedor.estado === 'activo' ? 'activo' : 'inactivo'}`}>{proveedor.estado}</span>
              </div>
            ))}
          </div>
        )}

        {detalle ? (
          <div className="modal-overlay" onClick={() => setDetalle(null)}>
            <div className="modal-content prov-modal" onClick={(evento) => evento.stopPropagation()}>
              <div className="modal-header">
                <h2>{detalle.nombre}</h2>
                <div className="prov-detalle-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Editar proveedor"
                    title="Editar"
                    onClick={() => abrirEdicion(detalle)}
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  <button
                    type="button"
                    className={`icon-button ${detalle.estado === 'activo' ? 'danger' : ''}`}
                    aria-label={detalle.estado === 'activo' ? 'Desactivar proveedor' : 'Activar proveedor'}
                    title={detalle.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    onClick={() => solicitarCambioEstado(detalle)}
                  >
                    <span className="material-icons">
                      {detalle.estado === 'activo' ? 'person_off' : 'check_circle'}
                    </span>
                  </button>
                </div>
                <button type="button" className="close-button" onClick={() => setDetalle(null)} aria-label="Cerrar">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="prov-detalle-meta">
                <span><span className="material-icons">person</span>{detalle.contacto || 'Sin contacto'}</span>
                <span><span className="material-icons">phone</span>{detalle.telefono || 'Sin teléfono'}</span>
                <span><span className="material-icons">email</span>{detalle.email || 'Sin correo'}</span>
                <span className={`status-badge ${detalle.estado}`}>{detalle.estado}</span>
              </div>
              <div className="prov-tabla-wrapper">
                <table className="prov-tabla">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Stock</th>
                      <th>Precio Bs</th>
                      <th>Valor en almacén</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detalle.materiales ?? []).map((material) => (
                      <tr key={material.id}>
                        <td><strong>{material.nombre}</strong><small>{material.clave} · {material.categoria}</small></td>
                        <td>{formatNumero(material.stock, 1)} {material.unidad}</td>
                        <td>{formatBs(material.precioProveedor || material.precio, 2)}</td>
                        <td>{formatBs(material.stock * (material.precioProveedor || material.precio), 2)}</td>
                        <td>
                          <span className={`inv-badge ${material.stockBajo ? 'bajo' : 'activo'}`}>
                            {material.stockBajo ? 'Bajo stock' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(detalle.materiales ?? []).length === 0 && <tr><td colSpan={5}>Sin insumos asignados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {mostrarFormulario ? (
          <div className="modal-overlay" onClick={cerrarFormulario}>
            <div className="modal-content" onClick={(evento) => evento.stopPropagation()}>
              <div className="modal-header">
                <h2>{editandoId !== null ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
                <button type="button" className="close-button" onClick={cerrarFormulario} aria-label="Cerrar">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={(evento) => void guardarProveedor(evento)}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="prov-nombre">Nombre*</label>
                    <input
                      id="prov-nombre"
                      value={formulario.nombre}
                      onChange={(evento) => setFormulario((prev) => ({ ...prev, nombre: evento.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="prov-contacto">Contacto</label>
                      <input
                        id="prov-contacto"
                        value={formulario.contacto}
                        onChange={(evento) => setFormulario((prev) => ({ ...prev, contacto: evento.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prov-telefono">Teléfono</label>
                      <input
                        id="prov-telefono"
                        value={formulario.telefono}
                        onChange={(evento) => setFormulario((prev) => ({ ...prev, telefono: evento.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="prov-email">Correo</label>
                      <input
                        id="prov-email"
                        type="email"
                        value={formulario.email}
                        onChange={(evento) => setFormulario((prev) => ({ ...prev, email: evento.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prov-categoria">Categoría</label>
                      <select
                        id="prov-categoria"
                        value={formulario.categoria}
                        onChange={(evento) => setFormulario((prev) => ({ ...prev, categoria: evento.target.value }))}
                      >
                        <option value="general">General</option>
                        <option value="insumos">Insumos</option>
                        <option value="materiales">Materiales</option>
                        <option value="instrumentos">Instrumentos</option>
                        <option value="medicamentos">Medicamentos</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={cerrarFormulario}>Cancelar</button>
                  <button type="submit" className="submit-button" disabled={guardando}>
                    {guardando ? 'Guardando…' : editandoId !== null ? 'Guardar cambios' : 'Guardar proveedor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {confirmacion ? (
          <ConfirmDialog
            title={confirmacion.estado === 'activo' ? 'Desactivar proveedor' : 'Activar proveedor'}
            message={
              confirmacion.estado === 'activo' ? `¿Deseas desactivar a ${confirmacion.proveedor.nombre} El proveedor se conservará en el catálogo.`
                : `¿Deseas activar a ${confirmacion.proveedor.nombre} El proveedor volverá a estar disponible en el catálogo.`
            }
            confirmLabel={confirmacion.estado === 'activo' ? 'Desactivar' : 'Activar'}
            onConfirm={() => void cambiarEstado()}
            onCancel={() => setConfirmacion(null)}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default InventarioProveedores;
