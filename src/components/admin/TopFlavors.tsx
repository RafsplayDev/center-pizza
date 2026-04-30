// =============================================================
// Center Pizza · TopFlavors
// Card "Top sabores" — ranking de vendas do dia
// =============================================================

type Flavor = {
  name: string;
  category: string;
  count: number;
};

export default function TopFlavors({ flavors }: { flavors: Flavor[] }) {
  const maxCount = flavors.length > 0 ? flavors[0].count : 1;

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
        <div>
          <span
            className="text-sm font-black block"
            style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
          >
            Top sabores
          </span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
          >
            hoje · vendidos
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="px-5 py-3 flex flex-col gap-3.5">
        {flavors.map((flavor, i) => {
          const pct = (flavor.count / maxCount) * 100;
          return (
            <div key={flavor.name} className="flex items-start gap-3">
              {/* Posição */}
              <span
                className="text-lg font-black leading-none flex-none w-6 text-right"
                style={{
                  color: i < 3 ? 'var(--cp-red)' : 'var(--cp-ink-faint)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-[13px] font-black truncate"
                    style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                  >
                    {flavor.name}
                  </span>
                  <span
                    className="text-sm font-black flex-none ml-2"
                    style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                  >
                    {flavor.count}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    className="text-[9px] font-bold tracking-wider uppercase"
                    style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
                  >
                    {flavor.category}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
                  >
                    fatias
                  </span>
                </div>
                {/* Barra de progresso */}
                <div
                  className="h-[3px] rounded-full mt-1.5 overflow-hidden"
                  style={{ backgroundColor: 'var(--cp-line)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: i === 0 ? 'var(--cp-red)' : 'var(--cp-ink)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
