import sys

def patch_detalle360():
    with open('JS_Detalle360.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update construirHtmlListaTareas gasto reading
    old_task_gasto = """      var gastosDeEstaTarea = gastosContexto.filter(function (g) {
        return String(g.ID_Tarea || '').trim() === String(t.ID_Tarea || '').trim();
      });
      var montoGastadoTarea = gastosDeEstaTarea.reduce(function (acc, g) {
        return acc + (montoPenGasto(g) || 0);
      }, 0);"""

    new_task_gasto = """      var montoGastadoTarea = 0;
      try {
        var idTarActual = String(t.ID_Tarea || '').trim().toUpperCase();
        var listaGastosEvaluar = (Array.isArray(gastosContexto) && gastosContexto.length > 0)
          ? gastosContexto
          : (Array.isArray(state.gastos) ? state.gastos : []);

        if (Array.isArray(listaGastosEvaluar) && listaGastosEvaluar.some(function (g) {
          if (!g) return false;
          var idEnt = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || '').trim().toUpperCase();
          return idEnt === idTarActual;
        })) {
          listaGastosEvaluar.forEach(function (g) {
            if (!g) return;
            var idEnt = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || '').trim().toUpperCase();
            if (idEnt === idTarActual) {
              var mg = (typeof montoPenGasto === 'function')
                ? (montoPenGasto(g) || 0)
                : parseFloat(g.Monto_PEN || (g.Monto_Original * (g.Tipo_Cambio || 1)) || g.montoPEN || g.Monto_Moneda_Base || 0);
              if (!isNaN(mg) && isFinite(mg)) montoGastadoTarea += mg;
            }
          });
        } else if (t.Monto_Gasto_Asociado) {
          montoGastadoTarea = parseFloat(t.Monto_Gasto_Asociado) || 0;
        }
      } catch (errGTar360) {
        console.warn("[Detalle360] Fallo no bloqueante leyendo gastos para tarea " + t.ID_Tarea + ":", errGTar360);
        montoGastadoTarea = 0;
      }"""

    if old_task_gasto not in content:
        print("ERROR: old_task_gasto not found in JS_Detalle360.html")
        return False
    content = content.replace(old_task_gasto, new_task_gasto)

    # 2. Update renderCascadaHitos:
    # 2a. gastosGenerales
    old_gastos_gen = """    var gastosGenerales = (state.gastos || []).map(normalizarGasto).filter(function (g) {
      return gastoEsGeneralDeProyecto(g, idProyBuscado, idsHitosProy);
    });"""

    new_gastos_gen = """    var gastosGenerales = [];
    try {
      if (Array.isArray(state.gastos) && state.gastos.some(function (g) {
        return g && gastoEsGeneralDeProyecto(normalizarGasto(g), idProyBuscado, idsHitosProy);
      })) {
        gastosGenerales = (state.gastos || []).map(normalizarGasto).filter(function (g) {
          return g && gastoEsGeneralDeProyecto(g, idProyBuscado, idsHitosProy);
        });
      }
    } catch (eGGen) {
      console.warn("[Detalle360] Fallo no bloqueante evaluando gastos generales:", eGGen);
      gastosGenerales = [];
    }"""

    if old_gastos_gen not in content:
        print("ERROR: old_gastos_gen not found in JS_Detalle360.html")
        return False
    content = content.replace(old_gastos_gen, new_gastos_gen)

    # 2b. obtenerPesosEfectivosHitos
    old_pesos = "? obtenerPesosEfectivosHitos(idProyBuscado, hitosOrdenados, state.tareas)"
    new_pesos = "? obtenerPesosEfectivosHitos(idProyBuscado, hitosOrdenados, (state.tareas || []))"
    if old_pesos in content:
        content = content.replace(old_pesos, new_pesos)

    # 2c. gastosHito and realEjecutadoHito
    old_hito_gastos = """      var gastosHito = (state.gastos || []).map(normalizarGasto).filter(function (g) {
        return gastoEncajaEnHito(g, hitoIdActual, idProyBuscado);
      });

      var totalGastoHito = gastosHito.reduce(function (acc, cur) {
        return acc + (montoPenGasto(cur) || 0);
      }, 0);
      if (!isFinite(totalGastoHito)) totalGastoHito = 0;

      // Métricas Bottom-Up: Presupuesto Estimado vs Real Ejecutado por Tareas
      var presEstimadoHito = parseFloat(h.Costo_Estimado || h.Presupuesto_Estimado_PEN || 0);
      var realEjecutadoHito = 0;
      if (h.Costo_Ejecutado_Real_PEN !== undefined && h.Costo_Ejecutado_Real_PEN !== null) {
        realEjecutadoHito = parseFloat(h.Costo_Ejecutado_Real_PEN) || 0;
      } else {
        var idsTareasHito = tareasHito.map(function (t) { return String(t.ID_Tarea || '').trim().toUpperCase(); });
        (state.gastos || []).forEach(function (g) {
          var idT = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || '').trim().toUpperCase();
          var idH = String(g.ID_Hito || g.idHito || '').trim().toUpperCase();
          var est = String(g.Estado_Pago || g.Estado || '').toLowerCase();
          var mod = String(g.Modalidad || g.modalidad || '');
          var esReal = est === 'pagado' || mod === 'Real / Ejecutado' || g.Conciliado === true;
          if (esReal && (idsTareasHito.includes(idT) || idH === hitoIdActual)) {
            realEjecutadoHito += parseFloat(g.Monto_Moneda_Base || g.Monto_PEN || g.montoPEN || g.Monto_Original || 0);
          }
        });
      }"""

    new_hito_gastos = """      var gastosHito = [];
      try {
        if (Array.isArray(state.gastos) && state.gastos.some(function (g) {
          return g && gastoEncajaEnHito(normalizarGasto(g), hitoIdActual, idProyBuscado);
        })) {
          gastosHito = (state.gastos || []).map(normalizarGasto).filter(function (g) {
            return g && gastoEncajaEnHito(g, hitoIdActual, idProyBuscado);
          });
        }
      } catch (eGHito) {
        console.warn("[Detalle360] Fallo no bloqueante evaluando gastos del hito " + hitoIdActual + ":", eGHito);
        gastosHito = [];
      }

      var totalGastoHito = 0;
      try {
        totalGastoHito = gastosHito.reduce(function (acc, cur) {
          return acc + (montoPenGasto(cur) || 0);
        }, 0);
        if (!isFinite(totalGastoHito)) totalGastoHito = 0;
      } catch (eTotG) {
        totalGastoHito = 0;
      }

      // Métricas Bottom-Up: Presupuesto Estimado vs Real Ejecutado por Tareas
      var presEstimadoHito = parseFloat(h.Costo_Estimado || h.Presupuesto_Estimado_PEN || 0);
      var realEjecutadoHito = 0;
      if (h.Costo_Ejecutado_Real_PEN !== undefined && h.Costo_Ejecutado_Real_PEN !== null) {
        realEjecutadoHito = parseFloat(h.Costo_Ejecutado_Real_PEN) || 0;
      } else {
        var idsTareasHito = tareasHito.map(function (t) { return String((t && t.ID_Tarea) || '').trim().toUpperCase(); });
        try {
          if (Array.isArray(state.gastos) && state.gastos.some(function (g) {
            if (!g) return false;
            var idT = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || '').trim().toUpperCase();
            var idH = String(g.ID_Hito || g.idHito || '').trim().toUpperCase();
            return idsTareasHito.includes(idT) || idH === hitoIdActual;
          })) {
            (state.gastos || []).forEach(function (g) {
              if (!g) return;
              var idT = String(g.ID_Entidad_Vinculada || g.ID_Tarea || g.idTarea || '').trim().toUpperCase();
              var idH = String(g.ID_Hito || g.idHito || '').trim().toUpperCase();
              var est = String(g.Estado_Pago || g.Estado || '').toLowerCase();
              var mod = String(g.Modalidad || g.modalidad || '');
              var esReal = est === 'pagado' || mod === 'Real / Ejecutado' || g.Conciliado === true;
              if (esReal && (idsTareasHito.includes(idT) || idH === hitoIdActual)) {
                var mReal = parseFloat(g.Monto_Moneda_Base || g.Monto_PEN || g.montoPEN || g.Monto_Original || 0);
                if (!isNaN(mReal) && isFinite(mReal)) {
                  realEjecutadoHito += mReal;
                }
              }
            });
          }
        } catch (eRealG) {
          console.warn("[Detalle360] Fallo no bloqueante calculando ejecutado real hito " + hitoIdActual + ":", eRealG);
          realEjecutadoHito = 0;
        }
      }"""

    if old_hito_gastos not in content:
        print("ERROR: old_hito_gastos not found in JS_Detalle360.html")
        return False
    content = content.replace(old_hito_gastos, new_hito_gastos)

    with open('JS_Detalle360.html', 'w', encoding='utf-8') as f:
        f.write(content)

    print("SUCCESS: JS_Detalle360.html patched successfully!")
    return True

if __name__ == '__main__':
    patch_detalle360()
