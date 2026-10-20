/**
 * ============================================================================
 * ARCHIVO: FinanzasAvanzadasService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Motor de Finanzas Personales Avanzadas - Flujo de Caja Proyectado,
 *      Conciliación, Planificador de Cuotas y Métricas Financieras
 * ============================================================================
 */

const FinanzasAvanzadasService = {

  // ============================================================================
  // SECCIÓN 1: FLUJO DE CAJA (Movimientos Proyectados y Reales)
  // ============================================================================

  createMovimiento: function (payload) {
    const tipo = String(payload.tipo || "EGRESO").toUpperCase();
    if (tipo === "INGRESO") {
      return (typeof FinanzasService !== "undefined" && FinanzasService.createIngreso)
        ? FinanzasService.createIngreso(payload)
        : { success: false, error: "FinanzasService no disponible" };
    } else {
      return (typeof FinanzasService !== "undefined" && FinanzasService.createGasto)
        ? FinanzasService.createGasto(payload)
        : { success: false, error: "FinanzasService no disponible" };
    }
  },

  /**
   * updateMovimiento — DEPRECADO. La hoja 'FlujoCaja' ha sido reemplazada por
   * BBDD_Finanzas_Gastos y BBDD_Finanzas_Ingresos. Redirecciona al servicio correcto.
   * @deprecated Usar FinanzasService.updateGasto / FinanzasService.updateIngreso en su lugar.
   */
  updateMovimiento: function (payload) {
    Logger.log("[updateMovimiento DEPRECATED]: La hoja FlujoCaja est\u00e1 deprecada. Use updateGasto/updateIngreso.");
    if (payload.idGasto && typeof FinanzasService !== "undefined" && FinanzasService.updateGasto) {
      return FinanzasService.updateGasto(payload);
    }
    if (payload.idIngreso && typeof FinanzasService !== "undefined" && FinanzasService.updateIngreso) {
      return FinanzasService.updateIngreso(payload);
    }
    return { success: false, error: "updateMovimiento deprecado: proporciona idGasto o idIngreso para redirigir a la entidad correcta." };
  },

  deleteMovimiento: function (payload) {
    Logger.log("[deleteMovimiento]: Redirigiendo a eliminación canónica.");
    const id = String(payload.idMovimiento || payload.idGasto || payload.idIngreso || payload.id || "").trim();
    if (payload.idGasto || id.startsWith("GAS-") || id.startsWith("TRX-") || id.startsWith("CUO-")) {
      if (typeof FinanzasService !== "undefined" && FinanzasService.deleteGasto) {
        return FinanzasService.deleteGasto({ idGasto: id });
      }
    }
    if (payload.idIngreso || id.startsWith("ING-")) {
      if (typeof FinanzasService !== "undefined" && FinanzasService.deleteIngreso) {
        return FinanzasService.deleteIngreso({ idIngreso: id });
      }
    }
    return { success: false, error: "deleteMovimiento deprecado: proporciona idGasto o idIngreso para redirigir a la entidad correcta." };
  },

  /**
   * Conciliar una transacci\u00f3n o movimiento: marca como EJECUTADO/PAGADO,
   * actualiza monto real, fecha, m\u00e9todo de pago, saldo de cuota y Google Calendar.
   * Protegido con LockService y escritura at\u00f3mica (batch) por fila.
   */
  conciliarTransaccion: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const idMov = String(payload.idMovimiento || "").trim();
      const idGasto = String(payload.idGasto || payload.ID_Gasto || "").trim();
      const idIngreso = String(payload.idIngreso || payload.ID_Ingreso || "").trim();
      const montoReal = (payload.montoReal !== undefined && payload.montoReal !== null && payload.montoReal !== "")
        ? parseFloat(payload.montoReal)
        : null;
      const fechaReal = payload.fechaReal || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
      const metodoPago = payload.metodoPago || "";

      let idCuotaAfectada = "";
      let idEventoCalendar = "";
      let montoEfectivo = (montoReal !== null) ? montoReal : 0;

      // Si viene idPlan o idCuota sin idGasto espec\u00edfico, despachar a pagarSiguienteCuota
      if (!idGasto && !idIngreso && !idMov && (payload.idPlan || payload.idCuota || payload.ID_Cuota)) {
        if (typeof FinanzasService !== "undefined" && FinanzasService.pagarSiguienteCuota) {
          return FinanzasService.pagarSiguienteCuota(payload);
        }
      }

      // 1. Si es Gasto (o cuota en BBDD_Finanzas_Gastos) — escritura at\u00f3mica por fila
      if (idGasto) {
        const sheetGastos = (typeof CONFIG !== "undefined" && CONFIG.obtenerHojaGastos) ? CONFIG.obtenerHojaGastos(ss) : (ss.getSheetByName(CONFIG.SHEETS.FINANZAS) || ss.getSheetByName("BBDD_Gastos"));
        if (sheetGastos) {
          const dataG = sheetGastos.getDataRange().getValues();
          const CG = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
            ? FinanzasService.obtenerMapaColumnasGastos(sheetGastos)
            : CONFIG.COLS_FINANZAS;
          for (let i = 1; i < dataG.length; i++) {
            if (String(dataG[i][CG.ID_GASTO]).trim().toUpperCase() === idGasto.toUpperCase()) {
              const rowIdx = i + 1;
              if (montoReal === null) {
                montoEfectivo = parseFloat(dataG[i][CG.MONTO_PEN]) || parseFloat(dataG[i][CG.MONTO_ORIGINAL]) || 0;
              }
              // Mutar en memoria y hacer un \u00fanico commit batch
              const filaG = dataG[i].slice();
              filaG[CG.ESTADO_PAGO] = "Pagado";
              if (CG.ESTADO !== undefined) filaG[CG.ESTADO] = "Pagado";
              if (montoReal !== null) {
                if (CG.MONTO_PEN !== undefined) filaG[CG.MONTO_PEN] = montoReal;
                if (CG.MONTO_ORIGINAL !== undefined) filaG[CG.MONTO_ORIGINAL] = montoReal;
              }
              if (fechaReal && CG.FECHA_GASTO !== undefined) filaG[CG.FECHA_GASTO] = fechaReal;
              if (metodoPago && CG.METODO_PAGO !== undefined) filaG[CG.METODO_PAGO] = metodoPago;
              sheetGastos.getRange(rowIdx, 1, 1, filaG.length).setValues([filaG]);

              if (CG.ID_CUOTA !== undefined) idCuotaAfectada = String(dataG[i][CG.ID_CUOTA] || "").trim();
              if (CG.ID_EVENTO_CALENDAR !== undefined) idEventoCalendar = String(dataG[i][CG.ID_EVENTO_CALENDAR] || "").trim();
              break;
            }
          }
        }
      }

      // 2. Si es Ingreso en BBDD_Finanzas_Ingresos — escritura at\u00f3mica por fila
      if (idIngreso) {
        const sheetIngresos = (typeof CONFIG !== "undefined" && CONFIG.obtenerHojaIngresos) ? CONFIG.obtenerHojaIngresos(ss) : (ss.getSheetByName(CONFIG.SHEETS.INGRESOS) || ss.getSheetByName("BBDD_Ingresos"));
        if (sheetIngresos) {
          const dataI = sheetIngresos.getDataRange().getValues();
          const CI = CONFIG.COLS_INGRESOS;
          for (let i = 1; i < dataI.length; i++) {
            if (String(dataI[i][CI.ID_INGRESO]).trim().toUpperCase() === idIngreso.toUpperCase()) {
              const rowIdx = i + 1;
              if (montoReal === null) {
                montoEfectivo = parseFloat(dataI[i][CI.MONTO_PEN]) || parseFloat(dataI[i][CI.MONTO_ORIGINAL]) || 0;
              }
              // Mutar en memoria y hacer un \u00fanico commit batch
              const filaI = dataI[i].slice();
              if (montoReal !== null) {
                if (CI.MONTO_PEN !== undefined) filaI[CI.MONTO_PEN] = montoReal;
                if (CI.MONTO_ORIGINAL !== undefined) filaI[CI.MONTO_ORIGINAL] = montoReal;
              }
              if (fechaReal && CI.FECHA_INGRESO !== undefined) filaI[CI.FECHA_INGRESO] = fechaReal;
              if (metodoPago && CI.CUENTA_DESTINO !== undefined) filaI[CI.CUENTA_DESTINO] = metodoPago;
              if (CI.ESTADO_COBRO !== undefined) filaI[CI.ESTADO_COBRO] = "Cobrado";
              if (CI.ESTADO !== undefined) filaI[CI.ESTADO] = "Cobrado";
              sheetIngresos.getRange(rowIdx, 1, 1, filaI.length).setValues([filaI]);

              if (CI.ID_EVENTO_CALENDAR !== undefined) idEventoCalendar = String(dataI[i][CI.ID_EVENTO_CALENDAR] || "").trim();
              break;
            }
          }
        }
      }

      // 3. FlujoCaja RETIRADA — Los movimientos proyectados viven y operan
      //    exclusivamente en memoria desde BBDD_Finanzas_Gastos e BBDD_Finanzas_Ingresos.

      // 4. Si la transacci\u00f3n pertenece a un plan de cuotas, actualizar avance del cr\u00e9dito
      if (idCuotaAfectada) {
        FinanzasAvanzadasService._actualizarProgresoCuota(idCuotaAfectada, montoEfectivo);
      }

      // 5. Gobernanza Google Calendar: actualizar t\u00edtulo a \u2705 [PAGADO] / \u2705 [COBRADO]
      if (idEventoCalendar && typeof CalendarService !== "undefined" && CalendarService.actualizarConciliacionEventoCalendar) {
        try {
          const tipoEnt = idIngreso ? "INGRESO" : "GASTO";
          CalendarService.actualizarConciliacionEventoCalendar(idEventoCalendar, tipoEnt, true);
        } catch (eCal) {
          Logger.log("[conciliarTransaccion Calendar Error]: " + eCal.message);
        }
      }

      invalidarCacheDashboard();
      return {
        success: true,
        idGasto: idGasto,
        idIngreso: idIngreso,
        idMovimiento: idMov,
        montoReal: montoEfectivo,
        fechaReal: fechaReal
      };
    } catch (err) {
      Logger.log("[conciliarTransaccion Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  /**
   * Alias de compatibilidad previa para conciliarMovimiento
   */
  conciliarMovimiento: function (payload) {
    return FinanzasAvanzadasService.conciliarTransaccion(payload);
  },

  /**
   * desconciliarMovimiento — DEPRECADO. La hoja 'FlujoCaja' est\u00e1 deprecada.
   * @deprecated No tiene efecto sobre las hojas activas. Usar updateGasto/updateIngreso.
   */
  desconciliarMovimiento: function (payload) {
    Logger.log("[desconciliarMovimiento DEPRECATED]: La hoja FlujoCaja est\u00e1 deprecada. Use updateGasto/updateIngreso para revertir estados.");
    return { success: false, error: "desconciliarMovimiento deprecado: la hoja FlujoCaja ya no se utiliza. Use FinanzasService.updateGasto o updateIngreso para revertir el estado." };
  },

  // ============================================================================
  // SECCIÓN 2: PLANES DE CUOTAS (Compras a Plazos)
  // ============================================================================

  createPlanCuotas: function (payload) {
    if (typeof FinanzasService !== "undefined" && FinanzasService.crearGastoEnCuotas) {
      return FinanzasService.crearGastoEnCuotas(payload);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEETS.CUOTAS);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.CUOTAS);
      sheet.appendRow([
        "ID_Cuota", "Nombre_Plan", "Descripcion", "Monto_Total", "Cuota_Inicial",
        "Num_Cuotas", "Monto_Cuota", "Tasa_Interes", "Tipo_Tasa", "Fecha_Inicio",
        "Dia_Pago", "Cuotas_Pagadas", "Monto_Pagado", "Saldo_Pendiente", "Estado",
        "Categoria", "Metodo_Pago", "Entidad_Financiera", "Notas", "Fecha_Creacion"
      ]);
    }

    const idCuota = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarCorrelativo)
      ? CorrelativoService.generarCorrelativo("CUO")
      : "CUO-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMddHHmmss");

    const montoTotal = parseFloat(payload.montoTotal) || 0;
    const cuotaInicial = parseFloat(payload.cuotaInicial) || 0;
    const numCuotas = parseInt(payload.numCuotas) || 12;
    const tasaInteres = parseFloat(payload.tasaInteres) || 0;
    const tipoTasa = (payload.tipoTasa || "SIN_INTERES").toUpperCase();

    // Calcular monto de cuota
    let montoCuota = parseFloat(payload.montoCuota) || 0;
    if (montoCuota <= 0) {
      const capitalFinanciar = montoTotal - cuotaInicial;
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

    const saldoPendiente = (montoCuota * numCuotas);
    const fechaInicio = payload.fechaInicio || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

    const C = CONFIG.COLS_CUOTAS;
    const newRow = new Array(20).fill("");
    newRow[C.ID_CUOTA] = idCuota;
    newRow[C.NOMBRE_PLAN] = payload.nombrePlan || "";
    newRow[C.DESCRIPCION] = payload.descripcion || "";
    newRow[C.MONTO_TOTAL] = montoTotal;
    newRow[C.CUOTA_INICIAL] = cuotaInicial;
    newRow[C.NUM_CUOTAS] = numCuotas;
    newRow[C.MONTO_CUOTA] = montoCuota;
    newRow[C.TASA_INTERES] = tasaInteres;
    newRow[C.TIPO_TASA] = tipoTasa;
    newRow[C.FECHA_INICIO] = fechaInicio;
    newRow[C.DIA_PAGO] = parseInt(payload.diaPago) || 15;
    newRow[C.CUOTAS_PAGADAS] = 0;
    newRow[C.MONTO_PAGADO] = cuotaInicial;
    newRow[C.SALDO_PENDIENTE] = saldoPendiente;
    newRow[C.ESTADO] = "ACTIVO";
    newRow[C.CATEGORIA] = payload.categoria || "OTRO";
    newRow[C.METODO_PAGO] = payload.metodoPago || "Transferencia_Bancaria";
    newRow[C.ENTIDAD_FINANCIERA] = payload.entidadFinanciera || "";
    newRow[C.NOTAS] = payload.notas || "";
    newRow[C.FECHA_CREACION] = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow(newRow);

    // Generar movimientos proyectados en flujo de caja y gastos programados de forma segura y en lote
    FinanzasAvanzadasService._generarMovimientosCuota(
      idCuota,
      payload.nombrePlan || "Cuota",
      fechaInicio,
      parseInt(payload.diaPago) || 15,
      numCuotas,
      montoCuota,
      payload.entidadFinanciera || "",
      payload.categoria || "Cuota_Credito",
      payload.metodoPago || "Transferencia_Bancaria"
    );

    invalidarCacheDashboard();
    return { success: true, idCuota: idCuota, montoCuota: montoCuota, saldoPendiente: saldoPendiente };
  },

  updatePlanCuotas: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.CUOTAS);
    if (!sheet) return { success: false, error: "Hoja de cuotas no encontrada" };

    const data = sheet.getDataRange().getValues();
    const idBuscado = String(payload.idCuota || "").trim();
    let rowIdx = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][CONFIG.COLS_CUOTAS.ID_CUOTA]).trim() === idBuscado) {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: "Plan de cuotas no encontrado: " + idBuscado };

    const C = CONFIG.COLS_CUOTAS;
    if (payload.nombrePlan) sheet.getRange(rowIdx, C.NOMBRE_PLAN + 1).setValue(payload.nombrePlan);
    if (payload.descripcion !== undefined) sheet.getRange(rowIdx, C.DESCRIPCION + 1).setValue(payload.descripcion);
    if (payload.estado) sheet.getRange(rowIdx, C.ESTADO + 1).setValue(payload.estado);
    if (payload.notas !== undefined) sheet.getRange(rowIdx, C.NOTAS + 1).setValue(payload.notas);
    if (payload.entidadFinanciera) sheet.getRange(rowIdx, C.ENTIDAD_FINANCIERA + 1).setValue(payload.entidadFinanciera);

    invalidarCacheDashboard();
    return { success: true, idCuota: idBuscado };
  },

  deletePlanCuotas: function (payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetName = (CONFIG.SHEETS && CONFIG.SHEETS.CUOTAS) ? CONFIG.SHEETS.CUOTAS : "BBDD_Finanzas_Cuotas";
      const sheet = ss.getSheetByName(sheetName);

      const idCuota = String(payload.idCuota || "").trim();
      if (!idCuota) return { success: false, error: "ID_Cuota requerido" };

      // Eliminar cuotas y movimientos proyectados asociados a esta cuota en BBDD_Finanzas_Gastos
      this._eliminarMovimientosCuota(idCuota);

      // Si existe residualmente la hoja física, depurar la fila
      if (sheet && sheet.getLastRow() > 1) {
        sobrescribirHojaFiltrada(sheet, function (row) {
          return String(row[0] || "").trim().toUpperCase() !== idCuota.toUpperCase();
        });
      }

      SpreadsheetApp.flush();
      invalidarCacheDashboard();
      return { success: true, idCuota: idCuota };
    } catch (err) {
      Logger.log("[deletePlanCuotas Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  // ============================================================================
  // SECCIÓN 3: MÉTRICAS FINANCIERAS AVANZADAS
  // ============================================================================

  calcularMetricasAvanzadas: function (payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const leerHoja = (nombre) => {
      if (!nombre) return [];
      const hoja = ss.getSheetByName(nombre);
      if (!hoja) return [];
      const lastRow = hoja.getLastRow();
      const lastCol = hoja.getLastColumn();
      if (lastRow <= 1 || lastCol === 0) return [];
      return hoja.getRange(2, 1, lastRow - 1, lastCol).getValues();
    };

    const hoy = new Date();
    const hoyStr = Utilities.formatDate(hoy, (CONFIG && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima", "yyyy-MM-dd");

    // Leer colecciones activas canónicas
    const ingresos = leerHoja(CONFIG.SHEETS.INGRESOS);
    const gastos = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerHojaGastos)
      ? (() => {
          const hg = FinanzasService.obtenerHojaGastos(ss);
          if (!hg || hg.getLastRow() <= 1) return [];
          return hg.getRange(2, 1, hg.getLastRow() - 1, hg.getLastColumn()).getValues();
        })()
      : leerHoja(CONFIG.SHEETS.FINANZAS);

    // Calcular saldos reales y proyectados
    let totalIngresosReales = 0;
    let totalEgresosReales = 0;
    let totalIngresosProyectados = 0;
    let totalEgresosProyectados = 0;
    let movimientosPendientes = 0;
    let movimientosConciliados = 0;
    const recordatorios = [];

    const CI = (CONFIG && CONFIG.COLS_INGRESOS) ? CONFIG.COLS_INGRESOS : {
      ID_INGRESO: 0, FECHA_INGRESO: 3, DESCRIPCION_INGRESO: 4,
      MONTO_ORIGINAL: 7, MONTO_PEN: 9, ESTADO_COBRO: 11
    };

    let sumaIngMensual = 0;
    const mesesConIngreso = {};

    for (let i = 0; i < ingresos.length; i++) {
      const r = ingresos[i];
      const colMontoPEN = (CI.MONTO_PEN !== undefined) ? CI.MONTO_PEN : 9;
      const colMontoOrig = (CI.MONTO_ORIGINAL !== undefined) ? CI.MONTO_ORIGINAL : 7;
      const colEstado = (CI.ESTADO_COBRO !== undefined) ? CI.ESTADO_COBRO : 11;
      const colFecha = (CI.FECHA_INGRESO !== undefined) ? CI.FECHA_INGRESO : 3;
      const colDesc = (CI.DESCRIPCION_INGRESO !== undefined) ? CI.DESCRIPCION_INGRESO : 4;
      const colId = (CI.ID_INGRESO !== undefined) ? CI.ID_INGRESO : 0;

      const monto = parseFloat(r[colMontoPEN]) || parseFloat(r[colMontoOrig]) || 0;
      const estado = String(r[colEstado] || "").toUpperCase();
      const fecha = String(r[colFecha] || "").trim();
      const isCobrado = estado.includes("COBRAD") || estado.includes("PAGAD") || estado.includes("EJECUTAD") || estado.includes("REAL");

      if (isCobrado) {
        totalIngresosReales += monto;
        movimientosConciliados++;
      } else {
        totalIngresosProyectados += monto;
        movimientosPendientes++;
        if (fecha && fecha < hoyStr) {
          recordatorios.push({
            tipo: "MOVIMIENTO_VENCIDO",
            urgencia: "MEDIA",
            titulo: "Ingreso sin cobrar/conciliar",
            detalle: String(r[colDesc] || "Ingreso pendiente") + " — S/ " + monto.toFixed(2),
            idMovimiento: String(r[colId] || "")
          });
        }
      }

      sumaIngMensual += monto;
      if (fecha) {
        const parts = fecha.split("-");
        if (parts.length >= 2) mesesConIngreso[parts[0] + "-" + parts[1]] = true;
      }
    }

    const CG = (CONFIG && CONFIG.COLS_FINANZAS) ? CONFIG.COLS_FINANZAS : {
      ID_GASTO: 0, ID_CUOTA: 3, FECHA_GASTO: 4, DESCRIPCION_GASTO: 5,
      MONTO_ORIGINAL: 8, MONTO_PEN: 10, ESTADO_PAGO: 12
    };

    // Cuotas activas consolidadas exclusivamente desde BBDD_Finanzas_Gastos
    const planesMap = {};

    for (let i = 0; i < gastos.length; i++) {
      const r = gastos[i];
      const colMontoPEN = (CG.MONTO_PEN !== undefined) ? CG.MONTO_PEN : 10;
      const colMontoOrig = (CG.MONTO_ORIGINAL !== undefined) ? CG.MONTO_ORIGINAL : 8;
      const colEstado = (CG.ESTADO_PAGO !== undefined) ? CG.ESTADO_PAGO : 12;
      const colFecha = (CG.FECHA_GASTO !== undefined) ? CG.FECHA_GASTO : 4;
      const colDesc = (CG.DESCRIPCION_GASTO !== undefined) ? CG.DESCRIPCION_GASTO : 5;
      const colId = (CG.ID_GASTO !== undefined) ? CG.ID_GASTO : 0;
      const colCuota = (CG.ID_CUOTA !== undefined) ? CG.ID_CUOTA : 3;

      const monto = parseFloat(r[colMontoPEN]) || parseFloat(r[colMontoOrig]) || 0;
      const estado = String(r[colEstado] || "").toUpperCase();
      const fecha = String(r[colFecha] || "").trim();
      const idCuota = String(r[colCuota] || "").trim();
      const isPagado = estado.includes("PAGAD") || estado.includes("EJECUTAD") || estado.includes("REAL");

      if (isPagado) {
        totalEgresosReales += monto;
        movimientosConciliados++;
      } else {
        totalEgresosProyectados += monto;
        movimientosPendientes++;
        if (fecha && fecha < hoyStr) {
          recordatorios.push({
            tipo: "MOVIMIENTO_VENCIDO",
            urgencia: "MEDIA",
            titulo: "Gasto sin conciliar/pagar",
            detalle: String(r[colDesc] || "Gasto programado") + " — S/ " + monto.toFixed(2),
            idMovimiento: String(r[colId] || "")
          });
        }
      }

      // Agrupación para Cuotas
      if (idCuota) {
        if (!planesMap[idCuota]) {
          planesMap[idCuota] = {
            idCuota: idCuota,
            nombre: String(r[colDesc] || idCuota),
            montoTotal: 0,
            montoPagado: 0,
            saldoPendiente: 0,
            cuotasTotales: 0,
            cuotasPagadas: 0,
            cuotaMensual: 0,
            proximaFecha: "",
            diasParaVencer: 30,
            atrasada: false
          };
        }
        const plan = planesMap[idCuota];
        plan.cuotasTotales++;
        plan.montoTotal += monto;
        plan.cuotaMensual = monto;
        if (isPagado) {
          plan.cuotasPagadas++;
          plan.montoPagado += monto;
        } else {
          plan.saldoPendiente += monto;
          if (fecha && (!plan.proximaFecha || fecha < plan.proximaFecha)) {
            plan.proximaFecha = fecha;
          }
          if (fecha && fecha < hoyStr) {
            plan.atrasada = true;
          }
        }
      }
    }

    let totalCuotasActivas = 0;
    let totalCompromisoMensual = 0;
    let totalDeudaTotal = 0;
    const cuotasProximas = [];

    Object.keys(planesMap).forEach(function (idC) {
      const p = planesMap[idC];
      if (p.saldoPendiente > 0) {
        totalCuotasActivas++;
        totalCompromisoMensual += p.cuotaMensual;
        totalDeudaTotal += p.saldoPendiente;

        let diasParaVencer = 30;
        if (p.proximaFecha) {
          const fVenc = new Date(p.proximaFecha + "T00:00:00");
          if (!isNaN(fVenc.getTime())) {
            diasParaVencer = Math.max(0, Math.ceil((fVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }
        p.diasParaVencer = diasParaVencer;

        const cuotaObj = {
          idCuota: p.idCuota,
          nombre: p.nombre,
          montoCuota: p.cuotaMensual,
          diaPago: 15,
          diasParaVencer: diasParaVencer,
          cuotasPagadas: p.cuotasPagadas,
          totalCuotas: p.cuotasTotales,
          estado: p.atrasada ? "ATRASADO" : "ACTIVO"
        };
        cuotasProximas.push(cuotaObj);

        if (diasParaVencer <= 7) {
          recordatorios.push({
            tipo: "CUOTA_PROXIMA",
            urgencia: diasParaVencer <= 2 ? "CRITICA" : "ALTA",
            titulo: "Cuota próxima: " + p.nombre,
            detalle: "Vence en " + diasParaVencer + " día(s) — S/ " + p.cuotaMensual.toFixed(2),
            idCuota: p.idCuota
          });
        }
        if (p.atrasada) {
          recordatorios.push({
            tipo: "CUOTA_ATRASADA",
            urgencia: "CRITICA",
            titulo: "¡Cuota atrasada! " + p.nombre,
            detalle: "Cuota " + p.cuotasPagadas + "/" + p.cuotasTotales + " — S/ " + p.cuotaMensual.toFixed(2),
            idCuota: p.idCuota
          });
        }
      }
    });

    cuotasProximas.sort(function (a, b) { return a.diasParaVencer - b.diasParaVencer; });

    const numMeses = Math.max(Object.keys(mesesConIngreso).length, 1);
    const ingresoPromedioMensual = sumaIngMensual / numMeses;

    const ratioDeudaIngreso = ingresoPromedioMensual > 0
      ? (totalCompromisoMensual / ingresoPromedioMensual) * 100
      : 0;

    const capacidadPagoMensual = ingresoPromedioMensual - totalCompromisoMensual;

    return {
      success: true,
      data: {
        totalIngresosProyectados: Math.round(totalIngresosProyectados * 100) / 100,
        totalIngresosReales: Math.round(totalIngresosReales * 100) / 100,
        totalEgresosProyectados: Math.round(totalEgresosProyectados * 100) / 100,
        totalEgresosReales: Math.round(totalEgresosReales * 100) / 100,
        balanceProyectado: Math.round((totalIngresosProyectados - totalEgresosProyectados) * 100) / 100,
        balanceReal: Math.round((totalIngresosReales - totalEgresosReales) * 100) / 100,
        desviacion: Math.round((totalIngresosReales - totalEgresosReales - (totalIngresosProyectados - totalEgresosProyectados)) * 100) / 100,
        movimientosPendientes: movimientosPendientes,
        movimientosConciliados: movimientosConciliados,
        tasaConciliacion: (movimientosPendientes + movimientosConciliados) > 0
          ? Math.round(movimientosConciliados / (movimientosPendientes + movimientosConciliados) * 100)
          : 0,
        totalCuotasActivas: totalCuotasActivas,
        totalCompromisoMensual: Math.round(totalCompromisoMensual * 100) / 100,
        totalDeudaTotal: Math.round(totalDeudaTotal * 100) / 100,
        cuotasProximas: cuotasProximas.slice(0, 5),
        ingresoPromedioMensual: Math.round(ingresoPromedioMensual * 100) / 100,
        ratioDeudaIngreso: Math.round(ratioDeudaIngreso * 10) / 10,
        capacidadPagoMensual: Math.round(capacidadPagoMensual * 100) / 100,
        recordatorios: recordatorios,
        totalRecordatorios: recordatorios.length
      }
    };
  },

  // ============================================================================
  // SECCIÓN 4: FUNCIONES INTERNAS (HELPER)
  // ============================================================================

  /**
   * Genera cuotas individuales como "Gastos Programados" en BBDD_Finanzas_Gastos,
   * agendando automáticamente recordatorios en el Calendario Dedicado de Gastos.
   */
  _generarMovimientosCuota: function (idCuota, nombrePlan, fechaInicio, diaPago, numCuotas, montoCuota, entidad, categoria, metodoPago) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetGastos = (typeof CONFIG !== "undefined" && CONFIG.obtenerHojaGastos) ? CONFIG.obtenerHojaGastos(ss) : (ss.getSheetByName(CONFIG.SHEETS.FINANZAS) || ss.getSheetByName("BBDD_Gastos"));

    const parts = String(fechaInicio).split(/[\sT-]/);
    let anio = parseInt(parts[0], 10) || new Date().getFullYear();
    let mes = parseInt(parts[1], 10) || (new Date().getMonth() + 1);

    const filasGastos = [];
    const diaDeseado = parseInt(diaPago, 10) || 15;
    const catFinal = categoria || "Deudas / Servicios Financieros";
    const entFinal = entidad || "Entidad Bancaria";
    const metFinal = metodoPago || "Transferencia_Bancaria";

    for (let i = 1; i <= numCuotas; i++) {
      const diasEnEsteMes = new Date(anio, mes, 0).getDate();
      const diaEfectivo = Math.min(diaDeseado, diasEnEsteMes);

      const fechaCuota = anio + "-" + String(mes).padStart(2, "0") + "-" + String(diaEfectivo).padStart(2, "0");
      const idGasto = "GAS-" + idCuota + "-" + String(i).padStart(3, "0");
      const descripcionCuota = `${nombrePlan} (${entFinal}) — Cuota ${i}/${numCuotas}`;

      // 1. Agendar en Google Calendar Dedicado de Gastos ("PMO - Gastos Programados")
      let eventId = "";
      try {
        if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaGasto) {
          const calRes = CalendarService.sincronizarFilaGasto(null, {
            idGasto: idGasto,
            descripcion: descripcionCuota,
            fechaGasto: fechaCuota,
            montoPen: montoCuota,
            estadoPago: "Pendiente / Programado",
            categoria: catFinal
          });
          if (calRes && calRes.eventId) eventId = calRes.eventId;
        }
      } catch (eCal) {
        Logger.log("[_generarMovimientosCuota Calendar Error]: " + eCal.message);
      }

      // 2. Fila para BBDD_Finanzas_Gastos ("Gastos Programados" vinculados al crédito)
      if (sheetGastos) {
        if (typeof FinanzasService !== "undefined" && FinanzasService.construirFilaGastoDinamica) {
          const rowG = FinanzasService.construirFilaGastoDinamica(sheetGastos, {
            idTransaccion: idGasto,
            idGasto: idGasto,
            fechaRegistro: fechaCuota,
            fechaGasto: fechaCuota,
            fechaCompromiso: fechaCuota,
            clasificacionOrigen: "Personal",
            tipoGasto: "Actividad Personal",
            tipoEntidad: "Deuda / Cuota",
            idEntidadVinculada: idCuota,
            idPlan: idCuota,
            idDeuda: idCuota,
            idCuota: idCuota,
            idTarea: idCuota,
            idProyecto: "PERSONAL",
            concepto: descripcionCuota,
            descripcion: descripcionCuota,
            categoria: catFinal,
            montoOriginal: montoCuota,
            monedaOriginal: "PEN",
            tipoCambio: 1,
            montoMonedaBase: montoCuota,
            montoPEN: montoCuota,
            montoUSD: montoCuota / 3.76,
            modalidad: "Programado / Proyectado",
            estado: "Pendiente / Programado",
            estadoPago: "Pendiente / Programado",
            metodoPago: metFinal,
            idEventoCalendar: eventId
          });
          filasGastos.push(rowG);
        } else {
          const colMapG = CONFIG.COLS_FINANZAS;
          const totalColsG = Math.max(sheetGastos.getLastColumn(), 19);
          const rowG = new Array(totalColsG).fill("");
          rowG[colMapG.ID_GASTO] = idGasto;
          rowG[colMapG.ID_PROYECTO] = "PERSONAL";
          rowG[colMapG.FECHA_GASTO] = fechaCuota;
          rowG[colMapG.DESCRIPCION] = descripcionCuota;
          rowG[colMapG.CATEGORIA] = catFinal;
          rowG[colMapG.MONEDA_ORIGINAL] = "PEN";
          rowG[colMapG.MONTO_ORIGINAL] = montoCuota;
          rowG[colMapG.TIPO_CAMBIO] = 1;
          rowG[colMapG.MONTO_PEN] = montoCuota;
          rowG[colMapG.METODO_PAGO] = metFinal;
          rowG[colMapG.ESTADO_PAGO] = "Pendiente / Programado";
          filasGastos.push(rowG);
        }
      }

      // Gobernanza: Crear Google Task para cada cuota programada futura
      try {
        if (typeof GoogleTasksService !== "undefined" && GoogleTasksService.crearTaskGastoCuota) {
          GoogleTasksService.crearTaskGastoCuota({
            descripcion: descripcionCuota,
            moneda: "PEN",
            monto: montoCuota,
            fechaLimite: fechaCuota,
            notas: "Plan: " + nombrePlan + "\nID Cuota: " + idCuota + "\nEntidad: " + entFinal
          });
        }
      } catch (eTask) {
        Logger.log("[_generarMovimientosCuota GoogleTask Error]: " + eTask.message);
      }

      // Avanzar al siguiente mes
      mes++;
      if (mes > 12) {
        mes = 1;
        anio++;
      }
    }

    // Inserción masiva en Gastos Programados
    if (sheetGastos && filasGastos.length > 0) {
      const lastRowG = sheetGastos.getLastRow();
      sheetGastos.getRange(lastRowG + 1, 1, filasGastos.length, filasGastos[0].length).setValues(filasGastos);
    }
  },

  /**
   * Actualiza el progreso de un plan de cuotas tras una conciliaci\u00f3n.
   * Escritura at\u00f3mica batch: una sola llamada setValues por fila.
   */
  _actualizarProgresoCuota: function (idCuota, montoPagado) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.CUOTAS);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const CC = CONFIG.COLS_CUOTAS;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][CC.ID_CUOTA]).trim() === idCuota) {
        const rowIdx = i + 1;
        const cuotasPagadasPrev = parseInt(data[i][CC.CUOTAS_PAGADAS]) || 0;
        const montoPagadoPrev = parseFloat(data[i][CC.MONTO_PAGADO]) || 0;
        const numCuotas = parseInt(data[i][CC.NUM_CUOTAS]) || 1;
        const montoCuota = parseFloat(data[i][CC.MONTO_CUOTA]) || 0;

        const nuevasCuotasPagadas = cuotasPagadasPrev + 1;
        const nuevoMontoPagado = montoPagadoPrev + montoPagado;
        const nuevoSaldoPendiente = Math.max(0, (numCuotas - nuevasCuotasPagadas) * montoCuota);

        // Mutar en memoria y commit at\u00f3mico batch
        const filaActualizada = data[i].slice();
        filaActualizada[CC.CUOTAS_PAGADAS] = nuevasCuotasPagadas;
        filaActualizada[CC.MONTO_PAGADO] = Math.round(nuevoMontoPagado * 100) / 100;
        filaActualizada[CC.SALDO_PENDIENTE] = Math.round(nuevoSaldoPendiente * 100) / 100;
        if (nuevasCuotasPagadas >= numCuotas) {
          filaActualizada[CC.ESTADO] = "COMPLETADO";
        }
        sheet.getRange(rowIdx, 1, 1, filaActualizada.length).setValues([filaActualizada]);
        break;
      }
    }
  },

  /**
   * Elimina todos los movimientos de gastos asociados a una cuota en BBDD_Finanzas_Gastos,
   * y remueve sus eventos de Google Calendar.
   */
  _eliminarMovimientosCuota: function (idCuota) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Eliminar de BBDD_Finanzas_Gastos
    const sheetGastos = (typeof CONFIG !== "undefined" && CONFIG.obtenerHojaGastos) ? CONFIG.obtenerHojaGastos(ss) : (ss.getSheetByName(CONFIG.SHEETS.FINANZAS) || ss.getSheetByName("BBDD_Gastos"));
    if (sheetGastos && sheetGastos.getLastRow() > 1) {
      const dataG = sheetGastos.getRange(2, 1, sheetGastos.getLastRow() - 1, sheetGastos.getLastColumn()).getValues();
      const CG = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
        ? FinanzasService.obtenerMapaColumnasGastos(sheetGastos)
        : CONFIG.COLS_FINANZAS;
      for (let i = 0; i < dataG.length; i++) {
        const idG = String(dataG[i][CG.ID_GASTO] || "").trim();
        const idC = (CG.ID_CUOTA !== undefined) ? String(dataG[i][CG.ID_CUOTA] || "").trim() : "";
        if (idC === idCuota || idG.startsWith("GAS-" + idCuota)) {
          const evIdG = (CG.ID_EVENTO_CALENDAR !== undefined) ? String(dataG[i][CG.ID_EVENTO_CALENDAR] || "").trim() : "";
          if (evIdG && typeof CalendarService !== "undefined") {
            try { CalendarService.eliminarEventoCalendar(evIdG, "GASTO"); } catch (e) { }
          }
        }
      }
      sobrescribirHojaFiltrada(sheetGastos, function (row) {
        const idG = String(row[CG.ID_GASTO] || "").trim();
        const idC = (CG.ID_CUOTA !== undefined) ? String(row[CG.ID_CUOTA] || "").trim() : "";
        return !(idC === idCuota || idG.startsWith("GAS-" + idCuota));
      });
    }
  }
};