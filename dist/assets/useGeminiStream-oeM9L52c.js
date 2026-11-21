import{r as n}from"./vendor-react-xWhcpg2D.js";function _(){const[c,e]=n.useState(""),[u,a]=n.useState("idle"),[s,m]=n.useState(null),r=n.useRef(null),i=n.useCallback(()=>{r.current&&(r.current.abort(),r.current=null),a(t=>t==="streaming"?"completed":t)},[]),o=n.useCallback(()=>{i(),e(""),a("idle"),m(null)},[i]),p=n.useCallback(async(t,d)=>{var I;o(),a("streaming");const b="https://zzzbwurqidastkxqgyog.supabase.co",A="sb_publishable_BUJix1kCvHF8obwGx1NUYw_X9qjmxgy";if(b.includes("mock")||b.includes("tu-proyecto")){await C(t,d,e,a);return}r.current=new AbortController;try{const l=`${b}/functions/v1/gemini-orchestrator`,f=await fetch(l,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${A||""}`},body:JSON.stringify({action:t,payload:d}),signal:r.current.signal});if(!f.ok){console.warn(`[useGeminiStream] Edge Function remota respondió HTTP ${f.status}. Conmutando a simulador IA local...`),await C(t,d,e,a);return}const D=(I=f.body)==null?void 0:I.getReader();if(!D)throw new Error("No se pudo inicializar el lector de stream.");const S=new TextDecoder;let y="",g="";for(;;){const{done:T,value:v}=await D.read();if(T)break;g+=S.decode(v,{stream:!0});const E=g.split(`
`);g=E.pop()||"";for(const O of E){const h=O.trim();if(h.startsWith("data: "))try{const P=JSON.parse(h.slice(6));if(P.text&&(y+=P.text,e(y)),P.done){a("completed");return}}catch{}}}a("completed")}catch(l){l.name==="AbortError"?a("completed"):(console.warn("[useGeminiStream] Error de red o CORS al conectar con Edge Function. Conmutando a simulador IA local...",l),await C(t,d,e,a))}finally{r.current=null}},[o]);return{streamedText:c,status:u,error:s,startStream:p,abortStream:i,reset:o}}async function C(c,e,u,a){let s="";if(c==="clarificar_idea")s=`### Diagnóstico Estratégico de la Idea

**Enunciado Analizado:** "${e.enunciado||"Iniciativa Sin Título"}"

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
3. **Paso 3:** Agendar un bloque de trabajo profundo de 90 minutos para la prueba de concepto.`;else if(c==="desglosar_wbs")s=`### Estructura de Desglose de Trabajo (WBS) Sugerida

**Iniciativa:** "${e.nombreProyecto||"Proyecto de Infraestructura"}"

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
- [ ] Ejecutar auditoría de regresión sobre archivos legacy (P1 - Alta, 2h).`;else{const i=e.nombrePaquete||"Paquete de Trabajo",o=e.criterioDoD||"Entregable verificado al 100%",p=e.nombreProyecto||"Proyecto";s=`### Desglose de Tareas Operativas WBS
**Entregable:** "${i}" (${p})
**Criterio DoD:** ${o}

\`\`\`json
[
  {
    "nombre": "Planificación y diseño técnico de ${i}",
    "prioridad": "01_P1_Alta",
    "horasEstimadas": 4,
    "criterioDoD": "Especificaciones y alcance aprobados"
  },
  {
    "nombre": "Construcción y despliegue operativo de ${i}",
    "prioridad": "01_P1_Alta",
    "horasEstimadas": 8,
    "criterioDoD": "Componentes ensamblados y operativos"
  },
  {
    "nombre": "Control de calidad y verificación DoD (${o.slice(0,35)})",
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
\`\`\``}const m=s.split(`

`);let r="";for(const i of m)r+=(r?`

`:"")+i,u(r),await new Promise(o=>setTimeout(o,90));a("completed")}export{_ as u};
