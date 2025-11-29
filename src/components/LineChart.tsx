'use client';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export default function LineChart({ data, height = 200, color = '#3b82f6', showGrid = true }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const padding = 40;
  const width = 600;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  // Calcular pontos
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  // Criar path
  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  // Criar área abaixo da linha (gradiente)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {showGrid && (
        <g className="opacity-10">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + chartHeight * ratio}
              x2={width - padding}
              y2={padding + chartHeight * ratio}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}
        </g>
      )}

      {/* Área sob a linha */}
      <path d={areaD} fill="url(#lineGradient)" />

      {/* Linha principal */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pontos */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill={p.color || color}
            stroke="#000"
            strokeWidth="2"
          />
          {/* Label */}
          <text
            x={p.x}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-gray-400"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
