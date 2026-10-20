import React from 'react';
import { VisorNotas } from '../Notas/VisorNotas';

export const ViewNotas: React.FC = () => {
  return (
    <div id="vista-notas-container" className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden bg-[#040711]">
      <VisorNotas />
    </div>
  );
};
