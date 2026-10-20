/**
 * ============================================================================
 * ARCHIVO: FinanzasService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Gestión de Gastos, Ingresos, Tipo de Cambio y Liquidaciones
 * ============================================================================
 */

const FinanzasService = {

  /**
   * Mapeo dinámico de columnas para BBDD_Finanzas_Gastos.
   * Lee la fila 1 de encabezados para indexar O(1) cada campo mediante diccionario,
   * garantizando inmunidad total ante inserciones o desplazamientos físicos de columnas.
   */
  obtenerMapaColumnasGastos: function (sheet) {
    if (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaGastos) {
      return CONFIG.obtenerMapaGastos(sheet);
    }
    const colMap = Object.assign({}, CONFIG.COLS_FINANZAS);
    if (!sheet) return colMap;
    return (CONFIG.construirMapaColumnas)
      ? CONFIG.construirMapaColumnas(sheet, CONFIG.COLS_FINANZAS, CONFIG.ALIASES_FINANZAS || {})
      : colMap;
  },

  /**
   * Mapeo dinámico de columnas para BBDD_Finanzas_Ingresos.
   */
  obtenerMapaColumnasIngresos: function (sheet) {
    if (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaIngresos) {
      return CONFIG.obtenerMapaIngresos(sheet);
    }
    const colMap = Object.assign({}, CONFIG.COLS_INGRESOS);
    if (!sheet) return colMap;
    return (CONFIG.construirMapaColumnas)
      ? CONFIG.construirMapaColumnas(sheet, CONFIG.COLS_INGRESOS, CONFIG.ALIASES_INGRESOS || {})
      : colMap;
  },

  obtenerHojaGastos: function (ss) {
    if (typeof CONFIG !== "undefined" && CONFIG.obtenerHojaGastos) {
      return CONFIG.obtenerHojaGastos(ss);
    }
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(CONFIG.SHEETS.FINANZAS) || ss.getSheetByName("BBDD_Gastos") || ss.getSheetByName("Gastos");
  },

  obtenerHojaIngresos: function (ss) {
    if (typeof CONFIG !== "undefined" && CONFIG.obtenerHojaIngresos) {
      return CONFIG.obtenerHojaIngresos(ss);
    }
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(CONFIG.SHEETS.INGRESOS) || ss.getSheetByName("BBDD_Ingresos") || ss.getSheetByName("Ingresos");
  },

  createGasto: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const idGasto = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdGasto)
      ? CorrelativoService.generarIdGasto()
      : "GAS-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");

    const sheet = FinanzasService.obtenerHojaGastos(ss);
    if (!sheet) return { success: false, error: "Hoja de gastos (BBDD_Finanzas_Gastos / BBDD_Gastos) no encontrada" };

    const colMap = FinanzasService.obtenerMapaColumnasGastos(sheet);

    const fechaGasto = payload.fechaGasto || payload.fecha || payload.fechaRegistro || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    const moneda = (payload.monedaOriginal || payload.moneda || "PEN").toUpperCase();
    const mOrig = parseFloat(payload.montoOriginal !== undefined ? payload.montoOriginal : payload.monto) || 0.0;
    let tc = (moneda === "PEN") ? 1.0 : (parseFloat(payload.tipoCambio) || 0.0);
    if (moneda !== "PEN" && tc <= 1.0) {
      const tcRes = FinanzasService.obtenerTipoCambio({ fecha: fechaGasto });
      const tcData = tcRes && tcRes.data ? tcRes.data : { usd: 3.76, eur: 4.12 };
      tc = (moneda === "EUR") ? (tcData.eur || 4.12) : (tcData.usd || 3.76);
    }
    if (tc <= 0) tc = 1.0;
    const mPen = (moneda === "PEN") ? mOrig : (mOrig * tc);
    const mUsd = (moneda === "USD") ? mOrig : (tc > 0 ? (mPen / (moneda === "EUR" ? (tc / 1.09) : tc)) : 0.0);

    const esProgramado = (payload.esProgramado === true || payload.esProgramado === "true" || payload.modoRegistro === "PROGRAMADO" || (payload.estadoPago && String(payload.estadoPago).toLowerCase().includes("programado")) || (payload.estado && String(payload.estado).toLowerCase().includes("programado")));
    const estadoPago = esProgramado ? "Pendiente / Programado" : (payload.estadoPago || payload.estado || "Pagado").trim();
    const modalidad = payload.modalidad || (esProgramado ? "Programado / Proyectado" : "Real / Ejecutado");

    const idProyecto = String(payload.idProyecto || payload.ID_Proyecto || "").trim();
    const idHito = String(payload.idHito || payload.ID_Hito || "").trim();
    const idTarea = String(payload.idTarea || payload.ID_Tarea || "").trim();
    const idActividad = String(payload.idActividad || payload.ID_Actividad || "").trim();
    let idEntidadVinculada = String(payload.idOrigenVinculado || payload.ID_Origen_Vinculado || payload.idEntidadVinculada || payload.ID_Entidad_Vinculada || idTarea || idActividad || "").trim();

    // Inferencia de Tipo_Origen y ID_Origen_Vinculado (14 Columnas Canónicas: Fase 4.9)
    let tipoOrigenRaw = String(payload.tipoOrigen || payload.Tipo_Origen || payload.clasificacionOrigen || payload.Clasificacion_Origen || payload.tipoGasto || payload.Tipo_Gasto || "").trim().toUpperCase().replace(/[\s-]/g, "_");

    let tipoOrigen = "LIBRE_CORRIENTE";
    let idOrigenVinculado = "NINGUNO";

    if (tipoOrigenRaw === "LIBRE_CORRIENTE" || (!idEntidadVinculada && !idTarea && !idActividad && !idProyecto)) {
      tipoOrigen = "LIBRE_CORRIENTE";
      idOrigenVinculado = "NINGUNO";
    } else if (tipoOrigenRaw === "TAREA_PROYECTO" || (idTarea && idTarea.toUpperCase().startsWith("TAR-")) || (idEntidadVinculada && idEntidadVinculada.toUpperCase().startsWith("TAR-"))) {
      tipoOrigen = "TAREA_PROYECTO";
      idOrigenVinculado = idTarea || idEntidadVinculada;
    } else if (tipoOrigenRaw === "ACTIVIDAD_PERSONAL" || (idActividad && idActividad.toUpperCase().startsWith("ACT-")) || (idEntidadVinculada && idEntidadVinculada.toUpperCase().startsWith("ACT-"))) {
      tipoOrigen = "ACTIVIDAD_PERSONAL";
      idOrigenVinculado = idActividad || idEntidadVinculada;
    } else if (tipoOrigenRaw.includes("PROY")) {
      tipoOrigen = "TAREA_PROYECTO";
      idOrigenVinculado = idTarea || idEntidadVinculada || "NINGUNO";
    } else if (tipoOrigenRaw.includes("PERS") || tipoOrigenRaw.includes("HABIT")) {
      tipoOrigen = "ACTIVIDAD_PERSONAL";
      idOrigenVinculado = idActividad || idEntidadVinculada || "NINGUNO";
    } else {
      tipoOrigen = "LIBRE_CORRIENTE";
      idOrigenVinculado = idEntidadVinculada || "NINGUNO";
    }

    const tipoGasto = tipoOrigen === "TAREA_PROYECTO" ? "Tarea Proyecto" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Actividad Personal" : "Gasto Libre");
    const concepto = String(payload.concepto || payload.descripcionGasto || payload.descripcion || "").trim();
    const categoria = String(payload.categoriaGasto || payload.categoria || "Materiales").trim();
    const metodoPago = String(payload.metodoPago || (tipoOrigen === "TAREA_PROYECTO" ? "Transferencia_Bancaria" : "Efectivo")).trim();
    const comprobanteUrl = String(payload.comprobanteUrl || payload.Comprobante_URL || "").trim();
    const idCuota = String(payload.idCuota || payload.ID_Cuota || "").trim();

    // Gobernanza: Si el gasto está Pendiente/Programado, crear Google Task antes de escribir
    let taskId = "";
    if (estadoPago !== "Pagado") {
      try {
        if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.crearTaskGastoCuota) {
          const taskRes = GoogleTasksService.crearTaskGastoCuota({
            descripcion: concepto || "Gasto",
            moneda: moneda,
            monto: mOrig,
            fechaLimite: fechaGasto,
            notas: "ID: " + idGasto + "\n" + categoria + "\nOrigen: " + tipoGasto + (idOrigenVinculado !== "NINGUNO" ? ("\nVinculado a: " + idOrigenVinculado) : "")
          });
          if (taskRes && taskRes.taskId) taskId = taskRes.taskId;
        }
      } catch (eTask) {
        Logger.log("[createGasto GoogleTask Error]: " + eTask.message);
      }
    }

    const totalCols = Math.max(sheet.getLastColumn(), 14, (colMap.MAX_COLUMNS || 14));
    const newRow = new Array(totalCols).fill("");

    const setSiExiste = (key, val) => {
      if (colMap[key] !== undefined && colMap[key] >= 0 && colMap[key] < totalCols) {
        newRow[colMap[key]] = val;
      }
    };

    // 1. Campos Identificadores y Jerarquía Canónica (14 Columnas)
    setSiExiste("ID_GASTO", idGasto);
    if (colMap.ID_TRANSACCION !== undefined && colMap.ID_TRANSACCION !== colMap.ID_GASTO) setSiExiste("ID_TRANSACCION", idGasto);
    if (colMap.TIPO_GASTO !== undefined && colMap.TIPO_GASTO !== colMap.TIPO_ORIGEN) setSiExiste("TIPO_GASTO", tipoGasto);
    setSiExiste("TIPO_ORIGEN", tipoOrigen);
    if (colMap.CLASIFICACION_ORIGEN !== undefined && colMap.CLASIFICACION_ORIGEN !== colMap.TIPO_ORIGEN) setSiExiste("CLASIFICACION_ORIGEN", tipoOrigen);
    if (colMap.ID_TAREA !== undefined && colMap.ID_TAREA !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_TAREA", idOrigenVinculado.startsWith("TAR-") ? idOrigenVinculado : "");
    if (colMap.ID_ACTIVIDAD !== undefined && colMap.ID_ACTIVIDAD !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_ACTIVIDAD", idOrigenVinculado.startsWith("ACT-") ? idOrigenVinculado : "");
    setSiExiste("ID_ORIGEN_VINCULADO", idOrigenVinculado);
    if (colMap.ID_ENTIDAD_VINCULADA !== undefined && colMap.ID_ENTIDAD_VINCULADA !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_ENTIDAD_VINCULADA", idOrigenVinculado);
    setSiExiste("ID_CUOTA", idCuota);

    // 2. Fechas, Conceptos y Categorización
    setSiExiste("FECHA_GASTO", fechaGasto);
    setSiExiste("FECHA_REGISTRO", fechaGasto);
    setSiExiste("FECHA_COMPROMISO", fechaGasto);
    setSiExiste("DESCRIPCION_GASTO", concepto);
    setSiExiste("DESCRIPCION", concepto);
    setSiExiste("CONCEPTO", concepto);
    setSiExiste("CATEGORIA_GASTO", categoria);
    setSiExiste("CATEGORIA", categoria);

    // 3. Sistema Multi-Divisa con Base en Soles (PEN) persistido en memoria
    setSiExiste("MONEDA_ORIGINAL", moneda);
    setSiExiste("MONTO_ORIGINAL", mOrig);
    setSiExiste("MONTO", mOrig);
    setSiExiste("TIPO_CAMBIO", tc);
    setSiExiste("MONTO_PEN", mPen);
    setSiExiste("MONTO_MONEDA_BASE", mPen);
    setSiExiste("MONTO_USD", mUsd);

    // 4. Modalidad, Estados y Complementarios
    setSiExiste("METODO_PAGO", metodoPago);
    setSiExiste("ESTADO_PAGO", estadoPago);
    if (colMap.ESTADO !== undefined && colMap.ESTADO !== colMap.ESTADO_PAGO) setSiExiste("ESTADO", estadoPago);
    if (colMap.MODALIDAD !== undefined && colMap.MODALIDAD !== colMap.ESTADO_PAGO) setSiExiste("MODALIDAD", modalidad);
    setSiExiste("COMPROBANTE_URL", comprobanteUrl);
    setSiExiste("ID_GOOGLE_TASK", taskId);
    setSiExiste("ID_PROYECTO", idProyecto);
    setSiExiste("ID_HITO", idHito);

    sheet.appendRow(newRow);
    const newRowNum = sheet.getLastRow();

    // Sincronizar Google Calendar si es programado
    let eventId = "";
    if (esProgramado && payload.agendarCalendar !== false) {
      try {
        if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaGasto) {
          const calRes = CalendarService.sincronizarFilaGasto(newRowNum, {
            idGasto: idGasto,
            descripcionGasto: concepto,
            categoriaGasto: categoria,
            fechaGasto: fechaGasto,
            montoPen: mPen,
            estadoPago: estadoPago
          });
          if (calRes && calRes.eventId) {
            eventId = calRes.eventId;
            if (colMap.ID_EVENTO_CALENDAR !== undefined) {
              sheet.getRange(newRowNum, colMap.ID_EVENTO_CALENDAR + 1).setValue(eventId);
            }
            if (colMap.ID_GOOGLE_EVENT !== undefined && colMap.ID_GOOGLE_EVENT !== colMap.ID_EVENTO_CALENDAR) {
              sheet.getRange(newRowNum, colMap.ID_GOOGLE_EVENT + 1).setValue(eventId);
            }
          }
        }
      } catch (eCal) {
        Logger.log("[createGasto Calendar Error]: " + eCal.message);
      }
    }

    invalidarCacheDashboard();

    return {
      success: true,
      idGasto: idGasto,
      idTransaccion: idGasto,
      tipoOrigen: tipoOrigen,
      Tipo_Origen: tipoOrigen,
      idOrigenVinculado: idOrigenVinculado,
      ID_Origen_Vinculado: idOrigenVinculado,
      clasificacionOrigen: tipoOrigen,
      tipoEntidad: tipoOrigen === "TAREA_PROYECTO" ? "Tarea" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Actividad Personal" : "Gasto Libre"),
      idEntidadVinculada: idOrigenVinculado,
      tipoGasto: tipoGasto,
      concepto: concepto,
      montoOriginal: mOrig,
      monedaOriginal: moneda,
      montoPEN: mPen,
      montoMonedaBase: mPen,
      modalidad: modalidad,
      comprobanteUrl: comprobanteUrl,
      idCuota: idCuota,
      taskId: taskId,
      eventId: eventId,
      esProgramado: esProgramado
    };
  },

// ------ Blindaje de Montos: al actualizar campos monetarios se recalculan y persisten MONTO_PEN y MONTO_USD directamente para evitar #SPILL! ------
  updateGasto: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = FinanzasService.obtenerHojaGastos(ss);
      if (!sheet) return { success: false, error: "Hoja de finanzas/gastos no encontrada" };

      const colMap = FinanzasService.obtenerMapaColumnasGastos(sheet);
      const data = sheet.getDataRange().getValues();
      const idBuscado = String(payload.idGasto || payload.ID_Gasto || payload.idTransaccion || payload.ID_Transaccion || "").trim().toUpperCase();
      if (!idBuscado) return { success: false, error: "ID de gasto no especificado" };

      let rowIdx = -1;
      const colIdGasto = colMap.ID_GASTO !== undefined ? colMap.ID_GASTO : (colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : 0);
      const colIdTrx = colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : colIdGasto;

      for (let i = 1; i < data.length; i++) {
        const valG = String(data[i][colIdGasto] || "").trim().toUpperCase();
        const valT = String(data[i][colIdTrx] || "").trim().toUpperCase();
        if (valG === idBuscado || valT === idBuscado) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) return { success: false, error: "Gasto no encontrado: " + idBuscado };

      // Clonar la fila en memoria para mutación atómica (patrón batch)
      const totalCols = data[rowIdx - 1].length;
      const filaActualizada = data[rowIdx - 1].slice();
      let taskId = (colMap.ID_GOOGLE_TASK !== undefined) ? String(filaActualizada[colMap.ID_GOOGLE_TASK] || "").trim() : "";

      // Helper de mutación en memoria (sin tocar la hoja hasta el commit final)
      const setEnFila = (key, val) => {
        if (colMap[key] !== undefined && colMap[key] >= 0 && colMap[key] < totalCols) {
          filaActualizada[colMap[key]] = val;
        }
      };

      // Actualización de Concepto / Descripción
      if (payload.descripcionGasto !== undefined || payload.descripcion !== undefined || payload.concepto !== undefined) {
        const descVal = payload.concepto !== undefined ? payload.concepto : (payload.descripcionGasto !== undefined ? payload.descripcionGasto : payload.descripcion);
        setEnFila("DESCRIPCION", descVal);
        setEnFila("DESCRIPCION_GASTO", descVal);
        setEnFila("CONCEPTO", descVal);
      }

      // Actualización de Categoría
      if (payload.categoriaGasto !== undefined || payload.categoria !== undefined) {
        const catVal = payload.categoriaGasto !== undefined ? payload.categoriaGasto : payload.categoria;
        setEnFila("CATEGORIA", catVal);
        setEnFila("CATEGORIA_GASTO", catVal);
      }

      // Actualización Multi-Divisa y Montos
      const colMOrig = colMap.MONTO_ORIGINAL !== undefined ? colMap.MONTO_ORIGINAL : (colMap.MONTO !== undefined ? colMap.MONTO : -1);
      let mOrig = (colMOrig >= 0) ? (parseFloat(filaActualizada[colMOrig]) || 0.0) : 0.0;
      let tc = (colMap.TIPO_CAMBIO !== undefined && colMap.TIPO_CAMBIO >= 0) ? (parseFloat(filaActualizada[colMap.TIPO_CAMBIO]) || 1.0) : 1.0;
      const colMon = colMap.MONEDA_ORIGINAL !== undefined ? colMap.MONEDA_ORIGINAL : -1;
      let mon = (colMon >= 0) ? String(filaActualizada[colMon] || "PEN").toUpperCase() : "PEN";

      if (payload.monedaOriginal !== undefined || payload.moneda !== undefined) {
        mon = String(payload.monedaOriginal || payload.moneda).toUpperCase();
        setEnFila("MONEDA_ORIGINAL", mon);
      }
      if (payload.montoOriginal !== undefined || payload.monto !== undefined) {
        mOrig = parseFloat(payload.montoOriginal !== undefined ? payload.montoOriginal : payload.monto) || 0.0;
        setEnFila("MONTO_ORIGINAL", mOrig);
        setEnFila("MONTO", mOrig);
      }
      if (payload.tipoCambio !== undefined) {
        tc = parseFloat(payload.tipoCambio) || 1.0;
        setEnFila("TIPO_CAMBIO", tc);
      }

      // Recalcular MONTO_PEN y MONTO_USD sin sobreescribir columnas calculadas por Sheets
      const mPen = (mon === "PEN") ? mOrig : (mOrig * tc);
      const mUsd = (mon === "USD") ? mOrig : (tc > 0 ? (mPen / (mon === "EUR" ? (tc / 1.09) : tc)) : 0.0);
      setEnFila("MONTO_PEN", mPen);
      setEnFila("MONTO_MONEDA_BASE", mPen);
      setEnFila("MONTO_USD", mUsd);

      // Fechas
      if (payload.fechaGasto !== undefined || payload.fecha !== undefined || payload.fechaRegistro !== undefined) {
        const fVal = payload.fechaGasto || payload.fecha || payload.fechaRegistro;
        setEnFila("FECHA_GASTO", fVal);
        setEnFila("FECHA_REGISTRO", fVal);
        setEnFila("FECHA_COMPROMISO", fVal);
      }

      // Entidades Vinculadas y Jerarquía (Soporte de Gastos Libres y Vinculación Posterior: Fase 4.9)
      if (payload.desvincular === true || payload.idOrigenVinculado === "NINGUNO" || payload.idEntidadVinculada === "NINGUNO" || payload.tipoOrigen === "LIBRE_CORRIENTE") {
        if (colMap.TIPO_GASTO !== undefined && colMap.TIPO_GASTO !== colMap.TIPO_ORIGEN) setEnFila("TIPO_GASTO", "Gasto Libre");
        setEnFila("TIPO_ORIGEN", "LIBRE_CORRIENTE");
        if (colMap.CLASIFICACION_ORIGEN !== undefined && colMap.CLASIFICACION_ORIGEN !== colMap.TIPO_ORIGEN) setEnFila("CLASIFICACION_ORIGEN", "LIBRE_CORRIENTE");
        if (colMap.ID_TAREA !== undefined && colMap.ID_TAREA !== colMap.ID_ORIGEN_VINCULADO) setEnFila("ID_TAREA", "");
        if (colMap.ID_ACTIVIDAD !== undefined && colMap.ID_ACTIVIDAD !== colMap.ID_ORIGEN_VINCULADO) setEnFila("ID_ACTIVIDAD", "");
        setEnFila("ID_ORIGEN_VINCULADO", "NINGUNO");
        if (colMap.ID_ENTIDAD_VINCULADA !== undefined && colMap.ID_ENTIDAD_VINCULADA !== colMap.ID_ORIGEN_VINCULADO) setEnFila("ID_ENTIDAD_VINCULADA", "NINGUNO");
        setEnFila("ID_PROYECTO", "PERSONAL");
        setEnFila("ID_HITO", "");
      } else {
        if (payload.tipoOrigen !== undefined || payload.Tipo_Origen !== undefined) {
          const tOrg = String(payload.tipoOrigen || payload.Tipo_Origen).trim();
          setEnFila("TIPO_ORIGEN", tOrg);
          setEnFila("CLASIFICACION_ORIGEN", tOrg);
        }
        if (payload.idOrigenVinculado !== undefined || payload.ID_Origen_Vinculado !== undefined) {
          const iov = String(payload.idOrigenVinculado || payload.ID_Origen_Vinculado).trim();
          setEnFila("ID_ORIGEN_VINCULADO", iov);
          setEnFila("ID_ENTIDAD_VINCULADA", iov);
          if (iov.startsWith("TAR-")) {
            setEnFila("ID_TAREA", iov);
            setEnFila("TIPO_ORIGEN", "TAREA_PROYECTO");
          } else if (iov.startsWith("ACT-")) {
            setEnFila("ID_ACTIVIDAD", iov);
            setEnFila("TIPO_ORIGEN", "ACTIVIDAD_PERSONAL");
          }
        }
        if (payload.idTarea !== undefined) {
          const tId = String(payload.idTarea).trim();
          if (tId) {
            setEnFila("ID_ORIGEN_VINCULADO", tId);
            setEnFila("ID_ENTIDAD_VINCULADA", tId);
            setEnFila("ID_TAREA", tId);
            setEnFila("TIPO_ORIGEN", "TAREA_PROYECTO");
            setEnFila("CLASIFICACION_ORIGEN", "Proyecto");
          }
        }
        if (payload.idActividad !== undefined) {
          const aId = String(payload.idActividad).trim();
          if (aId) {
            setEnFila("ID_ORIGEN_VINCULADO", aId);
            setEnFila("ID_ENTIDAD_VINCULADA", aId);
            setEnFila("ID_ACTIVIDAD", aId);
            setEnFila("TIPO_ORIGEN", "ACTIVIDAD_PERSONAL");
            setEnFila("CLASIFICACION_ORIGEN", "Personal");
          }
        }
      }

      if (payload.idProyecto !== undefined) setEnFila("ID_PROYECTO", payload.idProyecto);
      if (payload.idHito !== undefined) setEnFila("ID_HITO", payload.idHito);
      if (payload.idCuota !== undefined || payload.ID_Cuota !== undefined) {
        setEnFila("ID_CUOTA", String(payload.idCuota || payload.ID_Cuota).trim());
      }
      if (payload.tipoEntidad !== undefined) setEnFila("TIPO_ENTIDAD", payload.tipoEntidad);
      if (payload.modalidad !== undefined) setEnFila("MODALIDAD", payload.modalidad);

      // Tipo_Gasto
      if ((payload.tipoGasto !== undefined || payload.Tipo_Gasto !== undefined) && !payload.desvincular && payload.tipoOrigen !== "LIBRE_CORRIENTE") {
        if (colMap.TIPO_GASTO !== undefined && colMap.TIPO_GASTO !== colMap.TIPO_ORIGEN) {
          const tNorm = String(payload.tipoGasto || payload.Tipo_Gasto).trim().toLowerCase();
          const tgVal = (tNorm.includes("proyec") || tNorm.includes("tarea")) ? "Tarea Proyecto" : (tNorm.includes("libre") ? "Gasto Libre" : "Actividad Personal");
          setEnFila("TIPO_GASTO", tgVal);
          if (colMap.CLASIFICACION_ORIGEN !== undefined && colMap.CLASIFICACION_ORIGEN !== colMap.TIPO_ORIGEN) {
            setEnFila("CLASIFICACION_ORIGEN", tgVal === "Tarea Proyecto" ? "Proyecto" : (tgVal === "Gasto Libre" ? "LIBRE_CORRIENTE" : "Personal"));
          }
        }
      }

      if (payload.metodoPago !== undefined) setEnFila("METODO_PAGO", payload.metodoPago);
      if (payload.comprobanteUrl !== undefined || payload.Comprobante_URL !== undefined) {
        setEnFila("COMPROBANTE_URL", String(payload.comprobanteUrl || payload.Comprobante_URL).trim());
      }

      // Estado de Pago y Conciliación
      let nuevoEstadoPago = null;
      if (payload.estadoPago !== undefined || payload.estado !== undefined) {
        nuevoEstadoPago = String(payload.estadoPago !== undefined ? payload.estadoPago : payload.estado).trim();
        setEnFila("ESTADO_PAGO", nuevoEstadoPago);
        setEnFila("ESTADO", nuevoEstadoPago);
      }

      // --- COMMIT ATÓMICO: escritura de toda la fila en una sola llamada batch ---
      sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada]);

      // Actualizar Google Task tras el commit (efecto secundario fuera de la hoja)
      if (nuevoEstadoPago === "Pagado" && taskId) {
        try {
          if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.actualizarTask) {
            GoogleTasksService.actualizarTask({ taskId: taskId, completada: true });
          }
        } catch (eTask) {
          Logger.log("[updateGasto Task Update Error]: " + eTask.message);
        }
      }

      invalidarCacheDashboard();
      return { success: true, idGasto: idBuscado, idTransaccion: idBuscado };
    } catch (err) {
      Logger.log("[updateGasto Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  desvincularGasto: function (payload) {
    const idGasto = String(payload.idGasto || payload.ID_Gasto || payload.idTransaccion || payload.ID_Transaccion || "").trim().toUpperCase();
    if (!idGasto) return { success: false, error: "ID de gasto requerido para desvincular" };

    return FinanzasService.updateGasto({
      idGasto: idGasto,
      desvincular: true,
      tipoOrigen: "LIBRE_CORRIENTE",
      idOrigenVinculado: "NINGUNO",
      idTarea: "",
      idEntidadVinculada: "NINGUNO",
      tipoEntidad: "Gasto Libre",
      idProyecto: "PERSONAL",
      idHito: "",
      tipoGasto: "Gasto Libre",
      clasificacionOrigen: "LIBRE_CORRIENTE"
    });
  },

  deleteGasto: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = FinanzasService.obtenerHojaGastos(ss);
      if (!sheet) return { success: false, error: "Hoja de finanzas/gastos no encontrada" };

      const colMap = FinanzasService.obtenerMapaColumnasGastos(sheet);
      const idGasto = String(payload.idGasto || payload.ID_Gasto || payload.idTransaccion || payload.ID_Transaccion || "").trim().toUpperCase();
      if (!idGasto) return { success: false, error: "ID_Gasto requerido para eliminar" };

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: false, error: "No hay gastos registrados" };

      const lastCol = sheet.getLastColumn();
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      let taskId = "";
      let gastoExiste = false;

      const colIdGasto = colMap.ID_GASTO !== undefined ? colMap.ID_GASTO : (colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : 0);
      const colIdTrx = colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : colIdGasto;

      for (let i = 0; i < data.length; i++) {
        const valG = String(data[i][colIdGasto] || "").trim().toUpperCase();
        const valT = String(data[i][colIdTrx] || "").trim().toUpperCase();
        if (valG === idGasto || valT === idGasto) {
          gastoExiste = true;
          if (colMap.ID_GOOGLE_TASK !== undefined) {
            taskId = String(data[i][colMap.ID_GOOGLE_TASK] || "").trim();
          }
          break;
        }
      }

      if (!gastoExiste) return { success: false, error: "Gasto no encontrado: " + idGasto };

      if (taskId) {
        try {
          if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTask) {
            GoogleTasksService.eliminarTask(taskId);
          }
        } catch (eTask) {
          Logger.log("[deleteGasto GoogleTask Error]: " + eTask.message);
        }
      }

      // Eliminar fila de gasto de forma atómica en lote
      sobrescribirHojaFiltrada(sheet, function (row) {
        const valG = String(row[colIdGasto] || "").trim().toUpperCase();
        const valT = String(row[colIdTrx] || "").trim().toUpperCase();
        return valG !== idGasto && valT !== idGasto;
      });

      SpreadsheetApp.flush();
      invalidarCacheDashboard();

      return { success: true, idGasto: idGasto, idTransaccion: idGasto };
    } catch (err) {
      Logger.log("[deleteGasto Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  createIngreso: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const idIngreso = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdIngreso)
      ? CorrelativoService.generarIdIngreso()
      : ((typeof CorrelativoService !== "undefined" && CorrelativoService.generarCorrelativo)
        ? CorrelativoService.generarCorrelativo("ING")
        : "ING-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss"));

    const sheet = FinanzasService.obtenerHojaIngresos(ss);
    if (!sheet) return { success: false, error: "Hoja de ingresos (BBDD_Finanzas_Ingresos / BBDD_Ingresos) no encontrada" };

    const colMap = FinanzasService.obtenerMapaColumnasIngresos(sheet);

    const fechaIng = payload.fechaIngreso || payload.fecha || payload.fechaRegistro || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    const monIng = (payload.monedaOriginal || payload.moneda || "PEN").toUpperCase();
    const mOrig = parseFloat(payload.montoOriginal !== undefined ? payload.montoOriginal : payload.monto) || 0.0;
    let tc = (monIng === "PEN") ? 1.0 : (parseFloat(payload.tipoCambio) || 0.0);
    if (monIng !== "PEN" && tc <= 1.0) {
      const tcRes = FinanzasService.obtenerTipoCambio({ fecha: fechaIng });
      const tcData = tcRes && tcRes.data ? tcRes.data : { usd: 3.76, eur: 4.12 };
      tc = (monIng === "EUR") ? (tcData.eur || 4.12) : (tcData.usd || 3.76);
    }
    if (tc <= 0) tc = 1.0;
    const mPen = (monIng === "PEN") ? mOrig : (mOrig * tc);

    const esProgramado = (payload.esProgramado === true || payload.esProgramado === "true" || payload.modoRegistro === "PROGRAMADO" || (payload.estadoCobro && String(payload.estadoCobro).toLowerCase().includes("programado")) || (payload.estado && String(payload.estado).toLowerCase().includes("programado")));
    const estadoCobro = esProgramado ? "Pendiente / Programado" : (payload.estadoCobro || payload.estado || "Cobrado").trim();
    const modalidad = payload.modalidad || (esProgramado ? "Programado / Proyectado" : "Real / Ejecutado");

    // Soporte canónico para ingresos libres ('LIBRE_CORRIENTE') o vinculados ('PROYECTO' / 'ACTIVIDAD_PERSONAL')
    let tipoOrigen = String(payload.tipoOrigen || payload.tipoIngreso || "").trim().toUpperCase();
    let idOrigenVinculado = String(payload.idOrigenVinculado || payload.idEntidadVinculada || "").trim();

    const idProyRaw = String(payload.idProyectoAsociado || payload.idProyecto || payload.ID_Proyecto || "").trim();
    const idActRaw = String(payload.idActividad || payload.ID_Actividad || "").trim();

    if (!idOrigenVinculado) {
      if (idProyRaw && idProyRaw.toUpperCase() !== "PERSONAL" && idProyRaw.toUpperCase() !== "NINGUNO") {
        idOrigenVinculado = idProyRaw;
        if (!tipoOrigen) tipoOrigen = "PROYECTO";
      } else if (idActRaw && idActRaw.toUpperCase() !== "NINGUNO") {
        idOrigenVinculado = idActRaw;
        if (!tipoOrigen) tipoOrigen = "ACTIVIDAD_PERSONAL";
      }
    }

    if (!tipoOrigen) {
      const clasifRaw = String(payload.clasificacionOrigen || "").trim().toUpperCase();
      if (clasifRaw === "PROYECTO" || (idOrigenVinculado && idOrigenVinculado.startsWith("PRO-"))) {
        tipoOrigen = "PROYECTO";
      } else if (clasifRaw === "ACTIVIDAD" || clasifRaw === "ACTIVIDAD_PERSONAL" || (idOrigenVinculado && idOrigenVinculado.startsWith("ACT-"))) {
        tipoOrigen = "ACTIVIDAD_PERSONAL";
      } else {
        tipoOrigen = "LIBRE_CORRIENTE";
      }
    }

    if (!idOrigenVinculado || idOrigenVinculado.toUpperCase() === "PERSONAL") {
      if (tipoOrigen === "LIBRE_CORRIENTE") {
        idOrigenVinculado = "NINGUNO";
      }
    }

    const concepto = String(payload.descripcionIngreso || payload.concepto || payload.descripcion || payload.origenFuente || "Ingreso").trim();
    const categoria = String(payload.categoriaIngreso || payload.categoria || payload.origenFuente || "Sueldo_Nomina").trim();
    const metodoCobro = String(payload.metodoCobro || payload.metodoPago || payload.cuentaDestino || payload.comprobanteUrl || "BCP").trim();

    let taskId = "";
    if (esProgramado) {
      try {
        if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.crearTaskIngreso) {
          const taskRes = GoogleTasksService.crearTaskIngreso({
            descripcion: concepto,
            moneda: monIng,
            monto: mOrig,
            fechaLimite: fechaIng,
            notas: "ID: " + idIngreso + "\nOrigen: " + categoria + "\nÁmbito: " + tipoOrigen
          });
          if (taskRes && taskRes.taskId) taskId = taskRes.taskId;
        }
      } catch (eTask) {
        Logger.log("[createIngreso GoogleTask Error]: " + eTask.message);
      }
    }

    // Dimensionamiento exacto a 12 columnas canónicas (MAX_COLUMNS || 12)
    const totalCols = Math.max(sheet.getLastColumn(), 12, (colMap.MAX_COLUMNS || 12));
    const newRow = new Array(totalCols).fill("");

    const setSiExiste = (key, val) => {
      if (colMap[key] !== undefined && colMap[key] >= 0 && colMap[key] < totalCols) {
        newRow[colMap[key]] = val;
      }
    };

    // 12 Campos Canónicos Definitivos de BBDD_Finanzas_Ingresos (A:L)
    setSiExiste("ID_INGRESO", idIngreso);
    setSiExiste("TIPO_ORIGEN", tipoOrigen);
    setSiExiste("ID_ORIGEN_VINCULADO", idOrigenVinculado);
    setSiExiste("FECHA_INGRESO", fechaIng);
    setSiExiste("DESCRIPCION_INGRESO", concepto);
    setSiExiste("CATEGORIA_INGRESO", categoria);
    setSiExiste("MONEDA_ORIGINAL", monIng);
    setSiExiste("MONTO_ORIGINAL", mOrig);
    setSiExiste("TIPO_CAMBIO", tc);
    setSiExiste("MONTO_PEN", mPen);
    setSiExiste("METODO_COBRO", metodoCobro);
    setSiExiste("ESTADO_COBRO", estadoCobro);

    // Retrocompatibilidad con aliases legacy y columnas históricas
    if (colMap.ID_TRANSACCION !== undefined && colMap.ID_TRANSACCION !== colMap.ID_INGRESO) setSiExiste("ID_TRANSACCION", idIngreso);
    if (colMap.TIPO_INGRESO !== undefined && colMap.TIPO_INGRESO !== colMap.TIPO_ORIGEN) setSiExiste("TIPO_INGRESO", tipoOrigen);
    if (colMap.CLASIFICACION_ORIGEN !== undefined && colMap.CLASIFICACION_ORIGEN !== colMap.TIPO_ORIGEN) setSiExiste("CLASIFICACION_ORIGEN", tipoOrigen);
    if (colMap.ID_ENTIDAD_VINCULADA !== undefined && colMap.ID_ENTIDAD_VINCULADA !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_ENTIDAD_VINCULADA", idOrigenVinculado);
    if (colMap.ID_PROYECTO_ASOCIADO !== undefined && colMap.ID_PROYECTO_ASOCIADO !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_PROYECTO_ASOCIADO", idOrigenVinculado);
    if (colMap.ID_PROYECTO !== undefined && colMap.ID_PROYECTO !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_PROYECTO", idOrigenVinculado);
    if (colMap.FECHA_REGISTRO !== undefined && colMap.FECHA_REGISTRO !== colMap.FECHA_INGRESO) setSiExiste("FECHA_REGISTRO", fechaIng);
    if (colMap.FECHA !== undefined && colMap.FECHA !== colMap.FECHA_INGRESO) setSiExiste("FECHA", fechaIng);
    if (colMap.FECHA_COMPROMISO !== undefined && colMap.FECHA_COMPROMISO !== colMap.FECHA_INGRESO) setSiExiste("FECHA_COMPROMISO", fechaIng);
    if (colMap.DESCRIPCION !== undefined && colMap.DESCRIPCION !== colMap.DESCRIPCION_INGRESO) setSiExiste("DESCRIPCION", concepto);
    if (colMap.CONCEPTO !== undefined && colMap.CONCEPTO !== colMap.DESCRIPCION_INGRESO) setSiExiste("CONCEPTO", concepto);
    if (colMap.CATEGORIA !== undefined && colMap.CATEGORIA !== colMap.CATEGORIA_INGRESO) setSiExiste("CATEGORIA", categoria);
    if (colMap.ORIGEN_FUENTE !== undefined && colMap.ORIGEN_FUENTE !== colMap.CATEGORIA_INGRESO) setSiExiste("ORIGEN_FUENTE", categoria);
    if (colMap.MONEDA !== undefined && colMap.MONEDA !== colMap.MONEDA_ORIGINAL) setSiExiste("MONEDA", monIng);
    if (colMap.MONTO !== undefined && colMap.MONTO !== colMap.MONTO_ORIGINAL) setSiExiste("MONTO", mOrig);
    if (colMap.TC !== undefined && colMap.TC !== colMap.TIPO_CAMBIO) setSiExiste("TC", tc);
    if (colMap.MONTO_MONEDA_BASE !== undefined && colMap.MONTO_MONEDA_BASE !== colMap.MONTO_PEN) setSiExiste("MONTO_MONEDA_BASE", mPen);
    if (colMap.METODO_PAGO !== undefined && colMap.METODO_PAGO !== colMap.METODO_COBRO) setSiExiste("METODO_PAGO", metodoCobro);
    if (colMap.CUENTA_DESTINO !== undefined && colMap.CUENTA_DESTINO !== colMap.METODO_COBRO) setSiExiste("CUENTA_DESTINO", metodoCobro);
    if (colMap.ESTADO_PAGO !== undefined && colMap.ESTADO_PAGO !== colMap.ESTADO_COBRO) setSiExiste("ESTADO_PAGO", estadoCobro);
    if (colMap.ESTADO !== undefined && colMap.ESTADO !== colMap.ESTADO_COBRO) setSiExiste("ESTADO", estadoCobro);
    if (colMap.MODALIDAD !== undefined && colMap.MODALIDAD !== colMap.ESTADO_COBRO) setSiExiste("MODALIDAD", modalidad);

    sheet.appendRow(newRow);
    const newRowNum = sheet.getLastRow();

    // Sincronizar Google Calendar si es programado
    let eventId = "";
    if (esProgramado && payload.agendarCalendar !== false) {
      try {
        if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaIngreso) {
          const calRes = CalendarService.sincronizarFilaIngreso(newRowNum, {
            idIngreso: idIngreso,
            descripcion: concepto,
            origenFuente: categoria,
            fechaIngreso: fechaIng,
            montoPen: mPen,
            estadoCobro: estadoCobro
          });
          if (calRes && calRes.eventId) {
            eventId = calRes.eventId;
            if (colMap.ID_EVENTO_CALENDAR !== undefined) {
              sheet.getRange(newRowNum, colMap.ID_EVENTO_CALENDAR + 1).setValue(eventId);
            }
            if (colMap.ID_GOOGLE_EVENT !== undefined && colMap.ID_GOOGLE_EVENT !== colMap.ID_EVENTO_CALENDAR) {
              sheet.getRange(newRowNum, colMap.ID_GOOGLE_EVENT + 1).setValue(eventId);
            }
          }
        }
      } catch (eCal) {
        Logger.log("[createIngreso Calendar Error]: " + eCal.message);
      }
    }

    invalidarCacheDashboard();

    const ingresoObj = {
      ID_Ingreso: idIngreso,
      idIngreso: idIngreso,
      ID_Transaccion: idIngreso,
      idTransaccion: idIngreso,
      Tipo_Origen: tipoOrigen,
      tipoOrigen: tipoOrigen,
      Clasificacion_Origen: tipoOrigen,
      clasificacionOrigen: tipoOrigen,
      Tipo_Ingreso: tipoOrigen,
      tipoIngreso: tipoOrigen,
      ID_Origen_Vinculado: idOrigenVinculado,
      idOrigenVinculado: idOrigenVinculado,
      ID_Entidad_Vinculada: idOrigenVinculado,
      idEntidadVinculada: idOrigenVinculado,
      ID_Proyecto_Asociado: idOrigenVinculado,
      idProyectoAsociado: idOrigenVinculado,
      ID_Proyecto: idOrigenVinculado,
      idProyecto: idOrigenVinculado,
      Fecha_Ingreso: fechaIng,
      fechaIngreso: fechaIng,
      Fecha_Registro: fechaIng,
      fechaRegistro: fechaIng,
      Descripcion_Ingreso: concepto,
      descripcionIngreso: concepto,
      Descripcion: concepto,
      descripcion: concepto,
      Concepto: concepto,
      concepto: concepto,
      Categoria_Ingreso: categoria,
      categoriaIngreso: categoria,
      Categoria: categoria,
      categoria: categoria,
      Origen_Fuente: categoria,
      origenFuente: categoria,
      Moneda_Original: monIng,
      monedaOriginal: monIng,
      Monto_Original: mOrig,
      montoOriginal: mOrig,
      Tipo_Cambio: tc,
      tipoCambio: tc,
      Monto_PEN: mPen,
      montoPEN: mPen,
      Monto_Moneda_Base: mPen,
      Metodo_Cobro: metodoCobro,
      metodoCobro: metodoCobro,
      Metodo_Pago: metodoCobro,
      metodoPago: metodoCobro,
      Cuenta_Destino: metodoCobro,
      cuentaDestino: metodoCobro,
      Estado_Cobro: estadoCobro,
      estadoCobro: estadoCobro,
      Estado_Pago: estadoCobro,
      estadoPago: estadoCobro,
      Estado: estadoCobro,
      estado: estadoCobro,
      Modalidad: modalidad,
      modalidad: modalidad,
      Conciliado: !esProgramado,
      taskId: taskId,
      eventId: eventId,
      esProgramado: esProgramado
    };

    return { success: true, idIngreso: idIngreso, idTransaccion: idIngreso, data: ingresoObj, taskId: taskId, eventId: eventId, esProgramado: esProgramado };
  },

  updateIngreso: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = FinanzasService.obtenerHojaIngresos(ss);
      if (!sheet) return { success: false, error: "Hoja de ingresos no encontrada" };

      const colMap = FinanzasService.obtenerMapaColumnasIngresos(sheet);
      const data = sheet.getDataRange().getValues();
      const idBuscado = String(payload.idIngreso || payload.ID_Ingreso || payload.idTransaccion || payload.ID_Transaccion || "").trim().toUpperCase();
      if (!idBuscado) return { success: false, error: "ID de ingreso no especificado" };

      let rowIdx = -1;
      const colIdIng = colMap.ID_INGRESO !== undefined ? colMap.ID_INGRESO : (colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : 0);
      const colIdTrx = colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : colIdIng;

      for (let i = 1; i < data.length; i++) {
        const valI = String(data[i][colIdIng] || "").trim().toUpperCase();
        const valT = String(data[i][colIdTrx] || "").trim().toUpperCase();
        if (valI === idBuscado || valT === idBuscado) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) return { success: false, error: "Ingreso no encontrado: " + idBuscado };

      // Dimensionamiento seguro a mínimo 12 columnas canónicas
      const totalCols = Math.max(data[rowIdx - 1].length, 12, (colMap.MAX_COLUMNS || 12));
      const filaActualizada = data[rowIdx - 1].slice();
      while (filaActualizada.length < totalCols) filaActualizada.push("");

      // Helper de mutación en memoria
      const setEnFila = (key, val) => {
        if (colMap[key] !== undefined && colMap[key] >= 0 && colMap[key] < totalCols) {
          filaActualizada[colMap[key]] = val;
        }
      };

      if (payload.tipoOrigen || payload.tipoIngreso || payload.clasificacionOrigen) {
        const toVal = String(payload.tipoOrigen || payload.tipoIngreso || payload.clasificacionOrigen).trim();
        setEnFila("TIPO_ORIGEN", toVal);
        if (colMap.TIPO_INGRESO !== undefined && colMap.TIPO_INGRESO !== colMap.TIPO_ORIGEN) setEnFila("TIPO_INGRESO", toVal);
        if (colMap.CLASIFICACION_ORIGEN !== undefined && colMap.CLASIFICACION_ORIGEN !== colMap.TIPO_ORIGEN) setEnFila("CLASIFICACION_ORIGEN", toVal);
      }
      if (payload.idOrigenVinculado || payload.idEntidadVinculada || payload.idProyectoAsociado || payload.idProyecto) {
        const iovVal = String(payload.idOrigenVinculado || payload.idEntidadVinculada || payload.idProyectoAsociado || payload.idProyecto).trim();
        setEnFila("ID_ORIGEN_VINCULADO", iovVal);
        if (colMap.ID_ENTIDAD_VINCULADA !== undefined && colMap.ID_ENTIDAD_VINCULADA !== colMap.ID_ORIGEN_VINCULADO) setEnFila("ID_ENTIDAD_VINCULADA", iovVal);
        if (colMap.ID_PROYECTO_ASOCIADO !== undefined && colMap.ID_PROYECTO_ASOCIADO !== colMap.ID_ORIGEN_VINCULADO) setEnFila("ID_PROYECTO_ASOCIADO", iovVal);
        if (colMap.ID_PROYECTO !== undefined && colMap.ID_PROYECTO !== colMap.ID_ORIGEN_VINCULADO) setEnFila("ID_PROYECTO", iovVal);
      }
      if (payload.fechaIngreso || payload.fecha || payload.fechaRegistro) {
        const fVal = payload.fechaIngreso || payload.fecha || payload.fechaRegistro;
        setEnFila("FECHA_INGRESO", fVal);
        if (colMap.FECHA_REGISTRO !== undefined && colMap.FECHA_REGISTRO !== colMap.FECHA_INGRESO) setEnFila("FECHA_REGISTRO", fVal);
        if (colMap.FECHA !== undefined && colMap.FECHA !== colMap.FECHA_INGRESO) setEnFila("FECHA", fVal);
      }
      if (payload.descripcionIngreso || payload.concepto || payload.descripcion) {
        const descVal = payload.descripcionIngreso || payload.concepto || payload.descripcion;
        setEnFila("DESCRIPCION_INGRESO", descVal);
        if (colMap.DESCRIPCION !== undefined && colMap.DESCRIPCION !== colMap.DESCRIPCION_INGRESO) setEnFila("DESCRIPCION", descVal);
        if (colMap.CONCEPTO !== undefined && colMap.CONCEPTO !== colMap.DESCRIPCION_INGRESO) setEnFila("CONCEPTO", descVal);
      }
      if (payload.categoriaIngreso || payload.categoria || payload.origenFuente) {
        const catVal = payload.categoriaIngreso || payload.categoria || payload.origenFuente;
        setEnFila("CATEGORIA_INGRESO", catVal);
        if (colMap.CATEGORIA !== undefined && colMap.CATEGORIA !== colMap.CATEGORIA_INGRESO) setEnFila("CATEGORIA", catVal);
        if (colMap.ORIGEN_FUENTE !== undefined && colMap.ORIGEN_FUENTE !== colMap.CATEGORIA_INGRESO) setEnFila("ORIGEN_FUENTE", catVal);
      }

      const colMon = colMap.MONEDA_ORIGINAL !== undefined ? colMap.MONEDA_ORIGINAL : -1;
      let mon = (colMon >= 0) ? String(filaActualizada[colMon] || "PEN").toUpperCase() : "PEN";
      if (payload.monedaOriginal || payload.moneda) {
        mon = String(payload.monedaOriginal || payload.moneda).toUpperCase();
        setEnFila("MONEDA_ORIGINAL", mon);
        if (colMap.MONEDA !== undefined && colMap.MONEDA !== colMap.MONEDA_ORIGINAL) setEnFila("MONEDA", mon);
      }

      const colMOrig = colMap.MONTO_ORIGINAL !== undefined ? colMap.MONTO_ORIGINAL : -1;
      let mOrig = (colMOrig >= 0) ? (parseFloat(filaActualizada[colMOrig]) || 0.0) : 0.0;
      if (payload.montoOriginal !== undefined || payload.monto !== undefined) {
        mOrig = parseFloat(payload.montoOriginal !== undefined ? payload.montoOriginal : payload.monto) || 0.0;
        setEnFila("MONTO_ORIGINAL", mOrig);
        if (colMap.MONTO !== undefined && colMap.MONTO !== colMap.MONTO_ORIGINAL) setEnFila("MONTO", mOrig);
      }

      let tc = (colMap.TIPO_CAMBIO !== undefined && colMap.TIPO_CAMBIO >= 0) ? (parseFloat(filaActualizada[colMap.TIPO_CAMBIO]) || 1.0) : 1.0;
      if (payload.tipoCambio !== undefined) {
        tc = parseFloat(payload.tipoCambio) || 1.0;
        setEnFila("TIPO_CAMBIO", tc);
        if (colMap.TC !== undefined && colMap.TC !== colMap.TIPO_CAMBIO) setEnFila("TC", tc);
      }

      // Recalcular MONTO_PEN y MONTO_MONEDA_BASE en memoria sin fórmulas in-sheet
      const mPen = (mon === "PEN") ? mOrig : (mOrig * tc);
      setEnFila("MONTO_PEN", mPen);
      if (colMap.MONTO_MONEDA_BASE !== undefined && colMap.MONTO_MONEDA_BASE !== colMap.MONTO_PEN) setEnFila("MONTO_MONEDA_BASE", mPen);

      if (payload.metodoCobro || payload.metodoPago || payload.cuentaDestino) {
        const metVal = payload.metodoCobro || payload.metodoPago || payload.cuentaDestino;
        setEnFila("METODO_COBRO", metVal);
        if (colMap.METODO_PAGO !== undefined && colMap.METODO_PAGO !== colMap.METODO_COBRO) setEnFila("METODO_PAGO", metVal);
        if (colMap.CUENTA_DESTINO !== undefined && colMap.CUENTA_DESTINO !== colMap.METODO_COBRO) setEnFila("CUENTA_DESTINO", metVal);
      }

      if (payload.estadoCobro || payload.estadoPago || payload.estado) {
        const estVal = payload.estadoCobro || payload.estadoPago || payload.estado;
        setEnFila("ESTADO_COBRO", estVal);
        if (colMap.ESTADO_PAGO !== undefined && colMap.ESTADO_PAGO !== colMap.ESTADO_COBRO) setEnFila("ESTADO_PAGO", estVal);
        if (colMap.ESTADO !== undefined && colMap.ESTADO !== colMap.ESTADO_COBRO) setEnFila("ESTADO", estVal);
      }
      if (payload.modalidad) {
        setEnFila("MODALIDAD", payload.modalidad);
      }

      // --- COMMIT ATÓMICO: escritura de toda la fila en una sola llamada batch ---
      sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada]);

      invalidarCacheDashboard();
      return { success: true, idIngreso: idBuscado, idTransaccion: idBuscado };
    } catch (err) {
      Logger.log("[updateIngreso Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  deleteIngreso: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = FinanzasService.obtenerHojaIngresos(ss);
      if (!sheet) return { success: false, error: "Hoja de ingresos no encontrada" };

      const colMap = FinanzasService.obtenerMapaColumnasIngresos(sheet);
      const idIng = String(payload.idIngreso || payload.ID_Ingreso || payload.idTransaccion || payload.ID_Transaccion || "").trim().toUpperCase();
      if (!idIng) return { success: false, error: "ID_Ingreso requerido para eliminar" };

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: false, error: "No hay ingresos registrados" };

      const lastCol = sheet.getLastColumn();
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      let taskId = "";
      let ingresoExiste = false;

      const colIdIng = colMap.ID_INGRESO !== undefined ? colMap.ID_INGRESO : (colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : 0);
      const colIdTrx = colMap.ID_TRANSACCION !== undefined ? colMap.ID_TRANSACCION : colIdIng;

      for (let i = 0; i < data.length; i++) {
        const valI = String(data[i][colIdIng] || "").trim().toUpperCase();
        const valT = String(data[i][colIdTrx] || "").trim().toUpperCase();
        if (valI === idIng || valT === idIng) {
          ingresoExiste = true;
          if (colMap.ID_GOOGLE_TASK !== undefined) {
            taskId = String(data[i][colMap.ID_GOOGLE_TASK] || "").trim();
          }
          break;
        }
      }

      if (!ingresoExiste) return { success: false, error: "Ingreso no encontrado: " + idIng };

      if (taskId) {
        try {
          if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTask) {
            GoogleTasksService.eliminarTask(taskId);
          }
        } catch (eTask) {
          Logger.log("[deleteIngreso GoogleTask Error]: " + eTask.message);
        }
      }

      // Eliminar fila de ingreso de forma atómica en lote
      sobrescribirHojaFiltrada(sheet, function (row) {
        const valI = String(row[colIdIng] || "").trim().toUpperCase();
        const valT = String(row[colIdTrx] || "").trim().toUpperCase();
        return valI !== idIng && valT !== idIng;
      });

      SpreadsheetApp.flush();
      invalidarCacheDashboard();

      return { success: true, idIngreso: idIng, idTransaccion: idIng };
    } catch (err) {
      Logger.log("[deleteIngreso Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  obtenerTipoCambio: function (payload) {
    const hoy = Utilities.formatDate(new Date(), (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima", "yyyy-MM-dd");
    const fechaConsulta = (payload && payload.fecha) ? String(payload.fecha).trim() : hoy;
    const cacheKey = "TC_SUNAT_SBS_" + fechaConsulta;

    // 1. Intentar recuperar de CacheService (duración hasta 6 horas)
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get(cacheKey);
      if (cached) {
        const tcCached = JSON.parse(cached);
        return { success: true, data: tcCached, tipoCambio: tcCached };
      }
    } catch (eCache) {
      Logger.log("[obtenerTipoCambio] Advertencia CacheService: " + eCache.message);
    }

    // 2. Consulta a API oficial o agregador SUNAT/SBS confiable
    let tcUsdCompra = 3.730;
    let tcUsdVenta = 3.760;
    let tcEurVenta = 4.120;
    let origen = "Estimado Mercado / SBS";
    let fechaRetorno = fechaConsulta;

    try {
      const urlSunat = (fechaConsulta === hoy)
        ? "https://api.apis.net.pe/v1/tipo-cambio-sunat"
        : ("https://api.apis.net.pe/v1/tipo-cambio-sunat?fecha=" + fechaConsulta);

      const resp = UrlFetchApp.fetch(urlSunat, { muteHttpExceptions: true, timeout: 5000 });
      if (resp && resp.getResponseCode() === 200) {
        const data = JSON.parse(resp.getContentText());
        if (data && data.venta) {
          tcUsdCompra = parseFloat(data.compra) || 3.730;
          tcUsdVenta = parseFloat(data.venta) || 3.760;
          // Cotización cruzada EUR/PEN con base en relación oficial promedio EUR/USD (1.09)
          tcEurVenta = parseFloat((tcUsdVenta * 1.09).toFixed(3));
          origen = "SUNAT / SBS Oficial";
          fechaRetorno = data.fecha || fechaConsulta;
        }
      }
    } catch (eSunat) {
      Logger.log("[obtenerTipoCambio] Error consultando SUNAT API: " + eSunat.message);
    }

    const resultadoTc = {
      compra: tcUsdCompra,
      venta: tcUsdVenta,
      usd: tcUsdVenta,
      usdCompra: tcUsdCompra,
      eur: tcEurVenta,
      origen: origen,
      fecha: fechaRetorno
    };

    // 3. Guardar en CacheService por 6 horas (21600 segundos)
    try {
      const cache = CacheService.getScriptCache();
      cache.put(cacheKey, JSON.stringify(resultadoTc), 21600);
    } catch (eSaveCache) {
      Logger.log("[obtenerTipoCambio] Error guardando en cache: " + eSaveCache.message);
    }

    return { success: true, data: resultadoTc, tipoCambio: resultadoTc };
  },

  /**
   * ============================================================================
   * GOBERNANZA DE COMPROMISOS A CUOTAS & DEUDAS BANCARIAS
   * ============================================================================
   */

  /**
   * Construye una fila para BBDD_Finanzas_Gastos respetando con exactitud quirúrgica
   * las cabeceras reales de la Fila 1 de la hoja, garantizando cero desfases de columnas.
   *
   * @param {GoogleAppsScript.Spreadsheet.Sheet|Array<string>} sheetOrHeaders - Hoja o lista de encabezados.
   * @param {Object} datosGasto - Objeto con los datos canónicos del gasto / cuota.
   * @returns {Array} Fila con longitud exacta coincidente con el número de columnas de la hoja.
   */
  construirFilaGastoDinamica: function (sheetOrHeaders, datosGasto) {
    let headers = null;
    if (Array.isArray(sheetOrHeaders)) {
      headers = sheetOrHeaders;
    } else if (sheetOrHeaders && typeof sheetOrHeaders.getLastColumn === "function") {
      const lc = sheetOrHeaders.getLastColumn();
      if (lc > 0) headers = sheetOrHeaders.getRange(1, 1, 1, lc).getValues()[0];
    }
    if (!headers || !headers.length) {
      headers = [
        "ID_Gasto", "Tipo_Origen", "ID_Origen_Vinculado", "ID_Cuota",
        "Fecha_Gasto", "Descripcion_Gasto", "Categoria_Gasto", "Moneda_Original",
        "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Pago",
        "Estado_Pago", "Comprobante_URL"
      ];
    }

    const colMap = FinanzasService.obtenerMapaColumnasGastos(headers);
    const totalCols = Math.max(headers.length, 14, (colMap.MAX_COLUMNS || 14));
    const row = new Array(totalCols).fill("");

    const idG = String(datosGasto.idGasto || datosGasto.idTransaccion || "").trim();
    const fG = String(datosGasto.fechaGasto || datosGasto.fechaRegistro || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd")).trim();
    
    // Inferencia de Tipo_Origen y ID_Origen_Vinculado
    let tipoOrigen = String(datosGasto.tipoOrigen || datosGasto.Tipo_Origen || datosGasto.clasificacionOrigen || datosGasto.tipoGasto || "").trim().toUpperCase().replace(/[\s-]/g, "_");
    let idEntVinc = String(datosGasto.idOrigenVinculado || datosGasto.ID_Origen_Vinculado || datosGasto.idEntidadVinculada || datosGasto.idTarea || datosGasto.idActividad || "").trim();
    if (!tipoOrigen) {
      if (idEntVinc.startsWith("TAR-")) tipoOrigen = "TAREA_PROYECTO";
      else if (idEntVinc.startsWith("ACT-")) tipoOrigen = "ACTIVIDAD_PERSONAL";
      else tipoOrigen = "LIBRE_CORRIENTE";
    }
    if (!idEntVinc) idEntVinc = "NINGUNO";

    const idCuota = String(datosGasto.idCuota || datosGasto.ID_Cuota || "").trim();
    const concepto = String(datosGasto.concepto || datosGasto.descripcion || datosGasto.descripcionGasto || "").trim();
    const cat = String(datosGasto.categoria || datosGasto.categoriaGasto || "General").trim();
    const mOrig = parseFloat(datosGasto.montoOriginal !== undefined ? datosGasto.montoOriginal : datosGasto.monto) || 0.0;
    const mon = String(datosGasto.monedaOriginal || datosGasto.moneda || "PEN").toUpperCase();
    const tc = parseFloat(datosGasto.tipoCambio) || 1.0;
    const mPen = (mon === "PEN") ? mOrig : (parseFloat(datosGasto.montoPEN || datosGasto.montoMonedaBase) || (mOrig * tc));
    const mUsd = (mon === "USD") ? mOrig : (parseFloat(datosGasto.montoUSD) || (tc > 0 ? (mPen / (mon === "EUR" ? (tc / 1.09) : tc)) : 0.0));
    const modalidad = String(datosGasto.modalidad || "Real / Ejecutado").trim();
    const estado = String(datosGasto.estado || datosGasto.estadoPago || "Pagado").trim();
    const metodo = String(datosGasto.metodoPago || "Transferencia_Bancaria").trim();
    const comp = String(datosGasto.comprobanteUrl || datosGasto.Comprobante_URL || "").trim();
    const evId = String(datosGasto.idEventoCalendar || datosGasto.idGoogleEvent || "").trim();
    const taskId = String(datosGasto.idGoogleTask || "").trim();
    const idProy = String(datosGasto.idProyecto || "").trim();
    const idHito = String(datosGasto.idHito || "").trim();

    // Asignación por clave en colMap si está definida y en rango
    const setSiExiste = (key, val) => {
      if (colMap[key] !== undefined && colMap[key] >= 0 && colMap[key] < totalCols) {
        row[colMap[key]] = (val !== undefined && val !== null) ? val : "";
      }
    };

    setSiExiste("ID_GASTO", idG);
    if (colMap.ID_TRANSACCION !== undefined && colMap.ID_TRANSACCION !== colMap.ID_GASTO) setSiExiste("ID_TRANSACCION", idG);
    if (colMap.TIPO_GASTO !== undefined && colMap.TIPO_GASTO !== colMap.TIPO_ORIGEN) setSiExiste("TIPO_GASTO", tipoOrigen === "TAREA_PROYECTO" ? "Tarea Proyecto" : (tipoOrigen === "ACTIVIDAD_PERSONAL" ? "Actividad Personal" : "Gasto Libre"));
    setSiExiste("TIPO_ORIGEN", tipoOrigen);
    if (colMap.CLASIFICACION_ORIGEN !== undefined && colMap.CLASIFICACION_ORIGEN !== colMap.TIPO_ORIGEN) setSiExiste("CLASIFICACION_ORIGEN", tipoOrigen);
    if (colMap.ID_TAREA !== undefined && colMap.ID_TAREA !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_TAREA", idEntVinc.startsWith("TAR-") ? idEntVinc : "");
    if (colMap.ID_ACTIVIDAD !== undefined && colMap.ID_ACTIVIDAD !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_ACTIVIDAD", idEntVinc.startsWith("ACT-") ? idEntVinc : "");
    setSiExiste("ID_ORIGEN_VINCULADO", idEntVinc);
    if (colMap.ID_ENTIDAD_VINCULADA !== undefined && colMap.ID_ENTIDAD_VINCULADA !== colMap.ID_ORIGEN_VINCULADO) setSiExiste("ID_ENTIDAD_VINCULADA", idEntVinc);
    setSiExiste("ID_CUOTA", idCuota);
    setSiExiste("FECHA_GASTO", fG);
    if (colMap.FECHA_REGISTRO !== undefined && colMap.FECHA_REGISTRO !== colMap.FECHA_GASTO) setSiExiste("FECHA_REGISTRO", fG);
    if (colMap.FECHA_COMPROMISO !== undefined && colMap.FECHA_COMPROMISO !== colMap.FECHA_GASTO) setSiExiste("FECHA_COMPROMISO", fG);
    setSiExiste("DESCRIPCION_GASTO", concepto);
    if (colMap.DESCRIPCION !== undefined && colMap.DESCRIPCION !== colMap.DESCRIPCION_GASTO) setSiExiste("DESCRIPCION", concepto);
    if (colMap.CONCEPTO !== undefined && colMap.CONCEPTO !== colMap.DESCRIPCION_GASTO) setSiExiste("CONCEPTO", concepto);
    setSiExiste("CATEGORIA_GASTO", cat);
    if (colMap.CATEGORIA !== undefined && colMap.CATEGORIA !== colMap.CATEGORIA_GASTO) setSiExiste("CATEGORIA", cat);
    setSiExiste("MONEDA_ORIGINAL", mon);
    setSiExiste("MONTO_ORIGINAL", mOrig);
    if (colMap.MONTO !== undefined && colMap.MONTO !== colMap.MONTO_ORIGINAL) setSiExiste("MONTO", mOrig);
    setSiExiste("TIPO_CAMBIO", tc);
    setSiExiste("MONTO_PEN", mPen);
    if (colMap.MONTO_MONEDA_BASE !== undefined && colMap.MONTO_MONEDA_BASE !== colMap.MONTO_PEN) setSiExiste("MONTO_MONEDA_BASE", mPen);
    setSiExiste("METODO_PAGO", metodo);
    setSiExiste("ESTADO_PAGO", estado);
    if (colMap.ESTADO !== undefined && colMap.ESTADO !== colMap.ESTADO_PAGO) setSiExiste("ESTADO", estado);
    if (colMap.MODALIDAD !== undefined && colMap.MODALIDAD !== colMap.ESTADO_PAGO) setSiExiste("MODALIDAD", modalidad);
    setSiExiste("COMPROBANTE_URL", comp);

    // Campos secundarios defensivos si la hoja física conserva columnas históricas
    setSiExiste("MONTO_USD", mUsd);
    setSiExiste("ID_PROYECTO", idProy);
    setSiExiste("ID_HITO", idHito);
    setSiExiste("ID_EVENTO_CALENDAR", evId);
    setSiExiste("ID_GOOGLE_EVENT", evId);
    setSiExiste("ID_GOOGLE_TASK", taskId);

    // Inspección directa por cabecera de columna para asegurar que ningún campo quede desfasado o en blanco
    for (let c = 0; c < totalCols; c++) {
      if (row[c] !== "" && row[c] !== undefined && row[c] !== null) continue;
      if (c >= headers.length) continue;
      const cleanH = CONFIG.normalizarTextoCabecera(headers[c]);
      if (cleanH === "IDGASTO" || cleanH === "IDTRANSACCION") row[c] = idG;
      else if (cleanH === "TIPOORIGEN" || cleanH === "CLASIFICACIONORIGEN" || cleanH === "TIPOGASTO") row[c] = tipoOrigen;
      else if (cleanH === "IDORIGENVINCULADO" || cleanH === "IDENTIDADVINCULADA" || cleanH === "IDVINCULADO") row[c] = idEntVinc;
      else if (cleanH === "IDCUOTA" || cleanH === "CUOTAID" || cleanH === "CUOTA") row[c] = idCuota;
      else if (cleanH === "FECHAGASTO" || cleanH === "FECHAREGISTRO" || cleanH === "FECHACOMPROMISO") row[c] = fG;
      else if (cleanH === "DESCRIPCIONGASTO" || cleanH === "DESCRIPCION" || cleanH === "CONCEPTO") row[c] = concepto;
      else if (cleanH === "CATEGORIAGASTO" || cleanH === "CATEGORIA") row[c] = cat;
      else if (cleanH === "MONEDAORIGINAL" || cleanH === "MONEDA") row[c] = mon;
      else if (cleanH === "MONTOORIGINAL" || cleanH === "MONTO") row[c] = mOrig;
      else if (cleanH === "TIPOCAMBIO" || cleanH === "TC") row[c] = tc;
      else if (cleanH === "MONTOPEN" || cleanH === "MONTOMONEDABASE") row[c] = mPen;
      else if (cleanH === "METODOPAGO") row[c] = metodo;
      else if (cleanH === "ESTADOPAGO" || cleanH === "ESTADO") row[c] = estado;
      else if (cleanH === "COMPROBANTEURL") row[c] = comp;
    }

    return row;
  },

  /**
   * Registra un compromiso de deuda diferido en N cuotas pre-generando las N filas
   * exclusivamente en BBDD_Finanzas_Gastos con mapeo 100% dinámico por encabezados (14 columnas canónicas)
   * y estado "Pendiente / Programado", consolidando el plan de cuotas de forma atómica en Col D (ID_Cuota).
   */
  crearGastoEnCuotas: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const nombrePlan = String(payload.nombrePlan || payload.concepto || "Crédito").trim();
      const descripcion = String(payload.descripcion || "").trim();
      const montoTotal = parseFloat(payload.montoTotal) || 0;
      const cuotaInicial = parseFloat(payload.cuotaInicial) || 0;
      const numCuotas = parseInt(payload.numCuotas || payload.cuotas) || 12;
      const tasaInteres = parseFloat(payload.tasaInteres) || 0;
      const tipoTasa = String(payload.tipoTasa || "SIN_INTERES").toUpperCase();
      const diaPago = parseInt(payload.diaPago) || 15;
      const entidadFinanciera = String(payload.entidadFinanciera || payload.banco || "Banco").trim();
      const categoria = String(payload.categoria || "Deudas / Servicios Financieros").trim();
      const metodoPago = String(payload.metodoPago || "Transferencia_Bancaria").trim();
      const moneda = String(payload.monedaOriginal || payload.moneda || "PEN").toUpperCase();
      let tc = (moneda === "PEN") ? 1.0 : (parseFloat(payload.tipoCambio) || 0.0);
      if (moneda !== "PEN" && tc <= 1.0) {
        const tcRes = FinanzasService.obtenerTipoCambio({ fecha: payload.fechaInicio });
        const tcData = tcRes && tcRes.data ? tcRes.data : { usd: 3.76, eur: 4.12 };
        tc = (moneda === "EUR") ? (tcData.eur || 4.12) : (tcData.usd || 3.76);
      }
      if (tc <= 0) tc = 1.0;

      const clasificacionOrigen = String(payload.clasificacionOrigen || "Personal").trim();
      const fechaInicio = payload.fechaInicio || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

      // Calcular monto de cuota mensual
      let montoCuota = parseFloat(payload.montoCuota || payload.cuotaMensual) || 0;
      if (montoCuota <= 0) {
        const capitalFinanciar = Math.max(0, montoTotal - cuotaInicial);
        if (tasaInteres > 0 && tipoTasa !== "SIN_INTERES") {
          const tasaMensual = (tipoTasa === "TEA")
            ? Math.pow(1 + tasaInteres / 100, 1 / 12) - 1
            : tasaInteres / 100;
          if (tasaMensual > 0) {
            montoCuota = capitalFinanciar * tasaMensual / (1 - Math.pow(1 + tasaMensual, -numCuotas));
          } else {
            montoCuota = capitalFinanciar / numCuotas;
          }
        } else {
          montoCuota = capitalFinanciar / numCuotas;
        }
      }
      montoCuota = Math.round(montoCuota * 100) / 100;
      const totalPlanCalculado = (montoTotal > 0) ? Math.round(montoTotal * 100) / 100 : Math.round((montoCuota * numCuotas) * 100) / 100;
      const saldoPendiente = totalPlanCalculado;

      // 1. Generar ID único del plan de cuotas (CUO-XXX)
      const idPlan = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarCorrelativo)
        ? CorrelativoService.generarCorrelativo("CUO")
        : "CUO-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMddHHmmss");

      // 2. Pre-generar exclusivamente las N filas en BBDD_Finanzas_Gastos (Fase 4.11 - Cero hojas satélites)
      const sheetGastos = FinanzasService.obtenerHojaGastos(ss);
      if (!sheetGastos) throw new Error("Hoja de gastos (BBDD_Finanzas_Gastos) no encontrada");
      const headersGastos = (sheetGastos.getLastColumn() > 0)
        ? sheetGastos.getRange(1, 1, 1, sheetGastos.getLastColumn()).getValues()[0]
        : null;

      const parts = String(fechaInicio).split(/[\sT-]/);
      const startYear = parseInt(parts[0], 10) || new Date().getFullYear();
      const startMonth = parseInt(parts[1], 10) || (new Date().getMonth() + 1);

      const filasGastos = [];
      const objetosGastos = [];

      for (let i = 1; i <= numCuotas; i++) {
        // Cálculo seguro de fecha de vencimiento mes a mes ajustando fin de mes
        const totalMonths = (startMonth - 1) + (i - 1);
        const anioCuota = startYear + Math.floor(totalMonths / 12);
        const mesCuota = (totalMonths % 12) + 1;
        const diasEnMes = new Date(anioCuota, mesCuota, 0).getDate();
        const diaEfectivo = Math.min(diaPago, diasEnMes);
        const fechaCuota = anioCuota + "-" + String(mesCuota).padStart(2, "0") + "-" + String(diaEfectivo).padStart(2, "0");

        // ID único correlativo de transacción
        const idGasto = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdGasto)
          ? CorrelativoService.generarIdGasto()
          : "GAS-" + idPlan + "-" + String(i).padStart(3, "0");

        // Formato canónico requerido: "[Nombre Plan] (Total S/ X) - Cuota i/N"
        const conceptoCuota = `${nombrePlan} (Total S/ ${totalPlanCalculado}) - Cuota ${i}/${numCuotas}`;
        const mPen = (moneda === "PEN") ? montoCuota : (montoCuota * tc);
        const mUsd = (moneda === "USD") ? montoCuota : (tc > 0 ? (mPen / 3.76) : 0);

        // Agendar en Google Calendar si está disponible
        let eventId = "";
        try {
          if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaGasto) {
            const calRes = CalendarService.sincronizarFilaGasto(null, {
              idGasto: idGasto,
              descripcion: conceptoCuota,
              fechaGasto: fechaCuota,
              montoPen: mPen,
              estadoPago: "Pendiente",
              categoria: categoria
            });
            if (calRes && calRes.eventId) eventId = calRes.eventId;
          }
        } catch (eCal) {
          Logger.log("[crearGastoEnCuotas Calendar Error]: " + eCal.message);
        }

        // Crear Google Task si está disponible
        let taskId = "";
        try {
          if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.crearTaskGastoCuota) {
            const tRes = GoogleTasksService.crearTaskGastoCuota({
              descripcion: conceptoCuota,
              moneda: moneda,
              monto: montoCuota,
              fechaLimite: fechaCuota,
              notas: "Plan: " + nombrePlan + "\nID Gasto: " + idGasto + "\nPlan ID: " + idPlan + "\nEntidad: " + entidadFinanciera
            });
            if (tRes && tRes.taskId) taskId = tRes.taskId;
          }
        } catch (eTask) {
          Logger.log("[crearGastoEnCuotas Task Error]: " + eTask.message);
        }

        const cuotaData = {
          idTransaccion: idGasto,
          idGasto: idGasto,
          tipoOrigen: "LIBRE_CORRIENTE",
          idOrigenVinculado: "NINGUNO",
          idCuota: idPlan,
          fechaGasto: fechaCuota,
          fechaRegistro: fechaCuota,
          fechaCompromiso: fechaCuota,
          concepto: conceptoCuota,
          descripcion: conceptoCuota,
          descripcionGasto: conceptoCuota,
          categoria: categoria,
          categoriaGasto: categoria,
          monedaOriginal: moneda,
          montoOriginal: montoCuota,
          tipoCambio: tc,
          montoMonedaBase: mPen,
          montoPEN: mPen,
          montoUSD: mUsd,
          metodoPago: metodoPago,
          estado: "Pendiente",
          estadoPago: "Pendiente",
          modalidad: "Programado / Proyectado",
          comprobanteUrl: "",
          idEventoCalendar: eventId,
          idGoogleTask: taskId
        };

        const filaG = FinanzasService.construirFilaGastoDinamica(headersGastos, cuotaData);
        // Asegurar dimensionamiento exacto a 14 columnas canónicas (A:N) e indexación estricta
        while (filaG.length < 14) filaG.push("");
        filaG[3] = idPlan;        // Col D: ID_Cuota (Índice 3)
        filaG[5] = conceptoCuota; // Col F: Descripcion_Gasto (Índice 5)
        filaG[12] = "Pendiente";  // Col M: Estado_Pago (Índice 12)

        filasGastos.push(filaG);
        objetosGastos.push(cuotaData);
      }

      // Inserción masiva en lote (batch) exclusivamente en BBDD_Finanzas_Gastos
      if (filasGastos.length > 0) {
        const lastRowG = sheetGastos.getLastRow();
        sheetGastos.getRange(lastRowG + 1, 1, filasGastos.length, filasGastos[0].length).setValues(filasGastos);
      }

      SpreadsheetApp.flush();
      invalidarCacheDashboard();

      return {
        success: true,
        idCuota: idPlan,
        idPlan: idPlan,
        numCuotas: numCuotas,
        montoCuota: montoCuota,
        saldoPendiente: saldoPendiente,
        cuotasGastos: objetosGastos
      };
    } catch (err) {
      Logger.log("[crearGastoEnCuotas Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eL) { }
    }
  },

  /**
   * Concilia y registra el pago atómico de la siguiente cuota pendiente de un plan de deuda directamente en BBDD_Finanzas_Gastos.
   * Transiciona la cuota de "Programado / Proyectado" (Pendiente) a "Real / Ejecutado" (Pagado),
   * computando el egreso de inmediato en el balance real ejecutado del mes sin requerir hoja física satélite.
   */
  pagarSiguienteCuota: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const idPlan = String(payload.idPlan || payload.idDeuda || payload.idCuota || "").trim();
      let idGasto = String(payload.idGasto || payload.idTransaccion || "").trim();
      const fechaReal = String(payload.fechaReal || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd")).trim();
      const montoReal = (payload.montoReal !== undefined && payload.montoReal !== null && payload.montoReal !== "")
        ? parseFloat(payload.montoReal)
        : null;
      const metodoPago = String(payload.metodoPago || "").trim();
      const comprobanteUrl = String(payload.comprobanteUrl || "").trim();

      const sheetGastos = FinanzasService.obtenerHojaGastos(ss);
      if (!sheetGastos) return { success: false, error: "Hoja de gastos no encontrada" };

      const colMapG = FinanzasService.obtenerMapaColumnasGastos(sheetGastos);
      const dataG = sheetGastos.getDataRange().getValues();
      if (dataG.length <= 1) {
        return { success: false, error: "No hay registros de gastos disponibles" };
      }

      const colIdTrx = colMapG.ID_TRANSACCION !== undefined ? colMapG.ID_TRANSACCION : 0;
      const colIdGasto = colMapG.ID_GASTO !== undefined ? colMapG.ID_GASTO : colIdTrx;
      const colIdEntVinc = colMapG.ID_ENTIDAD_VINCULADA !== undefined ? colMapG.ID_ENTIDAD_VINCULADA : -1;
      const colIdCuota = colMapG.ID_CUOTA !== undefined ? colMapG.ID_CUOTA : 3;
      const colConcepto = colMapG.CONCEPTO !== undefined ? colMapG.CONCEPTO : (colMapG.DESCRIPCION !== undefined ? colMapG.DESCRIPCION : 5);
      const colEstadoPago = colMapG.ESTADO_PAGO !== undefined ? colMapG.ESTADO_PAGO : (colMapG.ESTADO !== undefined ? colMapG.ESTADO : 12);
      const colModalidad = colMapG.MODALIDAD !== undefined ? colMapG.MODALIDAD : -1;
      const colMOrig = colMapG.MONTO_ORIGINAL !== undefined ? colMapG.MONTO_ORIGINAL : (colMapG.MONTO !== undefined ? colMapG.MONTO : 8);
      const colMPen = colMapG.MONTO_PEN !== undefined ? colMapG.MONTO_PEN : (colMapG.MONTO_MONEDA_BASE !== undefined ? colMapG.MONTO_MONEDA_BASE : 10);

      const planUpper = idPlan.toUpperCase();
      let match = null;
      const cuotasDelPlan = [];

      for (let i = 1; i < dataG.length; i++) {
        const row = dataG[i];
        const rowIdG = String(row[colIdGasto] || row[colIdTrx] || "").trim();
        const rowIdC = String(row[colIdCuota] || "").trim();
        const rowIdVinc = (colIdEntVinc >= 0) ? String(row[colIdEntVinc] || "").trim() : "";
        const rowDesc = (colConcepto >= 0) ? String(row[colConcepto] || "").trim() : "";
        const rowEst = (colEstadoPago >= 0) ? String(row[colEstadoPago] || "").trim().toLowerCase() : "";
        const rowMod = (colModalidad >= 0) ? String(row[colModalidad] || "").trim().toLowerCase() : "";

        const isPagado = rowEst.includes("pagado") || rowEst.includes("ejecutado") || rowEst.includes("cobrado") || rowMod.includes("real");
        const isPendiente = !isPagado || rowEst.includes("pendiente") || rowEst.includes("programado") || rowMod.includes("programado") || rowMod.includes("proyectado");

        // Identificar si la fila pertenece al plan o al ID de gasto especificado
        const esDelPlan = (planUpper && (
          rowIdC.toUpperCase() === planUpper ||
          rowIdVinc.toUpperCase() === planUpper ||
          rowDesc.toUpperCase().includes(planUpper) ||
          rowIdG.toUpperCase().includes(planUpper)
        )) || (idGasto && rowIdG.toUpperCase() === idGasto.toUpperCase());

        if (esDelPlan) {
          const mFila = parseFloat(row[colMPen]) || parseFloat(row[colMOrig]) || 0.0;
          cuotasDelPlan.push({
            rowIdx: i + 1,
            row: row,
            idGasto: rowIdG,
            isPagado: isPagado,
            isPendiente: isPendiente,
            monto: mFila
          });

          // Primera cuota pendiente a conciliar
          if (!match && isPendiente) {
            match = {
              targetRowIdx: i + 1,
              cuotaDataRow: row,
              colMapG: colMapG,
              idGasto: rowIdG
            };
          }
        }
      }

      if (!match || !match.cuotaDataRow) {
        return {
          success: false,
          error: "No se encontró ninguna cuota pendiente por pagar para la deuda: " + (idPlan || idGasto)
        };
      }

      const targetRowIdx = match.targetRowIdx;
      const cuotaDataRow = match.cuotaDataRow;
      idGasto = match.idGasto || idGasto;

      // Determinar monto efectivo pagado
      const montoEfectivo = (montoReal !== null && montoReal > 0)
        ? montoReal
        : (parseFloat(cuotaDataRow[colMPen]) || parseFloat(cuotaDataRow[colMOrig]) || 0.0);

      // Mutación atómica en BBDD_Finanzas_Gastos
      const setColVal = (key, val) => {
        if (colMapG[key] !== undefined && colMapG[key] >= 0) {
          sheetGastos.getRange(targetRowIdx, colMapG[key] + 1).setValue(val);
        }
      };

      setColVal("MODALIDAD", "Real / Ejecutado");
      setColVal("ESTADO", "Pagado");
      setColVal("ESTADO_PAGO", "Pagado");
      setColVal("FECHA_REGISTRO", fechaReal);
      setColVal("FECHA_GASTO", fechaReal);

      // Asegurar que Col M (índice 12, columna física 13) se mute inequívocamente a 'Pagado'
      const physicalColM = (colMapG.ESTADO_PAGO !== undefined && colMapG.ESTADO_PAGO >= 0)
        ? colMapG.ESTADO_PAGO + 1
        : 13;
      sheetGastos.getRange(targetRowIdx, physicalColM).setValue("Pagado");

      if (montoReal !== null && montoReal > 0) {
        setColVal("MONTO_ORIGINAL", montoReal);
        setColVal("MONTO", montoReal);
        setColVal("MONTO_PEN", montoReal);
        setColVal("MONTO_MONEDA_BASE", montoReal);
      }
      if (metodoPago) setColVal("METODO_PAGO", metodoPago);
      if (comprobanteUrl) setColVal("COMPROBANTE_URL", comprobanteUrl);
      if (idPlan) {
        setColVal("ID_CUOTA", idPlan);
      }

      // Cómputo atómico en memoria del estado del plan de cuotas (Cero dependencias de hoja satélite)
      const totalCuotas = cuotasDelPlan.length > 0 ? cuotasDelPlan.length : 12;
      const pagadasPrevias = cuotasDelPlan.filter(c => c.isPagado).length;
      const nuevasPagadas = pagadasPrevias + 1;
      const montoTotalPlan = cuotasDelPlan.reduce((sum, c) => sum + c.monto, 0);
      const montoPagadoPrevio = cuotasDelPlan.filter(c => c.isPagado).reduce((sum, c) => sum + c.monto, 0);
      const nuevoMontoPagado = Math.round((montoPagadoPrevio + montoEfectivo) * 100) / 100;
      const nuevoSaldo = Math.max(0, Math.round((montoTotalPlan - nuevoMontoPagado) * 100) / 100);
      const nuevoEstado = (nuevasPagadas >= totalCuotas || nuevoSaldo <= 0) ? "COMPLETADO" : "ACTIVO";

      // Google Calendar: actualizar título a ✅ [PAGADO] si existe evento
      const colEv = colMapG.ID_EVENTO_CALENDAR !== undefined ? colMapG.ID_EVENTO_CALENDAR : colMapG.ID_GOOGLE_EVENT;
      const evId = (colEv !== undefined && colEv >= 0) ? String(cuotaDataRow[colEv] || "").trim() : "";
      if (evId && typeof CalendarService !== "undefined" && CalendarService.actualizarConciliacionEventoCalendar) {
        try {
          CalendarService.actualizarConciliacionEventoCalendar(evId, "GASTO", true);
        } catch (eCal) {
          Logger.log("[pagarSiguienteCuota Calendar Error]: " + eCal.message);
        }
      }

      // Google Tasks: completar tarea asociada si existe
      const colTask = colMapG.ID_GOOGLE_TASK;
      const taskId = (colTask !== undefined && colTask >= 0) ? String(cuotaDataRow[colTask] || "").trim() : "";
      if (taskId && typeof GoogleTasksService !== "undefined" && GoogleTasksService.actualizarTask) {
        try {
          GoogleTasksService.actualizarTask({ taskId: taskId, completada: true });
        } catch (eT) {
          Logger.log("[pagarSiguienteCuota Task Error]: " + eT.message);
        }
      }

      SpreadsheetApp.flush();
      invalidarCacheDashboard();

      return {
        success: true,
        idPlan: idPlan,
        idGasto: idGasto,
        cuotasPagadas: nuevasPagadas,
        totalCuotas: totalCuotas,
        saldoPendiente: nuevoSaldo,
        montoPagado: nuevoMontoPagado,
        estado: nuevoEstado,
        fechaReal: fechaReal,
        montoReal: montoEfectivo
      };
    } catch (err) {
      Logger.log("[pagarSiguienteCuota Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eL) { }
    }
  },

  /**
   * Saneamiento preventivo y correctivo para filas de cuotas en BBDD_Finanzas_Gastos.
   * Audita y realinea cualquier fila de cuota histórica con columnas desfasadas.
   */
  sanearCuotasDesfasadas: function () {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();

      // Auditar y realinear BBDD_Finanzas_Gastos
      const sheetGastos = FinanzasService.obtenerHojaGastos(ss);
      if (!sheetGastos) return { success: false, error: "Hoja de gastos no encontrada" };

      const lastRow = sheetGastos.getLastRow();
      const lastCol = sheetGastos.getLastColumn();
      if (lastRow <= 1 || lastCol <= 0) return { success: true, filasSanadas: 0, mensaje: "Hoja vacía o sin datos" };

      const headers = sheetGastos.getRange(1, 1, 1, lastCol).getValues()[0];
      const data = sheetGastos.getRange(2, 1, lastRow - 1, lastCol).getValues();
      let filasSanadas = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowStr = row.map(c => String(c || "")).join(" | ");

        // Criterio de detección de cuota
        const esCuota = rowStr.includes("GAS-CUO") ||
                        rowStr.includes("CUO-") ||
                        /cuota\s+\d+/i.test(rowStr) ||
                        rowStr.includes("Cuota_Credito");

        if (!esCuota) continue;

        let idGasto = "";
        let idPlan = "";
        let fecha = "";
        let monto = 0;
        let concepto = "";
        let categoria = "Deudas / Servicios Financieros";
        let estado = "Pendiente / Programado";
        let modalidad = "Programado / Proyectado";
        let cuotaContador = "";
        let metodo = "Transferencia_Bancaria";
        let compUrl = "";
        let evId = "";

        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || "").trim();
          if (!val) continue;

          // Detectar ID de Gasto
          if (/^GAS-CUO/i.test(val) || (/^GAS-/i.test(val) && !idGasto)) {
            idGasto = val;
          }
          // Detectar ID de Plan Cuota
          if (/^CUO-/i.test(val)) {
            idPlan = val;
          }
          // Detectar Fecha
          if (/^\d{4}-\d{2}-\d{2}/.test(val) && !fecha) {
            fecha = val.split("T")[0];
          }
          // Detectar Contador de cuota (ej: 1/12)
          if (/^\d+\/\d+$/.test(val)) {
            cuotaContador = val;
          }
          // Detectar Concepto con Cuota
          if (/cuota/i.test(val) && val.length > 5 && !concepto) {
            concepto = val;
          }
          // Detectar Estado
          if (/pagado|ejecutado/i.test(val)) {
            estado = "Pagado";
            modalidad = "Real / Ejecutado";
          } else if (/pendiente|programado/i.test(val)) {
            estado = "Pendiente / Programado";
            modalidad = "Programado / Proyectado";
          }
          // Detectar Monto numérico
          if (typeof row[c] === "number" && row[c] > 0 && monto === 0) {
            monto = row[c];
          } else if (!monto && /^\d+(\.\d+)?$/.test(val) && parseFloat(val) > 1) {
            monto = parseFloat(val);
          }
          // Detectar URL
          if (/^https?:\/\//i.test(val)) {
            compUrl = val;
          }
        }

        if (!idGasto && idPlan) idGasto = "GAS-" + idPlan + "-" + String(i + 1).padStart(3, "0");
        if (!concepto) concepto = (idPlan || "Deuda") + (cuotaContador ? (" - Cuota " + cuotaContador) : " - Cuota");

        const saneado = {
          idTransaccion: idGasto,
          idGasto: idGasto,
          fechaRegistro: fecha || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd"),
          fechaGasto: fecha || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd"),
          clasificacionOrigen: "Personal",
          tipoGasto: "Actividad Personal",
          tipoEntidad: "Deuda / Cuota",
          idEntidadVinculada: idPlan,
          idPlan: idPlan,
          idDeuda: idPlan,
          idCuota: idPlan,
          idTarea: idPlan,
          idProyecto: "PERSONAL",
          idHito: "",
          concepto: concepto,
          descripcion: concepto,
          categoria: categoria,
          montoOriginal: monto,
          monedaOriginal: "PEN",
          tipoCambio: 1.0,
          montoMonedaBase: monto,
          montoPEN: monto,
          montoUSD: monto > 0 ? monto / 3.76 : 0,
          modalidad: modalidad,
          estado: estado,
          estadoPago: estado,
          metodoPago: metodo,
          comprobanteUrl: compUrl,
          idEventoCalendar: evId
        };

        const filaReparada = FinanzasService.construirFilaGastoDinamica(headers, saneado);
        sheetGastos.getRange(i + 2, 1, 1, filaReparada.length).setValues([filaReparada]);
        filasSanadas++;
      }

      if (filasSanadas > 0) {
        SpreadsheetApp.flush();
        invalidarCacheDashboard();
      }

      return {
        success: true,
        filasSanadas: filasSanadas,
        mensaje: `Se sanearon ${filasSanadas} filas de cuotas en BBDD_Finanzas_Gastos.`
      };
    } catch (err) {
      Logger.log("[sanearCuotasDesfasadas Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eL) { }
    }
  }
};