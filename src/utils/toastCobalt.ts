/**
 * ============================================================================
 * ARCHIVO: src/utils/toastCobalt.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYS-001-F8 (Erradicación Total de SweetAlert2 y Toasts Declarativos)
 * DESCRIPCIÓN: Despachador omnicanal de notificaciones y micro-toasts nativos
 *              Cobalt Aerodynamic basados en CustomEvent (cero dependencias).
 * ============================================================================
 */

export interface ToastCobaltPayload {
  id: string;
  mensaje: string;
  tipo: 'success' | 'info' | 'warning' | 'error';
  duracionMs: number;
}

export const mostrarToastCobalt = (
  mensaje: string,
  tipo: 'success' | 'info' | 'warning' | 'error' = 'success',
  duracionMs: number = 2500
) => {
  if (typeof window !== 'undefined') {
    const detail: ToastCobaltPayload = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      mensaje,
      tipo,
      duracionMs
    };
    window.dispatchEvent(new CustomEvent('pmo:toast', { detail }));
  }
};

export const toastCobalt = {
  exito: (mensaje: string, duracionMs?: number) => mostrarToastCobalt(mensaje, 'success', duracionMs),
  error: (mensaje: string, duracionMs?: number) => mostrarToastCobalt(mensaje, 'error', duracionMs),
  info: (mensaje: string, duracionMs?: number) => mostrarToastCobalt(mensaje, 'info', duracionMs),
  advertencia: (mensaje: string, duracionMs?: number) => mostrarToastCobalt(mensaje, 'warning', duracionMs)
};
