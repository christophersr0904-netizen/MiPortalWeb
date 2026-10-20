/**
 * ============================================================================
 * ARCHIVO: ProyectosService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Gestión de Iniciativas, Salud, Ciclo de Vida y Autocompletado IA
 * ============================================================================
 */

const ProyectosService = {

  obtenerMapaColumnasProyectos: function(sheet) {
    return (typeof CONFIG !== "undefined" && CONFIG.obtenerMapaProyectos)
      ? CONFIG.obtenerMapaProyectos(sheet)
      : CONFIG.COLS_PROYECTOS;
  },

  createProyecto: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tipo = payload.tipoIniciativa || "Profesional";
    const magnitudComplejidad = payload.magnitudComplejidad || payload.categoriaTShirt || "M-Medium";
    const arquetipoProyecto = payload.arquetipoProyecto || payload.criterioDominante || "I-Impacto";
    const estado = payload.estadoProyecto || "01_Backlog";

    const idProyecto = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdProyecto)
      ? CorrelativoService.generarIdProyecto()
      : "PRO-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmm");

    const sheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
    const colMap = ProyectosService.obtenerMapaColumnasProyectos(sheet);

    let faseDerivada = "Iniciacion";
    if (estado === "02_Planificado") faseDerivada = "Planificacion";
    else if (estado === "03_En_Ejecucion") faseDerivada = "Ejecucion";
    else if (estado === "04_En_Pausa") faseDerivada = "Control";
    else if (estado === "06_Cerrado") faseDerivada = "Cierre";

    let frecNorm = String(payload.frecuenciaControl || "Semanal").trim();
    if (/diari/i.test(frecNorm)) frecNorm = "Diario";
    else if (/quincen/i.test(frecNorm)) frecNorm = "Quincenal";
    else if (/mensu/i.test(frecNorm)) frecNorm = "Mensual";
    else frecNorm = "Semanal";

    const newRow = new Array(colMap.MAX_COLUMNS || 20).fill("");
    newRow[colMap.ID_PROYECTO] = idProyecto;
    newRow[colMap.NOMBRE] = payload.nombreProyecto || "";
    newRow[colMap.TIPO] = tipo;
    const idxMag = colMap.MAGNITUD_COMPLEJIDAD !== undefined ? colMap.MAGNITUD_COMPLEJIDAD : colMap.TSHIRT;
    newRow[idxMag] = magnitudComplejidad;
    const idxArq = colMap.ARQUETIPO_PROYECTO !== undefined ? colMap.ARQUETIPO_PROYECTO : colMap.CRITERIO;
    newRow[idxArq] = arquetipoProyecto;
    newRow[colMap.ESTADO] = estado;
    const idxHealth = colMap.HEALTH_STATUS !== undefined ? colMap.HEALTH_STATUS : colMap.HEALTH;
    if (idxHealth !== undefined) newRow[idxHealth] = "🟢 Saludable";

    // Regla WBS v4.1: Protección de campos calculados por backend (Col H, Col Q, Col R) contra sobreescritura estática
    const idxAvance = colMap.AVANCE_REAL_PCT !== undefined ? colMap.AVANCE_REAL_PCT : colMap.AVANCE;
    if (idxAvance !== undefined) newRow[idxAvance] = "";

    const idxObj = colMap.ENTREGABLE_OBJETO !== undefined ? colMap.ENTREGABLE_OBJETO : colMap.OBJETO;
    if (idxObj !== undefined) newRow[idxObj] = payload.entregableTangibleObjeto || payload.entregableTangible || payload.objeto || "";

    const idxOkr = colMap.NORTH_STAR_OKR !== undefined ? colMap.NORTH_STAR_OKR : colMap.OKR;
    if (idxOkr !== undefined) newRow[idxOkr] = payload.northStarOKR || payload.okr || "";

    const idxDod = colMap.CRITERIOS_DOD !== undefined ? colMap.CRITERIOS_DOD : colMap.DOD;
    if (idxDod !== undefined) newRow[idxDod] = payload.criteriosAceptacionDoD || payload.criteriosDoD || payload.dod || "";

    if (colMap.ULTIMA_REVISION !== undefined) {
      newRow[colMap.ULTIMA_REVISION] = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    }

    if (colMap.FECHA_INICIO_PLAN !== undefined) newRow[colMap.FECHA_INICIO_PLAN] = payload.fechaInicioPlan || "";
    if (colMap.FECHA_FIN_PLAN !== undefined) newRow[colMap.FECHA_FIN_PLAN] = payload.fechaFinPlan || "";
    if (colMap.MONEDA_BASE !== undefined) newRow[colMap.MONEDA_BASE] = payload.monedaBase || "PEN";
    if (colMap.PRESUPUESTO_TOPE !== undefined) newRow[colMap.PRESUPUESTO_TOPE] = parseFloat(payload.presupuestoTope) || 0;

    const idxPen = colMap.COSTO_EJECUTADO_PEN !== undefined ? colMap.COSTO_EJECUTADO_PEN : colMap.COSTO_REAL_PEN;
    if (idxPen !== undefined) newRow[idxPen] = "";

    const idxUsd = colMap.COSTO_EJECUTADO_USD !== undefined ? colMap.COSTO_EJECUTADO_USD : colMap.COSTO_REAL_USD;
    if (idxUsd !== undefined) newRow[idxUsd] = "";

    const idxTerc = colMap.TERCEROS_INVOLUCRADOS !== undefined ? colMap.TERCEROS_INVOLUCRADOS : colMap.TERCEROS;
    if (idxTerc !== undefined) newRow[idxTerc] = payload.tercerosInvolucrados || "";

    const idxDrive = colMap.ALCANCE_URL_DRIVE !== undefined ? colMap.ALCANCE_URL_DRIVE : colMap.URL_DRIVE;
    if (idxDrive !== undefined) newRow[idxDrive] = payload.urlDrive || payload.URL_Carpeta_Drive || payload.alcanceDetalladoUrlDrive || "";

    sheet.appendRow(newRow);
    invalidarCacheDashboard();

    // =========================================================================
    // SIEMBRA AUTOMÁTICA DE FASES Y ELEMENTOS WBS POR DEFECTO (WBS v4.1)
    // =========================================================================
    try {
      const sheetHitos = ss.getSheetByName(CONFIG.SHEETS.HITOS);
      if (sheetHitos) {
        const colMapH = (typeof HitosService !== "undefined" && HitosService.obtenerMapaColumnasHitos)
          ? HitosService.obtenerMapaColumnasHitos(sheetHitos)
          : CONFIG.COLS_HITOS;

        const flagsObj = ProyectosService.evaluarFeatureFlagsProyecto(arquetipoProyecto, magnitudComplejidad);
        const isLight = flagsObj.magnitud === "Light";
        const canonicalArq = flagsObj.arquetipo;
        const fechaFinDef = payload.fechaFinPlan || "";
        const fechaHoy = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

        let elementosSemilla = [];

        if (isLight) {
          // PROYECTOS LIGHT: Ciclo simplificado directo sin burocracia
          elementosSemilla.push({
            tipo: "PAQUETE_TRABAJO",
            wbsCode: "1.1",
            fase: "Fase 1: Entregables Principales",
            nombre: "WP-001: Ejecución y Entregables",
            peso: 1.0,
            presupuesto: parseFloat(payload.presupuestoTope) || 0,
            dod: payload.criteriosAceptacionDoD || "Cumplimiento del objeto y entregables definidos."
          });
        } else {
          // PROYECTOS MEDIUM / HEAVY: Ciclo canónico según Arquetipo
          if (canonicalArq === "1_Infraestructura") {
            elementosSemilla = [
              { tipo: "PAQUETE_TRABAJO", wbsCode: "1.1", fase: "Fase 1: Diseño e Ingeniería", nombre: "Ingeniería de Detalle y Especificaciones", peso: 0.20, dod: "Planos y especificaciones técnicas aprobadas." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "2.1", fase: "Fase 2: Procura y Suministros", nombre: "Adquisición de Insumos y Equipos", peso: 0.25, dod: "Órdenes de compra y suministros en sitio." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "3.1", fase: "Fase 3: Construcción y Montaje", nombre: "Ejecución de Obra / Instalación", peso: 0.35, dod: "Construcción culminada según norma técnica." },
              { tipo: "HITO_MARCADOR", wbsCode: "4.1", fase: "Fase 4: Puesta en Marcha y Cierre", nombre: "Hito de Entrega y Acta de Aceptación", peso: 0.20, dod: "Acta de conformidad firmada y garantías vigentes." }
            ];
          } else if (canonicalArq === "2_Venture") {
            elementosSemilla = [
              { tipo: "PAQUETE_TRABAJO", wbsCode: "1.1", fase: "Fase 1: Ideación y Descubrimiento", nombre: "Validación de Hipótesis y Arquitectura", peso: 0.25, dod: "User journeys y prototipo wireframe validados." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "2.1", fase: "Fase 2: Desarrollo MVP", nombre: "Construcción de Funcionalidades Core", peso: 0.45, dod: "MVP desplegado y operativo en producción." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "3.1", fase: "Fase 3: Validación y Tracción", nombre: "Pruebas de Adopción y Feedback", peso: 0.30, dod: "Primeros usuarios activos y métricas clave registradas." }
            ];
          } else if (canonicalArq === "3_Activo") {
            elementosSemilla = [
              { tipo: "PAQUETE_TRABAJO", wbsCode: "1.1", fase: "Fase 1: Due Diligence y Evaluación", nombre: "Evaluación Técnica, Legal y Financiera", peso: 0.30, dod: "Informe de valuación y matriz de riesgos." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "2.1", fase: "Fase 2: Cierre Financiero", nombre: "Estructuración de Fondos y Negociación", peso: 0.35, dod: "Contrato de compraventa y fondos asegurados." },
              { tipo: "HITO_MARCADOR", wbsCode: "3.1", fase: "Fase 3: Adquisición y Traspaso", nombre: "Toma de Posesión y Registro del Activo", peso: 0.35, dod: "Título o posesión formal debidamente inscrita." }
            ];
          } else if (canonicalArq === "4_Carrera") {
            elementosSemilla = [
              { tipo: "PAQUETE_TRABAJO", wbsCode: "1.1", fase: "Fase 1: Diagnóstico y Temario", nombre: "Curaduría de Contenidos y Cronograma de Estudio", peso: 0.20, dod: "Ruta de aprendizaje y recursos seleccionados." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "2.1", fase: "Fase 2: Práctica y Proyectos", nombre: "Ejercicios Prácticos y Proyectos de Aplicación", peso: 0.50, dod: "Repositorio o portafolio de proyectos completado." },
              { tipo: "HITO_MARCADOR", wbsCode: "3.1", fase: "Fase 3: Certificación y Aplicación", nombre: "Examen de Certificación / Publicación Profesional", peso: 0.30, dod: "Credencial obtenida o hito profesional alcanzado." }
            ];
          } else if (canonicalArq === "5_Evento") {
            elementosSemilla = [
              { tipo: "PAQUETE_TRABAJO", wbsCode: "1.1", fase: "Fase 1: Planificación y Presupuesto", nombre: "Definición de Programa, Invitados y Presupuesto", peso: 0.25, dod: "Programa oficial y presupuesto aprobado." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "2.1", fase: "Fase 2: Proveedores y Logística", nombre: "Contratación de Espacio y Servicios Clave", peso: 0.40, dod: "Contratos de local, catering y técnica confirmados." },
              { tipo: "HITO_MARCADOR", wbsCode: "3.1", fase: "Fase 3: Ejecución T-Minus / Día Cero", nombre: "Realización del Evento y Protocolo de Cierre", peso: 0.35, dod: "Evento ejecutado y balances conciliados." }
            ];
          } else {
            elementosSemilla = [
              { tipo: "PAQUETE_TRABAJO", wbsCode: "1.1", fase: "Fase 1: Planificación y Preparación", nombre: "Definición de Alcance y Requisitos", peso: 0.30, dod: "Alcance y recursos definidos." },
              { tipo: "PAQUETE_TRABAJO", wbsCode: "2.1", fase: "Fase 2: Ejecución Principal", nombre: "Desarrollo y Entrega de Productos", peso: 0.50, dod: "Entregables centrales construidos." },
              { tipo: "HITO_MARCADOR", wbsCode: "3.1", fase: "Fase 3: Cierre y Validación", nombre: "Validación Final y Acta de Cierre", peso: 0.20, dod: "Validación DoD y aprobación formal." }
            ];
          }
        }

        elementosSemilla.forEach(function (elem, sIdx) {
          var sId = "";
          if (typeof CorrelativoService !== "undefined") {
            sId = (elem.tipo === "HITO_MARCADOR")
              ? (CorrelativoService.generarIdHito ? CorrelativoService.generarIdHito(idProyecto) : "HIT-" + (sIdx + 1))
              : (CorrelativoService.generarIdPaqueteTrabajo ? CorrelativoService.generarIdPaqueteTrabajo() : "WP-" + (sIdx + 1));
          } else {
            sId = (elem.tipo === "HITO_MARCADOR" ? "HIT-" : "WP-") + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss") + "-" + (sIdx + 1);
          }

          var hitRow = new Array(colMapH.MAX_COLUMNS || 14).fill("");
          var idxIdH = colMapH.ID_ELEMENTO_WBS !== undefined ? colMapH.ID_ELEMENTO_WBS : (colMapH.ID_HITO !== undefined ? colMapH.ID_HITO : 0);
          hitRow[idxIdH] = sId;
          hitRow[colMapH.ID_PROYECTO !== undefined ? colMapH.ID_PROYECTO : 1] = idProyecto;
          if (colMapH.TIPO_ELEMENTO_WBS !== undefined) hitRow[colMapH.TIPO_ELEMENTO_WBS] = elem.tipo;
          if (colMapH.WBS_CODE !== undefined) hitRow[colMapH.WBS_CODE] = elem.wbsCode;
          var idxFaseH = colMapH.FASE_ASOCIADA !== undefined ? colMapH.FASE_ASOCIADA : 4;
          hitRow[idxFaseH] = elem.fase;
          var idxNomH = colMapH.NOMBRE_ELEMENTO !== undefined ? colMapH.NOMBRE_ELEMENTO : (colMapH.NOMBRE_HITO !== undefined ? colMapH.NOMBRE_HITO : 5);
          hitRow[idxNomH] = elem.nombre;
          var idxEstH = colMapH.ESTADO !== undefined ? colMapH.ESTADO : 6;
          hitRow[idxEstH] = "01_Pendiente";
          var idxPesoH = colMapH.PESO_PCT !== undefined ? colMapH.PESO_PCT : 7;
          hitRow[idxPesoH] = elem.peso;
          var idxFecH = colMapH.FECHA_LIMITE !== undefined ? colMapH.FECHA_LIMITE : (colMapH.FECHA_LIMITE_PLAN !== undefined ? colMapH.FECHA_LIMITE_PLAN : 8);
          hitRow[idxFecH] = fechaFinDef || fechaHoy;
          var idxPresH = colMapH.PRESUPUESTO_ASIGNADO !== undefined ? colMapH.PRESUPUESTO_ASIGNADO : 10;
          hitRow[idxPresH] = (elem.tipo === "HITO_MARCADOR") ? 0.0 : (elem.presupuesto || 0.0);
          var idxDodH = colMapH.CRITERIO_DOD !== undefined ? colMapH.CRITERIO_DOD : 11;
          hitRow[idxDodH] = elem.dod || "";
          sheetHitos.appendRow(hitRow);
        });
      }
    } catch (eSemilla) {
      Logger.log("[Siembra Fases WBS Error]: " + eSemilla.message);
    }

    const driveRes = (typeof DriveService !== "undefined" && DriveService.inicializarCarpetaProyecto)
      ? DriveService.inicializarCarpetaProyecto(idProyecto, payload.nombreProyecto || "Nuevo Proyecto")
      : { folderUrl: "" };

    return {
      success: true,
      idProyecto: idProyecto,
      data: {
        ID_Proyecto: idProyecto,
        Nombre_Proyecto: newRow[colMap.NOMBRE],
        Tipo_Iniciativa: newRow[colMap.TIPO],
        Magnitud_Complejidad: magnitudComplejidad,
        Arquetipo_Proyecto: arquetipoProyecto,
        Estado_Proyecto: newRow[colMap.ESTADO],
        Health_Status: newRow[idxHealth !== undefined ? idxHealth : colMap.HEALTH],
        Avance_Real_Pct: 0,
        Entregable_Tangible_Objeto: newRow[idxObj !== undefined ? idxObj : 8] || "",
        Entregable_Tangible: newRow[idxObj !== undefined ? idxObj : 8] || "",
        North_Star_OKR: newRow[idxOkr !== undefined ? idxOkr : 9] || "",
        Criterios_Aceptacion_DoD: newRow[idxDod !== undefined ? idxDod : 10] || "",
        Ultima_Revision: newRow[colMap.ULTIMA_REVISION !== undefined ? colMap.ULTIMA_REVISION : 11] || "",
        Fecha_Inicio_Plan: newRow[colMap.FECHA_INICIO_PLAN],
        Fecha_Fin_Plan: newRow[colMap.FECHA_FIN_PLAN],
        Moneda_Base: newRow[colMap.MONEDA_BASE],
        Presupuesto_Tope: newRow[colMap.PRESUPUESTO_TOPE],
        Costo_Ejecutado_Real_PEN: 0,
        Costo_Ejecutado_Real_USD: 0,
        Terceros_Involucrados: newRow[idxTerc !== undefined ? idxTerc : 18] || "",
        Alcance_Detallado_URL_Drive: driveRes.folderUrl || "",
        URL_Drive: driveRes.folderUrl || ""
      }
    };
  },

  updateProyecto: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
    const colMap = ProyectosService.obtenerMapaColumnasProyectos(sheet);
    const data = sheet.getDataRange().getValues();
    const idBuscado = String(payload.idProyecto || "").trim();
    let rowIdx = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colMap.ID_PROYECTO]).trim() === idBuscado) {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: "Proyecto no encontrado" };

    // Build updated row using existing values to preserve calculated columns
    const lastCol = sheet.getLastColumn();
    const row = sheet.getRange(rowIdx, 1, 1, lastCol).getValues()[0];
    const formulas = sheet.getRange(rowIdx, 1, 1, lastCol).getFormulas()[0];

    // Preservar fórmulas explícitas
    for (let c = 0; c < lastCol; c++) {
      if (formulas[c]) row[c] = formulas[c];
    }

    // Update fields if payload provides them
    if (payload.nombreProyecto !== undefined) row[colMap.NOMBRE] = payload.nombreProyecto;
    if (payload.tipoIniciativa !== undefined) row[colMap.TIPO] = payload.tipoIniciativa;

    // Mapear lectura y escritura de 'magnitudComplejidad' y 'arquetipoProyecto' en columnas D y E
    const idxMag = colMap.MAGNITUD_COMPLEJIDAD !== undefined ? colMap.MAGNITUD_COMPLEJIDAD : colMap.TSHIRT;
    if (payload.magnitudComplejidad !== undefined || payload.categoriaTShirt !== undefined) {
      row[idxMag] = payload.magnitudComplejidad !== undefined ? payload.magnitudComplejidad : payload.categoriaTShirt;
    }
    const idxArq = colMap.ARQUETIPO_PROYECTO !== undefined ? colMap.ARQUETIPO_PROYECTO : colMap.CRITERIO;
    if (payload.arquetipoProyecto !== undefined || payload.criterioDominante !== undefined) {
      row[idxArq] = payload.arquetipoProyecto !== undefined ? payload.arquetipoProyecto : payload.criterioDominante;
    }

    if (payload.estadoProyecto !== undefined) row[colMap.ESTADO] = payload.estadoProyecto;
    const idxHealth = colMap.HEALTH_STATUS !== undefined ? colMap.HEALTH_STATUS : colMap.HEALTH;
    if (idxHealth !== undefined && (payload.healthStatus !== undefined || payload.health !== undefined)) {
      row[idxHealth] = payload.healthStatus !== undefined ? payload.healthStatus : payload.health;
    }

    const idxObj = colMap.ENTREGABLE_OBJETO !== undefined ? colMap.ENTREGABLE_OBJETO : colMap.OBJETO;
    if (idxObj !== undefined && (payload.entregableTangibleObjeto !== undefined || payload.entregableTangible !== undefined || payload.objeto !== undefined)) {
      row[idxObj] = payload.entregableTangibleObjeto !== undefined ? payload.entregableTangibleObjeto : (payload.entregableTangible !== undefined ? payload.entregableTangible : payload.objeto);
    }

    const idxOkr = colMap.NORTH_STAR_OKR !== undefined ? colMap.NORTH_STAR_OKR : colMap.OKR;
    if (idxOkr !== undefined && (payload.northStarOKR !== undefined || payload.okr !== undefined)) {
      row[idxOkr] = payload.northStarOKR !== undefined ? payload.northStarOKR : payload.okr;
    }

    const idxDod = colMap.CRITERIOS_DOD !== undefined ? colMap.CRITERIOS_DOD : colMap.DOD;
    if (idxDod !== undefined && (payload.criteriosAceptacionDoD !== undefined || payload.criteriosDoD !== undefined || payload.dod !== undefined)) {
      row[idxDod] = payload.criteriosAceptacionDoD !== undefined ? payload.criteriosAceptacionDoD : (payload.criteriosDoD !== undefined ? payload.criteriosDoD : payload.dod);
    }

    if (colMap.ULTIMA_REVISION !== undefined && (payload.ultimaRevision !== undefined || payload.ultimaFechaControl !== undefined)) {
      row[colMap.ULTIMA_REVISION] = payload.ultimaRevision !== undefined ? payload.ultimaRevision : payload.ultimaFechaControl;
    }

    if (colMap.FECHA_INICIO_PLAN !== undefined && payload.fechaInicioPlan !== undefined) row[colMap.FECHA_INICIO_PLAN] = payload.fechaInicioPlan;
    if (colMap.FECHA_FIN_PLAN !== undefined && payload.fechaFinPlan !== undefined) row[colMap.FECHA_FIN_PLAN] = payload.fechaFinPlan;
    if (colMap.MONEDA_BASE !== undefined && payload.monedaBase !== undefined) row[colMap.MONEDA_BASE] = payload.monedaBase;
    if (colMap.PRESUPUESTO_TOPE !== undefined && payload.presupuestoTope !== undefined) row[colMap.PRESUPUESTO_TOPE] = parseFloat(payload.presupuestoTope) || 0;

    const idxTerc = colMap.TERCEROS_INVOLUCRADOS !== undefined ? colMap.TERCEROS_INVOLUCRADOS : colMap.TERCEROS;
    if (idxTerc !== undefined && payload.tercerosInvolucrados !== undefined) {
      row[idxTerc] = payload.tercerosInvolucrados;
    }

    const idxDrive = colMap.ALCANCE_URL_DRIVE !== undefined ? colMap.ALCANCE_URL_DRIVE : colMap.URL_DRIVE;
    if (idxDrive !== undefined && (payload.urlDrive || payload.URL_Carpeta_Drive || payload.alcanceDetalladoUrlDrive || payload.Alcance_Detallado_URL_Drive)) {
      row[idxDrive] = payload.urlDrive || payload.URL_Carpeta_Drive || payload.alcanceDetalladoUrlDrive || payload.Alcance_Detallado_URL_Drive;
    }

    // Regla WBS v4.1: Protección de campos calculados por backend (Col H, Col Q, Col R) contra sobreescritura estática
    const idxAvance = colMap.AVANCE_REAL_PCT !== undefined ? colMap.AVANCE_REAL_PCT : colMap.AVANCE;
    if (idxAvance !== undefined) row[idxAvance] = formulas[idxAvance] || row[idxAvance] || "";

    const idxPen = colMap.COSTO_EJECUTADO_PEN !== undefined ? colMap.COSTO_EJECUTADO_PEN : colMap.COSTO_REAL_PEN;
    if (idxPen !== undefined) row[idxPen] = formulas[idxPen] || row[idxPen] || "";

    const idxUsd = colMap.COSTO_EJECUTADO_USD !== undefined ? colMap.COSTO_EJECUTADO_USD : colMap.COSTO_REAL_USD;
    if (idxUsd !== undefined) row[idxUsd] = formulas[idxUsd] || row[idxUsd] || "";

    // Write the entire row back in one batch
    sheet.getRange(rowIdx, 1, 1, lastCol).setValues([row]);
    invalidarCacheDashboard();
    return { success: true, idProyecto: idBuscado };
  },

  registrarCheckinProyecto: function(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
    if (!sheet) return { success: false, error: "Hoja de proyectos no encontrada" };

    const colMap = ProyectosService.obtenerMapaColumnasProyectos(sheet);
    const idProy = String(payload.idProyecto || payload.ID_Proyecto || "").trim();
    if (!idProy) return { success: false, error: "ID_Proyecto es requerido para el check-in" };

    const data = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colMap.ID_PROYECTO]).trim().toUpperCase() === idProy.toUpperCase()) {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: "Proyecto no encontrado: " + idProy };

    const fechaHoy = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    sheet.getRange(rowIdx, colMap.ULTIMA_REVISION + 1).setValue(fechaHoy);

    invalidarCacheDashboard();

    return {
      success: true,
      idProyecto: idProy,
      ultimaFechaControl: fechaHoy,
      message: `Check-in de gobernanza registrado con éxito para ${idProy}.`
    };
  },

  /**
   * Elimina un proyecto y todas sus dependencias relacionales en cascada
   * (BBDD_Proyectos -> BBDD_Hitos -> BBDD_Actividades_Tareas -> BBDD_Finanzas_Gastos)
   *
   * @param {string|Object} payloadOrId ID del proyecto o payload con idProyecto
   * @return {Object} { success: boolean, eliminados: { hitos: number, tareas: number, gastos: number }, mensaje: string }
   */
  eliminarProyectoEnCascada: function(payloadOrId) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetProy = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
      if (!sheetProy) {
        return { success: false, error: "Hoja de proyectos '" + CONFIG.SHEETS.PROYECTOS + "' no encontrada en el libro." };
      }

      const idRaw = (typeof payloadOrId === "object" && payloadOrId !== null)
        ? (payloadOrId.idProyecto || payloadOrId.ID_Proyecto || "")
        : String(payloadOrId || "");
      const idProy = String(idRaw || "").trim();
      const idProyNorm = idProy.toUpperCase();

      if (!idProyNorm) {
        return { success: false, error: "ID_Proyecto inválido o no especificado para eliminación en cascada." };
      }

      const lastRowProy = sheetProy.getLastRow();
      if (lastRowProy <= 1) {
        return { success: false, error: "No existen proyectos registrados en BBDD_Proyectos." };
      }

      // 1. Verificar existencia del proyecto en BBDD_Proyectos
      const dataProy = sheetProy.getRange(2, 1, lastRowProy - 1, sheetProy.getLastColumn()).getValues();
      let existeProyecto = false;
      for (let i = 0; i < dataProy.length; i++) {
        if (String(dataProy[i][CONFIG.COLS_PROYECTOS.ID_PROYECTO || 0] || "").trim().toUpperCase() === idProyNorm) {
          existeProyecto = true;
          break;
        }
      }

      if (!existeProyecto) {
        return { success: false, error: "El proyecto '" + idProy + "' no fue encontrado en la base de datos." };
      }

      const eliminados = {
        hitos: 0,
        tareas: 0,
        gastos: 0
      };

      const idsTareasEliminadas = new Set();

      // 2. BBDD_Tareas: Identificar eventos de Calendar, recolectar IDs de tareas y filtrar en memoria
      try {
        const sheetTar = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
        if (sheetTar && sheetTar.getLastRow() > 1) {
          const tarData = sheetTar.getRange(2, 1, sheetTar.getLastRow() - 1, sheetTar.getLastColumn()).getValues();

          // Limpiar eventos externos de Google Calendar para las tareas que se van a eliminar
          for (let t = 0; t < tarData.length; t++) {
            const tProy = String(tarData[t][CONFIG.COLS_TAREAS.ID_PROYECTO] || "").trim().toUpperCase();
            const tHito = String(tarData[t][CONFIG.COLS_TAREAS.ID_HITO] || "").trim().toUpperCase();
            const idTarActual = String(tarData[t][CONFIG.COLS_TAREAS.ID_TAREA] || "").trim();

            if (tProy === idProyNorm || (tHito && (tHito === idProyNorm || tHito.startsWith(idProyNorm + "-")))) {
              if (idTarActual) idsTareasEliminadas.add(idTarActual.toUpperCase());

              const agendadoT = String(tarData[t][CONFIG.COLS_TAREAS.AGENDADO_CALENDAR] || "").trim();
              if (agendadoT && agendadoT.includes("|")) {
                const eventId = agendadoT.split("|")[1].trim();
                try {
                  if (typeof TareasService !== "undefined" && typeof TareasService.eliminarEventoCalendarPorId === "function") {
                    TareasService.eliminarEventoCalendarPorId(eventId);
                  } else if (typeof CalendarService !== "undefined" && typeof CalendarService.eliminarEvento === "function") {
                    CalendarService.eliminarEvento(eventId);
                  }
                } catch (eCal) {
                  Logger.log("[Calendar Delete Error]: " + eCal.message);
                }
              }
            }
          }

          // Sobrescritura atómica de tareas
          eliminados.tareas = sobrescribirHojaFiltrada(sheetTar, function(row) {
            const tProy = String(row[CONFIG.COLS_TAREAS.ID_PROYECTO] || "").trim().toUpperCase();
            const tHito = String(row[CONFIG.COLS_TAREAS.ID_HITO] || "").trim().toUpperCase();
            const coincide = (tProy === idProyNorm || (tHito && (tHito === idProyNorm || tHito.startsWith(idProyNorm + "-"))));
            return !coincide;
          });
        }
      } catch (eTarCas) {
        Logger.log("[Cascada Tareas Error]: " + eTarCas.message);
      }

      // 3. BBDD_Subtareas: Filtrar atómicamente subtareas asociadas a las tareas eliminadas o al proyecto
      try {
        const sheetSub = ss.getSheetByName(CONFIG.SHEETS.SUBTAREAS);
        if (sheetSub && sheetSub.getLastRow() > 1) {
          sobrescribirHojaFiltrada(sheetSub, function(row) {
            const tipoP = String(row[CONFIG.COLS_SUBTAREAS.TIPO_PADRE] || "").trim().toUpperCase();
            const idP = String(row[CONFIG.COLS_SUBTAREAS.ID_PADRE] || "").trim().toUpperCase();
            if (tipoP === "TAREA" && idsTareasEliminadas.has(idP)) return false;
            if (tipoP === "PROYECTO" && idP === idProyNorm) return false;
            return true;
          });
        }
      } catch (eSubCas) {
        Logger.log("[Cascada Subtareas Error]: " + eSubCas.message);
      }

      // 4. BBDD_Hitos: Sobrescritura atómica en lote
      try {
        const sheetHit = ss.getSheetByName(CONFIG.SHEETS.HITOS);
        if (sheetHit && sheetHit.getLastRow() > 1) {
          eliminados.hitos = sobrescribirHojaFiltrada(sheetHit, function(row) {
            const hProy = String(row[CONFIG.COLS_HITOS.ID_PROYECTO] || "").trim().toUpperCase();
            return hProy !== idProyNorm;
          });
        }
      } catch (eHitCas) {
        Logger.log("[Cascada Hitos Error]: " + eHitCas.message);
      }

      // 5. BBDD_Finanzas / Gastos: Limpiar Google Tasks vinculados y sobrescritura atómica en lote
      try {
        const sheetGas = ss.getSheetByName(CONFIG.SHEETS.FINANZAS);
        if (sheetGas && sheetGas.getLastRow() > 1) {
          const colMapGas = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
            ? FinanzasService.obtenerMapaColumnasGastos(sheetGas)
            : CONFIG.COLS_FINANZAS;
          const colGTask = (colMapGas && colMapGas.ID_GOOGLE_TASK !== undefined)
            ? colMapGas.ID_GOOGLE_TASK
            : 16;
          const colProyGas = (colMapGas && colMapGas.ID_PROYECTO !== undefined)
            ? colMapGas.ID_PROYECTO
            : 1;
          const gasData = sheetGas.getRange(2, 1, sheetGas.getLastRow() - 1, sheetGas.getLastColumn()).getValues();

          for (let g = 0; g < gasData.length; g++) {
            const gProy = String(gasData[g][colProyGas] || "").trim().toUpperCase();
            if (gProy === idProyNorm) {
              const taskId = String(gasData[g][colGTask] || "").trim();
              if (taskId && typeof GoogleTasksService !== "undefined" && GoogleTasksService.eliminarTask) {
                try { GoogleTasksService.eliminarTask(taskId); } catch (eT) { }
              }
            }
          }

          eliminados.gastos = sobrescribirHojaFiltrada(sheetGas, function(row) {
            const gProy = String(row[colProyGas] || "").trim().toUpperCase();
            return gProy !== idProyNorm;
          });
        }
      } catch (eGasCas) {
        Logger.log("[Cascada Gastos Error]: " + eGasCas.message);
      }

      // 6. BBDD_Proyectos: Eliminar de forma atómica la fila correspondiente
      sobrescribirHojaFiltrada(sheetProy, function(row) {
        const pId = String(row[CONFIG.COLS_PROYECTOS.ID_PROYECTO || 0] || "").trim().toUpperCase();
        return pId !== idProyNorm;
      });

      // 7. Flush de hojas de cálculo
      SpreadsheetApp.flush();

      // 8. Invalidar obligatoriamente la caché del dashboard
      invalidarCacheDashboard();

      return {
        success: true,
        idProyecto: idProy,
        eliminados: eliminados,
        mensaje: "Proyecto y dependencias eliminadas con éxito de forma atómica."
      };
    } catch (err) {
      Logger.log("[eliminarProyectoEnCascada Fatal Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try {
        lock.releaseLock();
      } catch (eLock) {
        Logger.log("[Lock Release Error]: " + eLock.message);
      }
    }
  },

  deleteProyecto: function(payload) {
    return this.eliminarProyectoEnCascada(payload);
  },

  /**
   * Genera sugerencia y autocompletado integral con IA (Metadatos + Hitos + Tareas + Gastos)
   */
  generarSugerenciaAutocompletado: function(nombreProyecto, tipoIniciativa) {
    const payload = (typeof nombreProyecto === "object" && nombreProyecto !== null)
      ? nombreProyecto
      : { nombreProyecto: String(nombreProyecto || "").trim(), tipoIniciativa: tipoIniciativa || "Profesional" };

    const res = this.generarWbsIntegralProyectoIA(payload);
    if (res && res.success && res.data) {
      // Sincronizar metadatos planos a nivel raíz de data para máxima compatibilidad
      if (res.data.proyecto) {
        Object.assign(res.data, res.data.proyecto);
      }
    }
    return res;
  },

  /**
   * Genera la propuesta integral WBS (Hitos, Tareas y Gastos) invocando GeminiParserService
   */
  generarWbsIntegralProyectoIA: function(payload) {
    if (typeof GeminiParserService !== "undefined" && GeminiParserService.generarWbsProyectoIA) {
      const res = GeminiParserService.generarWbsProyectoIA(payload || {});
      if (res && res.success && res.data) {
        const d = res.data;
        const pTopeFinal = (parseFloat(payload.presupuestoTope) > 0)
          ? parseFloat(payload.presupuestoTope)
          : (parseFloat(d.presupuestoTope) || parseFloat(d.presupuestoCalculado) || 0);

        const fFinFinal = (payload.fechaFinPlan && String(payload.fechaFinPlan).trim())
          ? payload.fechaFinPlan
          : (d.fechaFinPlan || d.fechaFinEstimada || "");

        const metFinal = d.metodologiaOptima || d.metodologiaSugerida || (payload.metodologiaSugerida && payload.metodologiaSugerida !== "Auto" ? payload.metodologiaSugerida : "Scrum / Ágil");

        if (!d.proyecto) {
          d.proyecto = {
            nombreProyecto: payload.nombreProyecto || d.nombreProyecto || "",
            tipoIniciativa: payload.tipoIniciativa || d.tipoIniciativa || "Profesional",
            descripcion: payload.descripcion || d.descripcion || "",
            metodologiaSugerida: metFinal,
            categoriaTShirt: d.categoriaTShirt || "M-Medium",
            criterioDominante: d.criterioDominante || "I-Impacto",
            northStarOKR: d.northStarOKR || "",
            entregableTangible: d.entregableTangible || payload.entregableTangible || "",
            criteriosDoD: d.criteriosDoD || "",
            fechaInicioPlan: payload.fechaInicioPlan || d.fechaInicioPlan || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd"),
            fechaFinPlan: fFinFinal,
            monedaBase: payload.monedaBase || d.monedaBase || "PEN",
            presupuestoTope: pTopeFinal,
            estadoPartida: payload.estadoPartida || d.estadoPartida || "Cero Absoluto (Greenfield)",
            perfilEjecutor: payload.perfilEjecutor || d.perfilEjecutor || "Ejecutor Directo",
            stackTecnologico: payload.stackTecnologico || d.stackTecnologico || "",
            restricciones: payload.restricciones || d.restricciones || ""
          };
        } else {
          d.proyecto.metodologiaSugerida = metFinal;
          d.proyecto.fechaFinPlan = fFinFinal;
          d.proyecto.presupuestoTope = pTopeFinal;
          if (payload.estadoPartida || d.estadoPartida) d.proyecto.estadoPartida = payload.estadoPartida || d.estadoPartida;
          if (payload.perfilEjecutor || d.perfilEjecutor) d.proyecto.perfilEjecutor = payload.perfilEjecutor || d.perfilEjecutor;
          if (payload.stackTecnologico || d.stackTecnologico) d.proyecto.stackTecnologico = payload.stackTecnologico || d.stackTecnologico;
          if (payload.restricciones || d.restricciones) d.proyecto.restricciones = payload.restricciones || d.restricciones;
          if (payload.entregableTangible && !d.proyecto.entregableTangible) d.proyecto.entregableTangible = payload.entregableTangible;
        }
        // Sincronizar propiedades en la raíz
        Object.assign(d, d.proyecto);

        // Normalizar Hitos y Tareas con ambos alias
        if (Array.isArray(d.hitos)) {
          d.hitos = d.hitos.map((h, hIdx) => {
            let peso = h.pesoPct !== undefined ? h.pesoPct : (h.peso_pct !== undefined ? h.peso_pct : 25);
            let pesoNum = parseFloat(peso) || 25;
            if (pesoNum > 0 && pesoNum <= 1) {
              pesoNum = Math.round(pesoNum * 100);
            }
            const nomHito = h.nombreHito || h.nombre || `Hito ${hIdx + 1}`;
            const fFin = h.fechaLimite || h.fecha_fin || "";

            const tareasNorm = (Array.isArray(h.tareas) ? h.tareas : []).map((t, tIdx) => {
              const nomTar = t.nombreTarea || t.nombre || `Tarea ${tIdx + 1}`;
              const hrs = parseFloat(t.horasEstimadas !== undefined ? t.horasEstimadas : t.horas) || 2.0;
              let prio = t.prioridad || "Media";
              if (prio.includes("Alta") || prio.includes("P1")) prio = "Alta";
              else if (prio.includes("Baja") || prio.includes("P3")) prio = "Baja";
              else prio = "Media";

              const fProg = t.fechaProgramada || t.fecha || fFin;
              const esMavTar = (t.esMav === true || t.esMav === "Sí" || (h.esMav !== false && (hIdx < 2 || tIdx === 0)));

              return {
                nombre: nomTar,
                nombreTarea: nomTar,
                horas: hrs,
                horasEstimadas: hrs,
                prioridad: prio,
                fecha: fProg,
                fechaProgramada: fProg,
                responsable: t.responsable || "Christopher",
                nivelEnergia: t.nivelEnergia || "Media_Operativa",
                esMav: esMavTar
              };
            });

            const esMavHit = (h.esMav === true || h.esMav === "Sí" || hIdx < 2);

            return {
              nombre: nomHito,
              nombreHito: nomHito,
              peso_pct: pesoNum,
              pesoPct: pesoNum,
              fecha_fin: fFin,
              fechaLimite: fFin,
              faseAsociada: h.faseAsociada || "Planificacion",
              criterioAceptacion: h.criterioAceptacion || h.criteriosDoD || "",
              esMav: esMavHit,
              tareas: tareasNorm
            };
          });
        }

        // Normalizar Gastos con ambos alias
        if (Array.isArray(d.gastos)) {
          d.gastos = d.gastos.map((g) => {
            const concepto = g.descripcionGasto || g.concepto || "Gasto Estimado";
            const cat = g.categoriaGasto || g.categoria || "Operativo / Otros";
            const monto = parseFloat(g.montoEstimado !== undefined ? g.montoEstimado : g.monto) || 0;
            const mon = g.moneda || payload.monedaBase || "PEN";
            const tarAsoc = g.tareaAsociada || "";

            return {
              concepto: concepto,
              descripcionGasto: concepto,
              categoria: cat,
              categoriaGasto: cat,
              monto: monto,
              montoEstimado: monto,
              moneda: mon,
              tareaAsociada: tarAsoc
            };
          });
        }
      }
      return res;
    }
    return { success: false, error: "Servicio GeminiParserService no disponible" };
  },

  /**
   * Sugiere el desglose en tareas atómicas para un paquete de trabajo (WP) específico
   */
  sugerirDesgloseTareasPaqueteIA: function(payload) {
    if (typeof GeminiParserService !== "undefined" && GeminiParserService.sugerirDesgloseTareasPaqueteIA) {
      return GeminiParserService.sugerirDesgloseTareasPaqueteIA(payload || {});
    }
    return { success: false, error: "Servicio GeminiParserService no disponible" };
  },

  /**
   * Sugiere paquetes de trabajo (WP) e hitos (HIT) faltantes para el proyecto activo
   */
  sugerirEstructuraWbsFaltanteIA: function(payload) {
    if (typeof GeminiParserService !== "undefined" && GeminiParserService.sugerirEstructuraWbsFaltanteIA) {
      return GeminiParserService.sugerirEstructuraWbsFaltanteIA(payload || {});
    }
    return { success: false, error: "Servicio GeminiParserService no disponible" };
  },

  /**
   * Guarda de forma transaccional la estructura completa del proyecto (Proyecto + Hitos + Tareas + Gastos)
   */
  guardarEstructuraProyectoCompleta: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      const ss = SpreadsheetApp.getActiveSpreadsheet();

      const proyData = payload.proyecto || payload || {};
      const hitosData = Array.isArray(payload.hitos) ? payload.hitos : [];
      const gastosData = Array.isArray(payload.gastos) ? payload.gastos : [];

      if (!proyData.nombreProyecto || !String(proyData.nombreProyecto).trim()) {
        return { success: false, error: "El nombre del proyecto es obligatorio." };
      }

      // Validar regla WBS v4.1: Ningún HITO_MARCADOR puede tener tareas asociadas
      for (let i = 0; i < hitosData.length; i++) {
        const hItem = hitosData[i];
        const rawT = String(hItem.tipoElementoWbs || hItem.Tipo_Elemento_WBS || hItem.tipo || "").trim().toUpperCase();
        const esMarcador = (rawT === "HITO_MARCADOR" || rawT === "HITO" || rawT === "HIT" || (hItem.id_temp && String(hItem.id_temp).toUpperCase().startsWith("HIT-")));
        const tareasH = Array.isArray(hItem.tareas) ? hItem.tareas : [];
        if (esMarcador && tareasH.length > 0) {
          return {
            success: false,
            error: `[Regla WBS v4.1]: El elemento '${hItem.nombreHito || hItem.nombre || ("Elemento " + (i + 1))}' está definido como HITO_MARCADOR y tiene ${tareasH.length} tarea(s) asociada(s). Los hitos marcadores tienen duración 0 y costo $0 y NO admiten tareas. Las tareas solo pueden asignarse a Paquetes de Trabajo (PAQUETE_TRABAJO / WP-XXX).`
          };
        }
      }

      // 1. Registrar Proyecto en BBDD_Proyectos
      const tipo = proyData.tipoIniciativa || "Profesional";
      const magnitudComplejidad = proyData.magnitudComplejidad || proyData.categoriaTShirt || "M-Medium";
      const arquetipoProyecto = proyData.arquetipoProyecto || proyData.criterioDominante || "I-Impacto";
      const estado = proyData.estadoProyecto || "02_Planificado";

      const idProyecto = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdProyecto)
        ? CorrelativoService.generarIdProyecto()
        : "PRO-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmm");

      const sheetProy = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
      if (!sheetProy) throw new Error("Hoja de Proyectos no encontrada en la hoja de cálculo.");
      const colMapP = ProyectosService.obtenerMapaColumnasProyectos(sheetProy);

      let faseDerivada = "Iniciacion";
      if (estado === "02_Planificado") faseDerivada = "Planificacion";
      else if (estado === "03_En_Ejecucion") faseDerivada = "Ejecucion";
      else if (estado === "04_En_Pausa") faseDerivada = "Control";
      else if (estado === "06_Cerrado") faseDerivada = "Cierre";

      let frecNorm = String(proyData.frecuenciaControl || "Semanal").trim();
      if (/diari/i.test(frecNorm)) frecNorm = "Diario";
      else if (/quincen/i.test(frecNorm)) frecNorm = "Quincenal";
      else if (/mensu/i.test(frecNorm)) frecNorm = "Mensual";
      else frecNorm = "Semanal";

      const proyRow = new Array(colMapP.MAX_COLUMNS || 20).fill("");
      proyRow[colMapP.ID_PROYECTO] = idProyecto;
      proyRow[colMapP.NOMBRE] = proyData.nombreProyecto || "";
      proyRow[colMapP.TIPO] = tipo;
      const idxMagP = colMapP.MAGNITUD_COMPLEJIDAD !== undefined ? colMapP.MAGNITUD_COMPLEJIDAD : colMapP.TSHIRT;
      proyRow[idxMagP] = magnitudComplejidad;
      const idxArqP = colMapP.ARQUETIPO_PROYECTO !== undefined ? colMapP.ARQUETIPO_PROYECTO : colMapP.CRITERIO;
      proyRow[idxArqP] = arquetipoProyecto;
      proyRow[colMapP.ESTADO] = estado;
      const idxHealthP = colMapP.HEALTH_STATUS !== undefined ? colMapP.HEALTH_STATUS : colMapP.HEALTH;
      if (idxHealthP !== undefined) proyRow[idxHealthP] = "🟢 Saludable";

      // Regla WBS v4.1: Protección de campos calculados por backend (Col H, Col Q, Col R) contra sobreescritura estática
      const idxAvanceP = colMapP.AVANCE_REAL_PCT !== undefined ? colMapP.AVANCE_REAL_PCT : colMapP.AVANCE;
      if (idxAvanceP !== undefined) proyRow[idxAvanceP] = "";

      const idxObjP = colMapP.ENTREGABLE_OBJETO !== undefined ? colMapP.ENTREGABLE_OBJETO : colMapP.OBJETO;
      if (idxObjP !== undefined) proyRow[idxObjP] = proyData.entregableTangibleObjeto || proyData.entregableTangible || proyData.objeto || "";

      const idxOkrP = colMapP.NORTH_STAR_OKR !== undefined ? colMapP.NORTH_STAR_OKR : colMapP.OKR;
      if (idxOkrP !== undefined) proyRow[idxOkrP] = proyData.northStarOKR || proyData.okr || "";

      const idxDodP = colMapP.CRITERIOS_DOD !== undefined ? colMapP.CRITERIOS_DOD : colMapP.DOD;
      if (idxDodP !== undefined) proyRow[idxDodP] = proyData.criteriosAceptacionDoD || proyData.criteriosDoD || proyData.dod || "";

      if (colMapP.ULTIMA_REVISION !== undefined) {
        proyRow[colMapP.ULTIMA_REVISION] = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
      }

      if (colMapP.FECHA_INICIO_PLAN !== undefined) proyRow[colMapP.FECHA_INICIO_PLAN] = proyData.fechaInicioPlan || "";
      if (colMapP.FECHA_FIN_PLAN !== undefined) proyRow[colMapP.FECHA_FIN_PLAN] = proyData.fechaFinPlan || "";
      if (colMapP.MONEDA_BASE !== undefined) proyRow[colMapP.MONEDA_BASE] = proyData.monedaBase || "PEN";
      if (colMapP.PRESUPUESTO_TOPE !== undefined) proyRow[colMapP.PRESUPUESTO_TOPE] = parseFloat(proyData.presupuestoTope) || 0;

      const idxPenP = colMapP.COSTO_EJECUTADO_PEN !== undefined ? colMapP.COSTO_EJECUTADO_PEN : colMapP.COSTO_REAL_PEN;
      if (idxPenP !== undefined) proyRow[idxPenP] = "";

      const idxUsdP = colMapP.COSTO_EJECUTADO_USD !== undefined ? colMapP.COSTO_EJECUTADO_USD : colMapP.COSTO_REAL_USD;
      if (idxUsdP !== undefined) proyRow[idxUsdP] = "";

      const tercerosDetalle = proyData.tercerosInvolucrados || [
        proyData.perfilEjecutor ? ("Modalidad: " + proyData.perfilEjecutor) : "",
        proyData.stackTecnologico ? ("Recursos: " + proyData.stackTecnologico) : "",
        proyData.estadoPartida ? ("Partida: " + proyData.estadoPartida) : "",
        proyData.restricciones ? ("Restricciones: " + proyData.restricciones) : ""
      ].filter(Boolean).join(" | ");

      const idxTercP = colMapP.TERCEROS_INVOLUCRADOS !== undefined ? colMapP.TERCEROS_INVOLUCRADOS : colMapP.TERCEROS;
      if (idxTercP !== undefined) proyRow[idxTercP] = tercerosDetalle || "";

      const idxDriveP = colMapP.ALCANCE_URL_DRIVE !== undefined ? colMapP.ALCANCE_URL_DRIVE : colMapP.URL_DRIVE;
      if (idxDriveP !== undefined) proyRow[idxDriveP] = proyData.urlDrive || proyData.URL_Carpeta_Drive || proyData.alcanceDetalladoUrlDrive || "";

      sheetProy.appendRow(proyRow);

      // Crear carpeta en Google Drive para el proyecto
      try {
        if (typeof DriveService !== "undefined" && DriveService.inicializarCarpetaProyecto) {
          DriveService.inicializarCarpetaProyecto(idProyecto, proyData.nombreProyecto || "Nuevo Proyecto");
        }
      } catch (eDrive) {
        Logger.log("[Drive Inicializacion]: " + eDrive.message);
      }

      // 2. Registrar Hitos y Tareas asociadas
      const sheetHit = ss.getSheetByName(CONFIG.SHEETS.HITOS);
      const sheetTar = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
      const colMapH = HitosService.obtenerMapaColumnasHitos(sheetHit);
      let totalTareas = 0;
      let primerHitoId = "";

      const totalTareasCount = hitosData.reduce((sum, h) => sum + (Array.isArray(h.tareas) ? h.tareas.length : 0), 0);
      const idsTareas = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdsBatch)
        ? CorrelativoService.generarIdsBatch("TAR", totalTareasCount)
        : [];
      const idsGastos = (typeof CorrelativoService !== "undefined" && CorrelativoService.generarIdsBatch)
        ? CorrelativoService.generarIdsBatch("GAS", gastosData.length)
        : [];
      let tareaIdx = 0;
      let gastoIdx = 0;

      const mapTareasByIdTemp = {};
      const mapTareasByName = {};
      const mapHitosByIdTemp = {};

      hitosData.forEach((hitoItem, hitoIdx) => {
        const rawT = String(hitoItem.tipoElementoWbs || hitoItem.Tipo_Elemento_WBS || hitoItem.tipo || "").trim().toUpperCase();
        let tipoElementoWbs = "PAQUETE_TRABAJO";
        if (rawT === "HITO_MARCADOR" || rawT === "HITO" || rawT === "HIT") {
          tipoElementoWbs = "HITO_MARCADOR";
        } else if (rawT === "PAQUETE_TRABAJO" || rawT === "WP" || rawT === "PAQUETE") {
          tipoElementoWbs = "PAQUETE_TRABAJO";
        } else if (hitoItem.id_temp && String(hitoItem.id_temp).toUpperCase().startsWith("HIT-")) {
          tipoElementoWbs = "HITO_MARCADOR";
        } else if (hitoItem.id_temp && String(hitoItem.id_temp).toUpperCase().startsWith("WP-")) {
          tipoElementoWbs = "PAQUETE_TRABAJO";
        } else if (parseFloat(hitoItem.presupuestoAsignado || hitoItem.costoAsociadoEstimado || hitoItem.costoEstimado || 0) > 0) {
          tipoElementoWbs = "PAQUETE_TRABAJO";
        } else {
          tipoElementoWbs = "HITO_MARCADOR";
        }

        let idHito = "";
        if (typeof CorrelativoService !== "undefined") {
          idHito = (tipoElementoWbs === "HITO_MARCADOR")
            ? CorrelativoService.generarIdHito()
            : CorrelativoService.generarIdPaqueteTrabajo();
        } else {
          idHito = (tipoElementoWbs === "HITO_MARCADOR" ? "HIT-" : "WP-") + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss") + "-" + (hitoIdx + 1);
        }

        let presupuestoAsignado = parseFloat(hitoItem.presupuestoAsignado || hitoItem.costoAsociadoEstimado || hitoItem.costoEstimado || 0) || 0.0;
        if (tipoElementoWbs === "HITO_MARCADOR") {
          presupuestoAsignado = 0.00;
        }

        if (!primerHitoId) primerHitoId = idHito;
        if (hitoItem.id_temp) {
          mapHitosByIdTemp[hitoItem.id_temp] = idHito;
        }

        if (sheetHit) {
          const hitRow = new Array(colMapH.MAX_COLUMNS || 14).fill("");
          const idxIdH = colMapH.ID_ELEMENTO_WBS !== undefined ? colMapH.ID_ELEMENTO_WBS : (colMapH.ID_HITO !== undefined ? colMapH.ID_HITO : 0);
          hitRow[idxIdH] = idHito;
          hitRow[colMapH.ID_PROYECTO !== undefined ? colMapH.ID_PROYECTO : 1] = idProyecto;
          if (colMapH.TIPO_ELEMENTO_WBS !== undefined) {
            hitRow[colMapH.TIPO_ELEMENTO_WBS] = tipoElementoWbs;
          }
          if (colMapH.WBS_CODE !== undefined) {
            hitRow[colMapH.WBS_CODE] = hitoItem.wbsCode || hitoItem.WBS_Code || `1.${hitoIdx + 1}`;
          }
          const idxFaseH = colMapH.FASE_ASOCIADA !== undefined ? colMapH.FASE_ASOCIADA : 4;
          hitRow[idxFaseH] = hitoItem.faseAsociada || "Planificacion";
          const idxNomH = colMapH.NOMBRE_ELEMENTO !== undefined ? colMapH.NOMBRE_ELEMENTO : (colMapH.NOMBRE_HITO !== undefined ? colMapH.NOMBRE_HITO : 5);
          hitRow[idxNomH] = hitoItem.nombreHito || hitoItem.nombreElemento || hitoItem.nombre || `Elemento ${hitoIdx + 1}`;
          const idxEstH = colMapH.ESTADO !== undefined ? colMapH.ESTADO : 6;
          hitRow[idxEstH] = hitoItem.estadoHito || hitoItem.estado || "01_Pendiente";
          let pPct = parseFloat(hitoItem.pesoPct !== undefined ? hitoItem.pesoPct : hitoItem.peso_pct);
          if (isNaN(pPct) || pPct <= 0) pPct = 0.25;
          if (pPct > 1) pPct = pPct / 100;
          const idxPesoH = colMapH.PESO_PCT !== undefined ? colMapH.PESO_PCT : 7;
          hitRow[idxPesoH] = pPct;
          const idxFecH = colMapH.FECHA_LIMITE !== undefined ? colMapH.FECHA_LIMITE : (colMapH.FECHA_LIMITE_PLAN !== undefined ? colMapH.FECHA_LIMITE_PLAN : 8);
          hitRow[idxFecH] = hitoItem.fechaLimite || hitoItem.fecha_fin || proyData.fechaFinPlan || "";
          const idxFecFinH = colMapH.FECHA_REAL_FIN !== undefined ? colMapH.FECHA_REAL_FIN : 9;
          hitRow[idxFecFinH] = "";
          const idxPresH = colMapH.PRESUPUESTO_ASIGNADO !== undefined ? colMapH.PRESUPUESTO_ASIGNADO : (colMapH.COSTO_ESTIMADO !== undefined ? colMapH.COSTO_ESTIMADO : 10);
          hitRow[idxPresH] = presupuestoAsignado;
          const idxDodH = colMapH.CRITERIO_DOD !== undefined ? colMapH.CRITERIO_DOD : (colMapH.DOD !== undefined ? colMapH.DOD : 11);
          hitRow[idxDodH] = hitoItem.criterioDod || hitoItem.criterioAceptacion || "";
          const idxDepH = colMapH.DEPENDENCIA_PREDECESORA !== undefined ? colMapH.DEPENDENCIA_PREDECESORA : 12;
          hitRow[idxDepH] = hitoItem.dependenciaPredecesora || "";
          const idxLinkH = colMapH.ENTREGABLE_LINK !== undefined ? colMapH.ENTREGABLE_LINK : 13;
          hitRow[idxLinkH] = hitoItem.entregableLink || "";
          sheetHit.appendRow(hitRow);
        }

        // Tareas del hito (Solo permitidas en PAQUETE_TRABAJO)
        const tareasHito = Array.isArray(hitoItem.tareas) ? hitoItem.tareas : [];
        tareasHito.forEach((tarItem) => {
          totalTareas++;
          const idTarea = (idsTareas && idsTareas[tareaIdx++]) || (typeof CorrelativoService !== "undefined" ? CorrelativoService.generarIdTarea() : "TAR-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss") + "-" + totalTareas);

          if (tarItem.id_temp) {
            mapTareasByIdTemp[tarItem.id_temp] = { idTarea: idTarea, idHito: idHito };
          }
          const nomTarKey = String(tarItem.nombreTarea || tarItem.nombre || "").trim().toLowerCase();
          if (nomTarKey) {
            mapTareasByName[nomTarKey] = { idTarea: idTarea, idHito: idHito };
          }

          if (sheetTar) {
            const colMapT = (typeof TareasService !== "undefined" && TareasService.obtenerMapaColumnasTareas)
              ? TareasService.obtenerMapaColumnasTareas(sheetTar)
              : (CONFIG.obtenerMapaTareas ? CONFIG.obtenerMapaTareas(sheetTar) : (CONFIG.COLS_TAREAS || {}));
            const tarRow = new Array(colMapT.MAX_COLUMNS || 14).fill("");
            tarRow[colMapT.ID_TAREA] = idTarea;
            tarRow[colMapT.ID_HITO] = idHito;
            tarRow[colMapT.ID_PROYECTO] = idProyecto;
            tarRow[colMapT.NOMBRE_TAREA] = tarItem.nombreTarea || tarItem.nombre || "Tarea Operativa";
            tarRow[colMapT.ESTADO] = tarItem.estadoTarea || "02_Por_Hacer";
            let prio = tarItem.prioridad || "02_P2_Media";
            if (prio === "Alta") prio = "01_P1_Alta";
            else if (prio === "Media") prio = "02_P2_Media";
            else if (prio === "Baja") prio = "03_P3_Baja";
            tarRow[colMapT.PRIORIDAD] = prio;
            tarRow[colMapT.NIVEL_ENERGIA] = tarItem.nivelEnergia || "Media_Operativa";
            tarRow[colMapT.HORAS_ESTIMADAS] = parseFloat(tarItem.horasEstimadas !== undefined ? tarItem.horasEstimadas : tarItem.horas) || 2.0;
            tarRow[colMapT.HORAS_REALES] = 0.0;
            tarRow[colMapT.FECHA_PROGRAMADA] = tarItem.fechaProgramada || tarItem.fecha || hitoItem.fechaLimite || hitoItem.fecha_fin || "";
            tarRow[colMapT.AGENDADO_CALENDAR] = "No";
            tarRow[colMapT.RESPONSABLE] = tarItem.responsable || "Christopher";
            tarRow[colMapT.NOTAS] = "";
            sheetTar.appendRow(tarRow);
          }
        });
      });

      // 3. Registrar Gastos Proyectados en BBDD_Finanzas_Gastos con trazabilidad a tareas e hitos
      const sheetGas = ss.getSheetByName(CONFIG.SHEETS.FINANZAS);
      if (sheetGas) {
        const colMap = (typeof FinanzasService !== "undefined" && FinanzasService.obtenerMapaColumnasGastos)
          ? FinanzasService.obtenerMapaColumnasGastos(sheetGas)
          : CONFIG.COLS_FINANZAS;
        const totalCols = Math.max(sheetGas.getLastColumn(), 19, (colMap.MAX_COLUMNS || 19));

        gastosData.forEach((gasItem) => {
          const idGasto = (idsGastos && idsGastos[gastoIdx++]) || (typeof CorrelativoService !== "undefined" ? CorrelativoService.generarIdGasto() : "GAS-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss"));

          let linkedIdTarea = "";
          let linkedIdHito = (gasItem.id_hito_temp && mapHitosByIdTemp[gasItem.id_hito_temp]) || primerHitoId || "";

          if (gasItem.id_tarea_temp && mapTareasByIdTemp[gasItem.id_tarea_temp]) {
            linkedIdTarea = mapTareasByIdTemp[gasItem.id_tarea_temp].idTarea;
            linkedIdHito = mapTareasByIdTemp[gasItem.id_tarea_temp].idHito;
          } else if (gasItem.tareaAsociada && mapTareasByName[String(gasItem.tareaAsociada).trim().toLowerCase()]) {
            const mTar = mapTareasByName[String(gasItem.tareaAsociada).trim().toLowerCase()];
            linkedIdTarea = mTar.idTarea;
            linkedIdHito = mTar.idHito;
          }

          const gasRow = new Array(totalCols).fill("");
          gasRow[colMap.ID_GASTO] = idGasto;
          gasRow[colMap.ID_PROYECTO] = idProyecto;
          gasRow[colMap.ID_HITO] = linkedIdHito || "";
          if (colMap.TIPO_GASTO !== undefined) {
            gasRow[colMap.TIPO_GASTO] = "Tarea Proyecto";
          }
          gasRow[colMap.ID_TAREA] = linkedIdTarea || "";
          gasRow[colMap.FECHA_GASTO] = gasItem.fechaGasto || proyData.fechaInicioPlan || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
          gasRow[colMap.DESCRIPCION] = gasItem.descripcionGasto || gasItem.concepto || "Gasto Proyectado WBS";
          gasRow[colMap.CATEGORIA] = gasItem.categoriaGasto || gasItem.categoria || "Servicios_Terceros";

          const moneda = gasItem.moneda || proyData.monedaBase || "PEN";
          const montoOrig = parseFloat(gasItem.montoEstimado || gasItem.monto) || 0.0;
          let tc = 1.0;
          if (moneda === "USD") tc = 3.75;
          else if (moneda === "EUR") tc = 4.10;

          const montoPen = (moneda === "PEN") ? montoOrig : (montoOrig * tc);
          const montoUsd = (moneda === "USD") ? montoOrig : (montoPen / 3.75);

          gasRow[colMap.MONEDA_ORIGINAL] = moneda;
          gasRow[colMap.MONTO_ORIGINAL] = montoOrig;
          gasRow[colMap.TIPO_CAMBIO] = tc;
          gasRow[colMap.MONTO_PEN] = montoPen;
          gasRow[colMap.MONTO_USD] = montoUsd;
          gasRow[colMap.METODO_PAGO] = "Transferencia_Bancaria";
          gasRow[colMap.ESTADO_PAGO] = "Presupuestado";

          sheetGas.appendRow(gasRow);
        });
      }

      invalidarCacheDashboard();

      return {
        success: true,
        idProyecto: idProyecto,
        totalHitos: hitosData.length,
        totalTareas: totalTareas,
        totalGastos: gastosData.length,
        message: `¡Proyecto ${idProyecto} creado con éxito! Se registraron ${hitosData.length} hitos, ${totalTareas} tareas y ${gastosData.length} gastos proyectados.`
      };
    } catch (err) {
      Logger.log("[guardarEstructuraProyectoCompleta Error]: " + err.message);
      return { success: false, error: "Error al guardar estructura del proyecto: " + err.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Evalúa y resuelve de forma pura los Feature Flags de un proyecto según su Arquetipo y Magnitud (WBS v4.1).
   * @param {string} arquetipo - 1_Infraestructura, 2_Venture, 3_Activo, 4_Carrera, 5_Evento (o variantes).
   * @param {string} magnitud - Light, Medium, Heavy (o variantes).
   * @returns {Object} { arquetipo, magnitud, flags: { ... } }
   */
  evaluarFeatureFlagsProyecto: function (arquetipo, magnitud) {
    const rawArq = String(arquetipo || "").trim().toLowerCase();
    const rawMag = String(magnitud || "").trim().toLowerCase();

    // Normalización de Magnitud
    const isLight = rawMag === "light" || rawMag.startsWith("l-light") || rawMag.startsWith("xs") || rawMag.startsWith("s-small") || rawMag.includes("pequeñ");
    const isHeavy = rawMag === "heavy" || rawMag.startsWith("h-heavy") || rawMag.startsWith("xl") || rawMag.startsWith("l-large") || rawMag.includes("grande") || rawMag.includes("complej");
    const canonicalMag = isLight ? "Light" : (isHeavy ? "Heavy" : "Medium");

    // Normalización de Arquetipo
    let canonicalArq = "2_Venture";
    let isArq1 = false;
    let isArq2 = false;
    let isArq3 = false;
    let isArq4 = false;
    let isArq5 = false;

    if (rawArq.startsWith("1") || rawArq.includes("infraestructura") || rawArq.includes("cascada") || rawArq.includes("obra") || rawArq.includes("construc")) {
      canonicalArq = "1_Infraestructura";
      isArq1 = true;
    } else if (rawArq.startsWith("2") || rawArq.includes("venture") || rawArq.includes("software") || rawArq.includes("agil") || rawArq.includes("ágil") || rawArq.includes("startup") || rawArq.includes("digital")) {
      canonicalArq = "2_Venture";
      isArq2 = true;
    } else if (rawArq.startsWith("3") || rawArq.includes("activo") || rawArq.includes("inversion") || rawArq.includes("inversión") || rawArq.includes("inmueble") || rawArq.includes("patrimonio")) {
      canonicalArq = "3_Activo";
      isArq3 = true;
    } else if (rawArq.startsWith("4") || rawArq.includes("carrera") || rawArq.includes("aprendizaje") || rawArq.includes("estudio") || rawArq.includes("certific") || rawArq.includes("personal") || rawArq.includes("salud")) {
      canonicalArq = "4_Carrera";
      isArq4 = true;
    } else if (rawArq.startsWith("5") || rawArq.includes("evento") || rawArq.includes("lanzamiento") || rawArq.includes("logistica") || rawArq.includes("logística") || rawArq.includes("t-minus")) {
      canonicalArq = "5_Evento";
      isArq5 = true;
    } else {
      canonicalArq = "2_Venture";
      isArq2 = true;
    }

    // Reglas de Feature Flags según Directriz Prioridad 2:
    const flags = {
      arbolWbsCompleto: (isArq1 || isArq2) && !isLight,
      rutaCriticaCpm: isArq1 && !isLight,
      evmFinanciero: isArq1 && !isLight,
      sprintsAgiles: isArq2,
      tableroHipotesis: isArq2,
      matrizTradeOff: isArq3,
      checklistDueDiligence: isArq3,
      hitosCurriculares: isArq4,
      timeBlockingDeepWork: isArq4,
      cronogramaTMinus: isArq5,
      directorioProveedores: isArq5,
      modoUltraLigero: isLight
    };

    return {
      arquetipo: canonicalArq,
      magnitud: canonicalMag,
      flags: flags
    };
  },

  /**
   * Audita la carga de proyectos activos simultáneos en '03_En_Ejecucion'.
   * Genera telemetría preventiva sin bloquear transacciones si Heavy > 1 o Medium > 2.
   * @param {Array} [proyectosOpt] - Lista opcional de proyectos pre-cargados en memoria.
   * @returns {Object} { alertaSobrecarga, conteoHeavy, conteoMedium, mensajeAlerta }
   */
  auditarCargaProyectosActivos: function (proyectosOpt) {
    try {
      let listaProyectos = [];
      if (Array.isArray(proyectosOpt) && proyectosOpt.length > 0) {
        listaProyectos = proyectosOpt;
      } else {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
        if (sheet && sheet.getLastRow() > 1) {
          const colMap = ProyectosService.obtenerMapaColumnasProyectos(sheet);
          const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
          const idxEst = colMap.ESTADO !== undefined ? colMap.ESTADO : 5;
          const idxMag = colMap.MAGNITUD_COMPLEJIDAD !== undefined ? colMap.MAGNITUD_COMPLEJIDAD : colMap.TSHIRT;
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            listaProyectos.push({
              Estado_Proyecto: String(row[idxEst] || "").trim(),
              Magnitud_Complejidad: String(row[idxMag] || "").trim(),
              Nombre_Proyecto: String(row[colMap.NOMBRE] || "").trim()
            });
          }
        }
      }

      let conteoHeavy = 0;
      let conteoMedium = 0;

      for (let i = 0; i < listaProyectos.length; i++) {
        const p = listaProyectos[i];
        const est = String(p.Estado_Proyecto || p.estado || p.estadoProyecto || "").trim();
        if (est === "03_En_Ejecucion" || est.includes("Ejecucion") || est.includes("Ejecución")) {
          const magRaw = String(p.Magnitud_Complejidad || p.Categoria_TShirt || p.magnitud || p.tShirt || "").trim().toLowerCase();
          if (magRaw === "heavy" || magRaw.startsWith("h-heavy") || magRaw.startsWith("xl") || magRaw.startsWith("l-large") || magRaw.includes("grande") || magRaw.includes("complej")) {
            conteoHeavy++;
          } else if (magRaw === "light" || magRaw.startsWith("l-light") || magRaw.startsWith("xs") || magRaw.startsWith("s-small") || magRaw.includes("pequeñ")) {
            // Light no suma a la carga crítica concurrente
          } else {
            conteoMedium++;
          }
        }
      }

      const alertaSobrecarga = (conteoHeavy > 1) || (conteoMedium > 2);
      let mensajeAlerta = "Carga operativa dentro de los umbrales recomendados.";

      if (conteoHeavy > 1 && conteoMedium > 2) {
        mensajeAlerta = `[Alerta de Sobrecarga]: Se detectaron ${conteoHeavy} proyectos 'Heavy' (máx. recomendado: 1) y ${conteoMedium} proyectos 'Medium' (máx. recomendado: 2) simultáneamente en ejecución. Riesgo crítico de dispersión cognitiva y retrasos en entregables.`;
      } else if (conteoHeavy > 1) {
        mensajeAlerta = `[Alerta de Sobrecarga]: Se detectaron ${conteoHeavy} proyectos 'Heavy' en ejecución activa (máx. recomendado: 1). Riesgo alto de sobreasignación de esfuerzo y cuellos de botella.`;
      } else if (conteoMedium > 2) {
        mensajeAlerta = `[Alerta de Sobrecarga]: Se detectaron ${conteoMedium} proyectos 'Medium' en ejecución activa (máx. recomendado: 2). Se sugiere secuenciar o pausar iniciativas secundarias.`;
      }

      return {
        alertaSobrecarga: alertaSobrecarga,
        conteoHeavy: conteoHeavy,
        conteoMedium: conteoMedium,
        mensajeAlerta: mensajeAlerta
      };
    } catch (err) {
      Logger.log("[auditarCargaProyectosActivos Error]: " + err.message);
      return {
        alertaSobrecarga: false,
        conteoHeavy: 0,
        conteoMedium: 0,
        mensajeAlerta: "No fue posible auditar la carga: " + err.message
      };
    }
  },

  guardarDecisionTradeOff: function (payload) {
    try {
      const p = payload || {};
      const idProyecto = String(p.idProyecto || p.ID_Proyecto || "").trim();
      const tituloDecision = String(p.tituloDecision || p.Titulo_Decision || p.titulo || "").trim();
      if (!idProyecto) return { success: false, error: "ID_Proyecto es obligatorio para registrar una decisión Trade-Off." };
      if (!tituloDecision) return { success: false, error: "El título de la decisión es obligatorio." };

      const criterios = Array.isArray(p.criterios) ? p.criterios : (typeof p.criterios === "string" ? JSON.parse(p.criterios) : []);
      const alternativas = Array.isArray(p.alternativas) ? p.alternativas : (typeof p.alternativas === "string" ? JSON.parse(p.alternativas) : []);
      const matriz = p.matrizEvaluacion || p.matriz || {};

      if (criterios.length === 0) return { success: false, error: "Debe definirse al menos 1 criterio de evaluación." };
      if (alternativas.length < 2) return { success: false, error: "Debe registrarse un mínimo de 2 alternativas para comparar." };

      let sumaPesos = 0;
      criterios.forEach(function (c) {
        sumaPesos += (parseFloat(c.peso) || 0);
      });
      if (Math.abs(sumaPesos - 100) > 2.0 && Math.abs(sumaPesos - 1) > 0.05) {
        return { success: false, error: "La suma de las ponderaciones debe ser 100% (actual: " + Math.round(sumaPesos) + "%)." };
      }

      const factorPeso = (sumaPesos > 2) ? 0.01 : 1.0;
      let mejorScore = -1;
      let alternativaGanadora = "";
      const scoresMap = {};

      alternativas.forEach(function (alt) {
        const altNombre = typeof alt === "object" ? (alt.nombre || alt.titulo) : String(alt);
        const ratingsAlt = matriz[altNombre] || [];
        let scoreAlt = 0;
        criterios.forEach(function (c, cIdx) {
          const pesoNorm = (parseFloat(c.peso) || 0) * factorPeso;
          const calif = parseFloat(ratingsAlt[cIdx]) || 1;
          scoreAlt += (pesoNorm * calif);
        });
        scoresMap[altNombre] = Math.round(scoreAlt * 100) / 100;
        if (scoreAlt > mejorScore) {
          mejorScore = scoreAlt;
          alternativaGanadora = altNombre;
        }
      });

      const scoreFinal = Math.round(mejorScore * 100) / 100;
      const sheet = (typeof verificarYCrearHojaTradeOff === "function") ? verificarYCrearHojaTradeOff() : null;
      if (!sheet) return { success: false, error: "No se pudo acceder a la hoja de decisiones Trade-Off." };

      const idDecision = String(p.idDecision || p.ID_Decision || "").trim() ||
        ("DEC-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss"));

      const cols = CONFIG.COLS_DECISIONES_TRADEOFF;
      const newRow = new Array(cols.MAX_COLUMNS || 11).fill("");
      newRow[cols.ID_DECISION] = idDecision;
      newRow[cols.ID_PROYECTO] = idProyecto;
      newRow[cols.TITULO_DECISION] = tituloDecision;
      newRow[cols.ARQUETIPO_ACTIVO] = String(p.arquetipoActivo || p.tipoDecision || "Adquisición de Activo / Decisión Tipo 1").trim();
      newRow[cols.CRITERIOS_JSON] = JSON.stringify(criterios);
      newRow[cols.ALTERNATIVAS_JSON] = JSON.stringify(alternativas);
      newRow[cols.MATRIZ_EVALUACION_JSON] = JSON.stringify(matriz);
      newRow[cols.ALTERNATIVA_RECOMENDADA] = alternativaGanadora;
      newRow[cols.SCORE_GANADOR] = scoreFinal;
      newRow[cols.ESTADO_DECISION] = String(p.estadoDecision || "Aprobada").trim();
      newRow[cols.FECHA_REGISTRO] = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

      sheet.appendRow(newRow);
      if (typeof invalidarCacheDashboard === "function") invalidarCacheDashboard();

      return {
        success: true,
        idDecision: idDecision,
        alternativaRecomendada: alternativaGanadora,
        scoreGanador: scoreFinal,
        scores: scoresMap
      };
    } catch (err) {
      Logger.log("[guardarDecisionTradeOff Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  obtenerDecisionesTradeOff: function (payload) {
    try {
      const p = payload || {};
      const idProyFiltro = String(p.idProyecto || p.ID_Proyecto || "").trim().toUpperCase();
      const sheet = (typeof verificarYCrearHojaTradeOff === "function") ? verificarYCrearHojaTradeOff() : null;
      if (!sheet || sheet.getLastRow() <= 1) {
        return { success: true, data: [] };
      }

      const cols = CONFIG.COLS_DECISIONES_TRADEOFF;
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      const lista = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const idP = String(r[cols.ID_PROYECTO] || "").trim().toUpperCase();
        if (idProyFiltro && idP !== idProyFiltro) continue;

        let critArr = [];
        let altArr = [];
        let matObj = {};
        try { critArr = JSON.parse(r[cols.CRITERIOS_JSON] || "[]"); } catch (e) { }
        try { altArr = JSON.parse(r[cols.ALTERNATIVAS_JSON] || "[]"); } catch (e) { }
        try { matObj = JSON.parse(r[cols.MATRIZ_EVALUACION_JSON] || "{}"); } catch (e) { }

        lista.push({
          ID_Decision: String(r[cols.ID_DECISION] || "").trim(),
          idDecision: String(r[cols.ID_DECISION] || "").trim(),
          ID_Proyecto: String(r[cols.ID_PROYECTO] || "").trim(),
          idProyecto: String(r[cols.ID_PROYECTO] || "").trim(),
          Titulo_Decision: String(r[cols.TITULO_DECISION] || "").trim(),
          tituloDecision: String(r[cols.TITULO_DECISION] || "").trim(),
          Arquetipo_Activo: String(r[cols.ARQUETIPO_ACTIVO] || "").trim(),
          criterios: critArr,
          alternativas: altArr,
          matrizEvaluacion: matObj,
          Alternativa_Recomendada: String(r[cols.ALTERNATIVA_RECOMENDADA] || "").trim(),
          alternativaRecomendada: String(r[cols.ALTERNATIVA_RECOMENDADA] || "").trim(),
          Score_Ganador: parseFloat(r[cols.SCORE_GANADOR]) || 0,
          scoreGanador: parseFloat(r[cols.SCORE_GANADOR]) || 0,
          Estado_Decision: String(r[cols.ESTADO_DECISION] || "Aprobada").trim(),
          Fecha_Registro: String(r[cols.FECHA_REGISTRO] || "").trim()
        });
      }

      return { success: true, data: lista };
    } catch (err) {
      Logger.log("[obtenerDecisionesTradeOff Error]: " + err.message);
      return { success: false, error: err.message, data: [] };
    }
  }
};

/**
 * Funciones puras globales exportables para interoperabilidad directa
 */
function evaluarFeatureFlagsProyecto(arquetipo, magnitud) {
  return ProyectosService.evaluarFeatureFlagsProyecto(arquetipo, magnitud);
}

function auditarCargaProyectosActivos(proyectosOpt) {
  return ProyectosService.auditarCargaProyectosActivos(proyectosOpt);
}

function guardarDecisionTradeOff(payload) {
  return ProyectosService.guardarDecisionTradeOff(payload);
}

function obtenerDecisionesTradeOff(payload) {
  return ProyectosService.obtenerDecisionesTradeOff(payload);
}

