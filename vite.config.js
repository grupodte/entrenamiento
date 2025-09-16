// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.spotify\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'spotify-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutos
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    // Configuración de chunking manual para optimizar el tamaño de bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk para React y dependencias relacionadas
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // Chunk para librerías de animación
          'animation': [
            'framer-motion',
            'gsap',
            '@use-gesture/react'
          ],
          // Chunk para Supabase
          'supabase': [
            '@supabase/supabase-js'
          ],
          // Chunk para UI components
          'ui-components': [
            '@headlessui/react',
            '@heroicons/react',
            'lucide-react',
            'react-icons'
          ],
          // Chunk para utilidades de datos/visualización
          'data-viz': [
            'recharts',
            'mathjs'
          ],
          // Chunk para utilidades diversas
          'utilities': [
            'clsx',
            'tailwind-merge',
            'uuid',
            'react-use',
            'react-hot-toast'
          ],
          // Chunk para funcionalidades específicas
          'features': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@dnd-kit/modifiers',
            'react-confetti',
            'html-to-image',
            'react-pull-to-refresh'
          ]
        }
      }
    },
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 800,
    // Optimizaciones adicionales
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true
      }
    }
  }
});
