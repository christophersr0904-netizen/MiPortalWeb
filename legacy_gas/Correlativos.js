/**
 * ============================================================================
 * ARCHIVO: Correlativos.gs
 * SISTEMA: PMO Personal Modular & Life Operating System
 * ROL: Motor Generador Concurrente de Llaves Primarias (PKs)
 * ============================================================================
 */

// ============================================================================
// SECCIÓN 1: SERVICIO DE CORRELATIVOS (CorrelativoService)
// ============================================================================
const CorrelativoService = {
_obtenerSiguienteNumero: function(sheet, colIdx, prefix, padSize) {
  const lastRow = sheet.getLastRow();
  let maxNum = 0;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, colIdx, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      const val = String(ids[i][0] || "").trim();
      if (val.startsWith(prefix)) {
        const rest = val.slice(prefix.length).trim();
        const match = rest.match(/^(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    }
  }
  return String(maxNum + 1).padStart(padSize, "0");
},
  /**
   * 1.1. Genera identificador único para Proyectos: PRO-XXX (Autoincremental limpio de 3 dígitos)
   * Ejemplo: PRO-001, PRO-002
   */
  generarIdProyecto: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
      if (!sheet) throw new Error("Hoja de Proyectos no encontrada.");

      const colIdx = (CONFIG.COLS_PROYECTOS && CONFIG.COLS_PROYECTOS.ID_PROYECTO !== undefined)
        ? CONFIG.COLS_PROYECTOS.ID_PROYECTO + 1
        : 1;
      const nextNum = this._obtenerSiguienteNumero(sheet, colIdx, "PRO-", 3);
      return `PRO-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.2a. Genera identificador secuencial para Paquetes de Trabajo: WP-XXX (WBS v4.1)
   * Ejemplo: WP-001, WP-002
   */
  generarIdPaqueteTrabajo: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
      if (!sheet) throw new Error("Hoja de Hitos/Elementos WBS no encontrada.");

      const colIdx = (CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_ELEMENTO_WBS !== undefined)
        ? CONFIG.COLS_HITOS.ID_ELEMENTO_WBS + 1
        : ((CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_HITO !== undefined) ? CONFIG.COLS_HITOS.ID_HITO + 1 : 1);
      const nextNum = this._obtenerSiguienteNumero(sheet, colIdx, "WP-", 3);
      return `WP-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.2b. Genera identificador secuencial para Hitos (Marcadores de control): HIT-XXX
   * Ejemplo: HIT-001, HIT-002
   */
  generarIdHito: function (idProyecto) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
      if (!sheet) throw new Error("Hoja de Hitos no encontrada.");

      const colIdx = (CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_ELEMENTO_WBS !== undefined)
        ? CONFIG.COLS_HITOS.ID_ELEMENTO_WBS + 1
        : ((CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_HITO !== undefined) ? CONFIG.COLS_HITOS.ID_HITO + 1 : 1);
      const nextNum = this._obtenerSiguienteNumero(sheet, colIdx, "HIT-", 3);
      return `HIT-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.3. Genera identificador secuencial para Tareas: TAR-XXX
   * Ejemplo: TAR-001
   */
  generarIdTarea: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
      if (!sheet) throw new Error("Hoja de Tareas no encontrada.");

      const nextNum = this._obtenerSiguienteNumero(sheet, CONFIG.COLS_TAREAS.ID_TAREA + 1, "TAR-", 3);
      return `TAR-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.4. Genera identificador secuencial para Gastos / Egresos: GAS-XXX
   * Ejemplo: GAS-001
   */
  generarIdGasto: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.FINANZAS);
      if (!sheet) throw new Error("Hoja de Finanzas (Egresos) no encontrada.");

      const nextNum = this._obtenerSiguienteNumero(sheet, CONFIG.COLS_FINANZAS.ID_GASTO + 1, "GAS-", 3);
      return `GAS-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.5. Genera identificador secuencial para Actividades Personales o Hábitos: ACT-XXX
   * Ejemplo: ACT-001
   */
  generarIdActividadPersonal: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
      if (!sheet) return `ACT-${Date.now()}`;
      const nextNum = this._obtenerSiguienteNumero(sheet, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD + 1, "ACT-", 3);
      return `ACT-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.6. Genera identificador secuencial para Ingresos Financieros: ING-XXX
   * Ejemplo: ING-001
   */
  generarIdIngreso: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.INGRESOS);
      if (!sheet) return `ING-${Date.now()}`;
      const nextNum = this._obtenerSiguienteNumero(sheet, CONFIG.COLS_INGRESOS.ID_INGRESO + 1, "ING-", 3);
      return `ING-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.7. Genera identificador secuencial para Subtareas / Pasos Procedurales: SUB-XXX
   * Ejemplo: SUB-001
   * Auto-crea la hoja satélite con encabezados canónicos si no existe.
   */
  generarIdSubtarea: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEETS.SUBTAREAS);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.SUBTAREAS);
        const headers = [
          "ID_Subtarea",
          "ID_Padre_Vinculado",
          "Numero_Paso",
          "Descripcion_Paso",
          "Completado",
          "Fecha_Completado"
        ];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        SpreadsheetApp.flush();
      }
      const lastRow = sheet.getLastRow();
      let maxNum = 0;
      if (lastRow > 1) {
        const colIdx = (CONFIG.COLS_SUBTAREAS && CONFIG.COLS_SUBTAREAS.ID_SUBTAREA !== undefined)
          ? CONFIG.COLS_SUBTAREAS.ID_SUBTAREA + 1
          : 1;
        const nextNum = this._obtenerSiguienteNumero(sheet, colIdx, "SUB-", 3);
        return `SUB-${nextNum}`;
      }
      return `SUB-${String(maxNum + 1).padStart(3, "0")}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.8. Genera identificador secuencial para Notas Inteligentes: NOT-XXXXX
   * Ejemplo: NOT-00001
   * Auto-crea la hoja satélite BBDD_Notas con encabezados canónicos si no existe.
   */
  generarIdNota: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEETS.NOTAS);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.NOTAS);
        const headers = [
          "ID_Nota",
          "Titulo",
          "Contenido",
          "Color",
          "Es_Fijada",
          "Checklist",
          "Adjuntos",
          "Vinculos",
          "Etiquetas",
          "Fecha_Creacion",
          "Fecha_Actualizacion"
        ];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        SpreadsheetApp.flush();
      }

      const colIdx = (CONFIG.COLS_NOTAS && CONFIG.COLS_NOTAS.ID_NOTA !== undefined)
        ? CONFIG.COLS_NOTAS.ID_NOTA + 1
        : 1;
      const nextNum = this._obtenerSiguienteNumero(sheet, colIdx, "NOT-", 5);
      return `NOT-${nextNum}`;
    } finally {
      lock.releaseLock();
    }
  },
  /**
   * 1.9. Genera identificador secuencial para Cuotas: CUO-XXX
   * Ejemplo: CUO-001
   */
  generarIdCuota: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEETS.CUOTAS);
      if (!sheet) {
        // Auto‑crea la hoja de cuotas con encabezados estándar
        const headers = [
          "ID_Cuota",
          "Descripcion",
          "Monto",
          "Vencimiento",
          "Estado",
          "Proyecto",
          "Fecha_Creacion",
          "Fecha_Actualizacion"
        ];
        const newSheet = ss.insertSheet(CONFIG.SHEETS.CUOTAS);
        newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        newSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        SpreadsheetApp.flush();
        sheet = newSheet;
      }

      const lastRow = sheet.getLastRow();
      let maxNum = 0;

      if (lastRow > 1) {
        const colIdx = (CONFIG.COLS_CUOTAS && CONFIG.COLS_CUOTAS.ID_CUOTA !== undefined) ? CONFIG.COLS_CUOTAS.ID_CUOTA + 1 : 1;
        const ids = sheet.getRange(2, colIdx, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          const val = String(ids[i][0] || "").trim();
          if (val.startsWith("CUO-")) {
            const num = parseInt(val.replace("CUO-", ""), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      }

      return `CUO-${String(maxNum + 1).padStart(3, "0")}`;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Universal dispatcher for correlativos
   */
  generarCorrelativo: function (tipo) {
    const t = String(tipo || "").trim().toUpperCase();
    if (t === "WP" || t === "PAQUETE" || t === "PAQUETES" || t === "PAQUETE_TRABAJO") return this.generarIdPaqueteTrabajo();
    if (t === "HIT" || t === "HITO" || t === "HITOS" || t === "HITO_MARCADOR") return this.generarIdHito();
    if (t === "PRO" || t === "PROYECTO" || t === "PROYECTOS") return this.generarIdProyecto();
    if (t === "CUO" || t === "CUOTAS") return this.generarIdCuota();
    if (t === "TAR" || t === "TAREAS") return this.generarIdTarea();
    if (t === "GAS" || t === "GASTOS") return this.generarIdGasto();
    if (t === "ING" || t === "INGRESOS") return this.generarIdIngreso();
    if (t === "ACT" || t === "ACTIVIDADES") return this.generarIdActividadPersonal();
    if (t === "NOT" || t === "NOTAS") return this.generarIdNota();
    if (t === "SUB" || t === "SUBTAREAS" || t === "PASO" || t === "PASOS") return this.generarIdSubtarea();
    throw new Error("Tipo de correlativo no soportado: " + tipo);
  },

  /**
   * Batch generator to obtain a series of sequential IDs without race conditions.
   * @param {string} tipo - Tipo de correlativo (e.g., "TAR", "CUO", "WP", "HIT").
   * @param {number} cantidad - Cantidad de IDs a generar.
   * @returns {string[]} Array of generated IDs.
   */
  generarIdsBatch: function (tipo, cantidad) {
    if (cantidad <= 0) return [];
    const t = String(tipo || "").trim().toUpperCase();
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet, prefix, colIdx;
      switch (t) {
        case "WP":
        case "PAQUETE":
        case "PAQUETES":
        case "PAQUETE_TRABAJO":
          sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
          prefix = "WP-";
          colIdx = (CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_ELEMENTO_WBS !== undefined)
            ? CONFIG.COLS_HITOS.ID_ELEMENTO_WBS + 1
            : ((CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_HITO !== undefined) ? CONFIG.COLS_HITOS.ID_HITO + 1 : 1);
          break;
        case "HIT":
        case "HITO":
        case "HITOS":
        case "HITO_MARCADOR":
          sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
          prefix = "HIT-";
          colIdx = (CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_ELEMENTO_WBS !== undefined)
            ? CONFIG.COLS_HITOS.ID_ELEMENTO_WBS + 1
            : ((CONFIG.COLS_HITOS && CONFIG.COLS_HITOS.ID_HITO !== undefined) ? CONFIG.COLS_HITOS.ID_HITO + 1 : 1);
          break;
        case "PRO":
        case "PROYECTO":
        case "PROYECTOS":
          sheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
          prefix = "PRO-";
          colIdx = (CONFIG.COLS_PROYECTOS && CONFIG.COLS_PROYECTOS.ID_PROYECTO !== undefined)
            ? CONFIG.COLS_PROYECTOS.ID_PROYECTO + 1
            : 1;
          break;
        case "CUO":
        case "CUOTAS":
          sheet = ss.getSheetByName(CONFIG.SHEETS.CUOTAS);
          prefix = "CUO-";
          colIdx = (CONFIG.COLS_CUOTAS && CONFIG.COLS_CUOTAS.ID_CUOTA !== undefined) ? CONFIG.COLS_CUOTAS.ID_CUOTA + 1 : 1;
          break;
        case "TAR":
        case "TAREAS":
          sheet = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
          prefix = "TAR-";
          colIdx = CONFIG.COLS_TAREAS.ID_TAREA + 1;
          break;
        case "GAS":
        case "GASTOS":
          sheet = ss.getSheetByName(CONFIG.SHEETS.FINANZAS);
          prefix = "GAS-";
          colIdx = CONFIG.COLS_FINANZAS.ID_GASTO + 1;
          break;
        case "ING":
        case "INGRESOS":
          sheet = ss.getSheetByName(CONFIG.SHEETS.INGRESOS);
          prefix = "ING-";
          colIdx = CONFIG.COLS_INGRESOS.ID_INGRESO + 1;
          break;
        case "ACT":
        case "ACTIVIDADES":
          sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
          prefix = "ACT-";
          colIdx = CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD + 1;
          break;
        case "NOT":
        case "NOTAS":
          sheet = ss.getSheetByName(CONFIG.SHEETS.NOTAS);
          prefix = "NOT-";
          colIdx = (CONFIG.COLS_NOTAS && CONFIG.COLS_NOTAS.ID_NOTA !== undefined) ? CONFIG.COLS_NOTAS.ID_NOTA + 1 : 1;
          break;
        default:
          throw new Error("Tipo de correlativo no soportado en batch: " + tipo);
      }
      if (!sheet) throw new Error("Hoja de correlativos no encontrada para tipo " + tipo);

      const lastRow = sheet.getLastRow();
      let maxNum = 0;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, colIdx, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          const val = String(ids[i][0] || "").trim();
          if (val.startsWith(prefix)) {
            const num = parseInt(val.replace(prefix, ""), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      }
      const result = [];
      for (let i = 1; i <= cantidad; i++) {
        const nextNum = maxNum + i;
        const pad = prefix === "CUO-" ? 3 : prefix === "NOT-" ? 5 : 3;
        result.push(`${prefix}${String(nextNum).padStart(pad, "0")}`);
      }
      return result;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Genera identificador único para Ideas Rápidas: IDE-YYYYMMDD-XXX
   * Ejemplo: IDE-20261014-001
   */
  generarIdIdea: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEETS.IDEAS);
      if (!sheet) {
        if (typeof IdeasService !== "undefined" && IdeasService.inicializarHojaIdeas) {
          sheet = IdeasService.inicializarHojaIdeas(ss);
        } else {
          sheet = ss.insertSheet(CONFIG.SHEETS.IDEAS);
          const headers = [
            "ID_Idea", "Enunciado_Idea", "Detalle_Contexto", "Tipo_Captura",
            "URL_Adjunto_Drive", "Transcripcion_Texto", "Clarificacion_IA",
            "Estado", "Entidad_Convertida", "ID_Entidad_Destino",
            "Fecha_Captura", "Fecha_Procesada", "Fecha_Archivado"
          ];
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
          SpreadsheetApp.flush();
        }
      }

      const tz = (CONFIG && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
      const fechaStr = Utilities.formatDate(new Date(), tz, "yyyyMMdd");
      const prefix = `IDE-${fechaStr}-`;
      const colIdx = (CONFIG.COLS_IDEAS && CONFIG.COLS_IDEAS.ID_IDEA !== undefined)
        ? CONFIG.COLS_IDEAS.ID_IDEA + 1
        : 1;

      const lastRow = sheet.getLastRow();
      let maxNum = 0;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, colIdx, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          const val = String(ids[i][0] || "").trim();
          if (val.startsWith(prefix)) {
            const numPart = val.substring(prefix.length).trim();
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      }
      return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
    } finally {
      lock.releaseLock();
    }
  }
};