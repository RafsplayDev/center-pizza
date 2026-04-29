'use client';

// =============================================================
// Center Pizza · Admin Dashboard
// Rota: /admin/dashboard
// =============================================================

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// -------------------------------------------------------------
// Ícones inline
// -------------------------------------------------------------
function DashboardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function OrderIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function MenuIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function UsersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="19" cy="7" r="3" />
      <path d="M21 21v-1.5a3 3 0 0 0-2-2.83" />
    </svg>
  );
}

function ChartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function LogoutIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function PizzaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 3 19l9 2 9-2L12 3z" />
      <circle cx="10" cy="13" r="0.8" fill="currentColor" />
      <circle cx="14" cy="14" r="0.8" fill="currentColor" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
    </svg>
  );
}

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// -------------------------------------------------------------
// Dados mock para o dashboard
// -------------------------------------------------------------
const mockStats = [
  { label: 'Pedidos Hoje', value: '24', change: '+12%', positive: true, icon: OrderIcon },
  { label: 'Faturamento', value: 'R$ 1.840', change: '+8%', positive: true, icon: ChartIcon },
  { label: 'Ticket Médio', value: 'R$ 76,67', change: '-3%', positive: false, icon: PizzaIcon },
  { label: 'Clientes Novos', value: '7', change: '+40%', positive: true, icon: UsersIcon },
];

const mockOrders = [
  { id: '#0124', client: 'João Silva', items: '2x Margherita, 1x Coca', total: 'R$ 89,90', status: 'Pendente', time: '2 min' },
  { id: '#0123', client: 'Maria Oliveira', items: '1x Calabresa G, 1x Guaraná', total: 'R$ 52,90', status: 'Preparando', time: '8 min' },
  { id: '#0122', client: 'Carlos Santos', items: '3x Portuguesa M', total: 'R$ 134,70', status: 'Saiu p/ Entrega', time: '22 min' },
  { id: '#0121', client: 'Ana Costa', items: '1x 4 Queijos G, 2x Suco', total: 'R$ 71,80', status: 'Concluído', time: '45 min' },
  { id: '#0120', client: 'Pedro Almeida', items: '2x Frango c/ Catupiry', total: 'R$ 95,80', status: 'Concluído', time: '1h' },
];

const navItems = [
  { label: 'Dashboard', icon: DashboardIcon, active: true, href: '/admin/dashboard' },
  { label: 'Pedidos', icon: OrderIcon, active: false, href: '#' },
  { label: 'Cardápio', icon: PizzaIcon, active: false, href: '#' },
  { label: 'Clientes', icon: UsersIcon, active: false, href: '#' },
  { label: 'Relatórios', icon: ChartIcon, active: false, href: '#' },
];

function getStatusStyle(status: string) {
  switch (status) {
    case 'Pendente':
      return { bg: 'rgba(227,6,19,0.1)', color: 'var(--cp-red)' };
    case 'Preparando':
      return { bg: 'rgba(217,136,65,0.15)', color: 'var(--cp-crust-deep)' };
    case 'Saiu p/ Entrega':
      return { bg: 'rgba(0,154,78,0.1)', color: 'var(--cp-green)' };
    case 'Concluído':
      return { bg: 'rgba(31,27,26,0.08)', color: 'var(--cp-ink-muted)' };
    default:
      return { bg: 'rgba(31,27,26,0.08)', color: 'var(--cp-ink-muted)' };
  }
}

// -------------------------------------------------------------
// AdminDashboardPage
// -------------------------------------------------------------
export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/admin/login');
      } else {
        setUser(data.user);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div
        className="w-screen h-screen grid place-items-center"
        style={{ backgroundColor: 'var(--cp-dough)' }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: 'var(--cp-line)',
              borderTopColor: 'var(--cp-red)',
            }}
          />
          <p className="text-sm font-bold m-0" style={{ color: 'var(--cp-ink-muted)' }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--cp-dough)' }}>
      {/* ===== SIDEBAR ===== */}
      <aside
        className="flex flex-col h-full border-r-2 transition-all duration-300 flex-none"
        style={{
          width: sidebarOpen ? '260px' : '72px',
          backgroundColor: 'var(--cp-cream)',
          borderColor: 'var(--cp-line)',
        }}
      >
        {/* Logo + toggle */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b-2"
          style={{ borderColor: 'var(--cp-line)' }}
        >
          <Image
            src="/logo-center-pizza.png"
            alt="Center Pizza"
            width={36}
            height={36}
            style={{ objectFit: 'contain', flexShrink: 0 }}
          />
          {sidebarOpen && (
            <span
              className="text-base font-bold tracking-wide whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cp-ink)' }}
            >
              CENTER PIZZA
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto bg-transparent border-0 cursor-pointer p-1 rounded-lg transition-colors"
            style={{ color: 'var(--cp-ink-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--cp-dough)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Toggle sidebar"
          >
            <MenuIcon size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all"
              style={{
                backgroundColor: item.active ? 'var(--cp-red)' : 'transparent',
                color: item.active ? 'var(--cp-cream)' : 'var(--cp-ink-muted)',
                fontFamily: 'var(--font-body)',
                fontWeight: item.active ? 700 : 600,
                fontSize: '14px',
              }}
              onMouseEnter={e => {
                if (!item.active) e.currentTarget.style.backgroundColor = 'var(--cp-dough)';
              }}
              onMouseLeave={e => {
                if (!item.active) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full bg-transparent border-0 cursor-pointer transition-colors"
            style={{
              color: 'var(--cp-ink-muted)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '14px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(227,6,19,0.08)';
              e.currentTarget.style.color = 'var(--cp-red)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--cp-ink-muted)';
            }}
          >
            <LogoutIcon size={20} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b-2"
          style={{
            backgroundColor: 'rgba(245,239,224,0.92)',
            backdropFilter: 'blur(8px)',
            borderColor: 'var(--cp-line)',
          }}
        >
          <div>
            <h1
              className="text-xl m-0 leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cp-ink)' }}
            >
              {greeting}! 👋
            </h1>
            <p className="text-xs m-0 mt-1 font-semibold capitalize" style={{ color: 'var(--cp-ink-muted)' }}>
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notificações */}
            <button
              className="relative bg-transparent border-0 cursor-pointer p-2 rounded-lg transition-colors"
              style={{ color: 'var(--cp-ink-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--cp-cream)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <BellIcon size={20} />
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: 'var(--cp-red)' }}
              />
            </button>

            {/* Avatar / User info */}
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border-2"
              style={{ borderColor: 'var(--cp-line)', backgroundColor: 'var(--cp-cream)' }}
            >
              <div
                className="w-8 h-8 rounded-full grid place-items-center text-xs font-black"
                style={{ backgroundColor: 'var(--cp-red)', color: 'var(--cp-cream)' }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold hidden sm:block" style={{ color: 'var(--cp-ink)' }}>
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="px-8 py-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {mockStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border-2 p-5 transition-all"
                style={{
                  backgroundColor: 'var(--cp-cream)',
                  borderColor: 'var(--cp-line)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--cp-ink)';
                  e.currentTarget.style.boxShadow = '4px 4px 0 var(--cp-red)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--cp-line)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center"
                    style={{ backgroundColor: 'var(--cp-dough)', color: 'var(--cp-ink)' }}
                  >
                    <stat.icon size={20} />
                  </div>
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: stat.positive ? 'rgba(0,154,78,0.1)' : 'rgba(227,6,19,0.1)',
                      color: stat.positive ? 'var(--cp-green)' : 'var(--cp-red)',
                    }}
                  >
                    {stat.change}
                  </span>
                </div>
                <p
                  className="text-2xl font-black m-0 leading-none"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs font-bold m-0 mt-1"
                  style={{ color: 'var(--cp-ink-muted)' }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Pedidos recentes */}
          <div
            className="rounded-2xl border-2 overflow-hidden"
            style={{ backgroundColor: 'var(--cp-cream)', borderColor: 'var(--cp-line)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b-2"
              style={{ borderColor: 'var(--cp-line)' }}
            >
              <div>
                <h2
                  className="text-base font-black m-0"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}
                >
                  Pedidos Recentes
                </h2>
                <p className="text-xs font-semibold m-0 mt-0.5" style={{ color: 'var(--cp-ink-muted)' }}>
                  Últimas atualizações em tempo real
                </p>
              </div>
              <button
                className="btn text-xs font-bold px-4 py-2 rounded-lg border-2 bg-transparent cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--cp-ink)',
                  color: 'var(--cp-ink)',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--cp-ink)';
                  e.currentTarget.style.color = 'var(--cp-cream)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--cp-ink)';
                }}
              >
                Ver todos
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--cp-dough)' }}>
                    {['Pedido', 'Cliente', 'Itens', 'Total', 'Status', 'Tempo'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-black tracking-widest uppercase px-6 py-3"
                        style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderTop: '1px solid var(--cp-line)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--cp-flour)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-6 py-3.5 text-sm font-black" style={{ color: 'var(--cp-ink)' }}>
                          {order.id}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-bold" style={{ color: 'var(--cp-ink)' }}>
                          {order.client}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-semibold max-w-[200px] truncate" style={{ color: 'var(--cp-ink-muted)' }}>
                          {order.items}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-black" style={{ color: 'var(--cp-ink)' }}>
                          {order.total}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className="text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--cp-ink-faint)' }}>
                            <ClockIcon size={12} />
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
        </div>
      </main>
    </div>
  );
}
