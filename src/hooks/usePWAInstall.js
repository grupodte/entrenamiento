import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [platform, setPlatform] = useState('unknown');
  const deferredPromptRef = useRef(null);
  const installCheckTimeoutRef = useRef(null);

  // Función para detectar la plataforma del usuario
  const detectPlatform = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMacOS = /mac/.test(userAgent) && !isIOS;
    const isWindows = /win/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge|opr\//.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isEdge = /edge|edg/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|edge|opr/.test(userAgent);

    if (isIOS) return 'ios';
    if (isAndroid && isChrome) return 'android-chrome';
    if (isAndroid && isFirefox) return 'android-firefox';
    if (isAndroid) return 'android-other';
    if (isMacOS && isSafari) return 'macos-safari';
    if (isMacOS && isChrome) return 'macos-chrome';
    if (isWindows && isChrome) return 'windows-chrome';
    if (isWindows && isEdge) return 'windows-edge';
    if (isFirefox) return 'firefox';
    return 'unknown';
  }, []);

  // Función para verificar si la aplicación ya está instalada
  const checkIfInstalled = useCallback(() => {
    // Método 1: Display mode standalone
    if (window.matchMedia?.('(display-mode: standalone)').matches) {
      return true;
    }

    // Método 2: Navigator standalone (iOS)
    if (window.navigator?.standalone) {
      return true;
    }

    // Método 3: Android app referrer
    if (document.referrer.includes('android-app://')) {
      return true;
    }

    // Método 4: Verificar si el viewport tiene características de PWA
    if (window.screen?.height === window.innerHeight && window.navigator?.userAgent.includes('wv')) {
      return true;
    }

    // Método 5: Verificar localStorage flag (para casos específicos)
    try {
      if (localStorage.getItem('pwa-installed') === 'true') {
        return true;
      }
    } catch (e) {
      // localStorage no disponible
    }

    return false;
  }, []);

  // Función para verificar si el navegador soporta instalación nativa
  const supportsNativeInstall = useCallback(() => {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  }, []);

  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    const installed = checkIfInstalled();
    setIsInstalled(installed);

    if (installed) {
      console.log('PWA: La aplicación ya está instalada');
      return;
    }

    // Handler para el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (event) => {
      console.log('PWA: Evento beforeinstallprompt detectado');

      event.preventDefault();
      deferredPromptRef.current = event;
      setInstallPrompt(event);
      setIsInstallable(true);

      // Analytics event (opcional)
      if (window.gtag) {
        window.gtag('event', 'pwa_install_prompt_shown', {
          event_category: 'PWA',
          event_label: detectedPlatform
        });
      }
    };

    // Handler para el evento appinstalled
    const handleAppInstalled = (event) => {
      console.log('PWA: Aplicación instalada exitosamente', event);

      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      deferredPromptRef.current = null;

      // Marcar en localStorage como respaldo
      try {
        localStorage.setItem('pwa-installed', 'true');
      } catch (e) {
        console.warn('No se pudo establecer el flag en localStorage');
      }

      // Mostrar mensaje de éxito
      toast.success('Aplicación instalada correctamente', {
        duration: 4000
      });

      // Analytics event (opcional)
      if (window.gtag) {
        window.gtag('event', 'pwa_install_success', {
          event_category: 'PWA',
          event_label: detectedPlatform
        });
      }
    };

    // Listener para cambios en display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        console.log('PWA: Modo de visualización cambiado a standalone');
        setIsInstalled(true);
      }
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Para iOS, verificar después de un retraso si el usuario regresa
    // (indicativo de que pudo haber instalado manualmente)
    if (detectedPlatform === 'ios') {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // Verificar después de 1 segundo si ahora está en modo standalone
          installCheckTimeoutRef.current = setTimeout(() => {
            const nowInstalled = checkIfInstalled();
            if (nowInstalled && !installed) {
              console.log('PWA: Instalación manual de iOS detectada');
              setIsInstalled(true);
              setIsInstallable(false);
            }
          }, 1000);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (installCheckTimeoutRef.current) {
          clearTimeout(installCheckTimeoutRef.current);
        }
      };
    }

    // Cleanup estándar
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [detectPlatform, checkIfInstalled]);

  // Función principal de instalación
  const installPWA = async () => {
    if (!deferredPromptRef.current) {
      console.log('PWA: No hay prompt de instalación disponible');

      // Analytics para casos donde no hay prompt
      if (window.gtag) {
        window.gtag('event', 'pwa_install_no_prompt', {
          event_category: 'PWA',
          event_label: platform
        });
      }

      return false;
    }

    try {
      setIsInstalling(true);

      // Analytics para inicio de instalación
      if (window.gtag) {
        window.gtag('event', 'pwa_install_initiated', {
          event_category: 'PWA',
          event_label: platform
        });
      }

      await deferredPromptRef.current.prompt();
      const choiceResult = await deferredPromptRef.current.userChoice;

      console.log('PWA: Decisión del usuario:', choiceResult.outcome);

      // Analytics para resultado
      if (window.gtag) {
        window.gtag('event', 'pwa_install_user_choice', {
          event_category: 'PWA',
          event_label: platform,
          value: choiceResult.outcome === 'accepted' ? 1 : 0
        });
      }

      if (choiceResult.outcome === 'dismissed') {
        toast('Instalación cancelada. Puede instalar más tarde desde el menú del navegador.', {
          duration: 3000
        });
      }

      // Limpiar prompt usado
      deferredPromptRef.current = null;
      setInstallPrompt(null);
      setIsInstallable(false);

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Error durante la instalación:', error);

      toast.error('Error durante la instalación. Por favor, inténtelo de nuevo.', {
        duration: 4000
      });

      // Analytics para errores
      if (window.gtag) {
        window.gtag('event', 'pwa_install_error', {
          event_category: 'PWA',
          event_label: platform,
          value: error.message
        });
      }

      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  // Mostrar instrucciones manuales de instalación
  const showManualInstructions = () => {
    const instructions = {
      'ios': {
        title: 'Agregar aplicación a la pantalla de inicio (iOS)',
        steps: [
          'Toque el botón Compartir en Safari',
          'Desplácese hacia abajo y seleccione "Agregar a pantalla de inicio"',
          'Personalice el nombre si lo desea y toque "Agregar"',
          'La aplicación aparecerá como una app nativa en su dispositivo'
        ],
        tip: 'La aplicación funcionará sin conexión a internet y enviará notificaciones.'
      },
      'android-chrome': {
        title: 'Instalar aplicación (Android Chrome)',
        steps: [
          'Toque el menú (tres puntos) en la esquina superior derecha',
          'Seleccione "Agregar a pantalla de inicio" o "Instalar app"',
          'Toque "Instalar" para confirmar',
          'La aplicación se instalará como una aplicación nativa'
        ],
        tip: 'También puede usar el botón de instalación en la barra de direcciones.'
      },
      'windows-chrome': {
        title: 'Instalar aplicación (Chrome Windows)',
        steps: [
          'Busque el ícono de instalación en la barra de direcciones',
          'O vaya al menú (tres puntos) y seleccione "Instalar aplicación"',
          'Haga clic en "Instalar"',
          'La aplicación se agregará a su escritorio'
        ],
        tip: 'Aparecerá en el menú inicio y se puede anclar a la barra de tareas.'
      },
      'macos-chrome': {
        title: 'Instalar aplicación (Chrome macOS)',
        steps: [
          'Busque el ícono de instalación en la barra de direcciones',
          'O vaya al menú Chrome y seleccione "Instalar aplicación"',
          'Haga clic en "Instalar"',
          'La aplicación aparecerá en Launchpad y en el Dock'
        ],
        tip: 'Podrá acceder desde Spotlight escribiendo el nombre de la aplicación.'
      },
      'default': {
        title: 'Instalar aplicación',
        steps: [
          'Busque la opción "Instalar app" o "Agregar a pantalla de inicio" en su navegador',
          'Esta opción generalmente está en el menú principal o barra de direcciones',
          'Siga las instrucciones que aparezcan en pantalla',
          'Disfrute de la experiencia como aplicación nativa'
        ],
        tip: 'Las opciones pueden variar según su navegador y dispositivo.'
      }
    };

    const config = instructions[platform] || instructions['default'];
    const message = `${config.title}\n\n${config.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nNota: ${config.tip}`;

    toast(message, {
      duration: 10000,
      style: {
        maxWidth: '450px',
        whiteSpace: 'pre-line',
        fontSize: '14px',
        lineHeight: '1.5'
      }
    });

    // Analytics
    if (window.gtag) {
      window.gtag('event', 'pwa_manual_instructions_shown', {
        event_category: 'PWA',
        event_label: platform
      });
    }
  };

  // Obtener información detallada del navegador
  const getBrowserInfo = () => {
    return {
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform.startsWith('android'),
      isDesktop: ['windows-chrome', 'windows-edge', 'macos-chrome', 'macos-safari'].includes(platform),
      supportsNativeInstall: supportsNativeInstall(),
      canShowInstructions: true
    };
  };

  // Función para forzar re-verificación de instalación
  const recheckInstallation = useCallback(() => {
    const installed = checkIfInstalled();
    setIsInstalled(installed);
    return installed;
  }, [checkIfInstalled]);

  return {
    // Estados principales
    isInstallable,
    isInstalling,
    isInstalled,
    platform,

    // Acciones
    installPWA,
    showManualInstructions,
    recheckInstallation,

    // Información
    getBrowserInfo,

    // Propiedades computadas
    canInstall: isInstallable && !isInstalled,
    shouldShowWidget: !isInstalled && (isInstallable || platform === 'ios' || !supportsNativeInstall())
  };
};

export default usePWAInstall;