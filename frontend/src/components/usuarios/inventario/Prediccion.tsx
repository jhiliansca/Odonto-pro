import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import Card from '../Card';
import { catalogoApi } from '../../../services/catalogoApi';
import type { Prediccion as DatosPrediccion } from '../../../services/catalogoApi';
import { formatBs, formatNumero } from '../../../utils/formato';
import { useCurrentUserName } from '../../../hooks/useCurrentUser';
import './Prediccion.css';

function diaCorto(iso: string): string {
  const partes = iso.slice(0, 10).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}` : iso;
}

const Prediccion: React.FC = () => {
  const navigate = useNavigate();
  const userName = useCurrentUserName('Inventario');
  const [dias, setDias] = useState(60);
  const [horizonte, setHorizonte] = useState(7);
  const [datos, setDatos] = useState<DatosPrediccion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await catalogoApi.prediccion({ dias, horizonte }));
    } catch (err) {
      setDatos(null);
      setError(err instanceof Error ? err.message : 'No se pudo cargar la predicción.');
    } finally {
      setCargando(false);
    }
  }, [dias, horizonte]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const grafico = useMemo(() => {
    const historico = datos?.serie || [];
    const pronostico = datos?.pronostico || [];
    const ancho = 920;
    const alto = 320;
    const padding = { top: 24, right: 26, bottom: 46, left: 56 };
    const anchoUtil = ancho - padding.left - padding.right;
    const altoUtil = alto - padding.top - padding.bottom;
    const total = historico.length + pronostico.length;
    const maxDato = Math.max(
      1,
      ...historico.map((punto) => punto.cantidad),
      ...pronostico.map((punto) => punto.superior)
    );
    const maxValor = Math.ceil(maxDato * 1.12);
    const x = (indice: number) => padding.left + (anchoUtil * indice) / Math.max(1, total - 1);
    const y = (valor: number) => padding.top + altoUtil - (altoUtil * valor) / maxValor;
    const corte = Math.max(0, historico.length - 1);

    const puntosHistorico = historico.map((punto, indice) => `${x(indice)},${y(punto.cantidad)}`).join(' ');
    const puntosPronostico = [
      ...(historico.length ? [`${x(corte)},${y(historico[corte].cantidad)}`] : []),
      ...pronostico.map((punto, indice) => `${x(historico.length + indice)},${y(punto.valor)}`),
    ].join(' ');

    const banda = pronostico.length && historico.length
      ? [
          `M ${x(corte)} ${y(historico[corte].cantidad)}`,
          ...pronostico.map((punto, indice) => `L ${x(historico.length + indice)} ${y(punto.superior)}`),
          ...[...pronostico].reverse().map((punto, indice) =>
            `L ${x(historico.length + pronostico.length - 1 - indice)} ${y(punto.inferior)}`
          ),
          'Z',
        ].join(' ')
      : '';

    const paso = Math.max(1, Math.ceil(total / 7));
    const etiquetas = [
      ...historico.map((punto, indice) => ({ dia: punto.dia, indice })),
      ...pronostico.map((punto, indice) => ({ dia: punto.dia, indice: historico.length + indice })),
    ].filter(({ indice }) => indice % paso === 0 || indice === total - 1);

    return {
      ancho,
      alto,
      padding,
      maxValor,
      x,
      y,
      corte,
      historico,
      pronostico,
      puntosHistorico,
      puntosPronostico,
      banda,
      etiquetas,
    };
  }, [datos]);

  const critico = datos?.materiales.find((material) => material.riesgo !== 'normal') || datos?.materiales[0];
  const cobertura = critico?.coberturaMeses ?? 0;
  const circunferencia = 2 * Math.PI * 52;
  const fraccionCobertura = Math.min(1, Math.max(0, cobertura / 3));
  const coberturaOk = cobertura >= 1.5;
  const maxProyectado = Math.max(1, ...(datos?.materiales.map((material) => material.proyectado) || []));

  return (
    <DashboardLayout userType="inventario" userName={userName}>
      <div className="prediccion-container">
        <div className="page-header">
          <div>
            <h1>Predicción de Demanda</h1>
            <p className="prediccion-subtitulo">
              Modelo de regresión lineal calculado con las salidas reales registradas en el inventario.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className={`prediccion-estado ${datos ? 'ok' : 'alerta'}`}>
              <span className="material-icons">trending_up</span>
              <span>{datos ? 'Modelo activo' : 'Sin datos suficientes'}</span>
            </span>
            <button type="button" className="cancel-button" onClick={() => void cargar()} disabled={cargando}>
              <span className="material-icons">refresh</span>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="no-results" role="alert">
            <span className="material-icons">cloud_off</span>
            <p>{error}</p>
            <button className="cancel-button" onClick={() => void cargar()}>Reintentar</button>
          </div>
        ) : null}

        <div className="prediccion-controles">
          <div className="control-group">
            <label htmlFor="pred-dias"><span className="material-icons">calendar_month</span> Histórico</label>
            <select id="pred-dias" value={dias} onChange={(evento) => setDias(Number(evento.target.value))}>
              <option value={30}>Últimos 30 días</option>
              <option value={60}>Últimos 60 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="pred-horizonte"><span className="material-icons">date_range</span> Pronóstico</label>
            <select id="pred-horizonte" value={horizonte} onChange={(evento) => setHorizonte(Number(evento.target.value))}>
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>
          <div className="control-resumen">
            <span className="control-resumen-label">Registros analizados</span>
            <strong>{formatNumero(datos?.serie.length || dias)} días reales</strong>
          </div>
          <div className="control-resumen">
            <span className="control-resumen-label">Actualizado</span>
            <strong>
              {datos?.generadoEn
                ? new Date(datos.generadoEn).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </strong>
          </div>
        </div>

        {datos ? (
          <>
            <div className="stats-grid">
              <Card title="Promedio diario" value={`${formatNumero(datos.resumen.promedioDiario, 1)} und.`} icon="show_chart" color="#059669" />
              <Card
                title="Tendencia diaria"
                value={`${datos.resumen.tendencia >= 0 ? '+' : ''}${formatNumero(datos.resumen.tendencia, 2)} und.`}
                icon="trending_up"
                color={datos.resumen.tendencia >= 0 ? '#f59e0b' : '#0ea5e9'}
              />
              <Card title="Demanda proyectada" value={`${formatNumero(datos.resumen.proyectadoTotal, 1)} und.`} icon="analytics" color="#f59e0b" />
              <Card title="Valor proyectado" value={formatBs(datos.resumen.valorProyectado, 2)} icon="payments" color="#7c3aed" />
              <Card title="Lotes con caducidad" value={formatNumero(datos.caducidades?.totalLotes ?? 0)} icon="event" color="#ef4444" />
              <Card title="Valor en riesgo" value={formatBs(datos.caducidades?.valorEnRiesgo ?? 0)} icon="event_busy" color="#dc2626" />
            </div>

            <div className="prediccion-seccion">
              <div className="seccion-titulo">
                <h2><span className="material-icons">query_stats</span> Demanda real vs. proyección</h2>
                <p>Salidas diarias observadas y estimación para los próximos {horizonte} días</p>
              </div>
              <div className="prediccion-grid">
                <div className="dashboard-panel prediccion-grafico">
                  <div className="panel-header">
                    <div>
                      <h3>Consumo de insumos</h3>
                      <p className="panel-subtitulo">Banda de confianza estimada a partir de la desviación histórica</p>
                    </div>
                    <div className="grafico-leyenda">
                      <span className="leyenda-item"><span className="leyenda-color historico" /> Real</span>
                      <span className="leyenda-item"><span className="leyenda-color proyeccion" /> Proyectado</span>
                      <span className="leyenda-item"><span className="leyenda-color banda" /> Confianza</span>
                    </div>
                  </div>

                  {grafico.historico.length && !datos?.sinDatos ? (
                    <svg className="grafico-svg" viewBox={`0 0 ${grafico.ancho} ${grafico.alto}`} role="img" aria-label="Gráfico de predicción de demanda">
                      {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
                        const valor = grafico.maxValor * factor;
                        return (
                          <g key={factor}>
                            <line className="grid-line" x1={grafico.padding.left} y1={grafico.y(valor)} x2={grafico.ancho - grafico.padding.right} y2={grafico.y(valor)} />
                            <text className="eje-texto" x={grafico.padding.left - 10} y={grafico.y(valor) + 4} textAnchor="end">{formatNumero(valor, 1)}</text>
                          </g>
                        );
                      })}

                      {grafico.banda ? <path className="banda-confianza" d={grafico.banda} /> : null}

                      <polyline className="linea-historica" points={grafico.puntosHistorico} />
                      {grafico.pronostico.length ? <polyline className="linea-proyeccion" points={grafico.puntosPronostico} /> : null}

                      {grafico.historico.map((punto, indice) => (
                        <circle key={`h-${punto.dia}`} className="punto-historico" cx={grafico.x(indice)} cy={grafico.y(punto.cantidad)} r={2.4}>
                          <title>{`${diaCorto(punto.dia)} · Real: ${formatNumero(punto.cantidad, 1)} und.`}</title>
                        </circle>
                      ))}
                      {grafico.pronostico.map((punto, indice) => (
                        <circle key={`p-${punto.dia}`} className="punto-proyeccion" cx={grafico.x(grafico.historico.length + indice)} cy={grafico.y(punto.valor)} r={2.8}>
                          <title>{`${diaCorto(punto.dia)} · Proyectado: ${formatNumero(punto.valor, 1)} und. (${formatNumero(punto.inferior, 1)} – ${formatNumero(punto.superior, 1)})`}</title>
                        </circle>
                      ))}

                      {grafico.historico.length && grafico.pronostico.length ? (
                        <g>
                          <line className="linea-divisoria" x1={grafico.x(grafico.corte)} y1={grafico.padding.top} x2={grafico.x(grafico.corte)} y2={grafico.alto - grafico.padding.bottom} />
                          <text className="division-texto" x={grafico.x(grafico.corte) + 6} y={grafico.padding.top + 12}>HOY</text>
                        </g>
                      ) : null}

                      {grafico.etiquetas.map(({ dia, indice }) => (
                        <text key={`e-${indice}-${dia}`} className={`eje-texto ${indice >= grafico.historico.length ? 'eje-proyeccion' : ''}`} x={grafico.x(indice)} y={grafico.alto - grafico.padding.bottom + 20} textAnchor="middle">
                          {diaCorto(dia)}
                        </text>
                      ))}
                      <text className="eje-titulo" x={12} y={16}>UND.</text>
                    </svg>
                  ) : (
                    <div className="no-results"><p>No hay movimientos en el periodo seleccionado.</p></div>
                  )}

                  <div className="grafico-pie">
                    <div className="ecuacion-modelo">
                      <span className="material-icons">functions</span>
                      <div>
                        Demanda(día) = {formatNumero(datos.modelo.pendiente, 3)} × día + {formatNumero(datos.modelo.intercepto, 3)}
                        <em>Regresión lineal por mínimos cuadrados sobre {datos.serie.length} días de salidas reales</em>
                      </div>
                    </div>
                    <div className="modelo-chips">
                      <span className="chip">R² = {formatNumero(datos.modelo.r2, 3)}</span>
                      <span className="chip">Observaciones: {formatNumero(datos.resumen.consumoTotal, 0)} und.</span>
                      <span className="chip">Horizonte: {datos.horizonte} días</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-panel cobertura-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Cobertura de stock</h3>
                      <p className="panel-subtitulo">Insumo con mayor riesgo según la demanda proyectada</p>
                    </div>
                    <span className={`cobertura-badge ${coberturaOk ? 'ok' : 'alerta'}`}>
                      {coberturaOk ? 'Cubierto' : 'Atención'}
                    </span>
                  </div>

                  {critico ? (
                    <>
                      <div className="cobertura-gauge">
                        <svg viewBox="0 0 132 132" role="img" aria-label="Cobertura en meses">
                          <circle className="gauge-track" cx="66" cy="66" r="52" />
                          <circle
                            className={`gauge-valor ${coberturaOk ? 'ok' : 'alerta'}`}
                            cx="66"
                            cy="66"
                            r="52"
                            strokeDasharray={`${fraccionCobertura * circunferencia} ${circunferencia}`}
                            transform="rotate(-90 66 66)"
                          />
                          <text className="gauge-numero" x="66" y="66" textAnchor="middle">{formatNumero(cobertura, 1)}</text>
                          <text className="gauge-label" x="66" y="84" textAnchor="middle">meses</text>
                        </svg>
                        <div className="cobertura-resumen">
                          <strong>{critico.material}</strong>
                          <span>Stock actual: {formatNumero(critico.stock, 1)} {critico.unidad}</span>
                          <span>Mínimo: {formatNumero(critico.stockMinimo, 1)} {critico.unidad}</span>
                          <span>Demanda estimada: {formatNumero(critico.proyectado, 1)} {critico.unidad}</span>
                        </div>
                      </div>

                      <div className={`recomendacion ${coberturaOk ? 'ok' : 'alerta'}`}>
                        <span className="material-icons">{coberturaOk ? 'check_circle' : 'warning'}</span>
                        <div>
                          <h3>{coberturaOk ? 'Stock suficiente' : 'Reposición recomendada'}</h3>
                          <p>
                            {coberturaOk ? `El inventario actual cubre ${formatNumero(cobertura, 1)} meses la demanda proyectada.`
                              : `Reponer ${formatNumero(Math.max(0, critico.proyectado - critico.stock), 1)} ${critico.unidad} para cubrir el horizonte de ${datos.horizonte} días.`}
                          </p>
                        </div>
                      </div>

                      <ul className="recomendacion-detalles">
                        <li><span>Consumo real en el periodo</span><strong>{formatNumero(critico.consumido, 1)} {critico.unidad}</strong></li>
                        <li><span>Promedio diario</span><strong>{formatNumero(critico.promedioDiario, 2)} {critico.unidad}</strong></li>
                        <li><span>Tendencia</span><strong>{critico.tendencia >= 0 ? '+' : ''}{formatNumero(critico.tendencia, 2)} und./día</strong></li>
                        <li><span>Valor unitario</span><strong>{formatBs(critico.precio, 2)}</strong></li>
                      </ul>
                      <div className="cobertura-barra"><span style={{ width: `${fraccionCobertura * 100}%` }} /></div>
                      <p className="cobertura-nota">La escala de la barra representa 3 meses de cobertura.</p>
                      <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> este medidor estima cuánto tiempo alcanza el stock actual del insumo más riesgoso según la demanda proyectada. Menos de 1.5 meses sugiere planificar reposición.</p>
                    </>
                  ) : (
                    <div className="no-results"><p>No hay consumo registrado para calcular cobertura.</p></div>
                  )}
                </div>
              </div>
            </div>

            <div className="prediccion-seccion">
              <div className="seccion-titulo">
                <h2><span className="material-icons">event_available</span> Caducidad proyectada</h2>
                <p>Lotes activos que vencen dentro del horizonte seleccionado y su impacto sobre el stock disponible</p>
              </div>
              <div className="dashboard-panel prediccion-caducidades">
                <div className="panel-header">
                  <div>
                    <h3>Lotes con vencimiento próximo</h3>
                    <p className="panel-subtitulo">Prioriza el consumo de estos lotes antes de programar nuevas entradas</p>
                  </div>
                  <button type="button" className="cancel-button" onClick={() => navigate('/inventario/caducidades')}>
                    <span className="material-icons">event_available</span>
                    Control de caducidad
                  </button>
                </div>
                <div className="prediccion-caducidades-grid">
                  <div className="detalle-stat"><span>Unidades afectadas</span><strong>{formatNumero(datos.caducidades?.totalUnidades ?? 0, 1)}</strong></div>
                  <div className="detalle-stat"><span>Lotes registrados</span><strong>{formatNumero(datos.caducidades?.totalLotes ?? 0)}</strong></div>
                  <div className="detalle-stat"><span>Valor en riesgo</span><strong>{formatBs(datos.caducidades?.valorEnRiesgo ?? 0)}</strong></div>
                  <div className="detalle-stat"><span>Horizonte</span><strong>{datos.caducidades?.horizonte ?? datos.horizonte} días</strong></div>
                </div>
                <ul className="prediccion-caducidades-lista">
                  {(datos.caducidades?.lotes ?? []).slice(0, 6).map((lote) => (
                    <li key={lote.id} className={lote.estadoCaducidad === 'vencido' || lote.estadoCaducidad === 'hoy' ? 'vencido' : lote.estadoCaducidad === 'proximo' ? 'proximo' : 'normal'}>
                      <span className="material-icons">{lote.estadoCaducidad === 'vencido' ? 'event_busy' : 'event'}</span>
                      <div>
                        <strong>{lote.material} · {lote.codigoLote}</strong>
                        <small>{diaCorto(lote.fechaVencimiento)} · {formatNumero(lote.cantidadActual, 1)} {lote.unidad} · {lote.ubicacion || 'Sin ubicación'}</small>
                      </div>
                      <span className="prediccion-caducidades-dias">
                        {lote.diasRestantes < 0 ? `Vencido ${Math.abs(lote.diasRestantes)}d` : `${lote.diasRestantes}d`}
                      </span>
                    </li>
                  ))}
                  {!datos.caducidades?.lotes?.length ? <li className="prediccion-caducidades-vacio">No hay lotes que venzan en el horizonte seleccionado.</li> : null}
                </ul>
                <p className="analitica-nota-grafica"><strong>Cómo leerlo:</strong> el stock disponible de la proyección descuenta las unidades próximas a vencer. Un lote vencido debe descartarse y registrarse como salida desde el control de caducidad.</p>
              </div>
            </div>

            <div className="prediccion-seccion">
              <div className="seccion-titulo">
                <h2><span className="material-icons">inventory_2</span> Proyección por insumo</h2>
                <p>Top 8 insumos con mayor consumo real en el periodo seleccionado</p>
              </div>
              <div className="dashboard-panel prediccion-tabla">
                <table>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Consumido</th>
                      <th>Promedio diario</th>
                      <th>Proyección {datos.horizonte}d</th>
                      <th>Cobertura</th>
                      <th>R²</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.materiales.map((material) => (
                      <tr key={material.id} className={material.riesgo === 'critico' ? 'fila-maxima' : ''}>
                        <td>
                          <strong>{material.material}</strong>
                          <div className="mes-celda"><span>Stock {formatNumero(material.stock, 1)} {material.unidad} · {formatBs(material.precio, 2)}</span></div>
                        </td>
                        <td>{formatNumero(material.consumido, 1)}</td>
                        <td>{formatNumero(material.promedioDiario, 2)}</td>
                        <td>
                          <div className="celda-barra">
                            <strong>{formatNumero(material.proyectado, 1)} {material.unidad}</strong>
                            <span className="barra-mini-track">
                              <span className="barra-mini-valor" style={{ width: `${(material.proyectado / maxProyectado) * 100}%` }} />
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`variacion-celda ${material.riesgo === 'normal' ? 'negativa' : 'positiva'}`}>
                            <span className="material-icons">{material.riesgo === 'normal' ? 'check_circle' : 'warning'}</span>
                            {formatNumero(material.coberturaMeses, 1)} mes.
                          </span>
                        </td>
                        <td>{formatNumero(material.r2, 3)}</td>
                      </tr>
                    ))}
                    {datos.materiales.length === 0 && <tr><td colSpan={6}>No hay datos disponibles.</td></tr>}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total del periodo</td>
                      <td>{formatNumero(datos.resumen.consumoTotal, 1)} und.</td>
                      <td>{formatNumero(datos.resumen.promedioDiario, 2)} und.</td>
                      <td>{formatNumero(datos.resumen.proyectadoTotal, 1)} und.</td>
                      <td>{formatBs(datos.resumen.valorProyectado, 2)}</td>
                      <td>{formatNumero(datos.resumen.r2, 3)}</td>
                    </tr>
                  </tfoot>
                </table>
                <p className="analitica-nota-grafica" style={{padding:'0.8rem 1rem 1rem'}}><strong>Cómo leerlo:</strong> compara consumo histórico, promedio diario y proyección por insumo. R² cercano a 1 indica un patrón más estable; cobertura baja con proyección alta indica prioridad de compra.</p>
              </div>
            </div>
          </>
        ) : !cargando && !error ? (
          <div className="dashboard-panel">
            <div className="no-results">
              <span className="material-icons">history</span>
              <h3>Sin movimientos históricos</h3>
              <p>Registra movimientos de días anteriores para generar la predicción.</p>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Prediccion;
