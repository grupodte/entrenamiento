import React, { forwardRef } from 'react';
import { useUniversalTouch, useCriticalTouch, useSmallButtonTouch, useNavTouch } from '../../hooks/useUniversalTouch';

/**
 * Componente Button universal con touch optimizado
 * Reemplaza botones nativos con mejor experiencia táctil
 */
const TouchButton = forwardRef(({
  children,
  onClick,
  variant = 'default', // 'default' | 'critical' | 'small' | 'nav'
  disabled = false,
  className = '',
  style = {},
  type = 'button',
  ...props
}, ref) => {

  // Seleccionar hook según variante
  let touchProps;
  switch (variant) {
    case 'critical':
      touchProps = useCriticalTouch(onClick);
      break;
    case 'small':
      touchProps = useSmallButtonTouch(onClick);
      break;
    case 'nav':
      touchProps = useNavTouch(onClick);
      break;
    default:
      touchProps = useUniversalTouch(onClick, { disabled });
  }

  // Combinar refs
  const buttonRef = ref || touchProps.ref;

  // Estilos base según variante
  const getVariantStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none';
    
    switch (variant) {
      case 'critical':
        return `${baseStyles} font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg px-4 py-3 min-h-[44px]`;
      case 'small':
        return `${baseStyles} text-sm bg-gray-200 hover:bg-gray-300 rounded-md px-3 py-2 min-h-[44px] min-w-[44px]`;
      case 'nav':
        return `${baseStyles} text-white bg-transparent hover:bg-white/10 rounded-lg px-3 py-2 min-h-[44px]`;
      default:
        return `${baseStyles} bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 min-h-[44px]`;
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      className={`${getVariantStyles()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        ...touchProps.style,
        ...style
      }}
      onTouchStart={touchProps.onTouchStart}
      onTouchEnd={touchProps.onTouchEnd}
      onTouchCancel={touchProps.onTouchCancel}
      onClick={touchProps.onClick}
      {...props}
    >
      {children}
    </button>
  );
});

TouchButton.displayName = 'TouchButton';

/**
 * Variantes específicas para diferentes casos de uso
 */
export const CriticalButton = forwardRef((props, ref) => (
  <TouchButton ref={ref} variant="critical" {...props} />
));

export const SmallButton = forwardRef((props, ref) => (
  <TouchButton ref={ref} variant="small" {...props} />
));

export const NavButton = forwardRef((props, ref) => (
  <TouchButton ref={ref} variant="nav" {...props} />
));

CriticalButton.displayName = 'CriticalButton';
SmallButton.displayName = 'SmallButton';
NavButton.displayName = 'NavButton';

export default TouchButton;
