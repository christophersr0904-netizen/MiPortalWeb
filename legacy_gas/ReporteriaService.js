/**
 * ============================================================================
 * ARCHIVO: ReporteriaService.gs
 * SISTEMA: PMO Personal Modular
 * ROL: Motor Cuantitativo EVM, Integración con Gemini y Ficha 1-Page en PDF
 * ============================================================================
 */

// ============================================================================
// SECCIÓN 1: SERVICIO DE REPORTERÍA Y VALOR GANADO
// ============================================================================
const ReporteriaService = {

  /**
   * 1.1. Orquestador de métricas EVM y ensamblado de Ficha Ejecutiva en Drive
   */
  generarFichaPdf: function(idProyecto) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Extracción de Proyecto
    const pSheet = ss.getSheetByName(CONFIG.SHEETS.PROYECTOS);
    const pData = pSheet.getDataRange().getValues();
    const pHeaders = pData[0];
    const rawProyecto = pData.slice(1).find(r => String(r[CONFIG.COLS_PROYECTOS.ID_PROYECTO]).trim() === idProyecto);
    if (!rawProyecto) throw new Error("Proyecto no encontrado: " + idProyecto);

    let proyecto = {};
    pHeaders.forEach((h, i) => { proyecto[h] = rawProyecto[i]; });

    // 2. Extracción de Hitos
    const hSheet = ss.getSheetByName(CONFIG.SHEETS.HITOS);
    const hData = hSheet.getDataRange().getValues();
    const hHeaders = hData[0];
    const hitos = hData.slice(1)
      .filter(r => String(r[CONFIG.COLS_HITOS.ID_PROYECTO]).trim() === idProyecto)
      .map(r => {
        let obj = {};
        hHeaders.forEach((h, i) => { obj[h] = r[i]; });
        return obj;
      });

    // 3. Extracción de Tareas del Proyecto (Todas para evaluación de salud, top 3 con notas para bloqueos)
    const tSheet = ss.getSheetByName(CONFIG.SHEETS.TAREAS);
    const tData = tSheet.getDataRange().getValues();
    const tHeaders = tData[0];
    const tareasProyecto = tData.slice(1)
      .filter(r => String(r[CONFIG.COLS_TAREAS.ID_PROYECTO]).trim() === idProyecto)
      .map(r => {
        let obj = {};
        tHeaders.forEach((h, i) => { obj[h] = r[i]; });
        return obj;
      });

    const bloqueos = tareasProyecto
      .filter(t => t[CONFIG.COLS_TAREAS.NOTAS] || t.Notas || t.Notas_Impedimentos)
      .slice(0, 3);

    // 4. Cálculo matemático formal EVM (cálculo único reutilizable)
    const evm = this.calcularMetricasEVM(proyecto);

    // 4.1. Evaluación determinista de Salud (reutilizando EVM precalculado y evaluando TODAS las tareas del proyecto)
    const evaluacionSalud = this.evaluarSaludDeterminista(proyecto, hitos, tareasProyecto, evm);
    proyecto.Health_Status = evaluacionSalud.status;
    proyecto.Health_Motivo = evaluacionSalud.motivo;

    // 5. Diagnóstico ejecutivo cualitativo con Gemini
    const analisisIA = this.obtenerAnalisisEVM(proyecto, hitos, evm);

    // 6. Renderizado de plantilla y exportación a Blob PDF
    const template = HtmlService.createTemplateFromFile("FichaEjecutiva");
    template.proyecto = proyecto;
    template.hitos = hitos;
    template.bloqueos = bloqueos;
    template.evm = evm;
    template.evaluacionSalud = evaluacionSalud;
    template.analisisIA = analisisIA;

    const htmlContent = template.evaluate().getContent();
    const pdfBlob = Utilities.newBlob(htmlContent, MimeType.HTML, `Ficha_${idProyecto}.html`)
      .getAs(MimeType.PDF)
      .setName(`Ficha_Ejecutiva_${idProyecto}.pdf`);

    // 7. Almacenamiento en Google Drive
    let destinoFolder = DriveApp.getRootFolder();
    const driveUrl = proyecto.Alcance_Detallado_URL_Drive || proyecto.URL_Drive;
    if (driveUrl && driveUrl.includes("folders/")) {
      const folderId = driveUrl.split("folders/")[1].split("?")[0];
      try {
        destinoFolder = DriveApp.getFolderById(folderId);
      } catch (e) {
        Logger.log("[Drive Fallback]: " + e.message);
      }
    }

    const archivoPdf = destinoFolder.createFile(pdfBlob);
    return {
      success: true,
      nombreArchivo: archivoPdf.getName(),
      pdfUrl: archivoPdf.getUrl(),
      evm: evm
    };
  },

  /**
   * 1.2. Motor Matemático Canónico de EVM (PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC)
   */
  calcularMetricasEVM: function(proyecto) {
    const presupuestoTope = Number(proyecto.Presupuesto_Tope) || 0;
    const avanceReal = Math.min(Math.max(Number(proyecto.Avance_Real_Pct) || 0, 0), 1);
    const moneda = String(proyecto.Moneda_Base || "PEN").trim().toUpperCase();

    const costoPEN = Number(proyecto.Costo_Ejecutado_Real_PEN || proyecto.Costo_Real_PEN) || 0;
    const costoUSD = Number(proyecto.Costo_Ejecutado_Real_USD || proyecto.Costo_Real_USD) || 0;
    const ac = (moneda === "USD") ? costoUSD : costoPEN;

    const hoy = new Date();
    const fInicio = proyecto.Fecha_Inicio_Plan ? new Date(proyecto.Fecha_Inicio_Plan) : hoy;
    const fFin = proyecto.Fecha_Fin_Plan ? new Date(proyecto.Fecha_Fin_Plan) : hoy;

    let pctTiempo = 0;
    const duracionTotal = fFin.getTime() - fInicio.getTime();
    if (duracionTotal > 0) {
      pctTiempo = (hoy.getTime() - fInicio.getTime()) / duracionTotal;
      pctTiempo = Math.min(Math.max(pctTiempo, 0), 1);
    }

    const pv = presupuestoTope * pctTiempo;
    const ev = presupuestoTope * avanceReal;
    const cv = ev - ac;
    const sv = ev - pv;
    const cpi = (ac > 0) ? (ev / ac) : 1.00;
    const spi = (pv > 0) ? (ev / pv) : 1.00;
    const eac = (cpi > 0) ? (presupuestoTope / cpi) : presupuestoTope;
    const vac = presupuestoTope - eac;

    return {
      moneda: moneda,
      presupuestoTope: presupuestoTope,
      pctTiempoPlan: pctTiempo,
      pv: pv,
      ev: ev,
      ac: ac,
      cv: cv,
      sv: sv,
      cpi: cpi,
      spi: spi,
      eac: eac,
      vac: vac
    };
  },

  /**
   * 1.2.1. Evaluación Determinista de Salud (Cronograma, Desempeño EVM y Presupuesto)
   * 🟢 "Saludable": SPI >= 0.95, CPI >= 0.95, presupuesto bajo control y sin hitos críticos atrasados.
   * 🟡 "En Riesgo": SPI o CPI entre 0.80 y 0.94, atraso < 7 días en hito activo, o consumo presupuesto 90-100%.
   * 🔴 "Crítico": SPI < 0.80, CPI < 0.80, presupuesto superado (>100%), o fecha fin vencida con avance < 100%, o atraso >= 7 días.
   */
  evaluarSaludDeterminista: function(proyecto, hitos, tareas, evmPrecalculado) {
    hitos = Array.isArray(hitos) ? hitos : [];
    tareas = Array.isArray(tareas) ? tareas : [];

    const evm = evmPrecalculado || this.calcularMetricasEVM(proyecto);
    const spi = evm.spi;
    const cpi = evm.cpi;
    const presupuestoTope = evm.presupuestoTope;
    const ac = evm.ac;
    const consumoPresupuestoPct = (presupuestoTope > 0) ? (ac / presupuestoTope) : 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // a) Cronograma (Desvío en tareas e hitos)
    let maxDiasAtrasoHito = 0;
    let hitosAtrasados = 0;
    let tareasAtrasadas = 0;

    hitos.forEach(h => {
      const estado = String(h.Estado_Hito || h.ESTADO || h.Estado || "").trim();
      const fLimVal = h.Fecha_Limite_Plan || h.FECHA_LIMITE_PLAN || h.Fecha_Limite;
      if (estado !== "04_Completado" && estado !== "06_Cerrado" && fLimVal) {
        const fLim = new Date(fLimVal);
        if (!isNaN(fLim.getTime()) && fLim < hoy) {
          hitosAtrasados++;
          const diffDias = Math.floor((hoy.getTime() - fLim.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDias > maxDiasAtrasoHito) maxDiasAtrasoHito = diffDias;
        }
      }
    });

    tareas.forEach(t => {
      const estado = String(t.Estado_Tarea || t.ESTADO || t.Estado || "").trim();
      const fProgVal = t.Fecha_Programada || t.FECHA_PROGRAMADA || t.Fecha_Programada_Tarea;
      if (estado !== "04_Completado" && estado !== "05_Cancelado" && estado !== "05_Archivado" && fProgVal) {
        const fProg = new Date(fProgVal);
        if (!isNaN(fProg.getTime()) && fProg < hoy) {
          tareasAtrasadas++;
        }
      }
    });

    // Fecha fin del proyecto superada
    let fechaFinSuperadaSinCompletar = false;
    const fFinVal = proyecto.Fecha_Fin_Plan || proyecto.FECHA_FIN_PLAN;
    if (fFinVal) {
      const fFin = new Date(fFinVal);
      const avance = parseFloat(proyecto.Avance_Real_Pct || proyecto.AVANCE_REAL_PCT) || 0;
      if (!isNaN(fFin.getTime()) && fFin < hoy && avance < 1.0) {
        fechaFinSuperadaSinCompletar = true;
      }
    }

    let status = "🟢 Saludable";
    let motivo = "";

    // Reglas deterministas estrictas:
    if (spi < 0.80 || cpi < 0.80 || consumoPresupuestoPct > 1.0 || fechaFinSuperadaSinCompletar || maxDiasAtrasoHito >= 7) {
      status = "🔴 Crítico";
      const motivos = [];
      if (spi < 0.80) motivos.push(`SPI crítico (${spi.toFixed(2)})`);
      if (cpi < 0.80) motivos.push(`CPI crítico (${cpi.toFixed(2)})`);
      if (consumoPresupuestoPct > 1.0) motivos.push(`Presupuesto superado (${Math.round(consumoPresupuestoPct * 100)}%)`);
      if (fechaFinSuperadaSinCompletar) motivos.push("Fecha fin vencida sin avance al 100%");
      if (maxDiasAtrasoHito >= 7) motivos.push(`Hito activo con ${maxDiasAtrasoHito}d de retraso`);
      motivo = motivos.join(" | ");
    } else if ((spi >= 0.80 && spi < 0.95) || (cpi >= 0.80 && cpi < 0.95) || (consumoPresupuestoPct >= 0.90 && consumoPresupuestoPct <= 1.0) || maxDiasAtrasoHito > 0 || tareasAtrasadas > 0) {
      status = "🟡 En Riesgo";
      const motivos = [];
      if (spi < 0.95) motivos.push(`SPI bajo (${spi.toFixed(2)})`);
      if (cpi < 0.95) motivos.push(`CPI bajo (${cpi.toFixed(2)})`);
      if (consumoPresupuestoPct >= 0.90) motivos.push(`Presupuesto en límite (${Math.round(consumoPresupuestoPct * 100)}%)`);
      if (maxDiasAtrasoHito > 0) motivos.push(`Hito activo con ${maxDiasAtrasoHito}d de atraso`);
      else if (tareasAtrasadas > 0) motivos.push(`${tareasAtrasadas} tarea(s) vencida(s)`);
      motivo = motivos.join(" | ");
    } else {
      status = "🟢 Saludable";
      motivo = `SPI: ${spi.toFixed(2)}, CPI: ${cpi.toFixed(2)}. Cronograma y presupuesto (${Math.round(consumoPresupuestoPct * 100)}%) en rango.`;
    }

    return {
      status: status,
      spi: spi,
      cpi: cpi,
      consumoPresupuestoPct: consumoPresupuestoPct,
      motivo: motivo,
      maxDiasAtrasoHito: maxDiasAtrasoHito,
      tareasAtrasadas: tareasAtrasadas
    };
  },

  /**
   * 1.3. Consulta analítica de desempeño EVM a la API de Gemini
   */
  obtenerAnalisisEVM: function(proyecto, hitos, evm) {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) return "Análisis cualitativo no disponible: GEMINI_API_KEY no configurada.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Actúa como Director de PMO y Consultor Senior de Valor Ganado (EVM).
Emite un diagnóstico analítico ejecutivo de desempeño de alta dirección (ESTRICTAMENTE MÁXIMO 80 PALABRAS) para la Ficha 1-Page:
- Iniciativa: ${proyecto.Nombre_Proyecto} (${proyecto.ID_Proyecto}) | Salud: ${proyecto.Health_Status} | Fase: ${proyecto.Fase_Ciclo_Vida}
- Moneda: ${evm.moneda} | Presupuesto Tope (BAC): ${evm.presupuestoTope.toFixed(2)}
- Métricas EVM: PV=${evm.pv.toFixed(2)}, EV=${evm.ev.toFixed(2)}, AC=${evm.ac.toFixed(2)}
- Variaciones: CV=${evm.cv.toFixed(2)}, SV=${evm.sv.toFixed(2)}
- Índices de Desempeño: CPI=${evm.cpi.toFixed(2)} (${evm.cpi >= 1 ? 'Eficiente en costo' : 'Sobrecosto'}), SPI=${evm.spi.toFixed(2)} (${evm.spi >= 1 ? 'Adelantado' : 'Atrasado'})
- Estimación al Cierre (EAC): ${evm.eac.toFixed(2)} (Variación VAC=${evm.vac.toFixed(2)})
- Hitos Registrados: ${hitos.length}

Reglas: Sé tajante, enfocado en impacto financiero y cumplimiento de línea base. Si CPI o SPI < 1.0, alerta el riesgo de inmediato. Solo devuelve el párrafo analítico, sin títulos ni introducciones.`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 160 }
    };

    try {
      const response = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      const data = JSON.parse(response.getContentText());
      return data.candidates[0].content.parts[0].text.trim();
    } catch (err) {
      return `CPI de ${evm.cpi.toFixed(2)} y SPI de ${evm.spi.toFixed(2)}. Mantener control sobre variaciones financieras y holguras de cronograma en la ruta crítica.`;
    }
  }
};
