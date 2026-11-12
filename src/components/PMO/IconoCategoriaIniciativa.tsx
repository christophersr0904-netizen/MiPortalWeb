import React from 'react';
import { Briefcase, User, TrendingUp, Users, Layers, type LucideIcon } from 'lucide-react';

export interface MetaCategoriaIniciativa {
  clave: 'profesional' | 'personal' | 'inversion' | 'social' | 'general';
  etiqueta: string;
  containerClass: string;
  iconClass: string;
  Icon: LucideIcon;
}

const META_POR_CLAVE: Record<MetaCategoriaIniciativa['clave'], Omit<MetaCategoriaIniciativa, 'etiqueta'>> = {
  profesional: {
    clave: 'profesional',
    containerClass: 'bg-sky-500/10 border border-sky-500/20',
    iconClass: 'w-3.5 h-3.5 text-sky-400',
    Icon: Briefcase
  },
  personal: {
    clave: 'personal',
    containerClass: 'bg-emerald-500/10 border border-emerald-500/20',
    iconClass: 'w-3.5 h-3.5 text-emerald-400',
    Icon: User
  },
  inversion: {
    clave: 'inversion',
    containerClass: 'bg-violet-500/10 border border-violet-500/20',
    iconClass: 'w-3.5 h-3.5 text-violet-400',
    Icon: TrendingUp
  },
  social: {
    clave: 'social',
    containerClass: 'bg-amber-500/10 border border-amber-500/20',
    iconClass: 'w-3.5 h-3.5 text-amber-400',
    Icon: Users
  },
  general: {
    clave: 'general',
    containerClass: 'bg-slate-800/80 border border-slate-700/60',
    iconClass: 'w-3.5 h-3.5 text-slate-400',
    Icon: Layers
  }
};

/** Normaliza texto de categoría en minúsculas sin acentos para comparaciones consistentes. */
function normalizarTextoCategoria(valor?: string | null): string {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Resuelve icono, paleta Cobalt y etiqueta accesible para cada categoría de iniciativa. */
export function resolverMetaCategoriaIniciativa(categoria?: string | null): MetaCategoriaIniciativa {
  const etiqueta = String(categoria || '').trim() || 'General';
  const norm = normalizarTextoCategoria(etiqueta);

  let clave: MetaCategoriaIniciativa['clave'] = 'general';
  if (norm.includes('profesional')) {
    clave = 'profesional';
  } else if (norm.includes('personal')) {
    clave = 'personal';
  } else if (norm.includes('inversion')) {
    clave = 'inversion';
  } else if (norm.includes('social')) {
    clave = 'social';
  }

  return {
    ...META_POR_CLAVE[clave],
    etiqueta
  };
}

/** Verifica compatibilidad de filtrado entre el tipo de proyecto y la clave de filtro Kanban. */
export function coincideCategoriaIniciativa(
  categoriaProyecto?: string | null,
  filtroCategoria?: string
): boolean {
  const filtroNorm = normalizarTextoCategoria(filtroCategoria);
  if (!filtroNorm) return true;
  const tipoNorm = normalizarTextoCategoria(categoriaProyecto);
  if (tipoNorm === filtroNorm) return true;
  return filtroNorm === 'inversiones' && tipoNorm.includes('inversion');
}

export interface IconoCategoriaIniciativaProps {
  categoria?: string | null;
  className?: string;
}

/** Micro-píldora iconográfica de 24x24px con tooltip nativo para tarjetas PMO/Kanban. */
export const IconoCategoriaIniciativa: React.FC<IconoCategoriaIniciativaProps> = React.memo(
  ({ categoria, className = '' }) => {
    const { etiqueta, containerClass, iconClass, Icon } = resolverMetaCategoriaIniciativa(categoria);

    return (
      <span
        title={etiqueta}
        aria-label={etiqueta}
        data-categoria-iniciativa={etiqueta}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${containerClass} ${className}`.trim()}
      >
        <Icon className={iconClass} strokeWidth={1.75} />
      </span>
    );
  }
);

IconoCategoriaIniciativa.displayName = 'IconoCategoriaIniciativa';
