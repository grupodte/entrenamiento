import { useState, useEffect, useRef } from 'react';

const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Detectar si ya está instalada
    const checkIfInstalled = () => {
      // Método 1: Verificar display-mode
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      // Método 2: Verificar navigator.standalone (iOS)
      if (window.navigator && window.navigator.standalone) {
        setIsInstalled(true);
        return true;
      }
      
      // Método 3: Verificar si viene desde una PWA instalada
      if (document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    // Verificar instalación inicial
    const installed = checkIfInstalled();
    
    // Listener para el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (event) => {
      console.log('PWA: beforeinstallprompt event fired');
      
      // Prevenir que el navegador muestre automáticamente el prompt
      event.preventDefault();
      
      // Guardar el evento para usarlo después
      deferredPromptRef.current = event;
      setInstallPrompt(event);
      
      // Solo mostrar como instalable si no está ya instalada
      if (!installed) {
        setIsInstallable(true);
      }
    };

    // Listener para detectar cuando se instala la app
    const handleAppInstalled = (event) => {
      console.log('PWA: App installed', event);
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      deferredPromptRef.current = null;
    };

    // Agregar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar soporte para instalación
    const checkInstallSupport = () => {
      // Verificar si el navegador soporta PWA
      if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
        console.log('PWA: Install support detected');
      }
    };

    checkInstallSupport();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Función para iniciar la instalación
  const installPWA = async () => {
    if (!deferredPromptRef.current) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      setIsInstalling(true);
      
      // Mostrar el prompt de instalación
      deferredPromptRef.current.prompt();
      
      // Esperar la respuesta del usuario
      const choiceResult = await deferredPromptRef.current.userChoice;
      
      console.log('PWA: User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        // No establecer isInstalled aquí, esperar al evento 'appinstalled'
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      // Limpiar el prompt usado
      deferredPromptRef.current = null;
      setInstallPrompt(null);
      setIsInstallable(false);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Error during installation:', error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  // Función para mostrar instrucciones manuales
  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    let instructions = '';
    let title = '';
    
    if (isIOS && isSafari) {
      title = '📱 Instalar FitApp en iPhone/iPad';
      instructions = `
✨ Para añadir FitApp a tu pantalla de inicio:

1️⃣ Toca el botón de compartir (⬆️) en la parte inferior
2️⃣ Busca "Añadir a pantalla de inicio" 📋
3️⃣ Toca "Añadir" para confirmar ✅

¡Listo! Ahora tendrás FitApp como una app nativa en tu dispositivo 🎉`;
    } else if (navigator.userAgent.includes('Chrome')) {
      title = '💻 Instalar FitApp en Chrome';
      instructions = `
✨ Para instalar FitApp:

1️⃣ Busca el ícono ⬇️ en la barra de direcciones
   (o ve al menú ⋮ > "Instalar app")
2️⃣ Haz clic en "Instalar" 📲
3️⃣ ¡La app se añadirá automáticamente! ✅`;
    } else {
      title = '📲 Instalar FitApp';
      instructions = `
✨ Para instalar FitApp como app:

1️⃣ Busca "Instalar app" o "Añadir a pantalla de inicio" en el menú de tu navegador
2️⃣ Sigue las instrucciones que aparezcan
3️⃣ ¡Disfruta de la experiencia nativa! 🎉`;
    }
    
    // Usar una notificación más amigable en lugar de alert
    if (typeof window !== 'undefined' && window.confirm) {
      const showInstructions = window.confirm(
        `${title}\n\n¿Te gustaría ver las instrucciones para instalar FitApp?`
      );
      
      if (showInstructions) {
        alert(instructions);
      }
    } else {
      alert(title + instructions);
    }
  };

  // Función para obtener información sobre el navegador
  const getBrowserInfo = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = navigator.userAgent.includes('Chrome');
    const isFirefox = navigator.userAgent.includes('Firefox');
    const isEdge = navigator.userAgent.includes('Edge');
    
    return {
      isIOS,
      isSafari,
      isChrome,
      isFirefox,
      isEdge,
      supportsNativeInstall: 'BeforeInstallPromptEvent' in window
    };
  };

  return {
    isInstallable,
    isInstalling,
    isInstalled,
    installPWA,
    showManualInstructions,
    getBrowserInfo,
    canInstall: isInstallable && !isInstalled
  };
};

export default usePWAInstall;
