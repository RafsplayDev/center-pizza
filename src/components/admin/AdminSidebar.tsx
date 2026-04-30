'use client';

// =============================================================
// Center Pizza · Admin Sidebar
// Sidebar de navegação do painel administrativo
// Tema escuro, retrátil (expanded / collapsed)
// =============================================================

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      { label: 'Entregas', icon: DeliveryIcon, href: '/admin/entregas' },
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

  const w = expanded ? '240px' : '68px';

  return (
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
              src="/logo-center-pizza.png"
              alt="Center Pizza"
              width={36}
              height={36}
              style={{ objectFit: 'contain', flexShrink: 0, width: 'auto', height: 'auto' }}
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
        {navSections.map((section) => (
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

    </aside>
  );
}
