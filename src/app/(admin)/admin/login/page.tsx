'use client';

// =============================================================
// Center Pizza · Admin Login Page
// Rota: /admin/login  →  src/app/(admin)/admin/login/page.tsx
// =============================================================

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { FormField, PasswordField } from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// -------------------------------------------------------------
// Ícones inline
// -------------------------------------------------------------
function UserIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

// -------------------------------------------------------------
// AdminLoginPage
// -------------------------------------------------------------
export default function AdminLoginPage() {
  const router = useRouter();

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Carregar preferência "manter conectado" do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cp-remember');
    if (saved !== null) {
      const isTrue = saved === 'true';
      setTimeout(() => setRemember(isTrue), 0);
    }
  }, []);

  // Salvar preferência quando muda
  useEffect(() => {
    localStorage.setItem('cp-remember', String(remember));
  }, [remember]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user,
        password,
      });

      if (authError) throw authError;

      // Se "manter conectado" está desmarcado, limpar a sessão ao fechar o navegador
      if (!remember) {
        // Marca para que o layout limpe a sessão no beforeunload
        sessionStorage.setItem('cp-session-only', 'true');
      } else {
        sessionStorage.removeItem('cp-session-only');
      }

      router.push('/admin/dashboard');
    } catch {
      setError('Usuário ou senha incorretos. Tenta de novo?');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user.trim()) {
      setError('Preencha o e-mail acima antes de redefinir a senha.');
      return;
    }
    setResetLoading(true);
    setResetMsg('');
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (resetError) throw resetError;
      setResetMsg('Link de redefinição enviado! Verifique seu e-mail.');
    } catch {
      setError('Não foi possível enviar o e-mail. Verifique o endereço.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="vb-bg w-screen min-h-screen relative grid place-items-center overflow-hidden"
      style={{ 
        backgroundColor: 'var(--cp-dough)',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(31,27,26,0.05) 1.5px, transparent 2px), radial-gradient(circle at 0 0, rgba(227,6,19,0.04) 1px, transparent 2px), radial-gradient(circle at 100% 100%, rgba(0,154,78,0.04) 1px, transparent 2px)',
        backgroundSize: '32px 32px, 32px 32px, 32px 32px',
        backgroundPosition: '0 0, 16px 16px, 0 16px'
      }}
    >
      {/* Faixa tricolor italiana no topo */}
      <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ background: 'linear-gradient(to right, #009A4E 0 33.33%, #FFF6E3 33.33% 66.66%, #E30613 66.66% 100%)' }} />

      {/* Card principal */}
      <div
        className="vb-card relative w-[460px] max-w-[calc(100vw-48px)] px-10 pt-16 pb-9 rounded-[22px] border-[3px]"
        style={{
          backgroundColor: 'var(--cp-cream)',
          borderColor: 'var(--cp-ink)',
          boxShadow: '10px 10px 0 var(--cp-red)',
        }}
      >
        {/* Logo flutuando no topo */}
        <div
          className="absolute left-1/2 grid place-items-center overflow-hidden"
          style={{
            width: '120px',
            height: '120px',
            top: '-60px',
            transform: 'translateX(-50%)',
          }}
        >
          <Image
            src="/logoquadrada.png"
            alt="Center Pizza Logo"
            width={110}
            height={110}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Cabeçalho */}
        <div className="text-center mt-6 mb-7">
          <div
            className="text-[26px] leading-none tracking-[0.02em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cp-ink)' }}
          >
            CENTER PIZZA
            <span
              className="block text-[9px] font-black tracking-[0.32em] mt-1.5"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-red)' }}
            >
              PIZZARIA · PAINEL INTERNO
            </span>
          </div>

          <span
            className="inline-block mt-3.5 px-3 py-[5px] text-[10px] font-black tracking-[0.18em] uppercase rounded-full"
            style={{
              backgroundColor: 'var(--cp-ink)',
              color: 'var(--cp-cream)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Painel Admin
          </span>
        </div>

        {/* Formulário */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="admin-user"
            label="Login"
            type="email"
            placeholder="seu e-mail de acesso"
            icon={<UserIcon size={18} />}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            required
          />

          <PasswordField
            id="admin-pw"
            label="Senha"
            placeholder="••••••••"
            icon={<LockIcon size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {/* Lembrar + esqueceu */}
          <div className="flex items-center justify-between gap-3">
            <label
              className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-bold relative"
              style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="absolute opacity-0 pointer-events-none"
              />
              <span
                className="w-[18px] h-[18px] border-2 rounded grid place-items-center flex-none transition-colors"
                style={{
                  borderColor: 'var(--cp-ink)',
                  backgroundColor: remember ? 'var(--cp-ink)' : 'var(--cp-flour)',
                  color: 'var(--cp-cream)',
                }}
              >
                <span style={{ opacity: remember ? 1 : 0, transition: 'opacity 160ms' }}>
                  <CheckIcon size={12} />
                </span>
              </span>
              Manter conectado
            </label>

            <button
              type="button"
              disabled={resetLoading}
              onClick={handleForgotPassword}
              className="text-xs font-extrabold underline underline-offset-[3px] bg-transparent border-0 p-0 cursor-pointer disabled:opacity-60"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-red)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--cp-red-deep)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--cp-red)')}
            >
              {resetLoading ? 'Enviando…' : 'Esqueceu a senha?'}
            </button>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <p
              className="text-xs font-bold text-center px-3 py-2 rounded-lg m-0"
              style={{
                color: 'var(--cp-red)',
                backgroundColor: 'rgba(227,6,19,0.08)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </p>
          )}

          {/* Mensagem de sucesso (reset) */}
          {resetMsg && (
            <p
              className="text-xs font-bold text-center px-3 py-2 rounded-lg m-0"
              style={{
                color: 'var(--cp-green)',
                backgroundColor: 'rgba(0,154,78,0.08)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {resetMsg}
            </p>
          )}

          {/* Botão submit */}
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            loadingText="Entrando…"
            size="lg"
            fullWidth
            iconRight={!loading ? <ArrowIcon size={14} /> : undefined}
            className="mt-1"
          >
            Entrar
          </Button>
        </form>

        {/* Links de suporte */}
        <div
          className="mt-[26px] pt-[18px] border-t-2 border-dashed flex justify-center gap-4 text-[10px] font-extrabold tracking-[0.1em] uppercase"
          style={{
            borderColor: 'var(--cp-line-strong)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {(['Suporte', 'Status', 'v 1.0.0'] as const).map((item, i, arr) => (
            <span key={item} className="inline-flex items-center gap-4">
              <a
                href="#"
                className="no-underline transition-colors"
                style={{ color: 'var(--cp-ink-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--cp-red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--cp-ink-muted)')}
              >
                {item}
              </a>
              {i < arr.length - 1 && (
                <span style={{ color: 'var(--cp-line-strong)' }}>·</span>
              )}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}