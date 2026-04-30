'use client';

// =============================================================
// Center Pizza · Cardápio Layout
// Reutiliza o mesmo layout de sidebar + topbar do dashboard
// =============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CardapioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/admin/login');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  return (
    <>
      {!ready && (
        <div
          className="w-screen h-screen grid place-items-center fixed top-0 left-0 z-[100]"
          style={{ backgroundColor: 'var(--cp-dough)' }}
        >
          <div className="text-center">
            <div
              className="w-10 h-10 border-[3px] rounded-full mx-auto mb-4 animate-spin"
              style={{
                borderColor: 'var(--cp-line)',
                borderTopColor: 'var(--cp-red)',
              }}
            />
            <p
              className="text-sm font-bold m-0"
              style={{ color: 'var(--cp-ink-muted)', fontFamily: 'var(--font-body)' }}
            >
              Carregando painel...
            </p>
          </div>
        </div>
      )}

      <div 
        className="flex h-screen overflow-hidden" 
        style={{ 
          backgroundColor: 'var(--cp-dough)',
          visibility: ready ? 'visible' : 'hidden'
        }}
      >
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
