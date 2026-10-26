import { useContext } from 'react';
import { UndoDeleteContext, type UndoDeleteContextType } from '../context/UndoDeleteContext';

export const useUndoDelete = (): UndoDeleteContextType => {
  const context = useContext(UndoDeleteContext);
  if (!context) {
    throw new Error('useUndoDelete debe ser utilizado dentro de un UndoDeleteProvider');
  }
  return context;
};

export type { PendingDelete, ProgramarEliminacionParams, TipoEntidadUndo } from '../context/UndoDeleteContext';
