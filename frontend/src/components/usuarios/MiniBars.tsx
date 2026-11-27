import React from 'react';

export interface ChartDatum {
  etiqueta: string;
  valor: number;
  color?: string;
}

interface MiniBarsProps {
  titulo: string;
  datos: ChartDatum[];
  sufijo?: string;
}

const PALETA = ['#0ea5e9', '#8b5cf6', '#16a34a', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899', '#64748b'];

export const MiniBars: React.FC<MiniBarsProps> = ({ titulo, datos, sufijo = '' }) => {
  const valores = datos.length ? datos : [{ etiqueta: 'Sin datos', valor: 0, color: '#cbd5e1' }];
  const maximo = Math.max(1, ...valores.map((dato) => Number(dato.valor) || 0));
  const ancho = 640;
  const alto = 220;
  const base = 182;
  const paso = ancho / valores.length;
  const anchoBarra = Math.min(54, paso * 0.58);

  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h2>{titulo}</h2>
      </div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={titulo}>
        {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
          const y = base - (base - 24) * factor;
          return (
            <g key={factor}>
              <line x1={34} y1={y} x2={ancho - 10} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={28} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {Math.round(maximo * factor)}
              </text>
            </g>
          );
        })}
        {valores.map((dato, indice) => {
          const valor = Math.max(0, Number(dato.valor) || 0);
          const altura = Math.max(3, ((base - 24) * valor) / maximo);
          const x = 34 + indice * paso + (paso - anchoBarra) / 2;
          const y = base - altura;
          const color = dato.color || PALETA[indice % PALETA.length];
          return (
            <g key={`${dato.etiqueta}-${indice}`}>
              <rect x={x} y={y} width={anchoBarra} height={altura} rx="5" fill={color}>
                <title>{`${dato.etiqueta}: ${valor}${sufijo}`}</title>
              </rect>
              <text x={x + anchoBarra / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#334155">
                {valor}{sufijo}
              </text>
              <text x={x + anchoBarra / 2} y={base + 18} textAnchor="middle" fontSize="11" fill="#64748b">
                {dato.etiqueta.length > 14 ? `${dato.etiqueta.slice(0, 13)}…` : dato.etiqueta}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MiniBars;
