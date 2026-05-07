'use client';

// =============================================================
// Center Pizza · Admin Dashboard Page
// Rota: /admin/dashboard
// =============================================================

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import StatCard from '@/components/admin/StatCard';
import KitchenStatus from '@/components/admin/KitchenStatus';
import TopFlavors from '@/components/admin/TopFlavors';
import RecentOrders from '@/components/admin/RecentOrders';
import SalesChart from '@/components/admin/SalesChart';
import { DollarIcon, OrderIcon, ClockIcon } from '@/components/admin/icons';
import LoadingScreen from '@/components/ui/LoadingScreen';

import type { Order } from '@/components/admin/RecentOrders';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Period = 'hoje' | '7dias' | '30dias' | 'ano';

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('hoje');

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('criado_em', { ascending: false });
    
    if (data) {
      setPedidos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Sincronização em tempo real para o Dashboard
    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Dashboard Realtime:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const periods: { key: Period; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: '7dias', label: '7 Dias' },
    { key: '30dias', label: '30 Dias' },
    { key: 'ano', label: 'Ano' },
  ];

  // Process data for components
  const recentOrders: Order[] = useMemo(() => {
    return pedidos.slice(0, 5).map(p => ({
      id: `#${p.numero_pedido}`,
      client: p.cliente_nome,
      address: p.endereco_entrega || 'Retirada no balcão',
      canal: p.tipo_entrega === 'entrega' ? 'delivery' : 'mesa',
      status: p.status === 'pendente' ? 'Pendente' : 
              p.status === 'aceito' ? 'Preparando' :
              p.status === 'pronto' ? 'Cozinha' : 
              p.status === 'entrega' ? 'Saiu p/ Entrega' : 
              p.status === 'concluido' ? 'Entregue' : 'Cancelado',
      items: p.itens?.length || 0,
      total: `R$ ${p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      time: new Date(p.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }));
  }, [pedidos]);

  const kitchenData = useMemo(() => {
    const noForno = pedidos.filter(p => p.status === 'aceito').length;
    const aguardando = pedidos.filter(p => p.status === 'pendente').length;
    const atrasados = pedidos.filter(p => {
      if (p.status !== 'pendente' && p.status !== 'aceito') return false;
      const criacao = new Date(p.criado_em);
      const diff = (new Date().getTime() - criacao.getTime()) / (1000 * 60);
      return diff > 30; // Mais de 30 min aguardando ou preparando
    }).length;

    return {
      noForno,
      aguardando,
      atrasados,
      tempoMedio: '25min'
    };
  }, [pedidos]);

  const stats = useMemo(() => {
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    const pedidosHoje = pedidos.filter(p => new Date(p.criado_em).toLocaleDateString('pt-BR') === hojeStr);
    const vendasHoje = pedidosHoje.reduce((acc, p) => acc + Number(p.total), 0);
    const ticketMedio = pedidosHoje.length > 0 ? vendasHoje / pedidosHoje.length : 0;

    return {
      vendas: vendasHoje,
      pedidos: pedidosHoje.length,
      ticketMedio: ticketMedio
    };
  }, [pedidos]);

  if (loading) return <LoadingScreen message="Sincronizando dashboard..." />;

  return (
    <div className="px-7 py-6">
      <div className="flex gap-6">
        {/* Coluna principal */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Greeting + period filter */}
          <div className="flex items-center justify-between">
            <span
              className="text-2xl tracking-wide"
              style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-display)' }}
            >
              {greeting}, Administrador
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
                    backgroundColor: period === p.key ? 'var(--cp-ink)' : '#fff',
                    color: period === p.key ? 'var(--cp-cream)' : 'var(--cp-ink-muted)',
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
            <StatCard 
              icon={<DollarIcon size={14} />} 
              label="Vendas Hoje" 
              prefix="R$" 
              value={Math.floor(stats.vendas).toLocaleString('pt-BR')} 
              suffix={`,${(stats.vendas % 1).toFixed(2).slice(2)}`} 
              change="12,4%" 
              positive 
              highlight 
            />
            <StatCard 
              icon={<OrderIcon size={14} />} 
              label="Pedidos Hoje" 
              value={stats.pedidos.toString()} 
              change="8" 
              positive 
            />
            <StatCard 
              icon={<DollarIcon size={14} />} 
              label="Ticket Médio" 
              prefix="R$" 
              value={Math.floor(stats.ticketMedio).toLocaleString('pt-BR')} 
              suffix={`,${(stats.ticketMedio % 1).toFixed(2).slice(2)}`} 
              change="3,1%" 
              positive 
            />
            <StatCard 
              icon={<ClockIcon size={14} />} 
              label="Tempo Médio" 
              value="25" 
              suffix="min" 
              change="2 min" 
              positive={false} 
            />
          </div>

          {/* Sales chart */}
          <SalesChart />

          {/* Recent orders */}
          <RecentOrders orders={recentOrders} />
        </div>

        {/* Coluna direita (sidebar info) */}
        <div className="w-[280px] flex-none flex flex-col gap-6">
          <KitchenStatus data={kitchenData} />
          <TopFlavors flavors={[
            { name: 'Calabresa', category: 'Pizzaria · Clássico', count: 42 },
            { name: 'Margherita', category: 'Tradicional', count: 34 },
            { name: 'Mussarela', category: 'Tradicional', count: 28 },
            { name: 'Portuguesa', category: 'Especial', count: 21 },
            { name: 'Quatro queijos', category: 'Premium', count: 16 },
          ]} />
        </div>
      </div>
    </div>
  );
}
