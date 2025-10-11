import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook específico para solucionar el problema de videos congelados 
 * en PWAs móviles al reabrir la aplicación
 */
const usePWAVideoFix = () => {
  const [forceReload, setForceReload] = useState(0);
  const [isPWA, setIsPWA] = useState(false);
  const [isAppReopen, setIsAppReopen] = useState(false);
  const lastVisibleTime = useRef(Date.now());
  const pageShowCount = useRef(0);

  // Detectar PWA
  useEffect(() => {
    const detectPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
      
      if (isStandalone) {
        console.log('PWAVideoFix: PWA detectada');
      }
    };

    detectPWA();
  }, []);

  // Función para forzar reload
  const triggerReload = useCallback(() => {
    console.log('PWAVideoFix: Triggering video reload');
    setForceReload(prev => prev + 1);
  }, []);

  // Manejar eventos específicos de PWA
  useEffect(() => {
    if (!isPWA) return;

    const handlePageShow = (event) => {
      pageShowCount.current += 1;
      const now = Date.now();
      const timeSinceLastVisible = now - lastVisibleTime.current;
      
      console.log('PWAVideoFix: pageshow', { 
        persisted: event.persisted,
        count: pageShowCount.current,
        timeSinceLastVisible 
      });

      // Si la página fue restaurada desde cache o ha pasado más de 5 segundos
      // desde la última vez que estuvo visible, probablemente es un reopen de PWA
      if (event.persisted || timeSinceLastVisible > 5000) {
        setIsAppReopen(true);
        console.log('PWAVideoFix: PWA reabierta - forzando reload de videos');
        
        // Forzar reload después de un breve delay para que la app se estabilice
        setTimeout(() => {
          triggerReload();
        }, 300);
      }

      lastVisibleTime.current = now;
    };

    const handlePageHide = () => {
      lastVisibleTime.current = Date.now();
      setIsAppReopen(false);
      console.log('PWAVideoFix: pagehide - preparando para posible reopen');
    };

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        lastVisibleTime.current = now;
        console.log('PWAVideoFix: App oculta');
      } else {
        const timeSinceLastVisible = now - lastVisibleTime.current;
        console.log('PWAVideoFix: App visible', { timeSinceLastVisible });
        
        // Si ha pasado más de 3 segundos, probablemente es un reopen
        if (timeSinceLastVisible > 3000) {
          setIsAppReopen(true);
          console.log('PWAVideoFix: Posible reopen detectado por visibilidad');
          
          setTimeout(() => {
            triggerReload();
          }, 200);
        }
      }
    };

    // Eventos principales
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Eventos adicionales para PWAs
    window.addEventListener('focus', () => {
      const now = Date.now();
      const timeSinceLastVisible = now - lastVisibleTime.current;
      
      if (timeSinceLastVisible > 2000) {
        console.log('PWAVideoFix: Focus después de inactividad - reload preventivo');
        setTimeout(triggerReload, 100);
      }
    });

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPWA, triggerReload]);

  // Auto-reset del flag después de un tiempo
  useEffect(() => {
    if (isAppReopen) {
      const timer = setTimeout(() => {
        setIsAppReopen(false);
      }, 10000); // Reset después de 10 segundos

      return () => clearTimeout(timer);
    }
  }, [isAppReopen]);

  return {
    isPWA,
    forceReload,
    isAppReopen,
    triggerReload,
    
    // Props que se pueden pasar directamente a componentes de video
    videoProps: {
      key: `video-${forceReload}`, // Usar como key para forzar remount
      'data-pwa-reload': forceReload,
      'data-pwa-reopen': isAppReopen
    },
    
    // Debug info
    debugInfo: {
      isPWA,
      forceReload,
      isAppReopen,
      pageShowCount: pageShowCount.current,
      lastVisibleTime: new Date(lastVisibleTime.current).toLocaleTimeString()
    }
  };
};

export default usePWAVideoFix;