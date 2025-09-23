import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { preventSwipeNavigation } from './utils/preventSwipeNavigation';

import { BrowserRouter as Router } from 'react-router-dom';

// Configuración del Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Lógica para cuando hay una nueva versión del SW (opcional)
    if (confirm('Hay una nueva actualización disponible. ¿Recargar la página?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // Lógica para cuando la app está lista para funcionar offline (opcional)
    // App ready for offline use
  },
});

// Inicializar prevención de navegación por gestos de manera global
// Esto proporciona una capa base de protección que se complementa con los hooks específicos
let globalNavigationCleanup;
if (typeof window !== 'undefined') {
  // Ejecutar después de que el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    globalNavigationCleanup = preventSwipeNavigation();
  });
  
  // Si el DOM ya está listo, ejecutar inmediatamente
  if (document.readyState === 'loading') {
    // DOM aún está cargando, usar el event listener
  } else {
    // DOM ya está listo
    globalNavigationCleanup = preventSwipeNavigation();
  }
  
  // Cleanup cuando la aplicación se cierre
  window.addEventListener('beforeunload', () => {
    if (globalNavigationCleanup) {
      globalNavigationCleanup();
    }
  });
}

import  SpotifyProvider from './context/SpotifyContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <SpotifyProvider>
            <Toaster />
            <App />
          </SpotifyProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  </React.StrictMode>,
)
