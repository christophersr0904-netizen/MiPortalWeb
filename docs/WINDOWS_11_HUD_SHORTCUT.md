# GUÍA DE ACCESO DIRECTO WINDOWS 11: PMO DAILY HUD WIDGET
**Requisito:** REQ-DAILY-HUD-WIDGET-REST-STATE-PIP-FIT-42  
**Sistema:** PMO Personal Modular & Life OS

Esta guía permite ejecutar el **Cockpit de Ejecución Diaria** como un widget nativo ultra-compacto en Windows 11, sin bordes de navegador, pestañas ni barras de direcciones, ubicándose discretamente en la esquina de la pantalla.

---

## 1. Modo Píldora de Arranque Ultra-Compacto (Recomendado)

Inicia como una cápsula flotante compacta en reposo con reloj, radar de ritmo, glifo `Gauge` y siguiente entidad. Al hacer clic, se expande a la vista completa del Cockpit.

### Google Chrome
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://miportalweb-aft.pages.dev/?mode=hud" --window-size=360,180 --window-position=1540,50
```

### Microsoft Edge
```cmd
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="https://miportalweb-aft.pages.dev/?mode=hud" --window-size=360,180 --window-position=1540,50
```

---

## 2. Modo Cockpit Desplegado Completo (Alternativa)

Inicia directamente con el Cockpit expandido (Riel Horario + Checklist directo):

### Google Chrome
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://miportalweb-aft.pages.dev/?mode=hud" --window-size=420,720 --window-position=1480,50
```

---

## 3. Parámetros del Comando Explicados

| Parámetro | Propósito |
| :--- | :--- |
| `--app="https://miportalweb-aft.pages.dev/?mode=hud"` | Ejecuta la app como ventana de aplicación pura (sin chrome de navegación). La URL `?mode=hud` activa la vista standalone. |
| `--window-size=360,180` | Fija el tamaño ergonómico exacto para el **Widget en Reposo (Píldora)**. Al detectar altura menor a 400px, arranca automáticamente como píldora centrada. |
| `--window-position=1540,50` | Posiciona el widget en la esquina superior derecha en monitores Full HD (1920x1080). |

---

## 4. Configurar para Arranque Automático en Windows 11 (Startup)

1. Presiona `Win + R` en tu teclado.
2. Escribe `shell:startup` y presiona `Enter`. Se abrirá la carpeta de inicio de Windows:
   `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
3. Crea un acceso directo con el comando maestro dentro de esa carpeta.
4. Cada vez que inicies Windows 11, tu Widget PMO estará esperándote en la esquina de la pantalla listo para tu jornada diaria.

---

## 5. Modo Always-on-Top Nativo (Document Picture-in-Picture)

Una vez abierta la ventana del HUD:
- En la cabecera del Cockpit abierto, haz clic en el botón de **Desacoplar a PiP** (icono `ExternalLink`).
- Esto activará la API nativa de Chrome `documentPictureInPicture`, convirtiendo el Cockpit en una ventana flotante real **Always-on-Top** que flotará por encima de Antigravity IDE o cualquier otra aplicación mientras trabajas, con calce exacto al 100% de la ventana sin descalces visuales.
