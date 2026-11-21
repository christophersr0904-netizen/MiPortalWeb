/**
 * CONSTANTES DE MOVIMIENTO Y FÍSICAS DE RESORTES (MOTION PRESETS)
 * PMO Personal & Life OS - Cobalt Aerodynamic A.2.2
 * Calibradas para 60/120 FPS (Estilo iOS / Linear - Sensación Táctil Nativa)
 */

/**
 * Curva cúbica bezier de desaceleración suave estilo iOS / Apple Human Interface
 */
export const EASE_IOS = [0.22, 1, 0.36, 1] as const;

/**
 * Resorte reactivo y ágil: Ideal para pestañas activas, pills deslizantes (layoutId), micro-botones y selectores
 */
export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 460,
  damping: 34,
  mass: 0.7
} as const;

/**
 * Resorte amortiguado de elevación: Ideal para modales Bento, sheets inferiores y drawers deslizantes
 */
export const SPRING_MODAL = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.85
} as const;

/**
 * Transición estándar de entrada/salida de vistas completas con opacidad y micro-desplazamiento
 */
export const TRANSITION_VIEW = {
  duration: 0.18,
  ease: EASE_IOS
} as const;

/**
 * Resorte suave para gráficos interactivos, medidores radiales y tarjetas WBS
 */
export const SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.8
} as const;
