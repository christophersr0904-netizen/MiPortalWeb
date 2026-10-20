/**
 * ============================================================================
 * ARCHIVO: NotasService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Servicio Transaccional para Notas Inteligentes (Fase 4.13 – 12 columnas)
 * ============================================================================
 * ESQUEMA CANÓNICO BBDD_Notas (A:L) – Fase 4.13
 *   A  ID_NOTA              PK  NOT-XXX
 *   B  TITULO               Texto plano
 *   C  CONTENIDO_MARKDOWN   Markdown puro
 *   D  CHECKLISTS_JSON      JSON: [{ id, texto, completado }]
 *   E  WISHLIST_JSON        JSON: { costoEstimado, moneda, nivelDeseo, … } | ""
 *   F  COLOR_TEMA           Token Tailwind o #HEX
 *   G  ES_FIJADA            "Sí" / "No"
 *   H  ADJUNTOS_DRIVE_JSON  JSON: [{ id, nombre, url, tipo, thumbnail }]
 *   I  VINCULOS_JSON        JSON: [{ tipo, codigo, titulo }]
 *   J  ETIQUETAS_JSON       JSON Array o comma-separated
 *   K  FECHA_CREACION       ISO 8601
 *   L  FECHA_ACTUALIZACION  ISO 8601
 *
 * TIPO_NOTA ya NO es columna física. Se infiere:
 *   WISHLIST  → WISHLIST_JSON ≠ ""
 *   CHECKLIST → CHECKLISTS_JSON.length > 0 (y WISHLIST_JSON vacío)
 *   NORMAL    → resto
 * ============================================================================
 */

const NotasService = {

  // ────────────────────────────────────────────────────────────────────────────
  // CABECERAS CANÓNICAS DE LA HOJA (Fase 4.13)
  // ────────────────────────────────────────────────────────────────────────────
  _HEADERS_CANONICOS: [
    "ID_Nota",
    "Titulo",
    "Contenido_Markdown",
    "Checklists_JSON",
    "Wishlist_JSON",
    "Color_Tema",
    "Es_Fijada",
    "Adjuntos_Drive_JSON",
    "Enlaces_Entidades_JSON",
    "Etiquetas",
    "Fecha_Creacion",
    "Fecha_Actualizacion"
  ],

  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS INTERNOS
  // ────────────────────────────────────────────────────────────────────────────

  /** Parsea JSON de forma segura; retorna fallback si falla o está vacío. */
  _parseJsonSafe: function(raw, fallback) {
    if (!raw) return fallback;
    var s = String(raw).trim();
    if (!s || s === '""' || s === "''") return fallback;
    try { return JSON.parse(s); } catch (e) { return fallback; }
  },

  /**
   * Devuelve el valor de la primera clave DEFINIDA (!== undefined) del payload.
   * Las claves legacy se listan primero porque la SPA muta esas propiedades
   * (Vinculos, Checklist, WishlistMeta, Color, Contenido) y luego reenvía el
   * objeto nota completo, que también arrastra las copias canónicas cacheadas.
   * Clientes que sólo envíen claves canónicas Fase 4.13 se resuelven igual.
   */
  _pickDef: function(payload, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (payload[keys[i]] !== undefined) return payload[keys[i]];
    }
    return undefined;
  },

  /** Infiere TIPO_NOTA en runtime a partir del contenido de la fila JS. */
  _inferirTipoNota: function(wishlistJson, checklistsJson) {
    if (wishlistJson && typeof wishlistJson === 'object' && Object.keys(wishlistJson).length > 0) {
      return "WISHLIST";
    }
    if (Array.isArray(checklistsJson) && checklistsJson.length > 0) {
      return "CHECKLIST";
    }
    return "NORMAL";
  },

  /** Normaliza el booleano de fijado desde múltiples formatos. */
  _parseBoolPin: function(raw) {
    if (raw === true || raw === 1) return true;
    var s = String(raw || "").toLowerCase().trim();
    return (s === "sí" || s === "si" || s === "true" || s === "1");
  },

  /** Normaliza color: acepta token Tailwind o #HEX; fallback → 'default'. */
  _normalizarColorTema: function(raw) {
    if (!raw) return 'default';
    var s = String(raw).trim();
    // Permitir HEX directo (#FFF, #FFFFFF, etc.)
    if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s.toLowerCase();
    s = s.toLowerCase();
    // 16 tonos canónicos Tailwind exactos + 'default'
    var canonicos = [
      "default", "slate", "red", "orange", "amber", "yellow",
      "lime", "green", "emerald", "teal", "cyan", "sky",
      "blue", "indigo", "violet", "purple", "rose"
    ];
    if (canonicos.indexOf(s) !== -1) return s;
    // Aliases comunes en español / inglés no-canónicos
    var aliases = {
      verde: 'green', azul: 'blue', amarillo: 'yellow', rojo: 'red',
      celeste: 'sky', morado: 'purple', rosa: 'rose', naranja: 'orange',
      lila: 'violet', turquesa: 'teal', lima: 'lime', esmeralda: 'emerald',
      ambar: 'amber', pizarra: 'slate',
      gray: 'slate', grey: 'slate', white: 'default', pink: 'rose', fuchsia: 'purple'
    };
    if (aliases[s]) return aliases[s];
    if (CONFIG.COLORES_NOTAS && CONFIG.COLORES_NOTAS.indexOf(s) !== -1) return s;
    return 'default';
  },

  // ────────────────────────────────────────────────────────────────────────────
  // obtenerHojaNotas
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * Obtiene la hoja BBDD_Notas o la inicializa con los 12 encabezados canónicos.
   * En hojas existentes con el esquema anterior (11 columnas / TIPO_NOTA), ejecuta
   * la migración inline al nuevo esquema de 12 columnas.
   */
  obtenerHojaNotas: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEETS.NOTAS);

    if (!sheet) {
      // Hoja nueva → escribir cabeceras canónicas
      sheet = ss.insertSheet(CONFIG.SHEETS.NOTAS);
      sheet.getRange(1, 1, 1, this._HEADERS_CANONICOS.length)
           .setValues([this._HEADERS_CANONICOS])
           .setFontWeight("bold");
      SpreadsheetApp.flush();
      return sheet;
    }

    // ── Migración defensiva (solo si la hoja existe con esquema anterior) ──
    try {
      const lastCol = sheet.getLastColumn();
      if (lastCol < 12) {
        // Insertar columnas faltantes
        const colsNeeded = 12 - lastCol;
        sheet.insertColumnsAfter(lastCol, colsNeeded);
      }

      // Verificar si la cabecera actual ya es canónica
      const currentHeaders = sheet.getRange(1, 1, 1, 12).getValues()[0];
      const tipoNotaHeader = String(currentHeaders[2] || "").trim().toLowerCase();

      if (tipoNotaHeader === "tipo_nota") {
        // ── Esquema anterior detectado: migramos inline ──
        // Col2 era TIPO_NOTA → la sustituimos por CONTENIDO_MARKDOWN (movemos datos)
        // Leer todos los datos para reorganizar
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const dataOld = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
          const dataNew = dataOld.map(function(r) {
            // Índices del esquema ANTERIOR:
            // 0=ID, 1=TITULO, 2=TIPO_NOTA, 3=CONTENIDO, 4=COLOR, 5=ES_FIJADA,
            // 6=CHECKLIST, 7=ADJUNTOS, 8=VINCULOS, 9=ETIQUETAS, 10=FC, 11=FA
            const oldTipo     = String(r[2] || "NORMAL").trim().toUpperCase();
            const oldContenido = String(r[3] || "").trim();
            const oldColor    = String(r[4] || "default").trim();
            const oldFijada   = r[5];
            const oldCheck    = r[6];
            const oldAdj      = r[7];
            const oldVinc     = r[8];
            const oldEt       = r[9];
            const oldFc       = r[10];
            const oldFa       = r[11];

            // Wishlist meta: en el esquema anterior estaba como ítem WISHLIST_META dentro de VINCULOS
            let wishlistJsonStr = "";
            let vinculosLimpios = [];
            try {
              const vincs = JSON.parse(String(oldVinc || "[]"));
              if (Array.isArray(vincs)) {
                vinculosLimpios = vincs.filter(function(v) {
                  if (v && v.tipo === "WISHLIST_META") {
                    wishlistJsonStr = JSON.stringify(v);
                    return false;
                  }
                  return true;
                });
              }
            } catch (e) {
              vinculosLimpios = [];
            }

            // Si el tipo era WISHLIST pero no había WISHLIST_META, crear estructura mínima
            if (oldTipo === "WISHLIST" && !wishlistJsonStr) {
              wishlistJsonStr = JSON.stringify({
                costoEstimado: 0, moneda: "PEN", nivelDeseo: "Media",
                enlaceReferencia: "", estadoDeseo: "Pendiente",
                montoRealGastado: 0, fechaConseguido: null, idGastoVinculado: null
              });
            }

            // Nuevo esquema: A B C D E F G H I J K L
            return [
              r[0],                                   // A ID_NOTA
              r[1],                                   // B TITULO
              oldContenido,                           // C CONTENIDO_MARKDOWN
              String(oldCheck || "[]"),               // D CHECKLISTS_JSON
              wishlistJsonStr,                        // E WISHLIST_JSON
              oldColor,                               // F COLOR_TEMA
              oldFijada,                              // G ES_FIJADA
              String(oldAdj || "[]"),                 // H ADJUNTOS_DRIVE_JSON
              JSON.stringify(vinculosLimpios),        // I VINCULOS_JSON
              String(oldEt || ""),                    // J ETIQUETAS_JSON
              oldFc,                                  // K FECHA_CREACION
              oldFa                                   // L FECHA_ACTUALIZACION
            ];
          });
          sheet.getRange(2, 1, dataNew.length, 12).setValues(dataNew);
        }
        // Reescribir cabeceras canónicas
        sheet.getRange(1, 1, 1, this._HEADERS_CANONICOS.length)
             .setValues([this._HEADERS_CANONICOS])
             .setFontWeight("bold");
        SpreadsheetApp.flush();
        Logger.log("[NotasService] Migración Fase 4.13 completada: BBDD_Notas → 12 columnas canónicas.");
      }
    } catch (eMig) {
      Logger.log("[NotasService.obtenerHojaNotas Migración] " + eMig.message);
    }

    return sheet;
  },

  // ────────────────────────────────────────────────────────────────────────────
  // obtenerNotas
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.1. Obtiene todas las notas activas con parseo seguro y caché volátil.
   * Devuelve un arreglo de objetos con propiedades en PascalCase Y camelCase
   * para máxima compatibilidad con el cliente.
   */
  obtenerNotas: function(payload) {
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get("NOTAS_DATA_CACHE");
      if (cached && !(payload && payload.forceRefresh)) {
        try { return JSON.parse(cached); } catch (eCache) { /* continuar */ }
      }

      const sheet = this.obtenerHojaNotas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1 || sheet.getLastColumn() === 0) {
        return { success: true, notas: [] };
      }

      const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
      const notas = [];
      const C = CONFIG.COLS_NOTAS;

      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const idNota = String(r[C.ID_NOTA] || "").trim();
        if (!idNota) continue;

        // ── Contenido Markdown ──
        const contenidoMarkdown = String(r[C.CONTENIDO_MARKDOWN] || "").trim();

        // ── Checklists (Col D) ──
        let checklists = this._parseJsonSafe(r[C.CHECKLISTS_JSON], []);
        if (!Array.isArray(checklists)) checklists = [];

        // ── WishList (Col E) ──
        let wishlistJson = this._parseJsonSafe(r[C.WISHLIST_JSON], null);
        if (wishlistJson && typeof wishlistJson !== "object") wishlistJson = null;
        // Limpiar artefactos: si parseó como array, ignorar
        if (Array.isArray(wishlistJson)) wishlistJson = null;

        // ── Color (Col F) ──
        const colorTema = this._normalizarColorTema(r[C.COLOR_TEMA]);

        // ── Es Fijada (Col G) ──
        const esFijada = this._parseBoolPin(r[C.ES_FIJADA]);

        // ── Adjuntos (Col H) ──
        let adjuntos = this._parseJsonSafe(r[C.ADJUNTOS_DRIVE_JSON], []);
        if (!Array.isArray(adjuntos)) adjuntos = [];

        // ── Vínculos / Enlaces a Entidades (Col I: Enlaces_Entidades_JSON) ──
        let vinculos = [];
        try {
          const colVinc = (C.ENLACES_ENTIDADES_JSON !== undefined) ? C.ENLACES_ENTIDADES_JSON : C.VINCULOS_JSON;
          const rawVinc = String(r[colVinc] || "").trim();
          if (rawVinc && (rawVinc.startsWith("[") || rawVinc.startsWith("{"))) {
            const parsed = JSON.parse(rawVinc);
            vinculos = Array.isArray(parsed) ? parsed : [parsed];
          } else if (rawVinc) {
            // Formato legacy: código suelto separado por comas
            const regexMatches = rawVinc.match(/(TAR|PRO|HIT|ACT|HAB|GAS|ING)[A-Za-z0-9_-]*/g);
            if (regexMatches) {
              regexMatches.forEach(function(code) {
                let t = "TAREA";
                if (code.startsWith("PRO")) t = "PROYECTO";
                else if (code.startsWith("HIT")) t = "HITO";
                else if (code.startsWith("ACT") || code.startsWith("HAB")) t = "ACTIVIDAD";
                else if (code.startsWith("GAS")) t = "GASTO";
                else if (code.startsWith("ING")) t = "INGRESO";
                vinculos.push({ tipo: t, codigo: code, titulo: code });
              });
            }
          }
          // Purgar artefactos WISHLIST_META (residen en Col E)
          vinculos = vinculos.filter(function(v) { return v && v.tipo !== "WISHLIST_META"; });
        } catch (eVinc) {
          vinculos = [];
        }

        // ── Etiquetas (Col J: ETIQUETAS) ──
        let etiquetas = [];
        try {
          const colEt = (C.ETIQUETAS !== undefined) ? C.ETIQUETAS : C.ETIQUETAS_JSON;
          const rawEt = String(r[colEt] || "").trim();
          if (rawEt.startsWith("[")) {
            etiquetas = JSON.parse(rawEt);
          } else if (rawEt) {
            etiquetas = rawEt.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
          }
        } catch (eEt) {
          etiquetas = [];
        }

        // ── Tipo inferido (sin columna física) ──
        const tipoNota = this._inferirTipoNota(wishlistJson, checklists);

        // ── Compatibilidad Tabla (Checklist Dinámico Multicolumna) ──
        let tabla = null;
        if (contenidoMarkdown.startsWith("{") && contenidoMarkdown.includes('"columnas"')) {
          try {
            const parsedObj = JSON.parse(contenidoMarkdown);
            if (parsedObj && (Array.isArray(parsedObj.columnas) || Array.isArray(parsedObj.filas))) {
              tabla = parsedObj;
            }
          } catch (eTabla) { tabla = null; }
        }

        notas.push({
          // Claves PascalCase (uso servidor + legacy)
          ID_Nota:                idNota,
          Titulo:                 String(r[C.TITULO] || "").trim(),
          Tipo_Nota:              tipoNota,
          Contenido:              contenidoMarkdown,       // alias legacy
          Contenido_Markdown:     contenidoMarkdown,
          Checklists_JSON:        checklists,
          Wishlist_JSON:          wishlistJson,
          Color:                  colorTema,               // alias legacy
          Color_Tema:             colorTema,
          Es_Fijada:              esFijada,
          Checklist:              checklists,              // alias legacy
          Tabla:                  tabla,
          Adjuntos:               adjuntos,                // alias legacy
          Adjuntos_Drive_JSON:    adjuntos,
          Vinculos:               vinculos,                // alias legacy
          Vinculos_JSON:          vinculos,
          Enlaces_Entidades_JSON: vinculos,
          Enlaces_Entidades:      vinculos,
          Vinculaciones:          vinculos,
          WishlistMeta:           wishlistJson,            // alias legacy
          Etiquetas:              etiquetas,               // alias legacy
          Etiquetas_JSON:         etiquetas,
          Tags:                   etiquetas,
          Fecha_Creacion:         r[C.FECHA_CREACION] ? String(r[C.FECHA_CREACION]) : new Date().toISOString(),
          Fecha_Actualizacion:    r[C.FECHA_ACTUALIZACION] ? String(r[C.FECHA_ACTUALIZACION]) : new Date().toISOString(),
          // Claves camelCase (uso cliente JS)
          idNota:                 idNota,
          titulo:                 String(r[C.TITULO] || "").trim(),
          tipoNota:               tipoNota,
          contenido:              contenidoMarkdown,
          contenidoMarkdown:      contenidoMarkdown,
          checklistsJson:         checklists,
          wishlistJson:           wishlistJson,
          wishlistMeta:           wishlistJson,
          color:                  colorTema,
          colorTema:              colorTema,
          esFijada:               esFijada,
          checklist:              checklists,
          tabla:                  tabla,
          adjuntos:               adjuntos,
          adjuntosDriveJson:      adjuntos,
          vinculos:               vinculos,
          vinculosJson:           vinculos,
          enlacesEntidadesJson:   vinculos,
          enlacesEntidades:       vinculos,
          vinculaciones:          vinculos,
          etiquetas:              etiquetas,
          etiquetasJson:          etiquetas,
          tags:                   etiquetas
        });
      }

      const res = { success: true, notas: notas };
      try { cache.put("NOTAS_DATA_CACHE", JSON.stringify(res), 600); } catch (ePut) { /* ignorar */ }
      return res;

    } catch (err) {
      Logger.log("[NotasService.obtenerNotas Error]: " + err.message);
      return { success: false, error: err.message, notas: [] };
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // guardarNota
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.2. Inserta o actualiza una Nota. Acepta tanto payloads del esquema nuevo
   * (Contenido_Markdown, Checklists_JSON, Wishlist_JSON) como del esquema anterior
   * (Contenido, Checklist, Vinculos con WISHLIST_META embebido) para retrocompatibilidad.
   */
  guardarNota: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(12000);

      const sheet = this.obtenerHojaNotas();
      const lastRow = sheet.getLastRow();
      const maxCols = sheet.getMaxColumns();
      if (maxCols < 12) sheet.insertColumnsAfter(maxCols, 12 - maxCols);

      const data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 12).getValues() : [];
      const C = CONFIG.COLS_NOTAS;

      // ── Resolver ID ──
      let idNota = String(payload.ID_Nota || payload.idNota || payload.id || "").trim();
      let rowIndex = -1;

      if (idNota && !payload.esNueva && !payload.isNew) {
        const targetClean = idNota.toUpperCase().trim();
        const targetNorm  = targetClean.replace(/^NOT-0*/, 'NOT-');
        const targetDigits = targetClean.replace(/\D/g, '');

        for (let i = 0; i < data.length; i++) {
          const rawId    = String(data[i][C.ID_NOTA] || "").trim().toUpperCase();
          if (!rawId) continue;
          const rawNorm  = rawId.replace(/^NOT-0*/, 'NOT-');
          const rawDigits = rawId.replace(/\D/g, '');
          if (rawId === targetClean || rawNorm === targetNorm ||
              (targetDigits && rawDigits === targetDigits)) {
            rowIndex = i + 2;
            idNota = String(data[i][C.ID_NOTA] || idNota).trim();
            break;
          }
        }
      }

      const isNew = (rowIndex === -1);
      if (isNew) idNota = CorrelativoService.generarIdNota();

      // ── Campos de texto básicos ──
      const titulo = String(payload.Titulo || payload.titulo || "").trim();

      // ── Contenido Markdown (acepta Contenido_Markdown o Contenido legacy) ──
      let contenidoMarkdown = String(
        this._pickDef(payload, ["Contenido", "contenido", "Contenido_Markdown", "contenidoMarkdown"]) || ""
      ).trim();

      // ── Tabla multicolumna (si se envía como objeto, serializar) ──
      let tablaObj = payload.Tabla || payload.tabla || null;
      if (tablaObj && typeof tablaObj === "object") {
        contenidoMarkdown = JSON.stringify(tablaObj);
      } else if (contenidoMarkdown.startsWith("{") && contenidoMarkdown.includes('"columnas"')) {
        try { tablaObj = JSON.parse(contenidoMarkdown); } catch (e) { }
      }

      // ── Checklists (Col D) ──
      let checklistArr = [];
      // Acepta: Checklists_JSON (nuevo), Checklist (legacy), tabla.filas (muy legacy)
      const rawCheckSrc = this._pickDef(payload, ["Checklist", "checklist", "Checklists_JSON", "checklistsJson"]);
      if (Array.isArray(rawCheckSrc)) {
        checklistArr = rawCheckSrc;
      } else if (typeof rawCheckSrc === "string" && rawCheckSrc.trim().startsWith("[")) {
        try { checklistArr = JSON.parse(rawCheckSrc); } catch (e) { checklistArr = []; }
      }
      // Sintetizar desde tabla si checklist plano vacío
      if (checklistArr.length === 0 && tablaObj && Array.isArray(tablaObj.filas)) {
        const colCheck = (tablaObj.columnas || []).find(function(c) { return c.tipo === "checkbox" || c.tipo === "check"; });
        const checkKey = colCheck ? colCheck.id : "col_check";
        const colText  = (tablaObj.columnas || [])[0];
        const textKey  = colText ? colText.id : "col_criterio";
        checklistArr = tablaObj.filas.map(function(f, idx) {
          return {
            id:        f.id || ("chk_" + idx),
            texto:     String((f.valores && f.valores[textKey]) || f.texto || ""),
            completado: !!(f.valores && f.valores[checkKey])
          };
        });
      }

      // ── Wishlist JSON (Col E: Wishlist_JSON) ──
      // Acepta: Wishlist_JSON (nuevo), WishlistMeta legacy, o WISHLIST_META embebido
      let wishlistJson = null;

      // Prioridad 1: campo Wishlist_JSON explícito
      const rawWl = this._pickDef(payload, ["WishlistMeta", "wishlistMeta", "Wishlist_JSON", "wishlistJson"]);
      if (rawWl && typeof rawWl === "object" && !Array.isArray(rawWl)) {
        wishlistJson = Object.assign({}, rawWl);
        delete wishlistJson.tipo; // limpiar artefacto legacy WISHLIST_META.tipo
        if (rawWl.urlReferencia && !wishlistJson.urlReferencia) wishlistJson.urlReferencia = rawWl.urlReferencia;
        if (rawWl.enlaceReferencia && !wishlistJson.urlReferencia) wishlistJson.urlReferencia = rawWl.enlaceReferencia;
        if (!wishlistJson.enlaceReferencia && wishlistJson.urlReferencia) wishlistJson.enlaceReferencia = wishlistJson.urlReferencia;
      } else if (typeof rawWl === "string" && rawWl.trim().startsWith("{")) {
        try {
          wishlistJson = JSON.parse(rawWl);
          delete wishlistJson.tipo;
          if (wishlistJson.enlaceReferencia && !wishlistJson.urlReferencia) wishlistJson.urlReferencia = wishlistJson.enlaceReferencia;
          if (!wishlistJson.enlaceReferencia && wishlistJson.urlReferencia) wishlistJson.enlaceReferencia = wishlistJson.urlReferencia;
        } catch (e) { wishlistJson = null; }
      }

      // Prioridad 2: si el tipo declarado es WISHLIST pero no hay wishlistJson, crear estructura unificada
      const tipoDeclarado = String(payload.Tipo_Nota || payload.tipoNota || "").trim().toUpperCase();
      if ((tipoDeclarado === "WISHLIST" || payload.costoEstimado !== undefined || payload.montoRealGastado !== undefined) && !wishlistJson) {
        wishlistJson = {
          costoEstimado:    parseFloat(payload.costoEstimado)    || 0,
          montoRealGastado: parseFloat(payload.montoRealGastado) || 0,
          moneda:           payload.moneda                        || "PEN",
          nivelDeseo:       payload.nivelDeseo                   || "Media",
          estadoDeseo:      payload.estadoDeseo                  || "Pendiente",
          urlReferencia:    payload.urlReferencia                || payload.enlaceReferencia || "",
          enlaceReferencia: payload.enlaceReferencia             || payload.urlReferencia || "",
          fechaConseguido:  payload.fechaConseguido              || null,
          idGastoVinculado: payload.idGastoVinculado             || null
        };
      }

      // ── Color Tema (Col F: COLOR_TEMA) ──
      const colorTema = this._normalizarColorTema(
        this._pickDef(payload, ["Color", "color", "Color_Tema", "colorTema"])
      );

      // ── Es Fijada (Col G: ES_FIJADA) ──
      const pinVal = (payload.Es_Fijada !== undefined) ? payload.Es_Fijada : payload.esFijada;
      const esFijada = this._parseBoolPin(pinVal);

      // ── Adjuntos (Col H: ADJUNTOS_DRIVE_JSON) ──
      let adjuntosArr = [];
      const rawAdj = this._pickDef(payload, ["Adjuntos", "adjuntos", "Adjuntos_Drive_JSON", "adjuntosDriveJson"]);
      if (Array.isArray(rawAdj)) {
        adjuntosArr = rawAdj;
      } else if (typeof rawAdj === "string" && rawAdj.trim().startsWith("[")) {
        try { adjuntosArr = JSON.parse(rawAdj); } catch (e) { adjuntosArr = []; }
      }

      // ── Enlaces a Entidades (Col I: ENLACES_ENTIDADES_JSON) ──
      // Persiste el array polimórfico universal [{ tipo: 'PROYECTO'|'HITO'|'TAREA'|'ACTIVIDAD'|'GASTO'|'INGRESO', codigo: 'XXX-000' }]
      let vinculosArr = [];
      const rawVinc = this._pickDef(payload, [
        "Vinculos", "vinculos", "Enlaces_Entidades_JSON", "enlacesEntidadesJson",
        "Enlaces_Entidades", "enlacesEntidades", "Vinculaciones", "vinculaciones",
        "Vinculos_JSON", "vinculosJson"
      ]);
      if (Array.isArray(rawVinc)) {
        vinculosArr = rawVinc;
      } else if (rawVinc && typeof rawVinc === "object") {
        vinculosArr = [rawVinc];
      } else if (typeof rawVinc === "string" && rawVinc.trim()) {
        const tv = rawVinc.trim();
        if (tv.startsWith("[") || tv.startsWith("{")) {
          try {
            const parsed = JSON.parse(tv);
            vinculosArr = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) { vinculosArr = []; }
        }
        if (vinculosArr.length === 0) {
          const regexMatches = tv.match(/(TAR|PRO|HIT|ACT|HAB|GAS|ING)[A-Za-z0-9_-]*/g);
          if (regexMatches) {
            regexMatches.forEach(function(code) {
              let t = "TAREA";
              if (code.startsWith("PRO")) t = "PROYECTO";
              else if (code.startsWith("HIT")) t = "HITO";
              else if (code.startsWith("ACT") || code.startsWith("HAB")) t = "ACTIVIDAD";
              else if (code.startsWith("GAS")) t = "GASTO";
              else if (code.startsWith("ING")) t = "INGRESO";
              vinculosArr.push({ tipo: t, codigo: code, titulo: code });
            });
          }
        }
      }
      // Purgar artefactos WISHLIST_META del array de vínculos y homologar estructura
      if (Array.isArray(vinculosArr)) {
        vinculosArr = vinculosArr.map(function(v) {
          if (!v) return null;
          if (typeof v === "string") {
            var cod = v.trim();
            var t = "TAREA";
            if (cod.startsWith("PRO")) t = "PROYECTO";
            else if (cod.startsWith("HIT")) t = "HITO";
            else if (cod.startsWith("ACT") || cod.startsWith("HAB")) t = "ACTIVIDAD";
            else if (cod.startsWith("GAS")) t = "GASTO";
            else if (cod.startsWith("ING")) t = "INGRESO";
            return { tipo: t, codigo: cod, titulo: cod };
          }
          var t = String(v.tipo || "TAREA").toUpperCase();
          if (t === "HABITO") t = "ACTIVIDAD";
          if (t === "FINANZAS") t = "GASTO";
          return {
            tipo: t,
            codigo: String(v.codigo || v.id || "").trim(),
            titulo: String(v.titulo || v.nombre || v.codigo || "").trim()
          };
        }).filter(function(v) {
          return v && v.codigo && v.tipo !== "WISHLIST_META";
        });
      } else {
        vinculosArr = [];
      }

      // ── Etiquetas (Col J: ETIQUETAS) ──
      let etiquetasArr = [];
      const rawEt = this._pickDef(payload, ["Etiquetas", "etiquetas", "tags", "Tags", "Etiquetas_JSON", "etiquetasJson"]);
      if (Array.isArray(rawEt)) {
        etiquetasArr = rawEt.map(function(s) { return String(s || "").trim().replace(/^#+/, ""); }).filter(Boolean);
      } else if (typeof rawEt === "string") {
        if (rawEt.trim().startsWith("[")) {
          try {
            etiquetasArr = JSON.parse(rawEt).map(function(s) { return String(s || "").trim().replace(/^#+/, ""); }).filter(Boolean);
          } catch (e) { etiquetasArr = []; }
        } else {
          etiquetasArr = rawEt.split(",").map(function(s) { return s.trim().replace(/^#+/, ""); }).filter(Boolean);
        }
      }

      // ── Timestamps ISO 8601 ──
      const nowIso = new Date().toISOString();
      const fechaCreacion = isNew
        ? nowIso
        : ((data[rowIndex - 2] && data[rowIndex - 2][C.FECHA_CREACION]) || nowIso);
      const fechaActualizacion = nowIso;

      // ── Tipo inferido para respuesta ──
      const tipoNota = this._inferirTipoNota(wishlistJson, checklistArr);

      // ── Fila a persistir (exactamente 12 columnas canónicas A:L) ──
      const expectedCols = (CONFIG.COLS_NOTAS && CONFIG.COLS_NOTAS.MAX_COLUMNS) || 12;
      const rowValues = [
        idNota,                                                 // A ID_NOTA: 0
        titulo,                                                 // B TITULO: 1
        contenidoMarkdown,                                      // C CONTENIDO_MARKDOWN: 2
        JSON.stringify(checklistArr),                           // D CHECKLISTS_JSON: 3
        wishlistJson ? JSON.stringify(wishlistJson) : "",       // E WISHLIST_JSON: 4
        colorTema,                                              // F COLOR_TEMA: 5
        esFijada ? "Sí" : "No",                                // G ES_FIJADA: 6
        JSON.stringify(adjuntosArr),                            // H ADJUNTOS_DRIVE_JSON: 7
        JSON.stringify(vinculosArr || []),                      // I ENLACES_ENTIDADES_JSON: 8
        JSON.stringify(etiquetasArr),                           // J ETIQUETAS: 9
        fechaCreacion,                                          // K FECHA_CREACION: 10
        fechaActualizacion                                      // L FECHA_ACTUALIZACION: 11
      ];

      while (rowValues.length < expectedCols) rowValues.push("");
      if (rowValues.length > expectedCols) rowValues.length = expectedCols;

      if (isNew) {
        sheet.appendRow(rowValues);
      } else {
        if (sheet.getMaxColumns() < rowValues.length)
          sheet.insertColumnsAfter(sheet.getMaxColumns(), rowValues.length - sheet.getMaxColumns());
        if (rowIndex > sheet.getMaxRows())
          sheet.insertRowsAfter(sheet.getMaxRows(), rowIndex - sheet.getMaxRows());
        sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      }

      SpreadsheetApp.flush();
      this.invalidarCache();

      // ── Objeto respuesta enriquecido (Soporte Híbrido Unificado) ──
      const notaObj = {
        ID_Nota:                idNota,
        idNota:                 idNota,
        Titulo:                 titulo,
        titulo:                 titulo,
        Tipo_Nota:              tipoNota,
        tipoNota:               tipoNota,
        Contenido:              contenidoMarkdown,
        contenido:              contenidoMarkdown,
        Contenido_Markdown:     contenidoMarkdown,
        contenidoMarkdown:      contenidoMarkdown,
        Checklists_JSON:        checklistArr,
        checklistsJson:         checklistArr,
        Wishlist_JSON:          wishlistJson,
        wishlistJson:           wishlistJson,
        Color_Tema:             colorTema,
        colorTema:              colorTema,
        Color:                  colorTema,
        color:                  colorTema,
        Es_Fijada:              esFijada,
        esFijada:               esFijada,
        Checklist:              checklistArr,
        checklist:              checklistArr,
        Tabla:                  tablaObj,
        tabla:                  tablaObj,
        Adjuntos:               adjuntosArr,
        adjuntos:               adjuntosArr,
        Adjuntos_Drive_JSON:    adjuntosArr,
        adjuntosDriveJson:      adjuntosArr,
        Enlaces_Entidades_JSON: vinculosArr,
        enlacesEntidadesJson:   vinculosArr,
        Enlaces_Entidades:      vinculosArr,
        enlacesEntidades:       vinculosArr,
        Vinculaciones:          vinculosArr,
        vinculaciones:          vinculosArr,
        Vinculos:               vinculosArr,
        vinculos:               vinculosArr,
        Vinculos_JSON:          vinculosArr,
        vinculosJson:           vinculosArr,
        WishlistMeta:           wishlistJson,
        wishlistMeta:           wishlistJson,
        Etiquetas:              etiquetasArr,
        etiquetas:              etiquetasArr,
        Etiquetas_JSON:         etiquetasArr,
        etiquetasJson:          etiquetasArr,
        Tags:                   etiquetasArr,
        tags:                   etiquetasArr,
        Fecha_Creacion:         fechaCreacion,
        Fecha_Actualizacion:    fechaActualizacion
      };

      return { success: true, isNew: isNew, nota: notaObj };

    } catch (err) {
      Logger.log("[NotasService.guardarNota Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // createNota / updateNota — persistencia canónica 12 columnas (A:L)
  // ────────────────────────────────────────────────────────────────────────────
  createNota: function(payload) {
    return this.guardarNota(Object.assign({}, payload || {}, { isNew: true, esNueva: true }));
  },

  updateNota: function(payload) {
    return this.guardarNota(payload);
  },

  // ────────────────────────────────────────────────────────────────────────────
  // togglePinNota
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.3. Alterna el estado de fijado (Pin) de una nota.
   */
  togglePinNota: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const idNota = String(
        (typeof payload === "object" ? (payload.idNota || payload.ID_Nota) : payload) || ""
      ).trim().toUpperCase();
      if (!idNota) throw new Error("ID de nota inválido");

      const sheet   = this.obtenerHojaNotas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) throw new Error("No existen notas registradas");

      const C   = CONFIG.COLS_NOTAS;
      const ids = sheet.getRange(2, C.ID_NOTA + 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || "").trim().toUpperCase() === idNota) {
          rowIndex = i + 2; break;
        }
      }
      if (rowIndex === -1) throw new Error("Nota " + idNota + " no encontrada");

      const currentVal = sheet.getRange(rowIndex, C.ES_FIJADA + 1).getValue();
      const newPinState = !this._parseBoolPin(currentVal);

      sheet.getRange(rowIndex, C.ES_FIJADA + 1).setValue(newPinState ? "Sí" : "No");
      sheet.getRange(rowIndex, C.FECHA_ACTUALIZACION + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      this.invalidarCache();

      return { success: true, idNota: idNota, esFijada: newPinState };
    } catch (err) {
      Logger.log("[NotasService.togglePinNota Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // eliminarNota
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.4. Elimina una nota por su identificador primario.
   */
  eliminarNota: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
      const idNota = String(
        (typeof payload === "object" ? (payload.idNota || payload.ID_Nota) : payload) || ""
      ).trim().toUpperCase();
      if (!idNota) throw new Error("ID de nota no especificado");

      const sheet   = this.obtenerHojaNotas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: true, message: "Hoja vacía" };

      const C   = CONFIG.COLS_NOTAS;
      const ids = sheet.getRange(2, C.ID_NOTA + 1, lastRow - 1, 1).getValues();
      let notaExiste = false;
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || "").trim().toUpperCase() === idNota) {
          notaExiste = true; break;
        }
      }

      if (notaExiste) {
        sobrescribirHojaFiltrada(sheet, function(row) {
          return String(row[C.ID_NOTA] || "").trim().toUpperCase() !== idNota;
        });
        SpreadsheetApp.flush();
        this.invalidarCache();
        if (typeof invalidarCacheDashboard === "function") invalidarCacheDashboard();
      }

      return { success: true, idNota: idNota };
    } catch (err) {
      Logger.log("[NotasService.eliminarNota Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      try { lock.releaseLock(); } catch (eLock) { }
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // actualizarChecklistNota
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.5. Actualiza el estado de un ítem de checklist en la nota (Col D).
   */
  actualizarChecklistNota: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const idNota = String(payload.idNota || payload.ID_Nota || "").trim().toUpperCase();
      if (!idNota) throw new Error("ID de nota inválido");

      const sheet   = this.obtenerHojaNotas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) throw new Error("No hay notas");

      const C   = CONFIG.COLS_NOTAS;
      const ids = sheet.getRange(2, C.ID_NOTA + 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || "").trim().toUpperCase() === idNota) {
          rowIndex = i + 2; break;
        }
      }
      if (rowIndex === -1) throw new Error("Nota no encontrada");

      // Leer desde Col D (CHECKLISTS_JSON)
      const cellVal = sheet.getRange(rowIndex, C.CHECKLISTS_JSON + 1).getValue();
      let list = this._parseJsonSafe(cellVal, []);
      if (!Array.isArray(list)) list = [];

      const index     = payload.index !== undefined ? parseInt(payload.index, 10) : -1;
      const itemId    = payload.itemId ? String(payload.itemId).trim() : "";
      const completado = !!payload.completado;

      if (index >= 0 && index < list.length) {
        list[index].completado = completado;
      } else if (itemId) {
        const item = list.find(function(x) { return String(x.id || "").trim() === itemId; });
        if (item) item.completado = completado;
      }

      sheet.getRange(rowIndex, C.CHECKLISTS_JSON + 1).setValue(JSON.stringify(list));
      sheet.getRange(rowIndex, C.FECHA_ACTUALIZACION + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      this.invalidarCache();

      return { success: true, checklist: list };
    } catch (err) {
      Logger.log("[NotasService.actualizarChecklistNota Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // adjuntarArchivoNota
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.6. Sube y asocia un archivo adjunto a una nota en Google Drive (Col H).
   */
  adjuntarArchivoNota: function(payload) {
    try {
      const idNota    = String(payload.idNota || payload.ID_Nota || "").trim();
      const base64Data = payload.base64Data || payload.fileBase64;
      const mimeType  = payload.mimeType || "application/octet-stream";
      const fileName  = payload.fileName || payload.nombreArchivo || ("Adjunto_" + idNota);

      const resDrive = DriveService.guardarArchivoAdjuntoNota(idNota, base64Data, mimeType, fileName);
      if (!resDrive.success) return resDrive;

      if (idNota && !idNota.startsWith("TEMP_")) {
        const sheet   = this.obtenerHojaNotas();
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const C   = CONFIG.COLS_NOTAS;
          const ids = sheet.getRange(2, C.ID_NOTA + 1, lastRow - 1, 1).getValues();
          let rowIndex = -1;
          for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0] || "").trim().toUpperCase() === idNota.toUpperCase()) {
              rowIndex = i + 2; break;
            }
          }
          if (rowIndex !== -1) {
            const rawAdj = sheet.getRange(rowIndex, C.ADJUNTOS_DRIVE_JSON + 1).getValue();
            let adjList  = this._parseJsonSafe(rawAdj, []);
            if (!Array.isArray(adjList)) adjList = [];
            adjList.push(resDrive);
            sheet.getRange(rowIndex, C.ADJUNTOS_DRIVE_JSON + 1).setValue(JSON.stringify(adjList));
            sheet.getRange(rowIndex, C.FECHA_ACTUALIZACION + 1).setValue(new Date().toISOString());
            SpreadsheetApp.flush();
          }
        }
      }
      this.invalidarCache();
      return { success: true, adjunto: resDrive };
    } catch (err) {
      Logger.log("[NotasService.adjuntarArchivoNota Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // marcarDeseoConseguido
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * 1.7. Marca un deseo como 'Conseguido' o 'Pendiente'.
   * El estado wishlist ahora vive en la Col E (WISHLIST_JSON) directamente.
   */
  marcarDeseoConseguido: function(payload) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(12000);
      const idNota = String(
        (typeof payload === "object" ? (payload.idNota || payload.ID_Nota) : payload) || ""
      ).trim().toUpperCase();
      if (!idNota) throw new Error("ID de nota inválido");

      const sheet   = this.obtenerHojaNotas();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) throw new Error("No existen notas registradas");

      const C   = CONFIG.COLS_NOTAS;
      const ids = sheet.getRange(2, C.ID_NOTA + 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || "").trim().toUpperCase() === idNota) {
          rowIndex = i + 2; break;
        }
      }
      if (rowIndex === -1) throw new Error("Nota " + idNota + " no encontrada");

      const tituloNota = String(sheet.getRange(rowIndex, C.TITULO + 1).getValue() || "").trim();

      // Leer wishlist desde Col E (WISHLIST_JSON)
      const rawWl   = sheet.getRange(rowIndex, C.WISHLIST_JSON + 1).getValue();
      let wishlistMeta = this._parseJsonSafe(rawWl, null);
      if (!wishlistMeta || typeof wishlistMeta !== "object" || Array.isArray(wishlistMeta)) {
        wishlistMeta = {
          costoEstimado: 0, moneda: "PEN", nivelDeseo: "Media",
          enlaceReferencia: "", estadoDeseo: "Pendiente",
          montoRealGastado: 0, fechaConseguido: null, idGastoVinculado: null
        };
      }

      const nuevoEstado  = payload.estadoDeseo
        ? String(payload.estadoDeseo).trim()
        : (wishlistMeta.estadoDeseo === "Conseguido" ? "Pendiente" : "Conseguido");
      wishlistMeta.estadoDeseo = nuevoEstado;
      const montoGastado = parseFloat(payload.montoGastado || payload.montoRealGastado || 0) || 0;

      let gastoCreado = null;
      if (nuevoEstado === "Conseguido") {
        wishlistMeta.fechaConseguido = new Date().toISOString();
        if (montoGastado > 0) wishlistMeta.montoRealGastado = montoGastado;

        const registrarGasto = (payload.registrarGasto === true || String(payload.registrarGasto) === "true");
        if (registrarGasto && montoGastado > 0 &&
            typeof FinanzasService !== "undefined" && FinanzasService.createGasto) {
          const resGasto = FinanzasService.createGasto({
            fechaGasto:       Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd"),
            monedaOriginal:   payload.moneda || wishlistMeta.moneda || "PEN",
            montoOriginal:    montoGastado,
            categoriaGasto:   "Compras/Personal",
            descripcionGasto: "WishList: " + (tituloNota || idNota),
            idTarea:          idNota,
            estadoPago:       "Pagado"
          });
          if (resGasto && (resGasto.success || resGasto.idGasto)) {
            gastoCreado = resGasto;
            wishlistMeta.idGastoVinculado = resGasto.idGasto || resGasto.ID_Gasto;
          }
        }
      } else {
        wishlistMeta.fechaConseguido = null;
      }

      // Persistir en Col E
      sheet.getRange(rowIndex, C.WISHLIST_JSON + 1).setValue(JSON.stringify(wishlistMeta));
      sheet.getRange(rowIndex, C.FECHA_ACTUALIZACION + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      this.invalidarCache();
      if (gastoCreado && typeof FinanzasService !== "undefined" && FinanzasService.invalidarCache) {
        FinanzasService.invalidarCache();
      }

      return {
        success:      true,
        idNota:       idNota,
        estadoDeseo:  nuevoEstado,
        wishlistMeta: wishlistMeta,
        gastoCreado:  gastoCreado
      };
    } catch (err) {
      Logger.log("[NotasService.marcarDeseoConseguido Error]: " + err.message);
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  },

  // ────────────────────────────────────────────────────────────────────────────
  // invalidarCache
  // ────────────────────────────────────────────────────────────────────────────
  /**
   * Invalida cachés del sistema para sincronización inmediata.
   */
  invalidarCache: function() {
    try {
      const cache = CacheService.getScriptCache();
      cache.remove("NOTAS_DATA_CACHE");
      cache.remove("DASHBOARD_DATA_CACHE");
    } catch (e) {
      Logger.log("[NotasService.invalidarCache Warning]: " + e.message);
    }
  }
};
