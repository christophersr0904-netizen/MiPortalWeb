import sys

def patch_kanban():
    with open('JS_Kanban.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update createActivityCardElement gastos check
    old_act_gasto = """      // 5. Gasto asociado
      var montoGasto = parseFloat(act.Monto_Gasto_Asociado) || 0;
      var gastoHtml = "";
      if (montoGasto > 0) {
        gastoHtml = '<span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 shadow-2xs shrink-0" title="Gasto asociado">' +
          '💳 S/ ' + montoGasto.toFixed(2) +
          '</span>';
      }"""

    new_act_gasto = """      // 5. Gasto asociado con programación defensiva estricta
      var montoGasto = 0;
      try {
        if (Array.isArray(state.gastos) && state.gastos.some(function (g) {
          if (!g) return false;
          var idEnt = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || g.ID_Actividad || "").trim().toUpperCase();
          return idEnt === idAct.toUpperCase();
        })) {
          state.gastos.forEach(function (g) {
            if (!g) return;
            var idEnt = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || g.ID_Actividad || "").trim().toUpperCase();
            if (idEnt === idAct.toUpperCase()) {
              var m = parseFloat(g.Monto_PEN || (g.Monto_Original * (g.Tipo_Cambio || 1)) || g.montoPEN || g.Monto_Moneda_Base || 0);
              if (!isNaN(m) && isFinite(m)) {
                montoGasto += m;
              }
            }
          });
        } else if (act.Monto_Gasto_Asociado) {
          montoGasto = parseFloat(act.Monto_Gasto_Asociado) || 0;
        }
      } catch (errGAct) {
        console.warn("[Kanban] Fallo no bloqueante leyendo gastos para actividad " + idAct + ":", errGAct);
        montoGasto = parseFloat(act.Monto_Gasto_Asociado) || 0;
      }
      var gastoHtml = "";
      if (montoGasto > 0) {
        gastoHtml = '<span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 shadow-2xs shrink-0" title="Gasto asociado">' +
          '💳 S/ ' + montoGasto.toFixed(2) +
          '</span>';
      }"""

    if old_act_gasto not in content:
        print("ERROR: old_act_gasto not found in JS_Kanban.html")
        return False
    content = content.replace(old_act_gasto, new_act_gasto)

    # 2. Update createTaskCardElement and define crearTarjetaKanbanHTML
    # Find start: "    createTaskCardElement: function (tarea) {"
    # Find end: "    render: function (tareas) {"
    start_marker = "    createTaskCardElement: function (tarea) {"
    end_marker = "    render: function (tareas) {"

    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)

    if start_idx == -1 or end_idx == -1:
        print("ERROR: markers for createTaskCardElement not found!")
        return False

    new_task_block = """    createTaskCardElement: function (tarea) {
      return crearTarjetaKanbanHTML(tarea);
    },
    crearTarjetaKanbanHTML: function (tarea) {
      return crearTarjetaKanbanHTML(tarea);
    },
"""

    old_task_body = content[start_idx:end_idx]

    # Let's write the standalone function crearTarjetaKanbanHTML right before var kanban = {
    kanban_def_marker = "  var kanban = {"
    kanban_def_idx = content.find(kanban_def_marker)
    if kanban_def_idx == -1:
        print("ERROR: kanban_def_marker not found!")
        return False

    crear_tarjeta_fn = """  /**
   * Generador defensivo estricto de tarjeta Kanban (crearTarjetaKanbanHTML).
   * Utiliza (state.tareas || []) y valida gastos con Array.isArray(state.gastos) && state.gastos.some(...).
   * Ningún fallo en la lectura de gastos interrumpe el renderizado de título, prioridad, horas y subtareas.
   */
  function crearTarjetaKanbanHTML(tarea) {
    if (!tarea) return null;
    var card = document.createElement("div");
    var idTareaActual = String(tarea.ID_Tarea || "").trim();
    card.id = "kanban-card-" + idTareaActual;
    card.draggable = true;
    card.className = "kanban-card kanban-card-item bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 pl-4 shadow-xs hover:shadow-md transition-all duration-150 ease-out hover:-translate-y-0.5 cursor-grab active:cursor-grabbing group relative overflow-hidden text-xs space-y-2.5 select-none animate-fadeIn";
    card.dataset.taskId = idTareaActual;
    card.dataset.depId = String(tarea.ID_Dependencia || "").trim();
    card.setAttribute("data-id-tarea", idTareaActual);

    // Conexión de eventos de hover para trazabilidad visual de precedencias
    card.onmouseenter = function () {
      if (typeof activarResaltadoDependencias === "function") {
        activarResaltadoDependencias(idTareaActual);
      }
    };

    card.onmouseleave = function () {
      if (typeof limpiarTrazabilidadKanban === "function") {
        limpiarTrazabilidadKanban();
      }
    };

    card.addEventListener("dragstart", function (e) {
      draggedTaskId = idTareaActual;
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", draggedTaskId);
        e.dataTransfer.effectAllowed = "move";
      }
      card.classList.add("card-dragging", "opacity-40", "scale-95", "rotate-1", "shadow-2xl", "border-indigo-500", "ring-2", "ring-indigo-400");
    });

    card.addEventListener("dragend", function () {
      card.classList.remove("card-dragging", "opacity-40", "scale-95", "rotate-1", "shadow-2xl", "border-indigo-500", "ring-2", "ring-indigo-400");
      draggedTaskId = null;
      if (typeof limpiarEstilosDropzone === "function") limpiarEstilosDropzone();
      if (typeof removerDropPlaceholder === "function") removerDropPlaceholder();
    });

    // 1. Barra indicadora lateral de prioridad continua
    var prioridadRaw = String(tarea.Prioridad_Eisenhower || "02_P2_Media");
    var colorBarra = "bg-amber-500";
    var badgePrioridadClases = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50";
    var labelPrioridad = "P2 Media";

    if (prioridadRaw.indexOf("01_P1") !== -1 || prioridadRaw.toLowerCase().indexOf("alta") !== -1 || prioridadRaw.toLowerCase().indexOf("urgente") !== -1) {
      colorBarra = "bg-red-500";
      badgePrioridadClases = "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50";
      labelPrioridad = "P1 Urgente";
    } else if (prioridadRaw.indexOf("02_P2") !== -1 || prioridadRaw.toLowerCase().indexOf("media") !== -1) {
      colorBarra = "bg-amber-500";
      badgePrioridadClases = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50";
      labelPrioridad = "P2 Media";
    } else if (prioridadRaw.indexOf("03_P3") !== -1 || prioridadRaw.toLowerCase().indexOf("baja") !== -1) {
      colorBarra = "bg-blue-500";
      badgePrioridadClases = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50";
      labelPrioridad = "P3 Baja";
    } else if (prioridadRaw.indexOf("04_P4") !== -1) {
      colorBarra = "bg-slate-300 dark:bg-slate-600";
      badgePrioridadClases = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
      labelPrioridad = "P4";
    }

    // 2. Nivel de Energía Requerido
    var energiaRaw = String(tarea.Nivel_Energia_Requerido || "Media_Operativa");
    var badgeEnergiaClases = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60";
    var labelEnergia = "⚙️ Operativa";

    if (energiaRaw.indexOf("Alta") !== -1 || energiaRaw.indexOf("DeepWork") !== -1) {
      badgeEnergiaClases = "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60";
      labelEnergia = "⚡ DeepWork";
    } else if (energiaRaw.indexOf("Baja") !== -1 || energiaRaw.indexOf("Admin") !== -1) {
      badgeEnergiaClases = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
      labelEnergia = "📁 Admin";
    }

    // 3. Proyecto e Hito asociados (Micro-breadcrumb)
    var idProy = String(tarea.ID_Proyecto || "").trim();
    var idHito = String(tarea.ID_Hito || "").trim();

    var hitoObj = (state.hitos || []).find(function (h) {
      return h && String(h.ID_Hito || "").trim().toUpperCase() === idHito.toUpperCase();
    });
    if (!idProy && hitoObj && hitoObj.ID_Proyecto) {
      idProy = String(hitoObj.ID_Proyecto).trim();
    }

    var proyObj = (state.proyectos || []).find(function (p) {
      return p && String(p.ID_Proyecto || "").trim().toUpperCase() === idProy.toUpperCase();
    });

    var nombreProy = proyObj ? (proyObj.Nombre_Proyecto || idProy) : (idProy || "Sin Proyecto");
    var nombreHito = hitoObj ? (hitoObj.Nombre_Hito || idHito) : (idHito || "");

    var isDone = (normalizarEstadoTarea(tarea.Estado_Tarea) === "04_Completado");

    // 4. Metadatos: Lugar, Recursos y Notas
    var lugar = (tarea.Lugar_Ejecucion || tarea.lugarEjecucion || "");
    lugar = (typeof lugar === "string") ? lugar.trim() : String(lugar || "").trim();
    var recursos = (tarea.Recursos_Requeridos || tarea.recursosRequeridos || "");
    recursos = (typeof recursos === "string") ? recursos.trim() : String(recursos || "").trim();
    var notasStr = (tarea.Notas_Impedimentos != null) ? String(tarea.Notas_Impedimentos) : "";

    if (!lugar && notasStr && notasStr.indexOf("[Lugar:") !== -1) {
      var idxLugar = notasStr.indexOf("[Lugar:");
      var finLugar = notasStr.indexOf("]", idxLugar);
      if (finLugar !== -1) lugar = notasStr.substring(idxLugar + 7, finLugar).trim();
    }
    if (lugar === "N/A") lugar = "";

    if (!recursos && notasStr && notasStr.indexOf("[Recursos:") !== -1) {
      var idxRec = notasStr.indexOf("[Recursos:");
      var finRec = notasStr.indexOf("]", idxRec);
      if (finRec !== -1) recursos = notasStr.substring(idxRec + 10, finRec).trim();
    }
    if (recursos === "N/A") recursos = "";

    // 5. Lectura Defensiva Estricta de Gastos (Array.isArray(state.gastos) && state.gastos.some(...))
    var gastosTareaTotal = 0;
    try {
      if (Array.isArray(state.gastos) && state.gastos.some(function (g) {
        if (!g) return false;
        var idEnt = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || "").trim().toUpperCase();
        return idEnt === idTareaActual.toUpperCase();
      })) {
        state.gastos.forEach(function (g) {
          if (!g) return;
          var idEnt = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || "").trim().toUpperCase();
          if (idEnt === idTareaActual.toUpperCase()) {
            var m = parseFloat(g.Monto_PEN || (g.Monto_Original * (g.Tipo_Cambio || 1)) || g.montoPEN || g.Monto_Moneda_Base || 0);
            if (!isNaN(m) && isFinite(m)) {
              gastosTareaTotal += m;
            }
          }
        });
      }
    } catch (errGastos) {
      console.warn("[Kanban] Fallo no bloqueante leyendo gastos para tarea " + idTareaActual + ":", errGastos);
      gastosTareaTotal = 0;
    }

    var lugarHtml = "";
    if (lugar) {
      lugarHtml = '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lugar) + '" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 transition truncate max-w-[140px]" title="Lugar: ' + lugar + ' (Ver en Maps)">' +
        '<svg class="w-3 h-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' +
        '<span class="truncate">' + lugar + '</span>' +
        '</a>';
    }

    var recursosHtml = "";
    if (recursos) {
      recursosHtml = '<span class="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[140px]" title="Recursos: ' + recursos + '">' +
        '<svg class="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>' +
        '<span class="truncate">' + recursos + '</span>' +
        '</span>';
    }

    var gastosHtml = "";
    if (gastosTareaTotal > 0) {
      gastosHtml = '<span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 shadow-2xs shrink-0" title="Gasto imputado a esta tarea">' +
        '💰 PEN ' + gastosTareaTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        '</span>';
    }

    var metaRowHtml = (lugarHtml || recursosHtml || gastosHtml)
      ? '<div class="flex items-center gap-1.5 flex-wrap pt-0.5">' + lugarHtml + recursosHtml + gastosHtml + '</div>'
      : "";

    // 6. Pie de la tarjeta: Fecha programada y Calendar (DOS ELEMENTOS INDEPENDIENTES, NUNCA ANIDADOS)
    var fProgRaw = "";
    if (tarea.Fecha_Programada) {
      var fProgStr = String(tarea.Fecha_Programada).trim();
      if (fProgStr.indexOf("T") !== -1) {
        fProgRaw = fProgStr.split("T")[0];
      } else if (fProgStr.indexOf(" ") !== -1) {
        fProgRaw = fProgStr.split(" ")[0];
      } else {
        fProgRaw = fProgStr;
      }
    }
    var horaProg = formatHoraLimpia(tarea.Hora_Inicio);
    if (horaProg === "--:--") horaProg = "";
    var esVencida = false;

    if (fProgRaw && !isDone) {
      try {
        var hoyStr = new Date().toISOString().split("T")[0];
        if (fProgRaw.length >= 10 && fProgRaw.substring(0, 10) < hoyStr) {
          esVencida = true;
        }
      } catch (eDate) {
        esVencida = false;
      }
    }

    var fechaLabel = fProgRaw ? formatFechaHumana(fProgRaw) : "Sin fecha";
    if (horaProg && horaProg !== "00:00") {
      fechaLabel += " • ⏱️ " + horaProg;
    }

    var fechaBadgeClass = esVencida
      ? "text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60"
      : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60";

    // Horas Estimadas vs Reales
    var hEstimadas = parseFloat(tarea.Horas_Estimadas) || 1.0;
    var hReales = parseFloat(tarea.Horas_Reales) || 0.0;
    var horasHtml = '<span class="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0" title="Horas Reales: ' + hReales + 'h / Horas Estimadas: ' + hEstimadas + 'h">⏱️ ' + hReales + 'h / ' + hEstimadas + 'h</span>';

    // Badge de Dependencia con resolución defensiva en (state.tareas || [])
    var depBadgeHtml = "";
    var idDep = String(tarea.ID_Dependencia || "").trim();
    if (idDep && !idDep.includes("@google.com") && idDep.toUpperCase().startsWith("TAR-")) {
      var depTarea = (state.tareas || []).find(function (dt) {
        return dt && String(dt.ID_Tarea || "").trim().toUpperCase() === idDep.toUpperCase();
      });
      var depTitulo = depTarea ? (depTarea.Nombre_Tarea_Actividad || idDep) : idDep;
      depBadgeHtml = '<span class="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/80 truncate max-w-[140px]" title="Requiere: ' + depTitulo + '">⛓️ Req: ' + idDep + '</span>';
    }

    // Botón de acción rápida con estilo y hover
    var btnAccionRapida = '<button type="button" onclick="event.stopPropagation(); abrirModalDetalleTarea(\'' + idTareaActual + '\')" class="ml-auto inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all duration-150 active:scale-95 shrink-0" title="Ver ficha completa">' +
      '<svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>' +
      '</button>';

    var btnArchivarRapido = '<button type="button" onclick="event.stopPropagation(); confirmarArchivarTarea(\'' + idTareaActual + '\')" class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md shrink-0" title="Archivar tarea">' +
      '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>' +
      '</button>';

    var btnEliminarRapido = '<button type="button" onclick="event.stopPropagation(); confirmarEliminarTarea(\'' + idTareaActual + '\')" class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md shrink-0" title="Eliminar tarea permanentemente">' +
      '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>' +
      '</button>';

    // Acciones Rápidas de Cambio de Estado en Tarjeta (One-Click Transition)
    var estadoActualNorm = normalizarEstadoTarea(tarea.Estado_Tarea) || "01_Backlog";
    var quickActionsHtml = '';

    if (estadoActualNorm === "01_Backlog") {
      quickActionsHtml =
        '<div class="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-end gap-1.5">' +
        '<button type="button" onclick="transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'02_Por_Hacer\', event)" class="w-full py-1 px-2.5 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center gap-1.5 transition-all shadow-2xs group/qa" title="Mover a Por Hacer">' +
        '<span class="tracking-wide">A Por Hacer</span><span class="font-bold transition-transform group-hover/qa:translate-x-0.5">→</span>' +
        '</button>' +
        '</div>';
    } else if (estadoActualNorm === "02_Por_Hacer") {
      quickActionsHtml =
        '<div class="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-1.5">' +
        '<button type="button" onclick="transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'01_Backlog\', event)" class="py-1 px-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0" title="Retroceder a Backlog">' +
        '<span class="text-xs mr-0.5">←</span><span class="hidden sm:inline">Backlog</span>' +
        '</button>' +
        '<button type="button" onclick="transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'03_En_Proceso\', event)" class="flex-1 py-1 px-2.5 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center gap-1.5 transition-all shadow-2xs group/qa" title="Iniciar tarea (Mover a En Proceso)">' +
        '<span class="tracking-wide">Iniciar</span><span class="transition-transform group-hover/qa:scale-110">⚡</span><span class="font-bold transition-transform group-hover/qa:translate-x-0.5">→</span>' +
        '</button>' +
        '</div>';
    } else if (estadoActualNorm === "03_En_Proceso") {
      quickActionsHtml =
        '<div class="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-1.5">' +
        '<button type="button" onclick="transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'02_Por_Hacer\', event)" class="py-1 px-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0" title="Retroceder a Por Hacer">' +
        '<span class="text-xs mr-0.5">←</span><span class="hidden sm:inline">Por Hacer</span>' +
        '</button>' +
        '<button type="button" onclick="transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'04_Completado\', event)" class="flex-1 py-1 px-2.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center gap-1.5 transition-all shadow-2xs group/qa" title="Finalizar tarea (Mover a Completado)">' +
        '<span class="tracking-wide">Completar</span><span class="font-black text-[11px] leading-none">✓</span>' +
        '</button>' +
        '</div>';
    } else if (estadoActualNorm === "04_Completado") {
      quickActionsHtml =
        '<div class="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-end gap-1.5">' +
        '<button type="button" onclick="transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'03_En_Proceso\', event)" class="w-full py-1 px-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[10px] font-semibold border border-dashed border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-1.5 transition-all" title="Reabrir tarea a En Proceso">' +
        '<span class="text-xs font-bold">↶</span><span>Reabrir tarea a En Proceso</span>' +
        '</button>' +
        '</div>';
    }

    // Detección MAV (Mínimo Alcance Viable)
    var esMav = (tarea.Es_MAV === true || tarea.Es_MAV === "true" || tarea.Es_MAV === 1 || tarea.Es_MAV === "1" || (tarea.Notas_Impedimentos && String(tarea.Notas_Impedimentos).includes("[MAV]")));
    var badgeMavHtml = esMav
      ? '<span class="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-0.5" title="Mínimo Alcance Viable (MAV)"><span>🎯</span><span>MAV</span></span>'
      : '';

    // Criterio Dominante
    var criterioTiempo = proyObj && String(proyObj.Criterio_Dominante || "").trim().toLowerCase() === "tiempo";
    var badgeCriterioTiempoHtml = "";
    if (criterioTiempo && !isDone) {
      if (esVencida) {
        card.classList.add("border-rose-500", "ring-1", "ring-rose-400", "dark:border-rose-500");
        badgeCriterioTiempoHtml = '<span class="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold bg-red-600 text-white animate-pulse" title="Criterio Dominante: TIEMPO - Tarea Vencida">⏱️ Vencida</span>';
      } else if (fProgRaw) {
        try {
          var dHoy = new Date().toISOString().split("T")[0];
          var diffDiasT = Math.ceil((new Date(fProgRaw) - new Date(dHoy)) / (1000 * 60 * 60 * 24));
          if (diffDiasT >= 0 && diffDiasT <= 3) {
            card.classList.add("border-rose-400", "ring-1", "ring-rose-300", "dark:border-rose-400");
            badgeCriterioTiempoHtml = '<span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300" title="Criterio Dominante: TIEMPO - Vence pronto (' + diffDiasT + 'd)">⏱️ ' + (diffDiasT === 0 ? "Vence hoy" : diffDiasT + "d rest.") + '</span>';
          }
        } catch (eC) {}
      }
    }

    var badgeNotasHtml = (typeof generarBadgeNotasVinculadas === "function")
      ? generarBadgeNotasVinculadas(idTareaActual, "TAREA")
      : "";

    // Subtareas defensivas
    var subtareasHtml = "";
    try {
      subtareasHtml = (typeof renderWidgetSubtareasTarjeta === "function")
        ? renderWidgetSubtareasTarjeta(idTareaActual)
        : "";
    } catch (errSub) {
      console.warn("[Kanban] Fallo no bloqueante en subtareas de tarea " + idTareaActual + ":", errSub);
      subtareasHtml = "";
    }

    card.innerHTML =
      '<!-- Barra lateral de prioridad continua en borde izquierdo -->' +
      '<div class="absolute left-0 top-0 bottom-0 w-1.5 ' + colorBarra + ' transition-all duration-150 group-hover:w-2"></div>' +

      '<!-- Cabecera: ID, Badges y Botón de Archivar rápido -->' +
      '<div class="flex items-center justify-between gap-1.5">' +
      '<div class="flex items-center gap-1.5 flex-wrap min-w-0">' +
      '<span class="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/60">' + (idTareaActual || "TAR-NEW") + '</span>' +
      '<span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ' + badgePrioridadClases + '">' + labelPrioridad + '</span>' +
      '<span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold ' + badgeEnergiaClases + '">' + labelEnergia + '</span>' +
      badgeMavHtml +
      badgeCriterioTiempoHtml +
      badgeNotasHtml +
      '</div>' +
      '<div class="flex items-center gap-0.5 shrink-0">' +
      btnArchivarRapido +
      btnEliminarRapido +
      '</div>' +
      '</div>' +

      '<!-- Cuerpo: Cumplimiento, Título y Micro-breadcrumb -->' +
      '<div class="flex items-start gap-2.5 pt-0.5">' +
      '<button type="button" onclick="toggleCumplidoTarea(\'' + idTareaActual + '\', event)" class="h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 ' + (isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 hover:border-indigo-500") + '" title="' + (isDone ? "Completada (Clic para reabrir)" : "Marcar como completada") + '">' +
      (isDone ? '<span class="text-[9px] font-black leading-none">✓</span>' : "") +
      '</button>' +
      '<div class="min-w-0 flex-1">' +
      '<h4 onclick="abrirModalDetalleTarea(\'' + idTareaActual + '\')" class="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition ' + (isDone ? "line-through text-slate-400 dark:text-slate-500" : "") + '" title="' + (tarea.Nombre_Tarea_Actividad || "Sin título") + '">' +
      (tarea.Nombre_Tarea_Actividad || "Sin título") +
      '</h4>' +
      '<div class="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate flex items-center gap-1 mt-0.5" title="' + nombreProy + (nombreHito ? " › " + nombreHito : "") + '">' +
      '<span class="truncate">📁 ' + nombreProy + '</span>' +
      (nombreHito ? '<span class="text-slate-300 dark:text-slate-600">›</span><span class="truncate text-slate-500 dark:text-slate-400">🎯 ' + nombreHito + '</span>' : "") +
      '</div>' +
      '</div>' +
      '</div>' +

      (metaRowHtml ? metaRowHtml : "") +
      '<div class="procedural-widget-container">' + subtareasHtml + '</div>' +

      '<!-- Pie de la tarjeta: Fecha y horas -->' +
      '<div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">' +
      '<div class="flex items-center justify-between gap-1.5 flex-wrap">' +
      '<div class="flex items-center gap-1.5 flex-wrap">' +
      '<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-mono ' + fechaBadgeClass + '" title="' + (esVencida ? "⚠️ Tarea vencida" : "Fecha programada") + '">' +
      '<svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' +
      '<span>' + fechaLabel + '</span>' +
      '</span>' +
      horasHtml +
      '</div>' +
      btnAccionRapida +
      '</div>' +
      (depBadgeHtml ? '<div class="flex items-center">' + depBadgeHtml + '</div>' : "") +
      '</div>' +
      quickActionsHtml;

    return card;
  }
\n"""

    # Insert crear_tarjeta_fn before kanban_def_marker
    content = content[:kanban_def_idx] + crear_tarjeta_fn + content[kanban_def_idx:]

    # Now recalculate start_idx and end_idx because content was shifted!
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)

    content = content[:start_idx] + new_task_block + content[end_idx:]

    # 3. Fix line 1380: var tar = state.tareas.find
    old_tar = "var tar = state.tareas.find(function (t) { return String(t.ID_Tarea || '').trim() === idNorm; });"
    new_tar = "var tar = (state.tareas || []).find(function (t) { return String(t.ID_Tarea || '').trim() === idNorm; });"
    if old_tar in content:
        content = content.replace(old_tar, new_tar)

    # 4. Add window export
    old_exp = "  window.renderKanban = aplicarFiltrosCruzados;"
    new_exp = "  window.renderKanban = aplicarFiltrosCruzados;\n  window.crearTarjetaKanbanHTML = crearTarjetaKanbanHTML;"
    if old_exp in content:
        content = content.replace(old_exp, new_exp)

    with open('JS_Kanban.html', 'w', encoding='utf-8') as f:
        f.write(content)

    print("SUCCESS: JS_Kanban.html patched successfully!")
    return True

if __name__ == '__main__':
    patch_kanban()
