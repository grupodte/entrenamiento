import React, { useRef, useEffect, useCallback } from 'react';
import useEdgeGestureCapture from '../hooks/useEdgeGestureCapture';

/**
 * Componente que renderiza overlays invisibles en los bordes de la pantalla
 * para capturar y prevenir gestos de navegación del navegador.
 */
const EdgeGestureOverlay = ({ 
  enabled = true, 
  edgeWidth = 25,
  debug = false,
  className = ''
}) => {
  const leftOverlayRef = useRef(null);
  const rightOverlayRef = useRef(null);

  // Usar el hook de captura de gestos
  const gestureCapture = useEdgeGestureCapture({
    enabled,
    edgeWidth,
    preventThreshold: 30,
    debug
  });

  // Handler adicional para prevenir eventos de los overlays
  const handleOverlayTouch = useCallback((e, side) => {
    if (!enabled) return;

    // Prevenir que el evento burbujee y llegue al navegador
    e.stopPropagation();
    
    if (debug) {
      console.log(`[EdgeGestureOverlay] Touch en overlay ${side}`, {
        clientX: e.touches?.[0]?.clientX || e.clientX,
        type: e.type
      });
    }
  }, [enabled, debug]);

  const handleLeftTouch = useCallback((e) => handleOverlayTouch(e, 'left'), [handleOverlayTouch]);
  const handleRightTouch = useCallback((e) => handleOverlayTouch(e, 'right'), [handleOverlayTouch]);

  // Aplicar estilos adicionales si debug está habilitado
  const getOverlayStyle = useCallback((side) => {
    // Detectar iOS PWA
    const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                     (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
    
    const baseStyle = {
      width: `${edgeWidth}px`,
      height: '100vh',
      position: 'fixed',
      top: 0,
      zIndex: isIOSPWA ? '2147483647' : 'var(--z-emergency)', // Máximo para iOS PWA
      touchAction: isIOSPWA ? 'none' : 'pan-y', // Más restrictivo en iOS PWA
      pointerEvents: enabled ? 'auto' : 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      userSelect: 'none',
    };

    const sideSpecific = side === 'left' 
      ? { left: 0 } 
      : { right: 0 };

    const debugStyle = debug ? {
      backgroundColor: side === 'left' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 0, 255, 0.1)',
      border: `1px solid ${side === 'left' ? 'red' : 'blue'}`,
    } : {
      backgroundColor: 'transparent',
    };

    return {
      ...baseStyle,
      ...sideSpecific,
      ...debugStyle
    };
  }, [edgeWidth, enabled, debug]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Overlay izquierdo */}
      <div
        ref={leftOverlayRef}
        className={`edge-gesture-overlay edge-gesture-overlay-left ${className}`}
        style={getOverlayStyle('left')}
        onTouchStart={handleLeftTouch}
        onTouchMove={handleLeftTouch}
        onTouchEnd={handleLeftTouch}
        data-edge="left"
        data-testid="edge-gesture-overlay-left"
      >
        {debug && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            fontSize: '10px',
            color: 'red',
            fontWeight: 'bold',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            LEFT
          </div>
        )}
      </div>

      {/* Overlay derecho */}
      <div
        ref={rightOverlayRef}
        className={`edge-gesture-overlay edge-gesture-overlay-right ${className}`}
        style={getOverlayStyle('right')}
        onTouchStart={handleRightTouch}
        onTouchMove={handleRightTouch}
        onTouchEnd={handleRightTouch}
        data-edge="right"
        data-testid="edge-gesture-overlay-right"
      >
        {debug && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '50%',
            transform: 'translate(50%, -50%) rotate(90deg)',
            fontSize: '10px',
            color: 'blue',
            fontWeight: 'bold',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            RIGHT
          </div>
        )}
      </div>

      {/* Información de debug */}
      {debug && gestureCapture.isCapturing && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 'var(--z-emergency)',
            pointerEvents: 'none',
            fontFamily: 'monospace'
          }}
        >
          Capturando gesto desde: {gestureCapture.edgeType}
        </div>
      )}
    </>
  );
};

export default EdgeGestureOverlay;
