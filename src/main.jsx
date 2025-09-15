import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

import { BrowserRouter as Router } from 'react-router-dom';

import { initializePreventZoomAndScroll } from './utils/preventZoomAndScroll';
// Inicializar prevención de zoom, scroll X y gestos
initializePreventZoomAndScroll();

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
    console.log('La aplicación está lista para funcionar sin conexión.');
  },
});

import  SpotifyProvider from './context/SpotifyContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <SpotifyProvider>
          <Toaster />
          <App />
        </SpotifyProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
)