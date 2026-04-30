'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// =============================================================
// Center Pizza · Admin Top Bar
// Barra superior do painel: busca, filial, notificações
// =============================================================

import { SearchIcon, BellIcon, PrinterIcon, PlusIcon, LogoutIcon } from './icons';
import Button from '@/components/ui/Button';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
};

export default function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const config = routeConfig[pathname] || { breadcrumb: '', title: 'Dashboard' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const [storeOpen, setStoreOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });
  }, []);

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

        {/* Barra de busca */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 max-w-[340px]"
          style={{
            borderColor: 'var(--cp-line)',
            backgroundColor: 'var(--cp-flour)',
          }}
        >
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder={pathname === '/admin/cardapio' ? 'Buscar item por nome ou có...' : 'Buscar pedido, cliente, item...'}
            className="flex-1 bg-transparent border-0 outline-none text-xs font-semibold"
            style={{
              color: 'var(--cp-ink)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* Status da loja */}
        <button
          onClick={() => setStoreOpen(!storeOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border-0 cursor-pointer transition-colors"
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
              Loja {storeOpen ? 'Aberta' : 'Fechada'}
            </span>
            <span className="text-[9px] font-bold opacity-70 mt-[3px] tracking-wider uppercase">
              {storeOpen ? 'Fecha às 23:59' : 'Abre às 18:00'}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 ml-auto">
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
    </>
  );
}
