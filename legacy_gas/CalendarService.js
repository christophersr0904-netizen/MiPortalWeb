/**
 * ============================================================================
 * ARCHIVO: CalendarService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Time-Blocking, Horarios Flexibles, Segregación de Calendarios Dedicados
 *      y Sincronización REACTIVA con Google Calendar.
 *
 * GOBERNANZA ESTRICTA:
 *   → Este servicio SOLO maneja Google Calendar (Eventos con bloque de tiempo).
 *   → NUNCA crea ni muta a Google Tasks.
 *   → Actividades de Duración = 0 horas NO pasan por aquí (van a GoogleTasksService).
 *   → Actividades Rutinarias con Duración > 0h se crean como EventSeries recurrente.
 *   → No existe sincronización batch. Todo es REACTIVO por fila individual.
 * ============================================================================
 */

// ============================================================================
// SECCIÓN 1: SERVICIO DE CALENDARIO (CalendarService)
// ============================================================================
const CalendarService = {

  // Constantes de Nombres e Identificadores en Parámetros
  CALENDARIOS: {
    PROYECTOS: (typeof CONFIG !== "undefined" && CONFIG.CALENDARIOS && CONFIG.CALENDARIOS.PROYECTOS) ? CONFIG.CALENDARIOS.PROYECTOS : "PMO - Proyectos",
    HABITOS: (typeof CONFIG !== "undefined" && CONFIG.CALENDARIOS && CONFIG.CALENDARIOS.HABITOS) ? CONFIG.CALENDARIOS.HABITOS : "PMO - Hábitos y Vida",
    GASTOS: (typeof CONFIG !== "undefined" && CONFIG.CALENDARIOS && CONFIG.CALENDARIOS.GASTOS) ? CONFIG.CALENDARIOS.GASTOS : "PMO - Gastos Programados",
    INGRESOS: (typeof CONFIG !== "undefined" && CONFIG.CALENDARIOS && CONFIG.CALENDARIOS.INGRESOS) ? CONFIG.CALENDARIOS.INGRESOS : "PMO - Ingresos Programados",
    KEY_PROP_PROYECTOS: "ID_Calendar_Proyectos",
    KEY_PROP_HABITOS: "ID_Calendar_Habitos",
    KEY_PROP_GASTOS: "ID_Calendar_Gastos",
    KEY_PROP_INGRESOS: "ID_Calendar_Ingresos"
  },

  /**
   * 1.0. Aprovisiona u obtiene automáticamente un calendario por nombre y le asigna color.
   * Soporta resolución por alias previos ("PMO - Proyectos" / "Tareas de Proyectos", etc.)
   * Almacena y recupera el ID en PropertiesService para rendimiento instantáneo sin búsquedas repetitivas.
   *
   * @param {string} nombreCalendario Nombre exacto del calendario secundario
   * @param {*} colorBase Constante CalendarApp.Color o código hexadecimal
   * @returns {GoogleAppsScript.Calendar.Calendar} Instancia del calendario
   */
  obtenerOCrearCalendario: function (nombreCalendario, colorBase) {
    const userProps = PropertiesService.getUserProperties();
    const scriptProps = PropertiesService.getScriptProperties();

    let cacheKey = "CAL_" + Utilities.base64Encode(nombreCalendario);
    if (nombreCalendario === this.CALENDARIOS.PROYECTOS) cacheKey = this.CALENDARIOS.KEY_PROP_PROYECTOS;
    else if (nombreCalendario === this.CALENDARIOS.HABITOS) cacheKey = this.CALENDARIOS.KEY_PROP_HABITOS;
    else if (nombreCalendario === this.CALENDARIOS.GASTOS) cacheKey = this.CALENDARIOS.KEY_PROP_GASTOS;
    else if (nombreCalendario === this.CALENDARIOS.INGRESOS) cacheKey = this.CALENDARIOS.KEY_PROP_INGRESOS;

    // 1. Intentar recuperación desde properties en caché (User o Script)
    let savedId = userProps.getProperty(cacheKey) || scriptProps.getProperty(cacheKey);
    if (savedId) {
      try {
        const calCached = CalendarApp.getCalendarById(savedId);
        if (calCached) return calCached;
      } catch (errCached) {
        Logger.log(`[Calendar Cache] ID no accesible (${savedId}): ${errCached.message}`);
      }
    }

    // 2. Búsqueda por nombre exacto y alias existentes del usuario
    const mapaAliases = {
      [this.CALENDARIOS.PROYECTOS]: ["PMO - Proyectos", "Tareas de Proyectos"],
      [this.CALENDARIOS.HABITOS]: ["PMO - Hábitos y Vida", "Hábitos y Actividades Personales"],
      [this.CALENDARIOS.GASTOS]: ["PMO - Gastos Programados", "Gastos Programados"],
      [this.CALENDARIOS.INGRESOS]: ["PMO - Ingresos Programados", "Ingresos Programados"]
    };
    const listaNombres = mapaAliases[nombreCalendario] || [nombreCalendario];

    let cal = null;
    for (let i = 0; i < listaNombres.length; i++) {
      try {
        const calsByName = CalendarApp.getCalendarsByName(listaNombres[i]);
        if (calsByName && calsByName.length > 0) {
          cal = calsByName[0];
          break;
        }
      } catch (errSearch) {
        Logger.log(`[Calendar Search Error] "${listaNombres[i]}": ${errSearch.message}`);
      }
    }

    // 3. Creación automática si no existe
    if (!cal) {
      try {
        cal = CalendarApp.createCalendar(nombreCalendario);
        if (cal && colorBase) {
          try {
            cal.setColor(colorBase);
          } catch (eColor) {
            Logger.log(`[Calendar Color Warning]: ${eColor.message}`);
          }
        }
        Logger.log(`[Calendar Provisioning] Calendario "${nombreCalendario}" creado exitosamente.`);
      } catch (errCreate) {
        Logger.log(`[Calendar Create Error] "${nombreCalendario}": ${errCreate.message}`);
      }
    }

    // 4. Persistir ID en UserProperties y ScriptProperties para reutilización ágil
    if (cal) {
      const calId = cal.getId();
      try {
        userProps.setProperty(cacheKey, calId);
        scriptProps.setProperty(cacheKey, calId);
      } catch (errProp) {
        Logger.log(`[Calendar Property Error] ${cacheKey}: ${errProp.message}`);
      }
      return cal;
    }

    // Fallback de contingencia si no se pudo crear ni encontrar
    return CalendarApp.getDefaultCalendar();
  },

  /**
   * 1.1. Obtiene el calendario dedicado para Tareas de Proyectos (Color Azul / Índigo)
   */
  getCalendarioProyectos: function () {
    let color = null;
    try {
      color = (CalendarApp.Color && (CalendarApp.Color.BLUE || CalendarApp.Color.INDIGO)) ? (CalendarApp.Color.BLUE || CalendarApp.Color.INDIGO) : null;
    } catch (e) { Logger.log("[CalendarService getCalendarioProyectos Color Error]: " + e.message); }
    return this.obtenerOCrearCalendario(this.CALENDARIOS.PROYECTOS, color);
  },

  /**
   * 1.2. Obtiene el calendario dedicado para Hábitos y Actividades Personales (Color Verde / Teal)
   */
  getCalendarioHabitos: function () {
    let color = null;
    try {
      color = (CalendarApp.Color && (CalendarApp.Color.TEAL || CalendarApp.Color.GREEN)) ? (CalendarApp.Color.TEAL || CalendarApp.Color.GREEN) : null;
    } catch (e) { Logger.log("[CalendarService getCalendarioHabitos Color Error]: " + e.message); }
    return this.obtenerOCrearCalendario(this.CALENDARIOS.HABITOS, color);
  },

  /**
   * 1.3. Obtiene el calendario dedicado para Gastos y Finanzas Egresos (Color Rojo / Mandarina)
   */
  getCalendarioGastos: function () {
    let color = null;
    try {
      color = (CalendarApp.Color && (CalendarApp.Color.RED || CalendarApp.Color.ORANGE)) ? (CalendarApp.Color.RED || CalendarApp.Color.ORANGE) : null;
    } catch (e) { Logger.log("[CalendarService getCalendarioGastos Color Error]: " + e.message); }
    return this.obtenerOCrearCalendario(this.CALENDARIOS.GASTOS, color);
  },

  /**
   * 1.4. Obtiene el calendario dedicado para Ingresos y Cobros (Color Verde / Turquesa)
   */
  getCalendarioIngresos: function () {
    let color = null;
    try {
      color = (CalendarApp.Color && (CalendarApp.Color.GREEN || CalendarApp.Color.TURQUOISE)) ? (CalendarApp.Color.GREEN || CalendarApp.Color.TURQUOISE) : null;
    } catch (e) { Logger.log("[CalendarService getCalendarioIngresos Color Error]: " + e.message); }
    return this.obtenerOCrearCalendario(this.CALENDARIOS.INGRESOS, color);
  },

  /**
   * 1.5. Instancia de fallback general (mantiene compatibilidad previa delegando en Proyectos)
   */
  getCalendarInstance: function () {
    return this.getCalendarioProyectos();
  },

  /**
   * 1.6. Mapeo cromático nativo para Hábitos y Actividades Personales según su Dimensión de Vida
   * 1. Salud y Bienestar ➔ Verde (PALE_GREEN / "2" o GREEN / "10")
   * 2. Desarrollo Profesional / Estudio ➔ Azul / Índigo (PALE_BLUE / "1" o BLUE / "9")
   * 3. Personal / Familiar / Hogar ➔ Amarillo / Naranja (YELLOW / "5" o ORANGE / "6")
   * 4. Finanzas Personales ➔ Esmeralda / Turquesa (CYAN / "7")
   * 5. Ocio / Descanso ➔ Púrpura / Morado (MAUVE / "3")
   * 6. Trámites / Obligaciones / Trabajo ➔ Rojo / Rosa (PALE_RED / "4" o RED / "11")
   */
  obtenerColorEventoHabito: function (categoriaVida, esPuntual) {
    const cat = String(categoriaVida || "").trim().toUpperCase().replace(/[\s-]/g, "_");

    // 1. Salud y Bienestar ➔ Verde
    if (cat === "SALUD_DEPORTE" || cat === "SALUD" || cat === "DEPORTE" || cat.includes("SALUD") || cat.includes("BIENESTAR")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_GREEN) ? CalendarApp.EventColor.PALE_GREEN : "2";
    }

    // 2. Desarrollo Profesional / Estudio ➔ Azul / Índigo
    if (cat === "DESARROLLO_ESTUDIO" || cat === "DESARROLLO_PERSONAL" || cat === "ESTUDIO" || cat === "DESARROLLO" || cat.includes("ESTUDIO") || cat.includes("PROFESIONAL")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_BLUE) ? CalendarApp.EventColor.PALE_BLUE : "1";
    }

    // 3. Personal / Familiar / Hogar ➔ Amarillo / Naranja
    if (cat === "SOCIAL_FAMILIA" || cat === "HOGAR_FAMILIA" || cat === "FAMILIA" || cat === "HOGAR" || cat.includes("FAMILI")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.YELLOW) ? CalendarApp.EventColor.YELLOW : "5";
    }

    // 4. Finanzas Personales ➔ Esmeralda / Turquesa
    if (cat === "FINANZAS_TRAMITES" || cat === "FINANZAS_ADMIN" || cat === "FINANZAS" || cat.includes("FINANZ")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.CYAN) ? CalendarApp.EventColor.CYAN : "7";
    }

    // 5. Ocio / Descanso ➔ Púrpura / Morado
    if (cat === "PERSONAL_DESCANSO" || cat === "OCIO_SOCIAL" || cat === "OCIO" || cat === "DESCANSO" || cat.includes("OCIO") || cat.includes("RELAX") || cat.includes("DESCANSO")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.MAUVE) ? CalendarApp.EventColor.MAUVE : "3";
    }

    // 6. Trámites / Obligaciones / Trabajo ➔ Rojo / Rosa
    if (cat === "LABORAL_HONORARIO" || cat === "TRABAJO_CARRERA" || cat === "TRABAJO" || cat === "LABORAL" || cat === "CARRERA" || cat.includes("TRAMITE") || cat.includes("OBLIGA")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_RED) ? CalendarApp.EventColor.PALE_RED : "4";
    }

    // Fallback: Si es puntual, Naranja distintivo ("6"); si no, Verde ("2")
    if (esPuntual) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.ORANGE) ? CalendarApp.EventColor.ORANGE : "6";
    }
    return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_GREEN) ? CalendarApp.EventColor.PALE_GREEN : "2";
  },

  /**
   * 1.7. Mapeo cromático nativo para Tareas de Proyectos según su Prioridad o Nivel de Energía
   * - Alta / Urgente ➔ Rojo / Rosa (PALE_RED / "4" o RED / "11")
   * - Media / Normal ➔ Azul (PALE_BLUE / "1")
   * - Baja ➔ Gris (GRAY / "8") o Verde (PALE_GREEN / "2")
   */
  obtenerColorEventoTarea: function (prioridad, nivelEnergia) {
    const prio = String(prioridad || "").trim().toUpperCase();
    if (prio.includes("ALTA") || prio.includes("URGENTE") || prio === "01_P1_ALTA" || prio === "P1") {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_RED) ? CalendarApp.EventColor.PALE_RED : "4";
    }
    if (prio.includes("MEDIA") || prio.includes("NORMAL") || prio === "02_P2_MEDIA" || prio === "P2") {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_BLUE) ? CalendarApp.EventColor.PALE_BLUE : "1";
    }
    if (prio.includes("BAJA") || prio === "03_P3_BAJA" || prio === "P3") {
      return (CalendarApp.EventColor && CalendarApp.EventColor.GRAY) ? CalendarApp.EventColor.GRAY : "8";
    }

    const nrg = String(nivelEnergia || "").trim().toUpperCase();
    if (nrg.includes("ALTA") || nrg.includes("DEEP")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.BLUE) ? CalendarApp.EventColor.BLUE : "9";
    }
    return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_BLUE) ? CalendarApp.EventColor.PALE_BLUE : "1";
  },

  /**
   * 1.8. Desvinculación Limpia: Elimina un evento de su calendario dedicado
   * o del calendario principal en caso de ser un registro legado o serie recurrente.
   */
  eliminarEventoCalendar: function (idEvento, tipo) {
    if (!idEvento) return false;
    const idLimpio = String(idEvento).trim();
    if (!idLimpio) return false;

    let borrado = false;

    const intentarBorrar = function (cal) {
      if (!cal) return false;
      try {
        const ev = cal.getEventById(idLimpio);
        if (ev) { ev.deleteEvent(); return true; }
      } catch (e) { Logger.log("[eliminarEventoCalendar getEventById Error]: " + e.message); }
      try {
        const series = cal.getEventSeriesById(idLimpio);
        if (series) { series.deleteEventSeries(); return true; }
      } catch (e) { Logger.log("[eliminarEventoCalendar getEventSeriesById Error]: " + e.message); }
      return false;
    };

    // 1. Probar en el calendario correspondiente según el tipo
    const tipoNorm = String(tipo || "").toUpperCase();
    if (tipoNorm === "PROYECTO" || tipoNorm === "TAREA") {
      borrado = intentarBorrar(this.getCalendarioProyectos());
    } else if (tipoNorm === "HABITO" || tipoNorm === "ACTIVIDAD") {
      borrado = intentarBorrar(this.getCalendarioHabitos());
    } else if (tipoNorm === "GASTO" || tipoNorm === "EGRESO") {
      borrado = intentarBorrar(this.getCalendarioGastos());
    } else if (tipoNorm === "INGRESO") {
      borrado = intentarBorrar(this.getCalendarioIngresos());
    }

    // 2. Si no se borró, buscar en los demás calendarios dedicados
    if (!borrado) borrado = intentarBorrar(this.getCalendarioHabitos());
    if (!borrado) borrado = intentarBorrar(this.getCalendarioProyectos());
    if (!borrado) borrado = intentarBorrar(this.getCalendarioGastos());
    if (!borrado) borrado = intentarBorrar(this.getCalendarioIngresos());

    // 3. Fallback: buscar en el calendario principal por defecto (eventos legados)
    if (!borrado) {
      try {
        borrado = intentarBorrar(CalendarApp.getDefaultCalendar());
      } catch (eDef) { Logger.log("[eliminarEventoCalendar defaultCalendar Fallback Error]: " + eDef.message); }
    }

    return borrado;
  },

  /**
   * Helper: Normaliza cualquier valor de hora a formato "HH:mm" de 24 horas.
   * Acepta: Date object, "08:00", "8:00", "8:00 AM", "08:00 PM", o fechas legadas de Google Sheets.
   */
  normalizarHora: function (val) {
    if (!val) return "";
    if (val instanceof Date && !isNaN(val.getTime())) {
      const hh = String(val.getHours()).padStart(2, "0");
      const mm = String(val.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    let str = String(val).trim();
    if (str === "--:--" || str === "-" || str === "") return "";
    if (str.includes(":") && (str.includes("GMT") || str.includes("1899") || str.includes("T"))) {
      const match = str.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, "0")}:${match[2]}`;
      }
    }
    const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2];
      const ampm = ampmMatch[3] ? ampmMatch[3].toUpperCase() : "";
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${m}`;
    }
    const simpleMatch = str.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);
    if (simpleMatch) {
      return `${simpleMatch[1].padStart(2, "0")}:${simpleMatch[2]}`;
    }
    return "";
  },

  /**
   * Helper: Normaliza cualquier valor de fecha a formato canónico "yyyy-MM-dd".
   * Acepta: Date object, "yyyy-MM-dd", "yyyy/MM/dd", "dd/MM/yyyy", "dd-MM-yyyy", etc.
   */
  normalizarFecha: function (fechaRaw, tz) {
    tz = tz || ((typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima");
    if (fechaRaw instanceof Date && !isNaN(fechaRaw.getTime())) {
      return Utilities.formatDate(fechaRaw, tz, "yyyy-MM-dd");
    }
    if (typeof fechaRaw === "string" && fechaRaw.trim()) {
      let clean = fechaRaw.trim().split(/[\sT]/)[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) return clean.replace(/\//g, "-");
      const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) {
        const d = dmy[1].padStart(2, "0");
        const m = dmy[2].padStart(2, "0");
        const y = dmy[3];
        return `${y}-${m}-${d}`;
      }
    }
    return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  },

  /**
   * 1.5. Parsea fechas y detecta si el usuario especificó una hora manual o aplica reglas heurísticas.
   * Si se especifica horaProgramada (HH:mm), se respeta estrictamente sin importar el nivel de energía.
   */
  parsearFechaHora: function (fechaRaw, nivelEnergia, horaProgramada) {
    const tz = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
    const strFecha = this.normalizarFecha(fechaRaw, tz);
    const partesFec = strFecha.split("-");
    const anio = parseInt(partesFec[0], 10);
    const mes = parseInt(partesFec[1], 10) - 1;
    const dia = parseInt(partesFec[2], 10);

    let horaStr = this.normalizarHora(horaProgramada);
    if (!horaStr && fechaRaw instanceof Date && !isNaN(fechaRaw.getTime())) {
      if (fechaRaw.getHours() !== 0 || fechaRaw.getMinutes() !== 0) {
        horaStr = this.normalizarHora(fechaRaw);
      }
    }

    let d = new Date(anio, mes, dia);
    if (horaStr) {
      const hParts = horaStr.split(":");
      d.setHours(parseInt(hParts[0], 10), parseInt(hParts[1], 10), 0, 0);
    } else {
      const esDeepWork = (nivelEnergia === "Alta_Cognitiva_DeepWork");
      const timeConfig = esDeepWork ? CONFIG.TIME_BLOCKS.DEEP_WORK : CONFIG.TIME_BLOCKS.OPERATIVO;
      d.setHours(timeConfig.startHour, timeConfig.startMinute, 0, 0);
    }
    return d;
  },

  /**
   * 1.6. Parsea fecha pura sin componente de hora para eventos All-Day.
   */
  parsearFechaSinHora: function (fechaRaw) {
    const tz = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
    const strFecha = this.normalizarFecha(fechaRaw, tz);
    const partesFec = strFecha.split("-");
    return new Date(parseInt(partesFec[0], 10), parseInt(partesFec[1], 10) - 1, parseInt(partesFec[2], 10));
  },

  /**
   * 1.7. Sincronización reactiva por fila individual de tarea de proyecto.
   * Se guarda y actualiza ÚNICAMENTE en el calendario "Tareas de Proyectos".
   * Las tareas de proyecto SIEMPRE tienen duración > 0h (mínimo 1h) → SIEMPRE son Eventos.
   */
  sincronizarFilaTarea: function (rowNumber, payload) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.TAREAS);
      if (!sheet) return;

      const colMap = (typeof TareasService !== "undefined" && TareasService.obtenerMapaColumnasTareas)
        ? TareasService.obtenerMapaColumnasTareas(sheet)
        : (CONFIG.obtenerMapaTareas ? CONFIG.obtenerMapaTareas(sheet) : (CONFIG.COLS_TAREAS || {}));
      const numCols = Math.max(sheet.getLastColumn(), colMap.MAX_COLUMNS || 14);
      const row = sheet.getRange(rowNumber, 1, 1, numCols).getValues()[0];

      const idxIdTarea = colMap.ID_TAREA !== undefined ? colMap.ID_TAREA : 0;
      const idxIdHito = colMap.ID_HITO !== undefined ? colMap.ID_HITO : 1;
      const idxIdProy = colMap.ID_PROYECTO !== undefined ? colMap.ID_PROYECTO : 2;
      const idxNombre = colMap.NOMBRE_TAREA !== undefined ? colMap.NOMBRE_TAREA : 3;
      const idxEstado = colMap.ESTADO !== undefined ? colMap.ESTADO : 4;
      const idxPrioridad = colMap.PRIORIDAD !== undefined ? colMap.PRIORIDAD : 5;
      const idxNivelEnergia = colMap.NIVEL_ENERGIA !== undefined ? colMap.NIVEL_ENERGIA : 6;
      const idxHorasEstimadas = colMap.HORAS_ESTIMADAS !== undefined ? colMap.HORAS_ESTIMADAS : 7;
      const idxFechaProg = colMap.FECHA_PROGRAMADA !== undefined ? colMap.FECHA_PROGRAMADA : 9;
      const idxAgendado = colMap.AGENDADO_CALENDAR !== undefined ? colMap.AGENDADO_CALENDAR : 10;
      const colAgendado1Based = idxAgendado + 1;

      const idTarea = String(row[idxIdTarea] !== undefined ? row[idxIdTarea] : "").trim();
      const idHito = String(row[idxIdHito] !== undefined ? row[idxIdHito] : "").trim();
      const idProyecto = String(row[idxIdProy] !== undefined ? row[idxIdProy] : "").trim();
      const nombreTarea = String(row[idxNombre] !== undefined ? row[idxNombre] : "").trim();
      const estado = String(row[idxEstado] !== undefined ? row[idxEstado] : "").trim();
      const prioridad = String(row[idxPrioridad] !== undefined ? row[idxPrioridad] : "").trim();
      const nivelEnergia = String(row[idxNivelEnergia] !== undefined ? row[idxNivelEnergia] : "").trim();
      const horasEstimadas = parseFloat(row[idxHorasEstimadas]) || 1.0;
      const fechaRaw = row[idxFechaProg];
      const agendadoVal = String(row[idxAgendado] !== undefined ? row[idxAgendado] : "").trim();

      let idEvento = "";
      if (agendadoVal.includes("|")) {
        idEvento = agendadoVal.split("|")[1].trim();
      }

      if (!nombreTarea) return;

      const cal = this.getCalendarioProyectos();
      if (!cal) return;

      // 1. Caso Cancelación / Archivado
      if (estado === "05_Archivado" || estado === "05_Cancelado" || estado.toLowerCase().includes("archiv") || estado.toLowerCase().includes("cancel")) {
        if (idEvento && idEvento.includes("@google.com")) {
          this.eliminarEventoCalendar(idEvento, "PROYECTO");
        }
        sheet.getRange(rowNumber, colAgendado1Based).setValue("No");
        return;
      }

      // Extraer hora manual si se suministró en payload
      let horaManual = "";
      if (payload) {
        horaManual = payload.horaProgramada || payload.horaInicio || (payload.datos && (payload.datos.horaProgramada || payload.datos.horaInicio)) || "";
      }

      // 2. Normalización de fecha respetando hora manual
      const startTime = this.parsearFechaHora(fechaRaw, nivelEnergia, horaManual);
      if (!startTime) return;

      const duracionHoras = (horasEstimadas > 0) ? horasEstimadas : 1.0;
      const endTime = new Date(startTime.getTime() + (duracionHoras * 3600 * 1000));

      const eventTitle = idTarea ? `[${idTarea}] ${nombreTarea}` : nombreTarea;
      const eventDesc = `Proyecto: ${idProyecto}\nHito: ${idHito}\nNivel: ${nivelEnergia}\nPrioridad: ${prioridad}\nHoras: ${duracionHoras}\nPortal: PMO Personal Modular`;
      const colorTarea = this.obtenerColorEventoTarea(prioridad, nivelEnergia);

      // 3. Actualización de evento existente en el calendario dedicado (reutilizando referencia local)
      if (idEvento && idEvento.includes("@google.com")) {
        let ev = null;
        try {
          ev = cal.getEventById(idEvento);
        } catch (e) {
          Logger.log(`[sincronizarFilaTarea getEventById Error]: ${e.message}`);
        }

        if (ev) {
          ev.setTime(startTime, endTime);
          ev.setTitle(eventTitle);
          ev.setDescription(eventDesc);
          try {
            ev.setColor(colorTarea);
          } catch (eC) {
            Logger.log(`[sincronizarFilaTarea setColor Error]: ${eC.message}`);
          }
          return;
        }

        // Si no estaba en "Tareas de Proyectos", verificar si era un evento legado en el default calendar y removerlo
        try {
          const calDef = CalendarApp.getDefaultCalendar();
          if (calDef && calDef.getId() !== cal.getId()) {
            const evDef = calDef.getEventById(idEvento);
            if (evDef) {
              evDef.deleteEvent();
              Logger.log(`[Calendar] Evento de tarea legado eliminado de principal para migrar a Proyectos: ${idEvento}`);
            }
          }
        } catch (eLegacy) {
          Logger.log(`[sincronizarFilaTarea legacyCheck Error]: ${eLegacy.message}`);
        }
      }

      // 4. Creación de nuevo evento en "Tareas de Proyectos"
      let newEv = null;
      try {
        newEv = cal.createEvent(eventTitle, startTime, endTime, { description: eventDesc });
      } catch (errPrimario) {
        Logger.log(`[Aviso] Fallo en crear evento en calendario de proyectos (${errPrimario.message}). Usando fallback...`);
        try {
          newEv = CalendarApp.getDefaultCalendar().createEvent(eventTitle, startTime, endTime, { description: eventDesc });
        } catch (errSecundario) {
          Logger.log(`[Calendar Error Crítico]: ${errSecundario.message}`);
        }
      }

      if (newEv) {
        try {
          newEv.setColor(colorTarea);
        } catch (eC) {
          Logger.log(`[sincronizarFilaTarea newEv setColor Error]: ${eC.message}`);
        }
        sheet.getRange(rowNumber, colAgendado1Based).setValue(`Sí|${newEv.getId()}`);
      }
    } catch (err) {
      Logger.log("[CalendarService Tarea Exception]: " + err.message);
    }
  },

  /**
   * 1.8. Agendado explícito de tarea en Google Calendar.
   */
  agendarTareaEnCalendar: function (payload, rowNumber) {
    return this.sincronizarFilaTarea(rowNumber, payload);
  },

  /**
   * 1.9. Agendado de Rutina Recurrente de Control y Gobernanza en Google Calendar
   * Se registra en el calendario "Tareas de Proyectos".
   */
  agendarRutinaControlProyecto: function (payload) {
    try {
      const cal = this.getCalendarioProyectos();
      if (!cal) return { success: false, error: "No se pudo acceder al calendario de proyectos." };

      const idProyecto = String(payload.idProyecto || "").trim();
      const nombreProyecto = String(payload.nombreProyecto || idProyecto).trim();
      let frecuencia = String(payload.frecuenciaControl || "Semanal").trim();
      if (/diari/i.test(frecuencia)) frecuencia = "Diario";
      else if (/quincen/i.test(frecuencia)) frecuencia = "Quincenal";
      else if (/mensu/i.test(frecuencia)) frecuencia = "Mensual";
      else frecuencia = "Semanal";

      // Programar inicio a las 18:00 hrs de la próxima fecha aplicable
      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0, 0);

      // Si es semanal o quincenal, ajustar al próximo Domingo a las 18:00
      if (frecuencia === "Semanal" || frecuencia === "Quincenal") {
        const dayOfWeek = startDate.getDay(); // 0 = Domingo
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        if (daysUntilSunday > 0 || (daysUntilSunday === 0 && now.getHours() >= 18)) {
          startDate.setDate(startDate.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
        }
      } else if (now.getHours() >= 18) {
        startDate.setDate(startDate.getDate() + 1);
      }

      const endDate = new Date(startDate.getTime() + (45 * 60 * 1000)); // 45 min de revisión

      const eventTitle = `[PMO Control] Revisión & Check-in: ${nombreProyecto}`;
      const eventDesc = `Sesión recurrente de Gobernanza y Control Solopreneur.\nProyecto: [${idProyecto}] ${nombreProyecto}\nFrecuencia: ${frecuencia}\nPortal: PMO Personal Modular`;

      let recurrence = CalendarApp.newRecurrence();
      if (frecuencia === "Diario") {
        recurrence = recurrence.addDailyRule();
      } else if (frecuencia === "Semanal") {
        recurrence = recurrence.addWeeklyRule().onlyOnWeekday(CalendarApp.Weekday.SUNDAY);
      } else if (frecuencia === "Quincenal") {
        recurrence = recurrence.addWeeklyRule().interval(2).onlyOnWeekday(CalendarApp.Weekday.SUNDAY);
      } else if (frecuencia === "Mensual") {
        recurrence = recurrence.addMonthlyRule();
      }

      let series = null;
      try {
        series = cal.createEventSeries(eventTitle, startDate, endDate, recurrence, { description: eventDesc });
      } catch (e1) {
        Logger.log(`[Calendar Proyectos Rutina Fallo]: ${e1.message}`);
        series = CalendarApp.getDefaultCalendar().createEventSeries(eventTitle, startDate, endDate, recurrence, { description: eventDesc });
      }

      return {
        success: true,
        message: `Rutina de control agendada con éxito en "${this.CALENDARIOS.PROYECTOS}" (${frecuencia} - 18:00 hrs).`,
        idProyecto: idProyecto,
        frecuencia: frecuencia,
        seriesId: series ? series.getId() : ""
      };
    } catch (err) {
      Logger.log("[agendarRutinaControlProyecto Error]: " + err.message);
      return { success: false, error: "Error al agendar rutina de control: " + err.message };
    }
  },

  /**
   * 1.10. Sincronización individual de Actividad Personal / Hábito.
   *
   * GOBERNANZA ESTRICTA:
   *   - Duración > 0h → EVENTO en calendario "Hábitos y Actividades Personales"
   *   - Duración = 0h → GOOGLE TASK (delegado a GoogleTasksService) — NO se crea evento.
   *   - Actividad Rutinaria con Duración > 0h → Serie Recurrente (createEventSeries)
   *
   * Almacena en la hoja:
   *   - Col N (ID_EVENTO_CALENDAR): ID del evento Calendar O ID del Google Task
   *     Se diferencia por prefijo: si contiene "@google.com" es evento; si no, es task.
   */
  /**
   * 1.10. Sincronización individual de Actividad Personal / Hábito.
   *
   * GOBERNANZA ESTRICTA:
   *   - Duración > 0h → EVENTO en calendario "Hábitos y Actividades Personales"
   *   - Duración = 0h → GOOGLE TASK (delegado a GoogleTasksService) — NO se crea evento.
   *   - Actividad Rutinaria con Duración > 0h → Serie Recurrente (createEventSeries)
   */
  sincronizarFilaActividadPersonal: function (rowNumber, payload) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVIDADES_PERSONALES);
      if (!sheet || rowNumber < 2) return { success: false, error: "Hoja o fila inválida" };

      const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
      const colMap = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaActividades)
        ? CONFIG.obtenerMapaActividades(sheet)
        : CONFIG.COLS_ACTIVIDADES_PERSONALES;
      const idActividad = String((colMap.ID_ACTIVIDAD !== undefined ? row[colMap.ID_ACTIVIDAD] : "") || "").trim();
      let nombreActividad = String((colMap.NOMBRE_ACTIVIDAD !== undefined ? row[colMap.NOMBRE_ACTIVIDAD] : (colMap.NOMBRE !== undefined ? row[colMap.NOMBRE] : "")) || "").trim();
      let tipoCompromiso = String((colMap.TIPO_COMPROMISO !== undefined ? row[colMap.TIPO_COMPROMISO] : (colMap.TIPO_REGISTRO !== undefined ? row[colMap.TIPO_REGISTRO] : "")) || "HABITUAL").trim();
      let categoriaVida = String((colMap.CATEGORIA_VIDA !== undefined ? row[colMap.CATEGORIA_VIDA] : "") || "SALUD_DEPORTE").trim();
      let estado = String((colMap.ESTADO !== undefined ? row[colMap.ESTADO] : "") || "02_Por_Hacer").trim();
      let fechaRaw = colMap.FECHA_PROGRAMADA !== undefined ? row[colMap.FECHA_PROGRAMADA] : "";
      let horaInicioRaw = String((colMap.HORA_INICIO !== undefined ? row[colMap.HORA_INICIO] : "") || "").trim();
      let duracionRaw = colMap.DURACION_HORAS !== undefined ? row[colMap.DURACION_HORAS] : 1.0;
      let agendadoVal = String((colMap.AGENDADO_CALENDAR !== undefined ? row[colMap.AGENDADO_CALENDAR] : "") || "").trim();
      let idEventoOTask = String((colMap.ID_EVENTO_CALENDAR !== undefined ? row[colMap.ID_EVENTO_CALENDAR] : "") || "").trim();
      let notas = String((colMap.NOTAS_CHECKLIST !== undefined ? row[colMap.NOTAS_CHECKLIST] : "") || "").trim();

      // Leer campos de recurrencia
      let frecuenciaCiclo = String((colMap.FRECUENCIA_CICLO !== undefined ? row[colMap.FRECUENCIA_CICLO] : "NINGUNA") || "NINGUNA").trim().toUpperCase();
      let reglaRepeticion = String((colMap.REGLA_REPETICION !== undefined ? row[colMap.REGLA_REPETICION] : "") || "").trim();

      // Permitir overrides desde payload si se suministraron
      if (payload) {
        if (payload.nombreActividad) nombreActividad = String(payload.nombreActividad).trim();
        if (payload.tipoCompromiso) tipoCompromiso = String(payload.tipoCompromiso).trim();
        if (payload.categoriaVida) categoriaVida = String(payload.categoriaVida).trim();
        if (payload.nuevoEstado || payload.estado) estado = String(payload.nuevoEstado || payload.estado).trim();
        if (payload.fechaProgramada) fechaRaw = payload.fechaProgramada;
        if (payload.horaInicio || payload.horaProgramada) horaInicioRaw = String(payload.horaInicio || payload.horaProgramada).trim();
        if (payload.duracionHoras !== undefined) duracionRaw = payload.duracionHoras;
        if (payload.agendadoCalendar !== undefined) agendadoVal = String(payload.agendadoCalendar).trim();
        if (payload.notasChecklist !== undefined) notas = String(payload.notasChecklist).trim();
        if (payload.frecuenciaCiclo !== undefined) frecuenciaCiclo = String(payload.frecuenciaCiclo).trim().toUpperCase();
        if (payload.reglaRepeticion !== undefined) reglaRepeticion = String(payload.reglaRepeticion).trim();
      }

      if (!nombreActividad) return { success: false, error: "Nombre de actividad vacío" };

      // Normalización estricta de duración horaria
      let duracionHoras = 1.0;
      if (duracionRaw !== "" && duracionRaw !== null && duracionRaw !== undefined) {
        const parsedDur = parseFloat(duracionRaw);
        if (!isNaN(parsedDur)) duracionHoras = parsedDur;
      }

      const debeAgendar = (agendadoVal.toLowerCase().startsWith("s") || agendadoVal === "true" || agendadoVal === "sí");

      // ─── GOBERNANZA DE AGENDAMIENTO EN GOOGLE CALENDAR ───
      // Las actividades puntuales (0h / checkbox puntual) se crean como eventos de Google Calendar
      // con duración representativa mínima de 1 minuto (en su hora exacta) y color diferenciado (Naranja).
      const esPuntual = Boolean(
        (payload && (payload.esPuntual === true || String(payload.esPuntual) === "true")) ||
        (payload && payload.duracionMinutos !== undefined && Number(payload.duracionMinutos) === 0) ||
        duracionHoras === 0 ||
        Number(duracionRaw) === 0 ||
        tipoCompromiso === "PUNTUAL"
      );

      return this._gestionarActividadComoEventoCalendar(sheet, rowNumber, {
        idActividad: idActividad,
        nombreActividad: nombreActividad,
        Nombre_Actividad: (payload && (payload.Nombre_Actividad || payload.nombreActividad)) || nombreActividad,
        tipoCompromiso: tipoCompromiso,
        categoriaVida: categoriaVida,
        estado: estado,
        fechaRaw: fechaRaw,
        fechaProgramada: fechaRaw,
        horaInicioRaw: horaInicioRaw,
        horaInicio: horaInicioRaw,
        duracionHoras: esPuntual ? (1 / 60) : duracionHoras,
        duracionMinutos: esPuntual ? 1 : ((payload && payload.duracionMinutos !== undefined) ? Number(payload.duracionMinutos) : Math.round(duracionHoras * 60)),
        esPuntual: esPuntual,
        notas: notas,
        Descripcion: (payload && (payload.Descripcion || payload.notasChecklist)) || notas,
        debeAgendar: debeAgendar,
        idEventoOTask: idEventoOTask,
        frecuenciaCiclo: frecuenciaCiclo,
        reglaRepeticion: reglaRepeticion,
        diasSeleccionados: (payload && payload.diasSeleccionados) || []
      });
    } catch (err) {
      Logger.log("[sincronizarFilaActividadPersonal Exception]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  // ============================================================================
  // SECCIÓN 2: FUNCIONES INTERNAS AUXILIARES
  // ============================================================================

  /**
   * 2.0. Helper algorítmico: Determina el primer día válido hacia adelante.
   * Si la fecha base cae en un día no contemplado en el patrón (ej. sábado para L-V),
   * avanza iterativamente día por día hasta encontrar la primera ocurrencia coincidente.
   */
  _calcularPrimerDiaValido: function (fechaBase, diasValidos) {
    if (!diasValidos || diasValidos.length === 0) return new Date(fechaBase.getTime());

    const mapaNums = {};
    mapaNums[CalendarApp.Weekday.SUNDAY] = 0;
    mapaNums[CalendarApp.Weekday.MONDAY] = 1;
    mapaNums[CalendarApp.Weekday.TUESDAY] = 2;
    mapaNums[CalendarApp.Weekday.WEDNESDAY] = 3;
    mapaNums[CalendarApp.Weekday.THURSDAY] = 4;
    mapaNums[CalendarApp.Weekday.FRIDAY] = 5;
    mapaNums[CalendarApp.Weekday.SATURDAY] = 6;

    const numsValidos = diasValidos.map(function (w) { return mapaNums[w]; });
    const fechaAjustada = new Date(fechaBase.getTime());

    for (let i = 0; i < 7; i++) {
      const diaSem = fechaAjustada.getDay();
      if (numsValidos.indexOf(diaSem) !== -1) {
        return fechaAjustada;
      }
      fechaAjustada.setDate(fechaAjustada.getDate() + 1);
    }

    return fechaBase;
  },

  /**
   * Helper: Calcula las fechas individuales (YYYY-MM-DD) para las ocurrencias de una rutina
   * en Google Tasks (generando hasta maxOcurrencias, por defecto 30 ocurrencias).
   */
  _calcularOcurrenciasRutina: function (fechaInicioStr, freq, regla, diasSeleccionados, maxOcurrencias) {
    maxOcurrencias = maxOcurrencias || 30;
    const ocurrencias = [];
    const partes = fechaInicioStr.split("-");
    const baseDate = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));

    const mapaDiasNombres = {
      "DO": 0, "D": 0, "DOM": 0,
      "LU": 1, "L": 1, "LUN": 1,
      "MA": 2, "M": 2, "MAR": 2,
      "MI": 3, "X": 3, "MIER": 3,
      "JU": 4, "J": 4, "JUE": 4,
      "VI": 5, "V": 5, "VIE": 5,
      "SA": 6, "S": 6, "SAB": 6
    };

    let diasValidos = null; // null = todos los días

    if (Array.isArray(diasSeleccionados) && diasSeleccionados.length > 0) {
      diasValidos = [];
      for (let i = 0; i < diasSeleccionados.length; i++) {
        const item = diasSeleccionados[i];
        if (typeof item === "number" || /^\d+$/.test(String(item))) {
          const n = parseInt(item, 10);
          const dayNum = (n === 7) ? 0 : n;
          if (diasValidos.indexOf(dayNum) === -1) diasValidos.push(dayNum);
        } else if (typeof item === "string") {
          const s = item.trim().toUpperCase();
          if (mapaDiasNombres[s] !== undefined && diasValidos.indexOf(mapaDiasNombres[s]) === -1) {
            diasValidos.push(mapaDiasNombres[s]);
          }
        }
      }
    } else if (freq === "DIARIA_LABORAL" || regla === "L-V") {
      diasValidos = [1, 2, 3, 4, 5]; // Lunes a Viernes
    } else if (freq === "FIN_SEMANA" || regla === "DIAS:S,D") {
      diasValidos = [0, 6]; // Domingo y Sábado
    } else if (regla && (regla.startsWith("DIAS:") || /^[LMXJVSD,\s]+$/.test(regla))) {
      diasValidos = [];
      const cleanRegla = regla.replace("DIAS:", "").trim();
      const tokens = cleanRegla.split(",").map(t => t.trim().toUpperCase());
      for (let k = 0; k < tokens.length; k++) {
        if (mapaDiasNombres[tokens[k]] !== undefined && diasValidos.indexOf(mapaDiasNombres[tokens[k]]) === -1) {
          diasValidos.push(mapaDiasNombres[tokens[k]]);
        }
      }
    } else if (freq === "SEMANAL") {
      diasValidos = [baseDate.getDay()];
    }

    const cur = new Date(baseDate.getTime());
    let diasIterados = 0;
    while (ocurrencias.length < maxOcurrencias && diasIterados < 60) {
      const dayOfWeek = cur.getDay();
      if (!diasValidos || diasValidos.indexOf(dayOfWeek) !== -1) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        ocurrencias.push(`${y}-${m}-${d}`);
      }
      cur.setDate(cur.getDate() + 1);
      diasIterados++;
    }

    return ocurrencias.length > 0 ? ocurrencias : [fechaInicioStr];
  },

  /**
   * 2.1. Gestión ESTRICTA de Actividad Puntual (0h):
   * - Google Tasks: Se crean en la lista predeterminada @default para que aparezcan tanto en Google Tasks como
   *   en Google Calendar en forma de Tarea Nativa (chip azul con checkbox circular para marcar como completada).
   * - Si tiene Rutina (Diaria, L-V, Semanal, etc.): Se generan las tareas para cada ocurrencia de la rutina.
   * - Google Calendar: NUNCA se crea un bloque de evento de calendario con tiempo. Si existía uno previo, se elimina.
   * - Persistencia: Se guardan los IDs de las tareas en la Columna N y "Sí" en la Columna L.
   */
  _gestionarActividadComoTask: function (sheet, rowNumber, params) {
    try {
      // 1. Limpieza si está cancelado, archivado o no debe agendarse
      if (params.estado === "05_Archivado" || params.estado === "05_Cancelado" || !params.debeAgendar || !params.fechaRaw) {
        if (params.idEventoOTask) {
          const ids = String(params.idEventoOTask).split(/[,|]+/);
          for (let i = 0; i < ids.length; i++) {
            const cleanId = ids[i].trim();
            if (!cleanId) continue;
            if (cleanId.includes("@google.com")) {
              this.eliminarEventoCalendar(cleanId, "HABITO");
            } else {
              this._eliminarTaskSiExiste(cleanId);
            }
          }
          sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue("");
        }
        if (!params.debeAgendar) {
          sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("No");
        }
        return { success: true, taskId: "", eventId: "", agendado: "No" };
      }

      // 2. Normalización estricta de fecha, hora y recurrencia
      const tz = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
      const strFecha = this.normalizarFecha(params.fechaRaw, tz);

      const horaProg = this.normalizarHora(params.horaInicioRaw || params.horaInicio);
      const tieneHoraValida = Boolean(horaProg);
      const horaEfectiva = tieneHoraValida ? horaProg : "08:00";

      const tituloBase = String(params.Nombre_Actividad || params.nombreActividad || params.nombre || "Actividad").trim();
      const descLimpia = String(params.Descripcion || params.notas || params.notasChecklist || "").trim();

      const diasSel = (params.diasSeleccionados && Array.isArray(params.diasSeleccionados)) ? params.diasSeleccionados : [];
      const freq = String(params.frecuenciaCiclo || "").trim().toUpperCase();
      const regla = String(params.reglaRepeticion || "").trim().toUpperCase();
      const esRutinaria = this._esActividadRutinaria(freq, regla, diasSel);

      // Desglose legible de la rutina para Google Tasks
      let rutinaResumen = "";
      let rutinaDescripcion = "";
      if (esRutinaria) {
        if (freq === "DIARIA") {
          rutinaResumen = "Diario";
          rutinaDescripcion = "Todos los días";
        } else if (freq === "DIARIA_LABORAL" || regla === "L-V") {
          rutinaResumen = "L-V";
          rutinaDescripcion = "Días laborables (Lunes a Viernes)";
        } else if (freq === "FIN_SEMANA" || regla === "DIAS:S,D") {
          rutinaResumen = "S-D";
          rutinaDescripcion = "Fines de semana (Sábado y Domingo)";
        } else if (freq === "SEMANAL") {
          rutinaResumen = "Semanal";
          rutinaDescripcion = "Cada semana";
        } else if (freq === "MENSUAL") {
          rutinaResumen = "Mensual";
          rutinaDescripcion = "Cada mes";
        } else if (freq === "ANUAL") {
          rutinaResumen = "Anual";
          rutinaDescripcion = "Cada año";
        } else if (diasSel.length > 0 || regla.startsWith("DIAS:")) {
          const mapaDiasNombres = { 1: "Lu", 2: "Ma", 3: "Mi", 4: "Ju", 5: "Vi", 6: "Sá", 0: "Do", 7: "Do" };
          const diasTxt = diasSel.map(function (d) { return mapaDiasNombres[d] || d; }).join(", ");
          rutinaResumen = `Días: ${diasTxt || regla.replace("DIAS:", "")}`;
          rutinaDescripcion = `Días específicos (${rutinaResumen})`;
        } else {
          rutinaResumen = "Rutina";
          rutinaDescripcion = freq || "Recurrente";
        }
      }

      // 3. Formatear título y notas con la configuración exacta para Google Tasks
      let taskTitle = tituloBase;
      if (tieneHoraValida) {
        taskTitle = `[${horaProg}] ${tituloBase}`;
      }
      if (esRutinaria && rutinaResumen) {
        taskTitle += ` (${rutinaResumen})`;
      }

      let taskNotes = "";
      if (tieneHoraValida) {
        taskNotes += `⏰ Hora: ${horaProg}\n`;
      }
      if (esRutinaria && rutinaDescripcion) {
        taskNotes += `🔁 Rutina: ${rutinaDescripcion}\n`;
      }
      if (descLimpia) {
        taskNotes += `${descLimpia}`;
      }
      taskNotes = taskNotes.trim();

      // 4. LIMPIEZA ABSOLUTA DE CUALQUIER EVENTO DE CALENDARIO PREVIO
      // (Regla Estricta: Las actividades puntuales son TAREAS, NUNCA eventos de calendario)
      if (params.idEventoOTask) {
        const tokens = String(params.idEventoOTask).split(/[,|]+/);
        for (let k = 0; k < tokens.length; k++) {
          const tok = tokens[k].trim();
          if (tok.includes("@google.com")) {
            this.eliminarEventoCalendar(tok, "HABITO");
          } else if (tok) {
            this._eliminarTaskSiExiste(tok);
          }
        }
      }

      // Limpiar también eventos residuales con el mismo título en el calendario principal
      try {
        const calDef = CalendarApp.getDefaultCalendar();
        if (calDef) {
          const now = new Date();
          const past = new Date(now.getTime() - (7 * 24 * 3600 * 1000));
          const future = new Date(now.getTime() + (30 * 24 * 3600 * 1000));
          const oldEvs = calDef.getEvents(past, future, { search: tituloBase });
          if (oldEvs && oldEvs.length > 0) {
            oldEvs.forEach(ev => {
              if (ev.getTitle().includes(tituloBase)) {
                try { ev.deleteEvent(); } catch (e) { Logger.log("[_gestionarActividadComoTask deleteEvent Error]: " + e.message); }
              }
            });
          }
        }
      } catch (eHuerf) { Logger.log("[_gestionarActividadComoTask cleanOrphan Error]: " + eHuerf.message); }

      // 5. CÁLCULO DE OCURRENCIAS Y CREACIÓN EN GOOGLE TASKS (@default)
      let fechasOcurrencias = [strFecha];
      if (esRutinaria) {
        fechasOcurrencias = this._calcularOcurrenciasRutina(strFecha, freq, regla, diasSel, 30);
      }

      const createdTaskIds = [];
      for (let i = 0; i < fechasOcurrencias.length; i++) {
        const fIso = fechasOcurrencias[i]; // "YYYY-MM-DD"
        const dueRFC3339 = `${fIso}T00:00:00.000Z`;
        const payloadTask = {
          title: taskTitle,
          notes: taskNotes,
          due: dueRFC3339,
          status: (params.estado === "04_Completado") ? "completed" : "needsAction"
        };
        try {
          if (typeof Tasks !== "undefined" && Tasks.Tasks) {
            const taskRes = Tasks.Tasks.insert(payloadTask, "@default");
            if (taskRes && taskRes.id) {
              createdTaskIds.push(taskRes.id);
            }
          }
        } catch (eIns) {
          Logger.log(`[Google Tasks Insert Error para ${fIso}]: ${eIns.message}`);
        }
      }

      if (createdTaskIds.length === 0) {
        throw new Error("No se pudo crear la tarea en Google Tasks.");
      }

      // 6. Persistir identificadores en la hoja de cálculo
      const idPersistente = createdTaskIds.join("||");
      sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue(idPersistente);
      sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("Sí");

      Logger.log(`[Google Tasks] Se generaron ${createdTaskIds.length} tareas puntuales exitosamente para "${tituloBase}".`);

      return {
        success: true,
        taskId: createdTaskIds[0],
        eventId: "",
        agendado: "Sí"
      };
    } catch (err) {
      Logger.log("[_gestionarActividadComoTask Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * 2.1.B. Gestión de Actividad con Duración (>0h):
   * Se crea en Google Calendar como Evento o Serie Recurrente con su bloque de tiempo.
   */
  _gestionarActividadComoEventoCalendar: function (sheet, rowNumber, params) {
    try {
      const cal = this.getCalendarioHabitos();
      if (!cal) return { success: false, error: "No se pudo acceder al calendario dedicado de Hábitos y Vida" };

      if (params.estado === "05_Archivado" || params.estado === "05_Cancelado" || !params.debeAgendar || !params.fechaRaw) {
        if (params.idEventoOTask) {
          const ids = String(params.idEventoOTask).split(/[,|]+/);
          for (let i = 0; i < ids.length; i++) {
            const cleanId = ids[i].trim();
            if (!cleanId) continue;
            if (cleanId.includes("@google.com")) {
              this.eliminarEventoCalendar(cleanId, "HABITO");
            } else {
              this._eliminarTaskSiExiste(cleanId);
            }
          }
          sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue("");
          if (!params.debeAgendar) {
            sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("No");
          }
        }
        return { success: true, eventId: "", agendado: "No" };
      }

      const tz = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
      const strFecha = this.normalizarFecha(params.fechaRaw, tz);
      const horaProg = this.normalizarHora(params.horaInicioRaw || params.horaInicio);
      const tieneHoraValida = Boolean(horaProg);
      const horaEfectiva = tieneHoraValida ? horaProg : "08:00";

      const esPuntual = Boolean(
        params.esPuntual ||
        Number(params.duracionHoras) === 0 ||
        Number(params.duracionMinutos) === 0 ||
        params.tipoCompromiso === "PUNTUAL"
      );

      // Duración: si es puntual, se asigna 1 minuto (60.000 ms) para anclarlo en su hora exacta sin saturar el calendario.
      const duracionHoras = esPuntual ? (1 / 60) : ((Number(params.duracionHoras) > 0) ? Number(params.duracionHoras) : 1.0);
      const duracionMs = esPuntual ? (60 * 1000) : Math.max(60 * 1000, Math.round(duracionHoras * 3600 * 1000));

      const startTime = this.parsearFechaHora(strFecha, "Operativo_Normal", horaEfectiva);
      if (!startTime) return { success: false, error: "No se pudo calcular la fecha de inicio" };
      const endTime = new Date(startTime.getTime() + duracionMs);

      const prefijoEstado = (params.estado === "04_Completado") ? "✓ " : "";
      const prefijoPuntual = esPuntual ? "📌 " : "";
      const eventTitle = `${prefijoEstado}${prefijoPuntual}${params.nombreActividad}`.trim();
      let eventDesc = params.notas || "";
      if (esPuntual) {
        eventDesc = `[Actividad Puntual - ${horaEfectiva}]\n` + eventDesc;
      }
      eventDesc = eventDesc.trim();

      // Mapeo cromático nativo según la dimensión de vida del hábito / actividad
      const colorHabito = this.obtenerColorEventoHabito(params.categoriaVida, esPuntual);

      const diasSel = (params.diasSeleccionados && Array.isArray(params.diasSeleccionados)) ? params.diasSeleccionados : [];
      const freq = String(params.frecuenciaCiclo || "").trim().toUpperCase();
      const regla = String(params.reglaRepeticion || "").trim().toUpperCase();
      const esRutinaria = this._esActividadRutinaria(freq, regla, diasSel);

      // Actualización in-place si el evento ya existe en el calendario dedicado de Hábitos y no es rutinario
      if (params.idEventoOTask && !esRutinaria) {
        const cleanId = String(params.idEventoOTask).trim();
        if (cleanId.includes("@google.com")) {
          try {
            const evExist = cal.getEventById(cleanId);
            if (evExist) {
              if (!tieneHoraValida) {
                const dateObj = this.parsearFechaSinHora(strFecha);
                evExist.setAllDayDate(dateObj);
              } else {
                evExist.setTime(startTime, endTime);
              }
              evExist.setTitle(eventTitle);
              evExist.setDescription(eventDesc);
              try { evExist.setColor(colorHabito); } catch (eC) { Logger.log("[_gestionarActividadComoEventoCalendar setColor Error]: " + eC.message); }
              sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("Sí");
              return { success: true, eventId: evExist.getId(), agendado: "Sí" };
            }
          } catch (eExist) { Logger.log("[_gestionarActividadComoEventoCalendar getEventById Error]: " + eExist.message); }
        }
      }

      // Si existía como Google Task previamente o evento antiguo a recrear, eliminarlo
      if (params.idEventoOTask) {
        const ids = String(params.idEventoOTask).split(/[,|]+/);
        for (let i = 0; i < ids.length; i++) {
          const cleanId = ids[i].trim();
          if (!cleanId) continue;
          if (cleanId.includes("@google.com")) {
            this.eliminarEventoCalendar(cleanId, "HABITO");
          } else {
            this._eliminarTaskSiExiste(cleanId);
          }
        }
      }

      if (esRutinaria) {
        return this._crearSerieRecurrente(cal, sheet, rowNumber, {
          eventTitle: eventTitle,
          nombreActividad: params.nombreActividad,
          Nombre_Actividad: params.nombreActividad,
          eventDesc: eventDesc,
          fechaRaw: strFecha,
          horaProg: horaEfectiva,
          duracionHoras: duracionHoras,
          esPuntual: esPuntual,
          categoriaVida: params.categoriaVida,
          frecuenciaCiclo: freq,
          reglaRepeticion: regla,
          diasSeleccionados: diasSel
        });
      }

      // Evento único con duración (1 min si es puntual) en el calendario dedicado de Hábitos
      let nuevoEvento = null;
      if (!tieneHoraValida) {
        const dateObj = this.parsearFechaSinHora(strFecha);
        nuevoEvento = cal.createAllDayEvent(eventTitle, dateObj, { description: eventDesc });
      } else {
        nuevoEvento = cal.createEvent(eventTitle, startTime, endTime, { description: eventDesc });
      }

      if (nuevoEvento) {
        try {
          nuevoEvento.setColor(colorHabito);
        } catch (eCol) {
          try { nuevoEvento.setColor("2"); } catch (e2) { Logger.log("[_gestionarActividadComoEventoCalendar fallbackColor Error]: " + e2.message); }
        }
        const eventId = nuevoEvento.getId();
        sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue(eventId);
        sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("Sí");
        return { success: true, eventId: eventId, agendado: "Sí" };
      }

      return { success: false, error: "No se pudo generar el evento en Calendar" };
    } catch (err) {
      Logger.log("[_gestionarActividadComoEventoCalendar Exception]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * 2.2. Determina si una actividad es rutinaria/recurrente basada en su frecuencia y regla.
   */
  _esActividadRutinaria: function (frecuenciaCiclo, reglaRepeticion, diasSeleccionados) {
    if (Array.isArray(diasSeleccionados) && diasSeleccionados.length > 0) return true;
    if (!frecuenciaCiclo) return false;
    const freq = String(frecuenciaCiclo).trim().toUpperCase();
    const regla = String(reglaRepeticion || "").trim().toUpperCase();

    return (
      freq === "DIARIA" ||
      freq === "DIARIA_LABORAL" ||
      freq === "FIN_SEMANA" ||
      freq === "SEMANAL" ||
      freq === "MENSUAL" ||
      freq === "ANUAL" ||
      freq === "PERSONALIZADA" ||
      regla === "L-V" ||
      regla.startsWith("DIAS:") ||
      (freq !== "NINGUNA" && freq !== "" && Boolean(regla))
    );
  },

  /**
   * 2.3. Crea una Serie Recurrente en Google Calendar para actividades rutinarias.
   * Usa CalendarApp.newRecurrence() + calendar.createEventSeries() con métodos de API válidos.
   */
  _crearSerieRecurrente: function (cal, sheet, rowNumber, params) {
    try {
      const calDestino = (cal && typeof cal.createEventSeries === "function") ? cal : this.getCalendarioHabitos();
      const horaProg = this.normalizarHora(params.horaProg);
      const tieneHoraValida = Boolean(horaProg);
      const horaEfectiva = tieneHoraValida ? horaProg : "08:00";

      // 1. Obtener la fecha base con su hora calculada
      let fechaBase = this.parsearFechaHora(params.fechaRaw, "Operativo_Normal", horaEfectiva);
      if (!fechaBase) return { success: false, error: "Fecha inválida para serie recurrente" };

      // 2. Construir regla de recurrencia válida para Google Calendar
      let recurrence = CalendarApp.newRecurrence();
      const freq = String(params.frecuenciaCiclo || "").trim().toUpperCase();
      const regla = String(params.reglaRepeticion || "").trim().toUpperCase();

      // Días específicos desde selección estructurada o regla textual
      let diasEspecificos = this._parsearDiasEspecificos(regla, params.diasSeleccionados);

      if (diasEspecificos && diasEspecificos.length > 0) {
        fechaBase = this._calcularPrimerDiaValido(fechaBase, diasEspecificos);
        let weeklyRule = recurrence.addWeeklyRule();
        if (typeof weeklyRule.onlyOnDays === "function") {
          weeklyRule = weeklyRule.onlyOnDays(diasEspecificos);
        } else if (typeof weeklyRule.onlyOnWeekdays === "function") {
          weeklyRule = weeklyRule.onlyOnWeekdays(diasEspecificos);
        } else {
          for (let i = 0; i < diasEspecificos.length; i++) {
            weeklyRule = weeklyRule.onlyOnWeekday(diasEspecificos[i]);
          }
        }
        recurrence = weeklyRule;

      } else if (freq === "DIARIA") {
        recurrence = recurrence.addDailyRule();

      } else if (freq === "DIARIA_LABORAL" || regla === "L-V") {
        diasEspecificos = [
          CalendarApp.Weekday.MONDAY,
          CalendarApp.Weekday.TUESDAY,
          CalendarApp.Weekday.WEDNESDAY,
          CalendarApp.Weekday.THURSDAY,
          CalendarApp.Weekday.FRIDAY
        ];
        fechaBase = this._calcularPrimerDiaValido(fechaBase, diasEspecificos);
        let weeklyRule = recurrence.addWeeklyRule();
        if (typeof weeklyRule.onlyOnDays === "function") {
          weeklyRule = weeklyRule.onlyOnDays(diasEspecificos);
        } else if (typeof weeklyRule.onlyOnWeekdays === "function") {
          weeklyRule = weeklyRule.onlyOnWeekdays(diasEspecificos);
        } else {
          for (let i = 0; i < diasEspecificos.length; i++) {
            weeklyRule = weeklyRule.onlyOnWeekday(diasEspecificos[i]);
          }
        }
        recurrence = weeklyRule;

      } else if (freq === "FIN_SEMANA" || regla === "DIAS:S,D") {
        diasEspecificos = [
          CalendarApp.Weekday.SATURDAY,
          CalendarApp.Weekday.SUNDAY
        ];
        fechaBase = this._calcularPrimerDiaValido(fechaBase, diasEspecificos);
        let weeklyRule = recurrence.addWeeklyRule();
        if (typeof weeklyRule.onlyOnDays === "function") {
          weeklyRule = weeklyRule.onlyOnDays(diasEspecificos);
        } else if (typeof weeklyRule.onlyOnWeekdays === "function") {
          weeklyRule = weeklyRule.onlyOnWeekdays(diasEspecificos);
        } else {
          for (let i = 0; i < diasEspecificos.length; i++) {
            weeklyRule = weeklyRule.onlyOnWeekday(diasEspecificos[i]);
          }
        }
        recurrence = weeklyRule;

      } else if (freq === "SEMANAL") {
        recurrence = recurrence.addWeeklyRule();

      } else if (freq === "MENSUAL") {
        recurrence = recurrence.addMonthlyRule();

      } else if (freq === "ANUAL") {
        recurrence = recurrence.addYearlyRule();

      } else {
        recurrence = null;
      }

      const esPuntual = Boolean(params.esPuntual || Number(params.duracionHoras) === 0);
      const colorHabito = this.obtenerColorEventoHabito(params.categoriaVida, esPuntual);
      const primerDiaValidoInicio = fechaBase;
      const duracion = esPuntual ? (1 / 60) : ((Number(params.duracionHoras) > 0) ? Number(params.duracionHoras) : 0.25);
      const duracionMs = esPuntual ? (60 * 1000) : Math.max(60 * 1000, Math.round(duracion * 3600 * 1000));
      const primerDiaValidoFin = new Date(primerDiaValidoInicio.getTime() + duracionMs);
      const prefijoPuntual = esPuntual ? "📌 " : "";
      const nomBase = params.Nombre_Actividad || params.nombreActividad || params.eventTitle || "Actividad";
      const tituloSerie = nomBase.startsWith("📌") ? nomBase : `${prefijoPuntual}${nomBase}`.trim();

      if (!recurrence) {
        let ev = null;
        try {
          ev = calDestino.createEvent(tituloSerie, primerDiaValidoInicio, primerDiaValidoFin, { description: params.eventDesc });
        } catch (eEv) {
          try {
            ev = this.getCalendarioHabitos().createEvent(tituloSerie, primerDiaValidoInicio, primerDiaValidoFin, { description: params.eventDesc });
          } catch (eEv2) { Logger.log("[_crearSerieRecurrente getCalendarioHabitos createEvent Error]: " + eEv2.message); }
        }
        if (ev) {
          try { ev.setColor(colorHabito); } catch (eCol) { Logger.log("[_crearSerieRecurrente ev setColor Error]: " + eCol.message); }
          sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue(ev.getId());
          sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("Sí");
          return { success: true, eventId: ev.getId(), agendado: "Sí", tipo: "EVENTO_UNICO" };
        }
        return { success: false, error: "No se pudo crear evento único" };
      }

      // 3. Creación de la serie recurrente con fechas de anclaje estrictas
      let series = null;
      try {
        series = calDestino.createEventSeries(tituloSerie, primerDiaValidoInicio, primerDiaValidoFin, recurrence, { description: params.eventDesc });
      } catch (eSeries) {
        Logger.log(`[Calendar Series Fallo]: ${eSeries.message}. Reintentando en calendario de Hábitos...`);
        try {
          series = this.getCalendarioHabitos().createEventSeries(tituloSerie, primerDiaValidoInicio, primerDiaValidoFin, recurrence, { description: params.eventDesc });
        } catch (eDefSeries) {
          Logger.log(`[Calendar Series Error Crítico]: ${eDefSeries.message}`);
        }
      }

      if (series) {
        try { series.setColor(colorHabito); } catch (eColSeries) { Logger.log("[_crearSerieRecurrente series setColor Error]: " + eColSeries.message); }
        const seriesId = series.getId();
        sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.ID_EVENTO_CALENDAR + 1).setValue(seriesId);
        sheet.getRange(rowNumber, CONFIG.COLS_ACTIVIDADES_PERSONALES.AGENDADO_CALENDAR + 1).setValue("Sí");
        Logger.log(`[Calendar] Serie recurrente creada exitosamente en calendario de Hábitos para: ${tituloSerie}`);
        return { success: true, eventId: seriesId, agendado: "Sí", tipo: "SERIE_RECURRENTE", frecuencia: params.frecuenciaCiclo };
      }

      return { success: false, error: "No se pudo crear serie recurrente en Calendar" };
    } catch (err) {
      Logger.log("[_crearSerieRecurrente Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * 2.4. Parsea la regla de repetición "DIAS:L,M,X,J,V,S,D", patrones como "L-V", o array numérico/string diasSeleccionados a CalendarApp.Weekday[].
   */
  _parsearDiasEspecificos: function (reglaRepeticion, diasSeleccionados) {
    const resultado = [];
    const mapaNombres = {
      "LU": CalendarApp.Weekday.MONDAY,
      "LUN": CalendarApp.Weekday.MONDAY,
      "L": CalendarApp.Weekday.MONDAY,
      "MO": CalendarApp.Weekday.MONDAY,
      "MON": CalendarApp.Weekday.MONDAY,
      "MA": CalendarApp.Weekday.TUESDAY,
      "MAR": CalendarApp.Weekday.TUESDAY,
      "M": CalendarApp.Weekday.TUESDAY,
      "TU": CalendarApp.Weekday.TUESDAY,
      "TUE": CalendarApp.Weekday.TUESDAY,
      "MI": CalendarApp.Weekday.WEDNESDAY,
      "MIER": CalendarApp.Weekday.WEDNESDAY,
      "X": CalendarApp.Weekday.WEDNESDAY,
      "WE": CalendarApp.Weekday.WEDNESDAY,
      "WED": CalendarApp.Weekday.WEDNESDAY,
      "JU": CalendarApp.Weekday.THURSDAY,
      "JUE": CalendarApp.Weekday.THURSDAY,
      "J": CalendarApp.Weekday.THURSDAY,
      "TH": CalendarApp.Weekday.THURSDAY,
      "THU": CalendarApp.Weekday.THURSDAY,
      "VI": CalendarApp.Weekday.FRIDAY,
      "VIE": CalendarApp.Weekday.FRIDAY,
      "V": CalendarApp.Weekday.FRIDAY,
      "FR": CalendarApp.Weekday.FRIDAY,
      "FRI": CalendarApp.Weekday.FRIDAY,
      "SA": CalendarApp.Weekday.SATURDAY,
      "SAB": CalendarApp.Weekday.SATURDAY,
      "S": CalendarApp.Weekday.SATURDAY,
      "SAT": CalendarApp.Weekday.SATURDAY,
      "DO": CalendarApp.Weekday.SUNDAY,
      "DOM": CalendarApp.Weekday.SUNDAY,
      "D": CalendarApp.Weekday.SUNDAY,
      "SU": CalendarApp.Weekday.SUNDAY,
      "SUN": CalendarApp.Weekday.SUNDAY
    };
    const mapaNums = {
      0: CalendarApp.Weekday.SUNDAY,
      1: CalendarApp.Weekday.MONDAY,
      2: CalendarApp.Weekday.TUESDAY,
      3: CalendarApp.Weekday.WEDNESDAY,
      4: CalendarApp.Weekday.THURSDAY,
      5: CalendarApp.Weekday.FRIDAY,
      6: CalendarApp.Weekday.SATURDAY,
      7: CalendarApp.Weekday.SUNDAY
    };

    // 1. Días seleccionados desde array (pueden ser strings o números)
    if (Array.isArray(diasSeleccionados) && diasSeleccionados.length > 0) {
      for (let i = 0; i < diasSeleccionados.length; i++) {
        const item = diasSeleccionados[i];
        if (typeof item === "number" || /^\d+$/.test(String(item))) {
          const n = parseInt(item, 10);
          if (mapaNums[n] !== undefined && resultado.indexOf(mapaNums[n]) === -1) {
            resultado.push(mapaNums[n]);
          }
        } else if (typeof item === "string") {
          const s = item.trim().toUpperCase();
          if (mapaNombres[s] && resultado.indexOf(mapaNombres[s]) === -1) {
            resultado.push(mapaNombres[s]);
          }
        }
      }
      if (resultado.length > 0) return resultado;
    }

    if (!reglaRepeticion) return null;

    let regla = String(reglaRepeticion).toUpperCase().trim();

    // Patrón L-V / Días laborables
    if (regla === "L-V" || regla === "LUNES A VIERNES" || regla === "DIAS_LABORABLES" || regla === "DIARIA_LABORAL") {
      return [
        CalendarApp.Weekday.MONDAY,
        CalendarApp.Weekday.TUESDAY,
        CalendarApp.Weekday.WEDNESDAY,
        CalendarApp.Weekday.THURSDAY,
        CalendarApp.Weekday.FRIDAY
      ];
    }

    // Patrón Fin de Semana
    if (regla === "FIN_SEMANA" || regla === "S-D" || regla === "S,D" || regla === "DIAS:S,D") {
      return [
        CalendarApp.Weekday.SATURDAY,
        CalendarApp.Weekday.SUNDAY
      ];
    }

    let diasStr = "";
    if (regla.startsWith("DIAS:")) {
      diasStr = regla.replace("DIAS:", "").trim();
    } else if (/^[A-Z,\s]+$/i.test(regla.trim())) {
      diasStr = regla.trim();
    } else {
      return null;
    }

    if (!diasStr) return null;

    const diasArr = diasStr.split(",").map(function (d) { return d.trim(); });
    for (let i = 0; i < diasArr.length; i++) {
      const dia = diasArr[i].toUpperCase();
      if (mapaNombres[dia] && resultado.indexOf(mapaNombres[dia]) === -1) {
        resultado.push(mapaNombres[dia]);
      }
    }

    return resultado.length > 0 ? resultado : null;
  },

  /**
   * 2.5. Elimina un Google Task si existe, sin lanzar excepción.
   */
  _eliminarTaskSiExiste: function (taskId) {
    if (!taskId) return;
    try {
      if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTask) {
        GoogleTasksService.eliminarTask(taskId);
      }
    } catch (e) {
      Logger.log("[_eliminarTaskSiExiste] " + e.message);
    }
  },

  /**
   * 2.5b. Mapeo cromático nativo para Gastos según Categoría
   */
  obtenerColorEventoGasto: function (categoria) {
    const cat = String(categoria || "").trim().toUpperCase();
    if (cat.includes("CUOTA") || cat.includes("CREDITO") || cat.includes("DEUDA") || cat.includes("BANCO")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_RED) ? CalendarApp.EventColor.PALE_RED : "4";
    }
    if (cat.includes("ALQUILER") || cat.includes("VIVIENDA") || cat.includes("SERVICIO")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.YELLOW) ? CalendarApp.EventColor.YELLOW : "5";
    }
    if (cat.includes("MATERIAL") || cat.includes("SOFTWARE") || cat.includes("EQUIPO") || cat.includes("LICENCIA")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_BLUE) ? CalendarApp.EventColor.PALE_BLUE : "1";
    }
    if (cat.includes("ALIMENTACION") || cat.includes("SUPERMERCADO")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.ORANGE) ? CalendarApp.EventColor.ORANGE : "6";
    }
    if (cat.includes("TRANSPORTE") || cat.includes("LOGISTICA")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.CYAN) ? CalendarApp.EventColor.CYAN : "7";
    }
    return (CalendarApp.EventColor && CalendarApp.EventColor.MAUVE) ? CalendarApp.EventColor.MAUVE : "3";
  },

  /**
   * 2.5c. Mapeo cromático nativo para Ingresos según Fuente
   */
  obtenerColorEventoIngreso: function (fuente) {
    const f = String(fuente || "").trim().toUpperCase();
    if (f.includes("SUELDO") || f.includes("NOMINA")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.PALE_GREEN) ? CalendarApp.EventColor.PALE_GREEN : "2";
    }
    if (f.includes("FREELANCE") || f.includes("HONORARIO")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.CYAN) ? CalendarApp.EventColor.CYAN : "7";
    }
    if (f.includes("INVERSION") || f.includes("RENDIMIENTO")) {
      return (CalendarApp.EventColor && CalendarApp.EventColor.MAUVE) ? CalendarApp.EventColor.MAUVE : "3";
    }
    return (CalendarApp.EventColor && CalendarApp.EventColor.GREEN) ? CalendarApp.EventColor.GREEN : "10";
  },

  /**
   * 2.6. Sincronización de Gastos en su Calendario Dedicado ("PMO - Gastos Programados").
   * GOBERNANZA:
   * - Los gastos reales NO saturan el calendario.
   * - Los GASTOS PROGRAMADOS (y cuotas bancarias) DEBEN agendarse automáticamente.
   * - Al conciliar, muta a ✅ [PAGADO] y color gris tenue de completado.
   */
  sincronizarFilaGasto: function (rowNumber, payload) {
    try {
      const cal = this.getCalendarioGastos();
      if (!cal) return { success: false, error: "Calendario de Gastos no disponible" };

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FINANZAS);
      const colMap = (sheet && typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
        ? FinanzasService.obtenerMapaColumnasGastos(sheet)
        : CONFIG.COLS_FINANZAS;
      const data = payload || (sheet ? sheet.getRange(rowNumber, 1, 1, Math.max(sheet.getLastColumn(), 19)).getValues()[0] : null);
      if (!data) return { success: false, error: "Datos de gasto no encontrados" };

      const idGasto = String(data.idGasto || data.ID_Gasto || (Array.isArray(data) ? data[colMap.ID_GASTO] : "")).trim();
      const desc = String(data.descripcion || data.Descripcion || data.descripcionGasto || (Array.isArray(data) ? data[colMap.DESCRIPCION] : "Gasto")).trim();
      const cat = String(data.categoria || data.Categoria || data.categoriaGasto || (Array.isArray(data) ? data[colMap.CATEGORIA] : "Otros")).trim();
      const fechaRaw = data.fechaGasto || data.Fecha_Gasto || (Array.isArray(data) ? data[colMap.FECHA_GASTO] : null);
      const montoPen = parseFloat(data.montoPen || data.Monto_PEN || (Array.isArray(data) ? data[colMap.MONTO_PEN] : 0)) || 0;
      const estadoPago = String(data.estadoPago || data.Estado_Pago || (Array.isArray(data) ? data[colMap.ESTADO_PAGO] : "")).trim();
      let idEvento = String(data.idEventoCalendar || data.ID_Evento_Calendar || (Array.isArray(data) ? data[colMap.ID_EVENTO_CALENDAR] : "")).trim();

      if (!fechaRaw || estadoPago === "Cancelado") {
        if (idEvento) this.eliminarEventoCalendar(idEvento, "GASTO");
        return { success: true };
      }

      const esReal = (estadoPago === "Pagado" || estadoPago === "Ejecutado" || estadoPago === "Conciliado");

      // Consulta única de evento en Calendar para evitar getEventById redundantes
      let ev = null;
      if (idEvento) {
        try {
          ev = cal.getEventById(idEvento);
        } catch (eEv) {
          Logger.log("[sincronizarFilaGasto getEventById Error]: " + eEv.message);
        }
      }

      // Si ya está pagado/real y tiene evento, actualizar a completado tenue
      if (esReal) {
        if (ev) {
          try {
            let t = ev.getTitle();
            if (!t.includes("✅ [PAGADO]")) {
              t = t.replace(/^(💸|🏦|⏰)?\s*(\[[^\]]+\])?\s*/i, "");
              ev.setTitle(`✅ [PAGADO] S/ ${montoPen.toFixed(2)} - ${t}`);
            }
            const colorGris = (CalendarApp.EventColor && CalendarApp.EventColor.GRAY) ? CalendarApp.EventColor.GRAY : "8";
            ev.setColor(colorGris);
            return { success: true, eventId: idEvento };
          } catch (eEv) {
            Logger.log("[sincronizarFilaGasto Update Real Event]: " + eEv.message);
          }
        }
        // Gasto real sin evento previo: NO saturar el calendario
        return { success: true };
      }

      // GASTO PROGRAMADO: Debe agendarse como recordatorio
      const tz = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
      const strFecha = this.normalizarFecha(fechaRaw, tz);
      const dateObj = this.parsearFechaSinHora(strFecha);
      if (!dateObj) return { success: false, error: "Fecha inválida para gasto programado" };

      const esCuota = cat.toUpperCase().includes("CUOTA") || desc.toUpperCase().includes("CUOTA");
      const prefijo = esCuota ? "🏦 [CUOTA]" : "💸 [VENCE]";
      const eventTitle = `${prefijo} S/ ${montoPen.toFixed(2)} - ${desc}`;
      const eventDesc = `ID Gasto: ${idGasto}\nMonto PEN: S/ ${montoPen.toFixed(2)}\nCategoría: ${cat}\nEstado: ${estadoPago}\nPortal: PMO Personal Modular`;

      // Reutiliza la referencia 'ev' ya obtenida sin llamar getEventById nuevamente
      if (ev) {
        ev.setTitle(eventTitle);
        ev.setDescription(eventDesc);
        ev.setAllDayDate(dateObj);
      } else {
        ev = cal.createAllDayEvent(eventTitle, dateObj, { description: eventDesc });
      }

      if (ev) {
        try {
          const colorCat = this.obtenerColorEventoGasto(cat);
          ev.setColor(colorCat);
        } catch (eC) {
          Logger.log("[sincronizarFilaGasto setColor Error]: " + eC.message);
        }

        const newEventId = ev.getId();
        // Persistir ID evento en la hoja si tenemos número de fila
        if (sheet && rowNumber && rowNumber > 1 && colMap.ID_EVENTO_CALENDAR !== undefined) {
          try {
            sheet.getRange(rowNumber, colMap.ID_EVENTO_CALENDAR + 1).setValue(newEventId);
          } catch (eWrite) {
            Logger.log("[sincronizarFilaGasto setValue Error]: " + eWrite.message);
          }
        }
        return { success: true, eventId: newEventId };
      }
      return { success: false, error: "No se pudo crear evento de gasto" };
    } catch (err) {
      Logger.log("[sincronizarFilaGasto Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * 2.7. Sincronización de Ingresos Programados en su Calendario Dedicado ("PMO - Ingresos Programados").
   */
  sincronizarFilaIngreso: function (rowNumber, payload) {
    try {
      const cal = this.getCalendarioIngresos();
      if (!cal) return { success: false, error: "Calendario de Ingresos no disponible" };

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.INGRESOS);
      const data = payload || (sheet ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn() || 13).getValues()[0] : null);
      if (!data) return { success: false, error: "Datos de ingreso no encontrados" };

      const idIngreso = String(data.idIngreso || data.ID_Ingreso || (Array.isArray(data) ? data[CONFIG.COLS_INGRESOS.ID_INGRESO] : "")).trim();
      const desc = String(data.descripcion || data.Descripcion || (Array.isArray(data) ? data[CONFIG.COLS_INGRESOS.DESCRIPCION] : "Ingreso")).trim();
      const fuente = String(data.origenFuente || data.Origen_Fuente || (Array.isArray(data) ? data[CONFIG.COLS_INGRESOS.ORIGEN_FUENTE] : "Sueldo_Nomina")).trim();
      const fechaRaw = data.fechaIngreso || data.Fecha_Ingreso || (Array.isArray(data) ? data[CONFIG.COLS_INGRESOS.FECHA_INGRESO] : null);
      const montoPen = parseFloat(data.montoPen || data.Monto_PEN || (Array.isArray(data) ? data[CONFIG.COLS_INGRESOS.MONTO_PEN] : 0)) || 0;
      const estadoCobro = String(data.estadoCobro || data.Estado_Cobro || (Array.isArray(data) && CONFIG.COLS_INGRESOS.ESTADO_COBRO !== undefined ? data[CONFIG.COLS_INGRESOS.ESTADO_COBRO] : "")).trim();
      let idEvento = String(data.idEventoCalendar || data.ID_Evento_Calendar || (Array.isArray(data) ? data[CONFIG.COLS_INGRESOS.ID_EVENTO_CALENDAR] : "")).trim();

      if (!fechaRaw || estadoCobro === "Cancelado") {
        if (idEvento) this.eliminarEventoCalendar(idEvento, "INGRESO");
        return { success: true };
      }

      const esReal = (estadoCobro === "Cobrado" || estadoCobro === "Ejecutado" || estadoCobro === "Conciliado");

      // Consulta única de evento en Calendar para evitar getEventById redundantes
      let ev = null;
      if (idEvento) {
        try {
          ev = cal.getEventById(idEvento);
        } catch (eEv) {
          Logger.log("[sincronizarFilaIngreso getEventById Error]: " + eEv.message);
        }
      }

      // Si ya está cobrado/real y tiene evento, actualizar a completado tenue
      if (esReal) {
        if (ev) {
          try {
            let t = ev.getTitle();
            if (!t.includes("✅ [COBRADO]")) {
              t = t.replace(/^(💰|💵|⏰)?\s*(\[[^\]]+\])?\s*/i, "");
              ev.setTitle(`✅ [COBRADO] S/ ${montoPen.toFixed(2)} - ${t}`);
            }
            const colorGris = (CalendarApp.EventColor && CalendarApp.EventColor.GRAY) ? CalendarApp.EventColor.GRAY : "8";
            ev.setColor(colorGris);
            return { success: true, eventId: idEvento };
          } catch (eEv) {
            Logger.log("[sincronizarFilaIngreso Update Real Event]: " + eEv.message);
          }
        }
        // Ingreso real sin evento previo: NO saturar el calendario
        return { success: true };
      }

      // INGRESO PROGRAMADO: Debe agendarse como recordatorio
      const tz = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";
      const strFecha = this.normalizarFecha(fechaRaw, tz);
      const dateObj = this.parsearFechaSinHora(strFecha);
      if (!dateObj) return { success: false, error: "Fecha inválida para ingreso programado" };

      const eventTitle = `💰 [COBRO] S/ ${montoPen.toFixed(2)} - ${desc}`;
      const eventDesc = `ID Ingreso: ${idIngreso}\nMonto PEN: S/ ${montoPen.toFixed(2)}\nFuente: ${fuente}\nEstado: ${estadoCobro}\nPortal: PMO Personal Modular`;

      // Reutiliza la referencia 'ev' ya obtenida sin llamar getEventById nuevamente
      if (ev) {
        ev.setTitle(eventTitle);
        ev.setDescription(eventDesc);
        ev.setAllDayDate(dateObj);
      } else {
        ev = cal.createAllDayEvent(eventTitle, dateObj, { description: eventDesc });
      }

      if (ev) {
        try {
          const colorIngreso = this.obtenerColorEventoIngreso(fuente);
          ev.setColor(colorIngreso);
        } catch (eC) {
          Logger.log("[sincronizarFilaIngreso setColor Error]: " + eC.message);
        }

        const newEventId = ev.getId();
        if (sheet && rowNumber && rowNumber > 1 && CONFIG.COLS_INGRESOS.ID_EVENTO_CALENDAR) {
          try {
            sheet.getRange(rowNumber, CONFIG.COLS_INGRESOS.ID_EVENTO_CALENDAR + 1).setValue(newEventId);
          } catch (eW) {
            Logger.log("[sincronizarFilaIngreso setValue Error]: " + eW.message);
          }
        }
        return { success: true, eventId: newEventId };
      }
      return { success: false, error: "No se pudo crear evento de ingreso" };
    } catch (err) {
      Logger.log("[sincronizarFilaIngreso Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * 2.8. Actualiza el título y color de un evento en Google Calendar tras la conciliación manual
   */
  actualizarConciliacionEventoCalendar: function (idEvento, tipo, conciliar, detalle) {
    if (!idEvento) return false;
    try {
      const tipoNorm = String(tipo || "GASTO").toUpperCase();
      const cal = (tipoNorm === "INGRESO") ? this.getCalendarioIngresos() : this.getCalendarioGastos();
      if (!cal) return false;

      let ev = null;
      try { ev = cal.getEventById(idEvento); } catch (e) { Logger.log("[actualizarConciliacionEventoCalendar cal Error]: " + e.message); }
      if (!ev) {
        // Búsqueda en el otro calendario por si acaso
        const altCal = (tipoNorm === "INGRESO") ? this.getCalendarioGastos() : this.getCalendarioIngresos();
        try { ev = altCal.getEventById(idEvento); } catch (e2) { Logger.log("[actualizarConciliacionEventoCalendar altCal Error]: " + e2.message); }
      }
      if (!ev) return false;

      let title = ev.getTitle();
      if (conciliar) {
        const prefijo = (tipoNorm === "INGRESO") ? "✅ [COBRADO]" : "✅ [PAGADO]";
        if (!title.includes(prefijo)) {
          title = title.replace(/^(💸|💰|🏦|⏰)?\s*(\[[^\]]+\])?\s*/i, "");
          ev.setTitle(`${prefijo} ${title}`);
        }
        const colorGris = (CalendarApp.EventColor && CalendarApp.EventColor.GRAY) ? CalendarApp.EventColor.GRAY : "8";
        ev.setColor(colorGris);
      } else {
        title = title.replace(/^✅\s*\[(PAGADO|COBRADO)\]\s*/i, "");
        const prefijoOrig = (tipoNorm === "INGRESO") ? "💰 [Ingreso]" : "💸 [VENCE]";
        ev.setTitle(`${prefijoOrig} ${title}`);
        const cat = detalle && detalle.categoria ? detalle.categoria : "";
        const colorOrig = (tipoNorm === "INGRESO") ? this.obtenerColorEventoIngreso(cat) : this.obtenerColorEventoGasto(cat);
        ev.setColor(colorOrig);
      }
      return true;
    } catch (err) {
      Logger.log("[actualizarConciliacionEventoCalendar Error]: " + err.message);
      return false;
    }
  },

  agendarGastoEnCalendar: function (payload, rowNumber) {
    return this.sincronizarFilaGasto(rowNumber, payload);
  },

  agendarIngresoEnCalendar: function (payload, rowNumber) {
    return this.sincronizarFilaIngreso(rowNumber, payload);
  }
};