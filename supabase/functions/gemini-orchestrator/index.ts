/**
 * ============================================================================
 * SUPABASE EDGE FUNCTION: gemini-orchestrator
 * SISTEMA: PMO Personal Modular (Módulo 4 - Streaming SSE & Asistente IA)
 * RUNTIME: Deno / TypeScript
 * ROL: Orquestador seguro de Google Gemini API con streaming Server-Sent Events (SSE)
 * ============================================================================
 */

// Declaración ambiental de tipos de Deno para el analizador TypeScript / IDE
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

// Cabeceras CORS estándar para consumo seguro desde el cliente Vite
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface RequestPayload {
  action: 'clarificar_idea' | 'desglosar_wbs';
  payload: Record<string, any>;
}

// Configuración de Prompts y System Instructions según GeminiParserService
const PROMPTS = {
  clarificar_idea: (p: Record<string, any>) => `
Actúa como Asesor Estratégico Senior de Productividad, Arquitectura y PMO Personal.
Analiza con rigor crítico la siguiente idea capturada:
- Enunciado / Título: "${p.enunciado || p.titulo || ''}"
- Detalle / Contexto: "${p.detalle || p.contexto || ''}"
- Duda o Pregunta del Usuario: "${p.preguntaUsuario || p.duda || '¿Cómo estructurar y priorizar esto de forma óptima?'}"

Tu respuesta debe estructurarse con claridad profesional en Markdown conteniendo:
1. **Desglose Esencial:** Núcleo de valor y propósito real de la idea.
2. **Evaluación de Viabilidad:**
   - ¿Es realista?: (Sí/No y por qué)
   - Nivel de Fricción: (BAJO / MEDIO / ALTO)
   - Costos Ocultos y Trade-offs:
   - Tiempo Estimado:
3. **Recomendación de Entidad:** Recomienda enfáticamente si debe convertirse en **PROYECTO**, **TAREA**, **HABITO** o **NOTA**, justificando la decisión.
4. **Primeros 3 Pasos Accionables (Next Physical Actions):**
`,
  desglosar_wbs: (p: Record<string, any>) => `
Actúa como Master PMO y Arquitecto de Software Senior para Solopreneurs / Ejecutores Solitarios.
Genera la descomposición jerárquica WBS (Work Breakdown Structure) de nivel 1 a 3 para la siguiente iniciativa:
- Nombre del Proyecto: "${p.nombreProyecto || p.nombre || ''}"
- Descripción y Alcance: "${p.descripcion || p.alcance || ''}"
- Presupuesto Tope: "${p.presupuesto || 'Flexible'}"
- Días / Tiempo Estimado: "${p.diasEstimados || '60 días'}"

Tu respuesta debe estructurarse en Markdown limpio y tabular con:
1. **Resumen Ejecutivo & North Star OKR:** Objetivo central medible.
2. **Desglose de Fases e Hitos (WBS Nivel 1 y 2):**
   - Para cada fase (Iniciación, Planificación, Ejecución, Cierre), define los Paquetes de Trabajo (WP-XXX) con su Peso Porcentual asignado (asegurando que cada fase sume 100%).
   - Criterios de Aceptación (DoD) tangibles y fechas límite relativas.
3. **Tareas Operativas (WBS Nivel 3):**
   - Desglose de 2 a 3 tareas clave por cada paquete de trabajo, con horas estimadas y prioridad (P1-Alta, P2-Media, P3-Baja).
`
};

Deno.serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY no configurada en los secretos de Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, payload } = (await req.json()) as RequestPayload;
    if (!action || !PROMPTS[action]) {
      return new Response(
        JSON.stringify({ error: `Acción '${action}' no soportada.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptText = PROMPTS[action](payload || {});

    // Invocación al endpoint de Streaming de Gemini
    const model = 'gemini-2.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Error desde Gemini API (${geminiResponse.status}): ${errText}` }),
        { status: geminiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TransformStream para retransmitir SSE de Gemini hacia el cliente
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += textDecoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const textPart =
                    parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (textPart) {
                    controller.enqueue(
                      textEncoder.encode(`data: ${JSON.stringify({ text: textPart, done: false })}\n\n`)
                    );
                  }
                } catch (_e) {
                  // Fragmento parcial en streaming
                }
              }
            }
          }

          // Enviar señal de fin de stream
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify({ text: '', done: true })}\n\n`)
          );
          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno en gemini-orchestrator.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
