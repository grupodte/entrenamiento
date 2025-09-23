/**
 * Utilidad para prevenir la navegación por gestos de arrastrar hacia atrás
 * en PWAs y aplicaciones web móviles
 */

let isPreventingNavigation = false;

/**
 * Previene la navegación hacia atrás usando gestos de swipe
 */
export const preventSwipeNavigation = () => {
  if (isPreventingNavigation) return;
  
  isPreventingNavigation = true;

  // Prevenir navegación con teclas
  const preventKeyNavigation = (event) => {
    // Prevenir Alt + Flecha izquierda (navegación hacia atrás)
    if (event.altKey && event.code === 'ArrowLeft') {
      event.preventDefault();
      return false;
    }
    // Prevenir Alt + Flecha derecha (navegación hacia adelante)
    if (event.altKey && event.code === 'ArrowRight') {
      event.preventDefault();
      return false;
    }
    // Prevenir Backspace si no estamos en un input
    if (event.code === 'Backspace' && 
        !['INPUT', 'TEXTAREA'].includes(event.target.tagName) &&
        !event.target.contentEditable) {
      event.preventDefault();
      return false;
    }
  };

  // Prevenir eventos de mouse para navegación
  const preventMouseNavigation = (event) => {
    // Prevenir botones 3 y 4 del mouse (navegación hacia atrás/adelante)
    if (event.button === 3 || event.button === 4) {
      event.preventDefault();
      return false;
    }
  };

  // Variables para controlar el swipe
  let startX = 0;
  let startY = 0;
  let isScrolling = false;
  const SWIPE_THRESHOLD = 50;

  // Detectar inicio de touch
  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isScrolling = false;
  };

  // Detectar movimiento de touch
  const handleTouchMove = (event) => {
    if (!event.touches[0]) return;
    
    const touch = event.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Determinar si es scroll vertical u horizontal
    if (!isScrolling) {
      isScrolling = Math.abs(diffY) > Math.abs(diffX);
    }

    // Si es swipe horizontal desde el borde izquierdo (navegación hacia atrás)
    if (!isScrolling && startX < 50 && diffX > SWIPE_THRESHOLD) {
      event.preventDefault();
      return false;
    }

    // Si es swipe horizontal desde el borde derecho (navegación hacia adelante)
    if (!isScrolling && startX > window.innerWidth - 50 && diffX < -SWIPE_THRESHOLD) {
      event.preventDefault();
      return false;
    }
  };

  // Prevenir overscroll y pull-to-refresh
  const preventOverscroll = (event) => {
    const element = event.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const height = element.clientHeight;
    const delta = event.deltaY;
    const isScrollingUp = delta < 0;
    const isScrollingDown = delta > 0;

    // Prevenir overscroll en la parte superior
    if (scrollTop === 0 && isScrollingUp) {
      event.preventDefault();
    }

    // Prevenir overscroll en la parte inferior
    if (scrollTop + height >= scrollHeight && isScrollingDown) {
      event.preventDefault();
    }
  };

  // Prevenir el comportamiento de pull-to-refresh
  const preventPullToRefresh = (event) => {
    if (window.scrollY === 0 && event.touches && event.touches[0]) {
      const touch = event.touches[0];
      const diffY = touch.clientY - startY;
      
      // Si está arrastrando hacia abajo desde el top
      if (diffY > 0) {
        event.preventDefault();
      }
    }
  };

  // Agregar listeners
  document.addEventListener('keydown', preventKeyNavigation, { passive: false });
  document.addEventListener('mousedown', preventMouseNavigation, { passive: false });
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
  document.addEventListener('wheel', preventOverscroll, { passive: false });

  // Prevenir el comportamiento predeterminado de navegación del navegador
  window.addEventListener('popstate', (event) => {
    // Permitir navegación programática, pero agregar lógica personalizada si es necesario
    console.log('Navigation detected, handling internally');
  });

  // Función de limpieza
  return () => {
    document.removeEventListener('keydown', preventKeyNavigation);
    document.removeEventListener('mousedown', preventMouseNavigation);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchmove', preventPullToRefresh);
    document.removeEventListener('wheel', preventOverscroll);
    isPreventingNavigation = false;
  };
};

/**
 * Hook personalizado para React que previene la navegación por gestos
 * Debe ser usado con import { useEffect } from 'react' en el componente
 */
export const usePreventSwipeNavigation = (useEffect) => {
  useEffect(() => {
    const cleanup = preventSwipeNavigation();
    return cleanup;
  }, []);
};
