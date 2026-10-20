/**
 * ============================================================================
 * ARCHIVO: IdeasService.js
 * SISTEMA: PMO Personal Modular & Life Operating System
 * ROL: Gestión del Dominio "Ideas" (Captura Ágil, Incubación y Triaje)
 * ESTÁNDAR: Cobalt Aerodynamic A.2.2 • SYSTEM_RULES.md • Cero Regresiones
 * ============================================================================
 */

const IdeasService = {

  /**
   * 1.1. Inicialización defensiva y determinista de la pestaña BBDD_Ideas
   * Esquema Canónico de 13 Columnas (A:M)
   */
  inicializarHojaIdeas: function(ss) {
    const spreadsheet = ss || SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = (CONFIG && CONFIG.SHEETS && CONFIG.SHEETS.IDEAS) ? CONFIG.SHEETS.IDEAS : "BBDD_Ideas";
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      const headers = [
        "ID_Idea",
        "Enunciado_Idea",
        "Detalle_Contexto",
        "Tipo_Captura",
        "URL_Adjunto_Drive",
        "Transcripcion_Texto",
        "Clarificacion_IA",
        "Estado",
        "Entidad_Convertida",
        "ID_Entidad_Destino",
        "Fecha_Captura",
        "Fecha_Procesada",
        "Fecha_Archivado"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
      SpreadsheetApp.flush();
    }
    return sheet;
  },

  /**
   * 1.2. Obtiene la hoja BBDD_Ideas garantizando su existencia
   */
  obtenerHojaIdeas: function(ss) {
    const spreadsheet = ss || SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = (CONFIG && CONFIG.SHEETS && CONFIG.SHEETS.IDEAS) ? CONFIG.SHEETS.IDEAS : "BBDD_Ideas";
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = IdeasService.inicializarHojaIdeas(spreadsheet);
    }
    return sheet;
  },

  /**
   * 1.3. Obtiene el listado completo de ideas estructuradas
   */
  obtenerIdeas: function(payload) {
    try {
      const sheet = IdeasService.obtenerHojaIdeas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: true, ideas: [] };

      const cols = CONFIG.COLS_IDEAS;
      const data = sheet.getRange(2, 1, lastRow - 1, cols.MAX_COLUMNS).getValues();
      const ideas = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const id = String(row[cols.ID_IDEA] || "").trim();
        if (!id) continue;

        let clarificacionParsed = row[cols.CLARIFICACION_IA] || "";
        if (typeof clarificacionParsed === "string" && clarificacionParsed.trim().startsWith("{")) {
          try {
            clarificacionParsed = JSON.parse(clarificacionParsed);
          } catch (eJSON) {
            // Se mantiene como string plano si no es JSON válido
          }
        }

        ideas.push({
          ID_Idea: id,
          id: id,
          Enunciado_Idea: String(row[cols.ENUNCIADO_IDEA] || "").trim(),
          enunciado: String(row[cols.ENUNCIADO_IDEA] || "").trim(),
          Detalle_Contexto: String(row[cols.DETALLE_CONTEXTO] || "").trim(),
          detalle: String(row[cols.DETALLE_CONTEXTO] || "").trim(),
          Tipo_Captura: String(row[cols.TIPO_CAPTURA] || "Texto").trim(),
          tipoCaptura: String(row[cols.TIPO_CAPTURA] || "Texto").trim(),
          URL_Adjunto_Drive: String(row[cols.URL_ADJUNTO_DRIVE] || "").trim(),
          urlAdjunto: String(row[cols.URL_ADJUNTO_DRIVE] || "").trim(),
          Transcripcion_Texto: String(row[cols.TRANSCRIPCION_TEXTO] || "").trim(),
          transcripcion: String(row[cols.TRANSCRIPCION_TEXTO] || "").trim(),
          Clarificacion_IA: clarificacionParsed,
          clarificacion: clarificacionParsed,
          Estado: String(row[cols.ESTADO] || "Borrador / Inbox").trim(),
          estado: String(row[cols.ESTADO] || "Borrador / Inbox").trim(),
          Entidad_Convertida: String(row[cols.ENTIDAD_CONVERTIDA] || "").trim(),
          entidadConvertida: String(row[cols.ENTIDAD_CONVERTIDA] || "").trim(),
          ID_Entidad_Destino: String(row[cols.ID_ENTIDAD_DESTINO] || "").trim(),
          idEntidadDestino: String(row[cols.ID_ENTIDAD_DESTINO] || "").trim(),
          Fecha_Captura: row[cols.FECHA_CAPTURA] ? new Date(row[cols.FECHA_CAPTURA]).toISOString() : "",
          Fecha_Procesada: row[cols.FECHA_PROCESADA] ? new Date(row[cols.FECHA_PROCESADA]).toISOString() : "",
          Fecha_Archivado: row[cols.FECHA_ARCHIVADO] ? new Date(row[cols.FECHA_ARCHIVADO]).toISOString() : ""
        });
      }

      // Orden cronológico estricto: Fecha_Captura descendente (las más recientes primero)
      ideas.sort(function(a, b) {
        var tA = a.Fecha_Captura ? new Date(a.Fecha_Captura).getTime() : 0;
        var tB = b.Fecha_Captura ? new Date(b.Fecha_Captura).getTime() : 0;
        return tB - tA;
      });

      return { success: true, ideas: ideas };
    } catch (err) {
      Logger.log("[IdeasService.obtenerIdeas Error]: " + err.message);
      return { success: false, error: err.message, ideas: [] };
    }
  },

  /**
   * 1.4. Crea una nueva idea en BBDD_Ideas
   */
  crearIdea: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const sheet = IdeasService.obtenerHojaIdeas();
      const idIdea = CorrelativoService.generarIdIdea();
      const cols = CONFIG.COLS_IDEAS;

      const enunciado = String(payload.enunciado || payload.Enunciado_Idea || payload.titulo || "Nueva Idea").trim();
      const detalle = String(payload.detalle || payload.Detalle_Contexto || payload.contexto || "").trim();
      const tipoCaptura = String(payload.tipoCaptura || payload.Tipo_Captura || (payload.urlAdjunto ? "Archivo" : "Texto")).trim();
      const urlAdjunto = String(payload.urlAdjunto || payload.URL_Adjunto_Drive || "").trim();
      const transcripcion = String(payload.transcripcion || payload.Transcripcion_Texto || "").trim();
      
      let clarificacion = payload.clarificacion || payload.Clarificacion_IA || "";
      if (typeof clarificacion === "object") {
        clarificacion = JSON.stringify(clarificacion);
      }

      const estado = String(payload.estado || payload.Estado || "Borrador / Inbox").trim();
      const fechaCaptura = new Date().toISOString();

      const newRow = new Array(cols.MAX_COLUMNS).fill("");
      newRow[cols.ID_IDEA] = idIdea;
      newRow[cols.ENUNCIADO_IDEA] = enunciado;
      newRow[cols.DETALLE_CONTEXTO] = detalle;
      newRow[cols.TIPO_CAPTURA] = tipoCaptura;
      newRow[cols.URL_ADJUNTO_DRIVE] = urlAdjunto;
      newRow[cols.TRANSCRIPCION_TEXTO] = transcripcion;
      newRow[cols.CLARIFICACION_IA] = clarificacion;
      newRow[cols.ESTADO] = estado;
      newRow[cols.ENTIDAD_CONVERTIDA] = "";
      newRow[cols.ID_ENTIDAD_DESTINO] = "";
      newRow[cols.FECHA_CAPTURA] = fechaCaptura;
      newRow[cols.FECHA_PROCESADA] = "";
      newRow[cols.FECHA_ARCHIVADO] = "";

      sheet.appendRow(newRow);
      SpreadsheetApp.flush();

      try {
        CacheService.getScriptCache().remove("IDEAS_DATA_CACHE");
        CacheService.getScriptCache().remove("DASHBOARD_DATA_CACHE");
      } catch (eCache) {
        Logger.log("[IdeasService] Error limpiando cache: " + eCache.message);
      }

      if (typeof invalidarCacheDashboard === "function") {
        invalidarCacheDashboard();
      }

      return {
        success: true,
        idIdea: idIdea,
        idea: {
          ID_Idea: idIdea,
          id: idIdea,
          Enunciado_Idea: enunciado,
          enunciado: enunciado,
          Detalle_Contexto: detalle,
          detalle: detalle,
          Tipo_Captura: tipoCaptura,
          tipoCaptura: tipoCaptura,
          URL_Adjunto_Drive: urlAdjunto,
          urlAdjunto: urlAdjunto,
          Transcripcion_Texto: transcripcion,
          transcripcion: transcripcion,
          Clarificacion_IA: clarificacion,
          clarificacion: clarificacion,
          Estado: estado,
          estado: estado,
          Entidad_Convertida: "",
          ID_Entidad_Destino: "",
          Fecha_Captura: fechaCaptura
        }
      };
    } catch (err) {
      Logger.log("[IdeasService.crearIdea Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.5. Actualiza datos de una idea existente
   */
  actualizarIdea: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const idIdea = String(payload.idIdea || payload.ID_Idea || "").trim();
      if (!idIdea) throw new Error("ID_Idea no proporcionado para actualización");

      const sheet = IdeasService.obtenerHojaIdeas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) throw new Error("No existen registros en BBDD_Ideas");

      const cols = CONFIG.COLS_IDEAS;
      const data = sheet.getRange(2, 1, lastRow - 1, cols.MAX_COLUMNS).getValues();
      let rowIdx = -1;

      for (let i = 0; i < data.length; i++) {
        if (String(data[i][cols.ID_IDEA]).trim() === idIdea) {
          rowIdx = i + 2;
          break;
        }
      }

      if (rowIdx === -1) throw new Error("Idea no encontrada: " + idIdea);

      if (payload.enunciado !== undefined || payload.Enunciado_Idea !== undefined) {
        const enun = String(payload.enunciado !== undefined ? payload.enunciado : payload.Enunciado_Idea).trim();
        sheet.getRange(rowIdx, cols.ENUNCIADO_IDEA + 1).setValue(enun);
      }

      if (payload.detalle !== undefined || payload.Detalle_Contexto !== undefined) {
        const det = String(payload.detalle !== undefined ? payload.detalle : payload.Detalle_Contexto).trim();
        sheet.getRange(rowIdx, cols.DETALLE_CONTEXTO + 1).setValue(det);
      }

      if (payload.tipoCaptura !== undefined || payload.Tipo_Captura !== undefined) {
        const tc = String(payload.tipoCaptura !== undefined ? payload.tipoCaptura : payload.Tipo_Captura).trim();
        sheet.getRange(rowIdx, cols.TIPO_CAPTURA + 1).setValue(tc);
      }

      if (payload.urlAdjunto !== undefined || payload.URL_Adjunto_Drive !== undefined) {
        const urlAdj = String(payload.urlAdjunto !== undefined ? payload.urlAdjunto : payload.URL_Adjunto_Drive).trim();
        sheet.getRange(rowIdx, cols.URL_ADJUNTO_DRIVE + 1).setValue(urlAdj);
      }

      if (payload.transcripcion !== undefined || payload.Transcripcion_Texto !== undefined) {
        const tr = String(payload.transcripcion !== undefined ? payload.transcripcion : payload.Transcripcion_Texto).trim();
        sheet.getRange(rowIdx, cols.TRANSCRIPCION_TEXTO + 1).setValue(tr);
      }

      if (payload.clarificacion !== undefined || payload.Clarificacion_IA !== undefined) {
        let cl = payload.clarificacion !== undefined ? payload.clarificacion : payload.Clarificacion_IA;
        if (typeof cl === "object") cl = JSON.stringify(cl);
        sheet.getRange(rowIdx, cols.CLARIFICACION_IA + 1).setValue(cl);
      }

      if (payload.estado !== undefined || payload.Estado !== undefined) {
        const est = String(payload.estado !== undefined ? payload.estado : payload.Estado).trim();
        sheet.getRange(rowIdx, cols.ESTADO + 1).setValue(est);
      }

      SpreadsheetApp.flush();

      if (typeof invalidarCacheDashboard === "function") {
        invalidarCacheDashboard();
      }

      return { success: true, idIdea: idIdea };
    } catch (err) {
      Logger.log("[IdeasService.actualizarIdea Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.6. Mueve una idea al estado 'En Incubación / Algún día'
   */
  moverIdeaIncubacion: function(payload) {
    return IdeasService.actualizarIdea({
      idIdea: payload.idIdea || payload.ID_Idea,
      estado: "En Incubación / Algún día"
    });
  },

  /**
   * 1.7. Marca una idea como 'Procesada' vinculando la entidad y destino generados
   */
  marcarIdeaProcesada: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const idIdea = String(payload.idIdea || payload.ID_Idea || "").trim();
      const entidad = String(payload.entidad || payload.Entidad_Convertida || "").trim().toUpperCase();
      const idDestino = String(payload.idDestino || payload.ID_Entidad_Destino || "").trim();

      if (!idIdea) throw new Error("ID_Idea no proporcionado");

      const sheet = IdeasService.obtenerHojaIdeas();
      const lastRow = sheet.getLastRow();
      const cols = CONFIG.COLS_IDEAS;
      const data = sheet.getRange(2, 1, lastRow - 1, cols.MAX_COLUMNS).getValues();
      let rowIdx = -1;

      for (let i = 0; i < data.length; i++) {
        if (String(data[i][cols.ID_IDEA]).trim() === idIdea) {
          rowIdx = i + 2;
          break;
        }
      }

      if (rowIdx === -1) throw new Error("Idea no encontrada: " + idIdea);

      const fechaProcesada = new Date().toISOString();
      sheet.getRange(rowIdx, cols.ESTADO + 1).setValue("Procesada");
      sheet.getRange(rowIdx, cols.ENTIDAD_CONVERTIDA + 1).setValue(entidad);
      sheet.getRange(rowIdx, cols.ID_ENTIDAD_DESTINO + 1).setValue(idDestino);
      sheet.getRange(rowIdx, cols.FECHA_PROCESADA + 1).setValue(fechaProcesada);

      SpreadsheetApp.flush();

      if (typeof invalidarCacheDashboard === "function") {
        invalidarCacheDashboard();
      }

      return {
        success: true,
        idIdea: idIdea,
        estado: "Procesada",
        entidad: entidad,
        idDestino: idDestino,
        fechaProcesada: fechaProcesada
      };
    } catch (err) {
      Logger.log("[IdeasService.marcarIdeaProcesada Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.8. Elimina una idea físicamente de la hoja
   */
  eliminarIdea: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const idIdea = String(payload.idIdea || payload.ID_Idea || "").trim();
      if (!idIdea) throw new Error("ID_Idea no especificado");

      const sheet = IdeasService.obtenerHojaIdeas();
      const cols = CONFIG.COLS_IDEAS;
      const eliminadas = sobrescribirHojaFiltrada(sheet, function(row) {
        return String(row[cols.ID_IDEA]).trim() !== idIdea;
      });

      SpreadsheetApp.flush();
      if (typeof invalidarCacheDashboard === "function") {
        invalidarCacheDashboard();
      }

      return { success: true, eliminadas: eliminadas };
    } catch (err) {
      Logger.log("[IdeasService.eliminarIdea Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * 1.9. Barrido automático de archivado a los 10 días
   * Busca ideas en estado 'Procesada' cuya Fecha_Procesada supere los 10 días calendario
   * y las transiciona a 'Archivada' con Fecha_Archivado.
   */
  archivarIdeasVencidas: function() {
    try {
      const sheet = IdeasService.obtenerHojaIdeas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: true, archivadas: 0 };

      const cols = CONFIG.COLS_IDEAS;
      const data = sheet.getRange(2, 1, lastRow - 1, cols.MAX_COLUMNS).getValues();
      const hoy = new Date();
      const diezDiasMs = 10 * 24 * 60 * 60 * 1000;
      let countArchivadas = 0;

      for (let i = 0; i < data.length; i++) {
        const estado = String(data[i][cols.ESTADO] || "").trim();
        const fProcStr = data[i][cols.FECHA_PROCESADA];

        if (estado === "Procesada" && fProcStr) {
          const fProc = new Date(fProcStr);
          if (!isNaN(fProc.getTime()) && (hoy.getTime() - fProc.getTime()) > diezDiasMs) {
            const rowNumber = i + 2;
            sheet.getRange(rowNumber, cols.ESTADO + 1).setValue("Archivada");
            sheet.getRange(rowNumber, cols.FECHA_ARCHIVADO + 1).setValue(new Date().toISOString());
            countArchivadas++;
          }
        }
      }

      if (countArchivadas > 0) {
        SpreadsheetApp.flush();
        if (typeof invalidarCacheDashboard === "function") {
          invalidarCacheDashboard();
        }
      }

      return { success: true, archivadas: countArchivadas };
    } catch (err) {
      Logger.log("[IdeasService.archivarIdeasVencidas Error]: " + err.message);
      return { success: false, error: err.message };
    }
  }
};
