/**
 * ============================================================================
 * ARCHIVO: GeminiParserService.gs
 * SISTEMA: PMO Personal Modular
 * ROL: Extracción Estructurada OCR e Inferencia de Contexto mediante Gemini API
 * ============================================================================
 */

// ============================================================================
// SECCIÓN 1: SERVICIO DE PARSER OCR CON GEMINI
// ============================================================================
const GeminiParserService = {

  /**
   * 1.1. Procesa imagen o PDF en Base64 e infiere imputación de Proyecto e Hito
   */
  extraerDatosComprobante: function(base64Image, mimeType, contextProyectosHitos = []) {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("Propiedad GEMINI_API_KEY no encontrada en Script Properties.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Sanitización robusta de la carga útil Base64 (remover prefijo Data URL si viene incluido)
    let cleanBase64 = String(base64Image || "").trim();
    if (cleanBase64.indexOf(",") !== -1) {
      cleanBase64 = cleanBase64.split(",")[1].trim();
    }
    if (!cleanBase64) {
      throw new Error("Carga útil de imagen en Base64 vacía o inválida.");
    }

    // Validación y fallback estricto de tipo MIME
    const validMimeType = (mimeType && String(mimeType).trim()) ? String(mimeType).trim().toLowerCase() : "image/jpeg";

    const schema = {
      type: "OBJECT",
      properties: {
        descripcionGasto: { type: "STRING" },
        categoriaGasto: { 
          type: "STRING", 
          enum: [
            "Materiales", 
            "Mano_Obra", 
            "Licencias_Software", 
            "Servicios_Terceros", 
            "Equipamiento", 
            "Educacion_Capacitacion", 
            "Imprevistos"
          ] 
        },
        monedaOriginal: { type: "STRING", enum: ["PEN", "USD", "EUR"] },
        montoOriginal: { type: "NUMBER" },
        tipoCambio: { type: "NUMBER" },
        fechaGasto: { type: "STRING" },
        idProyectoInferido: { type: "STRING" },
        idHitoInferido: { type: "STRING" }
      },
      required: ["descripcionGasto", "categoriaGasto", "monedaOriginal", "montoOriginal", "tipoCambio", "fechaGasto"]
    };

    let promptContextual = "Analiza este comprobante comercial. Extrae glosa sintética, categoría de gasto, divisa, monto total, tipo de cambio (1.00 si es PEN) y fecha ISO YYYY-MM-DD.";

    if (contextProyectosHitos && contextProyectosHitos.length > 0) {
      promptContextual += `\nAdicionalmente, analiza el concepto adquirido y selecciona el ID_Proyecto y el ID_Hito más compatible del siguiente catálogo activo:\n${JSON.stringify(contextProyectosHitos)}\nSi encuentras coincidencia temática clara, asigna idProyectoInferido e idHitoInferido. Si no hay relación directa, deja ambos campos vacíos ("").`;
    }

    const payload = {
      contents: [{
        parts: [
          { text: promptContextual },
          { inline_data: { mime_type: validMimeType, data: cleanBase64 } }
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: schema,
        temperature: 0.1
      }
    };

    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`Error en API Gemini (${response.getResponseCode()}): ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    return JSON.parse(result.candidates[0].content.parts[0].text);
  },

  /**
   * 1.2. Alias de compatibilidad transaccional para ApiEndpoints
   */
  parsearComprobante: function(base64Data, mimeType, contextProyectosHitos = []) {
    return this.extraerDatosComprobante(base64Data, mimeType, contextProyectosHitos);
  },

  /**
   * 1.3. Generador Integral de WBS con Gemini AI (Hitos, Tareas y Gastos proyectados)
   * Enfoque Solopreneur / Ejecutor Solitario con Inferencia Total (Metodología, Presupuesto y Cronograma)
   */
  generarWbsProyectoIA: function(contexto) {
    contexto = contexto || {};
    let apiKey = "";
    try {
      if (typeof PropertiesService !== "undefined" && PropertiesService.getScriptProperties) {
        apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      }
    } catch (eProp) {
      Logger.log("[Gemini WBS Properties]: " + eProp.message);
    }

    if (!apiKey) {
      Logger.log("[Gemini WBS]: No se encontró GEMINI_API_KEY en Script Properties. Usando motor heurístico.");
      return this.generarWbsFallbackHeuristico(contexto);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const schema = {
        type: "OBJECT",
        properties: {
          resumenEjecutivo: { type: "STRING" },
          northStarOKR: { type: "STRING" },
          entregableTangible: { type: "STRING" },
          criteriosDoD: { type: "STRING" },
          arquetipoSugerido: { 
            type: "STRING", 
            enum: ["1_Infraestructura", "2_Venture", "3_Activo", "4_Carrera", "5_Evento"] 
          },
          magnitudSugerida: { 
            type: "STRING", 
            enum: ["Light", "Medium", "Heavy"] 
          },
          justificacionClasificacion: { type: "STRING" },
          categoriaTShirt: { type: "STRING", enum: ["XS-ExtraSmall", "S-Small", "M-Medium", "L-Large", "XL-ExtraLarge", "L-Light", "H-Heavy"] },
          criterioDominante: { type: "STRING", enum: ["T-Tiempo", "C-Costo", "K-Complejidad", "I-Impacto"] },
          metodologiaOptima: { type: "STRING", enum: ["Scrum / Ágil", "Cascada / Tradicional", "Iterativo / Kanban"] },
          diasTotalesEstimados: { type: "INTEGER" },
          presupuestoCalculado: { type: "NUMBER" },
          hitos: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                nombreHito: { type: "STRING" },
                faseAsociada: { type: "STRING", enum: ["Iniciacion", "Planificacion", "Ejecucion", "Control", "Cierre"] },
                pesoPct: { type: "NUMBER" },
                diasRelativosFin: { type: "INTEGER" },
                criterioAceptacion: { type: "STRING" },
                esMav: { type: "BOOLEAN" },
                tareas: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      nombreTarea: { type: "STRING" },
                      prioridad: { type: "STRING", enum: ["01_P1_Alta", "02_P2_Media", "03_P3_Baja"] },
                      horasEstimadas: { type: "NUMBER" },
                      diasDuracion: { type: "INTEGER" },
                      esMav: { type: "BOOLEAN" }
                    },
                    required: ["nombreTarea", "prioridad", "horasEstimadas"]
                  }
                }
              },
              required: ["nombreHito", "faseAsociada", "pesoPct", "tareas"]
            }
          },
          gastos: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                descripcionGasto: { type: "STRING" },
                categoriaGasto: { 
                  type: "STRING", 
                  enum: [
                    "Materiales", 
                    "Mano_Obra", 
                    "Licencias_Software", 
                    "Servicios_Terceros", 
                    "Equipamiento", 
                    "Educacion_Capacitacion", 
                    "Imprevistos"
                  ] 
                },
                montoEstimado: { type: "NUMBER" },
                moneda: { type: "STRING", enum: ["PEN", "USD", "EUR"] },
                tareaAsociada: { type: "STRING" }
              },
              required: ["descripcionGasto", "categoriaGasto", "montoEstimado", "moneda"]
            }
          }
        },
        required: ["northStarOKR", "entregableTangible", "criteriosDoD", "arquetipoSugerido", "magnitudSugerida", "justificacionClasificacion", "metodologiaOptima", "hitos", "gastos"]
      };

      const systemInstructionText = `Actúa como un Senior Project Manager y Consultor Operativo de Élite con adaptabilidad universal en múltiples industrias: Obras Civiles y Hogar, Salud y Tratamientos Médicos, Inversiones y Bienes Raíces, Comercio y Negocios, y Tecnología/Software.
Tu misión es estructurar una propuesta WBS (Estructura de Desglose del Trabajo) de máxima precisión técnica, hiper-específica y de campo, adaptada rigurosamente a la naturaleza de la iniciativa y al rol del ejecutor.

================================================================================
CLASIFICACIÓN ESTRATÉGICA ADAPTATIVA (ARQUETIPO Y MAGNITUD)
================================================================================
Es OBLIGATORIO inferir, sugerir y justificar:
1. 'arquetipoSugerido':
   - "1_Infraestructura": Obras civiles, remodelaciones, construcción, hardware, fabricación física o proyectos donde el alcance es fijo, secuencial y con dependencias lineales críticas.
   - "2_Venture": Desarrollo de software, productos digitales, startups, apps móviles/web, plataformas SaaS o proyectos donde el alcance es emergente basado en sprints e hipótesis.
   - "3_Activo": Inversiones financieras, compra de inmuebles/terrenos, adquisición de maquinaria/vehículos o due diligence patrimonial donde prima el costo/retorno.
   - "4_Carrera": Certificaciones profesionales, maestrías, idiomas, preparación académica de alto nivel o hitos formativos que requieren deep work y bloques de tiempo.
   - "5_Evento": Conferencias, congresos, ceremonias, matrimonios, lanzamientos con fecha fatal inamovible (T-Minus) y coordinación de proveedores externos.

2. 'magnitudSugerida':
   - "Light": Iniciativas ligeras, duración < 30 días, bajo presupuesto, pocas tareas (< 15) o ejecución individual ultraligera.
   - "Medium": Iniciativas estándar de envergadura moderada, 30 a 90 días, presupuesto medio o coordinación intermedia.
   - "Heavy": Iniciativas de gran envergadura o complejidad crítica, > 90 días, alto presupuesto, contratistas múltiples o alto riesgo operacional.

3. 'justificacionClasificacion':
   - Breve explicación concisa (1 o 2 oraciones) sustentando por qué la iniciativa calza en dicho arquetipo y nivel de magnitud.

================================================================================
MODALIDADES DE EJECUCIÓN DEL PROYECTO
================================================================================
Adapta la redacción y tipo de tareas según la modalidad especificada por el usuario:
- "Ejecutor Directo": La persona realiza directamente las labores tácticas y operativas clave de forma autónoma.
- "Con Contratistas": La persona actúa como gestor y supervisor; sus tareas son cotizar, seleccionar, supervisar y liquidar a maestros de obra, médicos/clínicas, especialistas o proveedores externos.
- "Equipo Colaborativo": Se coordina y distribuyen tareas con un equipo interno o multidisciplinario.
- "Consultor / Asesor": Diseña la estrategia, especificación técnica, diagnóstico o supervisión para que un tercero lo ejecute.

================================================================================
LEYES INQUEBRANTABLES ANTI-GENERALIDADES (CERO CLICHÉS / CERO PLANTILLAS ABSTRACTAS)
================================================================================
1. PROHIBICIÓN TOTAL DE NOMBRES Y FASES GENÉRICAS:
   - Queda ESTRICTAMENTE PROHIBIDO nombrar hitos o tareas con comodines abstractos como:
     "Fase 1", "Fase 2", "Planificación", "Análisis preliminar", "Reunión de alineamiento", "Documentación inicial", "Desarrollo", "Testing", "Cierre del proyecto", "Seguimiento", "Revisión general".
   - Cada Hito DEBE ser un entregable tangible o avance físico/técnico concreto de nicho para '${contexto.nombreProyecto}'.

2. MANDATO DE RECURSOS Y PROVEEDORES REALES (NAMED GROUNDING MULTI-INDUSTRIA):
   - Si el usuario proporciona recursos, materiales, herramientas o proveedores en 'Recursos Clave', ES OBLIGATORIO que los nombres propios exactos aparezcan citados en los Hitos, en las Tareas y en los Gastos.
   - Si el usuario NO proporcionó recursos (o indicó ninguno), DEBES proponer insumos, marcas, especialistas o entidades líderes de la industria con sus nombres concretos:
     * Obras / Hogar: "Cemento tipo I (Sol/Andino)", "Fierro corrugado 1/2 pulgada", "Maestro de obra y peón", "Licencia de edificación municipal", "Ferretería mayorista".
     * Salud / Cirugía: "Clínica acreditada", "Cirujano especialista", "Exámenes de riesgo quirúrgico y laboratorio", "Faja postoperatoria y medicación".
     * Inversiones / Terrenos: "Estudio de títulos en Registros Públicos (SUNARP)", "Tasador registrado", "Notaría pública para minuta y escritura", "Minuta bancaria".
     * Negocio / Comercio: "Proveedor mayorista de mercadería", "Embalaje y couriers (Olva/DHL)", "Trámite de RUC / licencia comercial", "Caja y POS".
     * TI / Software: "Next.js", "Supabase / PostgreSQL", "Pasarela Stripe / Culqi", "Hosting Vercel", "Dominio .com y SSL".

3. ADAPTACIÓN AL ESTADO DE PARTIDA:
   - Si el estado es "Cero Absoluto (Greenfield)": la ruta inicia desde la viabilidad, trámites iniciales, compras/cotizaciones y preparación del terreno/entorno.
   - Si el estado es "Base / Prototipo Existente": PROHIBIDO hacer investigación básica desde cero; el primer hito debe ser "Inspección y Diagnóstico de la Base Existente, Corrección de Desviaciones y Plan de Ampliación".
   - Si el estado es "Migración / Refactorización": los hitos se enfocan en "Mapeo de Datos/Estructuras Previas, Desmontaje/Transición y Adecuación Nueva".
   - Si el estado es "Escalado / Lanzamiento": los hitos se enfocan en "Acabados Finales, Pruebas Integrales de Funcionamiento, Puesta en Marcha y Entrega".

4. TAREAS TÁCTICAS DE CAMPO:
   - Redacta tareas con verbos de acción táctica ejecutables en la vida real:
     * Cotizaciones y diligencias: "Cotizar 3 proveedores de X", "Tramitar permiso en Y", "Verificar partida registral en notaría".
     * Adquisición y logística: "Comprar materiales A y B", "Adquirir suscripción Pro de C", "Contratar flete para traslado".
     * Ejecución material o técnica: "Estructurar encofrado y vaciado de zapatas", "Modelar tablas en base de datos con políticas RLS", "Realizar consulta médica preoperatoria".
     * Control y validación: "Inspeccionar plomo y nivelación de muros", "Ejecutar pruebas transaccionales en sandbox", "Control postoperatorio con especialista".
   - Duraciones realistas en bloques de 2h a 12h por tarea individual.

5. COSTOS Y GASTOS REALES VINCULADOS:
   - Cada gasto debe tener un nombre de ítem real (ej. "Bolsas de cemento y fierro de construcción", "Honorarios de cirujano y clínica", "Arancel de notaría y derechos registrales", "Suscripción Supabase Pro (1er mes)").
   - 'tareaAsociada' DEBE coincidir con el nombre exacto de la tarea a la que asiste dicho gasto.

6. IDENTIFICACIÓN DETERMINISTA DEL MAV (MÍNIMO ALCANCE VIABLE):
   - Cada Hito y cada Tarea DEBE incluir el flag booleano 'esMav'.
   - Marca 'esMav: true' en los hitos y tareas iniciales que componen el Núcleo Crítico e Indispensable para validar o completar la primera entrega funcional esencial.
   - Marca 'esMav: false' en tareas de acabados estéticos, optimizaciones complementarias o mejoras no bloqueantes.
   - Al menos el 60% de las tareas de los primeros 2 hitos deben ser 'esMav: true'.

================================================================================
EJEMPLOS CONTRASTIVOS DE CALIDAD
================================================================================
❌ MAL (GENÉRICO / RECHAZADO):
  Hito: "Planificación y Requerimientos"
  Tarea: "Reunión de alineamiento con el equipo" (4h)
  Tarea: "Documentación inicial de requerimientos" (6h)
  Gasto: "Gastos varios del proyecto" ($150)

✅ BIEN (OBRA CIVIL / EJECUTOR CON CONTRATISTAS):
  Hito: "Expediente Municipal, Cimentación y Levantamiento de Muros para Primer Piso"
  Tarea: "Gestionar licencia de edificación y memoria descriptiva en municipalidad distrital" (8h, esMav: true)
  Tarea: "Cotizar y contratar maestro de obra para excavación, zapatas y levantamiento de columnas" (6h, esMav: true)
  Tarea: "Comprar 50 bolsas de cemento Portland y fierro corrugado en ferretería mayorista" (4h, esMav: true)
  Gasto: "Compra de cemento Portland y varillas de fierro corrugado" (S/ 2,400.00) -> tareaAsociada: "Comprar 50 bolsas de cemento Portland..."

✅ BIEN (DIGITAL / EJECUTOR DIRECTO):
  Hito: "Arquitectura Base y Entorno Transaccional en Supabase & Stripe"
  Tarea: "Modelar esquema SQL relacional en Supabase con políticas RLS para productos y órdenes" (6h, esMav: true)
  Tarea: "Configurar sandbox de Stripe, registrar productos y simular webhooks de checkout exitoso" (5h, esMav: true)
  Gasto: "Suscripción Supabase Pro (1er mes)" ($25.00) -> tareaAsociada: "Modelar esquema SQL relacional en Supabase..."`;

      const pTopeUsuario = parseFloat(contexto.presupuestoTope) || 0;
      const tieneFechaFin = !!(contexto.fechaFinPlan && String(contexto.fechaFinPlan).trim());

      const promptContextual = `DATOS DE ENTRADA DEL PROYECTO (CONTEXTO OPERATIVO REAL):
- Nombre del Proyecto: "${contexto.nombreProyecto || "Iniciativa Estratégica"}"
- Entregable Final Tangible (¿Qué existirá el último día?): "${contexto.entregableTangible || "No especificado explícitamente"}"
- Estado Actual de Partida: "${contexto.estadoPartida || "Cero Absoluto (Greenfield)"}"
- Modalidad o Rol del Ejecutor: "${contexto.perfilEjecutor || "Ejecutor Directo"}"
- Recursos, Proveedores o Materiales Clave: "${contexto.stackTecnologico || "No especificado; inferir insumos, especialistas o herramientas líderes con nombres propios"}"
- Restricciones Críticas, Trámites y Cuellos de Botella: "${contexto.restricciones || "Ninguna restricción externa reportada"}"
- Alcance / Descripción Detallada: "${contexto.descripcion || "Implementación de solución integral"}"
- Categoría / Tipo de Iniciativa: "${contexto.tipoIniciativa || "Profesional"}"
- Metodología Solicitada: "${contexto.metodologiaSugerida || "Auto / Inferir con IA"}"
- Presupuesto Tope: ${pTopeUsuario > 0 ? (pTopeUsuario + " " + (contexto.monedaBase || "PEN")) : "No definido (AUTOCALCULAR Y ESTIMAR COSTOS REALES CON IA)"}
- Fecha Inicio: ${contexto.fechaInicioPlan || "Inmediata"}
- Fecha Fin: ${tieneFechaFin ? contexto.fechaFinPlan : "No definida (PROYECTAR SEGÚN ESFUERZO REAL DE LA MODALIDAD)"}
- Moneda Base: "${contexto.monedaBase || "PEN"}"

DIRECTIVAS ESPECÍFICAS DE GENERACIÓN:
1. Diseña de 4 a 6 Hitos progresivos sin nombres genéricos, adaptados rigurosamente al Estado de Partida ("${contexto.estadoPartida || "Cero Absoluto"}") y a la industria de '${contexto.nombreProyecto}'.
2. Si se indicaron recursos o proveedores ("${contexto.stackTecnologico || ""}"), menciónalos textualmente en los Hitos, Tareas y Gastos. Si no se indicaron, infiere proveedores, materiales o especialistas reales con nombres comerciales o técnicos específicos.
3. Para cada Hito, genera de 3 a 5 Tareas de acción táctica y de campo adaptadas a la Modalidad ("${contexto.perfilEjecutor || "Ejecutor Directo"}").
4. Genera de 3 a 6 Gastos proyectados con nombres de ítems y partidas reales vinculados a sus tareas mediante 'tareaAsociada'.
5. Asigna el flag 'esMav: true' a los hitos y tareas que representen el núcleo crítico e indispensable del proyecto.`;

      const payload = {
        system_instruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents: [{
          parts: [{ text: promptContextual }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: schema,
          temperature: 0.2
        }
      };

      const options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() !== 200) {
        throw new Error(`API Gemini respondió HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
      }

      const result = JSON.parse(response.getContentText());
      const dataRaw = JSON.parse(result.candidates[0].content.parts[0].text);

      // Calcular fechas concretas basadas en fechaInicioPlan y diasRelativosFin
      const fIniStr = contexto.fechaInicioPlan || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
      const dIni = new Date(fIniStr);

      let totalDiasProyecto = 60;
      if (tieneFechaFin) {
        const dFin = new Date(contexto.fechaFinPlan);
        const diffMs = dFin.getTime() - dIni.getTime();
        if (diffMs > 0) {
          totalDiasProyecto = Math.max(7, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        }
      } else {
        // Inferencia automática de fecha fin según esfuerzo solopreneur
        let maxDiasHitos = 0;
        let sumHoras = 0;
        if (Array.isArray(dataRaw.hitos)) {
          dataRaw.hitos.forEach(h => {
            if (h.diasRelativosFin && h.diasRelativosFin > maxDiasHitos) maxDiasHitos = h.diasRelativosFin;
            (h.tareas || []).forEach(t => { sumHoras += (parseFloat(t.horasEstimadas) || 4); });
          });
        }
        if (dataRaw.diasTotalesEstimados && dataRaw.diasTotalesEstimados >= 14) {
          totalDiasProyecto = dataRaw.diasTotalesEstimados;
        } else if (maxDiasHitos >= 14) {
          totalDiasProyecto = maxDiasHitos;
        } else if (sumHoras > 0) {
          // Solopreneur: ~20h semanales de dedicación -> semanas = sumHoras / 20
          totalDiasProyecto = Math.max(14, Math.round((sumHoras / 20) * 7));
        } else {
          totalDiasProyecto = 45;
        }
        const dFinCalculada = new Date(dIni);
        dFinCalculada.setDate(dFinCalculada.getDate() + totalDiasProyecto);
        dataRaw.fechaFinPlan = Utilities.formatDate(dFinCalculada, CONFIG.TIMEZONE, "yyyy-MM-dd");
      }

      if (Array.isArray(dataRaw.hitos)) {
        const numHitos = dataRaw.hitos.length || 1;
        dataRaw.hitos.forEach((h, idx) => {
          if (h.esMav === undefined) {
            h.esMav = (idx < 2);
          }
          if (!h.fechaLimite) {
            let diasOffset = h.diasRelativosFin;
            if (!diasOffset || diasOffset <= 0 || diasOffset > totalDiasProyecto) {
              diasOffset = Math.round((totalDiasProyecto / numHitos) * (idx + 1));
            }
            const dHito = new Date(dIni);
            dHito.setDate(dHito.getDate() + diasOffset);
            h.fechaLimite = Utilities.formatDate(dHito, CONFIG.TIMEZONE, "yyyy-MM-dd");
          }
          if (Array.isArray(h.tareas)) {
            h.tareas.forEach((t, tIdx) => {
              if (!t.fechaProgramada) {
                t.fechaProgramada = h.fechaLimite;
              }
              if (t.esMav === undefined) {
                t.esMav = (h.esMav === true || (idx < 2 && tIdx === 0));
              }
            });
          }
        });
      }

      // Validar y consolidar presupuesto
      const pTopeVal = parseFloat(contexto.presupuestoTope) || 0;
      if (pTopeVal > 0 && Array.isArray(dataRaw.gastos) && dataRaw.gastos.length > 0) {
        // El usuario especificó presupuesto tope: distribuir equilibradamente
        let sumaGastos = dataRaw.gastos.reduce((acc, g) => acc + (parseFloat(g.montoEstimado) || 0), 0);
        if (sumaGastos <= 0 || sumaGastos > (pTopeVal * 1.3)) {
          const factor = pTopeVal / (sumaGastos || 1);
          dataRaw.gastos.forEach(g => {
            g.montoEstimado = Math.round((parseFloat(g.montoEstimado) || (pTopeVal / dataRaw.gastos.length)) * factor);
            g.moneda = contexto.monedaBase || "PEN";
          });
        }
        dataRaw.presupuestoTope = pTopeVal;
      } else {
        // El usuario dejó en blanco: inferir y consolidar suma de partidas estimadas
        let sumaGastos = (dataRaw.gastos || []).reduce((acc, g) => acc + (parseFloat(g.montoEstimado) || 0), 0);
        if (sumaGastos <= 0) {
          sumaGastos = dataRaw.presupuestoCalculado || 3500;
        }
        dataRaw.presupuestoTope = Math.round(sumaGastos * 100) / 100;
      }

      // Sincronizar metodología inferida
      dataRaw.metodologiaSugerida = dataRaw.metodologiaOptima || (contexto.metodologiaSugerida && contexto.metodologiaSugerida !== "Auto" ? contexto.metodologiaSugerida : "Scrum / Ágil");

      // Sincronizar arquetipo y magnitud sugeridos
      if (!dataRaw.arquetipoSugerido) {
        dataRaw.arquetipoSugerido = "1_Infraestructura";
      }
      if (!dataRaw.magnitudSugerida) {
        dataRaw.magnitudSugerida = "Medium";
      }
      if (!dataRaw.justificacionClasificacion) {
        dataRaw.justificacionClasificacion = `Clasificado heurísticamente como ${dataRaw.arquetipoSugerido} (${dataRaw.magnitudSugerida}) por características del proyecto.`;
      }

      // Dimensiones contextuales enriquecidas
      dataRaw.estadoPartida = contexto.estadoPartida || "Cero Absoluto (Greenfield)";
      dataRaw.perfilEjecutor = contexto.perfilEjecutor || "Ejecutor Directo";
      dataRaw.stackTecnologico = contexto.stackTecnologico || "";
      dataRaw.restricciones = contexto.restricciones || "";
      if (!dataRaw.entregableTangible && contexto.entregableTangible) {
        dataRaw.entregableTangible = contexto.entregableTangible;
      }

      return {
        success: true,
        data: dataRaw
      };

    } catch (err) {
      Logger.log("[Gemini WBS Error - Activando Fallback Heurístico]: " + err.message);
      return this.generarWbsFallbackHeuristico(contexto);
    }
  },

  /**
   * 1.4. Generador Heurístico de Alta Fidelidad para WBS (Fallback Contextual Multi-Industria)
   * Produce 4 a 5 hitos con tareas de compras, cotizaciones y validaciones técnicas de campo
   */
  generarWbsFallbackHeuristico: function(contexto) {
    contexto = contexto || {};
    const nom = String(contexto.nombreProyecto || "Iniciativa Estratégica").trim();
    const desc = String(contexto.descripcion || "").toLowerCase();
    const tipo = String(contexto.tipoIniciativa || "Profesional");
    const moneda = contexto.monedaBase || "PEN";
    
    const pTopeIngresado = parseFloat(contexto.presupuestoTope) || 0;
    const esAutoPresupuesto = pTopeIngresado <= 0;
    let pTope = esAutoPresupuesto ? 4500 : pTopeIngresado;

    const fIniStr = contexto.fechaInicioPlan || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    const dIni = new Date(fIniStr);

    let totalDias = 60;
    const tieneFechaFin = !!(contexto.fechaFinPlan && String(contexto.fechaFinPlan).trim());
    if (tieneFechaFin) {
      const dFin = new Date(contexto.fechaFinPlan);
      const diffMs = dFin.getTime() - dIni.getTime();
      if (diffMs > 0) {
        totalDias = Math.max(7, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
    } else {
      totalDias = 50; // Proyección base (~7 semanas)
    }

    const addDias = (dias) => {
      const d = new Date(dIni);
      d.setDate(d.getDate() + Math.min(dias, totalDias));
      return Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd");
    };

    // Detección de dominio contextual a partir de nombre, descripción y tipo (Universal Multi-Industria)
    const isCivil = /construc|obra|piso|casa|edific|remodela|arquitect|albanil|cemento|fierro|terreno|acabados|pintura|gasfiter|electric|techado|muros|zapatas/i.test(desc + " " + nom.toLowerCase()) || tipo.includes("Construcción") || tipo.includes("Hogar");
    const isSalud = /salud|cirug|medico|medica|clinica|terapia|tratamiento|nutric|dental|estet|paciente|hospital|operacion|preoperatorio|rinoplastia|lipo/i.test(desc + " " + nom.toLowerCase()) || tipo.includes("Salud");
    const isFinanzas = /finanza|invers|patrimonio|terreno|comprar.*propiedad|comprar.*inmueble|hipotec|banco|credito|tasacion|fondo|acciones|bienes.*raices/i.test(desc + " " + nom.toLowerCase()) || tipo.includes("Inversiones") || tipo.includes("Finanzas");
    const isEcom = /e-?commerce|tienda|ventas?|b2b|b2c|pagos?|checkout|stripe|pasarela|pedidos?|catalogo/i.test(desc + " " + nom.toLowerCase());
    const isDev = isEcom || /web|software|app|sistema|plataforma|api|frontend|backend|fullstack|portal/i.test(desc + " " + nom.toLowerCase()) || tipo.includes("Web");
    const isInfra = /infraestructura|servidor|cloud|aws|gcp|azure|redes|seguridad|devops|docker|kubernetes/i.test(desc + " " + nom.toLowerCase()) || tipo.includes("Infraestructura");
    const isMarketing = /marketing|campaña|leads|adquisicion|pauta|branding|redes|seo|conversion/i.test(desc + " " + nom.toLowerCase()) || tipo.includes("Marketing");

    // Extracción y resolución de Recursos, Proveedores o Materiales Clave
    const stackRaw = String(contexto.stackTecnologico || "").trim();
    const stackItems = stackRaw ? stackRaw.split(/[,|\/]+/).map(s => s.trim()).filter(Boolean) : [];
    const tech1 = stackItems[0] || (isCivil ? "Maestro de Obra y Cuadrilla" : isSalud ? "Cirujano / Especialista Tratante" : isFinanzas ? "Notaría & Registros Públicos (SUNARP)" : isEcom ? "Plataforma E-commerce (Shopify/Next.js)" : isDev ? "Stack Web (Next.js/React)" : isInfra ? "Infraestructura Cloud (AWS/GCP)" : "Suite Profesional");
    const tech2 = stackItems[1] || (isCivil ? "Materiales de Construcción (Cemento/Fierro)" : isSalud ? "Clínica & Sala Quirúrgica" : isFinanzas ? "Entidad Bancaria / Crédito Hipotecario" : isEcom ? "Pasarela de Pago (Stripe/Culqi)" : isDev ? "Base de Datos & Auth (Supabase/PostgreSQL)" : isInfra ? "Docker & CI/CD" : "Herramientas de Productividad");
    const tech3 = stackItems[2] || (isCivil ? "Licencia Municipal & Planos" : isSalud ? "Exámenes Preoperatorios & Medicación" : isFinanzas ? "Perito Tasador y Asesoría Legal" : isEcom ? "Courier / Logística" : isDev ? "Hosting Cloud (Vercel)" : isInfra ? "Seguridad & Redes" : "Plataforma de Clientes");

    const estadoPartida = String(contexto.estadoPartida || "Cero Absoluto (Greenfield)");
    const perfilEjecutor = String(contexto.perfilEjecutor || "Ejecutor Directo");
    const stackTecnologico = stackRaw;
    const entregableTangible = String(contexto.entregableTangible || "").trim() || `${nom} completamente funcional con flujo validado y evidencias en Drive`;
    const restricciones = String(contexto.restricciones || "").trim();

    let hitos = [];
    let gastos = [];
    let metOptima = "Scrum / Ágil";

    if (isCivil) {
      metOptima = "Cascada / Tradicional (PMBOK)";
      if (esAutoPresupuesto) pTope = 14500;

      const hito1Nom = estadoPartida.includes("Base") || estadoPartida.includes("Prototipo")
        ? `Inspección de Estructura Existente, Replanteo y Memoria de Ampliación de ${nom}`
        : (estadoPartida.includes("Migración") || estadoPartida.includes("Refactorización")
          ? `Desmontaje, Demolición Controlada y Adecuación de Terreno para ${nom}`
          : `Expediente Técnico, Planos de Arquitectura y Licencia Municipal para ${nom}`);

      hitos = [
        {
          nombreHito: hito1Nom,
          faseAsociada: "Iniciacion",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.15)),
          criterioAceptacion: "Planos validados, memoria descriptiva aprobada y trámite municipal o viabilidad técnica ingresada.",
          esMav: true,
          tareas: [
            { nombreTarea: `Elaborar planos de arquitectura, estructuras e instalaciones con especialista`, prioridad: "01_P1_Alta", horasEstimadas: 10, fechaProgramada: addDias(Math.round(totalDias * 0.08)), esMav: true },
            { nombreTarea: `Gestionar trámite de licencia de edificación o permiso en municipalidad distrital`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.12)), esMav: true },
            { nombreTarea: `Cotizar y seleccionar cuadrilla con ${tech1} para inicio de faenas`, prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.15)), esMav: true }
          ]
        },
        {
          nombreHito: `Cotizaciones, Aprovisionamiento de Materiales y Logística con ${tech2}`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: "Materiales estructurales en predio, punto provisional de agua y energía activos.",
          esMav: true,
          tareas: [
            { nombreTarea: `Cotizar cemento, fierro corrugado, arena y ladrillo en 3 ferreterías mayoristas`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.22)), esMav: true },
            { nombreTarea: `Adquirir lote inicial de materiales estructurales y contratar flete a obra`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.28)), esMav: true },
            { nombreTarea: "Acondicionar almacén techado seguro para cemento y punto provisional de agua", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.34)), esMav: true }
          ]
        },
        {
          nombreHito: `Ejecución de Obra: Cimentación, Columnas y Levantamiento de Muros`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.35,
          fechaLimite: addDias(Math.round(totalDias * 0.70)),
          criterioAceptacion: "Columnas vaciadas, muros levantados a plomo y estructura principal armada.",
          esMav: true,
          tareas: [
            { nombreTarea: "Excavar zanjas, colocar armaduras de fierro y vaciar zapatas y cimientos", prioridad: "01_P1_Alta", horasEstimadas: 24, fechaProgramada: addDias(Math.round(totalDias * 0.45)), esMav: true },
            { nombreTarea: "Encofrar y vaciar columnas estructurales respetando tiempo de fraguado", prioridad: "01_P1_Alta", horasEstimadas: 18, fechaProgramada: addDias(Math.round(totalDias * 0.58)), esMav: true },
            { nombreTarea: "Levantar muros de ladrillo asentados con mortero según planos técnicos", prioridad: "01_P1_Alta", horasEstimadas: 20, fechaProgramada: addDias(Math.round(totalDias * 0.67)), esMav: true }
          ]
        },
        {
          nombreHito: `Instalaciones Básicas de Redes y Control de Calidad Estructural`,
          faseAsociada: "Control",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Tuberías empotradas y probadas contra fugas; plomo y nivelación verificados.",
          esMav: false,
          tareas: [
            { nombreTarea: "Empotrar montantes y tuberías de agua y desagüe con pruebas de estanqueidad", prioridad: "01_P1_Alta", horasEstimadas: 10, fechaProgramada: addDias(Math.round(totalDias * 0.75)), esMav: true },
            { nombreTarea: "Canalizar tuberías corrugadas para cableado eléctrico y cajas de paso", prioridad: "02_P2_Media", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.80)), esMav: false },
            { nombreTarea: "Inspeccionar verticalidad de muros, fraguado y retiro de desmonte a botadero", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.84)), esMav: false }
          ]
        },
        {
          nombreHito: `Acabados Primarios, Liquidación de Mano de Obra y Entrega de ${nom}`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Espacio limpio, tarrajeo o remates concluidos, liquidación firmada con maestro.",
          esMav: false,
          tareas: [
            { nombreTarea: "Tarrajear muros principales y perfilar mochetas de puertas y ventanas", prioridad: "01_P1_Alta", horasEstimadas: 14, fechaProgramada: addDias(Math.round(totalDias * 0.90)), esMav: false },
            { nombreTarea: `Liquidar honorarios y jornales con ${tech1} contra acta de entrega`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.95)), esMav: true },
            { nombreTarea: "Consolidar recibos de compra, fotos de avance y archivar expediente en Drive", prioridad: "03_P3_Baja", horasEstimadas: 4, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias), esMav: false }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: `Compra de cemento Portland, fierro corrugado, arena y agregados`, categoriaGasto: "Materiales", montoEstimado: Math.round(pTope * 0.50), moneda: moneda, tareaAsociada: `Adquirir lote inicial de materiales estructurales y contratar flete a obra` },
        { descripcionGasto: `Mano de obra y jornales de cuadrilla con ${tech1}`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.30), moneda: moneda, tareaAsociada: "Excavar zanjas, colocar armaduras de fierro y vaciar zapatas y cimientos" },
        { descripcionGasto: `Derechos de licencia municipal de edificación y planos técnicos`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.10), moneda: moneda, tareaAsociada: `Gestionar trámite de licencia de edificación o permiso en municipalidad distrital` },
        { descripcionGasto: "Fondo de contingencia para fletes e imprevistos menores de obra", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.10), moneda: moneda, tareaAsociada: "Inspeccionar verticalidad de muros, fraguado y retiro de desmonte a botadero" }
      ];

    } else if (isSalud) {
      metOptima = "Predictiva / Secuencial Clínica";
      if (esAutoPresupuesto) pTope = 8500;

      hitos = [
        {
          nombreHito: `Evaluación Médica, Diagnóstico y Exámenes Preoperatorios para ${nom}`,
          faseAsociada: "Iniciacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.20)),
          criterioAceptacion: "Apto quirúrgico emitido por cardiólogo y cirujano especialista con analíticas completas.",
          esMav: true,
          tareas: [
            { nombreTarea: `Consulta de valoración médica con ${tech1} para plan de intervención`, prioridad: "01_P1_Alta", horasEstimadas: 3, fechaProgramada: addDias(Math.round(totalDias * 0.08)), esMav: true },
            { nombreTarea: `Realizar perfil preoperatorio completo de sangre, coagulación y riesgo cardiológico`, prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.14)), esMav: true },
            { nombreTarea: "Firmar consentimiento informado médico y aclarar pautas del protocolo anestésico", prioridad: "02_P2_Media", horasEstimadas: 2, fechaProgramada: addDias(Math.round(totalDias * 0.20)), esMav: true }
          ]
        },
        {
          nombreHito: `Reserva Quirúrgica, Logística Hospitalaria y Adquisición de Insumos`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: `Sala de operaciones reservada en ${tech2} y medicación postoperatoria adquirida.`,
          esMav: true,
          tareas: [
            { nombreTarea: `Programar fecha quirúrgica y separar sala de operaciones en ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 3, fechaProgramada: addDias(Math.round(totalDias * 0.25)), esMav: true },
            { nombreTarea: `Comprar faja postquirúrgica médica a medida y kit farmacológico de recuperación`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.30)), esMav: true },
            { nombreTarea: "Coordinar transporte asistido, acompañante responsable y ambiente de reposo", prioridad: "02_P2_Media", horasEstimadas: 3, fechaProgramada: addDias(Math.round(totalDias * 0.35)), esMav: true }
          ]
        },
        {
          nombreHito: `Procedimiento Quirúrgico y Atención Hospitalaria Inmediata`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.30,
          fechaLimite: addDias(Math.round(totalDias * 0.60)),
          criterioAceptacion: "Procedimiento culminado sin complicaciones y alta clínica con signos estables.",
          esMav: true,
          tareas: [
            { nombreTarea: `Internamiento hospitalario cumpliendo ayuno estricto y asepsia previa`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.45)), esMav: true },
            { nombreTarea: `Ejecución de la intervención por ${tech1} y equipo de anestesiología`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.50)), esMav: true },
            { nombreTarea: "Monitoreo en sala de recuperación post-anestésica y alta médica provisional", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.58)), esMav: true }
          ]
        },
        {
          nombreHito: `Controles Postoperatorios, Curaciones y Terapias de Recuperación`,
          faseAsociada: "Control",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Cicatrización adecuada, controles médicos asistidos y drenajes completados.",
          esMav: true,
          tareas: [
            { nombreTarea: "Asistir a primera curación médica y revisión de apósitos en consultorio", prioridad: "01_P1_Alta", horasEstimadas: 3, fechaProgramada: addDias(Math.round(totalDias * 0.68)), esMav: true },
            { nombreTarea: "Realizar sesiones de drenaje linfático manual y ultrasonido terapéutico", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.76)), esMav: true },
            { nombreTarea: "Monitorear evolución de edemas, adherencia al tratamiento farmacológico y dieta", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.83)), esMav: true }
          ]
        },
        {
          nombreHito: `Alta Médica Definitiva, Retiro de Puntos y Cierre de Tratamiento`,
          faseAsociada: "Cierre",
          pesoPct: 0.10,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Alta médica definitiva por especialista y reinicio progresivo de actividades.",
          esMav: false,
          tareas: [
            { nombreTarea: `Consulta de alta definitiva con ${tech1} y retiro final de puntos/suturas`, prioridad: "01_P1_Alta", horasEstimadas: 2, fechaProgramada: addDias(Math.round(totalDias * 0.90)), esMav: true },
            { nombreTarea: "Reincorporación progresiva a la rutina laboral y actividad física suave", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.95)), esMav: false },
            { nombreTarea: "Archivar informe quirúrgico, recetas e imágenes de evolución en Drive", prioridad: "03_P3_Baja", horasEstimadas: 2, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias), esMav: false }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: `Honorarios médicos de ${tech1} y equipo quirúrgico`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.50), moneda: moneda, tareaAsociada: `Ejecución de la intervención por ${tech1} y equipo de anestesiología` },
        { descripcionGasto: `Derecho de sala de operaciones, estancia y medicación en ${tech2}`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.30), moneda: moneda, tareaAsociada: `Programar fecha quirúrgica y separar sala de operaciones en ${tech2}` },
        { descripcionGasto: `Faja médica especializada, medicamentos postquirúrgicos e insumos`, categoriaGasto: "Materiales", montoEstimado: Math.round(pTope * 0.12), moneda: moneda, tareaAsociada: `Comprar faja postquirúrgica médica a medida y kit farmacológico de recuperación` },
        { descripcionGasto: "Fondo de contingencia médica para exámenes o medicamentos adicionales", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.08), moneda: moneda, tareaAsociada: "Realizar sesiones de drenaje linfático manual y ultrasonido terapéutico" }
      ];

    } else if (isFinanzas) {
      metOptima = "Secuencial Legal / Diligencia Debida";
      if (esAutoPresupuesto) pTope = 6500;

      hitos = [
        {
          nombreHito: `Búsqueda, Selección y Estudio de Títulos en ${tech1}`,
          faseAsociada: "Iniciacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.20)),
          criterioAceptacion: "Partida registral sin cargas ocultas y estudio de títulos con informe favorable.",
          esMav: true,
          tareas: [
            { nombreTarea: `Inspeccionar físicamente el inmueble o terreno y verificar linderos in situ`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.08)), esMav: true },
            { nombreTarea: `Solicitar Copia Literal y Certificado Registral Inmobiliario (CRI) en SUNARP`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.14)), esMav: true },
            { nombreTarea: "Analizar tracto sucesivo y antecedentes legales con abogado o notaría", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.20)), esMav: true }
          ]
        },
        {
          nombreHito: `Tasación Pericial, Negociación y Calificación en ${tech2}`,
          faseAsociada: "Planificacion",
          pesoPct: 0.25,
          fechaLimite: addDias(Math.round(totalDias * 0.40)),
          criterioAceptacion: "Informe de tasación pericial listo, carta de crédito bancario aprobada y contrato de arras.",
          esMav: true,
          tareas: [
            { nombreTarea: `Contratar peritaje de tasación técnica para validar valor comercial real`, prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.26)), esMav: true },
            { nombreTarea: `Gestionar aprobación de crédito hipotecario o certificar fondos bancarios en ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.33)), esMav: true },
            { nombreTarea: "Suscribir contrato de arras confirmatorias ante notario para asegurar el precio", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.40)), esMav: true }
          ]
        },
        {
          nombreHito: `Minuta de Compraventa, Pago Seguro y Escritura Pública`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.25,
          fechaLimite: addDias(Math.round(totalDias * 0.65)),
          criterioAceptacion: "Minuta firmada por las partes, precio liquidado con cheque no negociable y escritura suscrita.",
          esMav: true,
          tareas: [
            { nombreTarea: "Redactar minuta de compraventa con cláusulas de saneamiento por evicción", prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.48)), esMav: true },
            { nombreTarea: "Emitir cheque de gerencia no negociable para liquidación de pago ante notario", prioridad: "01_P1_Alta", horasEstimadas: 3, fechaProgramada: addDias(Math.round(totalDias * 0.55)), esMav: true },
            { nombreTarea: "Firmar escritura pública en notaría y liquidar impuesto de Alcabala distrital", prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.63)), esMav: true }
          ]
        },
        {
          nombreHito: `Inscripción Registral en SUNARP y Toma de Posesión Física`,
          faseAsociada: "Control",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Título inscrito a favor del comprador en registros públicos y llaves recibidas.",
          esMav: true,
          tareas: [
            { nombreTarea: "Ingresar parte notarial a SUNARP y realizar seguimiento de calificación registral", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.72)), esMav: true },
            { nombreTarea: "Recibir posesión física del predio con acta de entrega e inventario de linderos", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.78)), esMav: true },
            { nombreTarea: "Comprobar emisión del asiento de inscripción definitiva a nombre del nuevo titular", prioridad: "01_P1_Alta", horasEstimadas: 3, fechaProgramada: addDias(Math.round(totalDias * 0.84)), esMav: true }
          ]
        },
        {
          nombreHito: `Declaración Jurada de Autoavalúo Municipal y Resguardo en Drive`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Código de contribuyente municipal actualizado y documentación archivada.",
          esMav: false,
          tareas: [
            { nombreTarea: "Inscribir el predio a nombre del nuevo propietario en la municipalidad distrital", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.90)), esMav: true },
            { nombreTarea: "Actualizar titularidad de suministros públicos (luz y agua) ante las empresas de servicio", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.95)), esMav: false },
            { nombreTarea: "Escanear y archivar testimonio notarial, planos y comprobantes en carpeta de Drive", prioridad: "03_P3_Baja", horasEstimadas: 3, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias), esMav: false }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: `Derechos notariales por elevación a escritura pública de compraventa`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.45), moneda: moneda, tareaAsociada: "Firmar escritura pública en notaría y liquidar impuesto de Alcabala distrital" },
        { descripcionGasto: `Tasa registral de calificación e inscripción de compraventa en SUNARP`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.25), moneda: moneda, tareaAsociada: "Ingresar parte notarial a SUNARP y realizar seguimiento de calificación registral" },
        { descripcionGasto: `Honorarios de tasador pericial y asesoría legal para estudio de títulos`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: `Contratar peritaje de tasación técnica para validar valor comercial real` },
        { descripcionGasto: "Trámites administrativos, copias literales, certificados CRI y legalizaciones", categoriaGasto: "Materiales", montoEstimado: Math.round(pTope * 0.10), moneda: moneda, tareaAsociada: `Solicitar Copia Literal y Certificado Registral Inmobiliario (CRI) en SUNARP` }
      ];

    } else if (isEcom) {
      metOptima = "Scrum / Ágil";
      if (esAutoPresupuesto) pTope = 4800;

      const hito1Nom = estadoPartida.includes("Base") || estadoPartida.includes("Prototipo")
        ? `Auditoría y Diagnóstico de Catálogo/Tienda Existente de ${nom}`
        : (estadoPartida.includes("Migración")
          ? `Mapeo de Productos y Especificación de Migración hacia ${tech1}`
          : `Investigación, Viabilidad y Modelo Transaccional de ${nom}`);

      hitos = [
        {
          nombreHito: hito1Nom,
          faseAsociada: "Iniciacion",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.15)),
          criterioAceptacion: "Definición de catálogo, benchmark de pasarelas de pago y matriz de comisiones aprobada.",
          tareas: [
            { nombreTarea: `Investigar y comparar comisiones de pasarelas en ${tech2} y alternativas`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
            { nombreTarea: "Modelar estructura de catálogo de productos, categorías, atributos y variantes", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
            { nombreTarea: `Definir políticas de despacho con operadores logísticos (${tech3}) e impuestos`, prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
          ]
        },
        {
          nombreHito: `Cotizaciones, Adquisición de Licencias y Preparación de ${tech1}`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: `Dominio registrado, hosting cloud y ambiente sandbox en ${tech2} activos.`,
          tareas: [
            { nombreTarea: `Cotizar y contratar plan de hosting o suscripción para ${tech1}`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.22)) },
            { nombreTarea: `Configurar cuenta y llaves de prueba en ambiente Sandbox de ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.28)) },
            { nombreTarea: "Adquirir o licenciar plantilla UI optimizada para conversión móvil", prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.34)) }
          ]
        },
        {
          nombreHito: `Construcción de Tienda, Catálogo e Integración de Checkout ${tech2}`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.30,
          fechaLimite: addDias(Math.round(totalDias * 0.65)),
          criterioAceptacion: "Flujo de compra completo desde navegación de catálogo hasta generación de orden operativo.",
          tareas: [
            { nombreTarea: `Maquetar catálogo interactivo en ${tech1} con buscador rápido y filtros`, prioridad: "01_P1_Alta", horasEstimadas: 14, fechaProgramada: addDias(Math.round(totalDias * 0.45)) },
            { nombreTarea: `Implementar flujo de Checkout transaccional conectado a ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 12, fechaProgramada: addDias(Math.round(totalDias * 0.55)) },
            { nombreTarea: "Conectar webhooks de confirmación de pago y emisión de comprobantes", prioridad: "01_P1_Alta", horasEstimadas: 10, fechaProgramada: addDias(Math.round(totalDias * 0.62)) }
          ]
        },
        {
          nombreHito: `Validación de Campo, Pruebas de Estrés y Seguridad QA en ${nom}`,
          faseAsociada: "Control",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Transacciones de prueba exitosas con tarjetas reales, tests móviles y auditoría de carga.",
          tareas: [
            { nombreTarea: `Ejecutar pruebas transaccionales completas con tarjetas de prueba en ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.72)) },
            { nombreTarea: "Auditar rendimiento móvil y Core Web Vitals para optimizar velocidad", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.78)) },
            { nombreTarea: "Probar recuperación ante errores de pago, carritos abandonados y caídas de red", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.84)) }
          ]
        },
        {
          nombreHito: `Lanzamiento Oficial, Monitoreo Operativo y Cierre de ${nom}`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Tienda online abierta al público, analítica de conversión activa y manual operativo.",
          tareas: [
            { nombreTarea: "Puesta en producción en dominio principal con certificado SSL activo", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.90)) },
            { nombreTarea: "Configurar Google Analytics 4, eventos de compra y píxeles de conversión", prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.95)) },
            { nombreTarea: "Elaborar manual de operación solopreneur (gestión de stock, despachos y caja)", prioridad: "03_P3_Baja", horasEstimadas: 4, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias) }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: `Contratación de plan de hosting o suscripción para ${tech1}`, categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.25), moneda: moneda, tareaAsociada: `Cotizar y contratar plan de hosting o suscripción para ${tech1}` },
        { descripcionGasto: `Comisiones y depósito de garantía para pasarela ${tech2}`, categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: `Configurar cuenta y llaves de prueba en ambiente Sandbox de ${tech2}` },
        { descripcionGasto: "Licencia de plantilla UI y componentes de interfaz comercial", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.35), moneda: moneda, tareaAsociada: "Adquirir o licenciar plantilla UI optimizada para conversión móvil" },
        { descripcionGasto: "Fondo de contingencia y saldo de prueba para transacciones reales", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: `Ejecutar pruebas transaccionales completas con tarjetas de prueba en ${tech2}` }
      ];

    } else if (isDev) {
      metOptima = "Scrum / Ágil";
      if (esAutoPresupuesto) pTope = 5200;

      const hito1Nom = estadoPartida.includes("Base") || estadoPartida.includes("Prototipo")
        ? `Auditoría de Código y Diagnóstico de Base Existente para ${nom}`
        : (estadoPartida.includes("Migración")
          ? `Mapeo de Datos Legacy y Especificación de Migración de ${nom}`
          : `Especificación Técnica y Arquitectura de ${nom} con ${tech1}`);

      const hito1Tareas = estadoPartida.includes("Base") || estadoPartida.includes("Prototipo")
        ? [
            { nombreTarea: `Inspeccionar repositorio previo, dependencias y deuda técnica de ${nom}`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
            { nombreTarea: `Definir plan de refactorización modular y contratos de interfaces con ${tech1}`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
            { nombreTarea: `Verificar compatibilidad del prototipo con el backend y base de datos ${tech2}`, prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
          ]
        : (estadoPartida.includes("Migración")
          ? [
              { nombreTarea: `Extraer, mapear y limpiar datos del sistema legacy para migrar a ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 10, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
              { nombreTarea: `Definir paridad funcional de endpoints y componentes en ${tech1}`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
              { nombreTarea: `Configurar entorno de staging para pruebas de migración sin pérdida`, prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
            ]
          : [
              { nombreTarea: `Levantar requerimientos funcionales e historias de usuario para ${nom}`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
              { nombreTarea: `Diseñar modelo relacional de datos y contratos API para ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 10, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
              { nombreTarea: `Evaluar arquitectura de componentes y librerías en ${tech1}`, prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
            ]);

      hitos = [
        {
          nombreHito: hito1Nom,
          faseAsociada: "Iniciacion",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.15)),
          criterioAceptacion: "Arquitectura técnica definida, modelo de datos y backlog funcional alineados al DoD.",
          tareas: hito1Tareas
        },
        {
          nombreHito: `Aprovisionamiento de ${tech1}, Setup de ${tech2} y Entorno de Desarrollo`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: `Repositorio estructurado, pipelines CI/CD y servicios cloud de ${tech2} inicializados.`,
          tareas: [
            { nombreTarea: `Cotizar y contratar plan de base de datos y backend cloud en ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.22)) },
            { nombreTarea: `Configurar proyecto en ${tech1}, linter, variables de entorno y pipeline CI/CD`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.28)) },
            { nombreTarea: "Adquirir licencias de herramientas de desarrollo o servicios de autenticación", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.34)) }
          ]
        },
        {
          nombreHito: `Construcción Modular e Integración de ${tech1} con ${tech2}`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.35,
          fechaLimite: addDias(Math.round(totalDias * 0.70)),
          criterioAceptacion: "Módulos principales funcionales con conexión completa entre frontend y backend.",
          tareas: [
            { nombreTarea: `Implementar capa de datos, servicios backend y autenticación en ${tech2}`, prioridad: "01_P1_Alta", horasEstimadas: 18, fechaProgramada: addDias(Math.round(totalDias * 0.45)) },
            { nombreTarea: `Construir vistas de interfaz de usuario responsive e intuitivas en ${tech1}`, prioridad: "01_P1_Alta", horasEstimadas: 16, fechaProgramada: addDias(Math.round(totalDias * 0.58)) },
            { nombreTarea: "Integrar llamadas asíncronas, validación de formularios y feedback visual", prioridad: "02_P2_Media", horasEstimadas: 10, fechaProgramada: addDias(Math.round(totalDias * 0.67)) }
          ]
        },
        {
          nombreHito: `Validación de Calidad, Pruebas Integrales E2E y QA de ${nom}`,
          faseAsociada: "Control",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Pruebas de flujo completas superadas, cero errores críticos en consola y DoD cumplido.",
          tareas: [
            { nombreTarea: "Ejecutar pruebas integrales de extremo a extremo (E2E) con casos representativos", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.75)) },
            { nombreTarea: `Auditar rendimiento móvil, accesibilidad y tiempos de respuesta en ${tech1}`, prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.80)) },
            { nombreTarea: "Depurar y resolver incidencias detectadas en la batería de pruebas", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.84)) }
          ]
        },
        {
          nombreHito: `Despliegue Productivo en ${tech3}, Monitoreo y Cierre de ${nom}`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Sistema operativo en ambiente de producción con evidencias y documentación en Drive.",
          tareas: [
            { nombreTarea: `Desplegar a producción en ${tech3} con dominio personalizado y certificado SSL`, prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.90)) },
            { nombreTarea: "Configurar servicio de logging, alertas de fallos y telemetría de uso", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.95)) },
            { nombreTarea: "Documentar arquitectura, manual de mantenimiento y archivar proyecto en Drive", prioridad: "03_P3_Baja", horasEstimadas: 4, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias) }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: `Suscripción a servicios cloud de base de datos en ${tech2}`, categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.35), moneda: moneda, tareaAsociada: `Cotizar y contratar plan de base de datos y backend cloud en ${tech2}` },
        { descripcionGasto: `Herramientas de desarrollo, licencias de APIs y componentes de ${tech1}`, categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.25), moneda: moneda, tareaAsociada: "Adquirir licencias de herramientas de desarrollo o servicios de autenticación" },
        { descripcionGasto: `Hosting de producción, dominio y servicio de CDN/SSL en ${tech3}`, categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.25), moneda: moneda, tareaAsociada: `Desplegar a producción en ${tech3} con dominio personalizado y certificado SSL` },
        { descripcionGasto: "Fondo de contingencia técnica para servicios imprevistos de testing", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.15), moneda: moneda, tareaAsociada: "Ejecutar pruebas integrales de extremo a extremo (E2E) con casos representativos" }
      ];

    } else if (isInfra) {
      metOptima = "Cascada / Tradicional";
      if (esAutoPresupuesto) pTope = 6000;

      hitos = [
        {
          nombreHito: `Evaluación de Requerimientos y Diseño de Topología Segura`,
          faseAsociada: "Iniciacion",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.15)),
          criterioAceptacion: "Matriz de requerimientos de cómputo, políticas de acceso y diagrama de arquitectura firmado.",
          tareas: [
            { nombreTarea: "Levantar inventario de servicios actuales, demanda de tráfico y storage requerido", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
            { nombreTarea: "Diseñar arquitectura de redes, subredes privadas, VPC y reglas de firewall", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
            { nombreTarea: "Definir políticas de contingencia, RTO/RPO y estrategia de copias de seguridad", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
          ]
        },
        {
          nombreHito: `Cotizaciones de Proveedores Cloud y Adquisición de Infraestructura`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: "Comparativa de costos completada y suscripciones aprovisionadas.",
          tareas: [
            { nombreTarea: "Comparar calculadoras de costos cloud (AWS vs GCP vs Azure vs DigitalOcean)", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.22)) },
            { nombreTarea: "Aprovisionar cuenta de nube, habilitar MFA y crear usuarios IAM con privilegios mínimos", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.28)) },
            { nombreTarea: "Contratar o activar certificados SSL/TLS y herramientas de seguridad perimetral", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.34)) }
          ]
        },
        {
          nombreHito: `Configuración de Servidores, Redes y Aprovisionamiento Core`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.35,
          fechaLimite: addDias(Math.round(totalDias * 0.70)),
          criterioAceptacion: "Instancias configuradas, sistema operativo endurecido y contenedores operativos.",
          tareas: [
            { nombreTarea: "Desplegar instancias de servidores mediante scripts automatizados (Docker/IaC)", prioridad: "01_P1_Alta", horasEstimadas: 16, fechaProgramada: addDias(Math.round(totalDias * 0.45)) },
            { nombreTarea: "Aplicar endurecimiento de seguridad (hardening), parches y cerrar puertos vulnerables", prioridad: "01_P1_Alta", horasEstimadas: 12, fechaProgramada: addDias(Math.round(totalDias * 0.58)) },
            { nombreTarea: "Configurar automatización de respaldos periódicos con almacenamiento externo", prioridad: "02_P2_Media", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.67)) }
          ]
        },
        {
          nombreHito: `Pruebas de Resiliencia, Monitoreo y Validación de Continuidad`,
          faseAsociada: "Control",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Pruebas de caída simulada exitosas y panel de métricas en tiempo real operativo.",
          tareas: [
            { nombreTarea: "Simular corte de servidor y validar conmutación por error (Failover)", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.75)) },
            { nombreTarea: "Configurar agentes de telemetría, dashboards de CPU/RAM y alertas a Telegram/Email", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.80)) },
            { nombreTarea: "Comprobar restauración íntegra de base de datos desde copia de respaldo", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.84)) }
          ]
        },
        {
          nombreHito: `Paso a Producción, Migración de Tráfico y Documentación de ${nom}`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Tráfico apuntado a la nueva infraestructura y manual de contingencia en Drive.",
          tareas: [
            { nombreTarea: "Actualizar registros DNS y direccionamiento final hacia la nueva infraestructura", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.90)) },
            { nombreTarea: "Redactar runbook de resolución de incidentes y credenciales cifradas", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.95)) },
            { nombreTarea: "Auditoría final de costos cloud activos y desactivación de recursos huérfanos", prioridad: "03_P3_Baja", horasEstimadas: 4, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias) }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: "Suscripción mensual de cómputo y almacenamiento cloud", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.45), moneda: moneda, tareaAsociada: "Aprovisionar cuenta de nube, habilitar MFA y crear usuarios IAM con privilegios mínimos" },
        { descripcionGasto: "Certificados de seguridad, IP elástica dedicada y dominio", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: "Contratar o activar certificados SSL/TLS y herramientas de seguridad perimetral" },
        { descripcionGasto: "Herramienta de monitoreo y backup en repositorio externo seguro", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: "Configurar automatización de respaldos periódicos con almacenamiento externo" },
        { descripcionGasto: "Fondo de contingencia para picos imprevistos de transferencia de datos", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.15), moneda: moneda, tareaAsociada: "Actualizar registros DNS y direccionamiento final hacia la nueva infraestructura" }
      ];

    } else if (isMarketing) {
      metOptima = "Iterativo / Kanban";
      if (esAutoPresupuesto) pTope = 3800;

      hitos = [
        {
          nombreHito: `Investigación de Audiencia, Oferta y Mensaje de Conversión`,
          faseAsociada: "Iniciacion",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.15)),
          criterioAceptacion: "Perfil de cliente ideal definido, propuesta única de valor y matriz de objeciones lista.",
          tareas: [
            { nombreTarea: `Investigar competidores directos, precios y ángulos publicitarios para ${nom}`, prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
            { nombreTarea: "Redactar copys persuasivos para landing page, anuncios y secuencias de email", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
            { nombreTarea: "Estructurar la oferta irresistible y calcular métricas objetivo de adquisición (CPA / CAC)", prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
          ]
        },
        {
          nombreHito: `Adquisición de Software, Plataforma de CRM y Setup de Pauta`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: "Cuentas publicitarias configuradas, CRM conectado y píxeles verificados.",
          tareas: [
            { nombreTarea: "Cotizar y contratar herramienta de Email Marketing y automatización de leads", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.22)) },
            { nombreTarea: "Configurar cuenta publicitaria (Meta Ads / Google Ads) y método de pago", prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.28)) },
            { nombreTarea: "Instalar píxeles de conversión y API de conversiones en el sitio web", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.34)) }
          ]
        },
        {
          nombreHito: `Construcción de Activos: Landing Page, Anuncios y Funnel`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.35,
          fechaLimite: addDias(Math.round(totalDias * 0.70)),
          criterioAceptacion: "Página de captura activa con formulario probado y set de creatividades listo.",
          tareas: [
            { nombreTarea: "Diseñar y publicar Landing Page optimizada para conversión móvil", prioridad: "01_P1_Alta", horasEstimadas: 14, fechaProgramada: addDias(Math.round(totalDias * 0.45)) },
            { nombreTarea: "Producir kit de creatividades gráficas y videos cortos para anuncios", prioridad: "01_P1_Alta", horasEstimadas: 12, fechaProgramada: addDias(Math.round(totalDias * 0.58)) },
            { nombreTarea: "Configurar secuencias de correos automáticos de bienvenida y seguimiento", prioridad: "02_P2_Media", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.67)) }
          ]
        },
        {
          nombreHito: `Lanzamiento de Tráfico, Pruebas A/B y Optimización de Conversión`,
          faseAsociada: "Control",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Campañas en marcha generando prospectos calificados y ajustes de CPA en vivo.",
          tareas: [
            { nombreTarea: "Lanzar campañas de prueba con micro-presupuestos para validar creatividades", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.75)) },
            { nombreTarea: "Analizar métricas de clics (CTR), rebote y costo por lead (CPL)", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.80)) },
            { nombreTarea: "Pausar anuncios no rentables y reasignar presupuesto a los ganadores", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.84)) }
          ]
        },
        {
          nombreHito: `Evaluación de Retorno (ROAS), Cierre y Plan de Escalamiento`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Reporte final de rentabilidad financiera y base de prospectos guardada.",
          tareas: [
            { nombreTarea: "Consolidar balance de inversión publicitaria vs prospectos y ventas logradas", prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.90)) },
            { nombreTarea: "Exportar y asegurar base de datos de leads generados en Google Sheets/Drive", prioridad: "02_P2_Media", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.95)) },
            { nombreTarea: "Definir hoja de ruta para escalamiento orgánico o pauta recurrente", prioridad: "03_P3_Baja", horasEstimadas: 4, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias) }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: "Fondo de pauta publicitaria digital en plataformas (Meta / Google)", categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.55), moneda: moneda, tareaAsociada: "Lanzar campañas de prueba con micro-presupuestos para validar creatividades" },
        { descripcionGasto: "Suscripción de CRM y plataforma de Email Marketing", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: "Cotizar y contratar herramienta de Email Marketing y automatización de leads" },
        { descripcionGasto: "Hosting de Landing Page, dominio y herramientas de analítica", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.15), moneda: moneda, tareaAsociada: "Diseñar y publicar Landing Page optimizada para conversión móvil" },
        { descripcionGasto: "Fondo de reserva para optimización de pujas de anuncios", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.10), moneda: moneda, tareaAsociada: "Pausar anuncios no rentables y reasignar presupuesto a los ganadores" }
      ];

    } else {
      // Dominio Profesional / Consultoría / Iniciativa General
      metOptima = "Scrum / Ágil";
      if (esAutoPresupuesto) pTope = 4000;

      hitos = [
        {
          nombreHito: `Investigación, Diagnóstico Inicial y Alineación de Requerimientos`,
          faseAsociada: "Iniciacion",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.15)),
          criterioAceptacion: `Diagnóstico operativo, alcance tangible y criterios DoD documentados para ${nom}.`,
          tareas: [
            { nombreTarea: `Levantar información detallada, restricciones y expectativas clave de ${nom}`, prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.08)) },
            { nombreTarea: "Establecer criterios de aceptación medibles (Definition of Done) y checklist de entrega", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.12)) },
            { nombreTarea: "Validar viabilidad operativa y mapear riesgos iniciales con plan de mitigación", prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.15)) }
          ]
        },
        {
          nombreHito: `Cotizaciones, Adquisición de Insumos y Planificación Táctica`,
          faseAsociada: "Planificacion",
          pesoPct: 0.20,
          fechaLimite: addDias(Math.round(totalDias * 0.35)),
          criterioAceptacion: "Insumos cotizados, software/herramientas adquiridas y cronograma validado.",
          tareas: [
            { nombreTarea: "Cotizar 3 proveedores de herramientas, software o insumos clave requeridos", prioridad: "01_P1_Alta", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.22)) },
            { nombreTarea: "Adquirir insumos o licencias de trabajo necesarias para la ejecución", prioridad: "01_P1_Alta", horasEstimadas: 4, fechaProgramada: addDias(Math.round(totalDias * 0.28)) },
            { nombreTarea: "Estructurar cronograma de trabajo por sprints o fases semanales", prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.34)) }
          ]
        },
        {
          nombreHito: `Construcción y Ejecución Modular de los Entregables de ${nom}`,
          faseAsociada: "Ejecucion",
          pesoPct: 0.35,
          fechaLimite: addDias(Math.round(totalDias * 0.70)),
          criterioAceptacion: "Entregables principales elaborados y ensamblados conforme a especificaciones.",
          tareas: [
            { nombreTarea: `Desarrollar y construir el componente principal de ${nom}`, prioridad: "01_P1_Alta", horasEstimadas: 20, fechaProgramada: addDias(Math.round(totalDias * 0.45)) },
            { nombreTarea: "Integrar entregables secundarios y documentar procedimientos clave", prioridad: "01_P1_Alta", horasEstimadas: 14, fechaProgramada: addDias(Math.round(totalDias * 0.58)) },
            { nombreTarea: "Revisión técnica intermedia y ajuste de desviaciones frente al alcance", prioridad: "02_P2_Media", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.67)) }
          ]
        },
        {
          nombreHito: `Validación de Calidad, Pruebas de Funcionamiento y Ajustes`,
          faseAsociada: "Control",
          pesoPct: 0.15,
          fechaLimite: addDias(Math.round(totalDias * 0.85)),
          criterioAceptacion: "Auditoría de calidad aprobada contra el checklist DoD sin observaciones críticas.",
          tareas: [
            { nombreTarea: "Verificar minuciosamente los entregables contra la Definition of Done (DoD)", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.75)) },
            { nombreTarea: "Probar casos prácticos de uso y validar resultados con datos representativos", prioridad: "01_P1_Alta", horasEstimadas: 8, fechaProgramada: addDias(Math.round(totalDias * 0.80)) },
            { nombreTarea: "Realizar ajustes y mejoras finales detectadas durante la validación", prioridad: "02_P2_Media", horasEstimadas: 6, fechaProgramada: addDias(Math.round(totalDias * 0.84)) }
          ]
        },
        {
          nombreHito: `Puesta en Marcha, Entrega Formal de Evidencias y Cierre de ${nom}`,
          faseAsociada: "Cierre",
          pesoPct: 0.15,
          fechaLimite: contexto.fechaFinPlan || addDias(totalDias),
          criterioAceptacion: "Entrega completa de resultados, archivos resguardados en Drive y balance cuadrado.",
          tareas: [
            { nombreTarea: "Desplegar entregable en su entorno final operativo y comprobar funcionamiento", prioridad: "01_P1_Alta", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.90)) },
            { nombreTarea: "Compilar evidencias documentales y cargar entregables en carpeta de Google Drive", prioridad: "02_P2_Media", horasEstimadas: 5, fechaProgramada: addDias(Math.round(totalDias * 0.95)) },
            { nombreTarea: "Realizar balance financiero final, consolidación de lecciones aprendidas y cierre formal", prioridad: "03_P3_Baja", horasEstimadas: 4, fechaProgramada: contexto.fechaFinPlan || addDias(totalDias) }
          ]
        }
      ];

      gastos = [
        { descripcionGasto: "Herramientas especializadas, licencias de software y soporte", categoriaGasto: "Licencias_Software", montoEstimado: Math.round(pTope * 0.35), moneda: moneda, tareaAsociada: "Adquirir insumos o licencias de trabajo necesarias para la ejecución" },
        { descripcionGasto: "Adquisición de materiales e insumos operativos requeridos", categoriaGasto: "Materiales", montoEstimado: Math.round(pTope * 0.30), moneda: moneda, tareaAsociada: "Cotizar 3 proveedores de herramientas, software o insumos clave requeridos" },
        { descripcionGasto: "Servicios de apoyo técnico externo o consultoría puntual", categoriaGasto: "Servicios_Terceros", montoEstimado: Math.round(pTope * 0.20), moneda: moneda, tareaAsociada: `Desarrollar y construir el componente principal de ${nom}` },
        { descripcionGasto: "Fondo de contingencia para imprevistos operativos", categoriaGasto: "Imprevistos", montoEstimado: Math.round(pTope * 0.15), moneda: moneda, tareaAsociada: "Verificar minuciosamente los entregables contra la Definition of Done (DoD)" }
      ];
    }

    const fechaFinCalculada = contexto.fechaFinPlan || addDias(totalDias);

    // Inferencia heurística de Arquetipo y Magnitud para Fallback
    let arquetipoSugerido = "1_Infraestructura";
    if (tipo === "Tecnologia" || tipo === "Software" || /app|web|software|sistema|saas|plataforma|api/i.test(nom)) {
      arquetipoSugerido = "2_Venture";
    } else if (tipo === "Inversiones" || /terreno|inversion|propiedad|activo|vehiculo|inmueble/i.test(nom)) {
      arquetipoSugerido = "3_Activo";
    } else if (tipo === "Educacion" || /certificacion|estudio|carrera|curso|tesis|maestria|diplomado/i.test(nom)) {
      arquetipoSugerido = "4_Carrera";
    } else if (tipo === "Evento" || /boda|conferencia|evento|fiesta|lanzamiento|congreso/i.test(nom)) {
      arquetipoSugerido = "5_Evento";
    }

    let magnitudSugerida = "Medium";
    if (pTope < 3000 && totalDias <= 30) {
      magnitudSugerida = "Light";
    } else if (pTope > 15000 || totalDias > 90) {
      magnitudSugerida = "Heavy";
    }

    const justificacionClasificacion = `Clasificación adaptativa determinada como ${arquetipoSugerido} con magnitud ${magnitudSugerida} basada en tipo '${tipo}' y horizonte de ${totalDias} días.`;

    return {
      success: true,
      data: {
        resumenEjecutivo: `Estructura WBS propuesta para '${nom}', adaptada a la modalidad '${perfilEjecutor}' con ruta crítica clara, tareas operativas de campo y presupuesto balanceado de ${pTope} ${moneda}.`,
        northStarOKR: `Lograr la implementación y entrega exitosa de ${nom} en tiempo y forma, cumpliendo al 100% los criterios DoD.`,
        entregableTangible: entregableTangible,
        criteriosDoD: `1. Todos los hitos completados con evidencias archivadas en Drive.\n2. Pruebas de calidad y criterios de aceptación verificados.\n3. Balance financiero cuadrado dentro del presupuesto tope de ${pTope} ${moneda}.`,
        arquetipoSugerido: arquetipoSugerido,
        magnitudSugerida: magnitudSugerida,
        justificacionClasificacion: justificacionClasificacion,
        categoriaTShirt: pTope > 8000 ? "L-Large" : (pTope < 3000 ? "S-Small" : "M-Medium"),
        criterioDominante: tipo === "Inversiones" ? "C-Costo" : (tipo === "Personal" ? "T-Tiempo" : "I-Impacto"),
        metodologiaOptima: metOptima,
        metodologiaSugerida: metOptima,
        fechaFinPlan: fechaFinCalculada,
        presupuestoTope: pTope,
        estadoPartida: estadoPartida,
        perfilEjecutor: perfilEjecutor,
        stackTecnologico: stackTecnologico,
        restricciones: restricciones,
        hitos: hitos,
        gastos: gastos
      }
    };
  },

  /**
   * 1.5. Desglosa un Paquete de Trabajo (WP) en tareas operativas atómicas utilizando Gemini API
   */
  sugerirDesgloseTareasPaqueteIA: function(contexto) {
    contexto = contexto || {};
    const nomPaquete = String(contexto.nombrePaquete || contexto.nombre || "Entregable").trim();
    const fase = String(contexto.faseAsociada || contexto.fase || "Ejecución").trim();
    const dod = String(contexto.criterioDod || contexto.dod || "").trim();
    const arq = String(contexto.arquetipo || "2_Venture").trim();

    let apiKey = "";
    try {
      if (typeof PropertiesService !== "undefined" && PropertiesService.getScriptProperties) {
        apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      }
    } catch (eProp) {
      Logger.log("[Gemini Desglose Properties]: " + eProp.message);
    }

    if (!apiKey) {
      return this._fallbackDesgloseTareas(contexto);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const schema = {
        type: "OBJECT",
        properties: {
          resumenEnfoque: { type: "STRING" },
          tareas: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                nombreTarea: { type: "STRING" },
                prioridad: { type: "STRING", enum: ["01_P1_Alta", "02_P2_Media", "03_P3_Baja"] },
                horasEstimadas: { type: "NUMBER" },
                diasDuracion: { type: "INTEGER" },
                esMav: { type: "BOOLEAN" },
                criterioDoD: { type: "STRING" }
              },
              required: ["nombreTarea", "prioridad", "horasEstimadas"]
            }
          }
        },
        required: ["tareas"]
      };

      const prompt = `Actúa como Senior Project Manager y PMO Lead.
Desglosa el siguiente Paquete de Trabajo (Work Package) en 3 a 5 tareas atómicas directamente ejecutables por un solopreneur / ejecutor directo:
- Paquete de Trabajo: "${nomPaquete}"
- Fase Asociada: "${fase}"
- Definition of Done (DoD) esperada: "${dod || "Entregable completo y verificado"}"
- Arquetipo: "${arq}"
Reglas:
1. Cada tarea debe tener un verbo de acción claro (ej. "Diseñar arquitectura...", "Configurar base de datos...", "Validar pruebas con usuario...").
2. Prioridades: 01_P1_Alta para tareas de ruta crítica o bloqueantes; 02_P2_Media para desarrollo; 03_P3_Baja para documentación accesoria.
3. Estima horas realistas (entre 1.5 y 8.0 horas por tarea atómica).
4. Asigna esMav = true al menos a la primera tarea crucial.`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: schema,
          temperature: 0.2
        }
      };

      const options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        const result = JSON.parse(response.getContentText());
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(jsonText);
        return { success: true, data: parsed };
      } else {
        Logger.log("[Gemini Desglose HTTP " + response.getResponseCode() + "]: " + response.getContentText());
        return this._fallbackDesgloseTareas(contexto);
      }
    } catch (err) {
      Logger.log("[Gemini Desglose Error]: " + err.message);
      return this._fallbackDesgloseTareas(contexto);
    }
  },

  _fallbackDesgloseTareas: function(contexto) {
    const nom = String(contexto.nombrePaquete || contexto.nombre || "Entregable").trim();
    const fase = String(contexto.faseAsociada || "Ejecución").trim();

    const tareas = [
      {
        nombreTarea: `Levantar requerimientos y especificaciones para ${nom}`,
        prioridad: "01_P1_Alta",
        horasEstimadas: 2.5,
        diasDuracion: 1,
        esMav: true,
        criterioDoD: "Especificaciones y alcance detallado acordados."
      },
      {
        nombreTarea: `Ejecutar desarrollo y construcción técnica de ${nom}`,
        prioridad: "01_P1_Alta",
        horasEstimadas: 5.0,
        diasDuracion: 2,
        esMav: false,
        criterioDoD: "Funcionalidad construida y operativa."
      },
      {
        nombreTarea: `Validación de calidad y pruebas DoD de ${nom}`,
        prioridad: "02_P2_Media",
        horasEstimadas: 2.0,
        diasDuracion: 1,
        esMav: false,
        criterioDoD: "Criterios DoD verificados y evidencias adjuntas."
      }
    ];

    return {
      success: true,
      data: {
        resumenEnfoque: `Desglose heurístico estructurado en 3 tareas secuenciales para '${nom}'.`,
        tareas: tareas
      }
    };
  },

  /**
   * 1.6. Sugiere paquetes de trabajo (WP) e hitos de control (HIT) faltantes para completar la WBS del proyecto
   */
  sugerirEstructuraWbsFaltanteIA: function(contexto) {
    contexto = contexto || {};
    const nomProy = String(contexto.nombreProyecto || "Proyecto").trim();
    const arq = String(contexto.arquetipo || "2_Venture").trim();
    const mag = String(contexto.magnitud || "Medium").trim();
    const exist = Array.isArray(contexto.paquetesExistentes) ? contexto.paquetesExistentes : [];

    let apiKey = "";
    try {
      if (typeof PropertiesService !== "undefined" && PropertiesService.getScriptProperties) {
        apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      }
    } catch (eProp) {
      Logger.log("[Gemini WBS Faltante Properties]: " + eProp.message);
    }

    if (!apiKey) {
      return this._fallbackWbsFaltante(contexto);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const schema = {
        type: "OBJECT",
        properties: {
          diagnosticoBrechas: { type: "STRING" },
          elementosSugeridos: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                tipoElementoWbs: { type: "STRING", enum: ["PAQUETE_TRABAJO", "HITO_MARCADOR"] },
                nombreElemento: { type: "STRING" },
                faseAsociada: { type: "STRING" },
                wbsCode: { type: "STRING" },
                pesoPct: { type: "NUMBER" },
                presupuestoAsignado: { type: "NUMBER" },
                criterioDod: { type: "STRING" },
                justificacion: { type: "STRING" }
              },
              required: ["tipoElementoWbs", "nombreElemento", "faseAsociada", "pesoPct"]
            }
          }
        },
        required: ["elementosSugeridos"]
      };

      const prompt = `Actúa como Director PMO. Analiza la estructura WBS actual del proyecto:
- Nombre del Proyecto: "${nomProy}"
- Arquetipo: "${arq}"
- Magnitud: "${mag}"
- Entregables/Hitos existentes actualmente en el proyecto: ${JSON.stringify(exist)}

Propón entre 2 y 4 elementos WBS faltantes (Paquetes de Trabajo con presupuesto o Hitos Marcadores de control DoD) para asegurar un ciclo de vida completo y mitigar omisiones críticas.
Reglas:
1. No dupliques entregables que ya existan.
2. Si es HITO_MARCADOR, presupuestoAsignado debe ser 0.
3. Si es PAQUETE_TRABAJO, asigna un presupuesto estimado razonable y peso proporcional.`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: schema,
          temperature: 0.2
        }
      };

      const options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        const result = JSON.parse(response.getContentText());
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(jsonText);
        return { success: true, data: parsed };
      } else {
        return this._fallbackWbsFaltante(contexto);
      }
    } catch (err) {
      Logger.log("[Gemini WBS Faltante Error]: " + err.message);
      return this._fallbackWbsFaltante(contexto);
    }
  },

  _fallbackWbsFaltante: function(contexto) {
    const nomProy = String(contexto.nombreProyecto || "Proyecto").trim();
    const elementos = [
      {
        tipoElementoWbs: "PAQUETE_TRABAJO",
        nombreElemento: "Control de Calidad, Testing y Verificación de Criterios DoD",
        faseAsociada: "Fase 3: Control y Calidad",
        wbsCode: "3.2",
        pesoPct: 0.20,
        presupuestoAsignado: 400.0,
        criterioDod: "Matriz de pruebas ejecutada al 100% sin observaciones críticas.",
        justificacion: "Asegura que el producto o entregable cumpla los estándares antes de su liberación."
      },
      {
        tipoElementoWbs: "HITO_MARCADOR",
        nombreElemento: "Hito de Aprobación Formal y Entrega Final",
        faseAsociada: "Fase 4: Cierre",
        wbsCode: "4.1",
        pesoPct: 0.15,
        presupuestoAsignado: 0.0,
        criterioDod: "Acta de conformidad final aprobada y evidencias archivadas en Drive.",
        justificacion: "Punto de control de cierre del proyecto (Duración 0, Costo $0)."
      }
    ];

    return {
      success: true,
      data: {
        diagnosticoBrechas: `Propuesta heurística para completar el ciclo de cierre y aseguramiento de calidad de '${nomProy}'.`,
        elementosSugeridos: elementos
      }
    };
  },

  /**
   * 1.10. Transcribe audio bajo demanda utilizando Gemini Multimodal (inline_data)
   */
  transcribirAudioIdea: function(payload) {
    try {
      const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error("Propiedad GEMINI_API_KEY no configurada en Script Properties.");
      }

      let cleanBase64 = String(payload.base64Data || payload.base64 || "").trim();
      if (cleanBase64.indexOf(",") !== -1) {
        cleanBase64 = cleanBase64.split(",")[1].trim();
      }

      let validMime = String(payload.mimeType || "audio/webm").trim().toLowerCase();

      // Si no viene base64 directo, intentar recuperarlo de Drive usando fileId o urlAdjunto
      if (!cleanBase64 && (payload.fileId || payload.urlAdjunto)) {
        let fId = payload.fileId;
        if (!fId && payload.urlAdjunto) {
          const match = String(payload.urlAdjunto).match(/[-\w]{25,}/);
          if (match) fId = match[0];
        }
        if (fId) {
          const file = DriveApp.getFileById(fId);
          const blob = file.getBlob();
          cleanBase64 = Utilities.base64Encode(blob.getBytes());
          validMime = blob.getContentType() || validMime;
        }
      }

      if (!cleanBase64) {
        throw new Error("No se proporcionó audio en base64 ni archivo válido en Drive.");
      }

      const esImagen = validMime.startsWith("image/");
      const promptText = esImagen
        ? "Extrae y transcribe todo el texto visible o contenido manuscrito/impreso en la imagen adjunta (OCR). Devuelve exclusivamente el texto extraído sin comentarios, introducciones ni despedidas."
        : "Transcribe con máxima fidelidad fonética y puntuación ortográfica limpia el audio adjunto en español. Devuelve exclusivamente el texto transcripto sin comentarios, introducciones ni despedidas.";

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const geminiBody = {
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: validMime, data: cleanBase64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.1
        }
      };

      const options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(geminiBody),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() !== 200) {
        throw new Error(`Error en API Gemini (${response.getResponseCode()}): ${response.getContentText()}`);
      }

      const result = JSON.parse(response.getContentText());
      const textoTranscribido = result.candidates[0].content.parts[0].text.trim();

      // Persistir si se especificó idIdea válido
      if (payload.idIdea && payload.idIdea !== "NUEVA" && payload.idIdea !== "TEMP" && typeof IdeasService !== "undefined") {
        try {
          IdeasService.actualizarIdea({
            idIdea: payload.idIdea,
            transcripcion: textoTranscribido
          });
        } catch (eSave) {
          Logger.log("[GeminiParserService.transcribirAudioIdea persist error]: " + eSave.message);
        }
      }

      return {
        success: true,
        transcripcion: textoTranscribido,
        esImagen: esImagen,
        idIdea: payload.idIdea || ""
      };
    } catch (err) {
      Logger.log("[GeminiParserService.transcribirAudioIdea Error]: " + err.message);
      return {
        success: false,
        error: err.message
      };
    }
  },

  /**
   * 1.11. Clarificación interactiva de Idea con IA (Viabilidad, riesgos, costos y respuesta libre)
   */
  clarificarIdeaIA: function(payload) {
    try {
      const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error("Propiedad GEMINI_API_KEY no configurada en Script Properties.");
      }

      const idIdea = String(payload.idIdea || "").trim();
      const enunciado = String(payload.enunciado || payload.titulo || "").trim();
      const detalle = String(payload.detalle || payload.contexto || "").trim();
      const transcripcion = String(payload.transcripcion || "").trim();
      const preguntaUsuario = String(payload.preguntaUsuario || payload.duda || "").trim();

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const schema = {
        type: "OBJECT",
        properties: {
          desgloseEsencial: { type: "STRING" },
          evaluacionViabilidad: {
            type: "OBJECT",
            properties: {
              esRealista: { type: "BOOLEAN" },
              nivelFriccion: { type: "STRING", enum: ["BAJO", "MEDIO", "ALTO"] },
              costosOcultos: { type: "STRING" },
              tiempoEstimado: { type: "STRING" }
            },
            required: ["esRealista", "nivelFriccion", "costosOcultos", "tiempoEstimado"]
          },
          respuestaDudaUsuario: { type: "STRING" },
          entidadSugerida: { type: "STRING", enum: ["PROYECTO", "TAREA", "HABITO", "NOTA"] },
          justificacionEntidad: { type: "STRING" },
          primerosPasosAccionables: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: [
          "desgloseEsencial",
          "evaluacionViabilidad",
          "respuestaDudaUsuario",
          "entidadSugerida",
          "justificacionEntidad",
          "primerosPasosAccionables"
        ]
      };

      const prompt = `Actúa como Asesor Estratégico Senior de Productividad, Arquitectura y PMO.
Analiza con rigor crítico la siguiente idea capturada:
- Enunciado: "${enunciado}"
- Detalle / Contexto: "${detalle}"
- Transcripción de Audio / Evidencia: "${transcripcion || 'Sin audio o evidencia textual adicional'}"
- Duda / Pregunta formulada por el usuario: "${preguntaUsuario || 'Analizar viabilidad general y ruta de ejecución más limpia'}"

Instrucciones:
1. 'desgloseEsencial': Explica sin rodeos ni preámbulos de qué trata realmente la idea y cuál es su núcleo de valor.
2. 'evaluacionViabilidad': Evalúa si es realista o se está sobreestimando/exagerando. Especifica costos ocultos (económicos, cognitivos o de infraestructura), tiempo aproximado y nivel de fricción (BAJO, MEDIO o ALTO).
3. 'respuestaDudaUsuario': Responde de forma directa, concisa y honesta a la pregunta puntual planteada por el usuario.
4. 'entidadSugerida': Selecciona la vía más orgánica de ejecución:
   - PROYECTO: Requiere múltiples pasos, hito mayor, entregable tangible o presupuesto (> 2 semanas).
   - TAREA: Entregable atómico concreto con fecha límite realizable.
   - HABITO: Compromiso recurrente, salud, bienestar o rutina cíclica continua.
   - NOTA: Conocimiento, referencia documental, lista de deseos o idea latente para incubar.
5. 'justificacionEntidad': Breve argumento de por qué se recomienda esa entidad.
6. 'primerosPasosAccionables': Entre 2 y 3 pasos inmediatos para desbloquear o validar la idea.`;

      const geminiBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: schema,
          temperature: 0.2
        }
      };

      const options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(geminiBody),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() !== 200) {
        throw new Error(`Error en API Gemini (${response.getResponseCode()}): ${response.getContentText()}`);
      }

      const result = JSON.parse(response.getContentText());
      let rawText = result.candidates[0].content.parts[0].text.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();
      }

      let data = null;
      try {
        data = JSON.parse(rawText);
      } catch (eJSON) {
        data = {
          desgloseEsencial: rawText,
          evaluacionViabilidad: {
            esRealista: true,
            nivelFriccion: "MEDIO",
            costosOcultos: "No especificados",
            tiempoEstimado: "Variable"
          },
          respuestaDudaUsuario: "",
          entidadSugerida: "TAREA",
          justificacionEntidad: "Definida por defecto ante respuesta no estructurada",
          primerosPasosAccionables: ["Revisar detalles de la idea", "Definir primer entregable"]
        };
      }

      // Persistir si se cuenta con idIdea válido
      if (idIdea && idIdea !== "NUEVA" && idIdea !== "TEMP" && typeof IdeasService !== "undefined") {
        try {
          IdeasService.actualizarIdea({
            idIdea: idIdea,
            clarificacion: typeof data === "object" ? JSON.stringify(data) : data
          });
        } catch (ePersist) {
          Logger.log("[GeminiParserService.clarificarIdeaIA persist error]: " + ePersist.message);
        }
      }

      return {
        success: true,
        data: data,
        idIdea: idIdea
      };
    } catch (err) {
      Logger.log("[GeminiParserService.clarificarIdeaIA Error]: " + err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
};