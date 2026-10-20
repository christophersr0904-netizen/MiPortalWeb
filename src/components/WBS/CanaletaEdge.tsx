import React from 'react';
import { BaseEdge, EdgeProps } from '@xyflow/react';

export interface CanaletaEdgeData {
  canalY?: number;
  esCritica?: boolean;
  esVecinoInmediato?: boolean;
  isAdjacente?: boolean;
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
  const canalY = d?.canalY ?? 700;
  const r = 6; // Radio sutil para codos limpios a 90°

  let path = '';

  if (esVecino) {
    // 1. Flecha horizontal directa y recta entre tareas adyacentes en la misma fila
    path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  } else {
    // 2. Trazo rectangular limpio en 'U' invertida por la pista despejada inferior (Y = 700px)
    // El alley libre a la izquierda del target card es [targetX - 36, targetX]; el centro exacto es targetX - 18
    const turnX = targetX - 18;
    const dirX = turnX < sourceX ? -1 : 1;

    path = [
      `M ${sourceX} ${sourceY}`,
      `V ${canalY - r}`,
      `Q ${sourceX} ${canalY} ${sourceX + dirX * r} ${canalY}`,
      `H ${turnX - dirX * r}`,
      `Q ${turnX} ${canalY} ${turnX} ${canalY - r}`,
      `V ${targetY + r}`,
      `Q ${turnX} ${targetY} ${turnX + r} ${targetY}`,
      `H ${targetX}`
    ].join(' ');
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
    />
  );
};
