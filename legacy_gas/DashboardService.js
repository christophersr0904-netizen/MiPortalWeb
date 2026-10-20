/**
 * ============================================================================
 * ARCHIVO: DashboardService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Servicio de Lectura Agregada de Alto Rendimiento con Caché Activo
 * ============================================================================
 */

const DashboardService = {

  getDashboardData: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const sanitizarFechaRapida = (val) => {
      if (!val) return "";
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      const str = String(val).trim();
      const cleanStr = str.includes("T") ? str.split("T")[0] : str;
      // Soporte para formato DD/MM/YYYY o DD-MM-YYYY
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(cleanStr)) {
        const sep = cleanStr.includes("/") ? "/" : "-";
        const parts = cleanStr.split(sep);
        const dia = parts[0].padStart(2, "0");
        const mes = parts[1].padStart(2, "0");
        const anio = parts[2];
        return `${anio}-${mes}-${dia}`;
      }
      return cleanStr;
    };

    const sanitizarHoraRapida = (val) => {
      if (!val) return "08:00";
      if (val instanceof Date) {
        const hh = String(val.getHours()).padStart(2, "0");
        const mm = String(val.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
      const str = String(val).trim();
      const match = str.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, "0")}:${match[2]}`;
      }
      return str.length >= 5 ? str.substring(0, 5) : (str || "08:00");
    };

    try {
      const cache = CacheService.getScriptCache();
      const cachedData = cache.get("DASHBOARD_DATA_CACHE");
      const forzarRefresco = (payload === true) || (payload && (payload.forceRefresh === true || payload.forceRefresh === "true" || payload.refresh === true || payload.purgarCache === true));

      if (forzarRefresco) {
        try {
          cache.removeAll([
            "DASHBOARD_DATA_CACHE",
            "NOTAS_DATA_CACHE",
            "DASHBOARD_CACHE",
            "PORTAFOLIO_DATA_CACHE",
            "KANBAN_DATA_CACHE"
          ]);
        } catch (ePurge) {
          Logger.log("[Cache Purge Error]: " + ePurge.message);
        }
      }

      if (cachedData && !forzarRefresco) {
        try {
          return JSON.parse(cachedData);
        } catch (eParse) {
          // Continuar con lectura fresca si falla el parseo
        }
      }

      // 1. Indexación O(1) de todas las hojas del libro en una única instancia en memoria
      const allSheets = ss.getSheets();
      const sheetMap = {};
      for (let sIdx = 0; sIdx < allSheets.length; sIdx++) {
        sheetMap[allSheets[sIdx].getName()] = allSheets[sIdx];
      }

      // Resolver nombres reales de hojas considerando alias flexibles
      const resolverNombreHoja = (nombresPosibles) => {
        const arr = Array.isArray(nombresPosibles) ? nombresPosibles : [nombresPosibles];
        for (let k = 0; k < arr.length; k++) {
          if (sheetMap[arr[k]]) return arr[k];
        }
        const sheetKeys = Object.keys(sheetMap);
        for (let k = 0; k < arr.length; k++) {
          const normBuscar = String(arr[k] || "").toLowerCase().replace(/[\s_\-]/g, "");
          for (let s = 0; s < sheetKeys.length; s++) {
            const normKey = sheetKeys[s].toLowerCase().replace(/[\s_\-]/g, "");
            if (normKey === normBuscar) return sheetKeys[s];
          }
        }
        return arr[0];
      };

      const ALIAS_HOJAS = {
        HITOS: [CONFIG.SHEETS.HITOS, "BBDD_Hitos", "Hitos"],
        TAREAS: [CONFIG.SHEETS.TAREAS, "BBDD_Actividades_Tareas", "BBDD_Tareas", "Tareas"],
        PROYECTOS: [CONFIG.SHEETS.PROYECTOS, "BBDD_Proyectos", "Proyectos"],
        FINANZAS: [CONFIG.SHEETS.FINANZAS, "BBDD_Finanzas_Gastos", "BBDD_Gastos", "BBDD_Finanzas", "Gastos"],
        ACTIVIDADES: [CONFIG.SHEETS.ACTIVIDADES_PERSONALES, "BBDD_Actividades_Personales", "BBDD_Actividades", "BBDD_Habitos", "Habitos", "Actividades"],
        INGRESOS: [CONFIG.SHEETS.INGRESOS, "BBDD_Finanzas_Ingresos", "BBDD_Ingresos", "Ingresos"],
        SUBTAREAS: [CONFIG.SHEETS.SUBTAREAS, "BBDD_Subtareas_Pasos", "BBDD_Subtareas", "Subtareas"],
        NOTAS: [(CONFIG.SHEETS && CONFIG.SHEETS.NOTAS) || "BBDD_Notas", "BBDD_Notas", "Notas"],
        IDEAS: [(CONFIG.SHEETS && CONFIG.SHEETS.IDEAS) || "BBDD_Ideas", "BBDD_Ideas", "Ideas"]
      };

      const nombreRealHitos = resolverNombreHoja(ALIAS_HOJAS.HITOS);
      const nombreRealTareas = resolverNombreHoja(ALIAS_HOJAS.TAREAS);
      const nombreRealProyectos = resolverNombreHoja(ALIAS_HOJAS.PROYECTOS);
      const nombreRealFinanzas = resolverNombreHoja(ALIAS_HOJAS.FINANZAS);
      const nombreRealActividades = resolverNombreHoja(ALIAS_HOJAS.ACTIVIDADES);
      const nombreRealIngresos = resolverNombreHoja(ALIAS_HOJAS.INGRESOS);
      const nombreRealSubtareas = resolverNombreHoja(ALIAS_HOJAS.SUBTAREAS);
      const nombreRealNotas = resolverNombreHoja(ALIAS_HOJAS.NOTAS);

      // 2. Soporte de ultra alto rendimiento: Sheets API v4 batchGet en una única petición interna (~300ms)
      let batchDataMap = null;
      let batchHeadersMap = {};
      if (typeof Sheets !== "undefined" && Sheets.Spreadsheets && Sheets.Spreadsheets.Values) {
        try {
          const sheetNamesBatch = [
            nombreRealHitos,
            nombreRealTareas,
            nombreRealProyectos,
            nombreRealFinanzas,
            nombreRealActividades,
            nombreRealIngresos,
            nombreRealSubtareas
          ];
          const validSheetNames = sheetNamesBatch.filter(name => !!sheetMap[name]);
          if (validSheetNames.length > 0) {
            // Lectura completa A1:ZZ para capturar cabeceras dinámicas y columnas sin límite en una sola petición RPC
            const rangeQueries = validSheetNames.map(name => `'${name}'!A1:ZZ`);
            const batchResponse = Sheets.Spreadsheets.Values.batchGet(ss.getId(), { ranges: rangeQueries });
            if (batchResponse && batchResponse.valueRanges) {
              batchDataMap = {};
              batchHeadersMap = {};
              for (let bIdx = 0; bIdx < validSheetNames.length; bIdx++) {
                const allRows = (batchResponse.valueRanges[bIdx] && batchResponse.valueRanges[bIdx].values) || [];
                if (allRows.length > 0) {
                  batchHeadersMap[validSheetNames[bIdx]] = allRows[0];
                  batchDataMap[validSheetNames[bIdx]] = allRows.slice(1);
                } else {
                  batchHeadersMap[validSheetNames[bIdx]] = [];
                  batchDataMap[validSheetNames[bIdx]] = [];
                }
              }
            }
          }
        } catch (eBatch) {
          Logger.log("[DashboardService batchGet fallback a getSheets]: " + eBatch.message);
          batchDataMap = null;
          batchHeadersMap = {};
        }
      }

      // Función auxiliar optimizada para leer rangos (prioriza batchDataMap -> sheetMap en memoria)
      const leerHojaMatriz = (nombreHoja) => {
        const nombreResuelto = resolverNombreHoja(nombreHoja);
        if (batchDataMap && batchDataMap[nombreResuelto] !== undefined) {
          return batchDataMap[nombreResuelto];
        }
        const hoja = sheetMap[nombreResuelto];
        if (!hoja) return [];
        const lastRow = hoja.getLastRow();
        const lastCol = hoja.getLastColumn();
        if (lastRow <= 1 || lastCol === 0) return [];
        return hoja.getRange(2, 1, lastRow - 1, lastCol).getValues();
      };

      // Función auxiliar para obtener cabeceras (prioriza batchHeadersMap -> getRange en memoria)
      const obtenerCabecerasHoja = (nombreHoja) => {
        const nombreResuelto = resolverNombreHoja(nombreHoja);
        if (batchHeadersMap && batchHeadersMap[nombreResuelto] && batchHeadersMap[nombreResuelto].length > 0) {
          return batchHeadersMap[nombreResuelto];
        }
        const hoja = sheetMap[nombreResuelto];
        if (!hoja) return [];
        const lastCol = hoja.getLastColumn();
        if (lastCol <= 0) return [];
        return hoja.getRange(1, 1, 1, lastCol).getValues()[0] || [];
      };

      // Mapeos dinámicos resilientes basados en las cabeceras reales de cada hoja
      const headersHitos = obtenerCabecerasHoja(nombreRealHitos);
      const colMapHitos = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaHitos)
        ? CONFIG.obtenerMapaHitos(headersHitos)
        : CONFIG.COLS_HITOS;

      const headersTareas = obtenerCabecerasHoja(nombreRealTareas);
      const colMapTareas = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaTareas)
        ? CONFIG.obtenerMapaTareas(headersTareas)
        : CONFIG.COLS_TAREAS;

      const headersProyectos = obtenerCabecerasHoja(nombreRealProyectos);
      const colMapProyectos = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaProyectos)
        ? CONFIG.obtenerMapaProyectos(headersProyectos)
        : CONFIG.COLS_PROYECTOS;

      const headersFinanzas = obtenerCabecerasHoja(nombreRealFinanzas);
      const colMapFin = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
        ? FinanzasService.obtenerMapaColumnasGastos(headersFinanzas)
        : CONFIG.COLS_FINANZAS;

      const headersActividades = obtenerCabecerasHoja(nombreRealActividades);
      const colMapAct = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaActividades)
        ? CONFIG.obtenerMapaActividades(headersActividades)
        : CONFIG.COLS_ACTIVIDADES_PERSONALES;

      const headersIngresos = obtenerCabecerasHoja(nombreRealIngresos);
      const colMapIng = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaIngresos)
        ? CONFIG.obtenerMapaIngresos(headersIngresos)
        : CONFIG.COLS_INGRESOS;

      const headersSubtareas = obtenerCabecerasHoja(nombreRealSubtareas);
      const colMapSub = (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaSubtareas)
        ? CONFIG.obtenerMapaSubtareas(headersSubtareas)
        : CONFIG.COLS_SUBTAREAS;

      // 1. Hitos
      const hData = leerHojaMatriz(nombreRealHitos);
      const hitos = [];
      const mapaHitoAProyecto = {};
      const mapaHitosPorProyecto = {};
      for (let i = 0; i < hData.length; i++) {
        const r = hData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        const idxIdH = colMapHitos.ID_ELEMENTO_WBS !== undefined ? colMapHitos.ID_ELEMENTO_WBS : (colMapHitos.ID_HITO !== undefined ? colMapHitos.ID_HITO : 0);
        const idxProyH = colMapHitos.ID_PROYECTO !== undefined ? colMapHitos.ID_PROYECTO : 1;
        let idH = String(r[idxIdH] || "").trim();
        let idProy = String(r[idxProyH] || "").trim();

        // Detección y autocorrección de inversión accidental de columnas (ej. ID_Proyecto antes de ID_Hito)
        if (idH.toUpperCase().startsWith("PRO-") && (!idProy || idProy.toUpperCase().startsWith("HIT-") || idProy.toUpperCase().startsWith("WP-"))) {
          const tmp = idProy;
          idProy = idH;
          idH = tmp;
        }

        if (!idH) {
          idH = "HIT-AUTO-" + (i + 1);
        }
        mapaHitoAProyecto[idH.toUpperCase()] = idProy;

        const idxNomH = colMapHitos.NOMBRE_ELEMENTO !== undefined ? colMapHitos.NOMBRE_ELEMENTO : (colMapHitos.NOMBRE_HITO !== undefined ? colMapHitos.NOMBRE_HITO : 5);
        let nomHito = String(r[idxNomH] || "").trim();
        if (!nomHito) {
          for (let c = 0; c < r.length; c++) {
            const val = String(r[c] || "").trim();
            if (val && !val.startsWith("HIT-") && !val.startsWith("WP-") && !val.startsWith("PRO-") && isNaN(Number(val))) {
              nomHito = val;
              break;
            }
          }
          if (!nomHito) nomHito = "Elemento " + (i + 1);
        }

        const rawTipo = colMapHitos.TIPO_ELEMENTO_WBS !== undefined ? String(r[colMapHitos.TIPO_ELEMENTO_WBS] || "").trim().toUpperCase() : "";
        let tipoElem = "PAQUETE_TRABAJO";
        if (rawTipo === "HITO_MARCADOR" || idH.toUpperCase().startsWith("HIT-")) {
          tipoElem = "HITO_MARCADOR";
        } else if (rawTipo === "PAQUETE_TRABAJO" || idH.toUpperCase().startsWith("WP-")) {
          tipoElem = "PAQUETE_TRABAJO";
        } else if (rawTipo) {
          tipoElem = rawTipo;
        }

        const wbsCode = colMapHitos.WBS_CODE !== undefined ? String(r[colMapHitos.WBS_CODE] || "").trim() : "";
        const faseAsoc = String(r[colMapHitos.FASE_ASOCIADA !== undefined ? colMapHitos.FASE_ASOCIADA : 4] || "Planificacion").trim();
        const estadoHito = String(r[colMapHitos.ESTADO !== undefined ? colMapHitos.ESTADO : 6] || "01_Pendiente").trim();

        let pPct = parseFloat(String(r[colMapHitos.PESO_PCT !== undefined ? colMapHitos.PESO_PCT : 7] || "").replace("%", "").trim());
        if (pPct > 1) pPct = pPct / 100;
        if (isNaN(pPct) || pPct <= 0) pPct = 0.2;

        const idxFecLim = colMapHitos.FECHA_LIMITE !== undefined ? colMapHitos.FECHA_LIMITE : (colMapHitos.FECHA_LIMITE_PLAN !== undefined ? colMapHitos.FECHA_LIMITE_PLAN : 8);
        const fecLim = sanitizarFechaRapida(r[idxFecLim]);
        const idxFecFin = colMapHitos.FECHA_REAL_FIN !== undefined ? colMapHitos.FECHA_REAL_FIN : 9;
        const fecRealFin = sanitizarFechaRapida(r[idxFecFin]);

        // Cálculo de desviación en días en memoria: (fechaReal || fechaHoy) - fechaLimite (sin fórmulas in-sheet)
        let desviacionDias = 0;
        if (fecLim) {
          try {
            const dLim = new Date(String(fecLim).includes('T') ? String(fecLim).split('T')[0] : fecLim);
            if (!isNaN(dLim.getTime())) {
              const dComp = fecRealFin
                ? new Date(String(fecRealFin).includes('T') ? String(fecRealFin).split('T')[0] : fecRealFin)
                : new Date();
              if (!isNaN(dComp.getTime())) {
                dLim.setHours(0, 0, 0, 0);
                dComp.setHours(0, 0, 0, 0);
                desviacionDias = Math.round((dComp.getTime() - dLim.getTime()) / (1000 * 60 * 60 * 24));
              }
            }
          } catch (eDesv) {
            desviacionDias = 0;
          }
        }

        // Regla canónica WBS v4.1: si tipoElementoWbs === 'HITO_MARCADOR', forzar presupuestoAsignado = 0.00
        const idxPres = colMapHitos.PRESUPUESTO_ASIGNADO !== undefined ? colMapHitos.PRESUPUESTO_ASIGNADO : (colMapHitos.COSTO_ESTIMADO !== undefined ? colMapHitos.COSTO_ESTIMADO : 10);
        let presupuestoAsig = parseFloat(String(r[idxPres] || "").replace(/[^0-9.-]/g, "")) || 0.0;
        if (tipoElem === "HITO_MARCADOR") {
          presupuestoAsig = 0.00;
        }

        const idxDod = colMapHitos.CRITERIO_DOD !== undefined ? colMapHitos.CRITERIO_DOD : (colMapHitos.DOD !== undefined ? colMapHitos.DOD : 11);
        const criterioDod = String(r[idxDod] || "").trim();

        const idxDep = colMapHitos.DEPENDENCIA_PREDECESORA !== undefined ? colMapHitos.DEPENDENCIA_PREDECESORA : 12;
        const depPredecesora = String(r[idxDep] || "").trim();

        const idxLink = colMapHitos.ENTREGABLE_LINK !== undefined ? colMapHitos.ENTREGABLE_LINK : 13;
        const entregableLink = String(r[idxLink] || "").trim();

        const esMavH = (/\[MAV\]/i.test(criterioDod) || /\[MAV\]/i.test(nomHito));

        const hitoObj = {
          ID_Elemento_WBS: idH,
          idElementoWbs: idH,
          ID_Hito: idH,
          idHito: idH,
          id_hito: idH,
          ID_Proyecto: idProy,
          idProyecto: idProy,
          id_proyecto: idProy,
          Tipo_Elemento_WBS: tipoElem,
          tipoElementoWbs: tipoElem,
          WBS_Code: wbsCode,
          wbsCode: wbsCode,
          Nombre_Elemento: nomHito,
          Nombre_Hito: nomHito,
          Fase_Asociada: faseAsoc,
          faseAsociada: faseAsoc,
          Estado: estadoHito,
          Estado_Hito: estadoHito,
          estadoHito: estadoHito,
          Peso_Ponderado_Pct: pPct,
          pesoPonderadoPct: pPct,
          Fecha_Limite_Plan: fecLim,
          Fecha_Limite: fecLim,
          fechaLimite: fecLim,
          Fecha_Real_Fin: fecRealFin,
          fechaRealFin: fecRealFin,
          Desviacion_Dias: desviacionDias,
          desviacionDias: desviacionDias,
          Presupuesto_Asignado: presupuestoAsig,
          presupuestoAsignado: presupuestoAsig,
          Costo_Asociado_Estimado: presupuestoAsig,
          Costo_Estimado: presupuestoAsig,
          Presupuesto_Estimado: presupuestoAsig,
          Criterio_Aceptacion_DoD: criterioDod,
          Criterios_DoD: criterioDod,
          criterioDod: criterioDod,
          Dependencia_Predecesora: depPredecesora,
          Dependencia_ID_Hito: depPredecesora,
          dependenciaPredecesora: depPredecesora,
          Entregable_Link: entregableLink,
          Entregable_Verificable_Link: entregableLink,
          entregableLink: entregableLink,
          Costo_Ejecutado_Real_PEN: 0,
          Duracion_Dias: 0,
          duracionDias: 0,
          Es_MAV: !!esMavH
        };
        hitos.push(hitoObj);

        if (idProy) {
          const pKey = idProy.toUpperCase();
          if (!mapaHitosPorProyecto[pKey]) mapaHitosPorProyecto[pKey] = [];
          mapaHitosPorProyecto[pKey].push(hitoObj);
        }
      }

      // 2. Tareas
      const tData = leerHojaMatriz(nombreRealTareas);
      const tareas = [];
      const mapaTareasPorProyecto = {};
      for (let i = 0; i < tData.length; i++) {
        const r = tData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        let idT = String(r[colMapTareas.ID_TAREA] || "").trim();
        if (!idT) {
          idT = "TAR-AUTO-" + (i + 1);
        }

        // Extracción robusta de ID_Hito e ID_Proyecto con fallback multicanal
        let idH = "";
        const idxHito = (colMapTareas.ID_HITO !== undefined)
          ? colMapTareas.ID_HITO
          : (colMapTareas.IDHITO !== undefined ? colMapTareas.IDHITO : (colMapTareas.idHito !== undefined ? colMapTareas.idHito : (colMapTareas.id_hito !== undefined ? colMapTareas.id_hito : 1)));
        if (r[idxHito] !== undefined) {
          idH = String(r[idxHito] || "").trim();
        } else if (r.length > 1 && r[1] !== undefined) {
          idH = String(r[1] || "").trim();
        }

        let idP = "";
        const idxProy = (colMapTareas.ID_PROYECTO !== undefined)
          ? colMapTareas.ID_PROYECTO
          : (colMapTareas.IDPROYECTO !== undefined ? colMapTareas.IDPROYECTO : (colMapTareas.idProyecto !== undefined ? colMapTareas.idProyecto : (colMapTareas.id_proyecto !== undefined ? colMapTareas.id_proyecto : 2)));
        if (r[idxProy] !== undefined) {
          idP = String(r[idxProy] || "").trim();
        } else if (r.length > 2 && r[2] !== undefined) {
          idP = String(r[2] || "").trim();
        }

        // Detección y autocorrección de inversión accidental de columnas (ej. ID_Proyecto en Col B e ID_Hito en Col C)
        if (idH.toUpperCase().startsWith("PRO-") && (!idP || idP.toUpperCase().startsWith("HIT-"))) {
          const tmp = idP;
          idP = idH;
          idH = tmp;
        }

        // Deducción inversa: asociar proyecto a partir del hito si no venía explícito
        if (!idP && idH && mapaHitoAProyecto[idH.toUpperCase()]) {
          idP = String(mapaHitoAProyecto[idH.toUpperCase()] || "").trim();
        }

        // Fallback por convención jerárquica de prefijo de hito (ej. PRO-001-H01 -> PRO-001)
        if (!idP && idH && idH.includes("-H")) {
          idP = idH.substring(0, idH.lastIndexOf("-H")).trim();
        }

        idP = String(idP || "").trim();
        idH = String(idH || "").trim();

        let nomT = String(r[colMapTareas.NOMBRE_TAREA] || "").trim();
        if (!nomT) {
          for (let c = 0; c < r.length; c++) {
            const val = String(r[c] || "").trim();
            if (val && !val.startsWith("TAR-") && !val.startsWith("PRO-") && !val.startsWith("HIT-") && isNaN(Number(val))) {
              nomT = val;
              break;
            }
          }
          if (!nomT) nomT = "Tarea " + (i + 1);
        }

        const rawAgendado = String(r[colMapTareas.AGENDADO_CALENDAR] || "No").trim();
        const rawMav = (colMapTareas.ES_MAV !== undefined && r[colMapTareas.ES_MAV] !== undefined)
          ? r[colMapTareas.ES_MAV]
          : (r.length > 15 ? r[15] : "");
        const esMav = (rawMav === true || String(rawMav).toLowerCase() === "sí" || String(rawMav).toLowerCase() === "si" || String(rawMav).toLowerCase() === "true" || /\[MAV\]/i.test(String(r[colMapTareas.NOTAS] || "")) || String(r[colMapTareas.PRIORIDAD] || "").includes("01_P1"));

        const tareaObj = {
          ID_Tarea: idT,
          idTarea: idT,
          id_tarea: idT,
          idProyecto: idP,
          id_proyecto: idP,
          ID_Proyecto: idP,
          idHito: idH,
          id_hito: idH,
          ID_Hito: idH,
          Nombre_Tarea_Actividad: nomT,
          Estado_Tarea: String(r[colMapTareas.ESTADO] || "01_Backlog").trim(),
          Prioridad_Eisenhower: String(r[colMapTareas.PRIORIDAD] || "02_P2_Media").trim(),
          Nivel_Energia_Requerido: String(r[colMapTareas.NIVEL_ENERGIA] || "Media_Operativa").trim(),
          Horas_Estimadas: parseFloat(r[colMapTareas.HORAS_ESTIMADAS]) || 1.0,
          Horas_Reales: parseFloat(r[colMapTareas.HORAS_REALES]) || 0.0,
          Fecha_Programada: sanitizarFechaRapida(r[colMapTareas.FECHA_PROGRAMADA]),
          Agendado_Calendar: (rawAgendado.toLowerCase().startsWith("s") || rawAgendado.includes("|")) ? "Sí" : "No",
          ID_Dependencia: String(r[colMapTareas.ID_DEPENDENCIA] || "").trim(),
          Responsable_Ejecutor: String(r[colMapTareas.RESPONSABLE] || "Christopher").trim(),
          Notas_Impedimentos: String(r[colMapTareas.NOTAS] || "").trim(),
          Es_MAV: !!esMav
        };
        tareas.push(tareaObj);

        if (idP) {
          const pKey = idP.toUpperCase();
          if (!mapaTareasPorProyecto[pKey]) mapaTareasPorProyecto[pKey] = [];
          mapaTareasPorProyecto[pKey].push(tareaObj);
        }
      }

      // 3. Proyectos con Salud Determinista y Métricas MAV
      const pData = leerHojaMatriz(nombreRealProyectos);
      const proyectos = [];
      for (let i = 0; i < pData.length; i++) {
        const r = pData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        let id = String(r[colMapProyectos.ID_PROYECTO] || "").trim();
        if (!id) {
          id = "PRO-AUTO-" + (i + 1);
        }

        let nombreProy = String(r[colMapProyectos.NOMBRE] || "").trim();
        if (!nombreProy) {
          for (let c = 0; c < r.length; c++) {
            const val = String(r[c] || "").trim();
            if (val && !val.startsWith("PRO-") && isNaN(Number(val))) {
              nombreProy = val;
              break;
            }
          }
          if (!nombreProy) nombreProy = "Proyecto " + (i + 1);
        }

        const idUpper = id.toUpperCase();
        const hitosDelProy = mapaHitosPorProyecto[idUpper] || [];
        const tareasDelProy = mapaTareasPorProyecto[idUpper] || [];

        // Frecuencia y Cadencia de Gobernanza
        const freq = String(r[colMapProyectos.FRECUENCIA_CONTROL] || "Semanal").trim();
        const ultRevRaw = r[colMapProyectos.ULTIMA_REVISION];
        const ultRev = sanitizarFechaRapida(ultRevRaw);
        let diasSinRevision = 0;
        let requiereCheckin = false;
        const maxDiasPermitidos = freq === "Diario" ? 1 : (freq === "Quincenal" ? 15 : (freq === "Mensual" ? 30 : 7));
        if (ultRev) {
          const dRev = new Date(ultRev);
          if (!isNaN(dRev.getTime())) {
            diasSinRevision = Math.max(0, Math.floor((new Date().getTime() - dRev.getTime()) / (1000 * 60 * 60 * 24)));
            if (diasSinRevision >= maxDiasPermitidos) requiereCheckin = true;
          }
        } else {
          requiereCheckin = true;
          diasSinRevision = maxDiasPermitidos + 1;
        }

        // MAV Metrics
        const tareasMav = tareasDelProy.filter(t => t.Es_MAV);
        const tareasMavComp = tareasMav.filter(t => t.Estado_Tarea === "04_Completado");
        let avPct = parseFloat(String((colMapProyectos.AVANCE_REAL_PCT !== undefined ? r[colMapProyectos.AVANCE_REAL_PCT] : r[colMapProyectos.AVANCE]) || "").replace("%", "").trim());
        if (avPct > 1) avPct = avPct / 100;
        if (isNaN(avPct)) avPct = 0.0;
        const avanceMavPct = tareasMav.length > 0 ? Math.round((tareasMavComp.length / tareasMav.length) * 100) : Math.round(avPct * 100);

        const presTope = parseFloat(String(r[colMapProyectos.PRESUPUESTO_TOPE] || "").replace(/[^0-9.-]/g, "")) || 0.0;
        const costoPen = parseFloat(String((colMapProyectos.COSTO_EJECUTADO_PEN !== undefined ? r[colMapProyectos.COSTO_EJECUTADO_PEN] : r[colMapProyectos.COSTO_REAL_PEN]) || "").replace(/[^0-9.-]/g, "")) || 0.0;
        const costoUsd = parseFloat(String((colMapProyectos.COSTO_EJECUTADO_USD !== undefined ? r[colMapProyectos.COSTO_EJECUTADO_USD] : r[colMapProyectos.COSTO_REAL_USD]) || "").replace(/[^0-9.-]/g, "")) || 0.0;
        const entregableObj = String((colMapProyectos.ENTREGABLE_OBJETO !== undefined ? r[colMapProyectos.ENTREGABLE_OBJETO] : r[colMapProyectos.OBJETO]) || "").trim();
        const okrVal = String((colMapProyectos.NORTH_STAR_OKR !== undefined ? r[colMapProyectos.NORTH_STAR_OKR] : r[colMapProyectos.OKR]) || "").trim();
        const dodVal = String((colMapProyectos.CRITERIOS_DOD !== undefined ? r[colMapProyectos.CRITERIOS_DOD] : r[colMapProyectos.DOD]) || "").trim();
        const urlDriveVal = String((colMapProyectos.ALCANCE_URL_DRIVE !== undefined ? r[colMapProyectos.ALCANCE_URL_DRIVE] : r[colMapProyectos.URL_DRIVE]) || "").trim();
        const tercerosVal = String((colMapProyectos.TERCEROS_INVOLUCRADOS !== undefined ? r[colMapProyectos.TERCEROS_INVOLUCRADOS] : r[colMapProyectos.TERCEROS]) || "").trim();

        const proyObj = {
          ID_Proyecto: id,
          Nombre_Proyecto: nombreProy,
          Tipo_Iniciativa: String(r[colMapProyectos.TIPO] || "Profesional").trim(),
          Categoria_TShirt: String((colMapProyectos.MAGNITUD_COMPLEJIDAD !== undefined ? r[colMapProyectos.MAGNITUD_COMPLEJIDAD] : r[colMapProyectos.TSHIRT]) || "Medium").trim(),
          Magnitud_Complejidad: String((colMapProyectos.MAGNITUD_COMPLEJIDAD !== undefined ? r[colMapProyectos.MAGNITUD_COMPLEJIDAD] : r[colMapProyectos.TSHIRT]) || "Medium").trim(),
          Criterio_Dominante: String((colMapProyectos.ARQUETIPO_PROYECTO !== undefined ? r[colMapProyectos.ARQUETIPO_PROYECTO] : r[colMapProyectos.CRITERIO]) || "1_Infraestructura").trim(),
          Arquetipo_Proyecto: String((colMapProyectos.ARQUETIPO_PROYECTO !== undefined ? r[colMapProyectos.ARQUETIPO_PROYECTO] : r[colMapProyectos.CRITERIO]) || "1_Infraestructura").trim(),
          Estado_Proyecto: String(r[colMapProyectos.ESTADO] || "01_Backlog").trim(),
          Avance_Real_Pct: avPct,
          Fecha_Inicio_Plan: sanitizarFechaRapida(r[colMapProyectos.FECHA_INICIO_PLAN]),
          Fecha_Fin_Plan: sanitizarFechaRapida(r[colMapProyectos.FECHA_FIN_PLAN]),
          Moneda_Base: String(r[colMapProyectos.MONEDA_BASE] || "PEN").trim(),
          Presupuesto_Tope: presTope,
          Costo_Ejecutado_Real_PEN: costoPen,
          Costo_Ejecutado_Real_USD: costoUsd,
          North_Star_OKR: okrVal,
          Criterios_Aceptacion_DoD: dodVal,
          Criterios_DoD: dodVal,
          Entregable_Tangible_Objeto: entregableObj,
          Entregable_Tangible: entregableObj,
          Fase_Ciclo_Vida: String((colMapProyectos.FASE !== undefined ? r[colMapProyectos.FASE] : "") || "Planificacion").trim(),
          MAV_Requerido: String((colMapProyectos.MAV !== undefined ? r[colMapProyectos.MAV] : "") || "").trim(),
          Frecuencia_Control: freq,
          Ultima_Revision: ultRev,
          Ultima_Fecha_Control: ultRev,
          Dias_Sin_Revision: diasSinRevision,
          Requiere_Checkin: requiereCheckin,
          Alcance_Detallado_URL_Drive: urlDriveVal,
          URL_Drive: urlDriveVal,
          Terceros_Involucrados: tercerosVal,
          Total_Tareas_MAV: tareasMav.length,
          Completadas_Tareas_MAV: tareasMavComp.length,
          Avance_MAV_Pct: avanceMavPct
        };

        // Colecciones canónicas anidadas e indexadas en memoria para Vista 360 y WBS
        const fasesUnicas = Array.from(new Set(hitosDelProy.map(h => String(h.Fase_Asociada || h.faseAsociada || "").trim()).filter(Boolean)));
        if (fasesUnicas.length === 0) {
          fasesUnicas.push("Fase General");
        }
        proyObj.fasesUnicas = fasesUnicas;
        proyObj.Fases_Unicas = fasesUnicas;
        proyObj.hitos = hitosDelProy;
        proyObj.Hitos = hitosDelProy;
        proyObj.tareas = tareasDelProy;
        proyObj.Tareas = tareasDelProy;

        // Inferencia / lectura de Metodología de Enfoque
        let metDef = "Scrum / Ágil";
        const txtBuscarMet = (proyObj.Terceros_Involucrados + " " + proyObj.Tipo_Iniciativa + " " + proyObj.Fase_Ciclo_Vida).toLowerCase();
        if (txtBuscarMet.includes("cascada") || txtBuscarMet.includes("tradicional") || proyObj.Tipo_Iniciativa === "Infraestructura") {
          metDef = "Cascada / Tradicional";
        } else if (txtBuscarMet.includes("kanban") || txtBuscarMet.includes("iterativo") || proyObj.Tipo_Iniciativa === "Personal") {
          metDef = "Iterativo / Kanban";
        }
        proyObj.Metodologia_Sugerida = metDef;

        // Evaluación de Feature Flags Adaptativos por Arquetipo y Magnitud
        if (typeof ProyectosService !== "undefined" && ProyectosService.evaluarFeatureFlagsProyecto) {
          proyObj.featureFlags = ProyectosService.evaluarFeatureFlagsProyecto(
            proyObj.Arquetipo_Proyecto || proyObj.Criterio_Dominante,
            proyObj.Magnitud_Complejidad || proyObj.Categoria_TShirt
          );
        } else if (typeof evaluarFeatureFlagsProyecto === "function") {
          proyObj.featureFlags = evaluarFeatureFlagsProyecto(
            proyObj.Arquetipo_Proyecto || proyObj.Criterio_Dominante,
            proyObj.Magnitud_Complejidad || proyObj.Categoria_TShirt
          );
        } else {
          proyObj.featureFlags = {
            arquetipo: proyObj.Arquetipo_Proyecto || "1_Infraestructura",
            magnitud: proyObj.Magnitud_Complejidad || "Medium",
            flags: {
              arbolWbsCompleto: true,
              rutaCriticaCpm: true,
              evmFinanciero: true,
              sprintsAgiles: false,
              tableroHipotesis: false,
              matrizTradeOff: false,
              checklistDueDiligence: false,
              hitosCurriculares: false,
              timeBlockingDeepWork: false,
              cronogramaTMinus: false,
              directorioProveedores: false,
              modoUltraLigero: false
            }
          };
        }

        // Evaluación Determinista de Salud (Cero edición manual)
        if (typeof ReporteriaService !== "undefined" && ReporteriaService.evaluarSaludDeterminista) {
          const evalSalud = ReporteriaService.evaluarSaludDeterminista(proyObj, hitosDelProy, tareasDelProy);
          proyObj.Health_Status = evalSalud.status;
          proyObj.Health_Motivo = evalSalud.motivo;
          proyObj.SPI = evalSalud.spi;
          proyObj.CPI = evalSalud.cpi;
        } else {
          proyObj.Health_Status = String(r[colMapProyectos.HEALTH] || "🟢 Saludable").trim();
          proyObj.Health_Motivo = "Salud evaluada";
          proyObj.SPI = 1.0;
          proyObj.CPI = 1.0;
        }

        proyectos.push(proyObj);
      }

      // 4. Gastos (14 Columnas Canónicas: Fase 4.9)
      const gData = leerHojaMatriz(nombreRealFinanzas);
      const gastos = [];

      // Mapeo O(1) de tareas para resolución jerárquica de proyecto sin duplicar columnas físicas
      const mapaTareasPorId = {};
      for (let tIdx = 0; tIdx < tareas.length; tIdx++) {
        const tObj = tareas[tIdx];
        const tIdKey = String(tObj.ID_Tarea || "").trim().toUpperCase();
        if (tIdKey) mapaTareasPorId[tIdKey] = tObj;
      }

      for (let i = 0; i < gData.length; i++) {
        const r = gData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        let idG = String((colMapFin.ID_GASTO !== undefined ? r[colMapFin.ID_GASTO] : "") || (colMapFin.ID_TRANSACCION !== undefined ? r[colMapFin.ID_TRANSACCION] : "") || "").trim();
        if (!idG) {
          idG = "GAS-AUTO-" + (i + 1);
        }

        const rawTipoOrigen = String((colMapFin.TIPO_ORIGEN !== undefined ? r[colMapFin.TIPO_ORIGEN] : "") || (colMapFin.CLASIFICACION_ORIGEN !== undefined ? r[colMapFin.CLASIFICACION_ORIGEN] : "") || (colMapFin.TIPO_GASTO !== undefined ? r[colMapFin.TIPO_GASTO] : "") || "").trim();
        const rawOrigenVinc = String((colMapFin.ID_ORIGEN_VINCULADO !== undefined ? r[colMapFin.ID_ORIGEN_VINCULADO] : "") || (colMapFin.ID_ENTIDAD_VINCULADA !== undefined ? r[colMapFin.ID_ENTIDAD_VINCULADA] : "") || (colMapFin.ID_TAREA !== undefined ? r[colMapFin.ID_TAREA] : "") || "").trim();
        const idCuotaVal = String((colMapFin.ID_CUOTA !== undefined ? r[colMapFin.ID_CUOTA] : "") || "").trim();

        // Normalización canónica de tipoOrigen y idOrigenVinculado
        let tipoOrigen = "LIBRE_CORRIENTE";
        let idOrigenVinculado = rawOrigenVinc || "NINGUNO";

        const toUpper = rawTipoOrigen.toUpperCase();
        if (toUpper.includes("PROY") || toUpper.includes("TAREA") || idOrigenVinculado.toUpperCase().startsWith("TAR-")) {
          tipoOrigen = "TAREA_PROYECTO";
        } else if (toUpper.includes("ACT") || toUpper.includes("HABIT") || toUpper.includes("PERS") || idOrigenVinculado.toUpperCase().startsWith("ACT-")) {
          tipoOrigen = "ACTIVIDAD_PERSONAL";
        } else if (toUpper.includes("LIBRE") || idOrigenVinculado.toUpperCase() === "NINGUNO" || !rawOrigenVinc) {
          tipoOrigen = "LIBRE_CORRIENTE";
          idOrigenVinculado = "NINGUNO";
        }

        // Resolución dinámica del Proyecto e Hito padre a través de la tarea vinculada (Cero columnas físicas duplicadas)
        let idTar = (idOrigenVinculado.toUpperCase().startsWith("TAR-")) ? idOrigenVinculado : "";
        let idHit = "";
        let idProy = "";

        if (idTar && mapaTareasPorId[idTar.toUpperCase()]) {
          const tareaVinculada = mapaTareasPorId[idTar.toUpperCase()];
          idProy = String(tareaVinculada.ID_Proyecto || "").trim();
          idHit = String(tareaVinculada.ID_Hito || "").trim();
        } else {
          // Respaldo por columnas secundarias si existen en hojas físicas
          if (colMapFin.ID_PROYECTO !== undefined && r[colMapFin.ID_PROYECTO]) idProy = String(r[colMapFin.ID_PROYECTO]).trim();
          if (colMapFin.ID_HITO !== undefined && r[colMapFin.ID_HITO]) idHit = String(r[colMapFin.ID_HITO]).trim();
          if (colMapFin.ID_TAREA !== undefined && r[colMapFin.ID_TAREA] && !idTar) idTar = String(r[colMapFin.ID_TAREA]).trim();
        }

        const mOrig = parseFloat(String(r[colMapFin.MONTO_ORIGINAL] || "").replace(/[^0-9.-]/g, "")) || 0.0;
        const tc = parseFloat(String(r[colMapFin.TIPO_CAMBIO] || "").replace(/[^0-9.-]/g, "")) || 1.0;
        const mPen = parseFloat(String(r[colMapFin.MONTO_PEN] || "").replace(/[^0-9.-]/g, "")) || (mOrig * tc);

        const descVal = String(r[colMapFin.DESCRIPCION_GASTO] || r[colMapFin.DESCRIPCION] || (colMapFin.CONCEPTO !== undefined ? r[colMapFin.CONCEPTO] : "") || "").trim();
        const catVal = String(r[colMapFin.CATEGORIA_GASTO] || r[colMapFin.CATEGORIA] || "Materiales").trim();
        const estPago = String(r[colMapFin.ESTADO_PAGO] || (colMapFin.ESTADO !== undefined ? r[colMapFin.ESTADO] : "") || "Pagado").trim();
        const compUrl = String(r[colMapFin.COMPROBANTE_URL] || "").trim();

        const colMod = colMapFin.MODALIDAD !== undefined ? colMapFin.MODALIDAD : -1;
        const rawMod = (colMod >= 0 && r[colMod]) ? String(r[colMod]).trim() : "";
        const modalidad = rawMod || (
          (estPago.toLowerCase().includes("programado") || estPago.toLowerCase().includes("pendiente"))
            ? "Programado / Proyectado"
            : "Real / Ejecutado"
        );

        gastos.push({
          ID_Gasto: idG,
          ID_Transaccion: idG,
          tipoOrigen: tipoOrigen,
          Tipo_Origen: tipoOrigen,
          idOrigenVinculado: idOrigenVinculado,
          ID_Origen_Vinculado: idOrigenVinculado,
          idCuota: idCuotaVal,
          ID_Cuota: idCuotaVal,
          comprobanteUrl: compUrl,
          Comprobante_URL: compUrl,
          ID_Proyecto: idProy,
          ID_Hito: idHit,
          ID_Tarea: idTar,
          ID_Entidad_Vinculada: idOrigenVinculado,
          Tipo_Gasto: tipoOrigen === "TAREA_PROYECTO" ? "Tarea Proyecto" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Actividad Personal" : "Gasto Libre"),
          tipoGasto: tipoOrigen === "TAREA_PROYECTO" ? "Tarea Proyecto" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Actividad Personal" : "Gasto Libre"),
          Clasificacion_Origen: tipoOrigen === "TAREA_PROYECTO" ? "Proyecto" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Personal" : "LIBRE_CORRIENTE"),
          Tipo_Entidad: tipoOrigen === "TAREA_PROYECTO" ? "Tarea" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Actividad Personal" : "Gasto Libre"),
          Fecha_Gasto: sanitizarFechaRapida(r[colMapFin.FECHA_GASTO]),
          fechaGasto: sanitizarFechaRapida(r[colMapFin.FECHA_GASTO]),
          Fecha_Registro: sanitizarFechaRapida(r[colMapFin.FECHA_GASTO]),
          fechaRegistro: sanitizarFechaRapida(r[colMapFin.FECHA_GASTO]),
          Descripcion_Gasto: descVal,
          descripcionGasto: descVal,
          Descripcion: descVal,
          descripcion: descVal,
          Concepto: descVal,
          concepto: descVal,
          Categoria_Gasto: catVal,
          categoriaGasto: catVal,
          Categoria: catVal,
          categoria: catVal,
          Moneda_Original: String(r[colMapFin.MONEDA_ORIGINAL] || "PEN").trim(),
          monedaOriginal: String(r[colMapFin.MONEDA_ORIGINAL] || "PEN").trim(),
          Monto_Original: mOrig,
          montoOriginal: mOrig,
          Tipo_Cambio: tc,
          tipoCambio: tc,
          Monto_PEN: mPen,
          montoPEN: mPen,
          Monto_Moneda_Base: mPen,
          Modalidad: modalidad,
          modalidad: modalidad,
          Metodo_Pago: String(r[colMapFin.METODO_PAGO] || "Transferencia_Bancaria").trim(),
          metodoPago: String(r[colMapFin.METODO_PAGO] || "Transferencia_Bancaria").trim(),
          Estado_Pago: estPago,
          estadoPago: estPago,
          Estado: estPago,
          estado: estPago,
          ID_Evento_Calendar: (colMapFin.ID_EVENTO_CALENDAR !== undefined && r[colMapFin.ID_EVENTO_CALENDAR]) ? String(r[colMapFin.ID_EVENTO_CALENDAR]).trim() : "",
          ID_Google_Event: (colMapFin.ID_EVENTO_CALENDAR !== undefined && r[colMapFin.ID_EVENTO_CALENDAR]) ? String(r[colMapFin.ID_EVENTO_CALENDAR]).trim() : ""
        });
      }

      // 5. Actividades Personales
      const aData = leerHojaMatriz(nombreRealActividades);
      const actividadesPersonales = [];
      for (let i = 0; i < aData.length; i++) {
        const r = aData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        let idA = String(r[colMapAct.ID_ACTIVIDAD] || "").trim();
        if (!idA) {
          idA = "ACT-AUTO-" + (i + 1);
        }
        const rawAgendadoA = String(r[colMapAct.AGENDADO_CALENDAR] || "No").trim();
        const catNormA = (typeof CONFIG !== "undefined" && CONFIG.normalizarCategoriaVida)
          ? CONFIG.normalizarCategoriaVida(r[colMapAct.CATEGORIA_VIDA])
          : String(r[colMapAct.CATEGORIA_VIDA] || "SALUD_DEPORTE").trim().toUpperCase();

        const nomActA = String((colMapAct.NOMBRE !== undefined ? r[colMapAct.NOMBRE] : "") || (colMapAct.NOMBRE_ACTIVIDAD !== undefined ? r[colMapAct.NOMBRE_ACTIVIDAD] : "") || "").trim();
        const tipoRegA = String((colMapAct.TIPO_REGISTRO !== undefined ? r[colMapAct.TIPO_REGISTRO] : "") || (colMapAct.TIPO_COMPROMISO !== undefined ? r[colMapAct.TIPO_COMPROMISO] : "") || "HABITUAL").trim();

        const metaMacroA = colMapAct.META_MACRO_NOMBRE !== undefined ? String(r[colMapAct.META_MACRO_NOMBRE] || "").trim() : "";
        const unidadMedA = colMapAct.UNIDAD_MEDIDA !== undefined ? String(r[colMapAct.UNIDAD_MEDIDA] || "").trim() : "";
        const metaObjTotA = colMapAct.META_OBJETIVO_TOTAL !== undefined ? (parseFloat(r[colMapAct.META_OBJETIVO_TOTAL]) || 0.0) : 0.0;
        const valAcumActA = colMapAct.VALOR_ACUMULADO_ACTUAL !== undefined ? (parseFloat(r[colMapAct.VALOR_ACUMULADO_ACTUAL]) || 0.0) : 0.0;
        const metaDiaEstA = colMapAct.META_DIARIA_ESTANDAR !== undefined ? (parseFloat(r[colMapAct.META_DIARIA_ESTANDAR]) || 0.0) : 0.0;
        const nivRescMinA = colMapAct.NIVEL_RESCATE_MINIMO !== undefined ? (parseFloat(r[colMapAct.NIVEL_RESCATE_MINIMO]) || 0.0) : 0.0;

        actividadesPersonales.push({
          ID_Actividad: idA,
          Nombre: nomActA,
          Nombre_Actividad: nomActA,
          Tipo_Registro: tipoRegA,
          Tipo_Compromiso: tipoRegA,
          Categoria_Vida: catNormA,
          Meta_Macro_Nombre: metaMacroA,
          Unidad_Medida: unidadMedA,
          Meta_Objetivo_Total: metaObjTotA,
          Valor_Acumulado_Actual: valAcumActA,
          Meta_Diaria_Estandar: metaDiaEstA,
          Nivel_Rescate_Minimo: nivRescMinA,
          Estado: String(r[colMapAct.ESTADO] || "02_Por_Hacer").trim(),
          Racha_Actual: parseInt(r[colMapAct.RACHA_ACTUAL], 10) || 0,
          Fecha_Programada: sanitizarFechaRapida(r[colMapAct.FECHA_PROGRAMADA]),
          Hora_Inicio: sanitizarHoraRapida(r[colMapAct.HORA_INICIO]),
          Duracion_Horas: (colMapAct.DURACION_HORAS !== undefined && r[colMapAct.DURACION_HORAS] !== "" && r[colMapAct.DURACION_HORAS] !== null && r[colMapAct.DURACION_HORAS] !== undefined && !isNaN(parseFloat(r[colMapAct.DURACION_HORAS]))) ? parseFloat(r[colMapAct.DURACION_HORAS]) : 1.0,
          Agendado_Calendar: (rawAgendadoA.toLowerCase().startsWith("s") || rawAgendadoA.includes("|")) ? "Sí" : "No",
          ID_Evento_Calendar: String(r[colMapAct.ID_EVENTO_CALENDAR] || "").trim(),
          // Retrocompatibilidad
          Prioridad_Eisenhower: String((colMapAct.PRIORIDAD_EISENHOWER !== undefined ? r[colMapAct.PRIORIDAD_EISENHOWER] : "") || "02_P2_Media").trim(),
          Frecuencia_Ciclo: String((colMapAct.FRECUENCIA_CICLO !== undefined ? r[colMapAct.FRECUENCIA_CICLO] : "") || "DIARIA").trim(),
          Regla_Repeticion: String((colMapAct.REGLA_REPETICION !== undefined ? r[colMapAct.REGLA_REPETICION] : "") || "").trim(),
          Monto_Gasto_Asociado: (colMapAct.MONTO_GASTO_ASOCIADO !== undefined) ? (parseFloat(r[colMapAct.MONTO_GASTO_ASOCIADO]) || 0.0) : 0.0,
          Notas_Checklist: String((colMapAct.NOTAS_CHECKLIST !== undefined ? r[colMapAct.NOTAS_CHECKLIST] : "") || "").trim()
        });
      }

      // 6. Ingresos (12 Columnas Canónicas: Fase 4.10)
      const iData = leerHojaMatriz(nombreRealIngresos);
      const ingresos = [];
      for (let i = 0; i < iData.length; i++) {
        const r = iData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        let idI = String((colMapIng.ID_INGRESO !== undefined ? r[colMapIng.ID_INGRESO] : "") || (colMapIng.ID_TRANSACCION !== undefined ? r[colMapIng.ID_TRANSACCION] : "") || "").trim();
        if (!idI) {
          idI = "ING-AUTO-" + (i + 1);
        }

        let tipoOrigenIng = String(
          (colMapIng.TIPO_ORIGEN !== undefined ? r[colMapIng.TIPO_ORIGEN] : "") ||
          (colMapIng.TIPO_INGRESO !== undefined ? r[colMapIng.TIPO_INGRESO] : "") ||
          (colMapIng.CLASIFICACION_ORIGEN !== undefined ? r[colMapIng.CLASIFICACION_ORIGEN] : "") ||
          ""
        ).trim().toUpperCase();

        let idOrigenVinculadoIng = String(
          (colMapIng.ID_ORIGEN_VINCULADO !== undefined ? r[colMapIng.ID_ORIGEN_VINCULADO] : "") ||
          (colMapIng.ID_ENTIDAD_VINCULADA !== undefined ? r[colMapIng.ID_ENTIDAD_VINCULADA] : "") ||
          (colMapIng.ID_PROYECTO_ASOCIADO !== undefined ? r[colMapIng.ID_PROYECTO_ASOCIADO] : "") ||
          (colMapIng.ID_PROYECTO !== undefined ? r[colMapIng.ID_PROYECTO] : "") ||
          ""
        ).trim();

        if (!tipoOrigenIng) {
          if (idOrigenVinculadoIng && idOrigenVinculadoIng.toUpperCase().startsWith("PRO-")) {
            tipoOrigenIng = "PROYECTO";
          } else if (idOrigenVinculadoIng && idOrigenVinculadoIng.toUpperCase().startsWith("ACT-")) {
            tipoOrigenIng = "ACTIVIDAD_PERSONAL";
          } else if (idOrigenVinculadoIng && idOrigenVinculadoIng.toUpperCase() !== "PERSONAL" && idOrigenVinculadoIng.toUpperCase() !== "NINGUNO") {
            tipoOrigenIng = "PROYECTO";
          } else {
            tipoOrigenIng = "LIBRE_CORRIENTE";
          }
        }

        if (!idOrigenVinculadoIng || idOrigenVinculadoIng.toUpperCase() === "PERSONAL") {
          idOrigenVinculadoIng = (tipoOrigenIng === "LIBRE_CORRIENTE") ? "NINGUNO" : idOrigenVinculadoIng;
        }

        const fecIng = sanitizarFechaRapida(colMapIng.FECHA_INGRESO !== undefined ? r[colMapIng.FECHA_INGRESO] : r[colMapIng.FECHA_REGISTRO]);
        const descIng = String((colMapIng.DESCRIPCION_INGRESO !== undefined ? r[colMapIng.DESCRIPCION_INGRESO] : "") || (colMapIng.DESCRIPCION !== undefined ? r[colMapIng.DESCRIPCION] : "") || (colMapIng.CONCEPTO !== undefined ? r[colMapIng.CONCEPTO] : "") || "").trim();
        const catIng = String((colMapIng.CATEGORIA_INGRESO !== undefined ? r[colMapIng.CATEGORIA_INGRESO] : "") || (colMapIng.CATEGORIA !== undefined ? r[colMapIng.CATEGORIA] : "") || (colMapIng.ORIGEN_FUENTE !== undefined ? r[colMapIng.ORIGEN_FUENTE] : "") || "Sueldo_Nomina").trim();
        const monOrig = String((colMapIng.MONEDA_ORIGINAL !== undefined ? r[colMapIng.MONEDA_ORIGINAL] : "") || (colMapIng.MONEDA !== undefined ? r[colMapIng.MONEDA] : "") || "PEN").trim().toUpperCase();
        const mOrig = parseFloat(String(r[colMapIng.MONTO_ORIGINAL] !== undefined ? r[colMapIng.MONTO_ORIGINAL] : r[colMapIng.MONTO] || "").replace(/[^0-9.-]/g, "")) || 0.0;
        const tc = parseFloat(String(r[colMapIng.TIPO_CAMBIO] !== undefined ? r[colMapIng.TIPO_CAMBIO] : r[colMapIng.TC] || "").replace(/[^0-9.-]/g, "")) || 1.0;
        const mPen = parseFloat(String(r[colMapIng.MONTO_PEN] !== undefined ? r[colMapIng.MONTO_PEN] : r[colMapIng.MONTO_MONEDA_BASE] || "").replace(/[^0-9.-]/g, "")) || (monOrig === "PEN" ? mOrig : (mOrig * tc));
        const metCobro = String((colMapIng.METODO_COBRO !== undefined ? r[colMapIng.METODO_COBRO] : "") || (colMapIng.METODO_PAGO !== undefined ? r[colMapIng.METODO_PAGO] : "") || (colMapIng.CUENTA_DESTINO !== undefined ? r[colMapIng.CUENTA_DESTINO] : "") || "BCP").trim();
        const estCobro = String((colMapIng.ESTADO_COBRO !== undefined ? r[colMapIng.ESTADO_COBRO] : "") || (colMapIng.ESTADO_PAGO !== undefined ? r[colMapIng.ESTADO_PAGO] : "") || (colMapIng.ESTADO !== undefined ? r[colMapIng.ESTADO] : "") || "Cobrado").trim();

        const colModIng = colMapIng.MODALIDAD !== undefined ? colMapIng.MODALIDAD : -1;
        const rawModIng = (colModIng >= 0 && r[colModIng]) ? String(r[colModIng]).trim() : "";
        const modalidadIng = rawModIng || (
          (estCobro.toLowerCase().includes("programado") || estCobro.toLowerCase().includes("pendiente"))
            ? "Programado / Proyectado"
            : "Real / Ejecutado"
        );

        const esCobrado = (estCobro.toLowerCase() === "cobrado" || estCobro.toLowerCase() === "ejecutado" || estCobro.toLowerCase() === "conciliado" || estCobro.toLowerCase() === "real / ejecutado");

        ingresos.push({
          ID_Ingreso: idI,
          idIngreso: idI,
          ID_Transaccion: idI,
          idTransaccion: idI,
          Tipo_Origen: tipoOrigenIng,
          tipoOrigen: tipoOrigenIng,
          Clasificacion_Origen: tipoOrigenIng,
          clasificacionOrigen: tipoOrigenIng,
          Tipo_Ingreso: tipoOrigenIng,
          tipoIngreso: tipoOrigenIng,
          ID_Origen_Vinculado: idOrigenVinculadoIng,
          idOrigenVinculado: idOrigenVinculadoIng,
          ID_Entidad_Vinculada: idOrigenVinculadoIng,
          idEntidadVinculada: idOrigenVinculadoIng,
          ID_Proyecto_Asociado: idOrigenVinculadoIng,
          idProyectoAsociado: idOrigenVinculadoIng,
          ID_Proyecto: idOrigenVinculadoIng,
          idProyecto: idOrigenVinculadoIng,
          Fecha_Ingreso: fecIng,
          fechaIngreso: fecIng,
          Fecha_Registro: fecIng,
          fechaRegistro: fecIng,
          Descripcion_Ingreso: descIng,
          descripcionIngreso: descIng,
          Descripcion: descIng,
          descripcion: descIng,
          Concepto: descIng,
          concepto: descIng,
          Categoria_Ingreso: catIng,
          categoriaIngreso: catIng,
          Categoria: catIng,
          categoria: catIng,
          Origen_Fuente: catIng,
          origenFuente: catIng,
          Moneda_Original: monOrig,
          monedaOriginal: monOrig,
          Monto_Original: mOrig,
          montoOriginal: mOrig,
          Tipo_Cambio: tc,
          tipoCambio: tc,
          Monto_PEN: mPen,
          montoPEN: mPen,
          Monto_Moneda_Base: mPen,
          Metodo_Cobro: metCobro,
          metodoCobro: metCobro,
          Metodo_Pago: metCobro,
          metodoPago: metCobro,
          Cuenta_Destino: metCobro,
          cuentaDestino: metCobro,
          Estado_Cobro: estCobro,
          estadoCobro: estCobro,
          Estado_Pago: estCobro,
          estadoPago: estCobro,
          Estado: estCobro,
          estado: estCobro,
          Modalidad: modalidadIng,
          modalidad: modalidadIng,
          ID_Evento_Calendar: (colMapIng.ID_EVENTO_CALENDAR !== undefined && r[colMapIng.ID_EVENTO_CALENDAR]) ? String(r[colMapIng.ID_EVENTO_CALENDAR]).trim() : "",
          ID_Google_Event: (colMapIng.ID_EVENTO_CALENDAR !== undefined && r[colMapIng.ID_EVENTO_CALENDAR]) ? String(r[colMapIng.ID_EVENTO_CALENDAR]).trim() : "",
          Conciliado: esCobrado
        });
      }

      // 7. Subtareas / Pasos Procedurales – Fase 4.14 (Compactación canónica 6 columnas A:F)
      const sData = leerHojaMatriz(nombreRealSubtareas);
      const subtareas = [];
      for (let i = 0; i < sData.length; i++) {
        const r = sData[i];
        const tieneContenido = r.some(c => String(c || "").trim().length > 0);
        if (!tieneContenido) continue;

        let idSub = String(r[colMapSub.ID_SUBTAREA] || "").trim();
        if (!idSub) {
          idSub = "SUB-AUTO-" + (i + 1);
        }

        // Resolución defensiva: 6 columnas canónicas (A:F) vs formato antiguo de 7 columnas
        const isLegacy7 = (r.length >= 7 && (String(r[1]).toUpperCase() === "TAREA" || String(r[1]).toUpperCase() === "ACTIVIDAD"));
        let idPadre = "";
        let numPaso = 1;
        let descPaso = "";
        let compVal = false;
        let fecCompRaw = "";

        if (isLegacy7) {
          idPadre = String(r[2] || "").trim();
          numPaso = parseInt(r[3], 10) || 1;
          descPaso = String(r[4] || "").trim();
          compVal = r[5];
          fecCompRaw = r[6];
        } else {
          idPadre = String(r[colMapSub.ID_PADRE_VINCULADO] || "").trim();
          numPaso = parseInt(r[colMapSub.NUMERO_PASO], 10) || 1;
          descPaso = String(r[colMapSub.DESCRIPCION_PASO] || "").trim();
          compVal = r[colMapSub.COMPLETADO];
          fecCompRaw = r[colMapSub.FECHA_COMPLETADO];
        }

        // Deducción dinámica de Tipo_Padre analizando el prefijo del ID_Padre_Vinculado
        let tipoPadre = "TAREA";
        const idPadreUpper = idPadre.toUpperCase();
        if (idPadreUpper.startsWith("ACT-")) {
          tipoPadre = "ACTIVIDAD";
        } else if (idPadreUpper.startsWith("TAR-")) {
          tipoPadre = "TAREA";
        } else if (isLegacy7 && String(r[1] || "").trim()) {
          tipoPadre = String(r[1]).trim().toUpperCase();
        }

        const isComp = (compVal === true || String(compVal).toLowerCase() === "true" || String(compVal).toLowerCase() === "sí" || String(compVal).toLowerCase() === "si");
        const fecCompSanit = sanitizarFechaRapida(fecCompRaw);

        subtareas.push({
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
          Completado: isComp,
          completado: isComp,
          Fecha_Completado: fecCompSanit,
          fechaCompletado: fecCompSanit
        });
      }

      // 8. Notas Inteligentes – Fase 4.13 (Consolidación canónica 12 columnas A:L)
      let notas = [];
      try {
        if (typeof NotasService !== "undefined" && NotasService.obtenerNotas) {
          const resNotas = NotasService.obtenerNotas({ forceRefresh: !!(payload && payload.forceRefresh) });
          if (resNotas && Array.isArray(resNotas.notas)) {
            notas = resNotas.notas;
          }
        } else {
          // Fallback directo a hoja BBDD_Notas desempaquetando las 12 columnas canónicas exactas
          const sheetNotas = ss.getSheetByName(nombreRealNotas) || ss.getSheetByName((CONFIG.SHEETS && CONFIG.SHEETS.NOTAS) || "BBDD_Notas");
          if (sheetNotas && sheetNotas.getLastRow() > 1) {
            const numRows = sheetNotas.getLastRow() - 1;
            const colMapNotas = (CONFIG.obtenerMapaNotas && CONFIG.obtenerMapaNotas(sheetNotas)) || CONFIG.COLS_NOTAS;
            const rawValsNotas = sheetNotas.getRange(2, 1, numRows, 12).getValues();

            for (let nIdx = 0; nIdx < rawValsNotas.length; nIdx++) {
              const rN = rawValsNotas[nIdx];
              const idNota = String(rN[colMapNotas.ID_NOTA] || "").trim();
              if (!idNota) continue;

              const titulo = String(rN[colMapNotas.TITULO] || "").trim();
              const contMd = String(rN[colMapNotas.CONTENIDO_MARKDOWN] || "").trim();

              // Parseo defensivo tolerante con fallbacks [] o {}
              let chkArr = [];
              try {
                const rawChk = rN[colMapNotas.CHECKLISTS_JSON];
                chkArr = (typeof rawChk === "string" && rawChk.trim().startsWith("[")) ? JSON.parse(rawChk) : (Array.isArray(rawChk) ? rawChk : []);
              } catch (eChk) { chkArr = []; }

              let wlObj = null;
              try {
                const rawWl = rN[colMapNotas.WISHLIST_JSON];
                if (typeof rawWl === "string" && rawWl.trim().startsWith("{")) {
                  wlObj = JSON.parse(rawWl);
                } else if (rawWl && typeof rawWl === "object" && !Array.isArray(rawWl)) {
                  wlObj = rawWl;
                }
              } catch (eWl) { wlObj = null; }

              const colorTema = String(rN[colMapNotas.COLOR_TEMA] || "default").trim().toLowerCase();
              const esFijadaRaw = rN[colMapNotas.ES_FIJADA];
              const esFijada = (esFijadaRaw === true || String(esFijadaRaw).toLowerCase() === "sí" || String(esFijadaRaw).toLowerCase() === "si" || String(esFijadaRaw).toLowerCase() === "true");

              let adjArr = [];
              try {
                const rawAdj = rN[colMapNotas.ADJUNTOS_DRIVE_JSON];
                adjArr = (typeof rawAdj === "string" && rawAdj.trim().startsWith("[")) ? JSON.parse(rawAdj) : (Array.isArray(rawAdj) ? rawAdj : []);
              } catch (eAdj) { adjArr = []; }

              let enlArr = [];
              try {
                const rawEnl = rN[colMapNotas.ENLACES_ENTIDADES_JSON];
                enlArr = (typeof rawEnl === "string" && rawEnl.trim().startsWith("[")) ? JSON.parse(rawEnl) : (Array.isArray(rawEnl) ? rawEnl : []);
              } catch (eEnl) { enlArr = []; }

              let etArr = [];
              try {
                const rawEt = rN[colMapNotas.ETIQUETAS];
                if (typeof rawEt === "string" && rawEt.trim().startsWith("[")) {
                  etArr = JSON.parse(rawEt);
                } else if (typeof rawEt === "string" && rawEt.trim()) {
                  etArr = rawEt.split(",").map(t => t.trim()).filter(Boolean);
                } else if (Array.isArray(rawEt)) {
                  etArr = rawEt;
                }
              } catch (eEt) { etArr = []; }

              const tipoInferido = (wlObj && Object.keys(wlObj).length > 0) ? "WISHLIST" : (chkArr.length > 0 ? "CHECKLIST" : "NORMAL");

              notas.push({
                ID_Nota: idNota, idNota: idNota,
                Titulo: titulo, titulo: titulo,
                Tipo_Nota: tipoInferido, tipoNota: tipoInferido,
                Contenido_Markdown: contMd, contenidoMarkdown: contMd,
                Contenido: contMd, contenido: contMd,
                Checklists_JSON: chkArr, checklistsJson: chkArr,
                Checklist: chkArr, checklist: chkArr,
                Wishlist_JSON: wlObj, wishlistJson: wlObj,
                WishlistMeta: wlObj, wishlistMeta: wlObj,
                Color_Tema: colorTema, colorTema: colorTema,
                Color: colorTema, color: colorTema,
                Es_Fijada: esFijada, esFijada: esFijada,
                Adjuntos_Drive_JSON: adjArr, adjuntosDriveJson: adjArr,
                Adjuntos: adjArr, adjuntos: adjArr,
                Enlaces_Entidades_JSON: enlArr, enlacesEntidadesJson: enlArr,
                Enlaces_Entidades: enlArr, enlacesEntidades: enlArr,
                Vinculaciones: enlArr, vinculaciones: enlArr,
                Vinculos_JSON: enlArr, vinculosJson: enlArr,
                Vinculos: enlArr, vinculos: enlArr,
                Etiquetas: etArr, etiquetas: etArr,
                Tags: etArr, tags: etArr,
                Fecha_Creacion: rN[colMapNotas.FECHA_CREACION] || new Date().toISOString(),
                Fecha_Actualizacion: rN[colMapNotas.FECHA_ACTUALIZACION] || new Date().toISOString()
              });
            }
          }
        }

        // Post-proceso defensivo: asegurar que toda nota devuelta tenga desempaquetados defensivos
        notas = (notas || []).map(function(n) {
          if (!n || typeof n !== "object") return n;
          var parseSafe = function(val, fallback) {
            if (!val) return fallback;
            if (typeof val === "object") return val;
            try { return JSON.parse(val); } catch (e) { return fallback; }
          };
          var chk = parseSafe(n.Checklists_JSON || n.checklistsJson || n.Checklist || n.checklist, []);
          var wl = parseSafe(n.Wishlist_JSON || n.wishlistJson || n.WishlistMeta || n.wishlistMeta, null);
          var adj = parseSafe(n.Adjuntos_Drive_JSON || n.adjuntosDriveJson || n.Adjuntos || n.adjuntos, []);
          var enl = parseSafe(n.Enlaces_Entidades_JSON || n.enlacesEntidadesJson || n.Vinculos_JSON || n.vinculosJson || n.Vinculos || n.vinculos, []);
          var tInf = (wl && typeof wl === "object" && Object.keys(wl).length > 0) ? "WISHLIST" : (Array.isArray(chk) && chk.length > 0 ? "CHECKLIST" : (n.Tipo_Nota || n.tipoNota || "NORMAL"));

          return Object.assign({}, n, {
            Tipo_Nota: tInf, tipoNota: tInf,
            Checklists_JSON: Array.isArray(chk) ? chk : [], checklistsJson: Array.isArray(chk) ? chk : [],
            Checklist: Array.isArray(chk) ? chk : [], checklist: Array.isArray(chk) ? chk : [],
            Wishlist_JSON: wl, wishlistJson: wl,
            WishlistMeta: wl, wishlistMeta: wl,
            Adjuntos_Drive_JSON: Array.isArray(adj) ? adj : [], adjuntosDriveJson: Array.isArray(adj) ? adj : [],
            Adjuntos: Array.isArray(adj) ? adj : [], adjuntos: Array.isArray(adj) ? adj : [],
            Enlaces_Entidades_JSON: Array.isArray(enl) ? enl : [], enlacesEntidadesJson: Array.isArray(enl) ? enl : [],
            Enlaces_Entidades: Array.isArray(enl) ? enl : [], enlacesEntidades: Array.isArray(enl) ? enl : [],
            Vinculaciones: Array.isArray(enl) ? enl : [], vinculaciones: Array.isArray(enl) ? enl : [],
            Vinculos_JSON: Array.isArray(enl) ? enl : [], vinculosJson: Array.isArray(enl) ? enl : [],
            Vinculos: Array.isArray(enl) ? enl : [], vinculos: Array.isArray(enl) ? enl : []
          });
        });
      } catch (errNotas) {
        Logger.log("[DashboardService] Error cargando notas: " + errNotas.message);
      }

      // 8b. Carga de Ideas Rápidas y Triaje (BBDD_Ideas)
      let ideas = [];
      try {
        if (typeof IdeasService !== "undefined" && IdeasService.obtenerIdeas) {
          const resIdeas = IdeasService.obtenerIdeas();
          if (resIdeas && resIdeas.success && Array.isArray(resIdeas.ideas)) {
            ideas = resIdeas.ideas;
          }
        }
      } catch (errIdeas) {
        Logger.log("[DashboardService] Error cargando ideas: " + errIdeas.message);
      }

      // 9. Flujo de Caja: DEPRECADO. Toda la información de transacciones y cuotas reside en BBDD_Finanzas_Gastos.
      // Se retorna un arreglo vacío para mantener compatibilidad con el state sin divergencia.
      const flujoCaja = [];

      // 10. Planes de Cuotas (Compras a Plazos) - Consolidación Atómica en Memoria (Fase 4.11)
      // Agrupación y cálculo del resumen de planes exclusivamente desde los egresos de BBDD_Finanzas_Gastos
      const gruposCuotas = {};
      const ordenPlanes = [];

      for (let gIdx = 0; gIdx < gastos.length; gIdx++) {
        const g = gastos[gIdx];
        const idCuo = String(g.idCuota || g.ID_Cuota || "").trim();
        if (!idCuo) continue;

        if (!gruposCuotas[idCuo]) {
          gruposCuotas[idCuo] = [];
          ordenPlanes.push(idCuo);
        }
        gruposCuotas[idCuo].push(g);
      }

      const cuotas = [];
      for (let pIdx = 0; pIdx < ordenPlanes.length; pIdx++) {
        const idPlan = ordenPlanes[pIdx];
        const filasPlan = gruposCuotas[idPlan];
        if (!filasPlan || filasPlan.length === 0) continue;

        // Ordenar filas por fecha de gasto para secuenciar el plan
        filasPlan.sort((a, b) => {
          const fA = String(a.Fecha_Gasto || a.fechaGasto || "");
          const fB = String(b.Fecha_Gasto || b.fechaGasto || "");
          return fA.localeCompare(fB);
        });

        // Extraer nombre del plan y monto total a partir de descripción canónica
        // Formato canónico: "[Nombre Plan] (Total S/ X) - Cuota i/N"
        let nombrePlan = idPlan;
        let montoTotalCanónico = 0;
        let totalCuotasDetectadas = filasPlan.length;

        for (let f = 0; f < filasPlan.length; f++) {
          const desc = String(filasPlan[f].Descripcion || filasPlan[f].Descripcion_Gasto || filasPlan[f].Concepto || "").trim();
          if (desc) {
            const matchCanónico = desc.match(/^(.*?)\s*\(Total\s+S\/\s*([0-9.,]+)\)\s*-\s*Cuota\s+(\d+)\/(\d+)/i);
            if (matchCanónico) {
              nombrePlan = matchCanónico[1].trim();
              montoTotalCanónico = parseFloat(matchCanónico[2].replace(/,/g, "")) || 0;
              totalCuotasDetectadas = parseInt(matchCanónico[4], 10) || filasPlan.length;
              break;
            }
            const matchSimple = desc.match(/^(.*?)\s*-\s*Cuota\s+(\d+)\/(\d+)/i);
            if (matchSimple) {
              nombrePlan = matchSimple[1].trim();
              totalCuotasDetectadas = parseInt(matchSimple[3], 10) || filasPlan.length;
              break;
            }
          }
        }

        let cuotasPagadas = 0;
        let cuotasPendientes = 0;
        let montoPagadoAcumulado = 0.0;
        let sumaMontosTotal = 0.0;

        for (let f = 0; f < filasPlan.length; f++) {
          const item = filasPlan[f];
          const mPEN = parseFloat(item.Monto_PEN !== undefined ? item.Monto_PEN : (item.Monto_Original || 0)) || 0.0;
          sumaMontosTotal += mPEN;

          const estG = String(item.Estado_Pago || item.Estado || "").toLowerCase();
          const modG = String(item.Modalidad || "").toLowerCase();
          const esPagada = estG.includes("pagado") || estG.includes("ejecutado") || estG.includes("cobrado") || modG.includes("real");

          if (esPagada) {
            cuotasPagadas++;
            montoPagadoAcumulado += mPEN;
          } else {
            cuotasPendientes++;
          }
        }

        const montoTotalFinal = montoTotalCanónico > 0 ? montoTotalCanónico : Math.round(sumaMontosTotal * 100) / 100;
        const saldoRestante = Math.max(0, Math.round((montoTotalFinal - montoPagadoAcumulado) * 100) / 100);
        const primeraFila = filasPlan[0];
        const montoCuota = primeraFila ? (parseFloat(primeraFila.Monto_PEN) || parseFloat(primeraFila.Monto_Original) || 0) : 0;
        const fechaInicio = primeraFila ? String(primeraFila.Fecha_Gasto || primeraFila.fechaGasto || "") : "";
        const diaPago = fechaInicio ? (parseInt(fechaInicio.split("-")[2], 10) || 15) : 15;
        const estadoPlan = (cuotasPagadas >= totalCuotasDetectadas || saldoRestante <= 0) ? "COMPLETADO" : "ACTIVO";
        const categoriaPlan = primeraFila ? String(primeraFila.Categoria_Gasto || primeraFila.Categoria || "Deudas / Servicios Financieros") : "Deudas / Servicios Financieros";
        const metodoPagoPlan = primeraFila ? String(primeraFila.Metodo_Pago || "Transferencia_Bancaria") : "Transferencia_Bancaria";

        cuotas.push({
          ID_Cuota: idPlan,
          idCuota: idPlan,
          idPlan: idPlan,
          Nombre_Plan: nombrePlan,
          nombrePlan: nombrePlan,
          Descripcion: `${nombrePlan} (${totalCuotasDetectadas} cuotas)`,
          descripcion: `${nombrePlan} (${totalCuotasDetectadas} cuotas)`,
          Monto_Total: montoTotalFinal,
          montoTotal: montoTotalFinal,
          Cuota_Inicial: 0,
          cuotaInicial: 0,
          Num_Cuotas: totalCuotasDetectadas,
          numCuotas: totalCuotasDetectadas,
          Monto_Cuota: Math.round(montoCuota * 100) / 100,
          montoCuota: Math.round(montoCuota * 100) / 100,
          Tasa_Interes: 0,
          Tipo_Tasa: "SIN_INTERES",
          Fecha_Inicio: fechaInicio,
          fechaInicio: fechaInicio,
          Dia_Pago: diaPago,
          diaPago: diaPago,
          Cuotas_Pagadas: cuotasPagadas,
          cuotasPagadas: cuotasPagadas,
          Cuotas_Pendientes: cuotasPendientes,
          cuotasPendientes: cuotasPendientes,
          Monto_Pagado: Math.round(montoPagadoAcumulado * 100) / 100,
          montoPagado: Math.round(montoPagadoAcumulado * 100) / 100,
          Saldo_Pendiente: saldoRestante,
          saldoPendiente: saldoRestante,
          Estado: estadoPlan,
          estado: estadoPlan,
          Categoria: categoriaPlan,
          categoria: categoriaPlan,
          Metodo_Pago: metodoPagoPlan,
          metodoPago: metodoPagoPlan,
          Entidad_Financiera: "",
          Notas: "",
          Fecha_Creacion: fechaInicio
        });
      }

      // ========================================================================
      // JERARQUÍA CONTABLE ASCENDENTE (BOTTOM-UP): TAREAS -> HITOS -> PROYECTOS
      // ========================================================================
      const gastosPorTarea = {};
      const gastosDirectosHito = {};
      const gastosDirectosProy = {};

      for (let gIdx = 0; gIdx < gastos.length; gIdx++) {
        const g = gastos[gIdx];
        const estStr = String(g.Estado_Pago || g.Estado || "").toLowerCase();
        const isProgramado = g.Modalidad === "Programado / Proyectado" || estStr.includes("programado") || estStr.includes("pendiente");

        // Solo acumulan como costo real ejecutado las transacciones reales
        if (!isProgramado) {
          const mPen = parseFloat(g.Monto_PEN) || 0;
          let idTar = String(g.ID_Tarea || (String(g.ID_Origen_Vinculado || "").toUpperCase().startsWith("TAR-") ? g.ID_Origen_Vinculado : "")).trim().toUpperCase();
          let idHit = String(g.ID_Hito || "").trim().toUpperCase();
          let idProy = String(g.ID_Proyecto || "").trim().toUpperCase();

          if (idTar && (!idProy || !idHit) && mapaTareasPorId[idTar]) {
            const tObj = mapaTareasPorId[idTar];
            if (!idProy && tObj.ID_Proyecto) idProy = String(tObj.ID_Proyecto).trim().toUpperCase();
            if (!idHit && tObj.ID_Hito) idHit = String(tObj.ID_Hito).trim().toUpperCase();
          }

          if (idTar) {
            gastosPorTarea[idTar] = (gastosPorTarea[idTar] || 0) + mPen;
          } else if (idHit) {
            gastosDirectosHito[idHit] = (gastosDirectosHito[idHit] || 0) + mPen;
          } else if (idProy && idProy !== "PERSONAL") {
            gastosDirectosProy[idProy] = (gastosDirectosProy[idProy] || 0) + mPen;
          }
        }
      }

      // 1. Asignar costo real ejecutado a cada Tarea
      for (let tIdx = 0; tIdx < tareas.length; tIdx++) {
        const t = tareas[tIdx];
        const tIdUpper = String(t.ID_Tarea || "").trim().toUpperCase();
        t.Costo_Real_PEN = gastosPorTarea[tIdUpper] || 0;
      }

      // 2. Acumular en Cascada para cada Hito (Sumatoria de tareas del hito)
      const costoRealPorHito = {};
      for (let tIdx = 0; tIdx < tareas.length; tIdx++) {
        const t = tareas[tIdx];
        const hId = String(t.ID_Hito || t.idHito || t.id_hito || "").trim().toUpperCase();
        if (hId) {
          costoRealPorHito[hId] = (costoRealPorHito[hId] || 0) + (t.Costo_Real_PEN || 0);
        }
      }

      for (let hIdx = 0; hIdx < hitos.length; hIdx++) {
        const h = hitos[hIdx];
        const hIdUpper = String(h.ID_Hito || h.idHito || h.id_hito || "").trim().toUpperCase();
        const sumaTareasHito = costoRealPorHito[hIdUpper] || 0;
        const gastoDirecto = gastosDirectosHito[hIdUpper] || 0;
        const realHito = sumaTareasHito + gastoDirecto;
        const estHito = parseFloat(h.Costo_Estimado) || 0;

        h.Costo_Ejecutado_Real_PEN = realHito;
        h.Presupuesto_Estimado = estHito;
        h.Varianza_PEN = estHito - realHito;
        h.Pct_Consumido = estHito > 0 ? Math.round((realHito / estHito) * 100) : (realHito > 0 ? 100 : 0);
        h.Semaforo_Financiero = h.Pct_Consumido <= 80 ? "Verde" : (h.Pct_Consumido <= 100 ? "Ambar" : "Rojo");
      }

      // 3. Acumular en Cascada para cada Proyecto (Sumatoria de hitos y tareas directas)
      const costoRealPorProy = {};
      for (let hIdx = 0; hIdx < hitos.length; hIdx++) {
        const h = hitos[hIdx];
        const pId = String(h.ID_Proyecto || h.idProyecto || h.id_proyecto || "").trim().toUpperCase();
        if (pId) {
          costoRealPorProy[pId] = (costoRealPorProy[pId] || 0) + (h.Costo_Ejecutado_Real_PEN || 0);
        }
      }
      // Tareas asignadas directamente al proyecto sin hito
      for (let tIdx = 0; tIdx < tareas.length; tIdx++) {
        const t = tareas[tIdx];
        const pId = String(t.ID_Proyecto || t.idProyecto || t.id_proyecto || "").trim().toUpperCase();
        const hId = String(t.ID_Hito || t.idHito || t.id_hito || "").trim();
        if (pId && !hId) {
          costoRealPorProy[pId] = (costoRealPorProy[pId] || 0) + (t.Costo_Real_PEN || 0);
        }
      }

      for (let pIdx = 0; pIdx < proyectos.length; pIdx++) {
        const p = proyectos[pIdx];
        const pIdUpper = String(p.ID_Proyecto || "").trim().toUpperCase();
        const sumaCascadeProy = (costoRealPorProy[pIdUpper] || 0) + (gastosDirectosProy[pIdUpper] || 0);

        if (sumaCascadeProy > 0 || !p.Costo_Ejecutado_Real_PEN) {
          p.Costo_Ejecutado_Real_PEN = sumaCascadeProy;
        }
        const tope = parseFloat(p.Presupuesto_Tope) || 0;
        const real = parseFloat(p.Costo_Ejecutado_Real_PEN) || 0;
        p.Varianza_PEN = tope - real;
        p.Pct_Consumido = tope > 0 ? Math.round((real / tope) * 100) : (real > 0 ? 100 : 0);
        p.Semaforo_Financiero = p.Pct_Consumido <= 80 ? "Verde" : (p.Pct_Consumido <= 100 ? "Ambar" : "Rojo");
      }

      // 4. Consolidación de Inversión en Bienestar por Dimensión de Hábitos (Life OS)
      const inversionBienestarPorCategoria = {
        SALUD_DEPORTE: 0.0,
        DESARROLLO_ESTUDIO: 0.0,
        LABORAL_HONORARIO: 0.0,
        FINANZAS_TRAMITES: 0.0,
        SOCIAL_FAMILIA: 0.0,
        PERSONAL_DESCANSO: 0.0
      };

      const mapaActividadCategoria = {};
      for (let aIdx = 0; aIdx < actividadesPersonales.length; aIdx++) {
        const act = actividadesPersonales[aIdx];
        const aIdUpper = String(act.ID_Actividad || "").trim().toUpperCase();
        const catNorm = (typeof CONFIG !== "undefined" && CONFIG.normalizarCategoriaVida)
          ? CONFIG.normalizarCategoriaVida(act.Categoria_Vida)
          : String(act.Categoria_Vida || "SALUD_DEPORTE").trim().toUpperCase();
        mapaActividadCategoria[aIdUpper] = catNorm;
      }

      const actividadesConGastoContabilizado = {};
      for (let gIdx = 0; gIdx < gastos.length; gIdx++) {
        const g = gastos[gIdx];
        const gTarUpper = String(g.ID_Tarea || g.ID_Entidad_Vinculada || "").trim().toUpperCase();
        if (gTarUpper && mapaActividadCategoria[gTarUpper]) {
          const cat = mapaActividadCategoria[gTarUpper];
          const mPen = parseFloat(g.Monto_PEN || g.Monto_Original || 0.0);
          if (inversionBienestarPorCategoria[cat] !== undefined) {
            inversionBienestarPorCategoria[cat] += mPen;
          }
          actividadesConGastoContabilizado[gTarUpper] = true;
        }
      }

      for (let aIdx = 0; aIdx < actividadesPersonales.length; aIdx++) {
        const act = actividadesPersonales[aIdx];
        const aIdUpper = String(act.ID_Actividad || "").trim().toUpperCase();
        if (!actividadesConGastoContabilizado[aIdUpper]) {
          const mDirecto = parseFloat(act.Monto_Gasto_Asociado) || 0.0;
          if (mDirecto > 0) {
            const cat = mapaActividadCategoria[aIdUpper] || "SALUD_DEPORTE";
            if (inversionBienestarPorCategoria[cat] !== undefined) {
              inversionBienestarPorCategoria[cat] += mDirecto;
            }
          }
        }
      }

      // Telemetría de Alertas y Auditoría de Carga Operativa
      let telemetriaCarga = { alertaSobrecarga: false, conteoHeavy: 0, conteoMedium: 0, mensajeAlerta: "Carga de proyectos dentro del umbral operativo." };
      try {
        if (typeof ProyectosService !== "undefined" && ProyectosService.auditarCargaProyectosActivos) {
          telemetriaCarga = ProyectosService.auditarCargaProyectosActivos(proyectos);
        } else if (typeof auditarCargaProyectosActivos === "function") {
          telemetriaCarga = auditarCargaProyectosActivos(proyectos);
        }
      } catch (errTelemetria) {
        Logger.log("[DashboardService] Error evaluando telemetriaCarga: " + errTelemetria.message);
      }

      // Métricas Consolidadas de Cash Flow Neto (Fase 4.10)
      let totalIngresosCobradosPEN = 0.0;
      let totalIngresosPendientesPEN = 0.0;
      for (let iIdx = 0; iIdx < ingresos.length; iIdx++) {
        const ingItem = ingresos[iIdx];
        const mPEN = parseFloat(ingItem.Monto_PEN || 0.0);
        if (ingItem.Conciliado || (ingItem.Estado_Cobro && (ingItem.Estado_Cobro.toLowerCase() === "cobrado" || ingItem.Estado_Cobro.toLowerCase() === "ejecutado" || ingItem.Estado_Cobro.toLowerCase() === "real / ejecutado"))) {
          totalIngresosCobradosPEN += mPEN;
        } else {
          totalIngresosPendientesPEN += mPEN;
        }
      }

      let totalGastosPagadosPEN = 0.0;
      let totalGastosPendientesPEN = 0.0;
      for (let gIdx = 0; gIdx < gastos.length; gIdx++) {
        const gstItem = gastos[gIdx];
        const mPEN = parseFloat(gstItem.Monto_PEN || 0.0);
        const estG = String(gstItem.Estado_Pago || gstItem.Estado || "").toLowerCase();
        if (estG === "pagado" || estG === "conciliado" || estG === "real / ejecutado" || estG === "ejecutado") {
          totalGastosPagadosPEN += mPEN;
        } else {
          totalGastosPendientesPEN += mPEN;
        }
      }

      const flujoNetoPEN = totalIngresosCobradosPEN - totalGastosPagadosPEN;
      const flujoNetoProyectadoPEN = (totalIngresosCobradosPEN + totalIngresosPendientesPEN) - (totalGastosPagadosPEN + totalGastosPendientesPEN);

      const cashFlowNeto = {
        totalIngresosCobradosPEN: Math.round(totalIngresosCobradosPEN * 100) / 100,
        totalIngresosPendientesPEN: Math.round(totalIngresosPendientesPEN * 100) / 100,
        totalGastosPagadosPEN: Math.round(totalGastosPagadosPEN * 100) / 100,
        totalGastosPendientesPEN: Math.round(totalGastosPendientesPEN * 100) / 100,
        flujoNetoPEN: Math.round(flujoNetoPEN * 100) / 100,
        flujoNetoProyectadoPEN: Math.round(flujoNetoProyectadoPEN * 100) / 100
      };

      const respuestaFinal = {
        success: true,
        proyectos: proyectos,
        hitos: hitos,
        tareas: tareas,
        gastos: gastos,
        actividades: actividadesPersonales,
        actividadesPersonales: actividadesPersonales,
        ingresos: ingresos,
        subtareas: subtareas,
        notas: notas,
        ideas: ideas,
        flujoCaja: flujoCaja,
        cuotas: cuotas,
        cashFlowNeto: cashFlowNeto,
        resumenFinanciero: cashFlowNeto,
        inversionBienestar: inversionBienestarPorCategoria,
        telemetriaCarga: telemetriaCarga
      };

      // Guardar en caché por 180 segundos (3 minutos para permitir reflejo rápido de ediciones directas en Sheets)
      try {
        cache.put("DASHBOARD_DATA_CACHE", JSON.stringify(respuestaFinal), 180);
      } catch (cacheErr) {
        Logger.log("[Cache put warning]: " + cacheErr.message);
      }

      return respuestaFinal;
    } catch (errData) {
      Logger.log("[getDashboardData Error]: " + errData.message);
      return { success: false, error: errData.message };
    }
  },

  /**
   * Invalida y purga todas las entradas de caché del dashboard y módulos relacionados
   * @returns {Object} { success: boolean, timestamp: string }
   */
  invalidarCache: function () {
    try {
      const cache = CacheService.getScriptCache();
      cache.removeAll([
        "DASHBOARD_DATA_CACHE",
        "NOTAS_DATA_CACHE",
        "DASHBOARD_CACHE",
        "PORTAFOLIO_DATA_CACHE",
        "KANBAN_DATA_CACHE"
      ]);
      return { success: true, timestamp: new Date().toISOString() };
    } catch (e) {
      Logger.log("[DashboardService.invalidarCache Error]: " + e.message);
      return { success: false, error: e.message };
    }
  }
};
