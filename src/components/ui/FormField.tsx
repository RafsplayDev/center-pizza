'use client';

// =============================================================
// Center Pizza · FormField — componente reutilizável de input
// Usa classes do globals.css (.input, variáveis --cp-*)
// =============================================================

import { ChangeEvent, ReactNode, useState } from 'react';

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
export type FormFieldProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon: ReactNode;
  autoComplete?: string;
  /** Slot direito opcional — usado para botão olhinho da senha */
  rightSlot?: ReactNode;
  required?: boolean;
  disabled?: boolean;
};

// -------------------------------------------------------------
// FormField
// -------------------------------------------------------------
export function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
  rightSlot,
  required = false,
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label
        htmlFor={id}
        className="text-[10px] font-black tracking-[0.12em] uppercase"
        style={{ color: 'var(--cp-ink)' }}
      >
        {label}
      </label>

      {/* Wrapper do input */}
      <div
        className="form-field-wrap relative flex items-center rounded-[10px] border-2 transition-all"
        style={{
          borderColor: 'var(--cp-line-strong)',
          backgroundColor: value ? 'white' : 'var(--cp-flour)',
        }}
      >
        {/* Ícone esquerdo */}
        <span
          className="w-11 flex-none grid place-items-center"
          style={{ color: 'var(--cp-ink-muted)' }}
          aria-hidden="true"
        >
          {icon}
        </span>

        {/* Input */}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="flex-1 bg-transparent border-0 outline-none py-3.5 pr-3.5 pl-0 text-[15px] font-bold min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--cp-ink)',
          }}
        />

        {/* Slot direito (ex: toggle senha) */}
        {rightSlot}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PasswordField — FormField com toggle mostrar/ocultar senha
// Já encapsula a lógica do olhinho, pronto pra usar
// -------------------------------------------------------------
export type PasswordFieldProps = Omit<FormFieldProps, 'type' | 'rightSlot'>;

function EyeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.1 3.9" />
      <path d="M6.6 6.6A16 16 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1" />
      <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function PasswordField(props: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <FormField
      {...props}
      type={show ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className="w-11 flex-none grid place-items-center bg-transparent border-0 cursor-pointer p-0 transition-colors"
          style={{ color: 'var(--cp-ink-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cp-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--cp-ink-muted)')}
        >
          {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      }
    />
  );
}
