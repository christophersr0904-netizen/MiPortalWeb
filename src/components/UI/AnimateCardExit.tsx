/**
 * ============================================================================
 * ARCHIVO: src/components/UI/AnimateCardExit.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-UI-50-EXEC (Borrado Optimista Deterministico y Animaciones React Bits)
 * DESCRIPCIÓN: Envoltura cinemática para colapsar suavemente tarjetas de tareas,
 *              hábitos y transacciones al eliminarse optimísticamente sin saltos de layout.
 * ============================================================================
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AnimateCardExitProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimateCardExit: React.FC<AnimateCardExitProps> = ({
  isVisible,
  children,
  className = ''
}) => {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.92,
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
            transition: {
              type: 'spring',
              stiffness: 500,
              damping: 40,
              mass: 1
            }
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

