/**
 * ============================================================================
 * ARCHIVO: src/components/WBS/OrtogonalTreeEdge.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-V360-GRAFOS-ROUTING-MODAL-EXEC-54
 * DESCRIPCIÓN: Arista SVG ortogonal pura a 90° para la jerarquía del árbol WBS
 *              (Proyecto -> Fases, Fases -> WP, WP -> Tareas, Tareas -> Gastos)
 *              Desciende a la canaleta central (midY), gira en 90° con codo
 *              suave sin ondulaciones y desciende al nodo hijo.
 * ============================================================================
 */

import React from 'react';
import { BaseEdge, type EdgeProps } from '@xyflow/react';

export const OrtogonalTreeEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd
}) => {
  // Si los nodos están perfectamente alineados verticalmente, trazo recto vertical
  if (Math.abs(sourceX - targetX) < 2) {
    return (
      <BaseEdge
        id={id}
        path={`M ${sourceX} ${sourceY} V ${targetY}`}
        style={style}
        markerEnd={markerEnd}
      />
    );
  }

  // Canaleta intermedia fija a la mitad exacta de la distancia vertical
  const midY = sourceY + (targetY - sourceY) / 2;
  const r = Math.min(8, Math.abs(targetX - sourceX) / 2, Math.abs(targetY - sourceY) / 2);
  const dirX = targetX > sourceX ? 1 : -1;

  // Trazo ortogonal canónico Manhattan: V -> Q -> H -> Q -> V
  const path = [
    `M ${sourceX} ${sourceY}`,
    `V ${midY - r}`,
    `Q ${sourceX} ${midY} ${sourceX + dirX * r} ${midY}`,
    `H ${targetX - dirX * r}`,
    `Q ${targetX} ${midY} ${targetX} ${midY + r}`,
    `V ${targetY}`
  ].join(' ');

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
    />
  );
};
