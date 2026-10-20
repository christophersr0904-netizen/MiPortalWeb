/**
 * ============================================================================
 * ARCHIVO: TareasService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Gestión de Tareas Operativas, Precedencias y Pasos Procedurales (SUB-XXX)
 * ============================================================================
 */

const TareasService = {

  obtenerOCrearHojaSubtareas: function() {
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
    return sheet;
  },

  eliminarEventoCalendarPorId: function(idEvento) {
    if (!idEvento) return false;
    try {
      if (typeof CalendarService !== "undefined" && CalendarService.eliminarEventoCalendar) {
        return CalendarService.eliminarEventoCalendar(idEvento, "PROYECTO");
      }
    } catch (e) {}
    try {
      const idLimpio = String(idEvento).trim();
      const ev = CalendarApp.getDefaultCalendar().getEventById(idLimpio);
      if (ev) {
        ev.deleteEvent();
        return true;
      }
    } catch (err) {
      Logger.log("[eliminarEventoCalendarPorId Error]: " + err.message);
    }
    return false;
  },

  obtenerMapaColumnasTareas: function(sheet) {
    return (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaTareas)
      ? CONFIG.obtenerMapaTareas(sheet)
      : CONFIG.COLS_TAREAS;
  },

  resolverIdProyectoPorHito: function(idHito) {
    if (!idHito) return "";
    const cleanHito = String(idHito).trim().toUpperCase();
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetH = ss.getSheetByName(CONFIG.SHEETS.HITOS);
      if (!sheetH || sheetH.getLastRow() <= 1) return "";
      const colMapH = (typeof HitosService !== "undefined" && HitosService.obtenerMapaColumnasHitos)
        ? HitosService.obtenerMapaColumnasHitos(sheetH)
        : (CONFIG.obtenerMapaHitos ? CONFIG.obtenerMapaHitos(sheetH) : (CONFIG.COLS_HITOS || {}));
      const dataH = sheetH.getDataRange().getValues();
      const idxIdH = colMapH.ID_ELEMENTO_WBS !== undefined ? colMapH.ID_ELEMENTO_WBS : (colMapH.ID_HITO !== undefined ? colMapH.ID_HITO : 0);
      const idxProyH = colMapH.ID_PROYECTO !== undefined ? colMapH.ID_PROYECTO : 1;
      for (let i = 1; i < dataH.length; i++) {
        if (String(dataH[i][idxIdH] || "").trim().toUpperCase() === cleanHito) {
          return String(dataH[i][idxProyH] || "").trim();
        }
      }
    } catch (eH) {
      Logger.log("[resolverIdProyectoPorHito Error]: " + eH.message);
    }
    return "";
  },

  normalizarYValidarEstadoTarea: function(rawEstado) {
    if (!rawEstado) return "02_Por_Hacer";
    const str = String(rawEstado).trim();
    if (str === "05_Cancelado" || /cancel/i.test(str)) return "05_Archivado";
    const permitidos = ["01_Backlog", "02_Por_Hacer", "03_En_Proceso", "04_Completado", "05_Archivado"];
    if (permitidos.includes(str)) return str;
    for (const est of permitidos) {
      if (str.startsWith(est.substring(0, 3)) || str.toLowerCase() === est.toLowerCase() || str.toLowerCase() === est.substring(3).toLowerCase()) {
        return est;
      }
    }
    return null;
  },

  createTarea: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const idTarea = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdTarea)
      ? CorrelativoService.generarIdTarea()
      : "TAR-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");

    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
    const colMap = TareasService.obtenerMapaColumnasTareas(sheet);

    // Validación rigurosa de estado de tarea
    const rawEstado = payload.estadoTarea || payload.estado || payload.Estado_Tarea || "02_Por_Hacer";
    const estadoValidado = TareasService.normalizarYValidarEstadoTarea(rawEstado);
    if (!estadoValidado) {
      return {
        success: false,
        error: "Estado de tarea inválido: '" + rawEstado + "'. Estados permitidos: 01_Backlog, 02_Por_Hacer, 03_En_Proceso, 04_Completado, 05_Archivado"
      };
    }

    let fechaProg = String(payload.fechaProgramada || payload.Fecha_Programada || "").trim();
    const horaProg = String(payload.horaProgramada || payload.horaInicio || "").trim();
    if (fechaProg && horaProg && /^\d{1,2}:\d{2}$/.test(horaProg)) {
      if (!fechaProg.includes(" ") && !fechaProg.includes("T")) {
        fechaProg = fechaProg + " " + (horaProg.length === 4 ? "0" + horaProg : horaProg);
      }
    }

    const hitoAsociado = String(payload.idHito || payload.idElementoWbs || payload.ID_Hito || "").trim();
    if (hitoAsociado) {
      if (typeof HitosService !== "undefined" && HitosService.validarAsociacionTareas) {
        const valRes = HitosService.validarAsociacionTareas(hitoAsociado);
        if (!valRes.permitido) {
          return { success: false, error: valRes.error };
        }
      }
    }

    // Resolución dinámica de idProyecto en memoria a partir del hito padre
    let idProyecto = String(payload.idProyecto || payload.ID_Proyecto || "").trim();
    if (!idProyecto && hitoAsociado) {
      idProyecto = TareasService.resolverIdProyectoPorHito(hitoAsociado);
    }

    const maxCols = colMap.MAX_COLUMNS || 14;
    const newRow = new Array(maxCols).fill("");
    newRow[colMap.ID_TAREA] = idTarea;
    newRow[colMap.ID_HITO] = hitoAsociado;
    if (colMap.ID_PROYECTO !== undefined) {
      newRow[colMap.ID_PROYECTO] = idProyecto;
    }
    newRow[colMap.NOMBRE_TAREA] = payload.nombreTareaActividad || payload.nombreTarea || payload.nombre || payload.Nombre_Tarea_Actividad || "";
    newRow[colMap.ESTADO] = estadoValidado;
    newRow[colMap.PRIORIDAD] = payload.prioridad || payload.Prioridad_Eisenhower || "02_P2_Media";
    newRow[colMap.NIVEL_ENERGIA] = payload.nivelEnergiaRequerido || payload.nivelEnergia || payload.Nivel_Energia_Requerido || "Media_Operativa";
    newRow[colMap.HORAS_ESTIMADAS] = parseFloat(payload.horasEstimadas !== undefined ? payload.horasEstimadas : payload.Horas_Estimadas) || 1.0;
    newRow[colMap.HORAS_REALES] = 0.0;
    newRow[colMap.FECHA_PROGRAMADA] = fechaProg;
    newRow[colMap.AGENDADO_CALENDAR] = "No";
    newRow[colMap.ID_DEPENDENCIA] = payload.idDependencia || payload.ID_Dependencia || "";
    newRow[colMap.RESPONSABLE] = payload.responsableEjecutor || payload.responsable || payload.Responsable_Ejecutor || "Christopher";
    newRow[colMap.NOTAS] = payload.notasImpedimentos || payload.notas || payload.Notas_Impedimentos || "";

    sheet.appendRow(newRow);
    invalidarCacheDashboard();

    if (newRow[colMap.FECHA_PROGRAMADA]) {
      try {
        if (typeof CalendarService !== "undefined") {
          if (CalendarService.agendarTareaEnCalendar) {
            CalendarService.agendarTareaEnCalendar(payload, sheet.getLastRow());
          } else if (CalendarService.sincronizarFilaTarea) {
            CalendarService.sincronizarFilaTarea(sheet.getLastRow(), payload);
          }
        }
      } catch (eCal) { }
    }

    return {
      success: true,
      idTarea: idTarea,
      data: {
        ID_Tarea: idTarea,
        ID_Hito: hitoAsociado,
        ID_Proyecto: idProyecto,
        Nombre_Tarea_Actividad: newRow[colMap.NOMBRE_TAREA],
        Estado_Tarea: estadoValidado,
        Prioridad_Eisenhower: newRow[colMap.PRIORIDAD],
        Nivel_Energia_Requerido: newRow[colMap.NIVEL_ENERGIA],
        Horas_Estimadas: newRow[colMap.HORAS_ESTIMADAS],
        Horas_Reales: 0.0,
        Fecha_Programada: newRow[colMap.FECHA_PROGRAMADA],
        Agendado_Calendar: "No",
        ID_Dependencia: newRow[colMap.ID_DEPENDENCIA],
        Responsable_Ejecutor: newRow[colMap.RESPONSABLE],
        Notas_Impedimentos: newRow[colMap.NOTAS]
      }
    };
  },

  updateTarea: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
    if (!sheet) return { success: false, error: "Hoja Tareas no encontrada" };

    const colMap = TareasService.obtenerMapaColumnasTareas(sheet);
    const data = sheet.getDataRange().getValues();
    const idBuscado = String(payload.idTarea || payload.ID_Tarea || payload.id || "").trim();
    let rowIdx = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colMap.ID_TAREA]).trim() === idBuscado) {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: "Tarea no encontrada: " + idBuscado };

    const datos = payload.datos || payload;
    const rawEstado = datos.Estado_Tarea !== undefined ? datos.Estado_Tarea : (datos.nuevoEstado !== undefined ? datos.nuevoEstado : (datos.estadoTarea !== undefined ? datos.estadoTarea : (datos.estado !== undefined ? datos.estado : payload.nuevoEstado)));

    // Reasignar la fila completa para preservar columnas de cálculo
    const lastColT = Math.max(sheet.getLastColumn(), colMap.MAX_COLUMNS || 14);
    const rowT = sheet.getRange(rowIdx, 1, 1, lastColT).getValues()[0];

    // Actualizar ESTADO si se suministró con validación rigurosa de 5 estados
    if (rawEstado !== undefined) {
      const estadoValidado = TareasService.normalizarYValidarEstadoTarea(rawEstado);
      if (!estadoValidado) {
        return {
          success: false,
          error: "Estado de tarea inválido: '" + rawEstado + "'. Estados permitidos: 01_Backlog, 02_Por_Hacer, 03_En_Proceso, 04_Completado, 05_Archivado"
        };
      }

      // Mecanismo Poka-Yoke Estricto: Definition of Done (DoD)
      if (estadoValidado === "04_Completado") {
        const sheetSub = ss.getSheetByName(CONFIG.SHEETS.SUBTAREAS);
        if (sheetSub && sheetSub.getLastRow() > 1) {
          const colSubPadre = (CONFIG.COLS_SUBTAREAS && CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO !== undefined) ? CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO : 1;
          const colSubComp = (CONFIG.COLS_SUBTAREAS && CONFIG.COLS_SUBTAREAS.COMPLETADO !== undefined) ? CONFIG.COLS_SUBTAREAS.COMPLETADO : 4;
          const subData = sheetSub.getRange(2, 1, sheetSub.getLastRow() - 1, sheetSub.getLastColumn()).getValues();
          const subPendientes = subData.filter(function(rSub) {
            const idPad = String(rSub[colSubPadre] || "").trim().toUpperCase();
            if (idPad !== idBuscado.toUpperCase()) return false;
            const comp = rSub[colSubComp];
            return !(comp === true || comp === "true" || comp === "Sí" || comp === 1 || comp === "1");
          });
          if (subPendientes.length > 0) {
            return {
              success: false,
              pokaYokeDoD: true,
              error: "[Poka-Yoke DoD]: No se puede completar la tarea '" + idBuscado + "' porque tiene " + subPendientes.length + " paso(s) de checklist pendiente(s) de verificación."
            };
          }
        }
      }

      rowT[colMap.ESTADO] = estadoValidado;
    }

    // Actualizar campos opcionales
    if (datos.Nombre_Tarea_Actividad || datos.nombreTareaActividad || datos.nombreTarea) {
      rowT[colMap.NOMBRE_TAREA] = datos.Nombre_Tarea_Actividad || datos.nombreTareaActividad || datos.nombreTarea;
    }

    let nuevoIdHito = null;
    if (datos.ID_Hito !== undefined || datos.idHito !== undefined || datos.idElementoWbs !== undefined) {
      nuevoIdHito = String(datos.ID_Hito !== undefined ? datos.ID_Hito : (datos.idHito || datos.idElementoWbs || "")).trim();
      if (nuevoIdHito && typeof HitosService !== "undefined" && HitosService.validarAsociacionTareas) {
        const valRes = HitosService.validarAsociacionTareas(nuevoIdHito);
        if (!valRes.permitido) {
          return { success: false, error: valRes.error };
        }
      }
      rowT[colMap.ID_HITO] = nuevoIdHito;
    }

    // Resolución dinámica de idProyecto en memoria
    if (datos.ID_Proyecto !== undefined || datos.idProyecto !== undefined) {
      if (colMap.ID_PROYECTO !== undefined) {
        rowT[colMap.ID_PROYECTO] = datos.ID_Proyecto || datos.idProyecto || "";
      }
    } else if (nuevoIdHito) {
      const proyResuelto = TareasService.resolverIdProyectoPorHito(nuevoIdHito);
      if (proyResuelto && colMap.ID_PROYECTO !== undefined) {
        rowT[colMap.ID_PROYECTO] = proyResuelto;
      }
    } else if (colMap.ID_PROYECTO !== undefined && (!rowT[colMap.ID_PROYECTO] || String(rowT[colMap.ID_PROYECTO]).trim().startsWith("="))) {
      const idHitoActual = rowT[colMap.ID_HITO];
      const proyResuelto = TareasService.resolverIdProyectoPorHito(idHitoActual);
      if (proyResuelto) {
        rowT[colMap.ID_PROYECTO] = proyResuelto;
      }
    }

    if (datos.ID_Dependencia !== undefined || datos.idDependencia !== undefined) {
      rowT[colMap.ID_DEPENDENCIA] = datos.ID_Dependencia || datos.idDependencia || "";
    }
    if (datos.Prioridad_Eisenhower || datos.prioridad) {
      rowT[colMap.PRIORIDAD] = datos.Prioridad_Eisenhower || datos.prioridad;
    }
    if (datos.Nivel_Energia_Requerido || datos.nivelEnergiaRequerido || datos.nivelEnergia) {
      rowT[colMap.NIVEL_ENERGIA] = datos.Nivel_Energia_Requerido || datos.nivelEnergiaRequerido || datos.nivelEnergia;
    }

    // Actualizar FECHA_PROGRAMADA respetando hora manual
    const horaProg = String(datos.horaProgramada || datos.horaInicio || payload.horaProgramada || payload.horaInicio || "").trim();
    let fechaProg = (datos.Fecha_Programada !== undefined ? String(datos.Fecha_Programada) : (datos.fechaProgramada !== undefined ? String(datos.fechaProgramada) : "")).trim();
    if (fechaProg && horaProg && /^\d{1,2}:\d{2}$/.test(horaProg)) {
      if (!fechaProg.includes(" ") && !fechaProg.includes("T")) {
        fechaProg = fechaProg + " " + (horaProg.length === 4 ? "0" + horaProg : horaProg);
      }
    }
    if (fechaProg) {
      rowT[colMap.FECHA_PROGRAMADA] = fechaProg;
    }

    if (datos.Horas_Estimadas !== undefined || datos.horasEstimadas !== undefined) {
      rowT[colMap.HORAS_ESTIMADAS] = parseFloat(datos.Horas_Estimadas || datos.horasEstimadas) || 1.0;
    }
    if (datos.Horas_Reales !== undefined || datos.horasReales !== undefined) {
      rowT[colMap.HORAS_REALES] = parseFloat(datos.Horas_Reales || datos.horasReales) || 0.0;
    }
    if (datos.Responsable_Ejecutor !== undefined || datos.responsableEjecutor !== undefined || datos.responsable !== undefined) {
      rowT[colMap.RESPONSABLE] = datos.Responsable_Ejecutor || datos.responsableEjecutor || datos.responsable || "Christopher";
    }
    if (datos.Notas_Impedimentos !== undefined || datos.notasImpedimentos !== undefined || datos.notas !== undefined) {
      rowT[colMap.NOTAS] = datos.Notas_Impedimentos || datos.notasImpedimentos || datos.notas || "";
    }

    // Escritura atómica en lote
    sheet.getRange(rowIdx, 1, 1, lastColT).setValues([rowT]);

    invalidarCacheDashboard();

    try {
      if (typeof CalendarService !== "undefined") {
        if (CalendarService.agendarTareaEnCalendar) {
          CalendarService.agendarTareaEnCalendar(payload, rowIdx);
        } else if (CalendarService.sincronizarFilaTarea) {
          CalendarService.sincronizarFilaTarea(rowIdx, payload);
        }
      }
    } catch (eCal) { }

    return { success: true, idTarea: idBuscado };
  },

  deleteTarea: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const eliminarEventoCalendarPorId = this.eliminarEventoCalendarPorId;
      const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
      if (!sheet) return { success: false, error: "Hoja de tareas no encontrada" };

      const idTar = String(payload.idTarea || payload.ID_Tarea || "").trim();
      if (!idTar) return { success: false, error: "ID_Tarea requerido para eliminar" };

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: false, error: "No hay tareas registradas" };

      const colMap = TareasService.obtenerMapaColumnasTareas(sheet);
      const idxIdTar = colMap.ID_TAREA !== undefined ? colMap.ID_TAREA : 0;
      const idxAgendado = colMap.AGENDADO_CALENDAR !== undefined ? colMap.AGENDADO_CALENDAR : 10;
      const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      let agendadoVal = "";
      let tareaExiste = false;

      for (let i = 0; i < data.length; i++) {
        if (String(data[i][idxIdTar] || "").trim().toUpperCase() === idTar.toUpperCase()) {
          tareaExiste = true;
          agendadoVal = String(data[i][idxAgendado] || "").trim();
          break;
        }
      }

      if (!tareaExiste) return { success: false, error: "Tarea no encontrada: " + idTar };

      // Limpieza de Google Calendar
      if (agendadoVal && agendadoVal.includes("|")) {
        const idEv = agendadoVal.split("|")[1].trim();
        try {
          if (typeof eliminarEventoCalendarPorId === "function") {
            eliminarEventoCalendarPorId(idEv);
          } else if (typeof CalendarService !== "undefined" && CalendarService.eliminarEvento) {
            CalendarService.eliminarEvento(idEv);
          }
        } catch (eCal) {
          Logger.log("[Calendar Delete Error]: " + eCal.message);
        }
      }

      // Cascada: Eliminar subtareas procedurales asociadas a esta tarea en lote atómico
      try {
        const sheetSub = ss.getSheetByName(CONFIG.SHEETS.SUBTAREAS);
        if (sheetSub && sheetSub.getLastRow() > 1) {
          sobrescribirHojaFiltrada(sheetSub, function(row) {
            const tipoP = String(row[CONFIG.COLS_SUBTAREAS.TIPO_PADRE] || "").trim().toUpperCase();
            const idP = String(row[CONFIG.COLS_SUBTAREAS.ID_PADRE] || "").trim().toUpperCase();
            return !(tipoP === "TAREA" && idP === idTar.toUpperCase());
          });
        }
      } catch (eSub) {
        Logger.log("[Cascada Subtareas Tarea Error]: " + eSub.message);
      }

      // Eliminar fila de tarea de forma atómica en lote
      sobrescribirHojaFiltrada(sheet, function(row) {
        return String(row[idxIdTar] || "").trim().toUpperCase() !== idTar.toUpperCase();
      });

      SpreadsheetApp.flush();
      invalidarCacheDashboard();

      return { success: true, idTarea: idTar };
    } catch (err) {
      Logger.log("[deleteTarea Fatal Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  createSubtarea: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const obtenerOCrearHojaSubtareas = this.obtenerOCrearHojaSubtareas;
    const sheet = obtenerOCrearHojaSubtareas();
    const p = payload || {};
    const idPadre = String(p.idPadre || p.idPadreVinculado || p.ID_Padre_Vinculado || p.ID_Padre || p.idTareaPadre || p.ID_Tarea_Padre || p.idActividadPadre || p.ID_Actividad_Padre || "").trim();
    if (!idPadre) return { success: false, error: "ID_Padre es obligatorio para registrar un paso." };

    const tipoPadre = String(p.tipoPadre || p.Tipo_Padre || (idPadre.startsWith("ACT-") ? "ACTIVIDAD" : "TAREA")).trim().toUpperCase();
    const descPaso = String(p.descripcionPaso || p.Descripcion_Paso || p.titulo || p.Titulo || "").trim();
    if (!descPaso) return { success: false, error: "La descripción del paso no puede estar vacía." };

    // Determinar siguiente número de paso para este padre
    let numPaso = parseInt(p.numeroPaso || p.Numero_Paso || p.orden, 10);
    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(sheet.getLastColumn(), 6);
    if (isNaN(numPaso) || numPaso <= 0) {
      let maxNum = 0;
      if (lastRow > 1) {
        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const isLegacy7 = (row.length >= 7 && (String(row[1]).toUpperCase() === "TAREA" || String(row[1]).toUpperCase() === "ACTIVIDAD"));
          const rowIdPadre = isLegacy7 ? String(row[2] || "").trim() : String(row[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] || "").trim();
          if (rowIdPadre === idPadre) {
            const pasoActual = parseInt(isLegacy7 ? row[3] : row[CONFIG.COLS_SUBTAREAS.NUMERO_PASO], 10) || 0;
            if (pasoActual > maxNum) maxNum = pasoActual;
          }
        }
      }
      numPaso = maxNum + 1;
    }

    const idSub = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarCorrelativo)
      ? CorrelativoService.generarCorrelativo("SUB")
      : ((typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdSubtarea)
        ? CorrelativoService.generarIdSubtarea()
        : "SUB-" + Date.now());

    const maxCols = (CONFIG.COLS_SUBTAREAS && CONFIG.COLS_SUBTAREAS.MAX_COLUMNS) || 6;
    const newRow = new Array(maxCols).fill("");
    newRow[CONFIG.COLS_SUBTAREAS.ID_SUBTAREA] = idSub;
    newRow[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] = idPadre;
    newRow[CONFIG.COLS_SUBTAREAS.NUMERO_PASO] = numPaso;
    newRow[CONFIG.COLS_SUBTAREAS.DESCRIPCION_PASO] = descPaso;
    newRow[CONFIG.COLS_SUBTAREAS.COMPLETADO] = false;
    newRow[CONFIG.COLS_SUBTAREAS.FECHA_COMPLETADO] = "";

    sheet.appendRow(newRow);
    if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }

    return {
      success: true,
      data: {
        ID_Subtarea: idSub,
        idSubtarea: idSub,
        ID_Padre_Vinculado: idPadre,
        idPadreVinculado: idPadre,
        ID_Padre: idPadre,
        idPadre: idPadre,
        Tipo_Padre: tipoPadre,
        tipoPadre: tipoPadre,
        Numero_Paso: numPaso,
        numeroPaso: numPaso,
        Descripcion_Paso: descPaso,
        descripcionPaso: descPaso,
        Completado: false,
        completado: false,
        Fecha_Completado: "",
        fechaCompletado: ""
      }
    };
  },

  guardarPaso: function(payload) {
    return this.createSubtarea(payload);
  },

  updateSubtareaCompletado: function(payload, optCompletado) {
    let p = payload;
    if (typeof payload === "string") {
      p = { idSubtarea: payload, completado: optCompletado };
    } else if (!p) {
      p = {};
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const obtenerOCrearHojaSubtareas = this.obtenerOCrearHojaSubtareas;
    const sheet = obtenerOCrearHojaSubtareas();
    const idSub = String(p.idSubtarea || p.ID_Subtarea || "").trim();
    const idPadre = String(p.idPadre || p.idPadreVinculado || p.ID_Padre_Vinculado || p.ID_Padre || p.idTareaPadre || p.ID_Tarea_Padre || p.idActividadPadre || p.ID_Actividad_Padre || "").trim();

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, error: "No existen subtareas registradas." };

    const lastCol = Math.max(sheet.getLastColumn(), 6);
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const pasosPadre = [];
    let targetPaso = null;
    let targetRowIndex = -1;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const isLegacy7 = (row.length >= 7 && (String(row[1]).toUpperCase() === "TAREA" || String(row[1]).toUpperCase() === "ACTIVIDAD"));
      const colIdSub = CONFIG.COLS_SUBTAREAS.ID_SUBTAREA;
      const colIdPadre = isLegacy7 ? 2 : CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO;
      const colNumPaso = isLegacy7 ? 3 : CONFIG.COLS_SUBTAREAS.NUMERO_PASO;
      const colDesc = isLegacy7 ? 4 : CONFIG.COLS_SUBTAREAS.DESCRIPCION_PASO;
      const colComp = isLegacy7 ? 5 : CONFIG.COLS_SUBTAREAS.COMPLETADO;
      const colFec = isLegacy7 ? 6 : CONFIG.COLS_SUBTAREAS.FECHA_COMPLETADO;

      const rowIdSub = String(row[colIdSub] || "").trim();
      const rowIdPadre = String(row[colIdPadre] || "").trim();
      const rowCompVal = row[colComp];
      const isRowComp = (rowCompVal === true || String(rowCompVal).toLowerCase() === "true" || String(rowCompVal).toLowerCase() === "sí" || String(rowCompVal).toLowerCase() === "si");
      const numPaso = parseInt(row[colNumPaso], 10) || 1;

      if (rowIdSub === idSub || (idPadre && rowIdPadre === idPadre)) {
        const pasoObj = {
          rowIndex: i + 2,
          colCompIndex: colComp + 1,
          colFecIndex: colFec + 1,
          idSubtarea: rowIdSub,
          idPadre: rowIdPadre,
          numeroPaso: numPaso,
          descripcion: String(row[colDesc] || "").trim(),
          completado: isRowComp,
          fechaCompletado: String(row[colFec] || "")
        };
        pasosPadre.push(pasoObj);
        if (rowIdSub === idSub) {
          targetPaso = pasoObj;
          targetRowIndex = i + 2;
        }
      }
    }

    if (!targetPaso) return { success: false, error: "Paso de subtarea no encontrado: " + idSub };

    // Si completado no viene especificado en payload, conmutar (toggle)
    const deseadoComp = (p.completado === undefined)
      ? !targetPaso.completado
      : (p.completado === true || String(p.completado).toLowerCase() === "true" || String(p.completado).toLowerCase() === "sí" || String(p.completado).toLowerCase() === "si");

    // Ordenar pasos por Numero_Paso
    pasosPadre.sort((a, b) => a.numeroPaso - b.numeroPaso);

    const nowStr = Utilities.formatDate(new Date(), (CONFIG && CONFIG.TIMEZONE) || "GMT-5", "yyyy-MM-dd HH:mm:ss");

    if (deseadoComp) {
      // REGLA SECUENCIAL: Para marcar el Paso N (N > 1), todos los pasos anteriores (1 .. N-1) deben estar completados.
      const predecesoresIncompletos = pasosPadre.filter(p => p.numeroPaso < targetPaso.numeroPaso && !p.completado);
      if (predecesoresIncompletos.length > 0) {
        return {
          success: false,
          error: "Secuencia bloqueada: Debes completar primero el Paso " + predecesoresIncompletos[0].numeroPaso + " (" + predecesoresIncompletos[0].descripcion + ")."
        };
      }

      sheet.getRange(targetRowIndex, targetPaso.colCompIndex).setValue(true);
      sheet.getRange(targetRowIndex, targetPaso.colFecIndex).setValue(nowStr);
      targetPaso.completado = true;
      targetPaso.fechaCompletado = nowStr;
    } else {
      // REGLA DE DESMARCADO EN CASCADA: Si se desmarca el Paso N, se desmarca este paso y TODOS los pasos posteriores (Paso > N)
      sheet.getRange(targetRowIndex, targetPaso.colCompIndex).setValue(false);
      sheet.getRange(targetRowIndex, targetPaso.colFecIndex).setValue("");
      targetPaso.completado = false;
      targetPaso.fechaCompletado = "";

      for (let j = 0; j < pasosPadre.length; j++) {
        const p = pasosPadre[j];
        if (p.numeroPaso > targetPaso.numeroPaso && p.completado) {
          sheet.getRange(p.rowIndex, p.colCompIndex).setValue(false);
          sheet.getRange(p.rowIndex, p.colFecIndex).setValue("");
          p.completado = false;
          p.fechaCompletado = "";
        }
      }
    }

    if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }

    return {
      success: true,
      idSubtarea: idSub,
      ID_Subtarea: idSub,
      idPadre: targetPaso.idPadre,
      ID_Padre: targetPaso.idPadre,
      ID_Padre_Vinculado: targetPaso.idPadre,
      idPadreVinculado: targetPaso.idPadre,
      completado: deseadoComp,
      fechaCompletado: targetPaso.fechaCompletado,
      pasosActualizados: pasosPadre.map(p => ({
        ID_Subtarea: p.idSubtarea,
        idSubtarea: p.idSubtarea,
        ID_Padre_Vinculado: p.idPadre,
        idPadreVinculado: p.idPadre,
        ID_Padre: p.idPadre,
        idPadre: p.idPadre,
        Numero_Paso: p.numeroPaso,
        numeroPaso: p.numeroPaso,
        Descripcion_Paso: p.descripcion,
        descripcionPaso: p.descripcion,
        Completado: p.completado,
        completado: p.completado,
        Fecha_Completado: p.fechaCompletado,
        fechaCompletado: p.fechaCompletado
      }))
    };
  },

  togglePaso: function(payload) {
    return this.updateSubtareaCompletado(payload);
  },

  updateSubtarea: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const obtenerOCrearHojaSubtareas = this.obtenerOCrearHojaSubtareas;
    const sheet = obtenerOCrearHojaSubtareas();
    const idSub = String(payload.idSubtarea || payload.ID_Subtarea || "").trim();
    if (!idSub) return { success: false, error: "ID_Subtarea requerido" };

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, error: "No hay registros" };

    const lastCol = Math.max(sheet.getLastColumn(), 6);
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    let rowIdx = -1;
    let isLegacy7Row = false;
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][CONFIG.COLS_SUBTAREAS.ID_SUBTAREA] || "").trim() === idSub) {
        rowIdx = i + 2;
        isLegacy7Row = (data[i].length >= 7 && (String(data[i][1]).toUpperCase() === "TAREA" || String(data[i][1]).toUpperCase() === "ACTIVIDAD"));
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: "Subtarea no encontrada: " + idSub };

    const colDescIdx = isLegacy7Row ? 4 : CONFIG.COLS_SUBTAREAS.DESCRIPCION_PASO;
    const colNumIdx = isLegacy7Row ? 3 : CONFIG.COLS_SUBTAREAS.NUMERO_PASO;

    if (payload.descripcionPaso !== undefined || payload.Descripcion_Paso !== undefined || payload.titulo !== undefined) {
      const nuevaDesc = String(payload.descripcionPaso || payload.Descripcion_Paso || payload.titulo || "").trim();
      sheet.getRange(rowIdx, colDescIdx + 1).setValue(nuevaDesc);
    }
    if (payload.numeroPaso !== undefined || payload.Numero_Paso !== undefined || payload.orden !== undefined) {
      const nuevoNum = parseInt(payload.numeroPaso || payload.Numero_Paso || payload.orden, 10);
      if (!isNaN(nuevoNum)) {
        sheet.getRange(rowIdx, colNumIdx + 1).setValue(nuevoNum);
      }
    }

    if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }
    return { success: true, idSubtarea: idSub, ID_Subtarea: idSub };
  },

  reordenarSubtareas: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const obtenerOCrearHojaSubtareas = this.obtenerOCrearHojaSubtareas;
    const sheet = obtenerOCrearHojaSubtareas();
    const idPadre = String(payload.idPadre || payload.idPadreVinculado || payload.ID_Padre_Vinculado || payload.ID_Padre || "").trim();
    const ordenIds = payload.ordenIds || [];
    if (!idPadre || !Array.isArray(ordenIds) || ordenIds.length === 0) {
      return { success: false, error: "idPadre y ordenIds requeridos" };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true };

    const lastCol = Math.max(sheet.getLastColumn(), 6);
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const isLegacy7 = (row.length >= 7 && (String(row[1]).toUpperCase() === "TAREA" || String(row[1]).toUpperCase() === "ACTIVIDAD"));
      const rowIdSub = String(row[CONFIG.COLS_SUBTAREAS.ID_SUBTAREA] || "").trim();
      const rowIdPadre = isLegacy7 ? String(row[2] || "").trim() : String(row[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] || "").trim();
      const colNumIdx = isLegacy7 ? 3 : CONFIG.COLS_SUBTAREAS.NUMERO_PASO;

      if (rowIdPadre === idPadre) {
        const nuevoIndice = ordenIds.indexOf(rowIdSub);
        if (nuevoIndice !== -1) {
          sheet.getRange(i + 2, colNumIdx + 1).setValue(nuevoIndice + 1);
        }
      }
    }

    if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }
    return { success: true, idPadre: idPadre, ID_Padre: idPadre, ID_Padre_Vinculado: idPadre };
  },

  deleteSubtarea: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const obtenerOCrearHojaSubtareas = this.obtenerOCrearHojaSubtareas;
      const sheet = obtenerOCrearHojaSubtareas();
      const idSub = String(payload.idSubtarea || payload.ID_Subtarea || "").trim();
      const idPadre = String(payload.idPadre || payload.idPadreVinculado || payload.ID_Padre_Vinculado || payload.ID_Padre || "").trim();
      if (!idSub) return { success: false, error: "ID_Subtarea requerido" };

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow <= 1) return { success: false, error: "No hay registros" };

      const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      const data = dataRange.getValues();
      let targetPadre = idPadre;
      let subtareaExiste = false;

      // 1. Filtrar en memoria excluyendo idSub y recolectar targetPadre
      const filasConservadas = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const isLegacy7 = (row.length >= 7 && (String(row[1]).toUpperCase() === "TAREA" || String(row[1]).toUpperCase() === "ACTIVIDAD"));
        const idActual = String(row[CONFIG.COLS_SUBTAREAS.ID_SUBTAREA] || "").trim();
        const rowIdPadre = isLegacy7 ? String(row[2] || "").trim() : String(row[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] || "").trim();

        if (idActual.toUpperCase() === idSub.toUpperCase()) {
          subtareaExiste = true;
          if (!targetPadre) targetPadre = rowIdPadre;
        } else {
          filasConservadas.push(row);
        }
      }

      if (!subtareaExiste) return { success: false, error: "Subtarea no encontrada: " + idSub };

      // 2. Renumerar los pasos restantes del targetPadre en memoria
      if (targetPadre) {
        let pasoNum = 1;
        for (let j = 0; j < filasConservadas.length; j++) {
          const rowCons = filasConservadas[j];
          const isLegacy7 = (rowCons.length >= 7 && (String(rowCons[1]).toUpperCase() === "TAREA" || String(rowCons[1]).toUpperCase() === "ACTIVIDAD"));
          const rowConsPadre = isLegacy7 ? String(rowCons[2] || "").trim() : String(rowCons[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] || "").trim();
          const colNumIdx = isLegacy7 ? 3 : CONFIG.COLS_SUBTAREAS.NUMERO_PASO;

          if (rowConsPadre.toUpperCase() === targetPadre.toUpperCase()) {
            rowCons[colNumIdx] = pasoNum;
            pasoNum++;
          }
        }
      }

      // 3. Sobrescritura atómica en lote único
      dataRange.clearContent();
      if (filasConservadas.length > 0) {
        sheet.getRange(2, 1, filasConservadas.length, lastCol).setValues(filasConservadas);
      }

      SpreadsheetApp.flush();
      if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }

      return { success: true, idSubtarea: idSub, ID_Subtarea: idSub, idPadre: targetPadre, ID_Padre_Vinculado: targetPadre };
    } catch (err) {
      Logger.log("[deleteSubtarea Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  }
};
