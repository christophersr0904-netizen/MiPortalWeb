import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Plugin para normalizar la salida de Vite garantizando que exista dist/index.html
 * para compatibilidad nativa con Capacitor (Android WebView) y PWA
 */
/**
 * Plugin para normalizar la salida de Vite garantizando que exista dist/index.html y dist/app.html
 * para compatibilidad nativa con Capacitor (Android WebView) y PWA
 */
function capacitorIndexHtmlPlugin(): Plugin {
  return {
    name: 'capacitor-index-html-plugin',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/app.html') {
          req.url = '/';
        }
        next();
      });
    },
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const appHtmlPath = path.join(distDir, 'app.html');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (fs.existsSync(appHtmlPath) && !fs.existsSync(indexHtmlPath)) {
        fs.copyFileSync(appHtmlPath, indexHtmlPath);
        console.log('[Capacitor Build Hook] dist/index.html sincronizado exitosamente.');
      } else if (fs.existsSync(indexHtmlPath) && !fs.existsSync(appHtmlPath)) {
        fs.copyFileSync(indexHtmlPath, appHtmlPath);
        console.log('[Capacitor Build Hook] dist/app.html sincronizado exitosamente.');
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now().toString())
  },
  plugins: [react(), capacitorIndexHtmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    open: false
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html')
      },
      output: {
        manualChunks(id) {
          const nid = id.replace(/\\/g, '/');
          if (nid.includes('seedPmo.json')) {
            return 'data-seed-pmo';
          }
          if (nid.includes('seedLife.json')) {
            return 'data-seed-life';
          }
          if (nid.includes('initialSeed.json')) {
            return 'data-seed';
          }
          if (nid.includes('/node_modules/')) {
            if (nid.includes('/react/') || nid.includes('/react-dom/') || nid.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (nid.includes('/lucide-react/')) {
              return 'vendor-ui';
            }
            if (nid.includes('/dexie/') || nid.includes('/dexie-react-hooks/') || nid.includes('/@supabase/')) {
              return 'vendor-data';
            }
            if (nid.includes('/@xyflow/') || nid.includes('dagre')) {
              return 'vendor-graph';
            }
            if (
              nid.includes('react-markdown') ||
              nid.includes('remark-gfm') ||
              nid.includes('rehype-sanitize') ||
              nid.includes('micromark') ||
              nid.includes('unified')
            ) {
              return 'vendor-markdown';
            }
            if (nid.includes('sweetalert2') || nid.includes('canvas-confetti')) {
              return 'vendor-feedback';
            }
          }
        }
      }
    }
  }
});
