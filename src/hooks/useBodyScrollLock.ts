import { useEffect } from 'react';

/**
 * Hook para congelar el scroll del body cuando un modal, drawer o bottom-sheet está activo.
 * Previene el desplazamiento no deseado del lienzo de fondo en móvil y escritorio.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isLocked]);
}
