import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';


import { BrowserRouter as Router } from 'react-router-dom';

// Configuración del Service Worker
const intervalMS = 60 * 1000; // comprobar actualizaciones cada 60s
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible, activando...');
    updateSW(true); // fuerza skipWaiting y recarga controlada
  },
  onRegistered(swReg) {
    console.log('Service Worker registrado exitosamente');
    // Comprobación periódica de nuevas versiones
    if (swReg && typeof swReg.update === 'function') {
      setInterval(() => {
        swReg.update().catch(() => {});
      }, intervalMS);
    }
    // Enviar mensaje SKIP_WAITING al SW en espera si existe
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        const waiting = reg && reg.waiting;
        if (waiting) {
          waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    // Limpieza de SWs antiguos potencialmente registrados manualmente
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => {
          const scriptUrl = (r.active || r.waiting || r.installing)?.scriptURL || '';
          // Desregistrar SW legacy antiguo común: /service-worker.js en raíz pública
          if (scriptUrl.endsWith('/service-worker.js')) {
            r.unregister().catch(() => {});
          }
        });
      });
    }
  },
  onOfflineReady() {
    console.log('App lista para uso offline');
  },
  onRegisterError() {
    console.log('Error registrando Service Worker');
  },
});

import SpotifyProvider from './context/SpotifyContext.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <SpotifyProvider>
            <App />
          </SpotifyProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  </React.StrictMode>,
)
