import { useEffect } from 'react';

/**
 * Hook que bloquea navegación por gestos usando history API
 * Idea: manipular el historial para que los gestos no tengan efecto
 */
const useHistoryLock = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    let isLocked = false;
    
    const lockHistory = () => {
      if (isLocked) return;
      
      isLocked = true;
      console.log('[HistoryLock] Bloqueando historial');
      
      // Agregar entrada dummy al historial
      const currentState = window.history.state;
      const currentUrl = window.location.href;
      
      // Push una entrada idéntica para "absorber" el gesto back
      window.history.pushState({ locked: true, original: currentState }, '', currentUrl);
      
      // Handler para interceptar popstate (back/forward)
      const handlePopState = (event) => {
        console.log('[HistoryLock] Interceptando popstate:', event.state);
        
        // Si es nuestra entrada dummy, cancelar
        if (event.state && event.state.locked) {
          event.preventDefault();
          event.stopPropagation();
          
          // Re-push la entrada para mantener el lock
          window.history.pushState({ locked: true, original: currentState }, '', currentUrl);
          
          return false;
        }
        
        // Si no, permitir navegación normal
        console.log('[HistoryLock] Permitiendo navegación normal');
      };
      
      // Agregar listener
      window.addEventListener('popstate', handlePopState, true);
      
      // Cleanup function
      return () => {
        console.log('[HistoryLock] Desbloqueando historial');
        window.removeEventListener('popstate', handlePopState, true);
        isLocked = false;
      };
    };
    
    // Detectar iOS PWA
    const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                     (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
    
    if (isIOSPWA) {
      console.log('[HistoryLock] iOS PWA detectado, activando lock');
      return lockHistory();
    }
    
  }, [enabled]);
  
  return { enabled };
};

export default useHistoryLock;
