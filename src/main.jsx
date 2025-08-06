// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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
    console.log('La aplicación está lista para funcionar sin conexión.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              marginTop: 'env(safe-area-inset-top, 16px)',
              background: 'rgba(24, 24, 27, 0.92)', // fondo oscuro translúcido
              color: '#fff',
              borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.10)',
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
              padding: '12px 20px',
              letterSpacing: '0.01em',
              zIndex: 9999,
            },
            success: {
              iconTheme: {
                primary: '#facc15', // amarillo
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // rojo
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
