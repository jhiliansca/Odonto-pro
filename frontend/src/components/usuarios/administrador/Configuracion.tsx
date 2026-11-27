import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import { soporteApi } from '../../../services/soporteApi';
import type { ConfiguracionItem } from '../../../services/soporteApi';
import './Configuracion.css';

type Categoria = 'general' | 'seguridad' | 'notificaciones' | 'sistema';

const TABS: { valor: Categoria; etiqueta: string; icono: string; titulo: string }[] = [
  { valor: 'general', etiqueta: 'General', icono: 'settings', titulo: 'Configuración General' },
  { valor: 'seguridad', etiqueta: 'Seguridad', icono: 'security', titulo: 'Configuración de Seguridad' },
  { valor: 'notificaciones', etiqueta: 'Notificaciones', icono: 'notifications', titulo: 'Configuración de Notificaciones' },
  { valor: 'sistema', etiqueta: 'Sistema', icono: 'computer', titulo: 'Configuración del Sistema' },
];

const Configuracion: React.FC = () => {
  const userName = useCurrentUserName('Administrador');
  const [activeTab, setActiveTab] = useState<Categoria>('general');
  const [items, setItems] = useState<ConfiguracionItem[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await soporteApi.configuracion();
      setItems(datos);
      setValores(Object.fromEntries(datos.map((item) => [item.id, item.valor ?? ''])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la configuración.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const seccion = TABS.find((tab) => tab.valor === activeTab) ?? TABS[0];
  const visibles = useMemo(() => items.filter((item) => item.categoria === activeTab), [items, activeTab]);

  const guardar = async (item: ConfiguracionItem, valor: string) => {
    setGuardando(item.id);
    setMensaje(null);
    try {
      const actualizado = await soporteApi.actualizarConfiguracion(item.id, valor);
      setItems((anteriores) => anteriores.map((entrada) => (entrada.id === item.id ? actualizado : entrada)));
      setValores((anteriores) => ({ ...anteriores, [item.id]: actualizado.valor ?? '' }));
      setMensaje(`${item.nombre} actualizado correctamente.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio.');
    } finally {
      setGuardando(null);
    }
  };

  const control = (item: ConfiguracionItem) => {
    const valor = valores[item.id] ?? '';
    if (item.tipo === 'toggle') {
      return (
        <span className="toggle-switch">
          <input
            type="checkbox"
            checked={valor === '1'}
            disabled={guardando === item.id}
            onChange={(event) => {
              const nuevo = event.target.checked ? '1' : '0';
              setValores((anteriores) => ({ ...anteriores, [item.id]: nuevo }));
              void guardar(item, nuevo);
            }}
          />
          <label aria-label={item.nombre} />
        </span>
      );
    }
    if (item.tipo === 'select') {
      return (
        <select
          className="config-select"
          value={valor}
          disabled={guardando === item.id}
          onChange={(event) => {
            setValores((anteriores) => ({ ...anteriores, [item.id]: event.target.value }));
            void guardar(item, event.target.value);
          }}
        >
          {(item.opciones || []).map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
      );
    }
    return (
      <input
        className={item.tipo === 'numero' ? 'config-number-input' : 'config-text-input'}
        type={item.tipo === 'numero' ? 'number' : 'text'}
        value={valor}
        disabled={guardando === item.id}
        onChange={(event) => setValores((anteriores) => ({ ...anteriores, [item.id]: event.target.value }))}
        onBlur={() => {
          if (valor !== item.valor) void guardar(item, valor);
        }}
      />
    );
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="configuracion-container">
        <div className="page-header">
          <h1>Configuración del Sistema</h1>
          <button type="button" className="view-all-button" onClick={() => void cargar()} disabled={cargando}>
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {error && <div className="no-results" role="alert"><span className="material-icons">error_outline</span><p>{error}</p></div>}
        {mensaje && <div className="section-description">{mensaje}</div>}

        <div className="config-layout">
          <div className="config-sidebar">
            <div className="config-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.valor}
                  type="button"
                  className={`config-tab ${activeTab === tab.valor ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.valor)}
                >
                  <span className="material-icons">{tab.icono}</span>
                  {tab.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="config-content">
            <div className="config-section">
              <h2 className="section-title">{seccion.titulo}</h2>
              <p className="section-description">
                {visibles.length
                  ? 'Parámetros registrados en la fuente de datos. Los cambios se guardan automáticamente.'
                  : 'No hay registros reales registrados.'}
              </p>

              <div className="config-items">
                {visibles.map((item) => (
                  <div key={item.id} className="config-item">
                    <div className="config-item-info">
                      <h3 className="config-item-title">{item.nombre}</h3>
                      <p className="config-item-description">{item.descripcion || item.id}</p>
                    </div>
                    <div className="config-item-control">{control(item)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
