// =============================================================================
// Cliente de la Analítica de Inventario (integración con Grafana)
// -----------------------------------------------------------------------------
// Consume los endpoints seguros expuestos por backend/routes/analitica.js.
// Las credenciales de Grafana nunca llegan al navegador: los paneles se
// solicitan al proxy del backend.
// =============================================================================

const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001'
).replace(/\/api$/, '');

export interface GrafanaPanel {
  id: number;
  title: string;
  tipo: string;
}

export interface GrafanaConfig {
  enabled: boolean;
  baseUrl: string;
  orgId: number;
  dashboardUid: string;
  dashboardSlug: string;
  theme: string;
  panels: GrafanaPanel[];
  renderEndpoint: string;
  hasToken: boolean;
}

export async function fetchGrafanaConfig(): Promise<GrafanaConfig> {
  const res = await fetch(`${API_BASE}/api/inventario/analitica/grafana`);
  if (!res.ok) {
    throw new Error(`No se pudo cargar la configuración de Grafana (HTTP ${res.status})`);
  }
  return res.json();
}

export interface GrafanaRenderOptions {
  width?: number;
  height?: number;
  from?: string;
  to?: string;
}

/** URL del proxy seguro que devuelve el PNG del panel renderizado por Grafana. */
export function grafanaPanelUrl(
  config: GrafanaConfig,
  panelId: number,
  options: GrafanaRenderOptions = {}
): string {
  const params = new URLSearchParams({
    panelId: String(panelId),
    width: String(options.width ?? 900),
    height: String(options.height ?? 300),
    from: options.from ?? 'now-60d',
    to: options.to ?? 'now',
  });
  return `${API_BASE}${config.renderEndpoint}?${params.toString()}`;
}

export { API_BASE };
