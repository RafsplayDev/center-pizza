// =============================================================
// Center Pizza · SalesChart
// Gráfico de "Vendas por hora" (placeholder visual)
// =============================================================

'use client';

const hours = [
  '14H', '15H', '16H', '17H', '18H', '19H',
  '20H', '21H', '22H', '23H', '00H', '01H', '02H', '03H',
];

// Dados mock normalizados (0–1)
const dataTotal = [0.15, 0.2, 0.25, 0.35, 0.55, 0.7, 0.95, 0.85, 0.65, 0.5, 0.3, 0.15, 0.08, 0.03];
const dataPizzas = [0.1, 0.15, 0.2, 0.28, 0.45, 0.6, 0.85, 0.75, 0.55, 0.4, 0.22, 0.1, 0.05, 0.02];

export default function SalesChart() {
  const chartH = 120;
  const activeHour = 6; // 20H index

  return (
    <div
      className="rounded-xl border-2 overflow-hidden"
      style={{ backgroundColor: '#fff', borderColor: 'var(--cp-line)' }}
    >
      {/* Header */}
      <div
        className="flex items-end justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--cp-line)' }}
      >
        <div>
          <h3
            className="text-base font-black m-0"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cp-ink)', fontSize: '18px' }}
          >
            Vendas por hora
          </h3>
          <p
            className="text-[11px] font-semibold m-0 mt-0.5"
            style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
          >
            14h às 03h · turno de hoje
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--cp-ink-muted)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--cp-ink)' }} />
            Total
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--cp-ink-muted)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--cp-red)' }} />
            Pizzas
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="px-6 pt-6 pb-4">
        {/* SVG chart */}
        <div className="relative" style={{ height: `${chartH}px` }}>
          <svg width="100%" height={chartH} viewBox={`0 0 ${hours.length * 50} ${chartH}`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1="0"
                y1={chartH - pct * chartH}
                x2={hours.length * 50}
                y2={chartH - pct * chartH}
                stroke="var(--cp-line)"
                strokeWidth="1"
                strokeDasharray={pct === 0 ? undefined : '4 4'}
              />
            ))}

            {/* Total area */}
            <path
              d={`M${dataTotal.map((v, i) => `${i * 50 + 25},${chartH - v * chartH * 0.9}`).join(' L')} L${(hours.length - 1) * 50 + 25},${chartH} L25,${chartH} Z`}
              fill="rgba(31,27,26,0.06)"
            />
            {/* Total line */}
            <polyline
              points={dataTotal.map((v, i) => `${i * 50 + 25},${chartH - v * chartH * 0.9}`).join(' ')}
              fill="none"
              stroke="var(--cp-ink)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pizza area */}
            <path
              d={`M${dataPizzas.map((v, i) => `${i * 50 + 25},${chartH - v * chartH * 0.9}`).join(' L')} L${(hours.length - 1) * 50 + 25},${chartH} L25,${chartH} Z`}
              fill="rgba(227,6,19,0.06)"
            />
            {/* Pizza line */}
            <polyline
              points={dataPizzas.map((v, i) => `${i * 50 + 25},${chartH - v * chartH * 0.9}`).join(' ')}
              fill="none"
              stroke="var(--cp-red)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active hour dot */}
            <circle
              cx={activeHour * 50 + 25}
              cy={chartH - dataTotal[activeHour] * chartH * 0.9}
              r="4"
              fill="var(--cp-ink)"
              stroke="var(--cp-cream)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Hour labels */}
        <div className="flex mt-2">
          {hours.map((h, i) => (
            <span
              key={h}
              className="flex-1 text-center text-[10px] font-bold"
              style={{
                color: i === activeHour ? 'var(--cp-ink)' : 'var(--cp-ink-faint)',
                fontFamily: 'var(--font-body)',
                fontWeight: i === activeHour ? 900 : 600,
              }}
            >
              {h}
              {i === activeHour && (
                <span
                  className="block w-1.5 h-1.5 rounded-full mx-auto mt-1"
                  style={{ backgroundColor: 'var(--cp-ink)' }}
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
