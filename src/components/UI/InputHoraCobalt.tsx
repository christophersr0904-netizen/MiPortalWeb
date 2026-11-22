import React, { useRef } from 'react';
import { Clock } from 'lucide-react';

export interface InputHoraCobaltProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  name?: string;
}

/** Formatea hora técnica de 24h (HH:MM) a visualización legible 12H AM/PM (ej. 02:30 PM). */
export function formatearHora12(hora24?: string, fallback = 'Seleccionar hora'): string {
  if (!hora24) return fallback;
  const match = String(hora24).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return hora24;
  const h = parseInt(match[1], 10);
  const m = match[2];
  if (isNaN(h)) return hora24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
}

export const InputHoraCobalt: React.FC<InputHoraCobaltProps> = ({
  value,
  onChange,
  label,
  id,
  disabled = false,
  required = false,
  className = '',
  placeholder = 'Seleccionar hora',
  name
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-[10px] text-slate-400 block mb-0.5 select-none font-medium">
          {label}
        </label>
      )}
      <div
        onClick={() => {
          if (disabled) return;
          try {
            inputRef.current?.showPicker?.();
          } catch {
            inputRef.current?.focus();
          }
        }}
        className={`relative flex items-center gap-2 bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/20 transition-colors duration-150 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 pointer-events-none" strokeWidth={1.75} />
        <span
          className={`text-xs font-mono tabular-nums select-none flex-1 truncate ${
            value ? 'text-slate-200' : 'text-slate-500'
          }`}
        >
          {formatearHora12(value, placeholder)}
        </span>
        <input
          ref={inputRef}
          type="time"
          id={id}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => {
            if (disabled) return;
            try {
              inputRef.current?.showPicker?.();
            } catch {
              // fallback nativo
            }
          }}
          disabled={disabled}
          required={required}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 [color-scheme:dark]"
        />
      </div>
    </div>
  );
};
