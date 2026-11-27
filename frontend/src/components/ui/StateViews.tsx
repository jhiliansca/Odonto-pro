import React from 'react';

interface StatePanelProps {
  icon: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const StatePanel: React.FC<StatePanelProps> = ({ icon, title, message, action }) => (
  <div className="state-panel">
    <span className="material-icons">{icon}</span>
    <strong>{title}</strong>
    {message ? <p>{message}</p> : null}
    {action}
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Cargando datos reales...' }) => (
  <div className="state-panel" role="status" aria-live="polite">
    <span className="state-spinner" />
    <strong>{label}</strong>
  </div>
);

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'No hay registros disponibles con los filtros seleccionados.' }) => (
  <StatePanel icon="inbox" title="Sin resultados" message={message} />
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <StatePanel
    icon="cloud_off"
    title="No se pudo cargar la información"
    message={message}
    action={onRetry ? (
      <button type="button" className="secondary-button" onClick={onRetry}>
        <span className="material-icons">refresh</span>
        Reintentar
      </button>
    ) : undefined}
  />
);
