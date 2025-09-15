import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

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
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge|opr\//.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isEdge = /edge|edg/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|edge|opr/.test(userAgent);
    
    let title = '';
    let instructions = '';
    
    if (isIOS) {
      title = '📱 Agregar FitApp al Inicio (iOS)';
      instructions = `Para agregar FitApp a tu pantalla de inicio:

` +
        `1️⃣ Toca el botón Compartir (⬆️) en Safari
` +
        `2️⃣ Desplázate y toca "Agregar a pantalla de inicio" 🏠
` +
        `3️⃣ Toca "Agregar" para confirmar ✅

` +
        `¡Listo! FitApp aparecerá como una app en tu pantalla de inicio 🎉`;
    } else if (isAndroid && isChrome) {
      title = '📱 Instalar FitApp (Android Chrome)';
      instructions = `Para instalar FitApp en tu dispositivo:

` +
        `1️⃣ Toca el menú (⋮) en la esquina superior derecha
` +
        `2️⃣ Selecciona "Agregar a pantalla de inicio" o "Instalar app" 📲
` +
        `3️⃣ Toca "Agregar" o "Instalar" para confirmar ✅

` +
        `¡FitApp se instalará como una aplicación nativa! 🚀`;
    } else if (isChrome) {
      title = '💻 Instalar FitApp (Chrome)';
      instructions = `Para instalar FitApp:

` +
        `1️⃣ Busca el ícono de instalación (⬇️) en la barra de direcciones
` +
        `   O ve al menú (⋮) → "Instalar app"
` +
        `2️⃣ Haz clic en "Instalar" 📲
` +
        `3️⃣ ¡La app se agregará a tu escritorio! ✅

` +
        `Podrás abrir FitApp desde el menú de inicio o escritorio 🎉`;
    } else if (isFirefox) {
      title = '🦊 Agregar FitApp (Firefox)';
      instructions = `Para agregar FitApp a tu pantalla de inicio:

` +
        `1️⃣ Toca el menú (≡) en la esquina superior derecha
` +
        `2️⃣ Selecciona "Agregar a pantalla de inicio" 🏠
` +
        `3️⃣ Toca "Agregar" para confirmar ✅

` +
        `FitApp aparecerá como acceso directo en tu dispositivo 📱`;
    } else if (isEdge) {
      title = '🌐 Instalar FitApp (Edge)';
      instructions = `Para instalar FitApp:

` +
        `1️⃣ Busca el ícono de instalación (+) en la barra de direcciones
` +
        `   O ve al menú (⋯) → "Apps" → "Instalar app"
` +
        `2️⃣ Haz clic en "Instalar" 📲
` +
        `3️⃣ ¡La app se agregará a tu sistema! ✅

` +
        `Podrás acceder a FitApp desde el menú inicio 🚀`;
    } else {
      title = '📲 Agregar FitApp como App';
      instructions = `Para agregar FitApp a tu dispositivo:

` +
        `1️⃣ Busca "Agregar a pantalla de inicio" o "Instalar app" en el menú de tu navegador
` +
        `2️⃣ Sigue las instrucciones que aparezcan
` +
        `3️⃣ ¡Disfruta de la experiencia como app nativa! 🎉

` +
        `Nota: Las opciones pueden variar según tu navegador y dispositivo`;
    }
    
    // Mostrar con toast en lugar de alert para mejor UX
    toast(
      (t) => (
        `${title}\n\n${instructions}\n\n¿Necesitas ayuda? Consulta la documentación de tu navegador.`
      ),
      {
        duration: 8000,
        style: {
          maxWidth: '400px',
          whiteSpace: 'pre-line',
          fontSize: '14px',
          lineHeight: '1.4'
        },
        icon: isIOS ? '📱' : isAndroid ? '🤖' : '💻'
      }
    );
    
    console.log(`PWA: Showed manual instructions for ${title}`);
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
