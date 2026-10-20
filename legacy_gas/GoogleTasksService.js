/**
 * ============================================================================
 * ARCHIVO: GoogleTasksService.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * ROL: Servicio dedicado para crear, actualizar y eliminar Google Tasks
 *      usando la Advanced Service "Tasks" (v1).
 *      Se usa EXCLUSIVAMENTE para registros de duración = 0 horas
 *      (actividades puntuales, checks diarios) e ítems financieros
 *      (ingresos programados, gastos/cuotas pendientes).
 *
 * REGLA DE NEGOCIO INAMOVIBLE:
 *   - Duración > 0h  → Google Calendar (Evento con bloque de tiempo)
 *   - Duración = 0h  → Google Tasks (Task con fecha límite)
 *   - Ingresos futuros → Google Tasks ("💰 Cobrar: ...")
 *   - Gastos/Cuotas    → Google Tasks ("⚠️ Pagar: ...")
 *   - NUNCA se debe mutar un tipo en otro (Event ↔ Task).
 * ============================================================================
 */

const GoogleTasksService = {

  // Nombre de la lista de tareas dedicada del sistema PMO
  LISTA_PMO: "PMO Portal - Pendientes",

  // ============================================================================
  // UTILIDAD: FORMATEO SEGURO DE FECHAS RFC 3339 PARA GOOGLE TASKS
  // ============================================================================

  /**
   * Convierte una fecha a formato RFC 3339 compatible con Google Tasks API v1,
   * neutralizando desfases horarios por conversión a UTC.
   *
   * @param {string|Date} fechaEntrada - Cadena 'YYYY-MM-DD' o instancia Date
   * @returns {string|null} Cadena RFC 3339 (ej. '2026-09-26T12:00:00.000Z')
   */
  _formatearFechaRFC3339: function (fechaEntrada) {
    if (!fechaEntrada) return null;

    try {
      const timezone = (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE) ? CONFIG.TIMEZONE : "America/Lima";

      // Si es una instancia Date
      if (fechaEntrada instanceof Date && !isNaN(fechaEntrada.getTime())) {
        const strFecha = Utilities.formatDate(fechaEntrada, timezone, "yyyy-MM-dd");
        const partes = strFecha.split("-");
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        const dLocal = new Date(anio, mes, dia, 12, 0, 0);
        return Utilities.formatDate(dLocal, "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }

      // Si es un String
      const strLimpio = String(fechaEntrada).trim().split(/[\sT]/)[0];
      const partes = strLimpio.split("-");
      if (partes.length !== 3) return null;

      const anio = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const dia = parseInt(partes[2], 10);

      // Fijar al mediodía (12:00:00) para prevenir desbordes de día por husos horarios
      const dLocal = new Date(anio, mes, dia, 12, 0, 0);
      return Utilities.formatDate(dLocal, "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } catch (e) {
      Logger.log("[GoogleTasksService._formatearFechaRFC3339 Error]: " + e.message);
      return null;
    }
  },

  // ============================================================================
  // 1. OBTENCIÓN O CREACIÓN DE LA LISTA DE TAREAS DEDICADA
  // ============================================================================

  obtenerOCrearListaTareas: function () {
    // Usar la lista predeterminada "@default" para garantizar visibilidad directa e inmediata
    // en la barra lateral de Google Tasks dentro de Google Calendar y Gmail
    return "@default";
  },

  // ============================================================================
  // 2. CREAR GOOGLE TASK
  // ============================================================================

  /**
   * Crea una Google Task con fecha límite (due date).
   *
   * @param {Object} params
   * @param {string} params.titulo - Título de la tarea (con emojis según tipo)
   * @param {string} params.notas - Descripción/notas de la tarea
   * @param {string} params.fechaLimite - Fecha ISO "YYYY-MM-DD"
   * @returns {Object} { success, taskId, error }
   */
  crearTask: function (params) {
    try {
      const listId = this.obtenerOCrearListaTareas();
      const titulo = String(params.titulo || "").trim();
      if (!titulo) return { success: false, error: "Título de task vacío" };

      const taskResource = {
        title: titulo,
        notes: params.notas || "",
        status: "needsAction"
      };

      // Formateo seguro RFC 3339 respetando el día local
      if (params.fechaLimite) {
        const fechaRfc = this._formatearFechaRFC3339(params.fechaLimite);
        if (fechaRfc) {
          taskResource.due = fechaRfc;
        }
      }

      const task = Tasks.Tasks.insert(taskResource, listId);
      return { success: true, taskId: task.id };
    } catch (err) {
      Logger.log("[GoogleTasksService.crearTask Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  // ============================================================================
  // 3. ACTUALIZAR GOOGLE TASK
  // ============================================================================

  /**
   * Actualiza una Google Task existente por su ID.
   *
   * @param {Object} params
   * @param {string} params.taskId - ID de la task a actualizar
   * @param {string} [params.titulo] - Nuevo título
   * @param {string} [params.notas] - Nuevas notas
   * @param {string} [params.fechaLimite] - Nueva fecha "YYYY-MM-DD"
   * @param {boolean} [params.completada] - Marcar como completada
   * @returns {Object} { success, taskId, error }
   */
  actualizarTask: function (params) {
    try {
      const listId = this.obtenerOCrearListaTareas();
      const taskId = String(params.taskId || "").trim();
      if (!taskId) return { success: false, error: "taskId requerido para actualizar" };

      // Obtener la task existente
      let task = null;
      try {
        task = Tasks.Tasks.get(listId, taskId);
      } catch (eGet) {
        Logger.log("[GoogleTasksService.actualizarTask] Task no encontrada: " + taskId);
        return { success: false, error: "Task no encontrada: " + taskId };
      }

      if (params.titulo !== undefined) task.title = String(params.titulo).trim();
      if (params.notas !== undefined) task.notes = String(params.notas);
      if (params.fechaLimite) {
        const fechaRfc = this._formatearFechaRFC3339(params.fechaLimite);
        if (fechaRfc) {
          task.due = fechaRfc;
        }
      }
      if (params.completada === true) {
        task.status = "completed";
      } else if (params.completada === false) {
        task.status = "needsAction";
        task.completed = null;
      }

      Tasks.Tasks.update(task, listId, taskId);
      return { success: true, taskId: taskId };
    } catch (err) {
      Logger.log("[GoogleTasksService.actualizarTask Error]: " + err.message);
      return { success: false, error: err.message };
    }
  },

  // ============================================================================
  // 4. ELIMINAR GOOGLE TASK
  // ============================================================================

  /**
   * Elimina una Google Task por su ID (o lista de IDs separados por ',' o '||').
   *
   * @param {string} taskId - ID o IDs de las tasks a eliminar
   * @returns {boolean} true si se eliminó correctamente al menos una
   */
  eliminarTask: function (taskId) {
    if (!taskId) return false;
    const cleanId = String(taskId).trim();
    if (!cleanId) return false;

    const ids = cleanId.split(/[,|]+/);
    const listasAProbar = ["@default"];
    try {
      if (typeof Tasks !== "undefined" && Tasks.Tasklists) {
        const listas = Tasks.Tasklists.list();
        if (listas && listas.items && listas.items.length > 0) {
          listas.items.forEach(l => {
            if (l.id && listasAProbar.indexOf(l.id) === -1) {
              listasAProbar.push(l.id);
            }
          });
        }
      }
    } catch (eList) { }

    let alMenosUnoEliminado = false;

    for (let j = 0; j < ids.length; j++) {
      const idActual = ids[j].trim();
      if (!idActual || idActual.includes("@google.com")) continue;

      let eliminado = false;
      for (let i = 0; i < listasAProbar.length; i++) {
        try {
          Tasks.Tasks.remove(listasAProbar[i], idActual);
          Logger.log("[GoogleTasksService.eliminarTask] Tarea eliminada exitosamente: " + idActual + " en lista: " + listasAProbar[i]);
          eliminado = true;
          alMenosUnoEliminado = true;
          break;
        } catch (err) { }
      }
      if (!eliminado) {
        Logger.log("[GoogleTasksService.eliminarTask Falló en listas]: " + idActual);
      }
    }

    return alMenosUnoEliminado;
  },

  /**
   * Elimina cualquier Google Task que coincida con el título indicado (limpieza de huérfanos).
   *
   * @param {string} titulo - Título o nombre de la actividad a buscar
   * @returns {boolean} true si se eliminó al menos una coincidencia
   */
  eliminarTaskPorTitulo: function (titulo) {
    if (!titulo) return false;
    const cleanTit = String(titulo).trim().toLowerCase();
    if (!cleanTit) return false;

    const listasAProbar = ["@default"];
    try {
      if (typeof Tasks !== "undefined" && Tasks.Tasklists) {
        const listas = Tasks.Tasklists.list();
        if (listas && listas.items && listas.items.length > 0) {
          listas.items.forEach(l => {
            if (l.id && listasAProbar.indexOf(l.id) === -1) {
              listasAProbar.push(l.id);
            }
          });
        }
      }
    } catch (eList) { }

    let borrado = false;
    listasAProbar.forEach(listId => {
      try {
        if (typeof Tasks !== "undefined" && Tasks.Tasks) {
          const res = Tasks.Tasks.list(listId, { maxResults: 100 });
          if (res && res.items) {
            res.items.forEach(t => {
              if (t.title) {
                const tLow = String(t.title).trim().toLowerCase();
                if (tLow === cleanTit || tLow.includes(cleanTit) || cleanTit.includes(tLow)) {
                  try {
                    Tasks.Tasks.remove(listId, t.id);
                    Logger.log("[GoogleTasksService.eliminarTaskPorTitulo] Eliminada task coincidente: " + t.id + " (" + t.title + ") en lista " + listId);
                    borrado = true;
                  } catch (e) { }
                }
              }
            });
          }
        }
      } catch (err) {
        Logger.log("[GoogleTasksService.eliminarTaskPorTitulo Error en " + listId + "]: " + err.message);
      }
    });
    return borrado;
  },

  // ============================================================================
  // 5. HELPERS PARA FINANZAS (Títulos con formato estándar)
  // ============================================================================

  /**
   * Crea una Google Task para un ingreso programado/pendiente.
   * Formato: "💰 Cobrar: [Concepto] - [Moneda] [Monto]"
   */
  crearTaskIngreso: function (params) {
    const moneda = (params.moneda || "PEN").toUpperCase();
    const monto = parseFloat(params.monto) || 0;
    const titulo = "💰 Cobrar: " + (params.descripcion || "Ingreso") + " - " + moneda + " " + monto.toFixed(2);
    return this.crearTask({
      titulo: titulo,
      notas: (params.notas || "") + "\nPMO Portal - Ingreso Programado\nMoneda: " + moneda + "\nMonto: " + monto.toFixed(2),
      fechaLimite: params.fechaLimite
    });
  },

  /**
   * Crea una Google Task para un gasto/cuota programada/pendiente.
   * Formato: "⚠️ Pagar: [Concepto] - [Moneda] [Monto]"
   */
  crearTaskGastoCuota: function (params) {
    const moneda = (params.moneda || "PEN").toUpperCase();
    const monto = parseFloat(params.monto) || 0;
    const titulo = "⚠️ Pagar: " + (params.descripcion || "Gasto") + " - " + moneda + " " + monto.toFixed(2);
    return this.crearTask({
      titulo: titulo,
      notas: (params.notas || "") + "\nPMO Portal - Gasto/Cuota Programada\nMoneda: " + moneda + "\nMonto: " + monto.toFixed(2),
      fechaLimite: params.fechaLimite
    });
  },

  /**
   * Crea una Google Task para una actividad puntual de 0 horas (check rápido).
   * Formato: "[Categoría] Nombre Actividad"
   */
  crearTaskActividadPuntual: function (params) {
    const cat = params.categoriaVida || "PERSONAL";
    const titulo = "[" + cat + "] " + (params.nombreActividad || "Actividad");
    return this.crearTask({
      titulo: titulo,
      notas: "PMO Portal - Actividad Puntual (0h)\n" +
        "Categoría: " + cat + "\n" +
        (params.idActividad ? "ID: " + params.idActividad + "\n" : "") +
        (params.notas || ""),
      fechaLimite: params.fechaLimite
    });
  }
};

/**
 * ============================================================================
 * FUNCIÓN GLOBAL DE AUTORIZACIÓN OAUTH PARA GOOGLE TASKS
 * ============================================================================
 * Ejecuta esta función UNA SOLA VEZ desde el editor de Google Apps Script:
 * 1. Selecciona "autorizarGoogleTasks" en la barra de herramientas superior.
 * 2. Haz clic en "Ejecutar" (Run).
 * 3. En la ventana emergente de Google: "Revisar permisos" -> Selecciona tu cuenta
 *    -> "Avanzado" -> "Ir a MiPortalWeb (no seguro)" -> "Permitir".
 * 4. Listo. Con esto tu cuenta queda autorizada para insertar y leer Google Tasks.
 */
function autorizarGoogleTasks() {
  try {
    const listId = "@default";
    const tareas = Tasks.Tasks.list(listId, { maxResults: 1 });
    Logger.log("¡Google Tasks API autorizada exitosamente! Lista por defecto leída correctamente.");
    return { success: true, message: "Google Tasks API autorizada exitosamente" };
  } catch (e) {
    Logger.log("[autorizarGoogleTasks Error]: " + e.message);
    throw e;
  }
}