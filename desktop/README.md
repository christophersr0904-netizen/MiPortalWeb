# Micro-Wrapper Nativo Windows 11 - PMO Personal & Life OS

Widget nativo flotante, frameless (sin bordes ni barra de título) y transparente con tecnología Always-on-Top para Windows 11.

## Requisitos
- Node.js >= 18
- Windows 10 / 11

## Instalación Inicial
Dentro de la carpeta `desktop/`:
```bash
npm install
```
O desde la raíz del proyecto:
```bash
npm run widget:install
```

## Formas de Ejecución
1. **Lanzamiento Silencioso (Recomendado para arranque automático):**
   - Ejecuta o crea un acceso directo a `lanzar-widget.vbs`.
   - Para iniciar con Windows: Presiona `Win + R`, escribe `shell:startup`, presiona Enter y pega un acceso directo a `lanzar-widget.vbs`.
2. **Por Consola / Terminal:**
   ```bash
   npm start
   ```
   O desde la raíz del proyecto:
   ```bash
   npm run widget
   ```
3. **Modo Desarrollo (con servidor local Vite):**
   ```bash
   npm run dev
   ```
   (Apunta a `http://localhost:5173/?mode=hud&widget=desktop`)
