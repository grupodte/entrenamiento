import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './components/notifications/ToastSystem';

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

import SpotifyProvider from './context/SpotifyContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <SpotifyProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </SpotifyProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  </React.StrictMode>,
)
