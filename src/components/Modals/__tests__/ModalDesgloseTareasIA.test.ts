/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/__tests__/ModalDesgloseTareasIA.test.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-OP-58-EXEC (Unit Tests para Staging Area y Parser WBS IA)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { extraerTareasDeTexto } from '../ModalDesgloseTareasIA';

describe('REQ-OP-58-EXEC: ModalDesgloseTareasIA & Parser de Tareas IA', () => {
  it('Paso 1: Extrae correctamente tareas desde bloque Markdown ```json ... ```', () => {
    const rawAiOutput = `
Aquí tienes las tareas operativas sugeridas:

\`\`\`json
[
  {
    "nombre": "Diseñar esquemas de base de datos en Dexie",
    "prioridad": "01_P1_Alta",
    "horasEstimadas": 6,
    "criterioDoD": "Tablas creadas con índices y tipos estrictos"
  },
  {
    "nombre": "Construir endpoints de sincronización y replicación",
    "prioridad": "02_P2_Media",
    "horasEstimadas": 8,
    "criterioDoD": "Tests de integración en verde"
  }
]
\`\`\`

Espero que estas tareas cubran el entregable.
`;

    const tareas = extraerTareasDeTexto(rawAiOutput);
    expect(tareas).toHaveLength(2);
    expect(tareas[0].nombre).toBe('Diseñar esquemas de base de datos en Dexie');
    expect(tareas[0].prioridad).toBe('01_P1_Alta');
    expect(tareas[0].horasEstimadas).toBe(6);
    expect(tareas[0].criterioDoD).toBe('Tablas creadas con índices y tipos estrictos');
    expect(tareas[0].seleccionada).toBe(true);

    expect(tareas[1].nombre).toBe('Construir endpoints de sincronización y replicación');
    expect(tareas[1].prioridad).toBe('02_P2_Media');
    expect(tareas[1].horasEstimadas).toBe(8);
  });

  it('Paso 2: Extrae tareas desde un array JSON crudo sin etiquetas Markdown', () => {
    const rawJson = JSON.stringify([
      {
        nombre: "Configurar canal Supabase Realtime",
        prioridad: "01_P1_Alta",
        horasEstimadas: 3
      },
      {
        nombre: "Documentar diccionario de datos",
        prioridad: "03_P3_Baja",
        horasEstimadas: 2
      }
    ]);

    const tareas = extraerTareasDeTexto(rawJson);
    expect(tareas).toHaveLength(2);
    expect(tareas[0].nombre).toBe('Configurar canal Supabase Realtime');
    expect(tareas[0].prioridad).toBe('01_P1_Alta');
    expect(tareas[1].prioridad).toBe('03_P3_Baja');
  });

  it('Paso 3: Fallback de extracción por líneas Markdown con detección de horas y prioridad', () => {
    const markdownList = `
### Tareas Operativas Inmediatas
- [ ] Implementar validación topológica con Algoritmo de Kahn (P1 - Alta, 4h)
- [ ] Diseñar el drawer interactivo con estética Cobalt (P2 - Media, 3.5h)
- [ ] Ejecutar auditoría de regresión sobre archivos legacy (2h)
`;

    const tareas = extraerTareasDeTexto(markdownList);
    expect(tareas).toHaveLength(3);
    expect(tareas[0].nombre).toContain('Implementar validación topológica con Algoritmo de Kahn');
    expect(tareas[0].prioridad).toBe('01_P1_Alta');
    expect(tareas[0].horasEstimadas).toBe(4);

    expect(tareas[1].nombre).toContain('Diseñar el drawer interactivo con estética Cobalt');
    expect(tareas[1].prioridad).toBe('02_P2_Media');
    expect(tareas[1].horasEstimadas).toBe(3.5);

    expect(tareas[2].horasEstimadas).toBe(2);
  });

  it('Paso 4: Normalización defensiva de prioridades cuando el texto es impreciso', () => {
    const rawJson = `\`\`\`json
[
  { "nombre": "Tarea Urgente", "prioridad": "P1_URGENTE", "horasEstimadas": 5 },
  { "nombre": "Tarea Menor", "prioridad": "P3_LEVE", "horasEstimadas": 1 },
  { "nombre": "Tarea Estándar", "prioridad": "DESCONOCIDA", "horasEstimadas": 4 }
]
\`\`\``;

    const tareas = extraerTareasDeTexto(rawJson);
    expect(tareas[0].prioridad).toBe('01_P1_Alta');
    expect(tareas[1].prioridad).toBe('03_P3_Baja');
    expect(tareas[2].prioridad).toBe('02_P2_Media'); // Fallback a Media
  });

  it('Paso 5: Maneja texto vacío, nulo o malformado retornando array vacío sin excepciones', () => {
    expect(extraerTareasDeTexto('')).toEqual([]);
    expect(extraerTareasDeTexto('   ')).toEqual([]);
    expect(extraerTareasDeTexto('### Solo encabezado sin tareas ni json')).toEqual([]);
  });
});

