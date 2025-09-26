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
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'favicon.ico', 
        'robots.txt',
        'backgrounds/admin-blur.png'
      ],
      manifest: false, // Usar el manifest.json del directorio public
      workbox: {
        // Página offline personalizada
        navigateFallback: null, // Desactivamos el fallback automático
        navigateFallbackDenylist: [/^\/_/, /\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            // APIs críticas de Spotify - NetworkFirst para datos frescos
            urlPattern: /^https:\/\/api\.spotify\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'spotify-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutos
              }
            }
          },
          {
            // APIs de Supabase - StaleWhileRevalidate para balance velocidad/frescura
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 15 * 60 // 15 minutos
              },
              cacheKeyWillBeUsed: async ({request}) => {
                // Personalizar clave de caché para incluir auth
                const url = new URL(request.url);
                return `${url.pathname}${url.search}`;
              }
            }
          },
          {
            // Imágenes y activos estáticos - CacheFirst con fallback
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
              }
            }
          },
          {
            // Fuentes - CacheFirst para rendimiento
            urlPattern: /\.(woff|woff2|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
              }
            }
          },
          {
            // CDN de videos/assets externos - StaleWhileRevalidate
            urlPattern: /^https:\/\/(?:.*\.)?(?:vimeo|youtube|amazonaws)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 1 día
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
