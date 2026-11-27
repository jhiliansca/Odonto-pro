'use strict';

const express = require('express');
const { asyncHandler, httpError, toInt } = require('../utils');

const router = express.Router();

const GRAFANA = {
  url: (process.env.GRAFANA_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  token: process.env.GRAFANA_API_TOKEN || '',
  orgId: toInt(process.env.GRAFANA_ORG_ID, 1) || 1,
  dashboardUid: process.env.GRAFANA_DASHBOARD_UID || 'odonto-inv-real',
  dashboardSlug:
    process.env.GRAFANA_DASHBOARD_SLUG || 'odonto-pro-inventario-datos-reales',
  embedEnabled:
    String(process.env.GRAFANA_EMBED_ENABLED || 'true').toLowerCase() === 'true',
};

const GRAFANA_PANELS = [
  { id: 1, title: 'Valor total del inventario', tipo: 'stat' },
  { id: 2, title: 'Insumos bajo stock mínimo', tipo: 'gauge' },
  { id: 3, title: 'Insumos sin precio cargado', tipo: 'stat' },
  { id: 4, title: 'Valoración por categoría', tipo: 'piechart' },
  { id: 5, title: 'Alertas de stock mínimo', tipo: 'table' },
  { id: 6, title: 'Insumos más usados en el catálogo', tipo: 'barchart' },
  { id: 7, title: 'Consumo temporal de insumos', tipo: 'timeseries' },
  { id: 8, title: 'Top 10 insumos más consumidos', tipo: 'barchart' },
];

router.get(
  '/inventario/analitica/grafana',
  asyncHandler(async (_req, res) => {
    res.json({
      enabled: GRAFANA.embedEnabled,
      baseUrl: GRAFANA.url,
      orgId: GRAFANA.orgId,
      dashboardUid: GRAFANA.dashboardUid,
      dashboardSlug: GRAFANA.dashboardSlug,
      theme: 'light',
      panels: GRAFANA_PANELS,
      renderEndpoint: '/api/inventario/analitica/grafana/render',
      hasToken: Boolean(GRAFANA.token),
    });
  })
);

router.get(
  '/inventario/analitica/grafana/render',
  asyncHandler(async (req, res) => {
    if (!GRAFANA.token) {
      throw httpError(503, 'Grafana no está configurado (falta GRAFANA_API_TOKEN).');
    }

    const panelId = toInt(req.query.panelId, 1) || 1;
    const width = Math.min(2000, Math.max(200, toInt(req.query.width, 900)));
    const height = Math.min(1200, Math.max(120, toInt(req.query.height, 320)));
    const from = String(req.query.from || 'now-60d');
    const to = String(req.query.to || 'now');

    const target = new URL(
      `${GRAFANA.url}/render/d-solo/${GRAFANA.dashboardUid}/${GRAFANA.dashboardSlug}`
    );
    target.searchParams.set('orgId', String(GRAFANA.orgId));
    target.searchParams.set('panelId', String(panelId));
    target.searchParams.set('width', String(width));
    target.searchParams.set('height', String(height));
    target.searchParams.set('from', from);
    target.searchParams.set('to', to);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(target, {
        headers: { Authorization: `Bearer ${GRAFANA.token}` },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw httpError(502, `Grafana respondió con estado ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      res.set('Content-Type', response.headers.get('content-type') || 'image/png');
      res.set('Cache-Control', 'private, max-age=30');
      res.send(buffer);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw httpError(504, 'Tiempo de espera agotado al consultar Grafana.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  })
);

module.exports = router;
