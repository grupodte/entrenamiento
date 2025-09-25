/**
 * SISTEMA ULTRA-AGRESIVO DE BLOQUEO ABSOLUTO
 * Previene CUALQUIER posibilidad de swipe back navigation
 * Se ejecuta a nivel global antes que cualquier otro código
 */

let isBlockerActive = false;

// Configuración ultra-estricta
const ABSOLUTE_CONFIG = {
  EDGE_ZONES: {
    LEFT: 150,    // Zona amplia desde borde izquierdo
    RIGHT: 150,   // Zona amplia desde borde derecho
    TOP: 100,     // También bloquear desde arriba
    BOTTOM: 100   // También bloquear desde abajo
  },
  MIN_MOVEMENT: 5, // Movimiento mínimo para activar bloqueo
  AGGRESSIVE_MODE: true // Modo ultra-agresivo activado
};

/**
 * Variables para rastrear el estado del touch
 */
let touchStartData = null;

/**
 * Bloqueo inteligente de touchstart - Solo desde bordes
 */
const blockTouchStart = (e) => {
  if (!e.touches || e.touches.length === 0) return;
  
  const touch = e.touches[0];
  const { clientX, clientY } = touch;
  const { innerWidth, innerHeight } = window;
  
  // Solo considerar zona peligrosa el borde izquierdo (principal fuente de swipe back)
  const inLeftEdge = clientX < 80; // Reducido para ser más selectivo
  
  // Guardar datos del touch para el touchmove
  touchStartData = {
    x: clientX,
    y: clientY,
    time: Date.now(),
    inLeftEdge
  };
  
  // Solo aplicar CSS preventivo si está en borde izquierdo
  // NO bloquear el evento aún - esperar al touchmove
  if (inLeftEdge) {
    console.log('[ABSOLUTE_BLOCKER] Touch detected near left edge - monitoring for swipe');
    applyAggressiveCSS();
  }
};

/**
 * Bloqueo inteligente de touchmove - Solo swipes reales hacia la derecha
 */
const blockTouchMove = (e) => {
  if (!e.touches || e.touches.length === 0 || !touchStartData) return;
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartData.x;
  const deltaY = touch.clientY - touchStartData.y;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);
  
  // Solo bloquear si:
  // 1. El touch empezó en borde izquierdo
  // 2. Es un movimiento horizontal hacia la derecha (deltaX > 0)
  // 3. El movimiento horizontal es mayor que el vertical
  // 4. El movimiento es significativo (>30px para evitar clicks normales)
  if (touchStartData.inLeftEdge && 
      deltaX > 30 && 
      absDeltaX > absDeltaY && 
      absDeltaX > 30) {
    
    console.log('[ABSOLUTE_BLOCKER] Blocking swipe back gesture:', {
      deltaX,
      deltaY,
      startX: touchStartData.x,
      currentX: touch.clientX
    });
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }
};

/**
 * Limpiar estado en touchend
 */
const handleTouchEnd = (e) => {
  // Limpiar el estado del touch
  touchStartData = null;
  
  // NO bloquear touchend - permitir que los clicks normales funcionen
  console.log('[ABSOLUTE_BLOCKER] Touch ended - resetting state');
};

/**
 * Bloqueo de eventos de gesto
 */
const blockGestureEvents = (e) => {
  console.log('[ABSOLUTE_BLOCKER] Blocking gesture event:', e.type);
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
};

/**
 * Aplicar CSS ultra-agresivo
 */
const applyAggressiveCSS = () => {
  const elements = [document.documentElement, document.body];
  
  elements.forEach(el => {
    if (el) {
      el.style.overscrollBehavior = 'none';
      el.style.overscrollBehaviorX = 'none';
      el.style.overscrollBehaviorY = 'none';
      el.style.webkitOverscrollBehavior = 'none';
      el.style.webkitOverscrollBehaviorX = 'none';
      el.style.webkitOverscrollBehaviorY = 'none';
      el.style.touchAction = 'pan-y';
      el.style.msTouchAction = 'pan-y';
      el.style.webkitTouchCallout = 'none';
      el.style.webkitUserSelect = 'none';
      el.style.userSelect = 'none';
    }
  });
};

/**
 * Bloquear eventos del historial
 */
const blockHistoryEvents = (e) => {
  console.log('[ABSOLUTE_BLOCKER] Blocking history navigation');
  e.preventDefault();
  e.stopPropagation();
  
  // Re-insertar estado en historial para evitar navegación
  window.history.pushState(null, "", window.location.href);
  return false;
};

/**
 * Bloquear eventos de teclado relacionados con navegación
 */
const blockKeyboardNavigation = (e) => {
  // Bloquear Alt + Left Arrow (back) y otras combinaciones
  if ((e.altKey && e.keyCode === 37) || // Alt + Left
      (e.altKey && e.keyCode === 39) || // Alt + Right
      e.keyCode === 8 ||  // Backspace
      e.keyCode === 116 || // F5
      (e.ctrlKey && e.keyCode === 82)) { // Ctrl + R
    console.log('[ABSOLUTE_BLOCKER] Blocking keyboard navigation');
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
};

/**
 * Inicializar el sistema de bloqueo absoluto
 */
export const initializeAbsoluteSwipeBackBlocker = () => {
  if (isBlockerActive) {
    console.warn('[ABSOLUTE_BLOCKER] Already active');
    return;
  }
  
  console.log('[ABSOLUTE_BLOCKER] Initializing ULTRA-AGGRESSIVE swipe back blocker');
  
  // Aplicar CSS inmediatamente
  applyAggressiveCSS();
  
  // Event listeners ultra-agresivos
  const captureOptions = { passive: false, capture: true };
  
  // Touch events - Solo touchmove necesita ser no-passive
  const passiveOptions = { passive: true, capture: true };
  const activeOptions = { passive: false, capture: true };
  
  document.addEventListener('touchstart', blockTouchStart, passiveOptions);
  document.addEventListener('touchmove', blockTouchMove, activeOptions);
  document.addEventListener('touchend', handleTouchEnd, passiveOptions);
  
  // Gesture events
  const gestureEvents = ['gesturestart', 'gesturechange', 'gestureend'];
  gestureEvents.forEach(eventType => {
    document.addEventListener(eventType, blockGestureEvents, captureOptions);
    window.addEventListener(eventType, blockGestureEvents, captureOptions);
  });
  
  // History navigation
  window.addEventListener('popstate', blockHistoryEvents, captureOptions);
  
  // Keyboard navigation
  document.addEventListener('keydown', blockKeyboardNavigation, captureOptions);
  
  // Mouse events en bordes (para desktop testing)
  document.addEventListener('mousedown', (e) => {
    if (e.clientX < 50 || e.clientX > window.innerWidth - 50) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, captureOptions);
  
  // Wheel events horizontales
  document.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      console.log('[ABSOLUTE_BLOCKER] Blocking horizontal wheel');
      e.preventDefault();
      e.stopPropagation();
    }
  }, captureOptions);
  
  isBlockerActive = true;
  console.log('[ABSOLUTE_BLOCKER] ✅ ULTRA-AGGRESSIVE MODE ACTIVATED');
};

/**
 * Función que se ejecuta inmediatamente al cargar el script
 */
const immediateInit = () => {
  // Ejecutar tan pronto como sea posible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAbsoluteSwipeBackBlocker);
  } else {
    initializeAbsoluteSwipeBackBlocker();
  }
  
  // También ejecutar en el próximo tick
  setTimeout(initializeAbsoluteSwipeBackBlocker, 0);
  
  // Y asegurar que se ejecute cuando la ventana esté cargada
  window.addEventListener('load', initializeAbsoluteSwipeBackBlocker);
};

// ⚡ EJECUTAR INMEDIATAMENTE
immediateInit();

export default {
  initializeAbsoluteSwipeBackBlocker,
  isActive: () => isBlockerActive
};
