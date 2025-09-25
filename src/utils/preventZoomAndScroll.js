/**
 * Utilidad para prevenir zoom, scroll horizontal y gestos de navegación
 * Optimizado para aplicaciones PWA móviles
 */

/**
 * Previene eventos de zoom mediante gestos táctiles
 */
export function preventZoomEvents() {
  let lastTouchEnd = 0;
  
  // Prevenir zoom con double-tap
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevenir zoom con pinch-to-zoom
  document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchmove', function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  // Prevenir zoom con wheel + ctrl/cmd
  document.addEventListener('wheel', function (event) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  }, { passive: false });

  // Prevenir zoom con atajos de teclado
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && 
        (event.key === '+' || event.key === '-' || event.key === '0' || event.key === '=' || 
         event.keyCode === 61 || event.keyCode === 173 || event.keyCode === 187 || event.keyCode === 189)) {
      event.preventDefault();
    }
  });
}

/**
 * Previene scroll horizontal en toda la aplicación
 */
export function preventHorizontalScroll() {
  // Prevenir scroll horizontal con wheel
  document.addEventListener('wheel', function (event) {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault();
    }
  }, { passive: false });

  // Prevenir scroll horizontal con touch
  let startX = null;
  let startY = null;
  
  document.addEventListener('touchstart', function (event) {
    if (event.touches.length === 1) {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function (event) {
    if (event.touches.length === 1 && startX !== null && startY !== null) {
      const deltaX = Math.abs(event.touches[0].clientX - startX);
      const deltaY = Math.abs(event.touches[0].clientY - startY);
      
      // Si el movimiento es principalmente horizontal, prevenirlo
      if (deltaX > deltaY && deltaX > 10) {
        // Solo prevenir si no estamos en un elemento que necesite scroll horizontal
        const target = event.target;
        const allowedElements = target.closest('.allow-horizontal-scroll, input[type="range"], .carousel, .slider');
        
        if (!allowedElements) {
          event.preventDefault();
        }
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', function () {
    startX = null;
    startY = null;
  }, { passive: true });
}

/**
 * Previene gestos de navegación (swipe back/forward)
 */
export function preventNavigationGestures() {
  // Prevenir gestos de navegación en el borde de la pantalla
  document.addEventListener('touchstart', function (event) {
    const touch = event.touches[0];
    const screenWidth = window.innerWidth;
    
    // Si el toque empieza en los primeros 20px del borde izquierdo o derecho
    if (touch.clientX < 20 || touch.clientX > screenWidth - 20) {
      event.preventDefault();
    }
  }, { passive: false });

  // Prevenir swipe gestures específicos del navegador
  let touchStartX = null;
  let touchStartY = null;
  
  document.addEventListener('touchstart', function (event) {
    if (event.touches.length === 1) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', function (event) {
    if (touchStartX === null || touchStartY === null) {
      return;
    }
    
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Si es un swipe horizontal significativo desde el borde
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if ((touchStartX < 50 && diffX < -30) || // swipe right from left edge
          (touchStartX > window.innerWidth - 50 && diffX > 30)) { // swipe left from right edge
        event.preventDefault();
      }
    }
  }, { passive: false });
  
  document.addEventListener('touchend', function () {
    touchStartX = null;
    touchStartY = null;
  }, { passive: true });
}

/**
 * Configura el comportamiento de viewport dinámico para móviles
 */
export function setupDynamicViewport() {
  function setViewportHeight() {
    // Obtener la altura real del viewport
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    document.documentElement.style.setProperty('--safe-viewport-height', `${window.innerHeight}px`);
  }

  // Configurar altura inicial
  setViewportHeight();

  // Actualizar en resize, pero con debounce para performance
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setViewportHeight, 150);
  });

  // Actualizar en orientationchange
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 500);
  });
}

/**
 * Función principal que inicializa todas las prevenciones
 */
export function initializePreventZoomAndScroll() {
  // Solo aplicar en dispositivos móviles o cuando sea necesario
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   window.innerWidth <= 768;
  
  if (isMobile || window.location.search.includes('prevent-zoom')) {
    preventZoomEvents();
    preventNavigationGestures();
    setupDynamicViewport();
    
    console.log('🔒 Zoom y gestos de navegación deshabilitados');
  }
  
  // Siempre prevenir scroll horizontal (útil en desktop también)
  preventHorizontalScroll();
  
  // Aplicar fix específico para Android scrollbars
  applyAndroidScrollbarFix();
  
  console.log('🚫 Scroll horizontal deshabilitado');
}

/**
 * Función para aplicar estilos adicionales via JavaScript si es necesario
 */
export function applyAdditionalStyles() {
  // Crear estilos CSS adicionales si no están aplicados
  const style = document.createElement('style');
  style.textContent = `
    /* Estilos de emergencia por JavaScript */
    html, body {
      touch-action: pan-y !important;
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }
    
    * {
      max-width: 100vw;
      box-sizing: border-box;
    }
    
    input, textarea, select {
      font-size: max(16px, 1rem) !important;
    }
    
    /* Prevenir selección accidental */
    img, video, canvas {
      user-select: none;
      -webkit-user-select: none;
      pointer-events: none;
    }
    
    /* Permitir interacción solo en elementos interactivos */
    button, a, input, textarea, select, [role="button"], [onclick] {
      pointer-events: auto;
      touch-action: manipulation;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Función específica para ocultar scrollbars en Android
 */
export function applyAndroidScrollbarFix() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (isAndroid) {
    const androidStyle = document.createElement('style');
    androidStyle.id = 'android-scrollbar-fix';
    androidStyle.textContent = `
      /* Fix agresivo para Android */
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      
      *::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      *::-webkit-scrollbar-track {
        display: none !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      *::-webkit-scrollbar-thumb {
        display: none !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      *::-webkit-scrollbar-corner {
        display: none !important;
        background: transparent !important;
      }
      
      /* Fix específico para elementos con overflow */
      div[class*="overflow-"],
      .overflow-auto,
      .overflow-x-auto, 
      .overflow-y-auto,
      .overflow-scroll,
      .overflow-x-scroll,
      .overflow-y-scroll,
      .scrollbar-hide,
      .scroll-smooth-hidden {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      
      div[class*="overflow-"]::-webkit-scrollbar,
      .overflow-auto::-webkit-scrollbar,
      .overflow-x-auto::-webkit-scrollbar,
      .overflow-y-auto::-webkit-scrollbar,
      .overflow-scroll::-webkit-scrollbar,
      .overflow-x-scroll::-webkit-scrollbar,
      .overflow-y-scroll::-webkit-scrollbar,
      .scrollbar-hide::-webkit-scrollbar,
      .scroll-smooth-hidden::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
        -webkit-appearance: none !important;
      }
    `;
    
    document.head.appendChild(androidStyle);
    console.log('🤖 Fix específico para Android scrollbars aplicado');
  }
}

/**
 * Función para verificar si las scrollbars siguen visibles y re-aplicar estilos
 */
export function checkAndReapplyScrollbarFix() {
  // Crear un elemento de prueba con scroll
  const testDiv = document.createElement('div');
  testDiv.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: 100px;
    height: 100px;
    overflow: scroll;
    visibility: hidden;
  `;
  
  document.body.appendChild(testDiv);
  
  // Verificar si la scrollbar es visible
  const scrollbarWidth = testDiv.offsetWidth - testDiv.clientWidth;
  document.body.removeChild(testDiv);
  
  if (scrollbarWidth > 0) {
    console.warn('⚠️ Scrollbars detectadas en Android, re-aplicando fix...');
    // Re-aplicar fix más agresivo
    applyAndroidScrollbarFix();
    
    // Aplicar estilos inline directos a elementos problemáticos
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
        el.style.scrollbarWidth = 'none';
        el.style.msOverflowStyle = 'none';
      }
    });
    
    return true; // Indica que se aplicó el fix
  }
  
  return false; // No era necesario aplicar el fix
}

// Auto-inicialización DESACTIVADA para evitar conflictos
// La inicialización ahora se maneja desde los hooks de React
/*
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializePreventZoomAndScroll();
      setTimeout(checkAndReapplyScrollbarFix, 1000);
    });
  } else {
    initializePreventZoomAndScroll();
    setTimeout(checkAndReapplyScrollbarFix, 1000);
  }
}
*/
