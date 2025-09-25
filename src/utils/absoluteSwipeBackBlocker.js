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
 * Bloqueo absoluto de touchstart
 */
const blockTouchStart = (e) => {
  if (!e.touches || e.touches.length === 0) return;
  
  const touch = e.touches[0];
  const { clientX, clientY } = touch;
  const { innerWidth, innerHeight } = window;
  
  // Determinar si está en zona de bloqueo
  const inLeftEdge = clientX < ABSOLUTE_CONFIG.EDGE_ZONES.LEFT;
  const inRightEdge = clientX > (innerWidth - ABSOLUTE_CONFIG.EDGE_ZONES.RIGHT);
  const inTopEdge = clientY < ABSOLUTE_CONFIG.EDGE_ZONES.TOP;
  const inBottomEdge = clientY > (innerHeight - ABSOLUTE_CONFIG.EDGE_ZONES.BOTTOM);
  
  const inDangerZone = inLeftEdge || inRightEdge || inTopEdge || inBottomEdge;
  
  if (inDangerZone || ABSOLUTE_CONFIG.AGGRESSIVE_MODE) {
    console.log('[ABSOLUTE_BLOCKER] Blocking touchstart in danger zone:', {
      x: clientX,
      y: clientY,
      inLeftEdge,
      inRightEdge,
      inTopEdge,
      inBottomEdge,
      windowSize: { width: innerWidth, height: innerHeight }
    });
    
    // BLOQUEO INMEDIATO
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Aplicar CSS inmediatamente
    applyAggressiveCSS();
    
    return false;
  }
};

/**
 * Bloqueo absoluto de touchmove
 */
const blockTouchMove = (e) => {
  if (!e.touches || e.touches.length === 0) return;
  
  const touch = e.touches[0];
  
  // Solo bloquear movimientos horizontales significativos que puedan ser navegación
  const startX = touch.clientX;
  const startY = touch.clientY;
  
  // Calcular si es un movimiento principalmente horizontal
  const isHorizontalMovement = Math.abs(startX) > Math.abs(startY);
  const isSignificantMovement = Math.abs(startX) > 20;
  
  if (isHorizontalMovement && isSignificantMovement) {
    console.log('[ABSOLUTE_BLOCKER] Blocking horizontal movement that could be navigation');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }
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
  
  // Touch events
  document.addEventListener('touchstart', blockTouchStart, captureOptions);
  document.addEventListener('touchmove', blockTouchMove, captureOptions);
  document.addEventListener('touchend', (e) => {
    // Solo bloquear touchend si viene de los bordes
    if (e.changedTouches && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      const isNearEdge = touch.clientX < 100 || touch.clientX > window.innerWidth - 100;
      if (isNearEdge) {
        console.log('[ABSOLUTE_BLOCKER] Blocking touchend from edge');
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, captureOptions);
  
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
