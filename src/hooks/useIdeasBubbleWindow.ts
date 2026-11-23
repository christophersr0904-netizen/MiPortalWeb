import { useState, useEffect, useRef, type CSSProperties, type Dispatch, type SetStateAction, type RefObject } from 'react';

const STORAGE_KEY_BUBBLE_POS = 'pmo_ideas_bubble_pos';
const STORAGE_KEY_VENTANA_POS = 'pmo_ideas_ventana_pos';
const STORAGE_KEY_VENTANA_SIZE = 'pmo_ideas_ventana_size';
const MARGIN_MINIMO_PANTALLA = 16;
const PILL_COLLAPSED_WIDTH = 78;
const PILL_COLLAPSED_HEIGHT = 48;

/**
 * Acota las coordenadas de la burbuja flotante a los márgenes seguros del viewport.
 */
export function clampPosicionBurbuja(
  x: number,
  y: number,
  anchoWidget: number,
  altoWidget: number
): { x: number; y: number } {
  const maxX = Math.max(MARGIN_MINIMO_PANTALLA, window.innerWidth - anchoWidget - MARGIN_MINIMO_PANTALLA);
  const maxY = Math.max(MARGIN_MINIMO_PANTALLA, window.innerHeight - altoWidget - MARGIN_MINIMO_PANTALLA);
  return {
    x: Math.round(Math.max(MARGIN_MINIMO_PANTALLA, Math.min(maxX, x))),
    y: Math.round(Math.max(MARGIN_MINIMO_PANTALLA, Math.min(maxY, y)))
  };
}

export interface UseIdeasBubbleWindowReturn {
  pillRef: RefObject<HTMLDivElement | null>;
  posicion: { x: number; y: number } | null;
  setPosicion: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  esMovil: boolean;
  usaAnclajeDerecho: boolean;
  containerStyle: CSSProperties;
  abrirPopoverHaciaAbajo: boolean;
  abrirPopoverHaciaDerecha: boolean;
  handlePointerDownGrip: (e: React.PointerEvent) => void;
  ventanaAbierta: boolean;
  setVentanaAbierta: Dispatch<SetStateAction<boolean>>;
  ventanaMinimizada: boolean;
  setVentanaMinimizada: Dispatch<SetStateAction<boolean>>;
  ventanaMaximizada: boolean;
  setVentanaMaximizada: Dispatch<SetStateAction<boolean>>;
  posicionVentana: { x: number; y: number } | null;
  setPosicionVentana: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  tamanoVentana: { width: number; height: number } | null;
  setTamanoVentana: Dispatch<SetStateAction<{ width: number; height: number } | null>>;
  ventanaStyle: CSSProperties;
  handleMouseDownVentanaHeader: (e: React.MouseEvent) => void;
  handleMouseDownVentanaResize: (e: React.MouseEvent) => void;
}

/**
 * Hook desacoplado de geometría, arrastre (drag), redimensionamiento (resize)
 * y persistencia en localStorage para la burbuja y ventana Canvas/PiP de Ideas.
 */
export function useIdeasBubbleWindow(): UseIdeasBubbleWindowReturn {
  const pillRef = useRef<HTMLDivElement>(null);

  // Detección reactiva de viewport móvil (< 768px)
  const [esMovil, setEsMovil] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const actualizar = () => setEsMovil(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  // Posición del micro-widget flotante con persistencia en localStorage
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    width: number;
    height: number;
  } | null>(null);
  const latestPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Estados de la ventana flotante Canvas/PiP
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const [ventanaMinimizada, setVentanaMinimizada] = useState(false);
  const [ventanaMaximizada, setVentanaMaximizada] = useState(false);
  const [posicionVentana, setPosicionVentana] = useState<{ x: number; y: number } | null>(null);
  const [tamanoVentana, setTamanoVentana] = useState<{ width: number; height: number } | null>(null);

  const ventanaDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const ventanaDragCleanupRef = useRef<(() => void) | null>(null);
  const ventanaResizeRef = useRef<{ startX: number; startY: number; initialW: number; initialH: number } | null>(null);
  const ventanaResizeCleanupRef = useRef<(() => void) | null>(null);

  // Cargar posiciones y dimensiones guardadas de la píldora y la ventana PiP
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedPos = localStorage.getItem(STORAGE_KEY_BUBBLE_POS);
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clamped = clampPosicionBurbuja(parsed.x, parsed.y, 160, 48);
          setPosicion(clamped);
          latestPosRef.current = clamped;
        }
      }
      const savedVentanaPos = localStorage.getItem(STORAGE_KEY_VENTANA_POS);
      if (savedVentanaPos) {
        const parsed = JSON.parse(savedVentanaPos);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosicionVentana(parsed);
        }
      }
      const savedVentanaSize = localStorage.getItem(STORAGE_KEY_VENTANA_SIZE);
      if (savedVentanaSize) {
        const parsed = JSON.parse(savedVentanaSize);
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          setTamanoVentana(parsed);
        }
      }
    } catch (err) {
      console.warn('[useIdeasBubbleWindow] Error al leer persistencia de ideas:', err);
    }
  }, []);

  // Re-acotar posición guardada al redimensionar la ventana para evitar salidas de viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setPosicion((prev) => {
        if (!prev) return prev;
        const w = pillRef.current?.offsetWidth || 160;
        const h = pillRef.current?.offsetHeight || 48;
        const clamped = clampPosicionBurbuja(prev.x, prev.y, w, h);
        latestPosRef.current = clamped;
        return clamped;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      dragCleanupRef.current?.();
      ventanaDragCleanupRef.current?.();
      ventanaResizeCleanupRef.current?.();
    };
  }, []);

  // Drag and Drop de la burbuja / píldora flotante
  const handlePointerDownGrip = (e: React.PointerEvent) => {
    if (esMovil) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    dragCleanupRef.current?.();

    const rect = pillRef.current?.getBoundingClientRect();
    const hasRect = Boolean(rect && rect.width > 0);
    const width = PILL_COLLAPSED_WIDTH;
    const height = hasRect ? rect!.height : PILL_COLLAPSED_HEIGHT;
    const usaAnclajeDerecho = posicion ? posicion.x >= 200 : true;
    const currentX =
      posicion?.x ??
      (hasRect
        ? usaAnclajeDerecho
          ? rect!.right - width
          : rect!.left
        : window.innerWidth - 180);
    const currentY = posicion?.y ?? (hasRect ? rect!.top : window.innerHeight - 80);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      width,
      height
    };
    latestPosRef.current = { x: currentX, y: currentY };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = moveEv.clientX - dragRef.current.startX;
      const dy = moveEv.clientY - dragRef.current.startY;
      const nextPos = clampPosicionBurbuja(
        dragRef.current.initialX + dx,
        dragRef.current.initialY + dy,
        dragRef.current.width,
        dragRef.current.height
      );
      latestPosRef.current = nextPos;
      setPosicion(nextPos);
    };

    const cleanup = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      dragCleanupRef.current = null;
    };

    const handlePointerUp = () => {
      const posFinal = latestPosRef.current;
      cleanup();
      if (posFinal) {
        try {
          localStorage.setItem(STORAGE_KEY_BUBBLE_POS, JSON.stringify(posFinal));
        } catch (err) {
          console.warn('[useIdeasBubbleWindow] Error al persistir posición de burbuja:', err);
        }
      }
    };

    dragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const usaAnclajeDerecho = Boolean(posicion && posicion.x >= 200);
  const containerStyle: CSSProperties =
    posicion && !esMovil
      ? {
          position: 'fixed',
          top: `${posicion.y}px`,
          bottom: 'auto',
          ...(usaAnclajeDerecho
            ? {
                right: `${Math.max(
                  MARGIN_MINIMO_PANTALLA,
                  window.innerWidth - (posicion.x + PILL_COLLAPSED_WIDTH)
                )}px`,
                left: 'auto'
              }
            : {
                left: `${posicion.x}px`,
                right: 'auto'
              }),
          zIndex: 9990
        }
      : {};

  const abrirPopoverHaciaAbajo = Boolean(!esMovil && posicion && posicion.y < 340);
  const abrirPopoverHaciaDerecha = Boolean(
    !esMovil && posicion && typeof window !== 'undefined' && posicion.x < window.innerWidth / 2
  );

  // Drag and Drop de la ventana de gestión
  const handleMouseDownVentanaHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (ventanaMaximizada) return;

    e.preventDefault();
    ventanaDragCleanupRef.current?.();

    const ventanaElem = document.getElementById('ventana-flotante-ideas');
    const rect = ventanaElem ? ventanaElem.getBoundingClientRect() : null;
    const currentX = rect ? rect.left : (posicionVentana?.x ?? (window.innerWidth - 500));
    const currentY = rect ? rect.top : (posicionVentana?.y ?? (window.innerHeight - 620));

    ventanaDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!ventanaDragRef.current) return;
      const dx = moveEv.clientX - ventanaDragRef.current.startX;
      const dy = moveEv.clientY - ventanaDragRef.current.startY;

      const currentW = tamanoVentana?.width ?? (rect ? rect.width : 480);
      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - currentW - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - 60);

      const newX = Math.max(minX, Math.min(maxX, ventanaDragRef.current.initialX + dx));
      const newY = Math.max(minY, Math.min(maxY, ventanaDragRef.current.initialY + dy));

      const newPos = { x: Math.round(newX), y: Math.round(newY) };
      setPosicionVentana(newPos);
      try {
        localStorage.setItem(STORAGE_KEY_VENTANA_POS, JSON.stringify(newPos));
      } catch (err) {
        console.warn('[useIdeasBubbleWindow] Error al persistir posición de ventana:', err);
      }
    };

    const handleMouseUp = () => {
      ventanaDragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      ventanaDragCleanupRef.current = null;
    };

    ventanaDragCleanupRef.current = () => {
      ventanaDragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      ventanaDragCleanupRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Redimensionamiento de la ventana de gestión
  const handleMouseDownVentanaResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ventanaMaximizada || ventanaMinimizada) return;

    ventanaResizeCleanupRef.current?.();

    const ventanaElem = document.getElementById('ventana-flotante-ideas');
    const rect = ventanaElem ? ventanaElem.getBoundingClientRect() : null;
    const currentW = rect ? rect.width : (tamanoVentana?.width ?? 480);
    const currentH = rect ? rect.height : (tamanoVentana?.height ?? 580);

    ventanaResizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialW: currentW,
      initialH: currentH
    };

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!ventanaResizeRef.current) return;
      const dw = moveEv.clientX - ventanaResizeRef.current.startX;
      const dh = moveEv.clientY - ventanaResizeRef.current.startY;

      const minW = Math.min(480, window.innerWidth - 32);
      const maxW = Math.floor(window.innerWidth * 0.95);
      const minH = 400;
      const maxH = Math.floor(window.innerHeight * 0.90);

      const newW = Math.max(minW, Math.min(maxW, ventanaResizeRef.current.initialW + dw));
      const newH = Math.max(minH, Math.min(maxH, ventanaResizeRef.current.initialH + dh));

      const newSize = { width: Math.round(newW), height: Math.round(newH) };
      setTamanoVentana(newSize);
      try {
        localStorage.setItem(STORAGE_KEY_VENTANA_SIZE, JSON.stringify(newSize));
      } catch (err) {
        console.warn('[useIdeasBubbleWindow] Error al persistir tamaño de ventana:', err);
      }
    };

    const handleMouseUp = () => {
      ventanaResizeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      ventanaResizeCleanupRef.current = null;
    };

    ventanaResizeCleanupRef.current = () => {
      ventanaResizeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      ventanaResizeCleanupRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Estilo reactivo de posición y tamaño de la ventana
  const ventanaStyle: CSSProperties = ventanaMaximizada
    ? {
        position: 'fixed',
        top: '16px',
        left: '16px',
        right: '16px',
        bottom: '16px',
        width: 'calc(100vw - 32px)',
        height: 'calc(100vh - 32px)',
        zIndex: 9995
      }
    : ventanaMinimizada
    ? {
        position: 'fixed',
        left: posicionVentana ? `${posicionVentana.x}px` : undefined,
        top: posicionVentana ? `${posicionVentana.y}px` : undefined,
        right: !posicionVentana ? '24px' : undefined,
        bottom: !posicionVentana ? '80px' : undefined,
        width: '320px',
        height: '56px',
        zIndex: 9995
      }
    : {
        position: 'fixed',
        left: (posicionVentana && !esMovil) ? `${posicionVentana.x}px` : undefined,
        top: (posicionVentana && !esMovil) ? `${posicionVentana.y}px` : undefined,
        right: (!posicionVentana || esMovil) ? (esMovil ? '8px' : '24px') : undefined,
        bottom: (!posicionVentana || esMovil) ? 'calc(5rem + env(safe-area-inset-bottom, 0px))' : undefined,
        width: esMovil ? 'calc(100vw - 16px)' : `${tamanoVentana?.width ?? 480}px`,
        height: esMovil ? 'min(560px, calc(100dvh - 7rem))' : `${tamanoVentana?.height ?? 580}px`,
        minWidth: esMovil ? 'auto' : 'min(480px, calc(100vw - 32px))',
        minHeight: esMovil ? '300px' : '400px',
        maxWidth: '96vw',
        maxHeight: 'calc(100dvh - 6rem)',
        zIndex: 9995
      };

  return {
    pillRef,
    posicion,
    setPosicion,
    esMovil,
    usaAnclajeDerecho,
    containerStyle,
    abrirPopoverHaciaAbajo,
    abrirPopoverHaciaDerecha,
    handlePointerDownGrip,
    ventanaAbierta,
    setVentanaAbierta,
    ventanaMinimizada,
    setVentanaMinimizada,
    ventanaMaximizada,
    setVentanaMaximizada,
    posicionVentana,
    setPosicionVentana,
    tamanoVentana,
    setTamanoVentana,
    ventanaStyle,
    handleMouseDownVentanaHeader,
    handleMouseDownVentanaResize
  };
}

export default useIdeasBubbleWindow;
