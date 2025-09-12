import React, { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  DevicePhoneMobileIcon, 
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import usePWAInstall from '../hooks/usePWAInstall';
import toast from 'react-hot-toast';

const PWAInstallWidget = ({ 
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center'
  variant = 'compact', // 'compact', 'expanded'
  autoShow = true,
  onDismiss 
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
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

  // No mostrar si ya está instalada, fue descartada, o no es instalable
  if (isInstalled || isDismissed || (!canInstall && !browserInfo.isIOS)) {
    return null;
  }

  const handleInstall = async () => {
    if (canInstall) {
      const result = await installPWA();
      if (result) {
        toast.success('¡FitApp instalada! 🎉');
      }
    } else if (browserInfo.isIOS || !browserInfo.supportsNativeInstall) {
      showManualInstructions();
    } else {
      toast.error('Instalación no disponible');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  // Configuración de posiciones
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2'
  };

  // Determinar ícono y texto
  const iconComponent = browserInfo.isIOS ? DevicePhoneMobileIcon : ArrowDownTrayIcon;
  const buttonText = browserInfo.isIOS ? 'Añadir a Inicio' : 'Instalar App';

  if (variant === 'compact') {
    return (
      <div className={`${positionClasses[position]} z-50 group`}>
        <div className="relative">
          {/* Botón principal */}
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="
              bg-gradient-to-r from-blue-600 to-purple-600 
              hover:from-blue-700 hover:to-purple-700
              text-white rounded-full p-4 shadow-lg 
              hover:shadow-2xl transition-all duration-300 
              transform hover:scale-105 disabled:opacity-70
              flex items-center gap-3
            "
            title={`${buttonText} - FitApp PWA`}
          >
            {React.createElement(iconComponent, { 
              className: `w-6 h-6 ${isInstalling ? 'animate-bounce' : ''}` 
            })}
            
            {/* Texto que aparece en hover */}
            <span className="
              hidden group-hover:inline-block text-sm font-medium
              whitespace-nowrap opacity-0 group-hover:opacity-100
              transition-opacity duration-200
            ">
              {isInstalling ? 'Instalando...' : buttonText}
            </span>
          </button>

          {/* Botón de cerrar */}
          <button
            onClick={handleDismiss}
            className="
              absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-700 
              text-white rounded-full p-1 opacity-0 group-hover:opacity-100
              transition-opacity duration-200 transform hover:scale-110
            "
            title="Cerrar"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          {/* Indicador de loading */}
          {isInstalling && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Variant expandido
  return (
    <div className={`${positionClasses[position]} z-50 max-w-sm`}>
      <div className="
        bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 
        dark:border-gray-700 p-4 transform transition-all duration-300
      ">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {React.createElement(iconComponent, { className: "w-5 h-5 text-blue-600" })}
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Instalar FitApp
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <p className="text-gray-600 dark:text-gray-300 text-xs mb-4">
          Instala la app para acceso rápido y uso sin conexión
        </p>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="
              flex-1 bg-gradient-to-r from-blue-600 to-purple-600 
              hover:from-blue-700 hover:to-purple-700 text-white 
              px-3 py-2 rounded-md text-sm font-medium
              disabled:opacity-70 transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {isInstalling && (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isInstalling ? 'Instalando...' : buttonText}
          </button>
          
          <button
            onClick={handleDismiss}
            className="
              px-3 py-2 text-gray-600 dark:text-gray-400 
              hover:text-gray-800 dark:hover:text-gray-200 
              text-sm transition-colors
            "
          >
            Después
          </button>
        </div>

        {/* Info adicional */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {browserInfo.isIOS ? 'Se abrirán las instrucciones' : 'Instalación automática'}
        </p>
      </div>
    </div>
  );
};

// Widget simple que se puede usar fácilmente
export const SimpleInstallWidget = () => {
  return <PWAInstallWidget variant="compact" position="bottom-right" />;
};

// Widget expandido para usar en lugares específicos
export const ExpandedInstallWidget = ({ onDismiss }) => {
  return (
    <PWAInstallWidget 
      variant="expanded" 
      position="bottom-center" 
      onDismiss={onDismiss}
    />
  );
};

export default PWAInstallWidget;
