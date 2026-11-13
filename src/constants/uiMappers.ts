/**
 * ============================================================================
 * ARCHIVO: src/constants/uiMappers.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-UI-52-EXEC (Despliegue de Selectores Cobalt, Iconografía y Micro-interacciones)
 * DESCRIPCIÓN: Mapeadores canónicos para separar la persistencia técnica en backend/Dexie
 *              de la representación visual limpia con íconos Lucide para SelectIconicoCobalt.
 * ============================================================================
 */

import {
  Building2,
  Rocket,
  TrendingUp,
  GraduationCap,
  CalendarDays,
  Layers,
  Calendar,
  Zap,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Compass,
  Play,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Cpu,
  RefreshCw,
  Flame
} from 'lucide-react';
import type { OpcionSelectCobalt } from '../components/UI/SelectIconicoCobalt';

/**
 * Mapeo de Arquetipos de Proyecto (Persistencia en proy.arquetipo_proyecto)
 */
export const OPCIONES_ARQUETIPO: OpcionSelectCobalt[] = [
  {
    valor: '1_Infraestructura',
    etiqueta: 'Infraestructura & Construcción',
    subtitulo: 'Obras físicas, hardware y equipamiento',
    icono: Building2
  },
  {
    valor: '2_Venture',
    etiqueta: 'Venture & Tecnología',
    subtitulo: 'Software, startups y productos digitales',
    icono: Rocket
  },
  {
    valor: '3_Activo',
    etiqueta: 'Activos & Finanzas',
    subtitulo: 'Inversiones, patrimonio y bienes raíces',
    icono: TrendingUp
  },
  {
    valor: '4_Carrera',
    etiqueta: 'Carrera & Aprendizaje',
    subtitulo: 'Certificaciones, posgrados y habilidades',
    icono: GraduationCap
  },
  {
    valor: '5_Evento',
    etiqueta: 'Eventos & Campañas',
    subtitulo: 'Lanzamientos, conferencias y marketing',
    icono: CalendarDays
  }
];

/**
 * Mapeo de Magnitud del Proyecto T-Shirt (Persistencia en proy.magnitud_complejidad)
 */
export const OPCIONES_MAGNITUD: OpcionSelectCobalt[] = [
  {
    valor: 'Light',
    etiqueta: 'Light (S)',
    subtitulo: 'Corta duración / Menor a 30 días',
    badge: 'S',
    colorBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  },
  {
    valor: 'Medium',
    etiqueta: 'Medium (M)',
    subtitulo: 'Estándar / Entre 30 y 90 días',
    badge: 'M',
    colorBadge: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
  },
  {
    valor: 'Heavy',
    etiqueta: 'Heavy (L)',
    subtitulo: 'Alta escala y criticidad / Superior a 90 días',
    badge: 'L',
    colorBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  }
];

/**
 * Mapeo de Estados del Proyecto (Persistencia en proy.estado_proyecto)
 */
export const OPCIONES_ESTADO_PROYECTO: OpcionSelectCobalt[] = [
  { valor: '01_Backlog', etiqueta: 'Backlog', subtitulo: 'Ideas en cola previa', icono: Layers },
  { valor: '02_Planificado', etiqueta: 'Planificado', subtitulo: 'Alcance estructurado', icono: Calendar },
  { valor: '03_En_Ejecucion', etiqueta: 'En Ejecución', subtitulo: 'Desarrollo activo', icono: Zap },
  { valor: '04_En_Pausa', etiqueta: 'En Pausa', subtitulo: 'Detenido temporalmente', icono: PauseCircle },
  { valor: '05_Cancelado', etiqueta: 'Cancelado', subtitulo: 'Iniciativa descartada', icono: XCircle },
  { valor: '06_Cerrado', etiqueta: 'Cerrado', subtitulo: 'Entregable completado', icono: CheckCircle2 }
];

/**
 * Mapeo de Fases WBS Canónicas
 */
export const MAPEO_FASES_WBS: Record<string, { etiqueta: string; icono: any }> = {
  '01_INICIACION': { etiqueta: 'Iniciación', icono: Compass },
  '02_PLANIFICACION': { etiqueta: 'Planificación', icono: Calendar },
  '03_EJECUCION': { etiqueta: 'Ejecución', icono: Play },
  '04_CONTROL': { etiqueta: 'Control & Calidad', icono: ShieldCheck },
  '05_CIERRE': { etiqueta: 'Cierre', icono: CheckCircle }
};

/**
 * Helper para construir opciones de fases WBS dinámicas respetando sugeridas/personalizadas
 */
export const construirOpcionesFasesWbs = (fases: string[]): OpcionSelectCobalt[] => {
  return fases.map((fase) => {
    const config = MAPEO_FASES_WBS[fase];
    if (config) {
      return {
        valor: fase,
        etiqueta: config.etiqueta,
        subtitulo: `Fase estándar (${fase.replace(/^\d+_/, '')})`,
        icono: config.icono
      };
    }
    // Formatear fase personalizada o legible
    const limpia = fase.replace(/^\d+_/, '').replace(/_/g, ' ');
    const etiquetaCapitalizada = limpia.charAt(0).toUpperCase() + limpia.slice(1).toLowerCase();
    return {
      valor: fase,
      etiqueta: etiquetaCapitalizada,
      subtitulo: 'Fase personalizada del proyecto',
      icono: Compass
    };
  });
};

/**
 * Mapeo de Estado de Partida (para erradicar el bug de truncamiento 'split')
 */
export const OPCIONES_ESTADO_PARTIDA = [
  {
    id: 'Cero Absoluto (Greenfield)',
    titulo: 'Greenfield',
    subtitulo: 'Cero absoluto',
    icono: Sparkles
  },
  {
    id: 'Base / Prototipo Existente',
    titulo: 'Prototipo',
    subtitulo: 'Base existente',
    icono: Cpu
  },
  {
    id: 'Migración / Refactorización',
    titulo: 'Refactorización',
    subtitulo: 'Migración & mejoras',
    icono: RefreshCw
  },
  {
    id: 'Escalado / Lanzamiento',
    titulo: 'Escalado',
    subtitulo: 'Lanzamiento & expansión',
    icono: Flame
  }
];

