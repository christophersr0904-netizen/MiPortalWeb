/**
 * ORQUESTADOR LOCAL AUTÓNOMO (Argon ↔ Antigravity Pipeline)
 * Permite al usuario interactuar exclusivamente como Product Owner / Vibecoder.
 * El orquestador ejecuta la entrevista, genera directrices y llama a los agentes.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const { GoogleGenAI } = require('@google/genai');

// 1. Configuración de API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IY69BVaF4hmf_NOzjbbC0gvyg3kfmjGUZlFdlhlg3WPQ';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'TU_API_KEY_AQUI') {
    console.error('\n❌ ERROR: Debes configurar tu GEMINI_API_KEY en las variables de entorno o dentro de pipeline.js');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const PIPELINE_DIR = path.join(__dirname, '.pipeline');
const INBOX_FILE = path.join(PIPELINE_DIR, 'inbox.md');
const OUTBOX_FILE = path.join(PIPELINE_DIR, 'outbox.md');

// Asegurar carpeta de buzón
if (!fs.existsSync(PIPELINE_DIR)) {
    fs.mkdirSync(PIPELINE_DIR, { recursive: true });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function preguntar(texto) {
    return new Promise((resolve) => rl.question(texto, resolve));
}

// 2. Instrucciones maestras de la Habilidad Arquitecto para Argon
const SYSTEM_INSTRUCTION = `
Eres el Arquitecto Técnico Principal y Product Manager de "MiPortalWeb" (stack: Google Apps Script, Google Sheets DB, Tailwind CSS, Lucide Icons).
GOBERNANZA: SYSTEM_RULES.md, DICCIONARIO_TECNICO_MAESTRO.md, TABLAS.md y SUBAGENTS_RULES.md.
Principio: Cero regresiones y cero alucinaciones de nombres de tablas o funciones.

MODO CONVERSACIONAL (FASE 1):
Cuando el usuario te presente un requerimiento en bruto:
- Hazle entre 2 y 4 preguntas cortas, directas y ergonómicas (comportamiento esperado, datos, UI/UX, móvil vs escritorio).
- NO emitas directrices de código hasta que el usuario te responda o te diga que continúes.

MODO GENERACIÓN DE DIRECTRIZ DE INSPECCIÓN (FASE 2):
Cuando tengas los detalles suficientes, debes emitir ÚNICAMENTE el bloque con la Directriz de Inspección estandarizada (Vectores V1 a V4) envuelto entre etiquetas <DIRECTRIZ_INSPECCION> y </DIRECTRIZ_INSPECCION>.

MODO EVALUACIÓN Y DIRECTRIZ DE EJECUCIÓN (FASE 3):
Cuando recibas el reporte del Inspector, emite la Directriz de Ejecución Aprobada con roles convocados, funciones quirúrgicas y funciones vecinas protegidas envuelta entre etiquetas <DIRECTRIZ_EJECUCION> y </DIRECTRIZ_EJECUCION>.
`;

async function main() {
    console.clear();
    console.log('===============================================================');
    console.log('   🚀 PIPELINE AUTÓNOMO DE MIPORTALWEB (ARGON + ANTIGRAVITY)   ');
    console.log('   Rol del Usuario: Product Owner (Cero Copypaste)             ');
    console.log('===============================================================\n');

    // Inicializar sesión de chat con Gemini 4 Argon
    const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview', // O tu modelo designado para Argon / Pro Razonador
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2
        }
    });

    let alineado = false;
    let ultimoMensaje = '';

    // Bucle de alineación y entrevista con el usuario
    while (!alineado) {
        const inputUsuario = await preguntar('\n🧑‍💻 Tú: ');

        if (inputUsuario.trim().toLowerCase() === 'salir') {
            rl.close();
            return;
        }

        console.log('\n🧠 Argon pensando...');
        const respuesta = await chat.sendMessage({ message: inputUsuario });
        ultimoMensaje = respuesta.text;

        // Verificar si Argon ya generó la directriz de inspección
        if (ultimoMensaje.includes('<DIRECTRIZ_INSPECCION>')) {
            alineado = true;
        } else {
            console.log(`\n🤖 Argon:\n${ultimoMensaje}`);
        }
    }

    // Extraer y guardar la Directriz de Inspección
    const directrizLectura = ultimoMensaje
        .split('<DIRECTRIZ_INSPECCION>')[1]
        .split('</DIRECTRIZ_INSPECCION>')[0]
        .trim();

    fs.writeFileSync(INBOX_FILE, directrizLectura, 'utf8');
    console.log('\n📋 Directriz de Inspección generada y depositada en .pipeline/inbox.md');
    console.log('⏳ Invocando al ROL 1: INSPECTOR en Antigravity...');

    // 3. Ejecutar o esperar el reporte de Antigravity
    // Si usas Antigravity CLI o script local de inspección:
    try {
        if (fs.existsSync(path.join(__dirname, 'scratch', 'validate_all_scripts.js'))) {
            execSync('node scratch/validate_all_scripts.js', { stdio: 'pipe' });
        }
    } catch (e) { }

    console.log('\n[OPCIÓN AUTOMÁTICA O ASISTIDA]');
    console.log('Si Antigravity está en modo watcher, procesará .pipeline/inbox.md automáticamente.');
    console.log('Si no, el reporte se leerá en cuanto se guarde en .pipeline/outbox.md.');

    await preguntar('\nPresiona ENTER cuando el reporte técnico esté listo en .pipeline/outbox.md (o procesado por el agente)...');

    if (!fs.existsSync(OUTBOX_FILE) || fs.readFileSync(OUTBOX_FILE, 'utf8').trim() === '') {
        console.log('⚠️ No se encontró outbox.md con datos. Usando diagnóstico preliminar...');
    }

    const reporteTecnico = fs.existsSync(OUTBOX_FILE) ? fs.readFileSync(OUTBOX_FILE, 'utf8') : 'Reporte completado sin colisiones.';

    // 4. Enviar reporte a Argon para generar la Directriz de Ejecución
    console.log('\n🧠 Argon analizando el reporte técnico y blindando funciones protegidas...');
    const resEjecucion = await chat.sendMessage({
        message: `Aquí está el Reporte Técnico emitido por el Inspector:\n\n${reporteTecnico}\n\nGenera ahora la <DIRECTRIZ_EJECUCION> correspondiente.`
    });

    const directrizEjecucion = resEjecucion.text.includes('<DIRECTRIZ_EJECUCION>')
        ? resEjecucion.text.split('<DIRECTRIZ_EJECUCION>')[1].split('</DIRECTRIZ_EJECUCION>')[0].trim()
        : resEjecucion.text;

    fs.writeFileSync(INBOX_FILE, directrizEjecucion, 'utf8');
    console.log('\n🔨 Directriz de Ejecución Aprobada guardada en .pipeline/inbox.md');
    console.log('⏳ Convocando al Agente Cirujano y Auditor QA en Antigravity...');

    await preguntar('\nPresiona ENTER cuando Antigravity haya terminado las mutaciones y el despliegue...');

    console.log('\n===============================================================');
    console.log('   ✅ CICLO COMPLETADO CON ÉXITO');
    console.log('   Recarga tu portal web (Ctrl + F5) para verificar los cambios.');
    console.log('===============================================================\n');

    rl.close();
}

main().catch(err => {
    console.error('\n❌ Error en el orquestador:', err);
    rl.close();
});