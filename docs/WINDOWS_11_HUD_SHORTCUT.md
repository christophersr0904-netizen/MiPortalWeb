# GUÍA DE ACCESO DIRECTO WINDOWS 11: PMO DAILY HUD WIDGET
**Requisito:** REQ-DAILY-HUD-WIN11-STANDALONE-MOBILE-41  
**Sistema:** PMO Personal Modular & Life OS

Esta guía permite ejecutar el **Cockpit de Ejecución Diaria** como una aplicación de escritorio nativa compacta, sin barras de navegación, menús ni bordes toscos de navegador, optimizada para colocarse a la derecha de la pantalla y arrancar automáticamente con Windows 11.

---

## 1. Comando Maestro para Acceso Directo

### Google Chrome
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://tu-dominio.pages.dev/?mode=hud" --window-size=420,720 --window-position=1480,50
```
> Si usas Chrome de 32 bits o instalado en `%LocalAppData%`:
> `"%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="https://tu-dominio.pages.dev/?mode=hud" --window-size=420,720 --window-position=1480,50`

### Microsoft Edge
```cmd
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="https://tu-dominio.pages.dev/?mode=hud" --window-size=420,720 --window-position=1480,50
```

---

## 2. Parámetros del Comando Explicados

| Parámetro | Propósito |
| :--- | :--- |
| `--app="https://.../?mode=hud"` | Ejecuta la app en modo ventana de aplicación pura (sin pestañas, barra de direcciones ni extensiones). La URL con `?mode=hud` activa la vista standalone a pantalla completa del Cockpit. |
| `--window-size=420,720` | Fija el ancho exacto (420px) y alto (720px) ergonómico para el Cockpit táctico (Riel Horario + Checklist). |
| `--window-position=1480,50` | Posiciona la ventana automáticamente en la esquina superior derecha en monitores Full HD (1920x1080) o secundarios. |

---

## 3. Pasos para Crear el Acceso Directo Manualmente en Windows 11

1. Haz clic derecho en el **Escritorio** $\rightarrow$ **Nuevo** $\rightarrow$ **Acceso directo**.
2. En la casilla de ubicación, pega el comando maestro:
   `"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://tu-dominio.pages.dev/?mode=hud" --window-size=420,720 --window-position=1480,50`
   *(Sustituye `https://tu-dominio.pages.dev` por la URL de tu despliegue o `http://localhost:3000` si estás en desarrollo local).*
3. Haz clic en **Siguiente** y nómbralo: `PMO Daily HUD`.
4. Haz clic en **Finalizar**.
5. *(Opcional)* Haz clic derecho en el nuevo icono $\rightarrow$ **Propiedades** $\rightarrow$ **Cambiar icono** y selecciona el icono `favicon.ico` del proyecto.

---

## 4. Configurar para Arranque Automático en Windows 11 (Startup)

1. Presiona `Win + R` en tu teclado.
2. Escribe `shell:startup` y presiona `Enter`. Se abrirá la carpeta de inicio de Windows:
   `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
3. Copia o mueve el acceso directo `PMO Daily HUD` dentro de esa carpeta.
4. ¡Listo! A partir de ahora, cada vez que inicies sesión en Windows 11, tu Cockpit Diario se abrirá automáticamente en la esquina derecha de la pantalla.

---

## 5. Modo Always-on-Top Nativo (Document Picture-in-Picture)

Una vez abierta la ventana del HUD:
- En la cabecera superior, haz clic en el botón de **Desacoplar a PiP** (icono `ExternalLink`).
- Esto activará la API nativa de Chrome `documentPictureInPicture`, convirtiendo el Cockpit en una ventana flotante real **Always-on-Top** que flotará por encima de Antigravity IDE, editores de código o cualquier otra aplicación mientras trabajas.
