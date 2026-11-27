export interface PdfReporteOptions {
  titulo: string;
  subtitulo?: string;
  modulo: string;
  generadoPor: string;
  fecha?: string;
  resumen: { label: string; value: string | number }[];
  columnas: string[];
  filas: (string | number)[][];
  notas: string;
}

function esc(v: unknown) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function descargarReportePdf(opts: PdfReporteOptions) {
  const fecha = opts.fecha || new Date().toLocaleString('es-BO');
  const logo = `${window.location.origin}/logoclinica.jpg`;
  const resumenHtml = (opts.resumen || []).map(r => `<div class="kpi"><span>${esc(r.label)}</span><strong>${esc(r.value)}</strong></div>`).join('');
  const thead = opts.columnas.map(c => `<th>${esc(c)}</th>`).join('');
  const tbody = opts.filas.map(f => `<tr>${f.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${opts.columnas.length}" class="empty">Sin datos registrados</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(opts.titulo)} - Clínica Unifranz</title>
  <style>
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#1f2937;background:#fff}
    .page{padding:28px 32px} .header{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:3px solid #0d9488;padding-bottom:16px;margin-bottom:18px}
    .brand{display:flex;gap:14px;align-items:center}.brand img{width:64px;height:64px;object-fit:cover;border-radius:12px;border:2px solid #ccfbf1}
    .brand h1{margin:0;font-size:24px;color:#0f766e}.brand p{margin:2px 0 0;color:#475569;font-size:13px}
    .meta{text-align:right;font-size:12px;color:#475569}.meta strong{display:block;color:#0f172a;font-size:13px;margin-bottom:4px}
    .title{margin:0 0 4px;font-size:22px;color:#0f172a}.subtitle{margin:0 0 18px;color:#475569;font-size:13px}
    .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 18px}
    .kpi{border:1px solid #dbeafe;background:#f8fafc;border-radius:10px;padding:10px 12px}.kpi span{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}.kpi strong{font-size:18px;color:#0f766e}
    table{width:100%;border-collapse:collapse;font-size:12px} th,td{border:1px solid #e2e8f0;padding:8px 9px;text-align:left;vertical-align:top}
    th{background:#0f766e;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.03em} tr:nth-child(even) td{background:#f8fafc}
    .empty{text-align:center;color:#64748b;padding:18px}.notes{margin-top:14px;font-size:11px;color:#475569}
    .footer{margin-top:22px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#64748b}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:18px}}
  </style></head><body><div class="page">
    <div class="header"><div class="brand"><img src="${logo}" onerror="this.style.display='none'"/><div><h1>Clínica Unifranz</h1><p>Clínica Odontológica Unifranz · Sistema de Gestión de Inventario</p></div></div>
    <div class="meta"><strong>Reporte del sistema</strong><div>Módulo: ${esc(opts.modulo || 'General')}</div><div>Generado: ${esc(fecha)}</div><div>Por: ${esc(opts.generadoPor || 'Sistema')}</div></div></div>
    <h2 class="title">${esc(opts.titulo)}</h2><p class="subtitle">${esc(opts.subtitulo || 'Reporte generado con datos reales registrados en Clínica Unifranz.')}</p>
    ${resumenHtml ? `<div class="kpis">${resumenHtml}</div>` : ''}
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
    ${opts.notas ? `<div class="notes"><strong>Notas:</strong> ${esc(opts.notas)}</div>` : ''}
    <div class="footer"><span>Clínica Unifranz · Documento generado automáticamente</span><span>${esc(fecha)}</span></div>
  </div><script>window.onload=()=>{setTimeout(()=>{window.print()},350)};</script></body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Permite ventanas emergentes para descargar el PDF.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
