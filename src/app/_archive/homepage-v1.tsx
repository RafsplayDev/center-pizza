'use client'

import { useEffect, useState } from 'react'
import {
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  Pizza,
  MessageCircle,
  Star,
  Truck,
  ShoppingBag,
} from 'lucide-react'

/* Custom Instagram icon — lucide-react dropped brand icons in 2025 */
function InstagramIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none" />
    </svg>
  )
}

/* ─────────────────────── data ─────────────────────── */

const CATEGORIES = [
  {
    name: 'Pizzas',
    desc: '8 fatias, borda recheada grátis nas salgadas',
    icon: '🍕',
  },
  {
    name: 'Brotinhos',
    desc: '4 fatias, meio a meio liberado',
    icon: '🫓',
  },
  {
    name: 'Esfihas Abertas',
    desc: 'Abertas, feitas na hora',
    icon: '🥟',
  },
  {
    name: 'Pastéis',
    desc: 'Fritos, crocantes por fora',
    icon: '🥐',
  },
  {
    name: 'Fogazzas',
    desc: 'Massa de pizza, formato meia-lua',
    icon: '🥖',
  },
  {
    name: 'Batatas Recheadas',
    desc: 'Purê + recheio + catupiry + mussarela',
    icon: '🥔',
  },
]

const HIGHLIGHTS = [
  { label: 'Borda recheada', detail: 'Grátis nas salgadas' },
  { label: 'Entrega rápida', detail: 'São Carlos e região' },
  { label: 'Todo dia', detail: '18h às 23h' },
]

/* ─────────────────────── component ─────────────────────── */

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 0)
  }, [])

  return (
    <>
      {/* ─── Header ─── */}
      <header className="header-sticky">
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: 'var(--sp-4) var(--sp-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h3)',
                color: 'var(--cp-red)',
                letterSpacing: 'var(--tracking-display)',
              }}
            >
              CENTER PIZZA
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
            <a
              href="#cardapio"
              style={{
                fontWeight: 700,
                fontSize: 'var(--fs-small)',
                textDecoration: 'none',
                color: 'var(--fg-1)',
              }}
            >
              Cardápio
            </a>
            <a
              href="#sobre"
              style={{
                fontWeight: 700,
                fontSize: 'var(--fs-small)',
                textDecoration: 'none',
                color: 'var(--fg-1)',
              }}
            >
              Sobre
            </a>
            <a
              href="https://wa.me/5516981886165"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 'var(--fs-small)', padding: 'var(--sp-2) var(--sp-4)' }}
            >
              <MessageCircle size={16} />
              Pedir agora
            </a>
          </nav>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section
        style={{
          background: 'var(--cp-ink)',
          color: 'var(--cp-cream)',
          padding: 'var(--sp-9) var(--sp-5) var(--sp-8)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 30% 70%, rgba(227,6,19,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(0,154,78,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
          className={mounted ? 'animate-fade-in-up' : ''}
        >
          <span className="eyebrow" style={{ color: 'var(--cp-red-bright)', marginBottom: 'var(--sp-4)', display: 'block' }}>
            Pizzaria em São Carlos, SP
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-display-xl)',
              lineHeight: 'var(--lh-tight)',
              color: 'var(--cp-cream)',
              marginBottom: 'var(--sp-5)',
            }}
          >
            PIZZA DE VERDADE,{' '}
            <span style={{ color: 'var(--cp-red)' }}>QUENTINHA</span>{' '}
            ATÉ VOCÊ
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--fs-h4)',
              color: 'var(--cp-ink-faint)',
              maxWidth: 520,
              margin: '0 auto var(--sp-6)',
              lineHeight: 'var(--lh-body)',
            }}
          >
            Massa fresca, ingredientes selecionados e aquele sabor de pizzaria de bairro.
            Delivery e retirada todo dia das 18h às 23h.
          </p>

          <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/5516981886165"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 'var(--fs-h4)', padding: 'var(--sp-4) var(--sp-6)' }}
            >
              <MessageCircle size={20} />
              Peça pelo WhatsApp
            </a>
            <a
              href="#cardapio"
              className="btn btn-outline"
              style={{
                fontSize: 'var(--fs-h4)',
                padding: 'var(--sp-4) var(--sp-6)',
                color: 'var(--cp-cream)',
                borderColor: 'var(--cp-cream)',
              }}
            >
              Ver cardápio
              <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Highlights strip ─── */}
      <section
        style={{
          background: 'var(--cp-red)',
          color: 'var(--fg-on-red)',
          padding: 'var(--sp-4) var(--sp-5)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--sp-7)',
            flexWrap: 'wrap',
          }}
        >
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
              }}
            >
              <Star size={16} fill="var(--cp-cream)" color="var(--cp-cream)" />
              <span style={{ fontWeight: 800, fontSize: 'var(--fs-small)' }}>{h.label}</span>
              <span style={{ opacity: 0.7, fontSize: 'var(--fs-small)' }}>— {h.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories / Cardápio ─── */}
      <section
        id="cardapio"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'var(--sp-8) var(--sp-5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-7)' }}>
          <span className="eyebrow">O que temos pra você</span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-display-l)',
              marginTop: 'var(--sp-2)',
            }}
          >
            NOSSO CARDÁPIO
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--sp-5)',
          }}
        >
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              className={`card card-tagged ${mounted ? 'animate-fade-in-up' : ''}`}
              style={{
                animationDelay: `${i * 80}ms`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--sp-4)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{cat.icon}</span>
              <div>
                <h3 style={{ marginBottom: 'var(--sp-1)' }}>{cat.name}</h3>
                <p style={{ color: 'var(--fg-2)', margin: 0, fontSize: 'var(--fs-small)' }}>
                  {cat.desc}
                </p>
              </div>
              <ChevronRight
                size={20}
                style={{ marginLeft: 'auto', color: 'var(--cp-ink-faint)', flexShrink: 0 }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Promo / Chalk section ─── */}
      <section
        style={{
          background: 'var(--cp-ink)',
          color: 'var(--cp-cream)',
          padding: 'var(--sp-8) var(--sp-5)',
          textAlign: 'center',
        }}
      >
        <span
          className="chalk"
          style={{
            fontFamily: 'var(--font-chalk)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: 'var(--cp-cream)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          massa fresca… todo dia 🍕
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--cp-cream)',
            marginTop: 'var(--sp-4)',
          }}
        >
          BORDA RECHEADA GRÁTIS
        </h2>
        <p
          style={{
            color: 'var(--cp-ink-faint)',
            margin: 'var(--sp-3) auto var(--sp-5)',
            maxWidth: 500,
          }}
        >
          Nas pizzas salgadas, borda de catupiry. Nas doces, borda de chocolate. Sem pagar nada a mais.
        </p>
        <a
          href="https://wa.me/5516981886165"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ fontSize: 'var(--fs-h4)', padding: 'var(--sp-4) var(--sp-6)' }}
        >
          <MessageCircle size={20} />
          Quero pedir agora
        </a>
      </section>

      {/* ─── How it works ─── */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'var(--sp-8) var(--sp-5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-7)' }}>
          <span className="eyebrow">Simples e rápido</span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              marginTop: 'var(--sp-2)',
            }}
          >
            COMO PEDIR
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--sp-6)',
            textAlign: 'center',
          }}
        >
          {[
            {
              icon: <MessageCircle size={36} color="var(--cp-green)" />,
              title: 'Chama no WhatsApp',
              desc: 'Manda mensagem com seu pedido',
            },
            {
              icon: <Pizza size={36} color="var(--cp-red)" />,
              title: 'A gente prepara',
              desc: 'Massa fresca e ingredientes de qualidade',
            },
            {
              icon: <Truck size={36} color="var(--cp-crust)" />,
              title: 'Delivery ou retirada',
              desc: 'Quentinha na sua porta ou pronta pra buscar',
            },
          ].map((step, i) => (
            <div key={step.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 'var(--r-3)',
                  background: 'var(--cp-dough)',
                  border: 'var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step.icon}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 800,
                  fontSize: 'var(--fs-micro)',
                  letterSpacing: 'var(--tracking-allcaps)',
                  textTransform: 'uppercase',
                  color: 'var(--cp-ink-muted)',
                }}
              >
                Passo {i + 1}
              </span>
              <h3 style={{ margin: 0 }}>{step.title}</h3>
              <p style={{ color: 'var(--fg-2)', margin: 0, fontSize: 'var(--fs-small)' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── About / Info ─── */}
      <section
        id="sobre"
        style={{
          background: 'var(--cp-dough)',
          borderTop: '1px solid var(--cp-line)',
          borderBottom: '1px solid var(--cp-line)',
          padding: 'var(--sp-8) var(--sp-5)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--sp-6)',
          }}
        >
          {/* Contact info */}
          <div>
            <span className="eyebrow">Sobre a loja</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                marginTop: 'var(--sp-2)',
                marginBottom: 'var(--sp-5)',
              }}
            >
              CENTER PIZZA
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <MapPin size={20} color="var(--cp-red)" />
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    Av. Araraquara, 415
                  </p>
                  <p style={{ margin: 0, color: 'var(--fg-2)', fontSize: 'var(--fs-small)' }}>
                    Vila Costa do Sol — São Carlos, SP
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <Clock size={20} color="var(--cp-green)" />
                <p style={{ margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>Todo dia</span>{' '}
                  <span style={{ color: 'var(--fg-2)' }}>• 18h às 23h</span>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <Phone size={20} color="var(--cp-crust)" />
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    (16) 98188-6165{' '}
                    <span style={{ color: 'var(--fg-2)', fontWeight: 400 }}>WhatsApp</span>
                  </p>
                  <p style={{ margin: 0, color: 'var(--fg-2)', fontSize: 'var(--fs-small)' }}>
                    (16) 3413-1925
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <InstagramIcon size={20} color="var(--cp-red)" />
                <a
                  href="https://instagram.com/center.pizzasc"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 600 }}
                >
                  @center.pizzasc
                </a>
              </div>
            </div>
          </div>

          {/* Delivery & pickup info */}
          <div className="card" style={{ alignSelf: 'start' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <Truck size={20} color="var(--cp-green)" />
              Delivery
            </h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--fs-small)', margin: '0 0 var(--sp-4)' }}>
              Entregamos em São Carlos e região. Peça pelo WhatsApp e receba quentinha na sua porta.
            </p>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <ShoppingBag size={20} color="var(--cp-crust)" />
              Retirada
            </h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--fs-small)', margin: 0 }}>
              Prefere buscar? Sem problema. Faça o pedido e avise que vai retirar.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          background: 'var(--cp-ink)',
          color: 'var(--cp-ink-faint)',
          padding: 'var(--sp-7) var(--sp-5)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--sp-4)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              color: 'var(--cp-cream)',
              letterSpacing: 'var(--tracking-display)',
            }}
          >
            CENTER PIZZA
          </span>
          <p style={{ margin: 0, fontSize: 'var(--fs-small)', maxWidth: 400, color: 'var(--cp-ink-faint)' }}>
            A gente entrega quentinho até você.
          </p>

          <div style={{ display: 'flex', gap: 'var(--sp-5)', marginTop: 'var(--sp-2)' }}>
            <a
              href="https://wa.me/5516981886165"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--cp-green-leaf)', textDecoration: 'none' }}
            >
              <MessageCircle size={22} />
            </a>
            <a
              href="https://instagram.com/center.pizzasc"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--cp-red-bright)', textDecoration: 'none' }}
            >
              <InstagramIcon size={22} />
            </a>
            <a
              href="tel:+551634131925"
              style={{ color: 'var(--cp-crust)', textDecoration: 'none' }}
            >
              <Phone size={22} />
            </a>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,246,227,0.1)',
              paddingTop: 'var(--sp-4)',
              marginTop: 'var(--sp-3)',
              width: '100%',
              fontSize: 'var(--fs-micro)',
              color: 'var(--cp-ink-faint)',
            }}
          >
            © {new Date().getFullYear()} Center Pizza — São Carlos, SP. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* ─── Floating WhatsApp CTA (mobile) ─── */}
      <a
        href="https://wa.me/5516981886165"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pedir pelo WhatsApp"
        style={{
          position: 'fixed',
          bottom: 'var(--sp-5)',
          right: 'var(--sp-5)',
          width: 56,
          height: 56,
          borderRadius: 'var(--r-pill)',
          background: 'var(--cp-green)',
          color: 'var(--fg-on-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-3)',
          transition: 'background var(--dur-1) var(--ease-out)',
          zIndex: 100,
          textDecoration: 'none',
        }}
      >
        <MessageCircle size={26} />
      </a>
    </>
  )
}