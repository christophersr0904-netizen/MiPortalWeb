/**
 * ============================================================================
 * ARCHIVO: src/components/WBS/CanaletaEdge.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-V360-GRAFOS-ROUTING-MODAL-EXEC-54
 * DESCRIPCIÓN: Canaleta ortogonal Manhattan para dependencias entre tareas operativas
 *              sin bucles invertidos, con codos a 90° limpios y pista escalonada.
 * ============================================================================
 */

import React from 'react';
import { BaseEdge, type EdgeProps } from '@xyflow/react';

export interface CanaletaEdgeData {
  canalY?: number;
  esCritica?: boolean;
  esVecinoInmediato?: boolean;
  isAdjacente?: boolean;
  pistaIndex?: number;
}

export const CanaletaEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data
}) => {
  const d = data as CanaletaEdgeData | undefined;
  const esVecino = d?.esVecinoInmediato ?? d?.isAdjacente ?? false;
  const pistaIndex = d?.pistaIndex ?? 0;
  // Escalonamiento de canal para evitar que todas las aristas se solapen en la misma línea
  const canalY = (d?.canalY ?? 700) + (pistaIndex % 6) * 12;

  // 1. Flecha horizontal directa y recta entre tareas adyacentes en la misma fila
  if (esVecino) {
    return (
      <BaseEdge
        id={id}
        path={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        style={{ strokeLinejoin: 'miter', ...style }}
        markerEnd={markerEnd}
      />
    );
  }

  // 2. Trazo ortogonal rectangular Manhattan puro (90°) en canal despejado inferior
  // Pasillo vertical libre a la izquierda del target card (GAP_X = 52px, centro libre en targetX - 26px)
  const turnX = targetX - 24;
  const path = `M ${sourceX} ${sourceY} V ${canalY} H ${turnX} V ${targetY} H ${targetX}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{ strokeLinejoin: 'miter', ...style }}
      markerEnd={markerEnd}
    />
  );
};
