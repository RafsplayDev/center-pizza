'use client';

// =============================================================
// Center Pizza · Button
// Componente de botão reutilizável com animações
// =============================================================

import { ButtonHTMLAttributes, ReactNode } from 'react';

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
};

// -------------------------------------------------------------
// Estilos por variante
// -------------------------------------------------------------
const variants: Record<ButtonVariant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base: {
      backgroundColor: 'var(--cp-red)',
      color: 'var(--cp-cream)',
      boxShadow: '0 4px 0 0 var(--cp-red-deep)',
    },
    hover: {
      backgroundColor: 'var(--cp-red-deep)',
      boxShadow: '0 2px 0 0 #8B0310',
    },
  },
  secondary: {
    base: {
      backgroundColor: 'var(--cp-green)',
      color: 'var(--cp-cream)',
      boxShadow: '0 4px 0 0 var(--cp-green-deep)',
    },
    hover: {
      backgroundColor: 'var(--cp-green-deep)',
      boxShadow: '0 2px 0 0 #004D24',
    },
  },
  outline: {
    base: {
      backgroundColor: 'transparent',
      color: 'var(--cp-ink)',
      border: '2px solid var(--cp-ink)',
      boxShadow: 'none',
    },
    hover: {
      backgroundColor: 'var(--cp-ink)',
      color: 'var(--cp-cream)',
    },
  },
  ghost: {
    base: {
      backgroundColor: 'transparent',
      color: 'var(--cp-red)',
      boxShadow: 'none',
    },
    hover: {
      backgroundColor: 'rgba(227,6,19,0.08)',
    },
  },
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[11px] gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-xs gap-2 rounded-xl',
  lg: 'px-6 py-[14px] text-sm gap-2.5 rounded-xl',
};

// -------------------------------------------------------------
// Componente
// -------------------------------------------------------------
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        cp-btn inline-flex items-center justify-center font-black tracking-[0.08em] uppercase
        border-0 cursor-pointer select-none whitespace-nowrap
        transition-all duration-150 ease-out
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        active:translate-y-[2px]
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-body)',
        ...v.base,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, v.hover);
          e.currentTarget.style.transform = 'translateY(1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, v.base, style);
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(3px)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, v.hover);
          e.currentTarget.style.transform = 'translateY(1px)';
        }
      }}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="w-4 h-4 border-2 rounded-full animate-spin flex-none"
            style={{
              borderColor: 'rgba(255,255,255,0.3)',
              borderTopColor: 'currentColor',
            }}
          />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <span className="flex-none flex items-center">{icon}</span>}
          {children}
          {iconRight && <span className="flex-none flex items-center">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
