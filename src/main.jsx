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

import  SpotifyProvider from './context/SpotifyContext.jsx'

// Prevención de swipe back mediante JavaScript
// Configuración adicional para dispositivos móviles
const preventSwipeBack = () => {
  // Prevenir swipe back en navegadores móviles
  if ('overscrollBehaviorX' in document.documentElement.style) {
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
  }
  
  // Para webkit browsers (Safari, Chrome móvil)
  if ('webkitOverscrollBehaviorX' in document.documentElement.style) {
    document.documentElement.style.webkitOverscrollBehaviorX = 'none';
    document.body.style.webkitOverscrollBehaviorX = 'none';
  }

  // Prevenir eventos touch horizontales desde los bordes
  let startX = null;
  let startY = null;
  
  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    if (startX === null || startY === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Si el swipe es más horizontal que vertical y viene desde el borde izquierdo
    if (Math.abs(deltaX) > Math.abs(deltaY) && startX < 50 && deltaX > 0) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // También prevenir desde el borde derecho (por si acaso)
    if (Math.abs(deltaX) > Math.abs(deltaY) && startX > window.innerWidth - 50 && deltaX < 0) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  const handleTouchEnd = () => {
    startX = null;
    startY = null;
  };
  
  // Agregar event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Prevenir el evento popstate que puede ser activado por swipe
  let isSwipeNavigation = false;
  
  const handlePopState = (e) => {
    if (isSwipeNavigation) {
      e.preventDefault();
      history.pushState(null, null, location.href);
      isSwipeNavigation = false;
    }
  };
  
  window.addEventListener('popstate', handlePopState);
  
  // Detectar cuando puede ser navegación por swipe
  const handleBeforeUnload = () => {
    isSwipeNavigation = true;
    setTimeout(() => {
      isSwipeNavigation = false;
    }, 100);
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
};

// Ejecutar la prevención cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preventSwipeBack);
} else {
  preventSwipeBack();
}

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