/**
 * ============================================================================
 * ARCHIVO: ActividadesService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Gestión de Hábitos, Actividades Personales, Ciclos y Rachas
 * GOBERNANZA:
 *   - Duración = 0h -> Google Tasks (Check puntual con fecha límite)
 *   - Duración > 0h -> Google Calendar (Bloque de tiempo agendado)
 *   - Recurrencia   -> Ajuste automático al día hábil/permitido más próximo
 * ============================================================================
 */

const ActividadesService = {

  // ============================================================================
  // SECCIÓN 1: UTILIDADES DE BASE DE DATOS Y FECHAS DE RECURRENCIA
  // ============================================================================

  /**
   * Obtiene o inicializa la hoja física de subtareas/pasos procedurales.
   *
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  obtenerOCrearHojaSubtareas: function () {
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

  /**
   * Calcula la primera fecha válida según la regla de repetición o días asignados.
   * Si la fecha base cae en un día no contemplado, avanza hasta el primer día permitido.
   *
   * @param {string|Date} fechaBaseStr - Fecha inicial en formato YYYY-MM-DD.
   * @param {string} frecuenciaCiclo - 'DIARIA', 'DIARIA_LABORAL', 'FIN_SEMANA', etc.
   * @param {string} reglaRepeticion - 'L-V', 'DIAS:L,M,V', etc.
   * @returns {string} Fecha normalizada en formato 'YYYY-MM-DD'.
   */
  _calcularProximaFechaValida: function (fechaBaseStr, frecuenciaCiclo, reglaRepeticion, diasSeleccionados) {
    if (!fechaBaseStr) {
      fechaBaseStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    }

    const partes = String(fechaBaseStr).split(/[\sT]/)[0].split("-");
    if (partes.length !== 3) return fechaBaseStr;

    // Crear fecha al mediodía local para neutralizar saltos horarios
    let d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 12, 0, 0);
    const freq = String(frecuenciaCiclo || "DIARIA").toUpperCase().trim();
    const regla = String(reglaRepeticion || "").toUpperCase().trim();

    // Mapeo JS: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
    let diasPermitidos = [];

    // Prioridad 1: Días estructurados enviados como array numérico (ej: [1, 4] donde 1=Lunes, 4=Jueves)
    if (Array.isArray(diasSeleccionados) && diasSeleccionados.length > 0) {
      diasSeleccionados.forEach(function (num) {
        let n = parseInt(num, 10);
        if (!isNaN(n)) {
          if (n === 7) n = 0; // Domingo normalizado a 0
          if (n >= 0 && n <= 6 && diasPermitidos.indexOf(n) === -1) {
            diasPermitidos.push(n);
          }
        }
      });
    }

    // Prioridad 2: Reglas textuales si no se especificaron números
    if (diasPermitidos.length === 0) {
      if (freq === "DIARIA_LABORAL" || regla === "L-V") {
        diasPermitidos = [1, 2, 3, 4, 5];
      } else if (freq === "FIN_SEMANA" || regla === "DIAS:S,D") {
        diasPermitidos = [0, 6];
      } else if (regla.startsWith("DIAS:") || /^[LMXJVSD,]+$/.test(regla)) {
        const mapeo = {
          "L": 1, "LU": 1, "LUN": 1,
          "M": 2, "MA": 2, "MAR": 2,
          "X": 3, "MI": 3, "MIER": 3,
          "J": 4, "JU": 4, "JUE": 4,
          "V": 5, "VI": 5, "VIE": 5,
          "S": 6, "SA": 6, "SAB": 6,
          "D": 0, "DO": 0, "DOM": 0
        };
        const rawDias = regla.replace("DIAS:", "").split(",");
        rawDias.forEach(function (diaToken) {
          const tokenLimpio = diaToken.trim();
          if (mapeo[tokenLimpio] !== undefined && diasPermitidos.indexOf(mapeo[tokenLimpio]) === -1) {
            diasPermitidos.push(mapeo[tokenLimpio]);
          }
        });
      }
    }

    // Si existen restricciones de días, avanzar en bucle hasta encontrar la primera coincidencia
    if (diasPermitidos.length > 0) {
      for (let i = 0; i < 7; i++) {
        if (diasPermitidos.indexOf(d.getDay()) !== -1) {
          break;
        }
        d.setDate(d.getDate() + 1);
      }
    }

    return Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd");
  },

  /**
   * Calcula el siguiente ciclo a partir del día siguiente para hábitos completados.
   *
   * @param {string} fechaBaseStr - Fecha última ejecutada en 'YYYY-MM-DD'.
   * @param {string} frecuenciaCiclo
   * @param {string} reglaRepeticion
   * @returns {string} Siguiente fecha válida.
   */
  _calcularSiguienteFechaCiclo: function (fechaBaseStr, frecuenciaCiclo, reglaRepeticion) {
    const partes = String(fechaBaseStr).split(/[\sT]/)[0].split("-");
    let d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 12, 0, 0);
    d.setDate(d.getDate() + 1);
    const mananaStr = Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd");
    return this._calcularProximaFechaValida(mananaStr, frecuenciaCiclo, reglaRepeticion);
  },

  /**
   * Elimina un evento en Google Calendar o una tarea en Google Tasks según su formato de ID.
   *
   * @param {string} idEvento
   * @returns {boolean}
   */
  eliminarEventoCalendarPorId: function (idEvento, nombreOpcional) {
    let algunBorrado = false;

    if (idEvento) {
      const ids = String(idEvento).split("||");
      ids.forEach(item => {
        const idLimpio = item.trim();
        if (!idLimpio) return;

        // 1. Si es un Google Task ID (no contiene @google.com)
        if (!idLimpio.includes("@google.com")) {
          try {
            if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTask) {
              const resTask = GoogleTasksService.eliminarTask(idLimpio);
              if (resTask) algunBorrado = true;
            }
          } catch (eTask) {
            Logger.log("[eliminarEventoCalendarPorId Tasks Error]: " + eTask.message);
          }
        } else {
          // 2. Si es evento de Google Calendar
          try {
            if (typeof CalendarService !== "undefined" && CalendarService.eliminarEventoCalendar) {
              CalendarService.eliminarEventoCalendar(idLimpio, "HABITO");
              algunBorrado = true;
            }
          } catch (e) { }

          try {
            const ev = CalendarApp.getDefaultCalendar().getEventById(idLimpio);
            if (ev) {
              ev.deleteEvent();
              algunBorrado = true;
            }
          } catch (err) {
            Logger.log("[eliminarEventoCalendarPorId Error]: " + err.message);
          }
        }
      });
    }

    // 3. Limpieza reactiva en Google Tasks por coincidencia de título (para eliminar huérfanos)
    if (nombreOpcional && typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTaskPorTitulo) {
      try {
        const borradoOrf = GoogleTasksService.eliminarTaskPorTitulo(nombreOpcional);
        if (borradoOrf) algunBorrado = true;
      } catch (eOrf) {
        Logger.log("[eliminarEventoCalendarPorId eliminarTaskPorTitulo Error]: " + eOrf.message);
      }
    }

    return algunBorrado;
  },

  // ============================================================================
  // SECCIÓN 2: CREACIÓN TRANSACCIONAL DE ACTIVIDADES / HÁBITOS
  // ============================================================================

  /**
   * Crea una actividad personal o hábito garantizando sincronización estricta por duración.
   * Si duración = 0h genera una Google Task; si duración > 0h genera un bloque en Google Calendar.
   * Persiste inmediatamente el eventId/taskId en la hoja de cálculo.
   *
   * @param {Object} payload
   * @returns {Object} { success: boolean, idActividad: string, data: Object }
   */
  createActividadPersonal: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const obtenerOCrearHojaSubtareas = this.obtenerOCrearHojaSubtareas;
    const idActividad = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdActividadPersonal)
      ? CorrelativoService.generarIdActividadPersonal()
      : "ACT-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");

    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
    if (!sheet) return { success: false, error: "Hoja BBDD_Actividades_Personales no encontrada" };

    // Evaluar si es puntual (checkbox Puntual, duración 0 o tipo PUNTUAL)
    let esPuntual = (
      payload.esPuntual === true ||
      String(payload.esPuntual) === "true" ||
      (payload.duracionMinutos !== undefined && Number(payload.duracionMinutos) === 0) ||
      (payload.duracionHoras !== undefined && Number(payload.duracionHoras) === 0) ||
      String(payload.tipoCompromiso).toUpperCase() === "PUNTUAL"
    );

    const fechaBase = payload.fechaProgramada || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    let frecCiclo = String(payload.frecuenciaCiclo || (esPuntual ? "NINGUNA" : "DIARIA")).trim().toUpperCase();
    const reglaRep = String(payload.reglaRepeticion || "").trim().toUpperCase();
    const diasSeleccionados = Array.isArray(payload.diasSeleccionados) ? payload.diasSeleccionados : [];

    // Si tiene días seleccionados y frecuencia era DIARIA, actualizar a PERSONALIZADA
    if (diasSeleccionados.length > 0 && frecCiclo === "DIARIA") {
      frecCiclo = "PERSONALIZADA";
    }

    // 1. Ajuste automático al primer día permitido según la regla y días seleccionados
    const fechaProg = this._calcularProximaFechaValida(fechaBase, frecCiclo, reglaRep, diasSeleccionados);
    payload.fechaProgramada = fechaProg;

    // 2. Normalización matemática estricta de duración horaria (soporta 0 horas para Tasks)
    let duracionVal = esPuntual ? 0 : 1.0;
    if (!esPuntual && payload.duracionHoras !== undefined && payload.duracionHoras !== null && payload.duracionHoras !== "") {
      const parsedDur = parseFloat(payload.duracionHoras);
      duracionVal = !isNaN(parsedDur) ? parsedDur : 1.0;
    }
    if (duracionVal === 0) {
      esPuntual = true;
    }

    const tipoCompromiso = esPuntual ? "PUNTUAL" : (payload.tipoCompromiso || "HABITUAL");
    const esAgendadoDeseado = (String(payload.agendadoCalendar || "").toLowerCase().startsWith("s") || String(payload.agendadoCalendar || "") === "true") ? "Sí" : "No";
    const nombreAct = payload.Nombre_Actividad || payload.nombreActividad || "";
    const notasAct = payload.Descripcion || payload.notasChecklist || "";

    const colMap = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaActividades)
      ? CONFIG.obtenerMapaActividades(sheet)
      : CONFIG.COLS_ACTIVIDADES_PERSONALES;

    const catNorm = (typeof CONFIG !== "undefined" && CONFIG.normalizarCategoriaVida)
      ? CONFIG.normalizarCategoriaVida(payload.categoriaVida || payload.Categoria_Vida)
      : "SALUD_DEPORTE";

    const numCols = Math.max(colMap.MAX_COLUMNS || 16, 16);
    const newRow = new Array(numCols).fill("");
    const idxNom = colMap.NOMBRE !== undefined ? colMap.NOMBRE : colMap.NOMBRE_ACTIVIDAD;
    const idxTipo = colMap.TIPO_REGISTRO !== undefined ? colMap.TIPO_REGISTRO : colMap.TIPO_COMPROMISO;

    newRow[colMap.ID_ACTIVIDAD] = idActividad;
    newRow[idxNom] = nombreAct;
    newRow[idxTipo] = tipoCompromiso;
    newRow[colMap.CATEGORIA_VIDA] = catNorm;
    if (colMap.META_MACRO_NOMBRE !== undefined) newRow[colMap.META_MACRO_NOMBRE] = String(payload.metaMacroNombre || payload.Meta_Macro_Nombre || "").trim();
    if (colMap.UNIDAD_MEDIDA !== undefined) newRow[colMap.UNIDAD_MEDIDA] = String(payload.unidadMedida || payload.Unidad_Medida || "").trim();
    if (colMap.META_OBJETIVO_TOTAL !== undefined) newRow[colMap.META_OBJETIVO_TOTAL] = parseFloat(payload.metaObjetivoTotal || payload.Meta_Objetivo_Total) || 0.0;
    if (colMap.VALOR_ACUMULADO_ACTUAL !== undefined) newRow[colMap.VALOR_ACUMULADO_ACTUAL] = parseFloat(payload.valorAcumuladoActual || payload.Valor_Acumulado_Actual || payload.valorAvance || payload.avance) || 0.0;
    if (colMap.META_DIARIA_ESTANDAR !== undefined) newRow[colMap.META_DIARIA_ESTANDAR] = parseFloat(payload.metaDiariaEstandar || payload.Meta_Diaria_Estandar) || 0.0;
    if (colMap.NIVEL_RESCATE_MINIMO !== undefined) newRow[colMap.NIVEL_RESCATE_MINIMO] = parseFloat(payload.nivelRescateMinimo || payload.Nivel_Rescate_Minimo) || 0.0;
    newRow[colMap.ESTADO] = String(payload.estado || payload.Estado || "02_Por_Hacer").trim();
    newRow[colMap.RACHA_ACTUAL] = parseInt(payload.rachaActual || payload.Racha_Actual, 10) || 0;
    newRow[colMap.FECHA_PROGRAMADA] = fechaProg;
    newRow[colMap.HORA_INICIO] = String(payload.horaInicio || payload.Hora_Inicio || "08:00").trim();
    newRow[colMap.AGENDADO_CALENDAR] = esAgendadoDeseado;
    newRow[colMap.ID_EVENTO_CALENDAR] = "";

    // Campos secundarios defensivos si la hoja física aún conserva columnas excedentes
    if (colMap.PRIORIDAD_EISENHOWER !== undefined) newRow[colMap.PRIORIDAD_EISENHOWER] = payload.prioridad || "02_P2_Media";
    if (colMap.FRECUENCIA_CICLO !== undefined) newRow[colMap.FRECUENCIA_CICLO] = frecCiclo;
    if (colMap.REGLA_REPETICION !== undefined) newRow[colMap.REGLA_REPETICION] = reglaRep;
    if (colMap.DURACION_HORAS !== undefined) newRow[colMap.DURACION_HORAS] = duracionVal;
    if (colMap.MONTO_GASTO_ASOCIADO !== undefined) newRow[colMap.MONTO_GASTO_ASOCIADO] = parseFloat(payload.montoGastoAsociado) || 0.0;
    if (colMap.NOTAS_CHECKLIST !== undefined) newRow[colMap.NOTAS_CHECKLIST] = payload.notasChecklist || "";

    sheet.appendRow(newRow);
    const nuevaFilaIdx = sheet.getLastRow();

    // 3. Crear pasos/subtareas iniciales si fueron enviadas
    const subtareasCreadas = [];
    const listaPasos = Array.isArray(payload.subtareas) ? payload.subtareas : (Array.isArray(payload.pasos) ? payload.pasos : []);
    if (listaPasos.length > 0) {
      try {
        const subSheet = obtenerOCrearHojaSubtareas();
        for (let sIdx = 0; sIdx < listaPasos.length; sIdx++) {
          const itemPaso = listaPasos[sIdx];
          const descPaso = typeof itemPaso === "string" ? itemPaso.trim() : String(itemPaso.descripcionPaso || itemPaso.Descripcion_Paso || "").trim();
          if (!descPaso) continue;
          const idSub = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarCorrelativo)
            ? CorrelativoService.generarCorrelativo("SUB")
            : ((typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdSubtarea)
              ? CorrelativoService.generarIdSubtarea()
              : "SUB-" + Utilities.formatDate(new Date(), (CONFIG && CONFIG.TIMEZONE) || "GMT-5", "yyyyMMdd-") + (sIdx + 1));

          const maxCols = (CONFIG.COLS_SUBTAREAS && CONFIG.COLS_SUBTAREAS.MAX_COLUMNS) || 6;
          const rSub = new Array(maxCols).fill("");
          rSub[CONFIG.COLS_SUBTAREAS.ID_SUBTAREA] = idSub;
          rSub[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] = idActividad;
          rSub[CONFIG.COLS_SUBTAREAS.NUMERO_PASO] = sIdx + 1;
          rSub[CONFIG.COLS_SUBTAREAS.DESCRIPCION_PASO] = descPaso;
          rSub[CONFIG.COLS_SUBTAREAS.COMPLETADO] = false;
          rSub[CONFIG.COLS_SUBTAREAS.FECHA_COMPLETADO] = "";
          subSheet.appendRow(rSub);

          subtareasCreadas.push({
            ID_Subtarea: idSub,
            idSubtarea: idSub,
            ID_Padre_Vinculado: idActividad,
            idPadreVinculado: idActividad,
            ID_Padre: idActividad,
            idPadre: idActividad,
            Tipo_Padre: "ACTIVIDAD",
            tipoPadre: "ACTIVIDAD",
            Numero_Paso: sIdx + 1,
            numeroPaso: sIdx + 1,
            Descripcion_Paso: descPaso,
            descripcionPaso: descPaso,
            Completado: false,
            completado: false,
            Fecha_Completado: "",
            fechaCompletado: ""
          });
        }
      } catch (errSub) {
        Logger.log("[createActividadPersonal subtareas error]: " + errSub.message);
      }
    }

    if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }

    // 4. Imputar gasto financiero asociado si aplica
    const montoGastoAsoc = Number(newRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.MONTO_GASTO_ASOCIADO]) || 0;
    if (montoGastoAsoc > 0) {
      const monGasto = String(payload.monedaGasto || payload.monedaOriginal || "PEN").toUpperCase();
      const mOrigGasto = payload.montoOriginalGasto !== undefined && payload.montoOriginalGasto !== null && !isNaN(parseFloat(payload.montoOriginalGasto))
        ? parseFloat(payload.montoOriginalGasto)
        : (monGasto === "PEN" ? montoGastoAsoc : montoGastoAsoc);
      const tcGasto = (payload.tipoCambio !== undefined && !isNaN(parseFloat(payload.tipoCambio)))
        ? parseFloat(payload.tipoCambio)
        : ((monGasto === "USD") ? 3.76 : (monGasto === "EUR") ? 4.12 : 1.0);

      procesarAccionBackend("creategasto", {
        idProyecto: "",
        idHito: "",
        idTarea: idActividad,
        tipoGasto: "Actividad Personal",
        fechaGasto: fechaProg,
        descripcionGasto: `[Actividad Personal] ${payload.nombreActividad}`,
        categoriaGasto: payload.categoriaVida || "Personal",
        monedaOriginal: monGasto,
        montoOriginal: mOrigGasto,
        tipoCambio: tcGasto,
        metodoPago: "Efectivo",
        estadoPago: "Pagado"
      });
    }

    // 5. Preparar payload consolidado para CalendarService
    const payloadSincronizacion = {
      idActividad: idActividad,
      nombreActividad: nombreAct,
      Nombre_Actividad: nombreAct,
      tipoCompromiso: tipoCompromiso,
      categoriaVida: newRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.CATEGORIA_VIDA],
      fechaProgramada: fechaProg,
      horaInicio: payload.horaInicio || "08:00",
      duracionHoras: duracionVal,
      duracionMinutos: esPuntual ? 0 : (payload.duracionMinutos !== undefined ? Number(payload.duracionMinutos) : Math.round(duracionVal * 60)),
      esPuntual: esPuntual,
      frecuenciaCiclo: frecCiclo,
      reglaRepeticion: reglaRep,
      diasSeleccionados: diasSeleccionados,
      idEventoCalendar: "",
      agendadoCalendar: esAgendadoDeseado,
      estado: payload.estado || "02_Por_Hacer",
      notasChecklist: notasAct,
      Descripcion: notasAct
    };

    // 6. Sincronización reactiva con Calendar (>0h) o Tasks (=0h) y persistencia inmediata del ID
    let syncIdGenerado = "";
    let agendadoFinal = esAgendadoDeseado;

    try {
      if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaActividadPersonal) {
        const calRes = CalendarService.sincronizarFilaActividadPersonal(nuevaFilaIdx, payloadSincronizacion);
        if (calRes) {
          if (!calRes.success && esPuntual) {
            throw new Error(calRes.error || "Fallo al sincronizar con Google Tasks");
          }
          syncIdGenerado = (calRes.taskId && calRes.eventId)
            ? (calRes.taskId + "||" + calRes.eventId)
            : (calRes.taskId || calRes.eventId || "");
          agendadoFinal = calRes.agendado || (syncIdGenerado ? "Sí" : esAgendadoDeseado);

          // Escribir en las celdas de Sheets para que futuras ediciones o eliminaciones conozcan el ID compuesto
          if (syncIdGenerado) {
            sheet.getRange(nuevaFilaIdx, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue(syncIdGenerado);
            sheet.getRange(nuevaFilaIdx, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue(agendadoFinal);
          }
        }
      }
    } catch (eCal) {
      Logger.log("[createActividadPersonal Calendar/Tasks Error]: " + eCal.message);
      if (esPuntual) {
        throw new Error(eCal.message);
      }
    }

    const actividadObj = {
      ID_Actividad: idActividad,
      Nombre: nombreAct,
      Nombre_Actividad: nombreAct,
      Tipo_Registro: tipoCompromiso,
      Tipo_Compromiso: tipoCompromiso,
      Categoria_Vida: catNorm,
      Meta_Macro_Nombre: colMap.META_MACRO_NOMBRE !== undefined ? String(newRow[colMap.META_MACRO_NOMBRE] || "").trim() : "",
      Unidad_Medida: colMap.UNIDAD_MEDIDA !== undefined ? String(newRow[colMap.UNIDAD_MEDIDA] || "").trim() : "",
      Meta_Objetivo_Total: colMap.META_OBJETIVO_TOTAL !== undefined ? (parseFloat(newRow[colMap.META_OBJETIVO_TOTAL]) || 0.0) : 0.0,
      Valor_Acumulado_Actual: colMap.VALOR_ACUMULADO_ACTUAL !== undefined ? (parseFloat(newRow[colMap.VALOR_ACUMULADO_ACTUAL]) || 0.0) : 0.0,
      Meta_Diaria_Estandar: colMap.META_DIARIA_ESTANDAR !== undefined ? (parseFloat(newRow[colMap.META_DIARIA_ESTANDAR]) || 0.0) : 0.0,
      Nivel_Rescate_Minimo: colMap.NIVEL_RESCATE_MINIMO !== undefined ? (parseFloat(newRow[colMap.NIVEL_RESCATE_MINIMO]) || 0.0) : 0.0,
      Estado: newRow[colMap.ESTADO] || "02_Por_Hacer",
      Racha_Actual: parseInt(newRow[colMap.RACHA_ACTUAL], 10) || 0,
      Fecha_Programada: fechaProg,
      Hora_Inicio: newRow[colMap.HORA_INICIO] || "08:00",
      Agendado_Calendar: agendadoFinal,
      ID_Evento_Calendar: syncIdGenerado,
      // Retrocompatibilidad:
      Prioridad_Eisenhower: colMap.PRIORIDAD_EISENHOWER !== undefined ? newRow[colMap.PRIORIDAD_EISENHOWER] : "02_P2_Media",
      Frecuencia_Ciclo: frecCiclo,
      Regla_Repeticion: reglaRep,
      Duracion_Horas: duracionVal,
      Monto_Gasto_Asociado: colMap.MONTO_GASTO_ASOCIADO !== undefined ? (parseFloat(newRow[colMap.MONTO_GASTO_ASOCIADO]) || 0.0) : 0.0,
      Notas_Checklist: colMap.NOTAS_CHECKLIST !== undefined ? String(newRow[colMap.NOTAS_CHECKLIST] || "").trim() : "",
      subtareas: subtareasCreadas
    };

    return { success: true, idActividad: idActividad, data: actividadObj };
  },

  createActividad: function (payload) {
    return this.createActividadPersonal(payload);
  },

  // ============================================================================
  // SECCIÓN 3: CONTROL DE CUMPLIMIENTO, RACHAS Y AVANCE DE CICLOS
  // ============================================================================

  /**
   * Marca como completada/pendiente una actividad, calculando la siguiente fecha si es recurrente.
   *
   * @param {Object} payload
   * @returns {Object}
   */
  completarActividadPersonal: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
      if (!sheet) return { success: false, error: "Hoja BBDD_Actividades_Personales no encontrada" };

      const data = sheet.getDataRange().getValues();
      const idBuscado = String(payload.idActividad || "").trim();
      let rowIdx = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD]).trim() === idBuscado) {
          rowIdx = i + 1;
          break;
        }
      }

      if (rowIdx === -1) return { success: false, error: "Actividad no encontrada: " + idBuscado };

      const filaActual = data[rowIdx - 1];
      const tipoCompromiso = String(filaActual[CONFIG.COLS_ACTIVIDADES_PERSONALES.TIPO_COMPROMISO] || "HABITUAL").trim();
      const frecCiclo = String(filaActual[CONFIG.COLS_ACTIVIDADES_PERSONALES.FRECUENCIA_CICLO] || "DIARIA").trim();
      const reglaRep = String(filaActual[CONFIG.COLS_ACTIVIDADES_PERSONALES.REGLA_REPETICION] || "").trim();
      const fechaActualProg = String(filaActual[CONFIG.COLS_ACTIVIDADES_PERSONALES.FECHA_PROGRAMADA] || "").trim();

      let nuevoEstado = String(payload.nuevoEstado || "04_Completado").trim();
      const esCompletado = (nuevoEstado === "04_Completado");
      const rachaActual = parseInt(filaActual[CONFIG.COLS_ACTIVIDADES_PERSONALES.RACHA_ACTUAL], 10) || 0;

      let nuevaRacha = rachaActual;
      if (payload.incrementarRacha !== undefined) {
        nuevaRacha = payload.incrementarRacha ? (rachaActual + 1) : Math.max(0, rachaActual - 1);
      } else {
        nuevaRacha = esCompletado ? (rachaActual + 1) : Math.max(0, rachaActual - 1);
      }

      let fechaFinalProg = fechaActualProg;
      let esRepetida = false;

      // Clonar fila en memoria para escritura atómica batch
      const totalCols = filaActual.length;
      const filaActualizada = filaActual.slice();

      // Si es un hábito habitual recurrente completado, calcular la siguiente ocurrencia válida y reabrir
      if (esCompletado && tipoCompromiso === "HABITUAL" && frecCiclo !== "NINGUNA") {
        fechaFinalProg = this._calcularSiguienteFechaCiclo(fechaActualProg, frecCiclo, reglaRep);
        nuevoEstado = "02_Por_Hacer";
        esRepetida = true;
        filaActualizada[CONFIG.COLS_ACTIVIDADES_PERSONALES.FECHA_PROGRAMADA] = fechaFinalProg;
      }

      // Mutar ESTADO y RACHA_ACTUAL en memoria
      filaActualizada[CONFIG.COLS_ACTIVIDADES_PERSONALES.ESTADO] = nuevoEstado;
      filaActualizada[CONFIG.COLS_ACTIVIDADES_PERSONALES.RACHA_ACTUAL] = nuevaRacha;

      // --- COMMIT ATÓMICO: una sola llamada batch para toda la fila ---
      sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada]);

      invalidarCacheDashboard();

      const payloadSinc = Object.assign({}, payload, {
        estado: nuevoEstado,
        nuevoEstado: nuevoEstado,
        fechaProgramada: fechaFinalProg
      });

      try {
        if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaActividadPersonal) {
          CalendarService.sincronizarFilaActividadPersonal(rowIdx, payloadSinc);
        }
      } catch (eCal) {
        Logger.log("[completarActividadPersonal Calendar Error]: " + eCal.message);
      }

      const updatedRow = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
      const durRaw = updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.DURACION_HORAS];
      const durVal = (durRaw !== "" && durRaw !== null && durRaw !== undefined && !isNaN(parseFloat(durRaw))) ? parseFloat(durRaw) : 1.0;

      const actividadObj = {
        ID_Actividad: idBuscado,
        Nombre_Actividad: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.NOMBRE_ACTIVIDAD] || "").trim(),
        Tipo_Compromiso: tipoCompromiso,
        Categoria_Vida: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.CATEGORIA_VIDA] || "PERSONAL").trim(),
        Estado: nuevoEstado,
        Prioridad_Eisenhower: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.PRIORIDAD_EISENHOWER] || "02_P2_Media").trim(),
        Frecuencia_Ciclo: frecCiclo,
        Regla_Repeticion: reglaRep,
        Racha_Actual: nuevaRacha,
        Fecha_Programada: fechaFinalProg,
        Hora_Inicio: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.HORA_INICIO] || "").trim(),
        Duracion_Horas: durVal,
        Agendado_Calendar: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR] || "No").trim(),
        ID_Evento_Calendar: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR] || "").trim(),
        Monto_Gasto_Asociado: parseFloat(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.MONTO_GASTO_ASOCIADO]) || 0.0,
        Notas_Checklist: String(updatedRow[CONFIG.COLS_ACTIVIDADES_PERSONALES.NOTAS_CHECKLIST] || "").trim()
      };

      return {
        success: true,
        idActividad: idBuscado,
        nuevoEstado: nuevoEstado,
        nuevaRacha: nuevaRacha,
        repetida: esRepetida,
        nuevaFecha: fechaFinalProg,
        racha: nuevaRacha,
        data: actividadObj
      };
    } catch (err) {
      Logger.log("[completarActividadPersonal Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  // ============================================================================
  // SECCIÓN 4: ACTUALIZACIÓN RÁPIDA DE FECHA / HORA
  // ============================================================================

  updateFechaActividadPersonal: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
    if (!sheet) return { success: false, error: "Hoja BBDD_Actividades_Personales no encontrada" };

    const data = sheet.getDataRange().getValues();
    const idBuscado = String(payload.idActividad || "").trim();
    let rowIdx = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD]).trim() === idBuscado) {
        rowIdx = i + 1;
        break;
      }
    }

    if (rowIdx === -1) return { success: false, error: "Actividad no encontrada: " + idBuscado };

    if (payload.fechaProgramada) {
      sheet.getRange(rowIdx, CONFIG.COLS_ACTIVIDADES_PERSONALES.FECHA_PROGRAMADA + 1).setValue(payload.fechaProgramada);
    }
    if (payload.horaInicio) {
      sheet.getRange(rowIdx, CONFIG.COLS_ACTIVIDADES_PERSONALES.HORA_INICIO + 1).setValue(payload.horaInicio);
    }

    invalidarCacheDashboard();

    try {
      if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaActividadPersonal) {
        CalendarService.sincronizarFilaActividadPersonal(rowIdx, payload);
      }
    } catch (eCal) {
      Logger.log("[updateFechaActividadPersonal Calendar Error]: " + eCal.message);
    }

    return { success: true, idActividad: idBuscado };
  },

  // ============================================================================
  // SECCIÓN 5: EDICIÓN COMPLETA Y MUTACIÓN SEGURA
  // ============================================================================

  updateActividadPersonal: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
      if (!sheet) return { success: false, error: "Hoja BBDD_Actividades_Personales no encontrada" };

      const data = sheet.getDataRange().getValues();
      const idBuscado = String(payload.idActividad || "").trim();
      let rowIdx = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD]).trim() === idBuscado) {
          rowIdx = i + 1;
          break;
        }
      }

      if (rowIdx === -1) return { success: false, error: "Actividad no encontrada: " + idBuscado };

      const colMap = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaActividades)
        ? CONFIG.obtenerMapaActividades(sheet)
        : CONFIG.COLS_ACTIVIDADES_PERSONALES;

      // Clonar la fila en memoria dimensionada adecuadamente (patrón batch)
      const maxCols = Math.max(colMap.MAX_COLUMNS || 16, data[rowIdx - 1].length);
      const filaActualizada = new Array(maxCols).fill("");
      for (let c = 0; c < data[rowIdx - 1].length; c++) {
        filaActualizada[c] = data[rowIdx - 1][c];
      }
      const C = colMap;

      const idxNom = C.NOMBRE !== undefined ? C.NOMBRE : C.NOMBRE_ACTIVIDAD;
      const idxTipo = C.TIPO_REGISTRO !== undefined ? C.TIPO_REGISTRO : C.TIPO_COMPROMISO;

      const esPuntualUpdate = (
        payload.esPuntual === true ||
        String(payload.esPuntual) === "true" ||
        (payload.duracionMinutos !== undefined && Number(payload.duracionMinutos) === 0) ||
        (payload.duracionHoras !== undefined && Number(payload.duracionHoras) === 0) ||
        String(payload.tipoCompromiso).toUpperCase() === "PUNTUAL"
      );

      if (esPuntualUpdate) {
        if (idxTipo !== undefined) filaActualizada[idxTipo] = "PUNTUAL";
        if (C.DURACION_HORAS !== undefined) filaActualizada[C.DURACION_HORAS] = 0;
        payload.tipoCompromiso = "PUNTUAL";
        payload.duracionHoras = 0;
        payload.duracionMinutos = 0;
        payload.esPuntual = true;
      } else {
        if (payload.tipoCompromiso !== undefined && idxTipo !== undefined) filaActualizada[idxTipo] = payload.tipoCompromiso;
        if (payload.duracionHoras !== undefined && payload.duracionHoras !== null && payload.duracionHoras !== "" && C.DURACION_HORAS !== undefined) {
          const durVal = !isNaN(parseFloat(payload.duracionHoras)) ? parseFloat(payload.duracionHoras) : 1.0;
          filaActualizada[C.DURACION_HORAS] = durVal;
        }
      }

      if (payload.nombreActividad !== undefined || payload.Nombre_Actividad !== undefined || payload.nombre !== undefined || payload.Nombre !== undefined) {
        if (idxNom !== undefined) filaActualizada[idxNom] = payload.Nombre_Actividad || payload.nombreActividad || payload.Nombre || payload.nombre;
      }
      if (payload.categoriaVida !== undefined || payload.Categoria_Vida !== undefined) {
        const catNorm = (typeof CONFIG !== "undefined" && CONFIG.normalizarCategoriaVida)
          ? CONFIG.normalizarCategoriaVida(payload.categoriaVida || payload.Categoria_Vida)
          : "SALUD_DEPORTE";
        if (C.CATEGORIA_VIDA !== undefined) filaActualizada[C.CATEGORIA_VIDA] = catNorm;
      }

      // Soporte de Metas Cuantificables (Fase 4.8)
      if (C.META_MACRO_NOMBRE !== undefined && (payload.metaMacroNombre !== undefined || payload.Meta_Macro_Nombre !== undefined)) {
        filaActualizada[C.META_MACRO_NOMBRE] = String(payload.metaMacroNombre !== undefined ? payload.metaMacroNombre : payload.Meta_Macro_Nombre).trim();
      }
      if (C.UNIDAD_MEDIDA !== undefined && (payload.unidadMedida !== undefined || payload.Unidad_Medida !== undefined)) {
        filaActualizada[C.UNIDAD_MEDIDA] = String(payload.unidadMedida !== undefined ? payload.unidadMedida : payload.Unidad_Medida).trim();
      }
      if (C.META_OBJETIVO_TOTAL !== undefined && (payload.metaObjetivoTotal !== undefined || payload.Meta_Objetivo_Total !== undefined)) {
        filaActualizada[C.META_OBJETIVO_TOTAL] = parseFloat(payload.metaObjetivoTotal !== undefined ? payload.metaObjetivoTotal : payload.Meta_Objetivo_Total) || 0.0;
      }
      if (C.VALOR_ACUMULADO_ACTUAL !== undefined && (payload.valorAcumuladoActual !== undefined || payload.Valor_Acumulado_Actual !== undefined)) {
        filaActualizada[C.VALOR_ACUMULADO_ACTUAL] = parseFloat(payload.valorAcumuladoActual !== undefined ? payload.valorAcumuladoActual : payload.Valor_Acumulado_Actual) || 0.0;
      }
      if (C.META_DIARIA_ESTANDAR !== undefined && (payload.metaDiariaEstandar !== undefined || payload.Meta_Diaria_Estandar !== undefined)) {
        filaActualizada[C.META_DIARIA_ESTANDAR] = parseFloat(payload.metaDiariaEstandar !== undefined ? payload.metaDiariaEstandar : payload.Meta_Diaria_Estandar) || 0.0;
      }
      if (C.NIVEL_RESCATE_MINIMO !== undefined && (payload.nivelRescateMinimo !== undefined || payload.Nivel_Rescate_Minimo !== undefined)) {
        filaActualizada[C.NIVEL_RESCATE_MINIMO] = parseFloat(payload.nivelRescateMinimo !== undefined ? payload.nivelRescateMinimo : payload.Nivel_Rescate_Minimo) || 0.0;
      }

      // Soporte de avance cuantitativo directo y rescate de racha
      if (payload.valorAvance !== undefined || payload.avance !== undefined || payload.cantidadAvance !== undefined) {
        const avance = parseFloat(payload.valorAvance || payload.avance || payload.cantidadAvance) || 0.0;
        if (C.VALOR_ACUMULADO_ACTUAL !== undefined) {
          const acumPrev = parseFloat(filaActualizada[C.VALOR_ACUMULADO_ACTUAL]) || 0.0;
          const nuevoAcum = Math.max(0, acumPrev + avance);
          filaActualizada[C.VALOR_ACUMULADO_ACTUAL] = nuevoAcum;

          // Rescate de racha si avance >= Nivel_Rescate_Minimo
          const rescateMin = C.NIVEL_RESCATE_MINIMO !== undefined ? (parseFloat(filaActualizada[C.NIVEL_RESCATE_MINIMO]) || 0.0) : 0.0;
          const rachaPrev = C.RACHA_ACTUAL !== undefined ? (parseInt(filaActualizada[C.RACHA_ACTUAL], 10) || 0) : 0;
          if (rescateMin > 0 && avance >= rescateMin && C.RACHA_ACTUAL !== undefined) {
            filaActualizada[C.RACHA_ACTUAL] = rachaPrev + 1;
          }

          // Completar meta si alcanza o supera el objetivo total
          const metaTotal = C.META_OBJETIVO_TOTAL !== undefined ? (parseFloat(filaActualizada[C.META_OBJETIVO_TOTAL]) || 0.0) : 0.0;
          if (metaTotal > 0 && nuevoAcum >= metaTotal && C.ESTADO !== undefined) {
            filaActualizada[C.ESTADO] = "04_Completado";
          }
        }
      }

      if (payload.estado !== undefined || payload.Estado !== undefined) {
        if (C.ESTADO !== undefined) filaActualizada[C.ESTADO] = payload.estado || payload.Estado;
      }
      if (payload.rachaActual !== undefined || payload.Racha_Actual !== undefined) {
        if (C.RACHA_ACTUAL !== undefined) filaActualizada[C.RACHA_ACTUAL] = parseInt(payload.rachaActual !== undefined ? payload.rachaActual : payload.Racha_Actual, 10) || 0;
      }
      if (payload.prioridad !== undefined && C.PRIORIDAD_EISENHOWER !== undefined) filaActualizada[C.PRIORIDAD_EISENHOWER] = payload.prioridad;
      if (payload.frecuenciaCiclo !== undefined && C.FRECUENCIA_CICLO !== undefined) filaActualizada[C.FRECUENCIA_CICLO] = payload.frecuenciaCiclo;
      if (payload.reglaRepeticion !== undefined && C.REGLA_REPETICION !== undefined) filaActualizada[C.REGLA_REPETICION] = payload.reglaRepeticion;

      // Ajustar fecha programada si se enviaron cambios en la regla, días o fecha
      if (payload.fechaProgramada !== undefined && C.FECHA_PROGRAMADA !== undefined) {
        const frecActual = payload.frecuenciaCiclo || String((C.FRECUENCIA_CICLO !== undefined ? filaActualizada[C.FRECUENCIA_CICLO] : "") || "DIARIA");
        const reglaActual = payload.reglaRepeticion || String((C.REGLA_REPETICION !== undefined ? filaActualizada[C.REGLA_REPETICION] : "") || "");
        const diasSel = Array.isArray(payload.diasSeleccionados) ? payload.diasSeleccionados : [];
        const fechaValida = this._calcularProximaFechaValida(payload.fechaProgramada, frecActual, reglaActual, diasSel);
        filaActualizada[C.FECHA_PROGRAMADA] = fechaValida;
        payload.fechaProgramada = fechaValida;
      }

      if (payload.horaInicio !== undefined || payload.Hora_Inicio !== undefined) {
        if (C.HORA_INICIO !== undefined) filaActualizada[C.HORA_INICIO] = payload.horaInicio || payload.Hora_Inicio;
      }
      if (payload.notasChecklist !== undefined && C.NOTAS_CHECKLIST !== undefined) filaActualizada[C.NOTAS_CHECKLIST] = payload.notasChecklist;
      if (payload.agendadoCalendar !== undefined && C.AGENDADO_CALENDAR !== undefined) {
        const esCal = (String(payload.agendadoCalendar).toLowerCase().startsWith("s") || String(payload.agendadoCalendar) === "true") ? "Sí" : "No";
        filaActualizada[C.AGENDADO_CALENDAR] = esCal;
      }

      // --- COMMIT ATÓMICO: escritura de toda la fila en una sola llamada batch ---
      const totalCols = maxCols;
      sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada]);

      // Sincronización de gasto financiero asociado (efecto secundario post-commit)
      if (payload.montoGastoAsociado !== undefined) {
        const montoGastoAsoc = parseFloat(payload.montoGastoAsociado) || 0.0;
        // Actualizar la celda de monto ya fue hecho en el batch; aquí solo sincronizamos BBDD_Finanzas_Gastos
        try {
          const sheetGastos = ss.getSheetByName(CONFIG.SHEETS.FINANZAS);
          if (sheetGastos) {
            const colMapG = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
              ? FinanzasService.obtenerMapaColumnasGastos(sheetGastos)
              : CONFIG.COLS_FINANZAS;

            const datosGastos = sheetGastos.getDataRange().getValues();
            let gastoEncontradoRow = -1;
            for (let g = 1; g < datosGastos.length; g++) {
              if (String(datosGastos[g][colMapG.ID_TAREA] || "").trim() === idBuscado) {
                gastoEncontradoRow = g + 1;
                break;
              }
            }

            const monGasto = String(payload.monedaGasto || payload.monedaOriginal || "PEN").toUpperCase();
            const mOrigGasto = payload.montoOriginalGasto !== undefined && payload.montoOriginalGasto !== null && !isNaN(parseFloat(payload.montoOriginalGasto))
              ? parseFloat(payload.montoOriginalGasto)
              : (monGasto === "PEN" ? montoGastoAsoc : montoGastoAsoc);
            const tcGasto = (payload.tipoCambio !== undefined && !isNaN(parseFloat(payload.tipoCambio)))
              ? parseFloat(payload.tipoCambio)
              : ((monGasto === "USD") ? 3.76 : (monGasto === "EUR") ? 4.12 : 1.0);
            const mPenGasto = (monGasto === "PEN") ? mOrigGasto : (mOrigGasto * tcGasto);
            const mUsdGasto = (monGasto === "USD") ? mOrigGasto : (tcGasto > 0 ? (mPenGasto / 3.76) : 0);

            if (gastoEncontradoRow !== -1) {
              // Batch update sobre la fila de gasto encontrada
              const filaGasto = datosGastos[gastoEncontradoRow - 1].slice();
              if (colMapG.MONEDA_ORIGINAL !== undefined) filaGasto[colMapG.MONEDA_ORIGINAL] = monGasto;
              if (colMapG.MONTO_ORIGINAL !== undefined) filaGasto[colMapG.MONTO_ORIGINAL] = mOrigGasto;
              if (colMapG.TIPO_CAMBIO !== undefined) filaGasto[colMapG.TIPO_CAMBIO] = tcGasto;
              if (colMapG.MONTO_PEN !== undefined) filaGasto[colMapG.MONTO_PEN] = mPenGasto;
              if (colMapG.MONTO_USD !== undefined) filaGasto[colMapG.MONTO_USD] = mUsdGasto;
              if (colMapG.TIPO_GASTO !== undefined) filaGasto[colMapG.TIPO_GASTO] = "Actividad Personal";
              if (payload.nombreActividad && colMapG.DESCRIPCION !== undefined) {
                filaGasto[colMapG.DESCRIPCION] = `[Actividad Personal] ${payload.nombreActividad}`;
              }
              sheetGastos.getRange(gastoEncontradoRow, 1, 1, filaGasto.length).setValues([filaGasto]);
            } else if (mOrigGasto > 0) {
              procesarAccionBackend("creategasto", {
                idProyecto: "",
                idHito: "",
                idTarea: idBuscado,
                tipoGasto: "Actividad Personal",
                fechaGasto: payload.fechaProgramada || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd"),
                descripcionGasto: `[Actividad Personal] ${payload.nombreActividad || "Gasto de actividad"}`,
                categoriaGasto: payload.categoriaVida || "Personal",
                monedaOriginal: monGasto,
                montoOriginal: mOrigGasto,
                tipoCambio: tcGasto,
                metodoPago: "Efectivo",
                estadoPago: "Pagado"
              });
            }
          }
        } catch (eGasto) {
          Logger.log("[updateActividadPersonal gasto sync error]: " + eGasto.message);
        }
      }

      invalidarCacheDashboard();

      let calRes = null;
      try {
        if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaActividadPersonal) {
          calRes = CalendarService.sincronizarFilaActividadPersonal(rowIdx, payload);
          if (calRes && !calRes.success && esPuntualUpdate) {
            throw new Error(calRes.error || "Fallo al sincronizar con Google Tasks");
          }
          if (calRes && (calRes.taskId || calRes.eventId)) {
            const syncIdUpd = (calRes.taskId && calRes.eventId)
              ? (calRes.taskId + "||" + calRes.eventId)
              : (calRes.taskId || calRes.eventId || "");
            sheet.getRange(rowIdx, C.ID_EVENTO_CALENDAR + 1).setValue(syncIdUpd);
          }
        }
      } catch (eCal) {
        Logger.log("[updateActividadPersonal Calendar Error]: " + eCal.message);
        if (esPuntualUpdate) {
          throw new Error(eCal.message);
        }
      }

      const updatedRow = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
      const durRaw = C.DURACION_HORAS !== undefined ? updatedRow[C.DURACION_HORAS] : 1.0;
      const durVal = (durRaw !== "" && durRaw !== null && durRaw !== undefined && !isNaN(parseFloat(durRaw))) ? parseFloat(durRaw) : 1.0;
      const nomActUpd = String((C.NOMBRE !== undefined ? updatedRow[C.NOMBRE] : "") || (C.NOMBRE_ACTIVIDAD !== undefined ? updatedRow[C.NOMBRE_ACTIVIDAD] : "") || "").trim();
      const tipoRegUpd = String((C.TIPO_REGISTRO !== undefined ? updatedRow[C.TIPO_REGISTRO] : "") || (C.TIPO_COMPROMISO !== undefined ? updatedRow[C.TIPO_COMPROMISO] : "") || "HABITUAL").trim();

      const actividadActualizada = {
        ID_Actividad: idBuscado,
        Nombre: nomActUpd,
        Nombre_Actividad: nomActUpd,
        Tipo_Registro: tipoRegUpd,
        Tipo_Compromiso: tipoRegUpd,
        Categoria_Vida: String((C.CATEGORIA_VIDA !== undefined ? updatedRow[C.CATEGORIA_VIDA] : "") || "SALUD_DEPORTE").trim(),
        Meta_Macro_Nombre: C.META_MACRO_NOMBRE !== undefined ? String(updatedRow[C.META_MACRO_NOMBRE] || "").trim() : "",
        Unidad_Medida: C.UNIDAD_MEDIDA !== undefined ? String(updatedRow[C.UNIDAD_MEDIDA] || "").trim() : "",
        Meta_Objetivo_Total: C.META_OBJETIVO_TOTAL !== undefined ? (parseFloat(updatedRow[C.META_OBJETIVO_TOTAL]) || 0.0) : 0.0,
        Valor_Acumulado_Actual: C.VALOR_ACUMULADO_ACTUAL !== undefined ? (parseFloat(updatedRow[C.VALOR_ACUMULADO_ACTUAL]) || 0.0) : 0.0,
        Meta_Diaria_Estandar: C.META_DIARIA_ESTANDAR !== undefined ? (parseFloat(updatedRow[C.META_DIARIA_ESTANDAR]) || 0.0) : 0.0,
        Nivel_Rescate_Minimo: C.NIVEL_RESCATE_MINIMO !== undefined ? (parseFloat(updatedRow[C.NIVEL_RESCATE_MINIMO]) || 0.0) : 0.0,
        Estado: String((C.ESTADO !== undefined ? updatedRow[C.ESTADO] : "") || "02_Por_Hacer").trim(),
        Racha_Actual: C.RACHA_ACTUAL !== undefined ? (parseInt(updatedRow[C.RACHA_ACTUAL], 10) || 0) : 0,
        Fecha_Programada: String((C.FECHA_PROGRAMADA !== undefined ? updatedRow[C.FECHA_PROGRAMADA] : "") || "").trim(),
        Hora_Inicio: String((C.HORA_INICIO !== undefined ? updatedRow[C.HORA_INICIO] : "") || "").trim(),
        Agendado_Calendar: String((C.AGENDADO_CALENDAR !== undefined ? updatedRow[C.AGENDADO_CALENDAR] : "") || "No").trim(),
        ID_Evento_Calendar: String((C.ID_EVENTO_CALENDAR !== undefined ? updatedRow[C.ID_EVENTO_CALENDAR] : "") || "").trim(),
        // Retrocompatibilidad
        Prioridad_Eisenhower: String((C.PRIORIDAD_EISENHOWER !== undefined ? updatedRow[C.PRIORIDAD_EISENHOWER] : "") || "02_P2_Media").trim(),
        Frecuencia_Ciclo: String((C.FRECUENCIA_CICLO !== undefined ? updatedRow[C.FRECUENCIA_CICLO] : "") || "DIARIA").trim(),
        Regla_Repeticion: String((C.REGLA_REPETICION !== undefined ? updatedRow[C.REGLA_REPETICION] : "") || "").trim(),
        Duracion_Horas: durVal,
        Monto_Gasto_Asociado: C.MONTO_GASTO_ASOCIADO !== undefined ? (parseFloat(updatedRow[C.MONTO_GASTO_ASOCIADO]) || 0.0) : 0.0,
        Notas_Checklist: String((C.NOTAS_CHECKLIST !== undefined ? updatedRow[C.NOTAS_CHECKLIST] : "") || "").trim()
      };

      return { success: true, idActividad: idBuscado, data: actividadActualizada, calendar: calRes };
    } catch (err) {
      Logger.log("[updateActividadPersonal Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  updateActividad: function (payload) {
    return this.updateActividadPersonal(payload);
  },

  /**
   * Registra un avance cuantitativo en un hábito o meta (Fase 4.8).
   * Actualiza Valor_Acumulado_Actual, evalúa rescate de racha si avance >= Nivel_Rescate_Minimo,
   * y completa la meta si se alcanza Meta_Objetivo_Total.
   *
   * @param {Object} payload - { idActividad, valorAvance, notas, fecha }
   * @returns {Object}
   */
  registrarAvanceCuantitativo: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
      if (!sheet) return { success: false, error: "Hoja BBDD_Actividades_Personales no encontrada" };

      const colMap = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaActividades)
        ? CONFIG.obtenerMapaActividades(sheet)
        : CONFIG.COLS_ACTIVIDADES_PERSONALES;

      const data = sheet.getDataRange().getValues();
      const idBuscado = String(payload.idActividad || payload.ID_Actividad || "").trim();
      let rowIdx = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][colMap.ID_ACTIVIDAD]).trim() === idBuscado) {
          rowIdx = i + 1;
          break;
        }
      }

      if (rowIdx === -1) return { success: false, error: "Actividad no encontrada: " + idBuscado };

      const totalCols = data[rowIdx - 1].length;
      const filaActualizada = data[rowIdx - 1].slice();

      const valorAvance = parseFloat(payload.valorAvance || payload.avance || payload.cantidad || 0) || 0.0;
      const acumActual = parseFloat(filaActualizada[colMap.VALOR_ACUMULADO_ACTUAL]) || 0.0;
      const nuevoAcumulado = Math.max(0, acumActual + valorAvance);
      filaActualizada[colMap.VALOR_ACUMULADO_ACTUAL] = nuevoAcumulado;

      const nivelRescate = parseFloat(filaActualizada[colMap.NIVEL_RESCATE_MINIMO]) || 0.0;
      const rachaActual = parseInt(filaActualizada[colMap.RACHA_ACTUAL], 10) || 0;
      let nuevaRacha = rachaActual;
      let rachaRescatada = false;

      if (nivelRescate > 0 && valorAvance >= nivelRescate) {
        nuevaRacha = rachaActual + 1;
        rachaRescatada = true;
        filaActualizada[colMap.RACHA_ACTUAL] = nuevaRacha;
      }

      const metaTotal = parseFloat(filaActualizada[colMap.META_OBJETIVO_TOTAL]) || 0.0;
      let metaCompletada = false;
      if (metaTotal > 0 && nuevoAcumulado >= metaTotal) {
        filaActualizada[colMap.ESTADO] = "04_Completado";
        metaCompletada = true;
      }

      sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada]);
      invalidarCacheDashboard();

      return {
        success: true,
        idActividad: idBuscado,
        valorAvance: valorAvance,
        valorAcumuladoActual: nuevoAcumulado,
        rachaActual: nuevaRacha,
        rachaRescatada: rachaRescatada,
        completado: metaCompletada,
        estado: filaActualizada[colMap.ESTADO]
      };
    } catch (err) {
      Logger.log("[registrarAvanceCuantitativo Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  // ============================================================================
  // SECCIÓN 6: ELIMINACIÓN Y LIMPIEZA EN CASCADA
  // ============================================================================

  deleteActividadPersonal: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
      if (!sheet) return { success: false, error: "Hoja de actividades personales no encontrada" };

      const idAct = String(payload.idActividad || payload.ID_Actividad || "").trim();
      if (!idAct) return { success: false, error: "ID_Actividad requerido para eliminar" };

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: false, error: "No hay actividades registradas" };

      const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      let idEventoCal = "";
      let agendadoVal = "";
      let actividadExiste = false;

      for (let i = 0; i < data.length; i++) {
        if (String(data[i][CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD] || "").trim().toUpperCase() === idAct.toUpperCase()) {
          actividadExiste = true;
          idEventoCal = String(data[i][CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR] || "").trim();
          agendadoVal = String(data[i][CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR] || "").trim();
          break;
        }
      }

      if (!actividadExiste) return { success: false, error: "Actividad personal no encontrada: " + idAct };

      // Limpieza integral en Google Calendar y Google Tasks (por ID simple o compuesto)
      const idParaBorrar = idEventoCal || (agendadoVal && agendadoVal.includes("|") ? agendadoVal.split("|")[1].trim() : "");
      if (idParaBorrar) {
        const tokens = String(idParaBorrar).split(/[,|]+/);
        for (let k = 0; k < tokens.length; k++) {
          const tok = tokens[k].trim();
          if (!tok) continue;
          if (typeof CalendarService !== "undefined" && CalendarService.eliminarEventoCalendar) {
            try { CalendarService.eliminarEventoCalendar(tok, "HABITO"); } catch (eCalDel) { }
          }
          if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTask) {
            try { GoogleTasksService.eliminarTask(tok); } catch (eTaskDel) { }
          }
        }
      }

      // Cascada: Eliminar subtareas procedurales asociadas a esta actividad en lote atómico
      try {
        const sheetSub = ss.getSheetByName(CONFIG.SHEETS.SUBTAREAS);
        if (sheetSub && sheetSub.getLastRow() > 1) {
          sobrescribirHojaFiltrada(sheetSub, function(row) {
            const isLegacy7 = (row.length >= 7 && (String(row[1]).toUpperCase() === "TAREA" || String(row[1]).toUpperCase() === "ACTIVIDAD"));
            const idP = isLegacy7 ? String(row[2] || "").trim().toUpperCase() : String(row[CONFIG.COLS_SUBTAREAS.ID_PADRE_VINCULADO] || "").trim().toUpperCase();
            return idP !== idAct.toUpperCase();
          });
        }
      } catch (eSub) {
        Logger.log("[Cascada Subtareas Actividad Error]: " + eSub.message);
      }

      // Eliminar fila de actividad de forma atómica en lote
      sobrescribirHojaFiltrada(sheet, function(row) {
        return String(row[CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_ACTIVIDAD] || "").trim().toUpperCase() !== idAct.toUpperCase();
      });

      SpreadsheetApp.flush();
      if (typeof invalidarCacheDashboard === "function") { try { invalidarCacheDashboard(); } catch (e) { } }

      return { success: true, idActividad: idAct };
    } catch (err) {
      Logger.log("[deleteActividadPersonal Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  }
};

const ActividadesPersonalesService = ActividadesService;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ActividadesService, ActividadesPersonalesService };
}