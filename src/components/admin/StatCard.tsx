// =============================================================
// Center Pizza · StatCard
// Card de métrica individual do dashboard
// Contorno decorativo apenas no topo
// =============================================================

import { ArrowUpIcon, ArrowDownIcon } from './icons';

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
export type StatItem = {
  icon: React.ReactNode;
  label: string;
  prefix?: string;
  value: string;
  suffix?: string;
  change: string;
  positive: boolean;
  highlight?: boolean;
};

// -------------------------------------------------------------
// Componente
// -------------------------------------------------------------
export default function StatCard({
  icon,
  label,
  prefix,
  value,
  suffix,
  change,
  positive,
  highlight = false,
}: StatItem) {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ backgroundColor: '#fff', borderColor: 'var(--cp-line)' }}
    >
      {/* Barra de topo */}
      <div
        style={{
          height: highlight ? '4px' : '3px',
          backgroundColor: highlight ? 'var(--cp-red)' : 'var(--cp-ink)',
        }}
      />

      {/* Conteúdo */}
      <div className="px-5 py-4">
        {/* Icon + Label */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span style={{ color: 'var(--cp-ink-faint)' }}>{icon}</span>
          <span
            className="text-[9px] font-black tracking-[0.14em] uppercase"
            style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
          >
            {label}
          </span>
        </div>

        {/* Valor */}
        <div className="flex items-baseline gap-0.5">
          {prefix && (
            <span
              className="text-[12px] font-black self-start mt-[4px]"
              style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
            >
              {prefix}
            </span>
          )}
          <span
            className="text-[36px] leading-none"
            style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-display)' }}
          >
            {value}
          </span>
          {suffix && (
            <span
              className="text-[16px] font-bold"
              style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
            >
              {suffix}
            </span>
          )}
        </div>

        {/* Variação */}
        <div className="flex items-center gap-1 mt-2">
          {positive ? (
            <ArrowUpIcon size={8} />
          ) : (
            <ArrowDownIcon size={8} />
          )}
          <span
            className="text-[11px] font-black"
            style={{
              color: positive ? 'var(--cp-green)' : 'var(--cp-red)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {change}
          </span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
          >
            vs. ontem
          </span>
        </div>
      </div>
    </div>
  );
}
