'use client';

// =============================================================
// Center Pizza · Admin Dashboard Page
// Rota: /admin/dashboard
// =============================================================

import { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import KitchenStatus from '@/components/admin/KitchenStatus';
import TopFlavors from '@/components/admin/TopFlavors';
import RecentOrders from '@/components/admin/RecentOrders';
import SalesChart from '@/components/admin/SalesChart';
import { DollarIcon, OrderIcon, ClockIcon } from '@/components/admin/icons';

import type { Order } from '@/components/admin/RecentOrders';

// -------------------------------------------------------------
// Dados mock
// -------------------------------------------------------------
const mockOrders: Order[] = [
  {
    id: '#A-2841',
    client: 'Júlia Andrade',
    address: 'R. Aurora, 142',
    canal: 'delivery',
    status: 'Cozinha',
    items: 3,
    total: 'R$ 96,80',
    time: '19:42',
  },
  {
    id: '#A-2840',
    client: 'Rafael Souza',
    address: 'Balcão · Mesa 4',
    canal: 'mesa',
    status: 'Entregue',
    items: 2,
    total: 'R$ 64,00',
    time: '19:38',
  },
  {
    id: '#A-2839',
    client: 'Camila Ferreira',
    address: 'R. São Carlos, 890',
    canal: 'delivery',
    status: 'Saiu p/ Entrega',
    items: 4,
    total: 'R$ 142,50',
    time: '19:31',
  },
  {
    id: '#A-2838',
    client: 'Lucas Mendes',
    address: 'Balcão · Mesa 7',
    canal: 'mesa',
    status: 'Preparando',
    items: 1,
    total: 'R$ 38,90',
    time: '19:25',
  },
  {
    id: '#A-2837',
    client: 'Marina Costa',
    address: 'R. Dona Alexandrina, 55',
    canal: 'delivery',
    status: 'Entregue',
    items: 2,
    total: 'R$ 79,80',
    time: '19:18',
  },
];

const mockFlavors = [
  { name: 'Calabresa', category: 'Pizzaria · Clássico', count: 42 },
  { name: 'Margherita', category: 'Tradicional', count: 34 },
  { name: 'Mussarela', category: 'Tradicional', count: 28 },
  { name: 'Portuguesa', category: 'Especial', count: 21 },
  { name: 'Quatro queijos', category: 'Premium', count: 16 },
];

const mockKitchen = {
  noForno: 7,
  aguardando: 3,
  atrasados: 2,
  tempoMedio: '28min',
};

type Period = 'hoje' | '7dias' | '30dias' | 'ano';

// -------------------------------------------------------------
// Componente
// -------------------------------------------------------------
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('7dias');

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const periods: { key: Period; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: '7dias', label: '7 Dias' },
    { key: '30dias', label: '30 Dias' },
    { key: 'ano', label: 'Ano' },
  ];

  return (
    <div className="px-7 py-6">
      {/* Layout principal: conteúdo + sidebar direita */}
      <div className="flex gap-6">
        {/* Coluna principal */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Greeting + period filter */}
          <div className="flex items-center justify-between">
            <span
              className="text-2xl tracking-wide"
              style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-display)' }}
            >
              {greeting}, Rafael
            </span>

            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--cp-line)' }}
            >
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className="px-4 py-1.5 text-[11px] font-bold border-0 cursor-pointer transition-colors"
                  style={{
                    backgroundColor:
                      period === p.key ? 'var(--cp-ink)' : '#fff',
                    color:
                      period === p.key ? 'var(--cp-cream)' : 'var(--cp-ink-muted)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={<DollarIcon size={14} />} label="Vendas" prefix="R$" value="4.218" suffix=",90" change="12,4%" positive highlight />
            <StatCard icon={<OrderIcon size={14} />} label="Pedidos" value="87" change="8" positive />
            <StatCard icon={<DollarIcon size={14} />} label="Ticket Médio" prefix="R$" value="48" suffix=",48" change="3,1%" positive />
            <StatCard icon={<ClockIcon size={14} />} label="Tempo Médio" value="28" suffix="min" change="2 min" positive={false} />
          </div>

          {/* Sales chart */}
          <SalesChart />

          {/* Recent orders */}
          <RecentOrders orders={mockOrders} />
        </div>

        {/* Coluna direita (sidebar info) */}
        <div className="w-[280px] flex-none flex flex-col gap-6">
          <KitchenStatus data={mockKitchen} />
          <TopFlavors flavors={mockFlavors} />
        </div>
      </div>
    </div>
  );
}
