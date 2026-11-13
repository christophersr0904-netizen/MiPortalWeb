import React from 'react';

export interface SwitchCobaltProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Switch Toggle Minimalista interactivo con estética Cobalt Aerodynamic (A.2.2)
 * Soporta estados activo/inactivo, animación deslizante y accesibilidad ARIA.
 */
export const SwitchCobalt: React.FC<SwitchCobaltProps> = ({
  id,
  checked,
  onChange,
  label,
  sublabel,
  disabled = false,
  size = 'md'
}) => {
  const isSm = size === 'sm';

  return (
    <div
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`inline-flex items-center justify-between gap-3 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'
      }`}
    >
      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-[10px] text-slate-400 font-normal leading-tight">
              {sublabel}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) onChange(!checked);
        }}
        className={`relative inline-flex shrink-0 transition-colors duration-200 ease-in-out rounded-full border focus:outline-none cursor-pointer ${
          isSm ? 'h-5 w-9' : 'h-6 w-11'
        } ${
          checked
            ? 'bg-sky-500 border-sky-400/80 shadow-[0_0_12px_rgba(14,165,233,0.35)]'
            : 'bg-slate-900 border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out ${
            isSm
              ? `h-3.5 w-3.5 mt-[2px] ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`
              : `h-4 w-4 mt-[3px] ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`
          }`}
        />
      </button>
    </div>
  );
};

