export function EvolutionChart({ data, labels, yMin, yMax }: {
  data: number[]; labels: string[]; yMin: number; yMax: number;
}) {
  const W = 400, H = 168, padL = 36, padR = 18, padT = 12, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i: number) => padL + (i / (data.length - 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const line = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} ${x(data.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} ${padL},${(padT + plotH).toFixed(1)}`;
  const grid = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Évolution">
      <defs>
        <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1FB2FF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1FB2FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="#282E36" />
          <text x={6} y={y(g) + 3} fill="#5A636C" fontFamily="Space Mono, monospace" fontSize="9">{g}</text>
        </g>
      ))}
      <polygon points={area} fill="url(#evo)" />
      <polyline points={line} fill="none" stroke="#1FB2FF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 4 : 2.5}
          fill={i === data.length - 1 ? "#0C0E11" : "#1FB2FF"}
          stroke={i === data.length - 1 ? "#FFB23E" : "none"} strokeWidth="2.5" />
      ))}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={H - 12} textAnchor="middle" fill="#5A636C" fontFamily="Space Mono, monospace" fontSize="9">{l}</text>
      ))}
    </svg>
  );
}
