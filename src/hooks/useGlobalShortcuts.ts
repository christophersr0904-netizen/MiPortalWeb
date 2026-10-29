/**
 * ============================================================================
 * ARCHIVO: src/hooks/useGlobalShortcuts.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-1TO1-002 (Chasis Espejo Header & Atajos Globales LIFO)
 * DESCRIPCIÓN: Hook centralizado para captura omnicanal de eventos de teclado,
 *              blindaje de inputs y despacho contextual LIFO
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import type { VistaGlobal } from '../components/Layout/HeaderMaestro';
import { syncManager } from '../services/syncManager';

export interface UseGlobalShortcutsOptions {
  vistaActiva: VistaGlobal;
  onCambiarVista: (vista: VistaGlobal) => void;
  modalAtajosAbierto: boolean;
  setModalAtajosAbierto: (abierto: boolean | ((prev: boolean) => boolean)) => void;
  modalPdfAbierto: boolean;
  setModalPdfAbierto: (abierto: boolean | ((prev: boolean) => boolean)) => void;
  drawerArchivadosAbierto: boolean;
  setDrawerArchivadosAbierto: (abierto: boolean | ((prev: boolean) => boolean)) => void;
  asistenteIaAbierto?: boolean;
  setAsistenteIaAbierto?: (abierto: boolean | ((prev: boolean) => boolean)) => void;
  atajosHabilitados?: boolean;
}

export function useGlobalShortcuts({
  vistaActiva,
  onCambiarVista,
  modalAtajosAbierto,
  setModalAtajosAbierto,
  modalPdfAbierto,
  setModalPdfAbierto,
  drawerArchivadosAbierto,
  setDrawerArchivadosAbierto,
  asistenteIaAbierto = false,
  setAsistenteIaAbierto,
  atajosHabilitados = true
}: UseGlobalShortcutsOptions) {
  // Mantener referencias actualizadas para evitar recrear el listener con closures obsoletas
  const stateRef = useRef({
    vistaActiva,
    modalAtajosAbierto,
    modalPdfAbierto,
    drawerArchivadosAbierto,
    asistenteIaAbierto,
    atajosHabilitados
  });

  useEffect(() => {
    stateRef.current = {
      vistaActiva,
      modalAtajosAbierto,
      modalPdfAbierto,
      drawerArchivadosAbierto,
      asistenteIaAbierto,
      atajosHabilitados
    };
  }, [
    vistaActiva,
    modalAtajosAbierto,
    modalPdfAbierto,
    drawerArchivadosAbierto,
    asistenteIaAbierto,
    atajosHabilitados
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Detección rigurosa de foco en campo de texto o elemento editable
      const target = e.target as HTMLElement | null;
      const esInput = Boolean(
        target &&
        (
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true'
        )
      );

      // ======================================================================
      // 2. PILA LIFO: CONTROL UNIVERSAL DE ESCAPE (CANCELACIÓN Y CIERRE)
      // ======================================================================
      if (e.key === 'Escape' || e.keyCode === 27) {
        // Nivel 1 LIFO: Modales de mayor jerarquía / Asistente IA
        if (stateRef.current.asistenteIaAbierto && setAsistenteIaAbierto) {
          e.preventDefault();
          e.stopPropagation();
          setAsistenteIaAbierto(false);
          return;
        }

        // Nivel 2 LIFO: Modal de Exportación PDF
        if (stateRef.current.modalPdfAbierto) {
          e.preventDefault();
          e.stopPropagation();
          setModalPdfAbierto(false);
          return;
        }

        // Nivel 3 LIFO: Modal de Atajos de Teclado
        if (stateRef.current.modalAtajosAbierto) {
          e.preventDefault();
          e.stopPropagation();
          setModalAtajosAbierto(false);
          return;
        }

        // Nivel 4 LIFO: Drawer de Archivados
        if (stateRef.current.drawerArchivadosAbierto) {
          e.preventDefault();
          e.stopPropagation();
          setDrawerArchivadosAbierto(false);
          return;
        }

        // Nivel 5 LIFO: Desenfocar inputs activos si no hay modales abiertos
        if (esInput && document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
          e.preventDefault();
          (document.activeElement as HTMLElement).blur();
          return;
        }

        return;
      }

      // ======================================================================
      // 3. CONFIRMACIÓN PRIMARIA UNIVERSAL CON ENTER
      // ======================================================================
      if (e.key === 'Enter' || e.keyCode === 13) {
        // Excepción de preservación: Si es un textarea o contenteditable, permitir salto de línea
        if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        // Si hay modal abierto, emitir evento global para que el modal activo confirme su acción primaria
        if (
          stateRef.current.modalAtajosAbierto ||
          stateRef.current.modalPdfAbierto ||
          stateRef.current.drawerArchivadosAbierto
        ) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('pmo:confirm-action'));
          return;
        }
      }

      // ======================================================================
      // 4. BLINDAJE ESTRICTO CONTRA INPUTS:
      // Si el usuario está escribiendo en un input/textarea/select, se aborta
      // la captura de letras y números para permitir mecanografía normal.
      // ======================================================================
      if (esInput) {
        return;
      }

      // 5. Verificación de atajos habilitados
      if (!stateRef.current.atajosHabilitados) {
        return;
      }

      // Ignorar combinaciones con modificadores como Ctrl / Alt / Meta excepto Ctrl+K
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          // Enfocar buscador contextual si existe
          const searchInput = document.querySelector<HTMLInputElement>(
            '#input-busqueda-drawer-archivados, #input-busqueda-kanban, input[type="search"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        return;
      }

      const key = e.key.toLowerCase();

      // ======================================================================
      // 6. ATAJOS NUMÉRICOS DE VISTAS (1 a 5)
      // ======================================================================
      switch (key) {
        case '1':
          e.preventDefault();
          onCambiarVista('kanban');
          break;
        case '2':
          e.preventDefault();
          onCambiarVista('portafolio');
          break;
        case '3':
          e.preventDefault();
          onCambiarVista('habitos');
          break;
        case '4':
          e.preventDefault();
          onCambiarVista('financiero');
          break;
        case '5':
          e.preventDefault();
          onCambiarVista('notas');
          break;

        // ====================================================================
        // 7. ATAJOS ESENCIALES GLOBALES (C, R, X, ?)
        // ====================================================================
        case 'c':
          e.preventDefault();
          // Abrir Google Calendar en pestaña nueva con paridad legacy
          window.open('https://calendar.google.com/calendar/r', '_blank', 'noopener,noreferrer');
          break;

        case 'r':
          e.preventDefault();
          // Feedback inmediato en HeaderMaestro y componentes reactivos
          window.dispatchEvent(new CustomEvent('pmo:sync-triggered'));
          // Disparar sincronización bidireccional global
          syncManager.sincronizarTodo().catch((err) => {
            console.warn('[useGlobalShortcuts] Error en sync al pulsar R:', err);
          });
          break;

        case 'x':
          e.preventDefault();
          // Disparar evento para resetear filtros en la vista activa
          window.dispatchEvent(new CustomEvent('pmo:clear-filters'));
          break;

        case '?':
          e.preventDefault();
          setModalAtajosAbierto((prev) => !prev);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    onCambiarVista,
    setModalAtajosAbierto,
    setModalPdfAbierto,
    setDrawerArchivadosAbierto,
    setAsistenteIaAbierto
  ]);
}
