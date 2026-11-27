import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import './Caducidades.css';
import { catalogoApi } from '../../../services/catalogoApi';
import type { CaducidadesResponse, EstadoCaducidadFiltro, LoteCaducidad, Material, Proveedor } from '../../../services/catalogoApi';
import { formatBs, formatNumero } from '../../../utils/formato';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';

type Modal = 'crear' | 'editar' | null;

interface FormularioLote {
  materialId: number;
  codigoLote: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  cantidad: number;
  proveedorId: number;
  ubicacion: string;
  observaciones: string;
  registrarEntrada: boolean;
}

function fechaISO(fecha: Date): string {
  const dos = (numero: number) => String(numero).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function sumarDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaISO(fecha);
}

function formatearFecha(fecha: string): string {
  if (!fecha) return '—';
  const parte = fecha.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(parte)) {
    const [anio, mes, dia] = parte.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  return fecha;
}

const ESTADOS: { valor: EstadoCaducidadFiltro; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'proximo', etiqueta: 'Por vencer' },
  { valor: 'vencido', etiqueta: 'Vencidos' },
  { valor: 'critico', etiqueta: 'Críticos (7d)' },
  { valor: 'cerrado', etiqueta: 'Cerrados' },
];

function etiquetaEstado(lote: LoteCaducidad): string {
  if (lote.estadoCaducidad === 'vencido') return 'Vencido';
  if (lote.estadoCaducidad === 'hoy') return 'Vence hoy';
  if (lote.estadoCaducidad === 'proximo') return 'Por vencer';
  if (lote.estadoCaducidad === 'cerrado') return lote.estado === 'descartado' ? 'Descartado' : 'Cerrado';
  return 'Normal';
}

function claseEstado(lote: LoteCaducidad): string {
  if (lote.estadoCaducidad === 'vencido' || lote.estadoCaducidad === 'hoy') return 'vencido';
  if (lote.estadoCaducidad === 'proximo') return 'proximo';
  if (lote.estadoCaducidad === 'cerrado') return 'cerrado';
  return 'normal';
}

const InventarioCaducidades: React.FC = () => {
  const userName = useCurrentUserName('Inventario');
  const [parametros] = useSearchParams();
  const [datos, setDatos] = useState<CaducidadesResponse | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoCaducidadFiltro>('todos');
  const [buscar, setBuscar] = useState('');
  const [materialFiltro, setMaterialFiltro] = useState(Number(parametros.get('material') || 0));
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [formulario, setFormulario] = useState<FormularioLote>({
    materialId: 0,
    codigoLote: '',
    fechaIngreso: fechaISO(new Date()),
    fechaVencimiento: sumarDias(90),
    cantidad: 1,
    proveedorId: 0,
    ubicacion: '',
    observaciones: '',
    registrarEntrada: true,
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await catalogoApi.caducidades({
        estado: estadoFiltro,
        buscar: buscar.trim() || undefined,
        materialId: materialFiltro || undefined,
        incluirCerrados: estadoFiltro === 'cerrado' || estadoFiltro === 'descartado',
      });
      setDatos(respuesta);
      setSeleccionadoId((previo) =>
        previo && respuesta.lotes.some((lote) => lote.id === previo) ? previo : (respuesta.lotes[0]?.id ?? null)
      );
    } catch (err) {
      setDatos(null);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el control por caducidad.');
    } finally {
      setCargando(false);
    }
  }, [buscar, estadoFiltro, materialFiltro]);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [listaMateriales, listaProveedores] = await Promise.all([
        catalogoApi.materiales(),
        catalogoApi.proveedores(),
      ]);
      setMateriales(listaMateriales);
      setProveedores(listaProveedores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.');
    }
  }, []);

  useEffect(() => { void cargarCatalogos(); }, [cargarCatalogos]);
  useEffect(() => { void cargar(); }, [cargar]);

  const lotes = useMemo(() => datos?.lotes || [], [datos]);
  const seleccionado = useMemo(
    () => lotes.find((lote) => lote.id === seleccionadoId) || lotes[0] || null,
    [lotes, seleccionadoId]
  );
  const materialesControlados = materiales.filter((material) => material.requiereCaducidad === 1);
  const opcionesMaterial = materialesControlados.length ? materialesControlados : materiales;

  const abrirCrear = () => {
    setFormulario({
      materialId: materialFiltro || opcionesMaterial[0]?.id || 0,
      codigoLote: '',
      fechaIngreso: fechaISO(new Date()),
      fechaVencimiento: sumarDias(90),
      cantidad: 1,
      proveedorId: 0,
      ubicacion: '',
      observaciones: '',
      registrarEntrada: true,
    });
    setFormError('');
    setModal('crear');
  };

  const abrirEditar = (lote: LoteCaducidad) => {
    setFormulario({
      materialId: lote.materialId,
      codigoLote: lote.codigoLote,
      fechaIngreso: lote.fechaIngreso.slice(0, 10),
      fechaVencimiento: lote.fechaVencimiento.slice(0, 10),
      cantidad: Number(lote.cantidadActual),
      proveedorId: lote.proveedorId || 0,
      ubicacion: lote.ubicacion || '',
      observaciones: lote.observaciones || '',
      registrarEntrada: true,
    });
    setFormError('');
    setModal('editar');
  };

  const handleChange = (evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = evento.target;
    if (type === 'checkbox') {
      const check = evento.target as HTMLInputElement;
      setFormulario((previo) => ({ ...previo, [name]: check.checked }));
      return;
    }
    setFormulario((previo) => ({
      ...previo,
      [name]: name === 'materialId' || name === 'proveedorId' || name === 'cantidad' ? Number(value) : value,
    }));
  };

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setFormError('');
    if (!formulario.materialId || !formulario.codigoLote.trim() || !formulario.fechaVencimiento) {
      setFormError('Material, código de lote y fecha de vencimiento son obligatorios.');
      return;
    }
    if (!(formulario.cantidad > 0)) {
      setFormError('La cantidad debe ser mayor que cero.');
      return;
    }
    setGuardando(true);
    try {
      if (modal === 'crear') {
        await catalogoApi.crearCaducidad({
          materialId: formulario.materialId,
          codigoLote: formulario.codigoLote.trim(),
          fechaIngreso: formulario.fechaIngreso,
          fechaVencimiento: formulario.fechaVencimiento,
          cantidad: formulario.cantidad,
          proveedorId: formulario.proveedorId || null,
          ubicacion: formulario.ubicacion.trim() || undefined,
          observaciones: formulario.observaciones.trim() || undefined,
          registrarEntrada: formulario.registrarEntrada,
        });
      } else if (seleccionado) {
        await catalogoApi.actualizarCaducidad(seleccionado.id, {
          fechaVencimiento: formulario.fechaVencimiento,
          cantidadActual: formulario.cantidad,
          proveedorId: formulario.proveedorId || null,
          ubicacion: formulario.ubicacion.trim() || null,
          observaciones: formulario.observaciones.trim() || null,
        });
      }
      setModal(null);
      await cargar();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el lote.');
    } finally {
      setGuardando(false);
    }
  };

  const descartar = async (lote: LoteCaducidad) => {
    if (!window.confirm(`Descartar el lote "${lote.codigoLote}" de ${lote.material}? Se registrará una salida de stock por ${lote.cantidadActual} ${lote.unidad}.`)) return;
    setError(null);
    try {
      await catalogoApi.descartarCaducidad(lote.id, { motivo: `Descarte por caducidad del lote ${lote.codigoLote}` });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descartar el lote.');
    }
  };

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="caducidades-container">
        <div className="page-header">
          <div>
            <h1>Control por Caducidad</h1>
            <p className="caducidades-subtitulo">
              Registro detallado de lotes, vencimientos, ubicación, proveedor y valor en riesgo.
              Las entradas, salidas y descartes quedan registrados en el inventario.
            </p>
          </div>
          <div className="caducidades-acciones">
            <button className="cancel-button" onClick={() => void cargar()} disabled={cargando}>
              <span className="material-icons">refresh</span>{cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button className="add-button" onClick={abrirCrear}>
              <span className="material-icons">add_circle</span>Nuevo lote
            </button>
          </div>
        </div>

        {error ? <div className="no-results" role="alert"><span className="material-icons">cloud_off</span><p>{error}</p><button className="cancel-button" onClick={() => void cargar()}>Reintentar</button></div> : null}

        <div className="stats-grid">
          <Card title="Lotes activos" value={datos?.resumen.lotesActivos ?? 0} icon="inventory_2" color="#059669" />
          <Card title="Por vencer" value={datos?.resumen.porVencer ?? 0} icon="event" color="#f59e0b" />
          <Card title="Vencidos" value={datos?.resumen.vencidos ?? 0} icon="event_busy" color="#ef4444" />
          <Card title="Valor en riesgo" value={formatBs(datos?.resumen.valorEnRiesgo ?? 0)} icon="attach_money" color="#7c3aed" />
        </div>

        <div className="filter-container">
          <div className="tabs">
            {ESTADOS.map((estado) => (
              <button key={estado.valor} className={`tab ${estadoFiltro === estado.valor ? 'active' : ''}`} onClick={() => setEstadoFiltro(estado.valor)}>{estado.etiqueta}</button>
            ))}
          </div>
          <div className="search-box">
            <span className="material-icons">search</span>
            <input type="text" placeholder="Buscar lote, producto, proveedor o ubicación..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          </div>
          <div className="sort-box">
            <span className="material-icons">filter_alt</span>
            <select value={materialFiltro} onChange={(e) => setMaterialFiltro(Number(e.target.value))} aria-label="Filtrar por producto">
              <option value={0}>Todos los productos</option>
              {opcionesMaterial.map((material) => (
                <option key={material.id} value={material.id}>{material.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="caducidades-layout">
          <div className="dashboard-panel caducidades-tabla-panel">
            <div className="panel-header"><div><h2>Lotes registrados</h2><p className="panel-subtitulo">Ordenados por fecha de vencimiento. Selecciona un lote para ver el detalle.</p></div><span className="analitica-badge danger">{lotes.length}</span></div>
            <div className="caducidades-tabla-wrapper">
              <table className="caducidades-tabla">
                <thead><tr><th>Producto / lote</th><th>Vencimiento</th><th>Cantidad</th><th>Ubicación</th><th>Proveedor</th><th>Estado</th></tr></thead>
                <tbody>
                  {lotes.map((lote) => (
                    <tr key={lote.id} className={seleccionado?.id === lote.id ? 'seleccionado' : ''} onClick={() => setSeleccionadoId(lote.id)}>
                      <td><strong>{lote.material}</strong><small>{lote.codigoLote} · {lote.clave}</small></td>
                      <td><strong>{formatearFecha(lote.fechaVencimiento)}</strong><small>{lote.diasRestantes < 0 ? `Vencido ${Math.abs(lote.diasRestantes)}d` : `${lote.diasRestantes} días`}</small></td>
                      <td><strong>{formatNumero(lote.cantidadActual, 2)} {lote.unidad}</strong><small>{formatBs(lote.valor)}</small></td>
                      <td>{lote.ubicacion || '—'}</td>
                      <td>{lote.proveedor || '—'}</td>
                      <td><span className={`caducidades-chip ${claseEstado(lote)}`}>{etiquetaEstado(lote)}</span></td>
                    </tr>
                  ))}
                  {!cargando && lotes.length === 0 ? <tr><td colSpan={6} className="caducidades-vacio">No hay lotes con los filtros seleccionados.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-panel caducidades-detalle">
            {seleccionado ? (
              <>
                <div className="caducidades-detalle-head">
                  <span className={`caducidades-detalle-icono ${claseEstado(seleccionado)}`}><span className="material-icons">event_available</span></span>
                  <div><span className="caducidades-kicker">Detalle del lote</span><h2>{seleccionado.codigoLote}</h2><p>{seleccionado.material} · {seleccionado.clave}</p></div>
                </div>
                <div className={`caducidades-dias ${claseEstado(seleccionado)}`}>
                  <span className="material-icons">schedule</span>
                  <div>
                    <strong>{seleccionado.diasRestantes < 0 ? `Vencido hace ${Math.abs(seleccionado.diasRestantes)} días` : `${seleccionado.diasRestantes} días restantes`}</strong>
                    <small>Vencimiento: {formatearFecha(seleccionado.fechaVencimiento)} · Alerta configurada: {seleccionado.diasAlertaCaducidad} días</small>
                  </div>
                </div>
                <div className="caducidades-detalle-grid">
                  <div className="detalle-stat"><span>Cantidad actual</span><strong>{formatNumero(seleccionado.cantidadActual, 2)} {seleccionado.unidad}</strong></div>
                  <div className="detalle-stat"><span>Cantidad inicial</span><strong>{formatNumero(seleccionado.cantidadInicial, 2)} {seleccionado.unidad}</strong></div>
                  <div className="detalle-stat"><span>Valor del lote</span><strong>{formatBs(seleccionado.valor)}</strong></div>
                  <div className="detalle-stat"><span>Ubicación</span><strong>{seleccionado.ubicacion || 'Sin ubicación'}</strong></div>
                  <div className="detalle-stat"><span>Proveedor</span><strong>{seleccionado.proveedor || 'Sin proveedor'}</strong></div>
                  <div className="detalle-stat"><span>Fecha de ingreso</span><strong>{formatearFecha(seleccionado.fechaIngreso)}</strong></div>
                </div>
                <div className="caducidades-linea-tiempo">
                  <div><span className="material-icons">login</span><small>Ingreso</small><strong>{formatearFecha(seleccionado.fechaIngreso)}</strong></div>
                  <div><span className="material-icons">today</span><small>Hoy</small><strong>{formatearFecha(fechaISO(new Date()))}</strong></div>
                  <div><span className="material-icons">event_busy</span><small>Vencimiento</small><strong>{formatearFecha(seleccionado.fechaVencimiento)}</strong></div>
                </div>
                {seleccionado.observaciones ? <p className="caducidades-observaciones"><span className="material-icons">notes</span>{seleccionado.observaciones}</p> : null}
                <div className="producto-detalle-actions">
                  <button className="cancel-button" onClick={() => abrirEditar(seleccionado)}><span className="material-icons">edit</span>Editar lote</button>
                  {seleccionado.estado === 'activo' && seleccionado.cantidadActual > 0 ? (
                    <button className="cancel-button danger-text" onClick={() => void descartar(seleccionado)}><span className="material-icons">delete_forever</span>Descartar</button>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="no-results"><span className="material-icons">event_available</span><p>Selecciona un lote para ver su detalle.</p></div>
            )}
          </div>
        </div>

        {modal ? (
          <div className="modal-overlay"><div className="modal-content">
            <div className="modal-header">
              <h2>{modal === 'crear' ? 'Registrar lote por caducidad' : `Editar lote ${formulario.codigoLote}`}</h2>
              <button className="close-button" onClick={() => setModal(null)}><span className="material-icons">close</span></button>
            </div>
            <form onSubmit={(evento) => void guardar(evento)}>
              <div className="form-group">
                <label htmlFor="cad-material">Producto*</label>
                <select id="cad-material" name="materialId" value={formulario.materialId} onChange={handleChange} disabled={modal === 'editar'} required>
                  <option value={0}>Selecciona un producto</option>
                  {opcionesMaterial.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.nombre}{material.requiereCaducidad === 1 ? ' · control por caducidad' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="cad-codigo">Código de lote*</label><input id="cad-codigo" name="codigoLote" value={formulario.codigoLote} onChange={handleChange} disabled={modal === 'editar'} required placeholder="LOTE-2026-01" /></div>
                <div className="form-group"><label htmlFor="cad-cantidad">Cantidad*</label><input id="cad-cantidad" name="cantidad" type="number" min="0.001" step="0.001" value={formulario.cantidad} onChange={handleChange} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="cad-ingreso">Fecha de ingreso</label><input id="cad-ingreso" name="fechaIngreso" type="date" value={formulario.fechaIngreso} onChange={handleChange} disabled={modal === 'editar'} /></div>
                <div className="form-group"><label htmlFor="cad-vencimiento">Fecha de vencimiento*</label><input id="cad-vencimiento" name="fechaVencimiento" type="date" value={formulario.fechaVencimiento} onChange={handleChange} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cad-proveedor">Proveedor</label>
                  <select id="cad-proveedor" name="proveedorId" value={formulario.proveedorId} onChange={handleChange}>
                    <option value={0}>Sin proveedor</option>
                    {proveedores.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group"><label htmlFor="cad-ubicacion">Ubicación</label><input id="cad-ubicacion" name="ubicacion" value={formulario.ubicacion} onChange={handleChange} placeholder="Ej. Almacén A - Estante 2" /></div>
              </div>
              <div className="form-group"><label htmlFor="cad-observaciones">Observaciones</label><textarea id="cad-observaciones" name="observaciones" value={formulario.observaciones} onChange={handleChange} rows={3} /></div>
              {modal === 'crear' ? (
                <label className="caducidades-check"><input type="checkbox" name="registrarEntrada" checked={formulario.registrarEntrada} onChange={handleChange} /> Registrar entrada de stock por la cantidad del lote</label>
              ) : null}
              {formError ? <div className="form-group" style={{ color: '#dc2626' }} role="alert"><span className="material-icons" style={{ verticalAlign: 'middle' }}>error</span> {formError}</div> : null}
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="submit-button" disabled={guardando}>{guardando ? 'Guardando...' : modal === 'crear' ? 'Registrar lote' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div></div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default InventarioCaducidades;
