import React from 'react';
import { Calendar } from 'lucide-react';

export interface InputFechaCobaltProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  name?: string;
}

const MESES_ABR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

/** Formatea YYYY-MM-DD a formato canónico 'DD Mes AAAA' (ej. 18 Nov 2026). */
export function formatearFechaHumana(fechaIso?: string, fallback = 'Seleccionar fecha'): string {
  if (!fechaIso) return fallback;
  const clean = String(fechaIso).trim().split(/[\sT]/)[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return fechaIso;
  const y = parts[0];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(m) || isNaN(d) || m < 0 || m > 11) return fechaIso;
  return `${String(d).padStart(2, '0')} ${MESES_ABR[m]} ${y}`;
}

export const InputFechaCobalt: React.FC<InputFechaCobaltProps> = ({
  value,
  onChange,
  label,
  id,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  placeholder = 'Seleccionar fecha',
  name
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-[10px] text-slate-400 block mb-0.5 select-none font-medium">
          {label}
        </label>
      )}
      <div
        className={`relative flex items-center gap-2 bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0 pointer-events-none" strokeWidth={1.75} />
        <span
          className={`text-xs font-mono tabular-nums select-none flex-1 truncate ${
            value ? 'text-slate-200' : 'text-slate-500'
          }`}
        >
          {formatearFechaHumana(value, placeholder)}
        </span>
        <input
          type="date"
          id={id}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 [color-scheme:dark]"
        />
      </div>
    </div>
  );
};
