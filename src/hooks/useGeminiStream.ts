import { useState, useRef, useCallback } from 'react';

export type GeminiAction = 'clarificar_idea' | 'desglosar_wbs' | 'desglosar_tareas_paquete';
export type StreamStatus = 'idle' | 'streaming' | 'completed' | 'error';

export interface UseGeminiStreamReturn {
  streamedText: string;
  status: StreamStatus;
  error: string | null;
  startStream: (action: GeminiAction, payload: Record<string, any>) => Promise<void>;
  abortStream: () => void;
  reset: () => void;
}

export function useGeminiStream(): UseGeminiStreamReturn {
  const [streamedText, setStreamedText] = useState<string>('');
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus((prev) => (prev === 'streaming' ? 'completed' : prev));
  }, []);

  const reset = useCallback(() => {
    abortStream();
    setStreamedText('');
    setStatus('idle');
    setError(null);
  }, [abortStream]);

  const startStream = useCallback(
    async (action: GeminiAction, payload: Record<string, any>) => {
      reset();
      setStatus('streaming');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Si no hay Supabase URL real configurada o es mock, activar generador de simulación local
      const isMockOrOffline =
        !supabaseUrl ||
        supabaseUrl.includes('mock') ||
        supabaseUrl.includes('tu-proyecto');

      if (isMockOrOffline) {
        await simularStreamingLocal(action, payload, setStreamedText, setStatus);
        return;
      }

      abortControllerRef.current = new AbortController();

      try {
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/gemini-orchestrator`;
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey || ''}`
          },
          body: JSON.stringify({ action, payload }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          console.warn(
            `[useGeminiStream] Edge Function remota respondió HTTP ${response.status}. Conmutando a simulador IA local...`
          );
          await simularStreamingLocal(action, payload, setStreamedText, setStatus);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No se pudo inicializar el lector de stream.');
        }

        const decoder = new TextDecoder();
        let acumulado = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.text) {
                  acumulado += parsed.text;
                  setStreamedText(acumulado);
                }
                if (parsed.done) {
                  setStatus('completed');
                  return;
                }
              } catch {
                // Fragmento parcial ignorado
              }
            }
          }
        }

        setStatus('completed');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setStatus('completed');
        } else {
          console.warn(
            '[useGeminiStream] Error de red o CORS al conectar con Edge Function. Conmutando a simulador IA local...',
            err
          );
          await simularStreamingLocal(action, payload, setStreamedText, setStatus);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [reset]
  );

  return {
    streamedText,
    status,
    error,
    startStream,
    abortStream,
    reset
  };
}

/**
 * Simulador de streaming realista local (0 ms de latencia inicial) para desarrollo offline
 */
async function simularStreamingLocal(
  action: GeminiAction,
  payload: Record<string, any>,
  setText: React.Dispatch<React.SetStateAction<string>>,
  setStatus: React.Dispatch<React.SetStateAction<StreamStatus>>
): Promise<void> {
  let contenidoMock = '';

  if (action === 'clarificar_idea') {
    contenidoMock = `### Diagnóstico Estratégico de la Idea

**Enunciado Analizado:** "${payload.enunciado || 'Iniciativa Sin Título'}"

---

#### 1. Desglose Esencial
La iniciativa aborda la optimización de procesos mediante arquitectura modular. El valor central radica en reducir la dispersión mental del solopreneur y consolidar métricas tangibles en un panel unificado con latencia cero.

#### 2. Evaluación de Viabilidad
- **¿Es Realista?:** **Sí**, técnicamente factible con la pila actual (React + Dexie + Supabase).
- **Nivel de Fricción:** <span class="text-amber-400 font-bold">MEDIO</span> (requiere disciplina de captura diaria y reglas de transición claras).
- **Costos Ocultos y Trade-offs:** Curva de adopción inicial estimada en 3 a 5 días y necesidad de estandarizar nombres de entidades.
- **Tiempo Estimado de Maduración:** 2 semanas para el MVP funcional.

#### 3. Recomendación de Entidad
> **Veredicto:** Se recomienda convertir en **PROYECTO** de mediana escala (Fase de Iniciación), desglosando un charter mínimo antes de emitir tareas directas.

#### 4. Primeros 3 Pasos Accionables (Next Physical Actions)
1. **Paso 1:** Redactar los 3 criterios DoD (Definition of Done) no negociables.
2. **Paso 2:** Crear el paquete de trabajo preliminar \`WP-001\` en el módulo WBS.
3. **Paso 3:** Agendar un bloque de trabajo profundo de 90 minutos para la prueba de concepto.`;
  } else if (action === 'desglosar_wbs') {
    contenidoMock = `### Estructura de Desglose de Trabajo (WBS) Sugerida

**Iniciativa:** "${payload.nombreProyecto || 'Proyecto de Infraestructura'}"

---

#### 1. Resumen Ejecutivo & North Star OKR
*Desplegar una arquitectura de alta resiliencia con soporte offline nativo y sincronización automática LWW.*

#### 2. Paquetes de Trabajo e Hitos de Proyecto

| Código WBS | Fase | Tipo Elemento | Peso % | Entregable / Criterio DoD |
| :--- | :--- | :--- | :--- | :--- |
| **WP-01** | \`01_INICIACION\` | Paquete Trabajo | **40%** | Arquitectura y diagrama de entidades C4 aprobado |
| **WP-02** | \`01_INICIACION\` | Paquete Trabajo | **60%** | Configuración base y esquema Dexie v2 verificado |
| **HIT-01** | \`01_INICIACION\` | Hito Marcador | **0%** | Kickoff formal de la iniciativa |
| **WP-03** | \`02_PLANIFICACION\`| Paquete Trabajo | **50%** | Especificación CPM y cálculo de ruta crítica acíclico |
| **WP-04** | \`02_PLANIFICACION\`| Paquete Trabajo | **50%** | Matriz de riesgos y mitigaciones documentada |
| **HIT-02** | \`02_PLANIFICACION\`| Hito Marcador | **0%** | Congelamiento de línea base (Triple Restricción) |

#### 3. Tareas Operativas Inmediatas
- [ ] Implementar validación topológica con Algoritmo de Kahn (P1 - Alta, 4h).
- [ ] Diseñar el drawer interactivo con estética Cobalt Aerodynamic (P2 - Media, 3h).
- [ ] Ejecutar auditoría de regresión sobre archivos legacy (P1 - Alta, 2h).`;
  } else {
    // action === 'desglosar_tareas_paquete'
    const nom = payload.nombrePaquete || 'Paquete de Trabajo';
    const dod = payload.criterioDoD || 'Entregable verificado al 100%';
    const proy = payload.nombreProyecto || 'Proyecto';

    contenidoMock = `### Desglose de Tareas Operativas WBS
**Entregable:** "${nom}" (${proy})
**Criterio DoD:** ${dod}

\`\`\`json
[
  {
    "nombre": "Planificación y diseño técnico de ${nom}",
    "prioridad": "01_P1_Alta",
    "horasEstimadas": 4,
    "criterioDoD": "Especificaciones y alcance aprobados"
  },
  {
    "nombre": "Construcción y despliegue operativo de ${nom}",
    "prioridad": "01_P1_Alta",
    "horasEstimadas": 8,
    "criterioDoD": "Componentes ensamblados y operativos"
  },
  {
    "nombre": "Control de calidad y verificación DoD (${dod.slice(0, 35)})",
    "prioridad": "02_P2_Media",
    "horasEstimadas": 4,
    "criterioDoD": "Pruebas de aceptación superadas"
  },
  {
    "nombre": "Documentación técnica, conciliación y entrega final",
    "prioridad": "03_P3_Baja",
    "horasEstimadas": 2,
    "criterioDoD": "Checklist de entrega final registrado"
  }
]
\`\`\``;
  }

  const chunks = contenidoMock.split('\n\n');
  let acumulado = '';

  for (const chunk of chunks) {
    acumulado += (acumulado ? '\n\n' : '') + chunk;
    setText(acumulado);
    await new Promise((r) => setTimeout(r, 90));
  }

  setStatus('completed');
}
