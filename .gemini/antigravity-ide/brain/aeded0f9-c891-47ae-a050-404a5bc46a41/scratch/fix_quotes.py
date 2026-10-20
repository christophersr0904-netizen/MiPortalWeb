with open('JS_Kanban.html', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    ("abrirModalDetalleTarea('' + idTareaActual + '')", r"abrirModalDetalleTarea(\'' + idTareaActual + '\')"),
    ("confirmarArchivarTarea('' + idTareaActual + '')", r"confirmarArchivarTarea(\'' + idTareaActual + '\')"),
    ("confirmarEliminarTarea('' + idTareaActual + '')", r"confirmarEliminarTarea(\'' + idTareaActual + '\')"),
    ("toggleCumplidoTarea('' + idTareaActual + '', event)", r"toggleCumplidoTarea(\'' + idTareaActual + '\', event)"),
    ("transicionarEstadoTareaRapido('' + idTareaActual + '', '02_Por_Hacer', event)", r"transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'02_Por_Hacer\', event)"),
    ("transicionarEstadoTareaRapido('' + idTareaActual + '', '01_Backlog', event)", r"transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'01_Backlog\', event)"),
    ("transicionarEstadoTareaRapido('' + idTareaActual + '', '03_En_Proceso', event)", r"transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'03_En_Proceso\', event)"),
    ("transicionarEstadoTareaRapido('' + idTareaActual + '', '04_Completado', event)", r"transicionarEstadoTareaRapido(\'' + idTareaActual + '\', \'04_Completado\', event)")
]

for old, new in replacements:
    assert old in text, f"Missing old string: {old}"
    text = text.replace(old, new)

with open('JS_Kanban.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Successfully fixed quotes in JS_Kanban.html!')
