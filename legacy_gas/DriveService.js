/**
 * ============================================================================
 * ARCHIVO: DriveService.gs
 * SISTEMA: PMO Personal Modular
 * ROL: Provisionamiento y Gestión de Árbol de Carpetas en Google Drive
 * ============================================================================
 */

// ============================================================================
// SECCIÓN 1: SERVICIO DE DRIVE (DriveService)
// ============================================================================
const DriveService = {

  /**
   * Caché en memoria de IDs de carpetas para evitar llamadas repetitivas y lentas
   * a DriveApp.getFoldersByName durante el ciclo de vida de la ejecución.
   */
  _carpetasCache: {},

  /**
   * 1.1. Inicializa la estructura de carpetas de una iniciativa en Drive
   * y persiste el hipervínculo en la Columna X de BBDD_Proyectos.
   * Formato de carpeta raíz: "[ID_Proyecto] Nombre_Proyecto"
   */
  inicializarCarpetaProyecto: function(idProyecto, nombreProyecto, parentFolderId = null) {
    try {
      const folderName = `[${idProyecto}] ${nombreProyecto}`;
      let rootFolder;

      if (parentFolderId) {
        rootFolder = DriveApp.getFolderById(parentFolderId);
      } else {
        rootFolder = DriveApp.getRootFolder();
      }

      // Verificación en caché de memoria para mitigar búsquedas redundantes
      const cacheKey = (parentFolderId || "root") + ":" + folderName;
      let projectFolder = null;

      if (DriveService._carpetasCache[cacheKey]) {
        try {
          projectFolder = DriveApp.getFolderById(DriveService._carpetasCache[cacheKey]);
        } catch (eCache) {
          projectFolder = null;
        }
      }

      if (!projectFolder) {
        const existing = rootFolder.getFoldersByName(folderName);
        if (existing.hasNext()) {
          projectFolder = existing.next();
        } else {
          projectFolder = rootFolder.createFolder(folderName);

          // Subdirectorios estándar de gobernanza documental
          projectFolder.createFolder("01_Actas_Gobernanza");
          projectFolder.createFolder("02_Entregables_Evidencias");
          projectFolder.createFolder("03_Comprobantes_Finanzas");
        }
        DriveService._carpetasCache[cacheKey] = projectFolder.getId();
      }

      const folderUrl = projectFolder.getUrl();

      // Persistencia del enlace en BBDD_Proyectos (Columna X / Índice 23)
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PROYECTOS);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (data[i][CONFIG.COLS_PROYECTOS.ID_PROYECTO] === idProyecto) {
          sheet.getRange(i + 1, CONFIG.COLS_PROYECTOS.URL_DRIVE + 1).setValue(folderUrl);
          break;
        }
      }

      return {
        success: true,
        folderUrl: folderUrl,
        folderId: projectFolder.getId()
      };

    } catch (error) {
      Logger.log(`[DriveService Error] Inicialización fallida para ${idProyecto}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 1.2. Almacena un archivo adjunto de una Nota en Google Drive — [DEPRECADO]
   * NOTA ARQUITECTURAL: Los archivos adjuntos de notas se persisten directamente
   * en la propiedad 'Adjuntos' del JSON de la nota (BBDD_Notas Columna F / JS_Notas.html).
   * Este método queda deprecado. Se mantiene con caché de carpeta por resiliencia.
   */
  guardarArchivoAdjuntoNota: function(idNota, base64Data, mimeType, fileName) {
    Logger.log(`[DriveService DEPRECATED]: guardarArchivoAdjuntoNota invocado para nota ${idNota}. Los adjuntos se gestionan directamente en el JSON de BBDD_Notas.`);
    try {
      if (!base64Data) throw new Error("Datos Base64 no proporcionados");
      const folderName = "Sistema_Portal_Notas_Adjuntos";
      let folder = null;

      if (DriveService._carpetasCache[folderName]) {
        try {
          folder = DriveApp.getFolderById(DriveService._carpetasCache[folderName]);
        } catch (eF) {
          folder = null;
        }
      }

      if (!folder) {
        const folders = DriveApp.getFoldersByName(folderName);
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        DriveService._carpetasCache[folderName] = folder.getId();
      }

      // Limpiar prefijo data URL si viene incluido (ej. data:image/png;base64,...)
      let cleanBase64 = String(base64Data || "").trim();
      if (cleanBase64.indexOf(",") !== -1) {
        cleanBase64 = cleanBase64.split(",")[1].trim();
      }

      const decoded = Utilities.base64Decode(cleanBase64);
      const safeName = (fileName || `Adjunto_${idNota}_${Date.now()}`).trim();
      const safeMime = mimeType || "application/octet-stream";
      const blob = Utilities.newBlob(decoded, safeMime, safeName);
      const file = folder.createFile(blob);

      // Otorgar permisos de visualización
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (ePerm) {
        Logger.log("[DriveService] Permisos limitados por política de dominio: " + ePerm.message);
      }

      const fileId = file.getId();
      const fileUrl = file.getUrl();
      const downloadUrl = file.getDownloadUrl ? file.getDownloadUrl() : fileUrl;

      return {
        success: true,
        deprecated: true,
        id: fileId,
        nombre: safeName,
        url: fileUrl,
        downloadUrl: downloadUrl,
        mimeType: safeMime,
        esImagen: safeMime.toLowerCase().startsWith("image/"),
        sizeBytes: decoded.length,
        fecha: new Date().toISOString()
      };
    } catch (err) {
      Logger.log(`[DriveService Error] Error guardando adjunto de nota: ${err.message}`);
      return {
        success: false,
        deprecated: true,
        error: err.message
      };
    }
  },

  /**
   * 1.3. Almacena un archivo adjunto de una Idea (Audio, Foto, Archivo) en Google Drive
   * Carpeta canónica: 'MiPortalWeb_Ideas_Adjuntos'
   */
  guardarArchivoAdjuntoIdea: function(idIdea, base64Data, mimeType, fileName) {
    try {
      if (!base64Data) throw new Error("Datos Base64 no proporcionados");
      const folderName = "MiPortalWeb_Ideas_Adjuntos";
      let folder = null;

      if (DriveService._carpetasCache[folderName]) {
        try {
          folder = DriveApp.getFolderById(DriveService._carpetasCache[folderName]);
        } catch (eF) {
          folder = null;
        }
      }

      if (!folder) {
        const folders = DriveApp.getFoldersByName(folderName);
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        DriveService._carpetasCache[folderName] = folder.getId();
      }

      // Limpiar prefijo data URL si viene incluido (ej. data:audio/webm;base64,...)
      let cleanBase64 = String(base64Data || "").trim();
      if (cleanBase64.indexOf(",") !== -1) {
        cleanBase64 = cleanBase64.split(",")[1].trim();
      }

      const decoded = Utilities.base64Decode(cleanBase64);
      const safeMime = (mimeType && String(mimeType).trim()) ? String(mimeType).trim() : "application/octet-stream";
      
      let extension = "bin";
      if (safeMime.includes("webm")) extension = "webm";
      else if (safeMime.includes("mp4") || safeMime.includes("m4a")) extension = "mp4";
      else if (safeMime.includes("ogg")) extension = "ogg";
      else if (safeMime.includes("wav")) extension = "wav";
      else if (safeMime.includes("jpeg") || safeMime.includes("jpg")) extension = "jpg";
      else if (safeMime.includes("png")) extension = "png";
      else if (safeMime.includes("webp")) extension = "webp";

      const safeName = (fileName || `Adjunto_${idIdea || 'Idea'}_${Date.now()}.${extension}`).trim();
      const blob = Utilities.newBlob(decoded, safeMime, safeName);
      const file = folder.createFile(blob);

      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (ePerm) {
        Logger.log("[DriveService] Permisos limitados por política de dominio: " + ePerm.message);
      }

      const fileId = file.getId();
      const fileUrl = file.getUrl();
      const downloadUrl = file.getDownloadUrl ? file.getDownloadUrl() : fileUrl;
      const viewUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

      return {
        success: true,
        id: fileId,
        nombre: safeName,
        url: fileUrl,
        downloadUrl: downloadUrl,
        viewUrl: viewUrl,
        mimeType: safeMime,
        esAudio: safeMime.toLowerCase().startsWith("audio/"),
        esImagen: safeMime.toLowerCase().startsWith("image/"),
        sizeBytes: decoded.length,
        fecha: new Date().toISOString()
      };
    } catch (err) {
      Logger.log(`[DriveService Error] Error guardando adjunto de idea: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    }
  }
};
