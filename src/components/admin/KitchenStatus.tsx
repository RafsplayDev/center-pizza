// =============================================================
// Center Pizza · KitchenStatus
// Card "Cozinha agora" — status ao vivo
// =============================================================

import { FireIcon } from './icons';

type KitchenData = {
  noForno: number;
  aguardando: number;
  atrasados: number;
  tempoMedio: string;
};

export default function KitchenStatus({ data }: { data: KitchenData }) {
  return (
    <div
      className="rounded-xl border-2 overflow-hidden"
      style={{ backgroundColor: '#fff', borderColor: 'var(--cp-line)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--cp-line)' }}
      >
        <span
          className="text-sm font-black"
          style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
        >
          Cozinha agora
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
          style={{ color: 'var(--cp-green)' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--cp-green)' }}
          />
          Ao Vivo
        </span>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2">
        {/* No forno */}
        <div className="px-5 py-4 border-b border-r" style={{ borderColor: 'var(--cp-line)' }}>
          <p
            className="text-[28px] font-black leading-none m-0"
            style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
          >
            {data.noForno}
          </p>
          <p
            className="text-[10px] font-bold tracking-wide uppercase m-0 mt-0.5"
            style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
          >
            No Forno
          </p>
        </div>

        {/* Aguardando */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--cp-line)' }}>
          <p
            className="text-[28px] font-black leading-none m-0"
            style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
          >
            {data.aguardando}
          </p>
          <p
            className="text-[10px] font-bold tracking-wide uppercase m-0 mt-0.5"
            style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
          >
            Aguardando
          </p>
        </div>

        {/* Atrasados */}
        <div
          className="px-5 py-4 border-r"
          style={{
            borderColor: 'var(--cp-line)',
            backgroundColor: data.atrasados > 0 ? 'rgba(227,6,19,0.06)' : undefined,
          }}
        >
          <p
            className="text-[28px] font-black leading-none m-0 flex items-center gap-2"
            style={{
              color: data.atrasados > 0 ? 'var(--cp-red)' : 'var(--cp-ink)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {data.atrasados}
            {data.atrasados > 0 && <FireIcon size={18} />}
          </p>
          <p
            className="text-[10px] font-bold tracking-wide uppercase m-0 mt-0.5"
            style={{
              color: data.atrasados > 0 ? 'var(--cp-red)' : 'var(--cp-ink-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Atrasados
          </p>
        </div>

        {/* Tempo médio */}
        <div className="px-5 py-4">
          <p
            className="text-[28px] font-black leading-none m-0"
            style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
          >
            {data.tempoMedio}
          </p>
          <p
            className="text-[10px] font-bold tracking-wide uppercase m-0 mt-0.5"
            style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
          >
            Tempo Médio
          </p>
        </div>
      </div>
    </div>
  );
}
