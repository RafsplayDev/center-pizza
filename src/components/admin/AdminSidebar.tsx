'use client';

// =============================================================
// Center Pizza · Admin Sidebar
// Sidebar de navegação do painel administrativo
// Tema escuro, retrátil (expanded / collapsed)
// =============================================================

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  DashboardIcon,
  OrderIcon,
  KitchenIcon,
  DeliveryIcon,
  CardapioIcon,
  PromoIcon,
  EstoqueIcon,
  EquipeIcon,
  RelatoriosIcon,
  ConfigIcon,
  LogoutIcon,
  ChevronRightIcon,
} from './icons';

// -------------------------------------------------------------
// Tipagem
// -------------------------------------------------------------
type NavSection = {
  title: string;
  items: NavItem[];
};

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  badge?: number;
};

// -------------------------------------------------------------
// Dados de navegação
// -------------------------------------------------------------
const navSections: NavSection[] = [
  {
    title: 'Operação',
    items: [
      { label: 'Dashboard', icon: DashboardIcon, href: '/admin/dashboard' },
      { label: 'Pedidos', icon: OrderIcon, href: '/admin/pedidos', badge: 12 },
      { label: 'Cozinha', icon: KitchenIcon, href: '/admin/cozinha', badge: 7 },
      { label: 'Entrega', icon: DeliveryIcon, href: '/admin/entrega' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { label: 'Cardápio', icon: CardapioIcon, href: '/admin/cardapio', badge: 39 },
      { label: 'Promoções', icon: PromoIcon, href: '/admin/promocoes' },
      { label: 'Estoque', icon: EstoqueIcon, href: '/admin/estoque' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { label: 'Equipe', icon: EquipeIcon, href: '/admin/equipe' },
      { label: 'Relatórios', icon: RelatoriosIcon, href: '/admin/relatorios' },
      { label: 'Configurações', icon: ConfigIcon, href: '/admin/configuracoes' },
    ],
  },
];

// Cores do tema escuro
const dark = {
  bg: '#1F1B1A',
  bgHover: '#2A2523',
  bgActive: 'var(--cp-red)',
  text: '#A39488',
  textHover: '#D4C8BB',
  textActive: '#FFF6E3',
  sectionTitle: '#6B5D56',
  border: '#332C28',
  badgeBg: '#332C28',
  badgeText: '#A39488',
  badgeActiveBg: 'rgba(255,255,255,0.2)',
  badgeActiveText: '#fff',
  logoutHoverBg: 'rgba(227,6,19,0.12)',
};

// -------------------------------------------------------------
// Componente
// -------------------------------------------------------------
export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [activeItems, setActiveItems] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch active products count
      const { count } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('visivel', true);
      
      if (count !== null) setActiveItems(count);

      // 2. Fetch daily orders count and revenue
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      const { data: orders } = await supabase
        .from('pedidos')
        .select('total, status')
        .gte('criado_em', startOfDay);
      
      if (orders) {
        const active = orders.filter(o => o.status !== 'cancelado');
        setOrderCount(active.length);
        setTotalRevenue(active.reduce((acc, o) => acc + (o.total || 0), 0));
      }

      // 3. Fetch store status
      const { data: config } = await supabase
        .from('configuracoes')
        .select('aberta')
        .eq('id', 'loja')
        .single();
      
      if (config) setIsStoreOpen(config.aberta);
    }

    fetchData();
    
    // 4. Subscribe para atualizações em tempo real de pedidos (CONEXÃO MESTRE)
    console.log('Iniciando Master Realtime Listener...');
    const pedidosChannel = supabase
      .channel('master-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        console.log('🔔 EVENTO REALTIME RECEBIDO:', payload.eventType, payload);
        
        // Disparar evento para outros componentes (Página de Pedidos, TopBar)
        try {
          window.dispatchEvent(new CustomEvent('pedidos-changed', { detail: payload }));
        } catch (e) {
          console.error('Erro ao disparar evento global:', e);
        }
        
        // Atualizar estatísticas da própria sidebar
        fetchData();

        // Alerta sonoro para novos pedidos
        if (payload.eventType === 'INSERT') {
          console.log('🎉 NOVO PEDIDO! Tentando tocar alerta...');
          try {
            const bell = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            bell.volume = 0.6;
            bell.play().catch(err => {
              console.warn('Autoplay bloqueado. Clique na página para habilitar o som.', err);
            });
            
            setNotification({ 
              message: `Novo pedido #${payload.new?.numero_pedido || ''} recebido!`, 
              type: 'success' 
            });
          } catch (e) {
            console.error('Erro ao processar alerta de novo pedido:', e);
          }
        }
      })
      .subscribe((status, err) => {
        console.log('📡 Status da Conexão Realtime:', status);
        if (err) console.error('❌ Erro na conexão Realtime:', err);
      });

    // Ouvir evento de mudança global (vinda da TopBar, por exemplo)
    window.addEventListener('store-status-changed', fetchData);
    
    // Opcional: Atualizar a cada minuto
    const interval = setInterval(fetchData, 60000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(pedidosChannel);
      window.removeEventListener('store-status-changed', fetchData);
    };
  }, []);

  const toggleStoreStatus = async () => {
    setLoadingStatus(true);
    const newStatus = !isStoreOpen;
    
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({ aberta: newStatus, updated_at: new Date().toISOString() })
        .eq('id', 'loja');

      if (!error) {
        setIsStoreOpen(newStatus);
        // Notificar outros componentes se necessário
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
        message: 'Erro no banco: ' + (err.message || 'Falha na conexão'), 
        type: 'error' 
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const dynamicNavSections = navSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.label === 'Cardápio') return { ...item, badge: activeItems };
      if (item.label === 'Pedidos') return { ...item, badge: orderCount };
      return item;
    })
  }));

  const w = expanded ? '240px' : '68px';

  return (
    <>
    <aside
      className="admin-sidebar flex flex-col h-full flex-none overflow-y-auto overflow-x-hidden"
      style={{
        width: w,
        minWidth: w,
        backgroundColor: dark.bg,
        borderRight: `1px solid ${dark.border}`,
        transition: 'width 220ms cubic-bezier(0.22,0.61,0.36,1), min-width 220ms cubic-bezier(0.22,0.61,0.36,1)',
      }}
    >
      {/* Botão de Teste (Apenas para Debug) */}
      <button 
        onClick={() => {
          const bell = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          bell.play();
          window.dispatchEvent(new CustomEvent('pedidos-changed', { detail: { eventType: 'TEST' } }));
          console.log('Teste de som e evento disparado');
        }}
        className="fixed bottom-0 left-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        Test
      </button>
      {/* Logo + toggle */}
      <div
        className="flex items-center border-b"
        style={{
          borderColor: dark.border,
          padding: expanded ? '16px 16px' : '16px 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: expanded ? '12px' : '0',
        }}
      >
        {expanded && (
          <>
            <Image
              src="/logoquadrada.png"
              alt="Center Pizza"
              width={36}
              height={36}
              style={{ objectFit: 'contain', flexShrink: 0 }}
            />
            <div className="flex flex-col leading-none min-w-0 flex-1">
              <span
                className="text-[14px] tracking-wide whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)', color: dark.textActive }}
              >
                CENTER PIZZA
              </span>
              <span
                className="text-[7px] font-black tracking-[0.2em] uppercase mt-0.5 whitespace-nowrap"
                style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}
              >
                Painel Admin
              </span>
            </div>
          </>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="grid place-items-center bg-transparent border-0 cursor-pointer rounded-md p-1.5 transition-colors"
          style={{
            color: dark.text,
            marginLeft: expanded ? 'auto' : '0',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 220ms ease, color 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = dark.textHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = dark.text)}
          aria-label={expanded ? 'Recolher sidebar' : 'Expandir sidebar'}
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-4">
        {dynamicNavSections.map((section) => (
          <div key={section.title}>
            {expanded && (
              <span
                className="block text-[9px] font-black tracking-[0.18em] uppercase px-3 mb-1.5 whitespace-nowrap"
                style={{ color: dark.sectionTitle, fontFamily: 'var(--font-body)' }}
              >
                {section.title}
              </span>
            )}
            {!expanded && (
              <div
                className="mx-auto my-1.5"
                style={{
                  width: '24px',
                  height: '1px',
                  backgroundColor: dark.border,
                }}
              />
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    title={!expanded ? item.label : undefined}
                    className="flex items-center gap-3 rounded-lg no-underline transition-all overflow-hidden"
                    style={{
                      backgroundColor: isActive ? dark.bgActive : 'transparent',
                      color: isActive ? dark.textActive : dark.text,
                      fontFamily: 'var(--font-body)',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '13px',
                      padding: expanded ? '8px 12px' : '8px 0',
                      justifyContent: expanded ? 'flex-start' : 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = dark.bgHover;
                        e.currentTarget.style.color = dark.textHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = dark.text;
                      }
                    }}
                  >
                    <span className="flex-none grid place-items-center" style={{ width: '20px' }}>
                      <item.icon size={18} />
                    </span>
                    {expanded && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className="text-[10px] font-black min-w-[22px] h-5 grid place-items-center rounded-full"
                            style={{
                              backgroundColor: isActive ? dark.badgeActiveBg : dark.badgeBg,
                              color: isActive ? dark.badgeActiveText : dark.badgeText,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Status Area */}
      {expanded && (
        <div 
          className="mt-auto p-4 border-t"
          style={{ borderColor: dark.border }}
        >
          <div 
            className="p-3 rounded-xl flex flex-col gap-2"
            style={{ backgroundColor: dark.bgHover }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: dark.textActive }}>Status da Loja</span>
              <button 
                onClick={toggleStoreStatus}
                disabled={loadingStatus}
                className="group relative flex items-center bg-transparent border-0 cursor-pointer p-0 outline-none"
              >
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all group-hover:bg-white/5">
                   <div className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-[var(--cp-green)] animate-pulse' : 'bg-zinc-500'}`} />
                   <span className="text-[9px] font-black uppercase" style={{ color: isStoreOpen ? 'var(--cp-green)' : '#6B5D56' }}>
                     {isStoreOpen ? 'Aberta' : 'Fechada'}
                   </span>
                </div>
                
                {/* Visual Switch */}
                <div 
                  className={`ml-2 w-7 h-4 rounded-full relative transition-all duration-300 ${isStoreOpen ? 'bg-[var(--cp-green)]/20' : 'bg-zinc-800'}`}
                  style={{ border: `1px solid ${isStoreOpen ? 'var(--cp-green)' : '#444'}` }}
                >
                  <div 
                    className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-300 ${isStoreOpen ? 'right-0.5 bg-[var(--cp-green)]' : 'left-0.5 bg-zinc-500'}`}
                  />
                </div>
              </button>
            </div>
            
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: dark.text }}>Pedidos hoje</span>
                <span className="text-[10px] font-black" style={{ color: dark.textActive }}>{orderCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: dark.text }}>Faturamento</span>
                <span className="text-[10px] font-black" style={{ color: 'var(--cp-green)' }}>
                  {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            className="w-full mt-4 flex items-center gap-3 p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer"
            style={{ color: dark.text, fontFamily: 'var(--font-body)' }}
            onMouseEnter={(e) => {
               e.currentTarget.style.backgroundColor = dark.logoutHoverBg;
               e.currentTarget.style.color = 'var(--cp-red)';
            }}
            onMouseLeave={(e) => {
               e.currentTarget.style.backgroundColor = 'transparent';
               e.currentTarget.style.color = dark.text;
            }}
            onClick={async () => {
               await supabase.auth.signOut();
               router.push('/admin/login');
            }}
          >
            <LogoutIcon size={18} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Sair da conta</span>
          </button>
        </div>
      )}

      {!expanded && (
        <div className="mt-auto flex flex-col items-center py-4 gap-4 border-t" style={{ borderColor: dark.border }}>
           <button 
             onClick={toggleStoreStatus}
             disabled={loadingStatus}
             className={`w-2 h-2 rounded-full cursor-pointer border-0 p-0 transition-all ${isStoreOpen ? 'bg-[var(--cp-green)] animate-pulse shadow-[0_0_8px_var(--cp-green)]' : 'bg-zinc-600'}`} 
             title={isStoreOpen ? "Loja Aberta - Clique para fechar" : "Loja Fechada - Clique para abrir"} 
           />
           <button 
             className="bg-transparent border-0 cursor-pointer p-1"
             style={{ color: dark.text }}
             onClick={async () => {
               await supabase.auth.signOut();
               router.push('/admin/login');
             }}
           >
             <LogoutIcon size={18} />
           </button>
        </div>
      )}
    </aside>
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
