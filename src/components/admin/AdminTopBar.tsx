'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// =============================================================
// Center Pizza · Admin Top Bar
// Barra superior do painel: busca, filial, notificações
// =============================================================

import { SearchIcon, BellIcon, PrinterIcon, PlusIcon, LogoutIcon } from './icons';
import { ShoppingBag, DollarSign, TrendingUp, BarChart3, AlertCircle, Package, Bike } from 'lucide-react';
import Button from '@/components/ui/Button';

// Mapeamento de rotas para títulos/breadcrumbs
const routeConfig: Record<string, { breadcrumb: string; title: string }> = {
  '/admin/dashboard': { breadcrumb: 'Painel', title: 'Dashboard' },
  '/admin/cardapio': { breadcrumb: 'Catálogo · Gestão', title: 'Edição do cardápio' },
  '/admin/pedidos': { breadcrumb: 'Operação', title: 'Pedidos' },
  '/admin/cozinha': { breadcrumb: 'Operação', title: 'Cozinha' },
  '/admin/entregas': { breadcrumb: 'Operação', title: 'Entregas' },
  '/admin/promocoes': { breadcrumb: 'Catálogo', title: 'Promoções' },
  '/admin/estoque': { breadcrumb: 'Catálogo', title: 'Estoque' },
  '/admin/equipe': { breadcrumb: 'Gestão', title: 'Equipe' },
  '/admin/relatorios': { breadcrumb: 'Gestão', title: 'Relatórios' },
  '/admin/configuracoes': { breadcrumb: 'Gestão', title: 'Configurações' },
  '/admin/entrega': { breadcrumb: 'Entrega', title: 'Regras, áreas e endereço' },
};

export default function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const config = routeConfig[pathname] || { breadcrumb: '', title: 'Dashboard' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const [storeOpen, setStoreOpen] = useState(true);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [inactiveCount, setInactiveCount] = useState<number>(0);
  const [orderStats, setOrderStats] = useState({ count: 0, revenue: 0, pending: 0 });
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function fetchCounts() {
    const { data } = await supabase.from('produtos').select('visivel');
    if (data) {
      setActiveCount(data.filter(p => p.visivel).length);
      setInactiveCount(data.filter(p => !p.visivel).length);
    }
  }

  async function fetchStoreStatus() {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('aberta')
      .eq('id', 'loja')
      .single();
    
    if (config) setStoreOpen(config.aberta);
  }

  async function fetchOrderStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const { data } = await supabase
      .from('pedidos')
      .select('total, status')
      .gte('criado_em', startOfDay);
    
    if (data) {
      const active = data.filter(p => p.status !== 'cancelado');
      const revenue = active.reduce((acc, p) => acc + p.total, 0);
      const pending = data.filter(p => p.status === 'pendente').length;
      setOrderStats({ count: active.length, revenue, pending });
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });

    fetchCounts();
    fetchStoreStatus();
    fetchOrderStats();

    // Ouvir atualizações globais de pedidos
    const handleGlobalUpdate = () => {
      fetchOrderStats();
    };

    window.addEventListener('pedidos-changed', handleGlobalUpdate);
    window.addEventListener('product-status-changed', fetchCounts);
    window.addEventListener('store-status-changed', fetchStoreStatus);

    const interval = setInterval(() => {
      fetchCounts();
      fetchStoreStatus();
      fetchOrderStats();
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pedidos-changed', handleGlobalUpdate);
      window.removeEventListener('product-status-changed', fetchCounts);
      window.removeEventListener('store-status-changed', fetchStoreStatus);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Faixa tricolor italiana */}
      <div
        className="h-[5px] w-full flex-none"
        style={{
          background:
            'linear-gradient(to right, #009A4E 0 33.33%, #FFF6E3 33.33% 66.66%, #E30613 66.66% 100%)',
        }}
      />

      <header
        className="sticky top-0 z-10 flex items-center gap-4 px-7 py-3 border-b"
        style={{
          backgroundColor: 'rgba(255,246,227,0.95)',
          backdropFilter: 'blur(8px)',
          borderColor: 'var(--cp-line)',
        }}
      >
        {/* Breadcrumb + título */}
        <div className="flex flex-col mr-2">
          <span
            className="text-[9px] font-black tracking-[0.16em] uppercase capitalize"
            style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
          >
            {config.breadcrumb}
          </span>
          <span
            className="text-lg leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cp-ink)' }}
          >
            {config.title}
          </span>
        </div>

        {/* Área Contextual Dinâmica */}
        <div className="flex items-center gap-6 flex-1 max-w-[600px] ml-8">
           
           {/* Estatísticas de Pedidos (Apenas em /admin/pedidos) */}
           {pathname === '/admin/pedidos' && (
             <>
               <div className="flex items-center gap-2">
                 <ShoppingBag className="text-[var(--cp-ink)] opacity-40" size={18} />
                 <div className="flex flex-col">
                   <div className="flex items-baseline gap-1.5">
                     <span className="text-[17px] font-black" style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-display-alt)' }}>{orderStats.count}</span>
                     <span className="text-[10px] font-black uppercase text-[#8B7E74] tracking-wider">Pedidos</span>
                   </div>
                   {orderStats.pending > 0 && (
                     <div className="flex items-center gap-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                       <span className="text-[9px] font-black text-orange-600 uppercase">
                         {orderStats.pending} Pendentes
                       </span>
                     </div>
                   )}
                 </div>
               </div>

               <div className="w-[1px] h-6 bg-[var(--cp-line)] opacity-50" />

               <div className="flex items-center gap-2">
                 <DollarSign className="text-[var(--cp-ink)] opacity-40" size={18} />
                 <div className="flex flex-col">
                   <div className="flex items-baseline gap-1">
                     <span className="text-[10px] font-black text-[var(--cp-red)]">R$</span>
                     <span className="text-[17px] font-black" style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-display-alt)' }}>
                       {orderStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>
                   <span className="text-[10px] font-black uppercase text-[#8B7E74] tracking-wider">Vendas</span>
                 </div>
               </div>
             </>
           )}

           {/* Estatísticas de Cardápio (Apenas em /admin/cardapio) */}
           {pathname === '/admin/cardapio' && (
             <>
                <button 
                  onClick={() => router.push(pathname + (filter === 'ativos' ? '' : '?filter=ativos'))}
                  className={`flex items-center gap-2 border-2 cursor-pointer p-1.5 px-3 rounded-xl transition-all group ${filter === 'ativos' ? 'bg-[var(--cp-green)] border-[var(--cp-green)]' : 'bg-transparent border-transparent hover:bg-white/60'}`}
                >
                    <div className={`w-2 h-2 rounded-full animate-pulse ${filter === 'ativos' ? 'bg-white' : 'bg-[var(--cp-green)]'}`} />
                    <div className="flex flex-col items-start leading-none">
                      <span className={`text-[11px] font-black uppercase tracking-wide transition-colors ${filter === 'ativos' ? 'text-white' : 'text-[var(--cp-ink)]'}`}>
                        {activeCount} Ativos
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-tighter ${filter === 'ativos' ? 'text-white/80' : 'text-[var(--cp-ink-muted)]'}`}>No Cardápio</span>
                    </div>
                </button>
                
                <div className="w-[1px] h-6 bg-[var(--cp-line)] opacity-50" />

                <button 
                  onClick={() => router.push(pathname + (filter === 'inativos' ? '' : '?filter=inativos'))}
                  className={`flex items-center gap-2 border-2 cursor-pointer p-1.5 px-3 rounded-xl transition-all group ${filter === 'inativos' ? 'bg-[var(--cp-red)] border-[var(--cp-red)]' : 'bg-transparent border-transparent hover:bg-white/60'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${filter === 'inativos' ? 'bg-white' : 'bg-[var(--cp-red)]'}`} />
                    <div className="flex flex-col items-start leading-none">
                      <span className={`text-[11px] font-black uppercase tracking-wide transition-colors ${filter === 'inativos' ? 'text-white' : 'text-[var(--cp-ink)]'}`}>
                        {inactiveCount} Inativos
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-tighter ${filter === 'inativos' ? 'text-white/80' : 'text-[var(--cp-ink-muted)]'}`}>Ocultos</span>
                    </div>
                </button>
             </>
           )}

        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* Status da loja */}
          <button
            onClick={async () => {
              if (loadingStatus) return;
              setLoadingStatus(true);
              const newStatus = !storeOpen;
              
              try {
                const { error } = await supabase
                  .from('configuracoes')
                  .update({ aberta: newStatus, updated_at: new Date().toISOString() })
                  .eq('id', 'loja');

                if (!error) {
                  setStoreOpen(newStatus);
                  window.dispatchEvent(new Event('store-status-changed'));
                  setNotification({ 
                    message: `Loja ${newStatus ? 'Aberta' : 'Fechada'} com sucesso!`, 
                    type: 'success' 
                  });
                } else {
                  throw error;
                }
              } catch (err: any) {
                console.error('Erro ao alternar status da loja:', err);
                setNotification({ 
                  message: 'Erro ao atualizar: ' + (err.message || 'Verifique o banco'), 
                  type: 'error' 
                });
              } finally {
                setLoadingStatus(false);
              }
            }}
            disabled={loadingStatus}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border-0 cursor-pointer transition-colors mr-2"
            style={{
              backgroundColor: storeOpen ? 'rgba(0,154,78,0.1)' : 'rgba(227,6,19,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              color: storeOpen ? 'var(--cp-green)' : 'var(--cp-red)',
            }}
          >
            {/* Toggle switch */}
            <span
              className="relative flex-none rounded-full transition-colors"
              style={{
                width: '32px',
                height: '18px',
                backgroundColor: storeOpen ? 'var(--cp-green)' : 'var(--cp-red)',
              }}
            >
              <span
                className="absolute top-[2px] rounded-full transition-all"
                style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: 'white',
                  left: storeOpen ? '16px' : '2px',
                  transition: 'left 200ms ease',
                }}
              />
            </span>
            <div className="flex flex-col text-left leading-none">
              <span className="font-black text-[11px] tracking-wide uppercase">
                {storeOpen ? 'Aberta' : 'Fechada'}
              </span>
              <span className="text-[9px] font-bold opacity-70 mt-[3px] tracking-wider uppercase">
                {storeOpen ? '23:59' : '18:00'}
              </span>
            </div>
          </button>

          <div className="w-[1px] h-6 mx-2 bg-[var(--cp-line)]" />
          {/* Notificações */}
          <button
            className="relative bg-transparent border-0 cursor-pointer p-2 rounded-lg transition-colors"
            style={{ color: 'var(--cp-ink-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cp-dough)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <BellIcon size={20} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--cp-red)' }}
            />
          </button>

          {/* Divisor */}
          <div className="w-[1px] h-8 mx-2 bg-[var(--cp-line)]" />

          {/* Email do usuário logado */}
          {userEmail && (
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
            >
              {userEmail}
            </span>
          )}

          {/* Botão de Sair */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-2 rounded-lg transition-colors font-semibold text-xs ml-1"
            style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(227,6,19,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Sair"
          >
            <LogoutIcon size={18} />
            Sair
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div 
          className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 animate-in slide-in-from-right-10 duration-300
            ${notification.type === 'success' ? 'bg-[var(--cp-green)] border-emerald-400 text-white' : 'bg-[var(--cp-red)] border-rose-400 text-white'}`}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[13px] font-black uppercase tracking-wider">
            {notification.message}
          </span>
        </div>
      )}
    </>
  );
}
