import React from 'react';
import { 
  ArrowDownTrayIcon, 
  DevicePhoneMobileIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import usePWAInstall from '../hooks/usePWAInstall';
import toast from 'react-hot-toast';

const InstallButton = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '',
  showText = true,
  customText = '',
  showIcon = true,
  fullWidth = false 
}) => {
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

  const handleInstallClick = async () => {
    if (canInstall) {
      const result = await installPWA();
      if (result) {
        toast.success('¡App instalada correctamente! 🎉');
      } else {
        toast.error('Instalación cancelada');
      }
    } else if (browserInfo.isIOS || !browserInfo.supportsNativeInstall) {
      showManualInstructions();
    } else {
      toast.error('La instalación no está disponible en este momento');
    }
  };

  // Si ya está instalada, no mostrar nada (o mostrar estado instalado)
  if (isInstalled) {
    return showText ? (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
        <CheckCircleIcon className="w-5 h-5" />
        <span>App instalada</span>
      </div>
    ) : null;
  }

  // Si no es instalable y no es iOS/navegador con instalación manual, no mostrar
  if (!canInstall && !browserInfo.isIOS && browserInfo.supportsNativeInstall) {
    return null;
  }

  // Configuración de variantes
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
    floating: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-2xl fixed bottom-6 right-6 z-50 rounded-full p-4'
  };

  // Configuración de tamaños
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  // Determinar el texto a mostrar
  let displayText = '';
  if (customText) {
    displayText = customText;
  } else if (isInstalling) {
    displayText = 'Instalando...';
  } else if (browserInfo.isIOS) {
    displayText = 'Agregar a Inicio';
  } else {
    displayText = 'Instalar App';
  }

  // Determinar el ícono
  const IconComponent = isInstalling 
    ? ArrowDownTrayIcon 
    : browserInfo.isIOS 
      ? DevicePhoneMobileIcon 
      : ArrowDownTrayIcon;

  // Clase base del botón
  const baseClasses = `
    relative inline-flex items-center justify-center gap-2 font-medium 
    transition-all duration-200 ease-in-out transform hover:scale-105 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
    dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed 
    disabled:transform-none
  `;

  // Clases específicas según la variante
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = variant === 'floating' ? '' : sizes[size];
  const roundedClasses = variant === 'floating' ? '' : 'rounded-lg';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={`
        ${baseClasses}
        ${variantClasses}
        ${sizeClasses}
        ${roundedClasses}
        ${widthClasses}
        ${className}
      `}
      title={isInstalling ? 'Instalando...' : `${displayText} - FitApp PWA`}
    >
      {/* Ícono */}
      {showIcon && (
        <IconComponent 
          className={`
            ${iconSizes[size]} 
            ${isInstalling ? 'animate-bounce' : ''}
          `} 
        />
      )}
      
      {/* Texto */}
      {showText && !variant.includes('floating') && (
        <span className={isInstalling ? 'animate-pulse' : ''}>
          {displayText}
        </span>
      )}
      
      {/* Indicador de loading */}
      {isInstalling && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
};

// Componente especializado para banner de instalación
export const InstallBanner = ({ onDismiss, className = '' }) => {
  const { canInstall, isInstalled } = usePWAInstall();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <div className={`
      bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg 
      shadow-lg border-l-4 border-yellow-400 ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DevicePhoneMobileIcon className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">¡Instala FitApp!</h3>
            <p className="text-blue-100 text-sm">
              Acceso rápido desde tu escritorio y funciona sin internet
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <InstallButton 
            variant="secondary"
            size="sm"
            showText={true}
            customText="Instalar"
          />
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-blue-200 hover:text-white p-1 rounded"
              title="Cerrar"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para botón flotante
export const FloatingInstallButton = () => {
  const { canInstall, isInstalled } = usePWAInstall();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <InstallButton 
      variant="floating"
      showText={false}
      className="animate-pulse hover:animate-none"
    />
  );
};

export default InstallButton;
