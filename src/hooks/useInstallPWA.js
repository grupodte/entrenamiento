import usePWAInstall from './usePWAInstall';
import toast from 'react-hot-toast';

/**
 * Hook simple que expone solo lo esencial para instalar PWA
 * Úsalo donde quieras con total control sobre el UI
 */
const useInstallPWA = () => {
  const { 
    isInstallable, 
    isInstalling, 
    isInstalled, 
    installPWA, 
    showManualInstructions,
    getBrowserInfo,
    canInstall 
  } = usePWAInstall();

  const browserInfo = getBrowserInfo();

  /**
   * Función principal que puedes llamar desde cualquier botón
   * Maneja automáticamente Chrome/iOS/otros navegadores
   */
  const handleInstallApp = async () => {
    if (canInstall) {
      // Instalación automática (Chrome/Edge)
      const result = await installPWA();
      if (result) {
        toast.success('¡FitApp instalada! 🎉');
        return true;
      } else {
        toast.error('Instalación cancelada');
        return false;
      }
    } else if (browserInfo.isIOS || !browserInfo.supportsNativeInstall) {
      // Instrucciones manuales (iOS Safari)
      showManualInstructions();
      return true; // Se mostraron las instrucciones
    } else {
      toast.error('Instalación no disponible en este momento');
      return false;
    }
  };

  /**
   * Determina el texto del botón según el navegador
   */
  const getInstallButtonText = () => {
    if (isInstalling) return 'Instalando...';
    if (browserInfo.isIOS) return 'Añadir a Inicio';
    return 'Instalar App';
  };

  /**
   * Determina si debe mostrar el botón de instalación
   */
  const shouldShowInstallButton = () => {
    return !isInstalled && (canInstall || browserInfo.isIOS);
  };

  return {
    // Estados
    isInstallable,
    isInstalling, 
    isInstalled,
    canInstall,
    
    // Información del navegador
    isIOS: browserInfo.isIOS,
    isChrome: browserInfo.isChrome,
    isSafari: browserInfo.isSafari,
    
    // Funciones principales
    handleInstallApp,      // ← Esta es la función que usarás
    getInstallButtonText,
    shouldShowInstallButton,
    
    // Funciones adicionales si las necesitas
    showManualInstructions
  };
};

export default useInstallPWA;
