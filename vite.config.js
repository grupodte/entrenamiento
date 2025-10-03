// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: [
        'favicon.svg',
        'favicon.ico', 
        'robots.txt',
        'backgrounds/admin-blur.png',
        'icons/*.png'
      ],
      manifest: false, // Usar el manifest.json del directorio public
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // El runtime caching se maneja en el SW personalizado
        maximumFileSizeToCacheInBytes: 3000000, // 3MB para imágenes grandes
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Configuraciones específicas para notificaciones
        navigateFallback: undefined, // Evitar conflictos con notificaciones
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
              }
            }
          }
        ]
      }
    }),
    // Bundle analyzer (solo en análisis)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  build: {
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 800,
    // Usar esbuild para minificación (más compatible)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React y ReactDOM
          'react-vendor': ['react', 'react-dom'],
          // Separar bibliotecas de UI pesadas
          'ui-vendor': ['framer-motion', '@headlessui/react', '@heroicons/react'],
          // Separar utilidades de gráficos
          'charts-vendor': ['recharts'],
          // Separar Supabase
          'supabase-vendor': ['@supabase/supabase-js'],
          // Separar DnD Kit
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
        }
      }
    }
  }
});
