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
  Flame,
  CreditCard,
  Banknote,
  QrCode,
  Repeat,
  Wallet,
  ShoppingBag,
  Briefcase,
  Laptop,
  Megaphone,
  Truck,
  Home,
  Utensils,
  MoreHorizontal,
  BadgeDollarSign,
  LineChart,
  Gift,
  Coins,
  Clock,
  RotateCw
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

/**
 * Mapeo de Monedas Oficiales
 */
export const OPCIONES_MONEDA_COBALT: OpcionSelectCobalt<'PEN' | 'USD' | 'EUR'>[] = [
  { valor: 'PEN', etiqueta: 'PEN (S/)', badge: 'S/', colorBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-mono font-bold', icono: Coins },
  { valor: 'USD', etiqueta: 'USD ($)', badge: '$', colorBadge: 'bg-sky-950/60 text-sky-300 border-sky-500/40 font-mono font-bold', icono: Coins },
  { valor: 'EUR', etiqueta: 'EUR (€)', badge: '€', colorBadge: 'bg-purple-950/60 text-purple-300 border-purple-500/40 font-mono font-bold', icono: Coins }
];

/**
 * Mapeo de Métodos de Pago
 */
export const OPCIONES_METODO_PAGO_COBALT: OpcionSelectCobalt[] = [
  { valor: 'Transferencia Bancaria', etiqueta: 'Transferencia Bancaria', subtitulo: 'Banca por internet o app', icono: Building2 },
  { valor: 'Tarjeta de Crédito', etiqueta: 'Tarjeta de Crédito', subtitulo: 'Visa, Mastercard, Amex', icono: CreditCard },
  { valor: 'Billetera Digital (Yape/Plin)', etiqueta: 'Yape / Plin', subtitulo: 'Pago móvil inmediato', icono: QrCode },
  { valor: 'Efectivo', etiqueta: 'Efectivo', subtitulo: 'Pago físico directo', icono: Banknote },
  { valor: 'Débito Automático', etiqueta: 'Débito Automático', subtitulo: 'Cargo recurrente en cuenta', icono: Repeat }
];

/**
 * Mapeo de Categorías de Gasto
 */
export const OPCIONES_CATEGORIA_GASTO_COBALT: OpcionSelectCobalt[] = [
  { valor: 'Materiales', etiqueta: 'Materiales & Suministros', subtitulo: 'Insumos de trabajo', icono: ShoppingBag },
  { valor: 'Servicios Profesionales', etiqueta: 'Servicios Profesionales', subtitulo: 'Honorarios y asesorías', icono: Briefcase },
  { valor: 'Licencias / Software', etiqueta: 'Licencias & SaaS', subtitulo: 'Suscripciones digitales', icono: Laptop },
  { valor: 'Marketing / Publicidad', etiqueta: 'Marketing & Ads', subtitulo: 'Campañas y difusión', icono: Megaphone },
  { valor: 'Logística / Transporte', etiqueta: 'Logística & Transporte', subtitulo: 'Movilidad y envíos', icono: Truck },
  { valor: 'Equipos / Hardware', etiqueta: 'Equipos & Hardware', subtitulo: 'Tecnología y dispositivos', icono: Cpu },
  { valor: 'Cuota_Credito', etiqueta: 'Cuota de Crédito', subtitulo: 'Préstamos y tarjetas', icono: CreditCard },
  { valor: 'Alquiler / Servicios', etiqueta: 'Alquiler & Servicios', subtitulo: 'Oficina, luz, internet', icono: Home },
  { valor: 'Alimentación', etiqueta: 'Alimentación & Café', subtitulo: 'Reuniones y consumo', icono: Utensils },
  { valor: 'Otros', etiqueta: 'Otros Egresos', subtitulo: 'Gastos misceláneos', icono: MoreHorizontal }
];

/**
 * Mapeo de Categorías / Fuentes de Ingreso
 */
export const OPCIONES_CATEGORIA_INGRESO_COBALT: OpcionSelectCobalt[] = [
  { valor: 'Sueldo_Nomina', etiqueta: 'Sueldo / Nómina', subtitulo: 'Ingreso laboral principal', icono: BadgeDollarSign },
  { valor: 'Honorarios_Freelance', etiqueta: 'Honorarios Freelance', subtitulo: 'Consultoría y proyectos', icono: Briefcase },
  { valor: 'Negocio_Emprendimiento', etiqueta: 'Negocio Propio', subtitulo: 'Ventas operativas', icono: TrendingUp },
  { valor: 'Inversiones_Rendimientos', etiqueta: 'Rendimientos / Dividendos', subtitulo: 'Inversiones financieras', icono: LineChart },
  { valor: 'Ventas_Activos', etiqueta: 'Venta de Activos', subtitulo: 'Equipos o bienes', icono: ShoppingBag },
  { valor: 'Obsequio_Monetario', etiqueta: 'Obsequio / Donación', subtitulo: 'Transferencias extraordinarias', icono: Gift },
  { valor: 'Otros', etiqueta: 'Otros Ingresos', subtitulo: 'Fuentes diversas', icono: MoreHorizontal }
];

/**
 * Mapeo de Cuentas Destino Bancarias
 */
export const OPCIONES_CUENTA_DESTINO_COBALT: OpcionSelectCobalt[] = [
  { valor: 'BCP', etiqueta: 'BCP', badge: 'BCP', colorBadge: 'bg-blue-950/60 text-blue-300 border-blue-500/40 font-bold', icono: Building2 },
  { valor: 'IBK', etiqueta: 'Interbank', badge: 'IBK', colorBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-bold', icono: Building2 },
  { valor: 'BBVA', etiqueta: 'BBVA', badge: 'BBVA', colorBadge: 'bg-sky-950/60 text-sky-300 border-sky-500/40 font-bold', icono: Building2 },
  { valor: 'SCTBK', etiqueta: 'Scotiabank', badge: 'SCT', colorBadge: 'bg-rose-950/60 text-rose-300 border-rose-500/40 font-bold', icono: Building2 },
  { valor: 'Efectivo', etiqueta: 'Efectivo en Mano', badge: 'CASH', colorBadge: 'bg-amber-950/60 text-amber-300 border-amber-500/40 font-bold', icono: Banknote },
  { valor: 'Otros', etiqueta: 'Otra Cuenta', icono: Wallet }
];

/**
 * Mapeo de Frecuencia / Recurrencia Financiera
 */
export const OPCIONES_FRECUENCIA_COBALT: OpcionSelectCobalt[] = [
  { valor: 'UNICA', etiqueta: 'Única / Puntual', subtitulo: 'Cobro o pago único', icono: Calendar },
  { valor: 'SEMANAL', etiqueta: 'Semanal', subtitulo: 'Cada 7 días', icono: CalendarDays },
  { valor: 'QUINCENAL', etiqueta: 'Quincenal', subtitulo: 'Cada 15 días', icono: Clock },
  { valor: 'MENSUAL', etiqueta: 'Mensual', subtitulo: 'Día fijo cada mes', icono: RotateCw }
];

/**
 * Mapeo de Recurrencia para Hábitos y Actividades
 */
export const OPCIONES_RECURRENCIA_ACTIVIDAD_COBALT: OpcionSelectCobalt[] = [
  { valor: 'NINGUNA', etiqueta: 'No se repite', subtitulo: 'Actividad puntual', icono: Calendar },
  { valor: 'DIARIA', etiqueta: 'Todos los días', subtitulo: 'Racha diaria constante', icono: RotateCw },
  { valor: 'DIARIA_LABORAL', etiqueta: 'Lunes a Viernes', subtitulo: 'Jornada laboral estándar', icono: Briefcase },
  { valor: 'FIN_SEMANA', etiqueta: 'Fines de semana', subtitulo: 'Sábados y Domingos', icono: Sparkles },
  { valor: 'SEMANAL', etiqueta: 'Semanal', subtitulo: 'Días seleccionados', icono: CalendarDays },
  { valor: 'QUINCENAL', etiqueta: 'Cada 15 días', subtitulo: 'Bimensual', icono: Clock },
  { valor: 'MENSUAL', etiqueta: 'Mensual', subtitulo: 'Una vez al mes', icono: RotateCw },
  { valor: 'PERSONALIZADO', etiqueta: 'Personalizado...', subtitulo: 'Intervalo configurable', icono: Repeat }
];

