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
    getInstallInstructions,
    canInstall 
  } = usePWAInstall();

  const browserInfo = getBrowserInfo();

  /**
   * Función principal que puedes llamar desde cualquier botón
   * Maneja automáticamente Chrome/iOS/otros navegadores
   * 
   * @param {boolean} showInstructionsInline - Si es true, devuelve 'show_instructions' en lugar de mostrar toast
   */
  const handleInstallApp = async (showInstructionsInline = false) => {
    console.log('PWA: handleInstallApp called', { canInstall, isIOS: browserInfo.isIOS, supportsNative: browserInfo.supportsNativeInstall, showInstructionsInline });
    
    if (canInstall) {
      // Instalación automática (Chrome/Edge con prompt disponible)
      console.log('PWA: Attempting automatic install');
      const result = await installPWA();
      if (result) {
        toast.success('¡FitApp instalada! 🎉');
        return { success: true, action: 'installed' };
      } else {
        toast.error('Instalación cancelada');
        return { success: false, action: 'cancelled' };
      }
    } else {
      // Instrucciones manuales (iOS, Android, Chrome sin prompt, etc.)
      console.log('PWA: Showing manual instructions', { showInstructionsInline });
      
      if (showInstructionsInline) {
        // Para mostrar en la página en lugar de toast
        return { success: true, action: 'show_instructions' };
      } else {
        // Mostrar toast tradicional
        showManualInstructions();
        return { success: true, action: 'instructions_shown' };
      }
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
   * Ahora siempre muestra el botón si no está instalado, ya que en móviles
   * siempre se puede agregar manualmente
   */
  const shouldShowInstallButton = () => {
    return !isInstalled;
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
    platform: browserInfo.platform,
    
    // Funciones principales
    handleInstallApp,      // ← Esta es la función que usarás
    getInstallButtonText,
    shouldShowInstallButton,
    
    // Funciones adicionales si las necesitas
    showManualInstructions,
    getInstallInstructions
  };
};

export default useInstallPWA;
