/**
 * ============================================================================
 * ARCHIVO: Config.gs
 * SISTEMA: PMO Personal Modular - Life Operating System
 * ROL: Parámetros Globales, Mapeos Matriciales y Configuración del Sistema
 * ============================================================================
 */

// ============================================================================
// 1. CONFIGURACIÓN Y CONSTANTES GLOBALES
// ============================================================================
const CONFIG = {
  TIMEZONE: "America/Lima",
  CALENDAR_ID: "christopher.sanchez.r@uni.pe",
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),

  // Nombres y llaves de los 4 Calendarios Segregados en Google Calendar
  CALENDARIOS: {
    PROYECTOS: "PMO - Proyectos",
    HABITOS: "PMO - Hábitos y Vida",
    GASTOS: "PMO - Gastos Programados",
    INGRESOS: "PMO - Ingresos Programados",
    KEY_PROP_PROYECTOS: "ID_Calendar_Proyectos",
    KEY_PROP_HABITOS: "ID_Calendar_Habitos",
    KEY_PROP_GASTOS: "ID_Calendar_Gastos",
    KEY_PROP_INGRESOS: "ID_Calendar_Ingresos"
  },

  // Nombres de las pestañas en Google Sheets
  SHEETS: {
    PROYECTOS: "BBDD_Proyectos",
    HITOS: "BBDD_Hitos",
    TAREAS: "BBDD_Actividades_Tareas",
    FINANZAS: "BBDD_Finanzas_Gastos",
    ACTIVIDADES_PERSONALES: "BBDD_Actividades_Personales",
    INGRESOS: "BBDD_Finanzas_Ingresos",
    CONFIG: "Configuracion_Sistema",
    SUBTAREAS: "BBDD_Subtareas_Pasos",
    NOTAS: "BBDD_Notas",
    DECISIONES_TRADEOFF: "BBDD_Decisiones_TradeOff",
    IDEAS: "BBDD_Ideas",
    // FLUJO_CAJA y CUOTAS deprecados y removidos (Consolidación atómica en BBDD_Finanzas_Gastos)
  },

  // Mapeo de columnas físicas basado en 0 (Col A=0, Col B=1, etc.) - Esquema Canónico 20 Columnas (A:T)
  COLS_PROYECTOS: {
    ID_PROYECTO: 0,           // Col A (PK: PRO-XXX)
    NOMBRE: 1,                // Col B ('Nombre_Proyecto')
    NOMBRE_PROYECTO: 1,       // Alias canónico
    TIPO_INICIATIVA: 2,       // Col C ('Tipo_Iniciativa')
    TIPO: 2,                  // Alias Retrocompatibilidad
    MAGNITUD_COMPLEJIDAD: 3,  // Col D ('Magnitud_Complejidad')
    TSHIRT: 3,                // Alias Retrocompatibilidad
    ARQUETIPO_PROYECTO: 4,    // Col E ('Arquetipo_Proyecto')
    CRITERIO: 4,              // Alias Retrocompatibilidad
    ESTADO: 5,                // Col F ('Estado_Proyecto')
    ESTADO_PROYECTO: 5,       // Alias canónico
    HEALTH_STATUS: 6,         // Col G ('Health_Status')
    HEALTH: 6,                // Alias Retrocompatibilidad
    AVANCE_REAL_PCT: 7,       // Col H ('Avance_Real_Pct') -> CALCULADO BACKEND (SOLO LECTURA)
    AVANCE: 7,                // Alias Retrocompatibilidad
    ENTREGABLE_OBJETO: 8,     // Col I ('Entregable_Tangible_Objeto')
    OBJETO: 8,                // Alias Retrocompatibilidad
    ENTREGABLE_TANGIBLE_OBJETO: 8, // Alias canónico
    NORTH_STAR_OKR: 9,        // Col J ('North_Star_OKR')
    OKR: 9,                   // Alias Retrocompatibilidad
    CRITERIOS_DOD: 10,        // Col K ('Criterios_Aceptacion_DoD')
    DOD: 10,                  // Alias Retrocompatibilidad
    CRITERIOS_ACEPTACION_DOD: 10, // Alias canónico
    ULTIMA_REVISION: 11,      // Col L ('Ultima_Revision')
    FECHA_INICIO_PLAN: 12,    // Col M ('Fecha_Inicio_Plan')
    FECHA_FIN_PLAN: 13,       // Col N ('Fecha_Fin_Plan')
    MONEDA_BASE: 14,          // Col O ('Moneda_Base')
    PRESUPUESTO_TOPE: 15,     // Col P ('Presupuesto_Tope')
    COSTO_EJECUTADO_PEN: 16,  // Col Q ('Costo_Ejecutado_Real_PEN') -> CALCULADO BACKEND (SOLO LECTURA)
    COSTO_REAL_PEN: 16,       // Alias Retrocompatibilidad
    COSTO_EJECUTADO_REAL_PEN: 16, // Alias canónico
    COSTO_EJECUTADO_USD: 17,  // Col R ('Costo_Ejecutado_Real_USD') -> CALCULADO BACKEND (SOLO LECTURA)
    COSTO_REAL_USD: 17,       // Alias Retrocompatibilidad
    COSTO_EJECUTADO_REAL_USD: 17, // Alias canónico
    TERCEROS_INVOLUCRADOS: 18,// Col S ('Terceros_Involucrados')
    TERCEROS: 18,             // Alias Retrocompatibilidad
    ALCANCE_URL_DRIVE: 19,    // Col T ('Alcance_Detallado_URL_Drive')
    URL_DRIVE: 19,            // Alias Retrocompatibilidad
    ALCANCE_DETALLADO_URL_DRIVE: 19, // Alias canónico
    MAX_COLUMNS: 20
  },

  COLS_HITOS: {
    ID_ELEMENTO_WBS: 0,          // Col A (PK: WP-XXX o HIT-XXX)
    ID_HITO: 0,                  // Alias Retrocompatibilidad
    ID_PROYECTO: 1,              // Col B (FK)
    TIPO_ELEMENTO_WBS: 2,        // Col C ("PAQUETE_TRABAJO" | "HITO_MARCADOR")
    WBS_CODE: 3,                 // Col D (Código jerárquico ej: 1.1, 1.2.1)
    FASE_ASOCIADA: 4,            // Col E (Fase / Nivel 1)
    NOMBRE_ELEMENTO: 5,          // Col F (Nombre del Paquete o Hito)
    NOMBRE_HITO: 5,              // Alias Retrocompatibilidad
    ESTADO: 6,                   // Col G ("01_Pendiente", "02_En_Progreso", "03_Completado", etc.)
    ESTADO_HITO: 6,              // Alias Retrocompatibilidad
    PESO_PCT: 7,                 // Col H
    PESO_PONDERADO_PCT: 7,       // Alias canónico
    FECHA_LIMITE: 8,             // Col I
    FECHA_LIMITE_PLAN: 8,        // Alias Retrocompatibilidad
    FECHA_REAL_FIN: 9,           // Col J
    PRESUPUESTO_ASIGNADO: 10,    // Col K (Techo asignado; $0.00 para HITO_MARCADOR)
    COSTO_ASOCIADO_ESTIMADO: 10, // Alias canónico
    COSTO_ESTIMADO: 10,          // Alias Retrocompatibilidad
    CRITERIO_DOD: 11,            // Col L (Definition of Done)
    CRITERIO_ACEPTACION_DOD: 11, // Alias canónico
    DOD: 11,                     // Alias Retrocompatibilidad
    DEPENDENCIA_PREDECESORA: 12, // Col M (Predecesor CPM)
    DEPENDENCIA_ID_HITO: 12,     // Alias canónico
    DEPENDENCIA: 12,             // Alias Retrocompatibilidad
    ENTREGABLE_LINK: 13,         // Col N (Link verificable)
    ENTREGABLE_VERIFICABLE_LINK: 13, // Alias canónico
    LINK_ENTREGABLE: 13,         // Alias Retrocompatibilidad
    MAX_COLUMNS: 14
  },

  COLS_TAREAS: {
    ID_TAREA: 0,              // Col A (PK: TAR-XXX)
    ID_HITO: 1,               // Col B (FK: WP-XXX)
    ID_PROYECTO: 2,           // Col C (FK: PROY-XXX - Persistido por backend en memoria)
    NOMBRE_TAREA: 3,          // Col D (Nombre_Tarea_Actividad)
    ESTADO: 4,                // Col E (01_Backlog .. 05_Archivado)
    PRIORIDAD: 5,             // Col F (01_P1_Alta .. 04_P4_Delegable)
    NIVEL_ENERGIA: 6,         // Col G (Alta_Cognitiva_DeepWork, Media_Operativa, Baja_Administrativa)
    HORAS_ESTIMADAS: 7,       // Col H (Horas estimadas planificadas)
    HORAS_REALES: 8,          // Col I (Horas reales ejecutadas)
    FECHA_PROGRAMADA: 9,      // Col J (YYYY-MM-DD o YYYY-MM-DD HH:mm)
    AGENDADO_CALENDAR: 10,    // Col K ("Sí" / "No" / "Sí|ID_EVENTO")
    ID_DEPENDENCIA: 11,       // Col L (TAR-XXX Predecesora protegida)
    RESPONSABLE: 12,          // Col M (Christopher)
    NOTAS: 13,                // Col N (Notas / Impedimentos / Bloqueos)
    MAX_COLUMNS: 14
  },

  COLS_FINANZAS: {
    ID_GASTO: 0,              // Col A: PK (GAS-XXX)
    ID_TRANSACCION: 0,        // Alias Polimórfico
    TIPO_ORIGEN: 1,           // Col B: TAREA_PROYECTO | ACTIVIDAD_PERSONAL | LIBRE_CORRIENTE
    CLASIFICACION_ORIGEN: 1,  // Alias Polimórfico
    TIPO_GASTO: 1,            // Alias Polimórfico
    ID_ORIGEN_VINCULADO: 2,   // Col C: TAR-XXX | ACT-XXX | NINGUNO
    ID_ENTIDAD_VINCULADA: 2,  // Alias Polimórfico
    ID_TAREA: 2,              // Alias Polimórfico
    ID_ACTIVIDAD: 2,          // Alias Polimórfico
    ID_CUOTA: 3,              // Col D: CUO-XXX (vínculo a plan o cuota)
    FECHA_GASTO: 4,           // Col E: YYYY-MM-DD
    FECHA_REGISTRO: 4,        // Alias Polimórfico
    FECHA_COMPROMISO: 4,      // Alias Polimórfico
    DESCRIPCION_GASTO: 5,     // Col F: Concepto o detalle del egreso
    DESCRIPCION: 5,           // Alias Polimórfico
    CONCEPTO: 5,              // Alias Polimórfico
    CATEGORIA_GASTO: 6,       // Col G: Rubro o categoría del gasto
    CATEGORIA: 6,             // Alias Polimórfico
    MONEDA_ORIGINAL: 7,       // Col H: PEN | USD | EUR
    MONTO_ORIGINAL: 8,        // Col I: Importe bruto
    MONTO: 8,                 // Alias Polimórfico
    TIPO_CAMBIO: 9,           // Col J: Factor cambiario respecto al PEN
    MONTO_PEN: 10,            // Col K: Normalizado PEN (calculado y persistido por backend)
    MONTO_MONEDA_BASE: 10,    // Alias Polimórfico
    METODO_PAGO: 11,          // Col L: Efectivo, Transferencia, Tarjeta...
    ESTADO_PAGO: 12,          // Col M: Pagado | Pendiente
    ESTADO: 12,               // Alias Polimórfico
    MODALIDAD: 12,            // Alias Polimórfico
    COMPROBANTE_URL: 13,      // Col N: Enlace de Drive del voucher/factura OCR
    MAX_COLUMNS: 14
  },

  COLS_GASTOS: null,          // Alias referenciado hacia COLS_FINANZAS

  COLS_ACTIVIDADES_PERSONALES: {
    ID_ACTIVIDAD: 0,           // Col A: PK (ACT-XXX)
    NOMBRE: 1,                 // Col B: Nombre de la actividad / hábito
    NOMBRE_ACTIVIDAD: 1,       // Alias canónico / retrocompatibilidad
    TIPO_REGISTRO: 2,          // Col C: HABITUAL | PUNTUAL | META
    TIPO_COMPROMISO: 2,        // Alias retrocompatibilidad
    CATEGORIA_VIDA: 3,         // Col D: 6 Dimensiones Canónicas
    META_MACRO_NOMBRE: 4,      // Col E: Macro Meta / OKR vinculado
    UNIDAD_MEDIDA: 5,          // Col F: Unidad de Medida (km, págs, mins, etc.)
    META_OBJETIVO_TOTAL: 6,    // Col G: Meta Cuantitativa Total
    VALOR_ACUMULADO_ACTUAL: 7, // Col H: Valor Acumulado Actual
    META_DIARIA_ESTANDAR: 8,   // Col I: Meta Diaria Estándar
    NIVEL_RESCATE_MINIMO: 9,   // Col J: Nivel Rescate Mínimo de Racha
    ESTADO: 10,                // Col K: 01_Backlog .. 05_Archivado
    RACHA_ACTUAL: 11,          // Col L: Entero consecutivo de días
    FECHA_PROGRAMADA: 12,      // Col M: YYYY-MM-DD
    HORA_INICIO: 13,           // Col N: HH:mm
    AGENDADO_CALENDAR: 14,     // Col O: Sí | No
    ID_EVENTO_CALENDAR: 15,    // Col P: ID de Calendar / Tasks
    MAX_COLUMNS: 16
  },

  COLS_INGRESOS: {
    ID_INGRESO: 0,             // Col A (PK: ING-XXX)
    ID_TRANSACCION: 0,         // Alias Polimórfico
    TIPO_ORIGEN: 1,            // Col B ('LIBRE_CORRIENTE' | 'PROYECTO' | 'ACTIVIDAD_PERSONAL')
    TIPO_INGRESO: 1,           // Alias Polimórfico
    CLASIFICACION_ORIGEN: 1,   // Alias Polimórfico
    ID_ORIGEN_VINCULADO: 2,    // Col C ('NINGUNO' | 'PRO-XXX' | 'ACT-XXX')
    ID_ENTIDAD_VINCULADA: 2,   // Alias Polimórfico
    ID_PROYECTO: 2,            // Alias Polimórfico
    ID_PROYECTO_ASOCIADO: 2,   // Alias Polimórfico
    FECHA_INGRESO: 3,          // Col D (YYYY-MM-DD)
    FECHA_REGISTRO: 3,         // Alias Polimórfico
    FECHA: 3,                  // Alias Polimórfico
    FECHA_COMPROMISO: 3,       // Alias Polimórfico
    DESCRIPCION_INGRESO: 4,    // Col E (Detalle o concepto del ingreso)
    DESCRIPCION: 4,            // Alias Polimórfico
    CONCEPTO: 4,               // Alias Polimórfico
    CATEGORIA_INGRESO: 5,      // Col F ('Sueldo_Nomina' | 'Honorarios_Freelance' | 'Negocio_Emprendimiento' | etc.)
    CATEGORIA: 5,              // Alias Polimórfico
    ORIGEN_FUENTE: 5,          // Alias Polimórfico
    MONEDA_ORIGINAL: 6,        // Col G ('PEN' | 'USD' | 'EUR')
    MONEDA: 6,                 // Alias Polimórfico
    MONTO_ORIGINAL: 7,         // Col H (Importe en moneda original)
    MONTO: 7,                  // Alias Polimórfico
    TIPO_CAMBIO: 8,            // Col I (Factor cambiario a Soles PEN)
    TC: 8,                     // Alias Polimórfico
    MONTO_PEN: 9,              // Col J (Normalizado PEN calculado en memoria por backend)
    MONTO_MONEDA_BASE: 9,      // Alias Polimórfico
    METODO_COBRO: 10,          // Col K ('BCP' | 'IBK' | 'BBVA' | 'Efectivo' | etc.)
    METODO_PAGO: 10,           // Alias Polimórfico
    CUENTA_DESTINO: 10,        // Alias Polimórfico
    COMPROBANTE_URL: 10,       // Alias Polimórfico
    ESTADO_COBRO: 11,          // Col L ('Cobrado' | 'Pendiente / Programado')
    ESTADO_PAGO: 11,           // Alias Polimórfico
    ESTADO: 11,                // Alias Polimórfico
    MODALIDAD: 11,             // Alias Polimórfico
    MAX_COLUMNS: 12
  },

  // ── Fase 4.14: Esquema canónico 6 columnas (A:F) ──────────────────────────
  // Unificación polimórfica en ID_Padre_Vinculado (TAR-XXX | ACT-XXX).
  COLS_SUBTAREAS: {
    ID_SUBTAREA:        0,    // Col A (PK: SUB-XXX)
    ID_PADRE_VINCULADO: 1,    // Col B: TAR-XXX | ACT-XXX (Polimórfico)
    ID_PADRE:           1,    // Alias Polimórfico
    ID_TAREA_PADRE:     1,    // Alias Polimórfico
    ID_ACTIVIDAD_PADRE: 1,    // Alias Polimórfico
    NUMERO_PASO:        2,    // Col C: 1, 2, 3...
    DESCRIPCION_PASO:   3,    // Col D: Texto descriptivo del paso procedural
    COMPLETADO:         4,    // Col E: boolean (true / false) o Sí / No
    FECHA_COMPLETADO:   5,    // Col F: YYYY-MM-DD HH:mm:ss o timestamp ISO
    MAX_COLUMNS:        6
  },

  // ── Fase 4.13: Esquema canónico 12 columnas (A:L) ──────────────────────────
  // TIPO_NOTA ya NO es columna física; se infiere en runtime desde la presencia
  // de CHECKLISTS_JSON o WISHLIST_JSON (regla: si WISHLIST_JSON no es vacío → WISHLIST;
  // si CHECKLISTS_JSON no es vacío y WISHLIST_JSON vacío → CHECKLIST; resto → NORMAL).
  COLS_NOTAS: {
    ID_NOTA:                0,   // Col A (PK: NOT-XXX)
    TITULO:                 1,   // Col B: Texto plano
    CONTENIDO_MARKDOWN:     2,   // Col C: Markdown puro
    CHECKLISTS_JSON:        3,   // Col D: JSON String: [{ id, texto, completado }]
    WISHLIST_JSON:          4,   // Col E: JSON String: { costoEstimado, montoRealGastado, moneda, ... }
    COLOR_TEMA:             5,   // Col F: Token Tailwind o #HEX
    ES_FIJADA:              6,   // Col G: "Sí" / "No"
    ADJUNTOS_DRIVE_JSON:    7,   // Col H: JSON String: [{ id, nombre, url, tipo, thumbnail }]
    ENLACES_ENTIDADES_JSON: 8,   // Col I: JSON String: [{ tipo, codigo, titulo }]
    ETIQUETAS:              9,   // Col J: JSON Array String o comma-separated
    FECHA_CREACION:         10,  // Col K: ISO 8601 Timestamp
    FECHA_ACTUALIZACION:    11,  // Col L: ISO 8601 Timestamp
    MAX_COLUMNS:            12,  // 12 Columnas Canónicas A:L

    // Aliases canónicos y de retrocompatibilidad
    ID_Nota:                0,
    ID:                     0,
    Titulo:                 1,
    Contenido_Markdown:     2,
    CONTENIDO:              2,
    Contenido:              2,
    Checklists_JSON:        3,
    CHECKLIST:              3,
    Checklist:              3,
    Wishlist_JSON:          4,
    WISHLIST:               4,
    Wishlist:               4,
    Color_Tema:             5,
    COLOR:                  5,
    Color:                  5,
    Es_Fijada:              6,
    Fijado:                 6,
    Pin:                    6,
    Adjuntos_Drive_JSON:    7,
    ADJUNTOS:               7,
    Adjuntos:               7,
    Archivos:               7,
    Enlaces_Entidades_JSON: 8,
    Enlaces_Entidades:      8,
    Vinculaciones:          8,
    VINCULOS_JSON:          8,
    Vinculos_JSON:          8,
    VINCULOS:               8,
    Vinculos:               8,
    Etiquetas:              9,
    Tags:                   9,
    TAGS:                   9,
    ETIQUETAS_JSON:         9,
    Fecha_Creacion:         10,
    Fecha_Actualizacion:    11
  },

  // ── Esquema Canónico: Matriz de Decisión Ponderada Trade-Off (11 columnas A:K) ─
  COLS_DECISIONES_TRADEOFF: {
    ID_DECISION:             0,   // Col A (PK: DEC-XXX)
    ID_PROYECTO:             1,   // Col B (FK: PRO-XXX)
    TITULO_DECISION:         2,   // Col C: Título del análisis / dilema
    ARQUETIPO_ACTIVO:        3,   // Col D: Tipo de decisión
    CRITERIOS_JSON:          4,   // Col E: Criterios con pesos porcentuales
    ALTERNATIVAS_JSON:       5,   // Col F: Lista de alternativas
    MATRIZ_EVALUACION_JSON:  6,   // Col G: Puntuaciones cruzadas
    ALTERNATIVA_RECOMENDADA: 7,   // Col H: Ganadora con mayor score
    SCORE_GANADOR:           8,   // Col I: Score ponderado
    ESTADO_DECISION:         9,   // Col J: Aprobada | Borrador | Descartada
    FECHA_REGISTRO:          10,  // Col K: Timestamp ISO
    MAX_COLUMNS:             11
  },

  // ── Esquema Canónico: BBDD_Ideas (13 columnas A:M) ───────────────────────
  COLS_IDEAS: {
    ID_IDEA: 0,             // Col A (PK: IDE-YYYYMMDD-XXX)
    ENUNCIADO_IDEA: 1,      // Col B: Texto / Oración sintética de la idea
    DETALLE_CONTEXTO: 2,    // Col C: Detalle o contexto explicativo
    TIPO_CAPTURA: 3,        // Col D: 'Texto' | 'Audio' | 'Foto' | 'Archivo'
    URL_ADJUNTO_DRIVE: 4,   // Col E: URL del archivo en Drive
    TRANSCRIPCION_TEXTO: 5, // Col F: Transcripción de audio vía Gemini
    CLARIFICACION_IA: 6,    // Col G: Análisis de viabilidad / clarificación JSON o texto
    ESTADO: 7,              // Col H: 'Borrador / Inbox' | 'En Incubación / Algún día' | 'Procesada' | 'Archivada'
    ENTIDAD_CONVERTIDA: 8,  // Col I: 'PROYECTO' | 'TAREA' | 'HABITO' | 'NOTA' | ''
    ID_ENTIDAD_DESTINO: 9,  // Col J: ID de destino generado
    FECHA_CAPTURA: 10,      // Col K: Timestamp ISO
    FECHA_PROCESADA: 11,    // Col L: Timestamp ISO o fecha
    FECHA_ARCHIVADO: 12,    // Col M: Timestamp ISO o fecha
    MAX_COLUMNS: 13,

    // Aliases canónicos y retrocompatibilidad
    ID_Idea: 0,
    Enunciado_Idea: 1,
    Detalle_Contexto: 2,
    Tipo_Captura: 3,
    URL_Adjunto_Drive: 4,
    Transcripcion_Texto: 5,
    Clarificacion_IA: 6,
    Estado: 7,
    Entidad_Convertida: 8,
    ID_Entidad_Destino: 9,
    Fecha_Captura: 10,
    Fecha_Procesada: 11,
    Fecha_Archivado: 12
  },

  // Catálogo canónico de colores para notas (16 tonos Tailwind + soporte HEX libre)
  COLORES_NOTAS: [
    "default", "slate", "red", "orange", "amber", "yellow",
    "lime", "green", "emerald", "teal", "cyan", "sky",
    "blue", "indigo", "violet", "purple", "rose"
  ],

  // Catálogos homologados para validación
  CATALOGOS: {
    COLOR_TEMA: [
      "slate", "red", "orange", "amber", "yellow", "lime",
      "green", "emerald", "teal", "cyan", "sky", "blue",
      "indigo", "violet", "purple", "rose"
    ],
    TIPOS_COMPROMISO: ["HABITUAL", "PUNTUAL"],
    CATEGORIAS_VIDA: [
      "SALUD_DEPORTE",
      "DESARROLLO_ESTUDIO",
      "FINANZAS_TRAMITES",
      "SOCIAL_FAMILIA",
      "PERSONAL_DESCANSO",
      "LABORAL_HONORARIO"
    ],
    ORIGEN_INGRESOS: [
      "Sueldo_Nomina",
      "Honorarios_Freelance",
      "Negocio_Emprendimiento",
      "Inversiones_Rendimientos",
      "Obsequio_Monetario",
      "Ventas_Activos",
      "Otros"
    ],
    CATEGORIAS_CUOTAS: [
      "VEHICULO", "ELECTRONICO", "INMUEBLE", "EDUCACION", "MUEBLES", "OTRO"
    ],
    ESTADOS_CUOTA: ["ACTIVO", "COMPLETADO", "CANCELADO", "ATRASADO"],
    ESTADOS_TAREAS: [
      "01_Backlog",
      "02_Por_Hacer",
      "03_En_Proceso",
      "04_Completado",
      "05_Archivado"
    ]
  },
  // Parámetros por defecto para Time-Blocking
  TIME_BLOCKS: {
    DEEP_WORK: { startHour: 20, startMinute: 30, defaultDurationHours: 2.0 },
    OPERATIVO: { startHour: 10, startMinute: 0, defaultDurationHours: 1.0 }
  },

  /** Valida si un color de nota pertenece a los 16 tonos canónicos Tailwind o es un código #HEX válido */
  esColorValidoNota: function(color) {
    if (!color) return false;
    const str = String(color).trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(str)) return true;
    const clean = str.toLowerCase();
    return (CONFIG.CATALOGOS.COLOR_TEMA && CONFIG.CATALOGOS.COLOR_TEMA.indexOf(clean) !== -1) || clean === "default";
  },

  // ==========================================================================
  // MAPEO DINÁMICO DE COLUMNAS POR CABECERA (RESILIENTE A INSERCIONES Y DESPLAZAMIENTOS)
  // ==========================================================================
  normalizarTextoCabecera: function(str) {
    return String(str || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_\-%]/g, "");
  },

  construirMapaColumnas: function(sheetOrHeaders, defaultConfig, aliasDict) {
    if (!sheetOrHeaders) return Object.assign({}, defaultConfig);

    let headers = null;
    let maxColCount = (defaultConfig && typeof defaultConfig.MAX_COLUMNS === "number") 
      ? defaultConfig.MAX_COLUMNS 
      : Object.keys(defaultConfig || {}).length;

    try {
      if (Array.isArray(sheetOrHeaders)) {
        headers = sheetOrHeaders;
        maxColCount = Math.max(maxColCount, headers.length);
      } else if (typeof sheetOrHeaders.getLastColumn === "function") {
        const lastCol = sheetOrHeaders.getLastColumn();
        if (lastCol <= 0) return Object.assign({}, defaultConfig);
        headers = sheetOrHeaders.getRange(1, 1, 1, lastCol).getValues()[0];
        maxColCount = Math.max(maxColCount, lastCol);
      }
    } catch (eH) {
      Logger.log("[construirMapaColumnas Error]: " + eH.message);
      return Object.assign({}, defaultConfig);
    }

    if (!headers || !headers.length) return Object.assign({}, defaultConfig);

    const colMap = {};
    const normHeaders = headers.map(h => CONFIG.normalizarTextoCabecera(h));

    // Pase 1: Coincidencia exacta de la clave canónica normalizada con la cabecera
    for (const [key, aliases] of Object.entries(aliasDict || {})) {
      const cleanKey = CONFIG.normalizarTextoCabecera(key);
      const exactIdx = normHeaders.indexOf(cleanKey);
      if (exactIdx !== -1) {
        colMap[key] = exactIdx;
      }
    }

    // Pase 2: Coincidencia por lista de alias en orden para claves no mapeadas
    for (const [key, aliases] of Object.entries(aliasDict || {})) {
      if (colMap[key] !== undefined) continue;
      for (const al of aliases) {
        const cleanAl = CONFIG.normalizarTextoCabecera(al);
        const alIdx = normHeaders.indexOf(cleanAl);
        if (alIdx !== -1) {
          colMap[key] = alIdx;
          break;
        }
      }
    }

    // Pase 2.5: Respaldo defensivo con defaultConfig para claves no detectadas en cabeceras
    if (defaultConfig) {
      for (const [defKey, defIdx] of Object.entries(defaultConfig)) {
        if (colMap[defKey] === undefined && defIdx !== undefined) {
          colMap[defKey] = defIdx;
        }
      }
    }

    // Pase 3: Sincronización y Armonización Bidireccional de Sinónimos Polimórficos
    const sync = (k1, k2) => {
      if (colMap[k1] !== undefined && colMap[k2] === undefined) colMap[k2] = colMap[k1];
      else if (colMap[k2] !== undefined && colMap[k1] === undefined) colMap[k1] = colMap[k2];
    };
    sync("MAGNITUD_COMPLEJIDAD", "TSHIRT");
    sync("ARQUETIPO_PROYECTO", "CRITERIO");
    sync("NOMBRE", "NOMBRE_PROYECTO");
    sync("TIPO", "TIPO_INICIATIVA");
    sync("ESTADO", "ESTADO_PROYECTO");
    sync("HEALTH", "HEALTH_STATUS");
    sync("AVANCE_REAL_PCT", "AVANCE");
    sync("OBJETO", "ENTREGABLE_OBJETO");
    sync("ENTREGABLE_OBJETO", "ENTREGABLE_TANGIBLE_OBJETO");
    sync("OKR", "NORTH_STAR_OKR");
    sync("DOD", "CRITERIOS_DOD");
    sync("CRITERIOS_DOD", "CRITERIOS_ACEPTACION_DOD");
    sync("COSTO_REAL_PEN", "COSTO_EJECUTADO_PEN");
    sync("COSTO_EJECUTADO_PEN", "COSTO_EJECUTADO_REAL_PEN");
    sync("COSTO_REAL_USD", "COSTO_EJECUTADO_USD");
    sync("COSTO_EJECUTADO_USD", "COSTO_EJECUTADO_REAL_USD");
    sync("TERCEROS", "TERCEROS_INVOLUCRADOS");
    sync("URL_DRIVE", "ALCANCE_URL_DRIVE");
    sync("ALCANCE_URL_DRIVE", "ALCANCE_DETALLADO_URL_DRIVE");
    sync("ID_ELEMENTO_WBS", "ID_HITO");
    sync("TIPO_ELEMENTO_WBS", "TIPO_ELEMENTO");
    sync("NOMBRE_ELEMENTO", "NOMBRE_HITO");
    sync("ESTADO", "ESTADO_HITO");
    sync("PESO_PCT", "PESO_PONDERADO_PCT");
    sync("FECHA_LIMITE", "FECHA_LIMITE_PLAN");
    sync("PRESUPUESTO_ASIGNADO", "COSTO_ASOCIADO_ESTIMADO");
    sync("PRESUPUESTO_ASIGNADO", "COSTO_ESTIMADO");
    sync("CRITERIO_DOD", "CRITERIO_ACEPTACION_DOD");
    sync("CRITERIO_DOD", "DOD");
    sync("DEPENDENCIA_PREDECESORA", "DEPENDENCIA_ID_HITO");
    sync("DEPENDENCIA_PREDECESORA", "DEPENDENCIA");
    sync("ENTREGABLE_LINK", "ENTREGABLE_VERIFICABLE_LINK");
    sync("ENTREGABLE_LINK", "LINK_ENTREGABLE");
    // Gastos: Sincronización y Armonización Bidireccional Canónica (14 Columnas)
    sync("ID_GASTO", "ID_TRANSACCION");
    sync("TIPO_ORIGEN", "CLASIFICACION_ORIGEN");
    sync("TIPO_ORIGEN", "TIPO_GASTO");
    sync("ID_ORIGEN_VINCULADO", "ID_ENTIDAD_VINCULADA");
    sync("ID_ORIGEN_VINCULADO", "ID_TAREA");
    sync("ID_ORIGEN_VINCULADO", "ID_ACTIVIDAD");
    sync("FECHA_GASTO", "FECHA_REGISTRO");
    sync("FECHA_GASTO", "FECHA_COMPROMISO");
    sync("DESCRIPCION_GASTO", "DESCRIPCION");
    sync("DESCRIPCION_GASTO", "CONCEPTO");
    sync("CATEGORIA_GASTO", "CATEGORIA");
    sync("MONTO_ORIGINAL", "MONTO");
    sync("MONTO_PEN", "MONTO_MONEDA_BASE");
    sync("METODO_PAGO", "CUENTA_DESTINO");
    sync("ESTADO_PAGO", "ESTADO");
    sync("ESTADO_PAGO", "MODALIDAD");

    // Ingresos: Sincronización y Armonización Bidireccional Canónica (12 Columnas)
    sync("ID_INGRESO", "ID_TRANSACCION");
    sync("TIPO_ORIGEN", "TIPO_INGRESO");
    sync("TIPO_ORIGEN", "CLASIFICACION_ORIGEN");
    sync("ID_ORIGEN_VINCULADO", "ID_ENTIDAD_VINCULADA");
    sync("ID_ORIGEN_VINCULADO", "ID_PROYECTO");
    sync("ID_ORIGEN_VINCULADO", "ID_PROYECTO_ASOCIADO");
    sync("FECHA_INGRESO", "FECHA_REGISTRO");
    sync("FECHA_INGRESO", "FECHA");
    sync("FECHA_INGRESO", "FECHA_COMPROMISO");
    sync("DESCRIPCION_INGRESO", "DESCRIPCION");
    sync("DESCRIPCION_INGRESO", "CONCEPTO");
    sync("CATEGORIA_INGRESO", "CATEGORIA");
    sync("CATEGORIA_INGRESO", "ORIGEN_FUENTE");
    sync("MONEDA_ORIGINAL", "MONEDA");
    sync("MONTO_ORIGINAL", "MONTO");
    sync("TIPO_CAMBIO", "TC");
    sync("MONTO_PEN", "MONTO_MONEDA_BASE");
    sync("METODO_COBRO", "METODO_PAGO");
    sync("METODO_COBRO", "CUENTA_DESTINO");
    sync("ESTADO_COBRO", "ESTADO_PAGO");
    sync("ESTADO_COBRO", "ESTADO");
    sync("ESTADO_COBRO", "MODALIDAD");
    sync("ID_PROYECTO", "IDPROYECTO");
    sync("ID_PROYECTO", "idProyecto");
    sync("ID_PROYECTO", "id_proyecto");
    sync("ID_HITO", "IDHITO");
    sync("ID_HITO", "idHito");
    sync("ID_HITO", "id_hito");
    sync("ID_ELEMENTO_WBS", "IDELEMENTOWBS");
    sync("ID_ELEMENTO_WBS", "idElementoWbs");
    sync("ID_TAREA", "IDTAREA");
    sync("ID_TAREA", "idTarea");
    sync("ID_TAREA", "id_tarea");
    sync("NOMBRE", "NOMBRE_ACTIVIDAD");
    sync("TIPO_REGISTRO", "TIPO_COMPROMISO");

    // Notas: Sincronización y Armonización Bidireccional Canónica (12 Columnas A:L)
    sync("ID_NOTA", "ID_Nota");
    sync("ID_NOTA", "ID");
    sync("TITULO", "Titulo");
    sync("CONTENIDO_MARKDOWN", "Contenido_Markdown");
    sync("CONTENIDO_MARKDOWN", "CONTENIDO");
    sync("CONTENIDO_MARKDOWN", "Contenido");
    sync("CHECKLISTS_JSON", "Checklists_JSON");
    sync("CHECKLISTS_JSON", "CHECKLIST");
    sync("CHECKLISTS_JSON", "Checklist");
    sync("WISHLIST_JSON", "Wishlist_JSON");
    sync("WISHLIST_JSON", "WISHLIST");
    sync("WISHLIST_JSON", "Wishlist");
    sync("COLOR_TEMA", "Color_Tema");
    sync("COLOR_TEMA", "COLOR");
    sync("COLOR_TEMA", "Color");
    sync("ES_FIJADA", "Es_Fijada");
    sync("ES_FIJADA", "FIJADO");
    sync("ES_FIJADA", "Fijado");
    sync("ES_FIJADA", "PIN");
    sync("ES_FIJADA", "Pin");
    sync("ADJUNTOS_DRIVE_JSON", "Adjuntos_Drive_JSON");
    sync("ADJUNTOS_DRIVE_JSON", "ADJUNTOS");
    sync("ADJUNTOS_DRIVE_JSON", "Adjuntos");
    sync("ADJUNTOS_DRIVE_JSON", "ARCHIVOS");
    sync("ADJUNTOS_DRIVE_JSON", "Archivos");
    sync("ENLACES_ENTIDADES_JSON", "Enlaces_Entidades_JSON");
    sync("ENLACES_ENTIDADES_JSON", "ENLACES_ENTIDADES");
    sync("ENLACES_ENTIDADES_JSON", "Enlaces_Entidades");
    sync("ENLACES_ENTIDADES_JSON", "VINCULACIONES");
    sync("ENLACES_ENTIDADES_JSON", "Vinculaciones");
    sync("ENLACES_ENTIDADES_JSON", "VINCULOS_JSON");
    sync("ENLACES_ENTIDADES_JSON", "Vinculos_JSON");
    sync("ENLACES_ENTIDADES_JSON", "VINCULOS");
    sync("ENLACES_ENTIDADES_JSON", "Vinculos");
    sync("ETIQUETAS", "Etiquetas");
    sync("ETIQUETAS", "TAGS");
    sync("ETIQUETAS", "Tags");
    sync("FECHA_CREACION", "Fecha_Creacion");
    sync("FECHA_ACTUALIZACION", "Fecha_Actualizacion");

    // Subtareas / Pasos: Sincronización Canónica (6 Columnas A:F)
    sync("ID_SUBTAREA", "ID_Subtarea");
    sync("ID_SUBTAREA", "ID");
    sync("ID_PADRE_VINCULADO", "ID_Padre_Vinculado");
    sync("ID_PADRE_VINCULADO", "ID_PADRE");
    sync("ID_PADRE_VINCULADO", "ID_Padre");
    sync("ID_PADRE_VINCULADO", "ID_Tarea_Padre");
    sync("ID_PADRE_VINCULADO", "ID_Actividad_Padre");
    sync("NUMERO_PASO", "Numero_Paso");
    sync("NUMERO_PASO", "PASO");
    sync("NUMERO_PASO", "Paso");
    sync("NUMERO_PASO", "ORDEN");
    sync("NUMERO_PASO", "Orden");
    sync("DESCRIPCION_PASO", "Descripcion_Paso");
    sync("DESCRIPCION_PASO", "DESCRIPCION");
    sync("DESCRIPCION_PASO", "Descripcion");
    sync("DESCRIPCION_PASO", "TITULO");
    sync("DESCRIPCION_PASO", "Titulo");
    sync("COMPLETADO", "Completado");
    sync("COMPLETADO", "CHECK");
    sync("COMPLETADO", "Check");
    sync("COMPLETADO", "ESTADO");
    sync("COMPLETADO", "Estado");
    sync("FECHA_COMPLETADO", "Fecha_Completado");
    sync("FECHA_COMPLETADO", "FECHA_FINALIZACION");
    sync("FECHA_COMPLETADO", "Fecha_Finalizacion");

    // Garantizar que las variantes polimórficas existan en el mapa retornado
    if (colMap.ID_PROYECTO !== undefined) {
      colMap.IDPROYECTO = colMap.ID_PROYECTO;
      colMap.idProyecto = colMap.ID_PROYECTO;
      colMap.id_proyecto = colMap.ID_PROYECTO;
      colMap.ID_Proyecto = colMap.ID_PROYECTO;
    }
    if (colMap.ID_ELEMENTO_WBS !== undefined || colMap.ID_HITO !== undefined) {
      const idWbsVal = colMap.ID_ELEMENTO_WBS !== undefined ? colMap.ID_ELEMENTO_WBS : colMap.ID_HITO;
      colMap.ID_ELEMENTO_WBS = idWbsVal;
      colMap.ID_Elemento_WBS = idWbsVal;
      colMap.ID_HITO = idWbsVal;
      colMap.IDHITO = idWbsVal;
      colMap.idHito = idWbsVal;
      colMap.id_hito = idWbsVal;
      colMap.ID_Hito = idWbsVal;
    }
    if (colMap.TIPO_ELEMENTO_WBS !== undefined) {
      colMap.Tipo_Elemento_WBS = colMap.TIPO_ELEMENTO_WBS;
      colMap.tipoElementoWbs = colMap.TIPO_ELEMENTO_WBS;
    }
    if (colMap.WBS_CODE !== undefined) {
      colMap.WBS_Code = colMap.WBS_CODE;
      colMap.wbsCode = colMap.WBS_CODE;
    }
    if (colMap.FASE_ASOCIADA !== undefined) {
      colMap.Fase_Asociada = colMap.FASE_ASOCIADA;
      colMap.faseAsociada = colMap.FASE_ASOCIADA;
    }
    if (colMap.NOMBRE_ELEMENTO !== undefined) {
      colMap.Nombre_Elemento = colMap.NOMBRE_ELEMENTO;
      colMap.nombreElemento = colMap.NOMBRE_ELEMENTO;
    }
    if (colMap.ESTADO !== undefined) {
      colMap.Estado_Hito = colMap.ESTADO;
      colMap.estadoHito = colMap.ESTADO;
    }
    if (colMap.PESO_PCT !== undefined) {
      colMap.Peso_Ponderado_Pct = colMap.PESO_PCT;
      colMap.pesoPonderadoPct = colMap.PESO_PCT;
    }
    if (colMap.FECHA_LIMITE !== undefined || colMap.FECHA_LIMITE_PLAN !== undefined) {
      const fecLimVal = colMap.FECHA_LIMITE !== undefined ? colMap.FECHA_LIMITE : colMap.FECHA_LIMITE_PLAN;
      colMap.Fecha_Limite_Plan = fecLimVal;
      colMap.fechaLimitePlan = fecLimVal;
      colMap.Fecha_Limite = fecLimVal;
      colMap.fechaLimite = fecLimVal;
    }
    if (colMap.FECHA_REAL_FIN !== undefined) {
      colMap.Fecha_Real_Fin = colMap.FECHA_REAL_FIN;
      colMap.fechaRealFin = colMap.FECHA_REAL_FIN;
    }
    if (colMap.PRESUPUESTO_ASIGNADO !== undefined) {
      colMap.Presupuesto_Asignado = colMap.PRESUPUESTO_ASIGNADO;
      colMap.presupuestoAsignado = colMap.PRESUPUESTO_ASIGNADO;
      colMap.Costo_Asociado_Estimado = colMap.PRESUPUESTO_ASIGNADO;
    }
    if (colMap.CRITERIO_DOD !== undefined) {
      colMap.Criterio_Aceptacion_DoD = colMap.CRITERIO_DOD;
      colMap.criterioDod = colMap.CRITERIO_DOD;
    }
    if (colMap.DEPENDENCIA_PREDECESORA !== undefined) {
      colMap.Dependencia_ID_Hito = colMap.DEPENDENCIA_PREDECESORA;
      colMap.dependenciaPredecesora = colMap.DEPENDENCIA_PREDECESORA;
    }
    if (colMap.ENTREGABLE_LINK !== undefined) {
      colMap.Entregable_Verificable_Link = colMap.ENTREGABLE_LINK;
      colMap.entregableLink = colMap.ENTREGABLE_LINK;
    }
    if (colMap.ID_TAREA !== undefined) {
      colMap.IDTAREA = colMap.ID_TAREA;
      colMap.idTarea = colMap.ID_TAREA;
      colMap.id_tarea = colMap.ID_TAREA;
      colMap.ID_Tarea = colMap.ID_TAREA;
    }
    if (colMap.NOMBRE_TAREA !== undefined) {
      colMap.Nombre_Tarea = colMap.NOMBRE_TAREA;
      colMap.nombreTarea = colMap.NOMBRE_TAREA;
      colMap.Nombre_Tarea_Actividad = colMap.NOMBRE_TAREA;
      colMap.nombreTareaActividad = colMap.NOMBRE_TAREA;
    }
    if (colMap.ESTADO !== undefined && colMap.Estado_Tarea === undefined) {
      colMap.Estado_Tarea = colMap.ESTADO;
      colMap.estadoTarea = colMap.ESTADO;
    }
    if (colMap.PRIORIDAD !== undefined && colMap.Prioridad_Eisenhower === undefined) {
      colMap.Prioridad_Eisenhower = colMap.PRIORIDAD;
      colMap.prioridad = colMap.PRIORIDAD;
    }
    if (colMap.NIVEL_ENERGIA !== undefined) {
      colMap.Nivel_Energia_Requerido = colMap.NIVEL_ENERGIA;
      colMap.nivelEnergia = colMap.NIVEL_ENERGIA;
    }
    if (colMap.HORAS_ESTIMADAS !== undefined) {
      colMap.Horas_Estimadas = colMap.HORAS_ESTIMADAS;
      colMap.horasEstimadas = colMap.HORAS_ESTIMADAS;
    }
    if (colMap.HORAS_REALES !== undefined) {
      colMap.Horas_Reales = colMap.HORAS_REALES;
      colMap.horasReales = colMap.HORAS_REALES;
    }
    if (colMap.FECHA_PROGRAMADA !== undefined) {
      colMap.Fecha_Programada = colMap.FECHA_PROGRAMADA;
      colMap.fechaProgramada = colMap.FECHA_PROGRAMADA;
    }
    if (colMap.AGENDADO_CALENDAR !== undefined) {
      colMap.Agendado_Calendar = colMap.AGENDADO_CALENDAR;
      colMap.agendadoCalendar = colMap.AGENDADO_CALENDAR;
    }
    if (colMap.ID_DEPENDENCIA !== undefined) {
      colMap.Id_Dependencia = colMap.ID_DEPENDENCIA;
      colMap.idDependencia = colMap.ID_DEPENDENCIA;
      colMap.ID_Dependencia = colMap.ID_DEPENDENCIA;
    }
    if (colMap.RESPONSABLE !== undefined) {
      colMap.Responsable_Ejecutor = colMap.RESPONSABLE;
      colMap.responsableEjecutor = colMap.RESPONSABLE;
      colMap.responsable = colMap.RESPONSABLE;
    }
    if (colMap.NOTAS !== undefined) {
      colMap.Notas_Impedimentos = colMap.NOTAS;
      colMap.notasImpedimentos = colMap.NOTAS;
      colMap.notas = colMap.NOTAS;
    }

    // Variantes polimórficas para BBDD_Actividades_Personales (16 Columnas Canónicas)
    if (colMap.ID_ACTIVIDAD !== undefined) {
      colMap.IDACTIVIDAD = colMap.ID_ACTIVIDAD;
      colMap.idActividad = colMap.ID_ACTIVIDAD;
      colMap.id_actividad = colMap.ID_ACTIVIDAD;
      colMap.ID_Actividad = colMap.ID_ACTIVIDAD;
    }
    if (colMap.NOMBRE !== undefined || colMap.NOMBRE_ACTIVIDAD !== undefined) {
      const nomActVal = colMap.NOMBRE !== undefined ? colMap.NOMBRE : colMap.NOMBRE_ACTIVIDAD;
      colMap.NOMBRE = nomActVal;
      colMap.NOMBRE_ACTIVIDAD = nomActVal;
      colMap.Nombre_Actividad = nomActVal;
      colMap.nombreActividad = nomActVal;
      colMap.Nombre = nomActVal;
      colMap.nombre = nomActVal;
    }
    if (colMap.TIPO_REGISTRO !== undefined || colMap.TIPO_COMPROMISO !== undefined) {
      const tipoActVal = colMap.TIPO_REGISTRO !== undefined ? colMap.TIPO_REGISTRO : colMap.TIPO_COMPROMISO;
      colMap.TIPO_REGISTRO = tipoActVal;
      colMap.TIPO_COMPROMISO = tipoActVal;
      colMap.Tipo_Registro = tipoActVal;
      colMap.Tipo_Compromiso = tipoActVal;
      colMap.tipoRegistro = tipoActVal;
      colMap.tipoCompromiso = tipoActVal;
    }
    if (colMap.CATEGORIA_VIDA !== undefined) {
      colMap.Categoria_Vida = colMap.CATEGORIA_VIDA;
      colMap.categoriaVida = colMap.CATEGORIA_VIDA;
    }
    if (colMap.META_MACRO_NOMBRE !== undefined) {
      colMap.Meta_Macro_Nombre = colMap.META_MACRO_NOMBRE;
      colMap.metaMacroNombre = colMap.META_MACRO_NOMBRE;
    }
    if (colMap.UNIDAD_MEDIDA !== undefined) {
      colMap.Unidad_Medida = colMap.UNIDAD_MEDIDA;
      colMap.unidadMedida = colMap.UNIDAD_MEDIDA;
    }
    if (colMap.META_OBJETIVO_TOTAL !== undefined) {
      colMap.Meta_Objetivo_Total = colMap.META_OBJETIVO_TOTAL;
      colMap.metaObjetivoTotal = colMap.META_OBJETIVO_TOTAL;
    }
    if (colMap.VALOR_ACUMULADO_ACTUAL !== undefined) {
      colMap.Valor_Acumulado_Actual = colMap.VALOR_ACUMULADO_ACTUAL;
      colMap.valorAcumuladoActual = colMap.VALOR_ACUMULADO_ACTUAL;
    }
    if (colMap.META_DIARIA_ESTANDAR !== undefined) {
      colMap.Meta_Diaria_Estandar = colMap.META_DIARIA_ESTANDAR;
      colMap.metaDiariaEstandar = colMap.META_DIARIA_ESTANDAR;
    }
    if (colMap.NIVEL_RESCATE_MINIMO !== undefined) {
      colMap.Nivel_Rescate_Minimo = colMap.NIVEL_RESCATE_MINIMO;
      colMap.nivelRescateMinimo = colMap.NIVEL_RESCATE_MINIMO;
    }
    if (colMap.RACHA_ACTUAL !== undefined) {
      colMap.Racha_Actual = colMap.RACHA_ACTUAL;
      colMap.rachaActual = colMap.RACHA_ACTUAL;
    }

    // Variantes polimórficas para BBDD_Finanzas_Gastos (14 Columnas Canónicas)
    if (colMap.ID_GASTO !== undefined || colMap.ID_TRANSACCION !== undefined) {
      const idGVal = colMap.ID_GASTO !== undefined ? colMap.ID_GASTO : colMap.ID_TRANSACCION;
      colMap.ID_GASTO = idGVal;
      colMap.ID_TRANSACCION = idGVal;
      colMap.idGasto = idGVal;
      colMap.id_gasto = idGVal;
      colMap.ID_Gasto = idGVal;
    }
    if (colMap.TIPO_ORIGEN !== undefined || colMap.CLASIFICACION_ORIGEN !== undefined || colMap.TIPO_GASTO !== undefined) {
      const toVal = colMap.TIPO_ORIGEN !== undefined ? colMap.TIPO_ORIGEN : (colMap.CLASIFICACION_ORIGEN !== undefined ? colMap.CLASIFICACION_ORIGEN : colMap.TIPO_GASTO);
      colMap.TIPO_ORIGEN = toVal;
      colMap.tipoOrigen = toVal;
      colMap.Tipo_Origen = toVal;
      colMap.CLASIFICACION_ORIGEN = toVal;
      colMap.clasificacionOrigen = toVal;
      colMap.Clasificacion_Origen = toVal;
      colMap.TIPO_GASTO = toVal;
      colMap.tipoGasto = toVal;
      colMap.Tipo_Gasto = toVal;
    }
    if (colMap.ID_ORIGEN_VINCULADO !== undefined || colMap.ID_ENTIDAD_VINCULADA !== undefined || colMap.ID_TAREA !== undefined || colMap.ID_ACTIVIDAD !== undefined) {
      const iovVal = colMap.ID_ORIGEN_VINCULADO !== undefined ? colMap.ID_ORIGEN_VINCULADO : (colMap.ID_ENTIDAD_VINCULADA !== undefined ? colMap.ID_ENTIDAD_VINCULADA : (colMap.ID_TAREA !== undefined ? colMap.ID_TAREA : colMap.ID_ACTIVIDAD));
      colMap.ID_ORIGEN_VINCULADO = iovVal;
      colMap.idOrigenVinculado = iovVal;
      colMap.Id_Origen_Vinculado = iovVal;
      colMap.ID_ENTIDAD_VINCULADA = iovVal;
      colMap.idEntidadVinculada = iovVal;
      colMap.Id_Entidad_Vinculada = iovVal;
      colMap.ID_TAREA = iovVal;
      colMap.idTarea = iovVal;
      colMap.ID_Tarea = iovVal;
      colMap.ID_ACTIVIDAD = iovVal;
      colMap.idActividad = iovVal;
      colMap.ID_Actividad = iovVal;
    }
    if (colMap.ID_CUOTA !== undefined) {
      colMap.idCuota = colMap.ID_CUOTA;
      colMap.Id_Cuota = colMap.ID_CUOTA;
    }
    if (colMap.FECHA_GASTO !== undefined || colMap.FECHA_REGISTRO !== undefined || colMap.FECHA_COMPROMISO !== undefined) {
      const fgVal = colMap.FECHA_GASTO !== undefined ? colMap.FECHA_GASTO : (colMap.FECHA_REGISTRO !== undefined ? colMap.FECHA_REGISTRO : colMap.FECHA_COMPROMISO);
      colMap.FECHA_GASTO = fgVal;
      colMap.fechaGasto = fgVal;
      colMap.Fecha_Gasto = fgVal;
      colMap.FECHA_REGISTRO = fgVal;
      colMap.fechaRegistro = fgVal;
      colMap.Fecha_Registro = fgVal;
    }
    if (colMap.DESCRIPCION_GASTO !== undefined || colMap.DESCRIPCION !== undefined || colMap.CONCEPTO !== undefined) {
      const dgVal = colMap.DESCRIPCION_GASTO !== undefined ? colMap.DESCRIPCION_GASTO : (colMap.DESCRIPCION !== undefined ? colMap.DESCRIPCION : colMap.CONCEPTO);
      colMap.DESCRIPCION_GASTO = dgVal;
      colMap.descripcionGasto = dgVal;
      colMap.Descripcion_Gasto = dgVal;
      colMap.DESCRIPCION = dgVal;
      colMap.descripcion = dgVal;
      colMap.Descripcion = dgVal;
      colMap.CONCEPTO = dgVal;
      colMap.concepto = dgVal;
      colMap.Concepto = dgVal;
    }
    if (colMap.CATEGORIA_GASTO !== undefined || colMap.CATEGORIA !== undefined) {
      const cgVal = colMap.CATEGORIA_GASTO !== undefined ? colMap.CATEGORIA_GASTO : colMap.CATEGORIA;
      colMap.CATEGORIA_GASTO = cgVal;
      colMap.categoriaGasto = cgVal;
      colMap.Categoria_Gasto = cgVal;
      colMap.CATEGORIA = cgVal;
      colMap.categoria = cgVal;
      colMap.Categoria = cgVal;
    }
    if (colMap.MONEDA_ORIGINAL !== undefined) {
      colMap.monedaOriginal = colMap.MONEDA_ORIGINAL;
      colMap.Moneda_Original = colMap.MONEDA_ORIGINAL;
    }
    if (colMap.MONTO_ORIGINAL !== undefined || colMap.MONTO !== undefined) {
      const moVal = colMap.MONTO_ORIGINAL !== undefined ? colMap.MONTO_ORIGINAL : colMap.MONTO;
      colMap.MONTO_ORIGINAL = moVal;
      colMap.montoOriginal = moVal;
      colMap.Monto_Original = moVal;
      colMap.MONTO = moVal;
      colMap.monto = moVal;
      colMap.Monto = moVal;
    }
    if (colMap.TIPO_CAMBIO !== undefined) {
      colMap.tipoCambio = colMap.TIPO_CAMBIO;
      colMap.Tipo_Cambio = colMap.TIPO_CAMBIO;
    }
    if (colMap.MONTO_PEN !== undefined || colMap.MONTO_MONEDA_BASE !== undefined) {
      const mpVal = colMap.MONTO_PEN !== undefined ? colMap.MONTO_PEN : colMap.MONTO_MONEDA_BASE;
      colMap.MONTO_PEN = mpVal;
      colMap.montoPen = mpVal;
      colMap.Monto_PEN = mpVal;
      colMap.MONTO_MONEDA_BASE = mpVal;
      colMap.montoMonedaBase = mpVal;
      colMap.Monto_Moneda_Base = mpVal;
    }
    if (colMap.METODO_PAGO !== undefined) {
      colMap.metodoPago = colMap.METODO_PAGO;
      colMap.Metodo_Pago = colMap.METODO_PAGO;
    }
    if (colMap.ESTADO_PAGO !== undefined || colMap.ESTADO !== undefined || colMap.MODALIDAD !== undefined) {
      const epVal = colMap.ESTADO_PAGO !== undefined ? colMap.ESTADO_PAGO : (colMap.ESTADO !== undefined ? colMap.ESTADO : colMap.MODALIDAD);
      colMap.ESTADO_PAGO = epVal;
      colMap.estadoPago = epVal;
      colMap.Estado_Pago = epVal;
      colMap.ESTADO = epVal;
      colMap.estado = epVal;
      colMap.Estado = epVal;
    }
    if (colMap.COMPROBANTE_URL !== undefined) {
      colMap.comprobanteUrl = colMap.COMPROBANTE_URL;
      colMap.Comprobante_URL = colMap.COMPROBANTE_URL;
      colMap.comprobante_url = colMap.COMPROBANTE_URL;
    }

    // Variantes polimórficas para BBDD_Finanzas_Ingresos (12 Columnas Canónicas)
    if (colMap.ID_INGRESO !== undefined || colMap.ID_TRANSACCION !== undefined) {
      const idIVal = colMap.ID_INGRESO !== undefined ? colMap.ID_INGRESO : colMap.ID_TRANSACCION;
      colMap.ID_INGRESO = idIVal;
      colMap.idIngreso = idIVal;
      colMap.id_ingreso = idIVal;
      colMap.ID_Ingreso = idIVal;
      colMap.ID_TRANSACCION = idIVal;
      colMap.idTransaccion = idIVal;
      colMap.ID_Transaccion = idIVal;
    }
    if (colMap.TIPO_ORIGEN !== undefined || colMap.TIPO_INGRESO !== undefined || colMap.CLASIFICACION_ORIGEN !== undefined) {
      const tiVal = colMap.TIPO_ORIGEN !== undefined ? colMap.TIPO_ORIGEN : (colMap.TIPO_INGRESO !== undefined ? colMap.TIPO_INGRESO : colMap.CLASIFICACION_ORIGEN);
      colMap.TIPO_ORIGEN = tiVal;
      colMap.tipoOrigen = tiVal;
      colMap.Tipo_Origen = tiVal;
      colMap.TIPO_INGRESO = tiVal;
      colMap.tipoIngreso = tiVal;
      colMap.Tipo_Ingreso = tiVal;
      colMap.CLASIFICACION_ORIGEN = tiVal;
      colMap.clasificacionOrigen = tiVal;
      colMap.Clasificacion_Origen = tiVal;
    }
    if (colMap.ID_ORIGEN_VINCULADO !== undefined || colMap.ID_ENTIDAD_VINCULADA !== undefined || colMap.ID_PROYECTO_ASOCIADO !== undefined) {
      const iovVal = colMap.ID_ORIGEN_VINCULADO !== undefined ? colMap.ID_ORIGEN_VINCULADO : (colMap.ID_ENTIDAD_VINCULADA !== undefined ? colMap.ID_ENTIDAD_VINCULADA : (colMap.ID_PROYECTO !== undefined ? colMap.ID_PROYECTO : colMap.ID_PROYECTO_ASOCIADO));
      colMap.ID_ORIGEN_VINCULADO = iovVal;
      colMap.idOrigenVinculado = iovVal;
      colMap.Id_Origen_Vinculado = iovVal;
      colMap.ID_ENTIDAD_VINCULADA = iovVal;
      colMap.idEntidadVinculada = iovVal;
      colMap.Id_Entidad_Vinculada = iovVal;
      if (colMap.ID_PROYECTO === undefined) {
        colMap.ID_PROYECTO = iovVal;
        colMap.idProyecto = iovVal;
        colMap.ID_Proyecto = iovVal;
      }
      if (colMap.ID_PROYECTO_ASOCIADO === undefined) {
        colMap.ID_PROYECTO_ASOCIADO = iovVal;
        colMap.idProyectoAsociado = iovVal;
        colMap.ID_Proyecto_Asociado = iovVal;
      }
    }
    if (colMap.FECHA_INGRESO !== undefined || colMap.FECHA_REGISTRO !== undefined || colMap.FECHA !== undefined) {
      const fiVal = colMap.FECHA_INGRESO !== undefined ? colMap.FECHA_INGRESO : (colMap.FECHA_REGISTRO !== undefined ? colMap.FECHA_REGISTRO : colMap.FECHA);
      colMap.FECHA_INGRESO = fiVal;
      colMap.fechaIngreso = fiVal;
      colMap.Fecha_Ingreso = fiVal;
      colMap.FECHA_REGISTRO = fiVal;
      colMap.fechaRegistro = fiVal;
      colMap.Fecha_Registro = fiVal;
    }
    if (colMap.DESCRIPCION_INGRESO !== undefined || colMap.DESCRIPCION !== undefined || colMap.CONCEPTO !== undefined) {
      const diVal = colMap.DESCRIPCION_INGRESO !== undefined ? colMap.DESCRIPCION_INGRESO : (colMap.DESCRIPCION !== undefined ? colMap.DESCRIPCION : colMap.CONCEPTO);
      colMap.DESCRIPCION_INGRESO = diVal;
      colMap.descripcionIngreso = diVal;
      colMap.Descripcion_Ingreso = diVal;
      colMap.DESCRIPCION = diVal;
      colMap.descripcion = diVal;
      colMap.Descripcion = diVal;
      colMap.CONCEPTO = diVal;
      colMap.concepto = diVal;
      colMap.Concepto = diVal;
    }
    if (colMap.CATEGORIA_INGRESO !== undefined || colMap.CATEGORIA !== undefined || colMap.ORIGEN_FUENTE !== undefined) {
      const ciVal = colMap.CATEGORIA_INGRESO !== undefined ? colMap.CATEGORIA_INGRESO : (colMap.CATEGORIA !== undefined ? colMap.CATEGORIA : colMap.ORIGEN_FUENTE);
      colMap.CATEGORIA_INGRESO = ciVal;
      colMap.categoriaIngreso = ciVal;
      colMap.Categoria_Ingreso = ciVal;
      colMap.CATEGORIA = ciVal;
      colMap.categoria = ciVal;
      colMap.Categoria = ciVal;
      colMap.ORIGEN_FUENTE = ciVal;
      colMap.origenFuente = ciVal;
      colMap.Origen_Fuente = ciVal;
    }
    if (colMap.METODO_COBRO !== undefined || colMap.METODO_PAGO !== undefined || colMap.CUENTA_DESTINO !== undefined) {
      const mcVal = colMap.METODO_COBRO !== undefined ? colMap.METODO_COBRO : (colMap.METODO_PAGO !== undefined ? colMap.METODO_PAGO : colMap.CUENTA_DESTINO);
      colMap.METODO_COBRO = mcVal;
      colMap.metodoCobro = mcVal;
      colMap.Metodo_Cobro = mcVal;
      colMap.METODO_PAGO = mcVal;
      colMap.metodoPago = mcVal;
      colMap.Metodo_Pago = mcVal;
      colMap.CUENTA_DESTINO = mcVal;
      colMap.cuentaDestino = mcVal;
      colMap.Cuenta_Destino = mcVal;
    }
    if (colMap.ESTADO_COBRO !== undefined || colMap.ESTADO_PAGO !== undefined || colMap.ESTADO !== undefined || colMap.MODALIDAD !== undefined) {
      const ecVal = colMap.ESTADO_COBRO !== undefined ? colMap.ESTADO_COBRO : (colMap.ESTADO_PAGO !== undefined ? colMap.ESTADO_PAGO : (colMap.ESTADO !== undefined ? colMap.ESTADO : colMap.MODALIDAD));
      colMap.ESTADO_COBRO = ecVal;
      colMap.estadoCobro = ecVal;
      colMap.Estado_Cobro = ecVal;
      colMap.ESTADO_PAGO = ecVal;
      colMap.estadoPago = ecVal;
      colMap.Estado_Pago = ecVal;
      colMap.ESTADO = ecVal;
      colMap.estado = ecVal;
      colMap.Estado = ecVal;
    }

    // Variantes polimórficas para BBDD_Notas (12 Columnas Canónicas A:L)
    if (colMap.ID_NOTA !== undefined || colMap.ID !== undefined) {
      const idNVal = colMap.ID_NOTA !== undefined ? colMap.ID_NOTA : colMap.ID;
      colMap.ID_NOTA = idNVal;
      colMap.ID_Nota = idNVal;
      colMap.idNota = idNVal;
      colMap.id_nota = idNVal;
      colMap.ID = idNVal;
    }
    if (colMap.TITULO !== undefined) {
      colMap.Titulo = colMap.TITULO;
      colMap.titulo = colMap.TITULO;
    }
    if (colMap.CONTENIDO_MARKDOWN !== undefined || colMap.CONTENIDO !== undefined) {
      const cmVal = colMap.CONTENIDO_MARKDOWN !== undefined ? colMap.CONTENIDO_MARKDOWN : colMap.CONTENIDO;
      colMap.CONTENIDO_MARKDOWN = cmVal;
      colMap.Contenido_Markdown = cmVal;
      colMap.contenidoMarkdown = cmVal;
      colMap.CONTENIDO = cmVal;
      colMap.Contenido = cmVal;
      colMap.contenido = cmVal;
    }
    if (colMap.CHECKLISTS_JSON !== undefined || colMap.CHECKLIST !== undefined) {
      const cklVal = colMap.CHECKLISTS_JSON !== undefined ? colMap.CHECKLISTS_JSON : colMap.CHECKLIST;
      colMap.CHECKLISTS_JSON = cklVal;
      colMap.Checklists_JSON = cklVal;
      colMap.checklistsJson = cklVal;
      colMap.CHECKLIST = cklVal;
      colMap.Checklist = cklVal;
      colMap.checklist = cklVal;
    }
    if (colMap.WISHLIST_JSON !== undefined || colMap.WISHLIST !== undefined) {
      const wlVal = colMap.WISHLIST_JSON !== undefined ? colMap.WISHLIST_JSON : colMap.WISHLIST;
      colMap.WISHLIST_JSON = wlVal;
      colMap.Wishlist_JSON = wlVal;
      colMap.wishlistJson = wlVal;
      colMap.WISHLIST = wlVal;
      colMap.Wishlist = wlVal;
      colMap.wishlist = wlVal;
    }
    if (colMap.COLOR_TEMA !== undefined || colMap.COLOR !== undefined) {
      const clrVal = colMap.COLOR_TEMA !== undefined ? colMap.COLOR_TEMA : colMap.COLOR;
      colMap.COLOR_TEMA = clrVal;
      colMap.Color_Tema = clrVal;
      colMap.colorTema = clrVal;
      colMap.COLOR = clrVal;
      colMap.Color = clrVal;
      colMap.color = clrVal;
    }
    if (colMap.ES_FIJADA !== undefined || colMap.FIJADO !== undefined || colMap.PIN !== undefined) {
      const fijVal = colMap.ES_FIJADA !== undefined ? colMap.ES_FIJADA : (colMap.FIJADO !== undefined ? colMap.FIJADO : colMap.PIN);
      colMap.ES_FIJADA = fijVal;
      colMap.Es_Fijada = fijVal;
      colMap.esFijada = fijVal;
      colMap.Fijado = fijVal;
      colMap.fijado = fijVal;
      colMap.Pin = fijVal;
      colMap.pin = fijVal;
    }
    if (colMap.ADJUNTOS_DRIVE_JSON !== undefined || colMap.ADJUNTOS !== undefined || colMap.ARCHIVOS !== undefined) {
      const adjVal = colMap.ADJUNTOS_DRIVE_JSON !== undefined ? colMap.ADJUNTOS_DRIVE_JSON : (colMap.ADJUNTOS !== undefined ? colMap.ADJUNTOS : colMap.ARCHIVOS);
      colMap.ADJUNTOS_DRIVE_JSON = adjVal;
      colMap.Adjuntos_Drive_JSON = adjVal;
      colMap.adjuntosDriveJson = adjVal;
      colMap.ADJUNTOS = adjVal;
      colMap.Adjuntos = adjVal;
      colMap.adjuntos = adjVal;
      colMap.Archivos = adjVal;
    }
    if (colMap.ENLACES_ENTIDADES_JSON !== undefined || colMap.ENLACES_ENTIDADES !== undefined || colMap.VINCULACIONES !== undefined || colMap.VINCULOS_JSON !== undefined || colMap.VINCULOS !== undefined) {
      const vinVal = colMap.ENLACES_ENTIDADES_JSON !== undefined ? colMap.ENLACES_ENTIDADES_JSON : (colMap.ENLACES_ENTIDADES !== undefined ? colMap.ENLACES_ENTIDADES : (colMap.VINCULACIONES !== undefined ? colMap.VINCULACIONES : (colMap.VINCULOS_JSON !== undefined ? colMap.VINCULOS_JSON : colMap.VINCULOS)));
      colMap.ENLACES_ENTIDADES_JSON = vinVal;
      colMap.Enlaces_Entidades_JSON = vinVal;
      colMap.enlacesEntidadesJson = vinVal;
      colMap.ENLACES_ENTIDADES = vinVal;
      colMap.Enlaces_Entidades = vinVal;
      colMap.VINCULACIONES = vinVal;
      colMap.Vinculaciones = vinVal;
      colMap.VINCULOS_JSON = vinVal;
      colMap.Vinculos_JSON = vinVal;
      colMap.VINCULOS = vinVal;
      colMap.Vinculos = vinVal;
      colMap.vinculos = vinVal;
    }
    if (colMap.ETIQUETAS !== undefined || colMap.TAGS !== undefined || colMap.ETIQUETAS_JSON !== undefined) {
      const etVal = colMap.ETIQUETAS !== undefined ? colMap.ETIQUETAS : (colMap.TAGS !== undefined ? colMap.TAGS : colMap.ETIQUETAS_JSON);
      colMap.ETIQUETAS = etVal;
      colMap.Etiquetas = etVal;
      colMap.etiquetas = etVal;
      colMap.TAGS = etVal;
      colMap.Tags = etVal;
      colMap.tags = etVal;
      colMap.ETIQUETAS_JSON = etVal;
      colMap.Etiquetas_JSON = etVal;
    }
    if (colMap.FECHA_CREACION !== undefined) {
      colMap.Fecha_Creacion = colMap.FECHA_CREACION;
      colMap.fechaCreacion = colMap.FECHA_CREACION;
    }
    if (colMap.FECHA_ACTUALIZACION !== undefined) {
      colMap.Fecha_Actualizacion = colMap.FECHA_ACTUALIZACION;
      colMap.fechaActualizacion = colMap.FECHA_ACTUALIZACION;
    }

    // Variantes polimórficas para BBDD_Subtareas_Pasos (6 Columnas Canónicas A:F)
    if (colMap.ID_SUBTAREA !== undefined || colMap.ID !== undefined) {
      const idSubVal = colMap.ID_SUBTAREA !== undefined ? colMap.ID_SUBTAREA : colMap.ID;
      colMap.ID_SUBTAREA = idSubVal;
      colMap.ID_Subtarea = idSubVal;
      colMap.idSubtarea = idSubVal;
      colMap.id_subtarea = idSubVal;
      colMap.ID = idSubVal;
    }
    if (colMap.ID_PADRE_VINCULADO !== undefined || colMap.ID_PADRE !== undefined || colMap.ID_TAREA_PADRE !== undefined || colMap.ID_ACTIVIDAD_PADRE !== undefined) {
      const idPadVal = colMap.ID_PADRE_VINCULADO !== undefined ? colMap.ID_PADRE_VINCULADO : (colMap.ID_PADRE !== undefined ? colMap.ID_PADRE : (colMap.ID_TAREA_PADRE !== undefined ? colMap.ID_TAREA_PADRE : colMap.ID_ACTIVIDAD_PADRE));
      colMap.ID_PADRE_VINCULADO = idPadVal;
      colMap.ID_Padre_Vinculado = idPadVal;
      colMap.idPadreVinculado = idPadVal;
      colMap.ID_PADRE = idPadVal;
      colMap.ID_Padre = idPadVal;
      colMap.idPadre = idPadVal;
      colMap.id_padre = idPadVal;
      colMap.ID_Tarea_Padre = idPadVal;
      colMap.ID_Actividad_Padre = idPadVal;
    }
    if (colMap.NUMERO_PASO !== undefined || colMap.PASO !== undefined || colMap.ORDEN !== undefined) {
      const numPVal = colMap.NUMERO_PASO !== undefined ? colMap.NUMERO_PASO : (colMap.PASO !== undefined ? colMap.PASO : colMap.ORDEN);
      colMap.NUMERO_PASO = numPVal;
      colMap.Numero_Paso = numPVal;
      colMap.numeroPaso = numPVal;
      colMap.paso = numPVal;
      colMap.orden = numPVal;
    }
    if (colMap.DESCRIPCION_PASO !== undefined || colMap.DESCRIPCION !== undefined || colMap.TITULO !== undefined) {
      const descPVal = colMap.DESCRIPCION_PASO !== undefined ? colMap.DESCRIPCION_PASO : (colMap.DESCRIPCION !== undefined ? colMap.DESCRIPCION : colMap.TITULO);
      colMap.DESCRIPCION_PASO = descPVal;
      colMap.Descripcion_Paso = descPVal;
      colMap.descripcionPaso = descPVal;
      colMap.descripcion = descPVal;
      colMap.titulo = descPVal;
    }
    if (colMap.COMPLETADO !== undefined || colMap.CHECK !== undefined || colMap.ESTADO !== undefined) {
      const compVal = colMap.COMPLETADO !== undefined ? colMap.COMPLETADO : (colMap.CHECK !== undefined ? colMap.CHECK : colMap.ESTADO);
      colMap.COMPLETADO = compVal;
      colMap.Completado = compVal;
      colMap.completado = compVal;
      colMap.check = compVal;
      colMap.estado = compVal;
    }
    if (colMap.FECHA_COMPLETADO !== undefined || colMap.FECHA_FINALIZACION !== undefined) {
      const fecCVal = colMap.FECHA_COMPLETADO !== undefined ? colMap.FECHA_COMPLETADO : colMap.FECHA_FINALIZACION;
      colMap.FECHA_COMPLETADO = fecCVal;
      colMap.Fecha_Completado = fecCVal;
      colMap.fechaCompletado = fecCVal;
      colMap.fechaFinalizacion = fecCVal;
    }

    colMap.MAX_COLUMNS = Math.max(maxColCount, headers.length);
    return colMap;
  },

  ALIASES_PROYECTOS: {
    ID_PROYECTO: ["IDPROYECTO", "PROYECTOID", "ID", "CODIGO", "CODIGOPROYECTO"],
    NOMBRE: ["NOMBREPROYECTO", "NOMBRE", "PROYECTO", "TITULO", "INICIATIVA", "NOMBREINICIATIVA"],
    NOMBRE_PROYECTO: ["NOMBREPROYECTO", "NOMBRE", "PROYECTO", "TITULO", "INICIATIVA", "NOMBREINICIATIVA"],
    TIPO_INICIATIVA: ["TIPOINICIATIVA", "TIPO", "CATEGORIA", "CATEGORIAPROYECTO"],
    TIPO: ["TIPOINICIATIVA", "TIPO", "CATEGORIA", "CATEGORIAPROYECTO"],
    MAGNITUD_COMPLEJIDAD: ["MAGNITUDCOMPLEJIDAD", "MAGNITUD", "COMPLEJIDAD", "CATEGORIATSHIRT", "TSHIRT", "TAMANO", "TAMAÑO", "SIZING"],
    TSHIRT: ["CATEGORIATSHIRT", "TSHIRT", "MAGNITUDCOMPLEJIDAD", "MAGNITUD", "COMPLEJIDAD"],
    ARQUETIPO_PROYECTO: ["ARQUETIPOPROYECTO", "ARQUETIPO", "CRITERIODOMINANTE", "CRITERIO", "DRIVER", "ENFOQUE"],
    CRITERIO: ["CRITERIODOMINANTE", "CRITERIO", "ARQUETIPOPROYECTO", "ARQUETIPO", "DRIVER", "ENFOQUE"],
    ESTADO: ["ESTADOPROYECTO", "ESTADO", "STATUS"],
    ESTADO_PROYECTO: ["ESTADOPROYECTO", "ESTADO", "STATUS"],
    HEALTH_STATUS: ["HEALTHSTATUS", "HEALTH", "SALUD", "SEMAFORO"],
    HEALTH: ["HEALTHSTATUS", "HEALTH", "SALUD", "SEMAFORO"],
    AVANCE_REAL_PCT: ["AVANCEREALPCT", "AVANCEREAL", "AVANCE", "AVANCEPCT", "PORCENTAJEAVANCE", "AVANCEPONDERADO"],
    ENTREGABLE_OBJETO: ["ENTREGABLETANGIBLEOBJETO", "ENTREGABLETANGIBLE", "ENTREGABLEOBJETO", "ENTREGABLE", "OBJETO", "PRODUCTOFINAL", "DESCRIPCION", "ALCANCE"],
    OBJETO: ["ENTREGABLETANGIBLEOBJETO", "ENTREGABLETANGIBLE", "ENTREGABLEOBJETO", "ENTREGABLE", "OBJETO", "PRODUCTOFINAL", "DESCRIPCION", "ALCANCE"],
    NORTH_STAR_OKR: ["NORTHSTAROKR", "NORTHSTAR", "OKR", "OBJETIVO", "OBJETIVOESTRATEGICO"],
    OKR: ["NORTHSTAROKR", "NORTHSTAR", "OKR", "OBJETIVO", "OBJETIVOESTRATEGICO"],
    CRITERIOS_DOD: ["CRITERIOSACEPTACIONDOD", "CRITERIOSDOD", "DOD", "CRITERIOSACEPTACION", "DEFINICIONDOD"],
    DOD: ["CRITERIOSACEPTACIONDOD", "CRITERIOSDOD", "DOD", "CRITERIOSACEPTACION", "DEFINICIONDOD"],
    ULTIMA_REVISION: ["ULTIMAREVISION", "ULTIMAFECHACONTROL", "ULTIMOCHECKIN", "FECHACONTROL", "ULTIMAFECHA"],
    FECHA_INICIO_PLAN: ["FECHAINICIOPLAN", "FECHAINICIO", "INICIO", "STARTDATE"],
    FECHA_FIN_PLAN: ["FECHAFINPLAN", "FECHAFIN", "FIN", "FECHALIMITE", "DEADLINE", "ENDDATE"],
    MONEDA_BASE: ["MONEDABASE", "MONEDA", "DIVISA"],
    PRESUPUESTO_TOPE: ["PRESUPUESTOTOPE", "PRESUPUESTO", "PRESUPUESTOAPROBADO", "BUDGET"],
    COSTO_EJECUTADO_PEN: ["COSTOEJECUTADOREALPEN", "COSTOREALPEN", "COSTOPEN", "GASTOPROYECTOPEN", "COSTOEJECUTADOPEN"],
    COSTO_REAL_PEN: ["COSTOEJECUTADOREALPEN", "COSTOREALPEN", "COSTOPEN", "GASTOPROYECTOPEN"],
    COSTO_EJECUTADO_USD: ["COSTOEJECUTADOREALUSD", "COSTOREALUSD", "COSTOUSD", "GASTOPROYECTOUSD", "COSTOEJECUTADOUSD"],
    COSTO_REAL_USD: ["COSTOEJECUTADOREALUSD", "COSTOREALUSD", "COSTOUSD", "GASTOPROYECTOUSD"],
    TERCEROS_INVOLUCRADOS: ["TERCEROSINVOLUCRADOS", "TERCEROS", "STAKEHOLDERS", "EQUIPO", "RESPONSABLES"],
    TERCEROS: ["TERCEROSINVOLUCRADOS", "TERCEROS", "STAKEHOLDERS", "EQUIPO", "RESPONSABLES"],
    ALCANCE_URL_DRIVE: ["ALCANCEDETALLADOURLDRIVE", "URLDRIVE", "DRIVEFOLDERID", "CARPETADRIVE", "LINKDRIVE", "DRIVE", "URLCARPETADRIVE"],
    URL_DRIVE: ["ALCANCEDETALLADOURLDRIVE", "URLDRIVE", "DRIVEFOLDERID", "CARPETADRIVE", "LINKDRIVE", "DRIVE", "URLCARPETADRIVE"]
  },

  ALIASES_HITOS: {
    ID_ELEMENTO_WBS: ["IDELEMENTOWBS", "ELEMENTOWBSID", "IDHITO", "HITOID", "ID", "CODIGO", "CODIGOHITO", "CODIGOWP"],
    ID_HITO: ["IDHITO", "HITOID", "IDELEMENTOWBS", "ELEMENTOWBSID", "ID", "CODIGO"],
    ID_PROYECTO: ["IDPROYECTO", "PROYECTOID", "PROYECTO", "CODIGOPROYECTO"],
    TIPO_ELEMENTO_WBS: ["TIPOELEMENTOWBS", "TIPOMARCADOR", "TIPOWBS", "TIPODELELEMENTO", "TIPOELEMENTO", "TIPO", "NIVELWBS"],
    WBS_CODE: ["WBSCODE", "CODIGOWBS", "WBS", "EDTCODE", "CODIGOEDT"],
    FASE_ASOCIADA: ["FASEASOCIADA", "FASE", "ETAPA"],
    NOMBRE_ELEMENTO: ["NOMBREELEMENTO", "NOMBREHITO", "NOMBRE", "HITO", "TITULO", "ENTREGABLE", "NOMBREENTREGABLE", "PAQUETETRABAJO", "WP"],
    NOMBRE_HITO: ["NOMBREHITO", "NOMBREELEMENTO", "NOMBRE", "HITO", "TITULO", "ENTREGABLE"],
    ESTADO: ["ESTADOHITO", "ESTADOELEMENTO", "ESTADO", "STATUS"],
    ESTADO_HITO: ["ESTADOHITO", "ESTADOELEMENTO", "ESTADO", "STATUS"],
    PESO_PCT: ["PESOPONDERADOPCT", "PESOPCT", "PESO", "PONDERACION", "PESOPORCENTUAL"],
    PESO_PONDERADO_PCT: ["PESOPONDERADOPCT", "PESOPCT", "PESO", "PONDERACION", "PESOPORCENTUAL"],
    FECHA_LIMITE: ["FECHALIMITE", "FECHALIMITEPLAN", "FECHACOMPROMISO", "FECHAFIN", "DEADLINE", "FECHAFINPLAN"],
    FECHA_LIMITE_PLAN: ["FECHALIMITEPLAN", "FECHALIMITE", "FECHACOMPROMISO", "FECHAFIN"],
    FECHA_REAL_FIN: ["FECHAREALFIN", "FECHAFINREAL", "FECHAREAL", "FECHACIERRE"],
    PRESUPUESTO_ASIGNADO: ["PRESUPUESTOASIGNADO", "COSTOASOCIADOESTIMADO", "COSTOESTIMADO", "PRESUPUESTOESTIMADO", "COSTO", "PRESUPUESTO"],
    COSTO_ASOCIADO_ESTIMADO: ["COSTOASOCIADOESTIMADO", "PRESUPUESTOASIGNADO", "COSTOESTIMADO", "PRESUPUESTOESTIMADO", "COSTO"],
    COSTO_ESTIMADO: ["COSTOESTIMADO", "PRESUPUESTOASIGNADO", "COSTOASOCIADOESTIMADO", "PRESUPUESTOESTIMADO", "COSTO"],
    CRITERIO_DOD: ["CRITERIODOD", "CRITERIOSDOD", "CRITERIOACEPTACIONDOD", "DOD", "CRITERIOACEPTACION", "CRITERIOSACEPTACION", "DEFINICIONDOD"],
    CRITERIO_ACEPTACION_DOD: ["CRITERIOACEPTACIONDOD", "CRITERIODOD", "CRITERIOSDOD", "DOD", "CRITERIOACEPTACION", "DEFINICIONDOD"],
    DOD: ["CRITERIOSDOD", "CRITERIODOD", "DOD", "CRITERIOACEPTACION", "DEFINICIONDOD"],
    DEPENDENCIA_PREDECESORA: ["DEPENDENCIAPREDECESORA", "DEPENDENCIAIDHITO", "DEPENDENCIA", "IDDEPENDENCIA", "HITOPREDECESOR", "PREDECESOR"],
    DEPENDENCIA_ID_HITO: ["DEPENDENCIAIDHITO", "DEPENDENCIAPREDECESORA", "DEPENDENCIA", "IDDEPENDENCIA", "PREDECESOR"],
    DEPENDENCIA: ["DEPENDENCIA", "DEPENDENCIAPREDECESORA", "DEPENDENCIAIDHITO", "IDDEPENDENCIA"],
    ENTREGABLE_LINK: ["ENTREGABLELINK", "ENTREGABLEVERIFICABLELINK", "LINKENTREGABLE", "URLENTREGABLE", "ENTREGABLEURL"],
    ENTREGABLE_VERIFICABLE_LINK: ["ENTREGABLEVERIFICABLELINK", "ENTREGABLELINK", "LINKENTREGABLE", "URLENTREGABLE", "ENTREGABLEURL"],
    LINK_ENTREGABLE: ["LINKENTREGABLE", "ENTREGABLELINK", "ENTREGABLEVERIFICABLELINK", "URLENTREGABLE"]
  },

  ALIASES_TAREAS: {
    ID_TAREA: [
      "IDTAREA", "TAREAID", "ID", "CODIGO", "CODIGOTAREA",
      "ID_TAREA", "TAREA_ID", "CODIGO_TAREA", "ID TAREA", "TAREA ID", "CODIGO TAREA"
    ],
    ID_HITO: [
      "IDHITO", "HITOID", "HITO", "CODIGOHITO",
      "ID_HITO", "HITO_ID", "CODIGO_HITO", "ID HITO", "HITO ID", "CODIGO HITO",
      "ID_HITO_ASOCIADO", "IDHITOASOCIADO", "HITO_ASOCIADO", "HITOASOCIADO",
      "ID_HITO_FK", "IDHITOFK", "FK_HITO", "FKHITO", "HITO_PADRE", "HITOPADRE"
    ],
    ID_PROYECTO: [
      "IDPROYECTO", "PROYECTOID", "PROYECTO", "CODIGOPROYECTO",
      "ID_PROYECTO", "PROYECTO_ID", "CODIGO_PROYECTO", "ID PROYECTO", "PROYECTO ID", "CODIGO PROYECTO",
      "ID_PROY", "IDPROY", "PROY_ID", "PROYID", "ID_PROYECTO_ASOCIADO", "IDPROYECTOASOCIADO",
      "PROYECTO_ASOCIADO", "PROYECTOASOCIADO", "ID_PROYECTO_FK", "IDPROYECTOFK",
      "FK_PROYECTO", "FKPROYECTO", "PROYECTO_PADRE", "PROYECTOPADRE"
    ],
    NOMBRE_TAREA: ["NOMBRETAREAACTIVIDAD", "NOMBRETAREA", "NOMBRE", "TAREA", "TITULO", "ACTIVIDAD"],
    ESTADO: ["ESTADOTAREA", "ESTADO", "STATUS"],
    PRIORIDAD: ["PRIORIDADEISENHOWER", "PRIORIDAD", "EISENHOWER", "URGENCIA"],
    NIVEL_ENERGIA: ["NIVELENERGIAREQUERIDO", "NIVELENERGIA", "ENERGIA"],
    HORAS_ESTIMADAS: ["HORASESTIMADAS", "HORASPLAN", "ESTIMACIONHORAS", "DURACION", "HORAS"],
    HORAS_REALES: ["HORASREALES", "HORASEJECUTADAS"],
    FECHA_PROGRAMADA: ["FECHAPROGRAMADA", "FECHAINICIO", "FECHA", "FECHAPLAN", "FECHALIMITE", "FECHAFIN"],
    AGENDADO_CALENDAR: ["AGENDADOCALENDAR", "EVENTOCALENDARID", "CALENDARID", "CALENDAR", "AGENDADO", "EVENTOCALENDAR"],
    ID_DEPENDENCIA: ["IDDEPENDENCIA", "DEPENDENCIAID", "DEPENDENCIA", "PREDECESORA", "PREDECESOR"],
    RESPONSABLE: ["RESPONSABLEEJECUTOR", "RESPONSABLE", "EJECUTOR", "ASIGNADO"],
    NOTAS: ["NOTASIMPEDIMENTOS", "NOTAS", "IMPEDIMENTOS", "OBSERVACIONES", "DESCRIPCION"]
  },

  ALIASES_ACTIVIDADES_PERSONALES: {
    ID_ACTIVIDAD: ["IDACTIVIDAD", "ACTIVIDADID", "ID", "CODIGO", "ID_ACTIVIDAD", "ACTIVIDAD_ID"],
    NOMBRE: ["NOMBREACTIVIDAD", "NOMBRE", "ACTIVIDAD", "TITULO", "NOMBRE_ACTIVIDAD"],
    NOMBRE_ACTIVIDAD: ["NOMBREACTIVIDAD", "NOMBRE", "ACTIVIDAD", "TITULO", "NOMBRE_ACTIVIDAD"],
    TIPO_REGISTRO: ["TIPOREGISTRO", "TIPOCOMPROMISO", "TIPO", "COMPROMISO", "TIPO_REGISTRO", "TIPO_COMPROMISO"],
    TIPO_COMPROMISO: ["TIPOCOMPROMISO", "TIPOREGISTRO", "TIPO", "COMPROMISO", "TIPO_COMPROMISO", "TIPO_REGISTRO"],
    CATEGORIA_VIDA: ["CATEGORIAVIDA", "CATEGORIA", "RUBRO", "DIMENSION", "CATEGORIA_VIDA"],
    META_MACRO_NOMBRE: ["METAMACRONOMBRE", "METAMACRO", "MACROMETA", "OKR", "OBJETIVO", "META_MACRO_NOMBRE", "META_MACRO"],
    UNIDAD_MEDIDA: ["UNIDADMEDIDA", "UNIDAD", "MEDIDA", "METRICA", "UNIDAD_MEDIDA"],
    META_OBJETIVO_TOTAL: ["METAOBJETIVOTOTAL", "METATOTAL", "OBJETIVOTOTAL", "TOTALMETA", "META_OBJETIVO_TOTAL", "META_TOTAL"],
    VALOR_ACUMULADO_ACTUAL: ["VALORACUMULADOACTUAL", "VALORACUMULADO", "ACUMULADOACTUAL", "ACUMULADO", "PROGRESO", "VALOR_ACUMULADO_ACTUAL"],
    META_DIARIA_ESTANDAR: ["METADIARIAESTANDAR", "METADIARIA", "OBJETIVODIARIO", "DIARIAESTANDAR", "META_DIARIA_ESTANDAR", "META_DIARIA"],
    NIVEL_RESCATE_MINIMO: ["NIVELRESCATEMINIMO", "RESCATEMINIMO", "NIVELMINIMO", "UMBRALRESCATE", "RESCATE", "NIVEL_RESCATE_MINIMO"],
    ESTADO: ["ESTADOACTIVIDAD", "ESTADO", "STATUS", "ESTADO_ACTIVIDAD"],
    RACHA_ACTUAL: ["RACHAACTUAL", "RACHA", "STREAK", "RACHA_ACTUAL"],
    FECHA_PROGRAMADA: ["FECHAPROGRAMADA", "FECHA", "FECHAPLAN", "FECHA_PROGRAMADA"],
    HORA_INICIO: ["HORAINICIO", "HORA", "TIME", "HORA_INICIO"],
    AGENDADO_CALENDAR: ["AGENDADOCALENDAR", "AGENDADO", "CALENDARID", "EVENTOID", "AGENDADO_CALENDAR"],
    ID_EVENTO_CALENDAR: ["IDEVENTOCALENDAR", "EVENTOCALENDAR", "EVENTOID", "ID_EVENTO_CALENDAR"],
    // Retrocompatibilidad con atributos extendidos
    PRIORIDAD_EISENHOWER: ["PRIORIDADEISENHOWER", "PRIORIDAD", "EISENHOWER"],
    FRECUENCIA_CICLO: ["FRECUENCIACICLO", "FRECUENCIA", "CICLO"],
    REGLA_REPETICION: ["REGLAREPETICION", "REPETICION", "REGLA"],
    DURACION_HORAS: ["DURACIONHORAS", "DURACION", "HORAS"],
    MONTO_GASTO_ASOCIADO: ["MONTOGASTOASOCIADO", "GASTOASOCIADO", "MONTO"],
    NOTAS_CHECKLIST: ["NOTASCHECKLIST", "CHECKLIST", "NOTAS", "DESCRIPCION"]
  },

  ALIASES_FINANZAS: {
    ID_GASTO: ["IDGASTO", "GASTOID", "CODIGOGASTO", "ID", "CODIGO", "IDTRANSACCION", "ID_GASTO", "ID_TRANSACCION"],
    ID_TRANSACCION: ["IDTRANSACCION", "IDGASTO", "GASTOID", "ID", "CODIGO", "ID_TRANSACCION", "ID_GASTO"],
    TIPO_ORIGEN: ["TIPOORIGEN", "CLASIFICACIONORIGEN", "TIPOGASTO", "CLASIFICACION", "ORIGEN", "AMBITO", "TIPO_ORIGEN", "CLASIFICACION_ORIGEN", "TIPO_GASTO"],
    CLASIFICACION_ORIGEN: ["CLASIFICACIONORIGEN", "TIPOORIGEN", "CLASIFICACION", "ORIGEN", "AMBITO", "TIPOGASTO", "CLASIFICACION_ORIGEN", "TIPO_ORIGEN"],
    TIPO_GASTO: ["TIPOGASTO", "TIPOORIGEN", "TIPODEGASTO", "CLASIFICACIONORIGEN", "TIPO_GASTO", "TIPO_ORIGEN"],
    ID_ORIGEN_VINCULADO: ["IDORIGENVINCULADO", "IDENTIDADVINCULADA", "ENTIDADVINCULADA", "IDVINCULADO", "IDREFERENCIA", "IDTAREA", "IDACTIVIDAD", "ID_ORIGEN_VINCULADO", "ID_ENTIDAD_VINCULADA"],
    ID_ENTIDAD_VINCULADA: ["IDENTIDADVINCULADA", "IDORIGENVINCULADO", "ENTIDADVINCULADA", "IDVINCULADO", "IDREFERENCIA", "IDTAREA", "IDACTIVIDAD", "ID_ENTIDAD_VINCULADA", "ID_ORIGEN_VINCULADO"],
    ID_TAREA: ["IDTAREA", "TAREAID", "TAREA", "IDORIGENVINCULADO", "IDENTIDADVINCULADA", "ID_TAREA"],
    ID_ACTIVIDAD: ["IDACTIVIDAD", "ACTIVIDADID", "ACTIVIDAD", "IDORIGENVINCULADO", "ID_ACTIVIDAD"],
    ID_CUOTA: ["IDCUOTA", "CUOTAID", "CUOTA", "IDDEUDA", "DEUDAID", "ID_CUOTA"],
    FECHA_GASTO: ["FECHAGASTO", "FECHAREGISTRO", "FECHADEPAGO", "FECHAPAGO", "FECHA", "FECHACOMPROMISO", "FECHA_GASTO", "FECHA_REGISTRO"],
    FECHA_REGISTRO: ["FECHAREGISTRO", "FECHAGASTO", "FECHACOMPROMISO", "FECHA", "FECHA_REGISTRO", "FECHA_GASTO"],
    FECHA_COMPROMISO: ["FECHACOMPROMISO", "FECHALIMITE", "FECHAVENCIMIENTO", "FECHAGASTO", "FECHA_COMPROMISO"],
    DESCRIPCION_GASTO: ["DESCRIPCIONGASTO", "DESCRIPCION", "CONCEPTO", "GLOSA", "DETALLE", "DESCRIPCION_GASTO"],
    DESCRIPCION: ["DESCRIPCION", "CONCEPTO", "DESCRIPCIONGASTO", "GLOSA", "DETALLE"],
    CONCEPTO: ["CONCEPTO", "DESCRIPCION", "DESCRIPCIONGASTO", "GLOSA", "DETALLE"],
    CATEGORIA_GASTO: ["CATEGORIAGASTO", "CATEGORIA", "RUBRO", "CATEGORIA_GASTO"],
    CATEGORIA: ["CATEGORIA", "CATEGORIAGASTO", "RUBRO"],
    MONEDA_ORIGINAL: ["MONEDAORIGINAL", "MONEDA", "DIVISA", "MONEDA_ORIGINAL"],
    MONTO_ORIGINAL: ["MONTOORIGINAL", "MONTO", "IMPORTE", "MONTO_ORIGINAL"],
    MONTO: ["MONTO", "MONTOORIGINAL", "IMPORTE"],
    TIPO_CAMBIO: ["TIPOCAMBIO", "TC", "TIPO_CAMBIO"],
    MONTO_PEN: ["MONTOPEN", "MONTOMONEDABASE", "SOLES", "MONEDABASE", "MONTOBASE", "PEN", "MONTO_PEN", "MONTO_MONEDA_BASE"],
    MONTO_MONEDA_BASE: ["MONTOMONEDABASE", "MONTOPEN", "SOLES", "MONEDABASE", "MONTOBASE", "PEN", "MONTO_MONEDA_BASE", "MONTO_PEN"],
    METODO_PAGO: ["METODOPAGO", "METODO", "FORMAPAGO", "CUENTA", "METODO_PAGO"],
    ESTADO_PAGO: ["ESTADOPAGO", "ESTADO", "STATUS", "MODALIDAD", "ESTADO_PAGO"],
    ESTADO: ["ESTADO", "ESTADOPAGO", "STATUS"],
    MODALIDAD: ["MODALIDAD", "TIPOEJECUCION", "REGIMEN", "ESTADOPAGO"],
    COMPROBANTE_URL: ["COMPROBANTEURL", "FACTURAURL", "URLDRIVE", "COMPROBANTE", "COMPROBANTENOTAS", "VOUCHERURL", "VOUCHER", "COMPROBANTE_URL"],
    // Retrocompatibilidad con atributos extendidos si existen en hojas físicas
    ID_PROYECTO: ["IDPROYECTO", "PROYECTOID", "PROYECTO"],
    ID_HITO: ["IDHITO", "HITOID", "HITO"],
    TIPO_ENTIDAD: ["TIPOENTIDAD", "ENTIDADTIPO", "NIVELENTIDAD"],
    MONTO_USD: ["MONTOUSD", "DOLARES", "USD"],
    ID_GOOGLE_TASK: ["IDGOOGLETASK", "GOOGLETASK", "TASKID"],
    ID_EVENTO_CALENDAR: ["IDEVENTOCALENDAR", "EVENTOCALENDAR", "EVENTID", "CALENDARID", "IDGOOGLEEVENT"],
    ID_GOOGLE_EVENT: ["IDGOOGLEEVENT", "IDEVENTOCALENDAR", "EVENTOCALENDAR", "EVENTID", "CALENDARID"]
  },

  ALIASES_INGRESOS: {
    ID_INGRESO: ["IDINGRESO", "INGRESOID", "ID", "CODIGO", "IDTRANSACCION", "ID_INGRESO", "ID_TRANSACCION"],
    ID_TRANSACCION: ["IDTRANSACCION", "IDINGRESO", "INGRESOID", "ID", "CODIGO", "ID_TRANSACCION", "ID_INGRESO"],
    TIPO_ORIGEN: ["TIPOORIGEN", "TIPOINGRESO", "CLASIFICACIONORIGEN", "CLASIFICACION", "ORIGEN", "AMBITO", "TIPO_ORIGEN", "TIPO_INGRESO", "CLASIFICACION_ORIGEN"],
    TIPO_INGRESO: ["TIPOINGRESO", "TIPOORIGEN", "TIPO_INGRESO", "TIPO_ORIGEN", "CLASIFICACIONORIGEN"],
    CLASIFICACION_ORIGEN: ["CLASIFICACIONORIGEN", "TIPOORIGEN", "TIPOINGRESO", "ORIGEN", "AMBITO", "CLASIFICACION_ORIGEN", "TIPO_ORIGEN"],
    ID_ORIGEN_VINCULADO: ["IDORIGENVINCULADO", "IDENTIDADVINCULADA", "IDPROYECTO", "IDPROYECTOASOCIADO", "IDACTIVIDAD", "IDTAREA", "ID_ORIGEN_VINCULADO", "ID_ENTIDAD_VINCULADA", "ID_PROYECTO", "ID_PROYECTO_ASOCIADO"],
    ID_ENTIDAD_VINCULADA: ["IDENTIDADVINCULADA", "IDORIGENVINCULADO", "IDPROYECTO", "IDPROYECTOASOCIADO", "ID_ENTIDAD_VINCULADA", "ID_ORIGEN_VINCULADO"],
    ID_PROYECTO: ["IDPROYECTO", "IDPROYECTOASOCIADO", "IDORIGENVINCULADO", "IDENTIDADVINCULADA", "ID_PROYECTO"],
    ID_PROYECTO_ASOCIADO: ["IDPROYECTOASOCIADO", "IDPROYECTO", "IDORIGENVINCULADO", "IDENTIDADVINCULADA", "ID_PROYECTO_ASOCIADO"],
    FECHA_INGRESO: ["FECHAINGRESO", "FECHAREGISTRO", "FECHA", "FECHACOMPROMISO", "FECHA_INGRESO", "FECHA_REGISTRO", "FECHA_COMPROMISO"],
    FECHA_REGISTRO: ["FECHAREGISTRO", "FECHAINGRESO", "FECHA", "FECHACOMPROMISO", "FECHA_REGISTRO", "FECHA_INGRESO"],
    FECHA: ["FECHA", "FECHAINGRESO", "FECHAREGISTRO", "FECHACOMPROMISO"],
    FECHA_COMPROMISO: ["FECHACOMPROMISO", "FECHAINGRESO", "FECHAREGISTRO", "FECHA"],
    DESCRIPCION_INGRESO: ["DESCRIPCIONINGRESO", "DESCRIPCION", "CONCEPTO", "DETALLE", "GLOSA", "DESCRIPCION_INGRESO"],
    DESCRIPCION: ["DESCRIPCION", "DESCRIPCIONINGRESO", "CONCEPTO", "DETALLE", "GLOSA"],
    CONCEPTO: ["CONCEPTO", "DESCRIPCIONINGRESO", "DESCRIPCION", "DETALLE", "GLOSA"],
    CATEGORIA_INGRESO: ["CATEGORIAINGRESO", "CATEGORIA", "ORIGENFUENTE", "RUBRO", "FUENTE", "CATEGORIA_INGRESO", "ORIGEN_FUENTE"],
    CATEGORIA: ["CATEGORIA", "CATEGORIAINGRESO", "ORIGENFUENTE", "RUBRO", "FUENTE"],
    ORIGEN_FUENTE: ["ORIGENFUENTE", "CATEGORIAINGRESO", "CATEGORIA", "FUENTE", "RUBRO", "ORIGEN_FUENTE"],
    MONEDA_ORIGINAL: ["MONEDAORIGINAL", "MONEDA", "DIVISA", "MONEDA_ORIGINAL"],
    MONEDA: ["MONEDA", "MONEDAORIGINAL", "DIVISA"],
    MONTO_ORIGINAL: ["MONTOORIGINAL", "MONTO", "IMPORTE", "MONTO_ORIGINAL"],
    MONTO: ["MONTO", "MONTOORIGINAL", "IMPORTE"],
    TIPO_CAMBIO: ["TIPOCAMBIO", "TC", "TIPO_CAMBIO"],
    TC: ["TC", "TIPOCAMBIO"],
    MONTO_PEN: ["MONTOPEN", "MONTOMONEDABASE", "SOLES", "MONEDABASE", "MONTOBASE", "PEN", "MONTO_PEN", "MONTO_MONEDA_BASE"],
    MONTO_MONEDA_BASE: ["MONTOMONEDABASE", "MONTOPEN", "SOLES", "MONEDABASE", "MONTOBASE", "PEN", "MONTO_MONEDA_BASE", "MONTO_PEN"],
    METODO_COBRO: ["METODOCOBRO", "METODOPAGO", "CUENTADESTINO", "CUENTA", "BANCO", "METODO_COBRO", "METODO_PAGO", "CUENTA_DESTINO"],
    METODO_PAGO: ["METODOPAGO", "METODOCOBRO", "CUENTADESTINO", "CUENTA", "BANCO", "METODO_PAGO", "METODO_COBRO"],
    CUENTA_DESTINO: ["CUENTADESTINO", "METODOCOBRO", "METODOPAGO", "CUENTA", "BANCO", "CUENTA_DESTINO"],
    ESTADO_COBRO: ["ESTADOCOBRO", "ESTADOPAGO", "ESTADO", "STATUS", "MODALIDAD", "ESTADO_COBRO", "ESTADO_PAGO"],
    ESTADO_PAGO: ["ESTADOPAGO", "ESTADOCOBRO", "ESTADO", "STATUS", "MODALIDAD", "ESTADO_PAGO"],
    ESTADO: ["ESTADO", "ESTADOCOBRO", "ESTADOPAGO", "STATUS", "MODALIDAD"],
    MODALIDAD: ["MODALIDAD", "ESTADOCOBRO", "ESTADOPAGO", "ESTADO"],
    // Retrocompatibilidad con atributos extendidos si existen en hojas físicas
    COMPROBANTE_URL: ["COMPROBANTEURL", "FACTURAURL", "URLDRIVE", "COMPROBANTE", "COMPROBANTENOTAS", "VOUCHERURL", "VOUCHER", "COMPROBANTE_URL"],
    ID_GOOGLE_TASK: ["IDGOOGLETASK", "GOOGLETASK", "TASKID"],
    ID_EVENTO_CALENDAR: ["IDEVENTOCALENDAR", "EVENTOCALENDAR", "EVENTOID", "IDGOOGLEEVENT"],
    ID_GOOGLE_EVENT: ["IDGOOGLEEVENT", "IDEVENTOCALENDAR", "EVENTOCALENDAR", "EVENTOID"]
  },

  ALIASES_NOTAS: {
    ID_NOTA:                ["ID_NOTA", "IDNOTA", "ID_Nota", "ID", "ID NOTA", "CODIGO"],
    TITULO:                 ["TITULO", "Titulo", "TITLE", "ASUNTO", "NOMBRE"],
    CONTENIDO_MARKDOWN:     ["CONTENIDO_MARKDOWN", "Contenido_Markdown", "CONTENIDO", "Contenido", "CONTENT", "MARKDOWN", "TEXTO", "DESCRIPCION"],
    CHECKLISTS_JSON:        ["CHECKLISTS_JSON", "Checklists_JSON", "CHECKLIST_JSON", "CHECKLIST", "Checklist", "CHECKLISTS", "Checklists", "TAREAS_JSON"],
    WISHLIST_JSON:          ["WISHLIST_JSON", "Wishlist_JSON", "WISHLIST", "Wishlist", "DESEOS_JSON", "DESEO_JSON"],
    COLOR_TEMA:             ["COLOR_TEMA", "Color_Tema", "COLOR", "Color", "TEMA", "Tema"],
    ES_FIJADA:              ["ES_FIJADA", "Es_Fijada", "FIJADO", "Fijado", "PIN", "Pin", "ESFIJADA", "FIJADA", "DESTACADO"],
    ADJUNTOS_DRIVE_JSON:    ["ADJUNTOS_DRIVE_JSON", "Adjuntos_Drive_JSON", "ADJUNTOS", "Adjuntos", "ARCHIVOS", "Archivos", "ATTACHMENTS"],
    ENLACES_ENTIDADES_JSON: ["ENLACES_ENTIDADES_JSON", "Enlaces_Entidades_JSON", "ENLACES_ENTIDADES", "Enlaces_Entidades", "VINCULACIONES", "Vinculaciones", "VINCULOS_JSON", "Vinculos_JSON", "VINCULOS", "Vinculos", "LINKS"],
    ETIQUETAS:              ["ETIQUETAS", "Etiquetas", "TAGS", "Tags", "ETIQUETAS_JSON", "Etiquetas_JSON", "CATEGORIAS"],
    FECHA_CREACION:         ["FECHA_CREACION", "Fecha_Creacion", "FECHACREACION", "CREATED_AT", "FECHA_CREADO"],
    FECHA_ACTUALIZACION:    ["FECHA_ACTUALIZACION", "Fecha_Actualizacion", "FECHAACTUALIZACION", "UPDATED_AT", "FECHA_MODIFICACION"]
  },

  // ── Fase 4.14: Catálogo canónico de aliases tolerantes para Subtareas / Pasos (6 Columnas A:F)
  ALIASES_SUBTAREAS: {
    ID_SUBTAREA:        ["ID_SUBTAREA", "ID_Subtarea", "IDSUBTAREA", "ID", "CODIGO", "ID_PASO"],
    ID_PADRE_VINCULADO: ["ID_PADRE_VINCULADO", "ID_Padre_Vinculado", "ID_PADRE", "ID_Padre", "IDPADRE", "ID_TAREA_PADRE", "ID_Tarea_Padre", "ID_ACTIVIDAD_PADRE", "ID_Actividad_Padre", "ID_ORIGEN", "PADRE_ID"],
    NUMERO_PASO:        ["NUMERO_PASO", "Numero_Paso", "NUMEROPASO", "PASO", "Paso", "ORDEN", "Orden", "NUMERO", "STEP"],
    DESCRIPCION_PASO:   ["DESCRIPCION_PASO", "Descripcion_Paso", "DESCRIPCIONPASO", "DESCRIPCION", "Descripcion", "TITULO", "Titulo", "NOMBRE", "PASO_DESC"],
    COMPLETADO:         ["COMPLETADO", "Completado", "CHECK", "Check", "ESTADO", "Estado", "DONE", "REALIZADO", "IS_DONE"],
    FECHA_COMPLETADO:   ["FECHA_COMPLETADO", "Fecha_Completado", "FECHACOMPLETADO", "FECHA_FINALIZACION", "Fecha_Finalizacion", "COMPLETED_AT", "FECHA_FIN"]
  },

  obtenerMapaProyectos: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_PROYECTOS, CONFIG.ALIASES_PROYECTOS);
  },

  obtenerMapaHitos: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_HITOS, CONFIG.ALIASES_HITOS);
  },

  obtenerMapaTareas: function(sheetOrHeaders) {
    const map = CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_TAREAS, CONFIG.ALIASES_TAREAS);
    // Salvaguarda canónica: garantizar que ID_PROYECTO no se contamine con ID_TAREA (índice 0)
    if (map.ID_PROYECTO === undefined || map.ID_PROYECTO === map.ID_TAREA) {
      map.ID_PROYECTO = (CONFIG.COLS_TAREAS && CONFIG.COLS_TAREAS.ID_PROYECTO !== undefined) ? CONFIG.COLS_TAREAS.ID_PROYECTO : 2;
    }
    // Exportación polimórfica garantizada para variantes con guion bajo, camelCase o pegadas
    if (map.ID_PROYECTO !== undefined) {
      map.IDPROYECTO = map.ID_PROYECTO;
      map.idProyecto = map.ID_PROYECTO;
      map.id_proyecto = map.ID_PROYECTO;
      map.ID_Proyecto = map.ID_PROYECTO;
    }
    if (map.ID_HITO !== undefined) {
      map.IDHITO = map.ID_HITO;
      map.idHito = map.ID_HITO;
      map.id_hito = map.ID_HITO;
      map.ID_Hito = map.ID_HITO;
    }
    if (map.ID_TAREA !== undefined) {
      map.IDTAREA = map.ID_TAREA;
      map.idTarea = map.ID_TAREA;
      map.id_tarea = map.ID_TAREA;
      map.ID_Tarea = map.ID_TAREA;
    }
    return map;
  },

  obtenerMapaActividades: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_ACTIVIDADES_PERSONALES, CONFIG.ALIASES_ACTIVIDADES_PERSONALES);
  },

  obtenerMapaIngresos: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_INGRESOS, CONFIG.ALIASES_INGRESOS);
  },

  obtenerMapaFinanzas: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_FINANZAS, CONFIG.ALIASES_FINANZAS);
  },

  obtenerMapaGastos: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_FINANZAS, CONFIG.ALIASES_FINANZAS);
  },

  obtenerMapaNotas: function(sheetOrHeaders) {
    return CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_NOTAS, CONFIG.ALIASES_NOTAS);
  },

  obtenerMapaSubtareas: function(sheetOrHeaders) {
    const map = CONFIG.construirMapaColumnas(sheetOrHeaders, CONFIG.COLS_SUBTAREAS, CONFIG.ALIASES_SUBTAREAS);
    // Detección tolerante de hoja legacy con 7 columnas (donde existía 'Tipo_Padre' en Col B e 'ID_Padre' en Col C)
    let rawHeaders = [];
    if (Array.isArray(sheetOrHeaders)) {
      rawHeaders = sheetOrHeaders;
    } else if (sheetOrHeaders && typeof sheetOrHeaders.getRange === 'function') {
      const lastCol = sheetOrHeaders.getLastColumn();
      if (lastCol > 0) {
        rawHeaders = sheetOrHeaders.getRange(1, 1, 1, lastCol).getValues()[0] || [];
      }
    }
    if (rawHeaders.length >= 7) {
      const h1 = String(rawHeaders[1] || "").trim().toLowerCase();
      const h2 = String(rawHeaders[2] || "").trim().toLowerCase();
      if (h1.includes("tipo") && (h2.includes("padre") || h2.includes("id"))) {
        map.TIPO_PADRE = 1;
        map.Tipo_Padre = 1;
        map.tipoPadre = 1;
        map.ID_PADRE_VINCULADO = 2; // En legacy, ID_Padre está en Col C (índice 2)
        map.ID_Padre_Vinculado = 2;
        map.idPadreVinculado = 2;
        map.ID_PADRE = 2;
        map.ID_Padre = 2;
        map.idPadre = 2;
        map.NUMERO_PASO = 3;
        map.Numero_Paso = 3;
        map.numeroPaso = 3;
        map.DESCRIPCION_PASO = 4;
        map.Descripcion_Paso = 4;
        map.descripcionPaso = 4;
        map.COMPLETADO = 5;
        map.Completado = 5;
        map.completado = 5;
        map.FECHA_COMPLETADO = 6;
        map.Fecha_Completado = 6;
        map.fechaCompletado = 6;
      }
    }
    return map;
  },

  obtenerMapaPasos: function(sheetOrHeaders) {
    return CONFIG.obtenerMapaSubtareas(sheetOrHeaders);
  },

  obtenerHojaGastos: function(ss) {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const candidatos = [
      (CONFIG.SHEETS && CONFIG.SHEETS.FINANZAS),
      "BBDD_Finanzas_Gastos",
      "BBDD_Gastos",
      "BBDD_Finanzas",
      "Gastos"
    ];
    for (let i = 0; i < candidatos.length; i++) {
      if (candidatos[i]) {
        const sh = ss.getSheetByName(candidatos[i]);
        if (sh) return sh;
      }
    }
    const sheets = ss.getSheets();
    for (let j = 0; j < sheets.length; j++) {
      const n = sheets[j].getName().toLowerCase().replace(/[\s_\-]/g, "");
      if (n === "bbddfinanzasgastos" || n === "bbddgastos" || n === "gastos") {
        return sheets[j];
      }
    }
    return ss.getSheetByName(CONFIG.SHEETS.FINANZAS);
  },

  obtenerHojaIngresos: function(ss) {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const candidatos = [
      (CONFIG.SHEETS && CONFIG.SHEETS.INGRESOS),
      "BBDD_Finanzas_Ingresos",
      "BBDD_Ingresos",
      "Ingresos"
    ];
    for (let i = 0; i < candidatos.length; i++) {
      if (candidatos[i]) {
        const sh = ss.getSheetByName(candidatos[i]);
        if (sh) return sh;
      }
    }
    const sheets = ss.getSheets();
    for (let j = 0; j < sheets.length; j++) {
      const n = sheets[j].getName().toLowerCase().replace(/[\s_\-]/g, "");
      if (n === "bbddfinanzasingresos" || n === "bbddingresos" || n === "ingresos") {
        return sheets[j];
      }
    }
    return ss.getSheetByName(CONFIG.SHEETS.INGRESOS);
  },

  normalizarCategoriaVida: function(catRaw) {
    const raw = String(catRaw || "").trim().toUpperCase().replace(/[\s-]/g, "_");
    if (raw === "SALUD_DEPORTE" || raw === "SALUD" || raw === "DEPORTE") return "SALUD_DEPORTE";
    if (raw === "DESARROLLO_PERSONAL" || raw === "DESARROLLO_ESTUDIO" || raw === "ESTUDIO" || raw === "DESARROLLO") return "DESARROLLO_ESTUDIO";
    if (raw === "FINANZAS_ADMIN" || raw === "FINANZAS_TRAMITES" || raw === "FINANZAS" || raw === "ADMIN" || raw === "TRAMITES") return "FINANZAS_TRAMITES";
    if (raw === "HOGAR_FAMILIA" || raw === "SOCIAL_FAMILIA" || raw === "HOGAR" || raw === "FAMILIA" || raw === "SOCIAL") return "SOCIAL_FAMILIA";
    if (raw === "OCIO_SOCIAL" || raw === "PERSONAL_DESCANSO" || raw === "OCIO" || raw === "DESCANSO" || raw === "PERSONAL") return "PERSONAL_DESCANSO";
    if (raw === "TRABAJO_CARRERA" || raw === "LABORAL_HONORARIO" || raw === "TRABAJO" || raw === "LABORAL" || raw === "CARRERA" || raw === "HONORARIO") return "LABORAL_HONORARIO";
    return "SALUD_DEPORTE";
  },

  CATEGORIAS_VIDA_CONFIG: {
    SALUD_DEPORTE: {
      clave: "SALUD_DEPORTE",
      nombre: "Salud & Deporte",
      icono: "🏃",
      color: "#10b981",
      colorBarra: "bg-emerald-500",
      badgeClase: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
    },
    DESARROLLO_ESTUDIO: {
      clave: "DESARROLLO_ESTUDIO",
      nombre: "Desarrollo Personal",
      icono: "📚",
      color: "#3b82f6",
      colorBarra: "bg-blue-500",
      badgeClase: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50"
    },
    LABORAL_HONORARIO: {
      clave: "LABORAL_HONORARIO",
      nombre: "Trabajo & Carrera",
      icono: "💼",
      color: "#8b5cf6",
      colorBarra: "bg-violet-500",
      badgeClase: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50"
    },
    FINANZAS_TRAMITES: {
      clave: "FINANZAS_TRAMITES",
      nombre: "Finanzas & Admin",
      icono: "💳",
      color: "#a855f7",
      colorBarra: "bg-purple-500",
      badgeClase: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50"
    },
    SOCIAL_FAMILIA: {
      clave: "SOCIAL_FAMILIA",
      nombre: "Hogar & Familia",
      icono: "👥",
      color: "#f59e0b",
      colorBarra: "bg-amber-500",
      badgeClase: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
    },
    PERSONAL_DESCANSO: {
      clave: "PERSONAL_DESCANSO",
      nombre: "Ocio & Social",
      icono: "🧘",
      color: "#ec4899",
      colorBarra: "bg-pink-500",
      badgeClase: "bg-pink-50 text-pink-700 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/50"
    }
  }
};

CONFIG.COLS_GASTOS = CONFIG.COLS_FINANZAS;
CONFIG.COLS_PASOS = CONFIG.COLS_SUBTAREAS;
CONFIG.ALIASES_PASOS = CONFIG.ALIASES_SUBTAREAS;

// ============================================================================
// 2. UTILIDADES DE CONFIGURACIÓN Y DIAGNÓSTICO
// ============================================================================
function verificarClaveGemini() {
  const clave = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (clave && clave.length > 10) {
    Logger.log("Configuración exitosa: Clave detectada correctamente.");
  } else {
    Logger.log("Error: No se encontró la propiedad GEMINI_API_KEY o está vacía.");
  }
}

/**
 * Autocreación transparente de la hoja BBDD_Decisiones_TradeOff si no existe en el libro.
 * Garantiza cero fricción y cero intervención manual requerida para el usuario.
 */
function verificarYCrearHojaTradeOff() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEETS.DECISIONES_TRADEOFF);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.DECISIONES_TRADEOFF);
      const headers = [
        "ID_Decision",
        "ID_Proyecto",
        "Titulo_Decision",
        "Arquetipo_Activo",
        "Criterios_JSON",
        "Alternativas_JSON",
        "Matriz_Evaluacion_JSON",
        "Alternativa_Recomendada",
        "Score_Ganador",
        "Estado_Decision",
        "Fecha_Registro"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    return sheet;
  } catch (e) {
    Logger.log("[verificarYCrearHojaTradeOff Error]: " + e.message);
    return null;
  }
}