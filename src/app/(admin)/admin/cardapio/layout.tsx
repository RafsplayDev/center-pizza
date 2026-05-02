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
import LoadingScreen from '@/components/ui/LoadingScreen';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
      {!ready && <LoadingScreen fullScreen message="Carregando painel..." />}

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
