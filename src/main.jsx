import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

import { BrowserRouter as Router } from 'react-router-dom';

// Configuración del Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Actualización automática sin popup molesto
    console.log('Nueva versión disponible, actualizando automáticamente...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App lista para uso offline');
  },
  onRegistered() {
    console.log('Service Worker registrado exitosamente');
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
