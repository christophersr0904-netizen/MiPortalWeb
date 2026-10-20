/**
 * ============================================================================
 * ARCHIVO: HitosService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Gestión de Hitos Cronológicos, Jerarquías y Dependencias
 * ============================================================================
 */

const HitosService = {

  obtenerMapaColumnasHitos: function (sheet) {
    return (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaHitos)
      ? CONFIG.obtenerMapaHitos(sheet)
      : CONFIG.COLS_HITOS;
  },

  /**
   * Valida si un elemento WBS admite vincular registros de tareas.
   * Regla WBS v4.1: Solo PAQUETE_TRABAJO admite tareas; HITO_MARCADOR tiene duración 0 y costo $0.
   */
  validarAsociacionTareas: function (idElementoWbs) {
    if (!idElementoWbs) return { permitido: true };
    const cleanId = String(idElementoWbs).trim().toUpperCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
    if (!sheet || sheet.getLastRow() <= 1) {
      if (cleanId.startsWith("HIT-")) {
        return {
          permitido: false,
          error: `[Regla WBS v4.1]: El elemento ${idElementoWbs} es un HITO_MARCADOR (prefijo HIT-) y no admite vinculación de tareas. Las tareas solo pueden asociarse a Paquetes de Trabajo (WP-XXX).`
        };
      }
      return { permitido: true };
    }

    const colMap = HitosService.obtenerMapaColumnasHitos(sheet);
    const data = sheet.getDataRange().getValues();
    const idCol = colMap.ID_ELEMENTO_WBS !== undefined ? colMap.ID_ELEMENTO_WBS : colMap.ID_HITO;
    const tipoCol = colMap.TIPO_ELEMENTO_WBS !== undefined ? colMap.TIPO_ELEMENTO_WBS : 2;

    const rowHit = data.slice(1).find(r => String(r[idCol] || "").trim().toUpperCase() === cleanId);
    if (rowHit) {
      const tipo = String(rowHit[tipoCol] || "").trim().toUpperCase();
      if (tipo === "HITO_MARCADOR" || cleanId.startsWith("HIT-")) {
        return {
          permitido: false,
          error: `[Regla WBS v4.1]: El elemento ${idElementoWbs} es un HITO_MARCADOR (duración 0, costo $0) y no admite vinculación de tareas. Las tareas solo pueden asociarse a Paquetes de Trabajo (PAQUETE_TRABAJO / WP-XXX).`
        };
      }
    } else if (cleanId.startsWith("HIT-")) {
      return {
        permitido: false,
        error: `[Regla WBS v4.1]: El identificador ${idElementoWbs} corresponde a un HITO_MARCADOR y no admite vinculación de tareas. Las tareas solo pueden asociarse a Paquetes de Trabajo (WP-XXX).`
      };
    }
    return { permitido: true };
  },

  createHito: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
    if (!sheet) return { success: false, error: "Hoja de hitos no encontrada" };
    const colMap = HitosService.obtenerMapaColumnasHitos(sheet);

    const rawTipo = String(payload.tipoElementoWbs || payload.Tipo_Elemento_WBS || payload.tipo || "").trim().toUpperCase();
    let tipoElementoWbs = "PAQUETE_TRABAJO";
    if (rawTipo === "HITO_MARCADOR" || rawTipo === "HITO" || rawTipo === "HIT") {
      tipoElementoWbs = "HITO_MARCADOR";
    } else if (rawTipo === "PAQUETE_TRABAJO" || rawTipo === "WP" || rawTipo === "PAQUETE") {
      tipoElementoWbs = "PAQUETE_TRABAJO";
    } else if (payload.idHito && String(payload.idHito).toUpperCase().startsWith("HIT-")) {
      tipoElementoWbs = "HITO_MARCADOR";
    } else if (payload.idHito && String(payload.idHito).toUpperCase().startsWith("WP-")) {
      tipoElementoWbs = "PAQUETE_TRABAJO";
    } else if (parseFloat(payload.presupuestoAsignado || payload.costoAsociadoEstimado || payload.costoEstimado || 0) > 0) {
      tipoElementoWbs = "PAQUETE_TRABAJO";
    } else {
      tipoElementoWbs = "HITO_MARCADOR";
    }

    let idHito = String(payload.idElementoWbs || payload.idHito || payload.ID_Hito || "").trim();
    if (!idHito) {
      if (tipoElementoWbs === "HITO_MARCADOR") {
        idHito = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdHito)
          ? CorrelativoService.generarIdHito(payload.idProyecto)
          : "HIT-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
      } else {
        idHito = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdPaqueteTrabajo)
          ? CorrelativoService.generarIdPaqueteTrabajo()
          : "WP-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
      }
    }

    // Regla WBS v4.1: Si es HITO_MARCADOR, forzar presupuestoAsignado = 0.00
    let presupuestoAsignado = parseFloat(payload.presupuestoAsignado || payload.costoAsociadoEstimado || payload.costoEstimado) || 0.0;
    if (tipoElementoWbs === "HITO_MARCADOR") {
      presupuestoAsignado = 0.00;
    }

    const esMavVal = (payload.esMav === true || payload.esMav === "Sí" || payload.Es_MAV === "Sí" || payload.Es_MAV === true || payload.es_mav === true) ? "Sí" : "No";

    const newRow = new Array(colMap.MAX_COLUMNS || 14).fill("");
    const idxId = colMap.ID_ELEMENTO_WBS !== undefined ? colMap.ID_ELEMENTO_WBS : (colMap.ID_HITO !== undefined ? colMap.ID_HITO : 0);
    newRow[idxId] = idHito;
    newRow[colMap.ID_PROYECTO !== undefined ? colMap.ID_PROYECTO : 1] = payload.idProyecto || "";
    if (colMap.TIPO_ELEMENTO_WBS !== undefined) {
      newRow[colMap.TIPO_ELEMENTO_WBS] = tipoElementoWbs;
    }
    if (colMap.WBS_CODE !== undefined) {
      newRow[colMap.WBS_CODE] = payload.wbsCode || payload.WBS_Code || "";
    }
    const idxFase = colMap.FASE_ASOCIADA !== undefined ? colMap.FASE_ASOCIADA : 4;
    newRow[idxFase] = payload.faseAsociada || "Planificacion";
    const idxNom = colMap.NOMBRE_ELEMENTO !== undefined ? colMap.NOMBRE_ELEMENTO : (colMap.NOMBRE_HITO !== undefined ? colMap.NOMBRE_HITO : 5);
    newRow[idxNom] = payload.nombreHito || payload.nombreElemento || payload.nombre || "";
    const idxEst = colMap.ESTADO !== undefined ? colMap.ESTADO : 6;
    newRow[idxEst] = payload.estadoHito || payload.estado || "01_Pendiente";
    const idxPeso = colMap.PESO_PCT !== undefined ? colMap.PESO_PCT : 7;
    newRow[idxPeso] = parseFloat(payload.pesoPct) || 0.2;
    const idxFecLim = colMap.FECHA_LIMITE !== undefined ? colMap.FECHA_LIMITE : (colMap.FECHA_LIMITE_PLAN !== undefined ? colMap.FECHA_LIMITE_PLAN : 8);
    newRow[idxFecLim] = payload.fechaLimite || "";
    const idxFecFin = colMap.FECHA_REAL_FIN !== undefined ? colMap.FECHA_REAL_FIN : 9;
    newRow[idxFecFin] = payload.fechaRealFin || "";
    const idxPres = colMap.PRESUPUESTO_ASIGNADO !== undefined ? colMap.PRESUPUESTO_ASIGNADO : (colMap.COSTO_ESTIMADO !== undefined ? colMap.COSTO_ESTIMADO : 10);
    newRow[idxPres] = presupuestoAsignado;
    const idxDod = colMap.CRITERIO_DOD !== undefined ? colMap.CRITERIO_DOD : (colMap.DOD !== undefined ? colMap.DOD : 11);
    newRow[idxDod] = payload.criterioDod || payload.criterioAceptacion || payload.criteriosDoD || "";
    const idxDep = colMap.DEPENDENCIA_PREDECESORA !== undefined ? colMap.DEPENDENCIA_PREDECESORA : 12;
    newRow[idxDep] = payload.dependenciaPredecesora || "";
    const idxLink = colMap.ENTREGABLE_LINK !== undefined ? colMap.ENTREGABLE_LINK : 13;
    newRow[idxLink] = payload.entregableLink || "";

    sheet.appendRow(newRow);
    invalidarCacheDashboard();
    return {
      success: true,
      idHito: idHito,
      idElementoWbs: idHito,
      tipoElementoWbs: tipoElementoWbs,
      data: {
        ID_Elemento_WBS: idHito,
        ID_Hito: idHito,
        ID_Proyecto: payload.idProyecto,
        Tipo_Elemento_WBS: tipoElementoWbs,
        Nombre_Elemento: newRow[idxNom],
        Nombre_Hito: newRow[idxNom],
        Fase_Asociada: newRow[idxFase],
        faseAsociada: newRow[idxFase],
        WBS_Code: colMap.WBS_CODE !== undefined ? newRow[colMap.WBS_CODE] : "",
        Estado: newRow[colMap.ESTADO],
        Estado_Hito: newRow[colMap.ESTADO],
        Peso_Ponderado_Pct: newRow[idxPeso],
        Fecha_Limite: newRow[idxFecLim],
        Fecha_Limite_Plan: newRow[idxFecLim],
        Presupuesto_Asignado: presupuestoAsignado,
        Criterio_Aceptacion_DoD: newRow[idxDod],
        Es_MAV: esMavVal,
        esMav: esMavVal === "Sí"
      }
    };
  },

  updateHito: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
    if (!sheet) return { success: false, error: "Hoja de hitos no encontrada" };

    const colMap = HitosService.obtenerMapaColumnasHitos(sheet);
    const idHito = String(payload.idElementoWbs || payload.idHito || payload.ID_Hito || "").trim();
    if (!idHito) return { success: false, error: "ID_Elemento_WBS / ID_Hito requerido" };

    const data = sheet.getDataRange().getValues();
    let rowIdx = -1;
    let idProyecto = "";

    const idxId = colMap.ID_ELEMENTO_WBS !== undefined ? colMap.ID_ELEMENTO_WBS : colMap.ID_HITO;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idxId]).trim().toUpperCase() === idHito.toUpperCase()) {
        rowIdx = i + 1;
        idProyecto = String(data[i][colMap.ID_PROYECTO]).trim();
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: "Elemento WBS no encontrado: " + idHito };

    // Build updated row to preserve calculated columns
    const lastColH = sheet.getLastColumn();
    const rowH = sheet.getRange(rowIdx, 1, 1, lastColH).getValues()[0];

    const idxTipo = colMap.TIPO_ELEMENTO_WBS !== undefined ? colMap.TIPO_ELEMENTO_WBS : 2;
    const tipoActual = String(rowH[idxTipo] || (idHito.toUpperCase().startsWith("HIT-") ? "HITO_MARCADOR" : "PAQUETE_TRABAJO")).trim().toUpperCase();

    // Determinar nuevo tipo si viene en el payload
    let targetTipo = tipoActual;
    if (payload.tipoElementoWbs !== undefined || payload.Tipo_Elemento_WBS !== undefined) {
      const rawT = String(payload.tipoElementoWbs || payload.Tipo_Elemento_WBS).trim().toUpperCase();
      targetTipo = (rawT === "HITO_MARCADOR" || rawT === "HITO" || rawT === "HIT") ? "HITO_MARCADOR" : "PAQUETE_TRABAJO";
    }

    // Regla WBS v4.1: Si se intenta configurar como HITO_MARCADOR, validar que NO existan tareas asociadas
    if (targetTipo === "HITO_MARCADOR") {
      const sheetTar = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
      if (sheetTar && sheetTar.getLastRow() > 1) {
        const colMapT = (typeof TareasService !== "undefined" && TareasService.obtenerMapaColumnasTareas)
          ? TareasService.obtenerMapaColumnasTareas(sheetTar)
          : CONFIG.COLS_TAREAS;
        const tarData = sheetTar.getDataRange().getValues();
        const tareasVinculadas = tarData.slice(1).filter(t => String(t[colMapT.ID_HITO] || "").trim().toUpperCase() === idHito.toUpperCase());
        if (tareasVinculadas.length > 0) {
          return {
            success: false,
            error: `[Regla WBS v4.1]: El elemento ${idHito} no puede ser un HITO_MARCADOR porque tiene ${tareasVinculadas.length} tarea(s) asociada(s). Solo los elementos PAQUETE_TRABAJO admiten tareas.`
          };
        }
      }
    }

    if (colMap.TIPO_ELEMENTO_WBS !== undefined) {
      rowH[colMap.TIPO_ELEMENTO_WBS] = targetTipo;
    }

    // Regla WBS v4.1: Si es HITO_MARCADOR, forzar presupuestoAsignado = 0.00
    const idxPresupuesto = colMap.PRESUPUESTO_ASIGNADO !== undefined ? colMap.PRESUPUESTO_ASIGNADO : colMap.COSTO_ESTIMADO;
    if (targetTipo === "HITO_MARCADOR") {
      if (idxPresupuesto !== undefined) rowH[idxPresupuesto] = 0.00;
    } else {
      if (payload.presupuestoAsignado !== undefined || payload.costoAsociadoEstimado !== undefined || payload.costoEstimado !== undefined) {
        const pAsig = parseFloat(payload.presupuestoAsignado !== undefined ? payload.presupuestoAsignado : (payload.costoAsociadoEstimado || payload.costoEstimado)) || 0.0;
        if (idxPresupuesto !== undefined) rowH[idxPresupuesto] = pAsig;
      }
    }

    const nuevoEstado = payload.estadoHito || payload.Estado_Hito || payload.estado || payload.Estado;
    if (nuevoEstado) {
      // Si se intenta marcar como completado y el criterio dominante del proyecto es Alcance:
      if (nuevoEstado.includes("Completado") || nuevoEstado.startsWith("03")) {
        const sheetProy = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
        if (sheetProy && idProyecto) {
          const colMapP = (typeof ProyectosService !== "undefined" && ProyectosService.obtenerMapaColumnasProyectos)
            ? ProyectosService.obtenerMapaColumnasProyectos(sheetProy)
            : CONFIG.COLS_PROYECTOS;
          const proyData = sheetProy.getDataRange().getValues();
          const proyRow = proyData.find(p => String(p[colMapP.ID_PROYECTO]).trim().toUpperCase() === idProyecto.toUpperCase());
          if (proyRow) {
            const idxCrit = colMapP.ARQUETIPO_PROYECTO !== undefined ? colMapP.ARQUETIPO_PROYECTO : colMapP.CRITERIO;
            const criterioProy = String(proyRow[idxCrit] || "");
            if (criterioProy.includes("Alcance") || criterioProy.includes("A-")) {
              // Validar que no existan tareas pendientes asociadas al hito
              const sheetTar = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
              if (sheetTar) {
                const colMapT = (typeof TareasService !== "undefined" && TareasService.obtenerMapaColumnasTareas)
                  ? TareasService.obtenerMapaColumnasTareas(sheetTar)
                  : CONFIG.COLS_TAREAS;
                const tarData = sheetTar.getDataRange().getValues();
                const tareasIncompletas = tarData.slice(1).filter(t => {
                  const tHito = String(t[colMapT.ID_HITO] || "").trim().toUpperCase();
                  const tEst = String(t[colMapT.ESTADO] || "").trim();
                  return tHito === idHito.toUpperCase() && !tEst.includes("Completado") && !tEst.startsWith("04");
                });
                if (tareasIncompletas.length > 0) {
                  return {
                    success: false,
                    error: `[Validación DoD Estricta - Criterio Alcance]: El elemento ${idHito} no puede completarse porque tiene ${tareasIncompletas.length} tarea(s) pendiente(s) requerida(s) por el DoD.`
                  };
                }
              }
            }
          }
        }
      }
    }

    // Update ESTADO and possibly FECHA_REAL_FIN
    if (nuevoEstado !== undefined) {
      rowH[colMap.ESTADO] = nuevoEstado;
      if (nuevoEstado.includes("Completado") || nuevoEstado.startsWith("03")) {
        rowH[colMap.FECHA_REAL_FIN] = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
      }
    }
    // Update other optional fields
    const idxNom = colMap.NOMBRE_ELEMENTO !== undefined ? colMap.NOMBRE_ELEMENTO : colMap.NOMBRE_HITO;
    if (payload.nombreHito !== undefined || payload.nombreElemento !== undefined) {
      rowH[idxNom] = payload.nombreHito !== undefined ? payload.nombreHito : payload.nombreElemento;
    }
    if (colMap.WBS_CODE !== undefined && (payload.wbsCode !== undefined || payload.WBS_Code !== undefined)) {
      rowH[colMap.WBS_CODE] = payload.wbsCode !== undefined ? payload.wbsCode : payload.WBS_Code;
    }
    if (payload.faseAsociada !== undefined) rowH[colMap.FASE_ASOCIADA] = payload.faseAsociada;
    const idxFecLim = colMap.FECHA_LIMITE !== undefined ? colMap.FECHA_LIMITE : colMap.FECHA_LIMITE_PLAN;
    if (payload.fechaLimite !== undefined) rowH[idxFecLim] = payload.fechaLimite;
    const idxDod = colMap.CRITERIO_DOD !== undefined ? colMap.CRITERIO_DOD : colMap.DOD;
    if (payload.criterioDod !== undefined || payload.criterioAceptacion !== undefined || payload.criteriosDoD !== undefined) {
      rowH[idxDod] = payload.criterioDod || payload.criterioAceptacion || payload.criteriosDoD || "";
    }
    if (payload.pesoPct !== undefined) {
      let pNum = parseFloat(payload.pesoPct);
      if (pNum > 1) pNum = pNum / 100;
      rowH[colMap.PESO_PCT] = pNum;
    }
    if (colMap.DEPENDENCIA_PREDECESORA !== undefined && payload.dependenciaPredecesora !== undefined) {
      rowH[colMap.DEPENDENCIA_PREDECESORA] = payload.dependenciaPredecesora;
    }
    if (colMap.ENTREGABLE_LINK !== undefined && payload.entregableLink !== undefined) {
      rowH[colMap.ENTREGABLE_LINK] = payload.entregableLink;
    }
    // Write back the entire row in one batch
    sheet.getRange(rowIdx, 1, 1, lastColH).setValues([rowH]);

    invalidarCacheDashboard();
    return { success: true, idHito: idHito, idElementoWbs: idHito, idProyecto: idProyecto, tipoElementoWbs: targetTipo };
  },

  deleteHito: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
      if (!sheet) return { success: false, error: "Hoja de hitos no encontrada" };

      const idHito = String(payload.idHito || payload.ID_Hito || "").trim();
      if (!idHito) return { success: false, error: "ID_Hito requerido para eliminar" };

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: false, error: "No hay hitos registrados" };

      const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      let idProyHito = "";
      let hitoExiste = false;

      for (let i = 0; i < data.length; i++) {
        if (String(data[i][CONFIG.COLS_HITOS.ID_HITO] || "").trim().toUpperCase() === idHito.toUpperCase()) {
          hitoExiste = true;
          idProyHito = String(data[i][CONFIG.COLS_HITOS.ID_PROYECTO] || "").trim();
          break;
        }
      }

      if (!hitoExiste) return { success: false, error: "Hito no encontrado: " + idHito };

      // Integridad referencial: Desvincular tareas asociadas a este hito (ID_Hito = '') en un solo lote
      try {
        const sheetTar = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
        if (sheetTar && sheetTar.getLastRow() > 1) {
          const colHito = CONFIG.COLS_TAREAS.ID_HITO + 1;
          const lastRowTar = sheetTar.getLastRow();
          const rangeHito = sheetTar.getRange(2, colHito, lastRowTar - 1, 1);
          const dataTar = rangeHito.getValues();
          let huboCambios = false;

          for (let t = 0; t < dataTar.length; t++) {
            if (String(dataTar[t][0] || "").trim().toUpperCase() === idHito.toUpperCase()) {
              dataTar[t][0] = "";
              huboCambios = true;
            }
          }

          if (huboCambios) {
            rangeHito.setValues(dataTar);
          }
        }
      } catch (eTar) {
        Logger.log("[Desvincular tareas de hito Error]: " + eTar.message);
      }

      // Eliminar fila de hito de forma atómica en lote
      sobrescribirHojaFiltrada(sheet, function (row) {
        return String(row[CONFIG.COLS_HITOS.ID_HITO] || "").trim().toUpperCase() !== idHito.toUpperCase();
      });

      SpreadsheetApp.flush();
      invalidarCacheDashboard();

      return { success: true, idHito: idHito, idProyecto: idProyHito };
    } catch (err) {
      Logger.log("[deleteHito Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  }
};
