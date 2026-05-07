// =============================================================
// Center Pizza · RecentOrders
// Tabela de pedidos recentes do dashboard
// =============================================================

import { ClockIcon, DeliveryIcon, TableIcon, ChevronRightIcon } from './icons';

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
export type Order = {
  id: string;
  client: string;
  address?: string;
  canal: 'delivery' | 'mesa';
  canalDetail?: string;
  status: string;
  items: number;
  total: string;
  time: string;
};

type StatusStyle = {
  bg: string;
  color: string;
  dot: string;
};

function getStatusStyle(status: string): StatusStyle {
  switch (status) {
    case 'Cozinha':
      return { bg: 'rgba(227,6,19,0.08)', color: 'var(--cp-red)', dot: 'var(--cp-red)' };
    case 'Entregue':
      return { bg: 'rgba(0,154,78,0.08)', color: 'var(--cp-green)', dot: 'var(--cp-green)' };
    case 'Preparando':
      return { bg: 'rgba(217,136,65,0.1)', color: 'var(--cp-crust-deep)', dot: 'var(--cp-crust)' };
    case 'Saiu p/ Entrega':
      return { bg: 'rgba(44,110,155,0.08)', color: 'var(--cp-info)', dot: 'var(--cp-info)' };
    case 'Cancelado':
      return { bg: 'rgba(227,6,19,0.08)', color: 'var(--cp-red)', dot: 'var(--cp-red)' };
    default:
      return { bg: 'rgba(31,27,26,0.06)', color: 'var(--cp-ink-muted)', dot: 'var(--cp-ink-faint)' };
  }
}

// -------------------------------------------------------------
// Componente
// -------------------------------------------------------------
export default function RecentOrders({ orders }: { orders: Order[] }) {
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
            Pedidos recentes
          </h3>
          <p
            className="text-[11px] font-semibold m-0 mt-0.5"
            style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
          >
            últimos 30 minutos
          </p>
        </div>
        <a
          href="/admin/pedidos"
          className="flex items-center gap-1 text-xs font-black tracking-wide uppercase no-underline transition-colors"
          style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cp-red-deep)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cp-red)')}
        >
          Ver todos
          <ChevronRightIcon size={14} />
        </a>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--cp-flour)' }}>
              {['#', 'Cliente', 'Canal', 'Status', 'Itens', 'Total', 'Hora'].map((h) => (
                <th
                  key={h}
                  className="text-left text-[9px] font-black tracking-[0.16em] uppercase px-6 py-2.5"
                  style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <tr
                  key={order.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderTop: '1px solid var(--cp-line)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--cp-flour)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  {/* ID */}
                  <td
                    className="px-6 py-3 text-xs font-bold"
                    style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {order.id}
                  </td>

                  {/* Cliente */}
                  <td className="px-6 py-3">
                    <span
                      className="text-[13px] font-black block"
                      style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                    >
                      {order.client}
                    </span>
                    {order.address && (
                      <span
                        className="text-[10px] font-semibold block mt-0.5"
                        style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
                      >
                        {order.address}
                      </span>
                    )}
                  </td>

                  {/* Canal */}
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                      style={{
                        borderColor: 'var(--cp-line)',
                        color: 'var(--cp-ink)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {order.canal === 'delivery' ? (
                        <DeliveryIcon size={12} />
                      ) : (
                        <TableIcon size={12} />
                      )}
                      {order.canal === 'delivery' ? 'Delivery' : 'Mesa'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-none"
                        style={{ backgroundColor: statusStyle.dot }}
                      />
                      {order.status}
                    </span>
                  </td>

                  {/* Itens */}
                  <td
                    className="px-6 py-3 text-sm font-bold text-center"
                    style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                  >
                    {order.items}
                  </td>

                  {/* Total */}
                  <td
                    className="px-6 py-3 text-sm font-black"
                    style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}
                  >
                    {order.total}
                  </td>

                  {/* Hora */}
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
                    >
                      {order.time}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
