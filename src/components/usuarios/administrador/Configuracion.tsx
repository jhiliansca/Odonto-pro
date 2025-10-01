import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import './Configuracion.css';

interface ConfigItem {
  id: string;
  nombre: string;
  descripcion: string;
  valor: string | boolean;
  tipo: 'texto' | 'numero' | 'toggle' | 'select';
  opciones?: string[];
  categoria: 'general' | 'seguridad' | 'notificaciones' | 'sistema';
}

const Configuracion: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState('Admin Principal');
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  useEffect(() => {
    const state = location.state as any;
    if (state?.userName) {
      setUserName(state.userName);
    }
  }, [location]);
  
  // Datos simulados de configuración
  const [configItems, setConfigItems] = useState<ConfigItem[]>([
    { id: 'nombre_clinica', nombre: 'Nombre de la Clínica', descripcion: 'Nombre oficial de la clínica dental', valor: 'Clínica Odontológica Unifranz', tipo: 'texto', categoria: 'general' },
    { id: 'direccion', nombre: 'Dirección', descripcion: 'Dirección física de la clínica', valor: 'Av. Principal #123, La Paz', tipo: 'texto', categoria: 'general' },
    { id: 'telefono', nombre: 'Teléfono de Contacto', descripcion: 'Número principal de contacto', valor: '+591 2 1234567', tipo: 'texto', categoria: 'general' },
    { id: 'email', nombre: 'Email de Contacto', descripcion: 'Correo electrónico oficial', valor: 'contacto@clinicaunifranz.edu.bo', tipo: 'texto', categoria: 'general' },
    
    { id: 'doble_factor', nombre: 'Autenticación de Dos Factores', descripcion: 'Requerir verificación adicional al iniciar sesión', valor: false, tipo: 'toggle', categoria: 'seguridad' },
    { id: 'tiempo_sesion', nombre: 'Tiempo de Sesión (minutos)', descripcion: 'Tiempo de inactividad antes de cerrar sesión', valor: '30', tipo: 'numero', categoria: 'seguridad' },
    { id: 'intentos_login', nombre: 'Intentos de Login', descripcion: 'Número de intentos fallidos antes de bloquear', valor: '5', tipo: 'numero', categoria: 'seguridad' },
    { id: 'complejidad_password', nombre: 'Complejidad de Contraseña', descripcion: 'Nivel requerido de complejidad', valor: 'media', tipo: 'select', opciones: ['baja', 'media', 'alta'], categoria: 'seguridad' },
    
    { id: 'notif_email', nombre: 'Notificaciones por Email', descripcion: 'Enviar notificaciones importantes por correo', valor: true, tipo: 'toggle', categoria: 'notificaciones' },
    { id: 'notif_sistema', nombre: 'Notificaciones del Sistema', descripcion: 'Mostrar notificaciones en la plataforma', valor: true, tipo: 'toggle', categoria: 'notificaciones' },
    { id: 'notif_stock', nombre: 'Alertas de Stock Bajo', descripcion: 'Notificar cuando productos estén bajo el mínimo', valor: true, tipo: 'toggle', categoria: 'notificaciones' },
    { id: 'frecuencia_notif', nombre: 'Frecuencia de Notificaciones', descripcion: 'Frecuencia de envío de resúmenes', valor: 'diaria', tipo: 'select', opciones: ['diaria', 'semanal', 'mensual'], categoria: 'notificaciones' },
    
    { id: 'backup_auto', nombre: 'Backup Automático', descripcion: 'Realizar copias de seguridad automáticas', valor: true, tipo: 'toggle', categoria: 'sistema' },
    { id: 'frecuencia_backup', nombre: 'Frecuencia de Backup', descripcion: 'Frecuencia de las copias de seguridad', valor: 'diaria', tipo: 'select', opciones: ['diaria', 'semanal', 'mensual'], categoria: 'sistema' },
    { id: 'log_actividad', nombre: 'Registro de Actividad', descripcion: 'Mantener registro detallado de actividades', valor: true, tipo: 'toggle', categoria: 'sistema' },
    { id: 'periodo_log', nombre: 'Período de Retención de Logs', descripcion: 'Tiempo de almacenamiento de registros', valor: '90', tipo: 'numero', categoria: 'sistema' },
  ]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleValueChange = (id: string, newValue: string | boolean) => {
    setConfigItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, valor: newValue } : item
      )
    );
  };

  const handleSaveChanges = () => {
    setSaveStatus('saving');
    // Simulación de guardado
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1500);
  };

  const filteredItems = configItems.filter(item => item.categoria === activeTab);

  const renderConfigInput = (item: ConfigItem) => {
    switch (item.tipo) {
      case 'texto':
        return (
          <input
            type="text"
            value={item.valor as string}
            onChange={(e) => handleValueChange(item.id, e.target.value)}
            className="config-text-input"
          />
        );
      case 'numero':
        return (
          <input
            type="number"
            value={item.valor as string}
            onChange={(e) => handleValueChange(item.id, e.target.value)}
            className="config-number-input"
          />
        );
      case 'toggle':
        return (
          <div className="toggle-switch">
            <input
              type="checkbox"
              id={`toggle-${item.id}`}
              checked={item.valor as boolean}
              onChange={(e) => handleValueChange(item.id, e.target.checked)}
            />
            <label htmlFor={`toggle-${item.id}`}></label>
          </div>
        );
      case 'select':
        return (
          <select
            value={item.valor as string}
            onChange={(e) => handleValueChange(item.id, e.target.value)}
            className="config-select"
          >
            {item.opciones?.map(opcion => (
              <option key={opcion} value={opcion}>
                {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="administrador" userName={userName}>
      <div className="configuracion-container">
        <div className="page-header">
          <h1>Configuración del Sistema</h1>
          <button 
            className={`save-button ${saveStatus}`}
            onClick={handleSaveChanges}
            disabled={saveStatus === 'saving'}
          >
            <span className="material-icons">
              {saveStatus === 'saving' ? 'hourglass_empty' : 
               saveStatus === 'saved' ? 'check_circle' : 'save'}
            </span>
            {saveStatus === 'saving' ? 'Guardando...' : 
             saveStatus === 'saved' ? 'Guardado' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="config-layout">
          <div className="config-sidebar">
            <div className="config-tabs">
              <button 
                className={`config-tab ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => handleTabChange('general')}
              >
                <span className="material-icons">settings</span>
                General
              </button>
              <button 
                className={`config-tab ${activeTab === 'seguridad' ? 'active' : ''}`}
                onClick={() => handleTabChange('seguridad')}
              >
                <span className="material-icons">security</span>
                Seguridad
              </button>
              <button 
                className={`config-tab ${activeTab === 'notificaciones' ? 'active' : ''}`}
                onClick={() => handleTabChange('notificaciones')}
              >
                <span className="material-icons">notifications</span>
                Notificaciones
              </button>
              <button 
                className={`config-tab ${activeTab === 'sistema' ? 'active' : ''}`}
                onClick={() => handleTabChange('sistema')}
              >
                <span className="material-icons">computer</span>
                Sistema
              </button>
            </div>
          </div>

          <div className="config-content">
            <div className="config-section">
              <h2 className="section-title">
                {activeTab === 'general' && 'Configuración General'}
                {activeTab === 'seguridad' && 'Configuración de Seguridad'}
                {activeTab === 'notificaciones' && 'Configuración de Notificaciones'}
                {activeTab === 'sistema' && 'Configuración del Sistema'}
              </h2>
              <p className="section-description">
                {activeTab === 'general' && 'Ajustes generales de la clínica dental.'}
                {activeTab === 'seguridad' && 'Configuración de seguridad y acceso al sistema.'}
                {activeTab === 'notificaciones' && 'Gestiona cómo y cuándo recibir notificaciones.'}
                {activeTab === 'sistema' && 'Configuración técnica del sistema.'}
              </p>

              <div className="config-items">
                {filteredItems.map(item => (
                  <div key={item.id} className="config-item">
                    <div className="config-item-info">
                      <h3 className="config-item-title">{item.nombre}</h3>
                      <p className="config-item-description">{item.descripcion}</p>
                    </div>
                    <div className="config-item-control">
                      {renderConfigInput(item)}
                    </div>
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