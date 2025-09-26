// Script inline para prevenir gestos de navegación INMEDIATAMENTE
// Este script se ejecuta antes que React y bloquea los gestos de sistema

(function() {
    'use strict';
    
    // Detectar iOS y PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isPWA = window.navigator.standalone || 
                  window.matchMedia('(display-mode: standalone)').matches ||
                  window.matchMedia('(display-mode: fullscreen)').matches;
    
    console.log('[PreventSwipe] iOS:', isIOS, 'PWA:', isPWA);
    
    if (isIOS && isPWA) {
        // Aplicar CSS agresivo inmediatamente
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-touch-callout: none !important;
                -webkit-user-select: none !important;
                user-select: none !important;
                touch-action: manipulation !important;
            }
            
            html, body {
                overscroll-behavior-x: none !important;
                -webkit-overscroll-behavior-x: none !important;
                touch-action: pan-y !important;
            }
            
            /* Crear overlays inmediatos con CSS */
            html::before, html::after {
                content: '';
                position: fixed;
                top: 0;
                width: 50px;
                height: 100vh;
                z-index: 2147483647;
                pointer-events: auto;
                touch-action: none !important;
                background: rgba(255, 0, 0, 0.01); /* Casi invisible pero intercepta */
            }
            
            html::before {
                left: 0;
            }
            
            html::after {
                right: 0;
            }
        `;
        document.head.appendChild(style);
        
        // Interceptar eventos inmediatamente
        let isCapturing = false;
        let startX = null;
        
        const preventSwipe = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            const x = touch.clientX;
            const screenWidth = window.innerWidth;
            
            if (e.type === 'touchstart') {
                startX = x;
                isCapturing = x < 50 || x > (screenWidth - 50);
                if (isCapturing) {
                    console.log('[PreventSwipe] Capturando en borde:', x < 50 ? 'izq' : 'der');
                }
            }
            
            if (e.type === 'touchmove' && isCapturing && startX !== null) {
                const deltaX = x - startX;
                const isSwipeBack = (startX < 50 && deltaX > 20) || 
                                  (startX > (screenWidth - 50) && deltaX < -20);
                
                if (isSwipeBack) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log('[PreventSwipe] Gesto bloqueado:', deltaX);
                    return false;
                }
            }
            
            if (e.type === 'touchend') {
                isCapturing = false;
                startX = null;
            }
        };
        
        // Agregar listeners inmediatamente
        const options = { passive: false, capture: true };
        document.addEventListener('touchstart', preventSwipe, options);
        document.addEventListener('touchmove', preventSwipe, options);
        document.addEventListener('touchend', preventSwipe, options);
        
        // Prevenir gestos adicionales de iOS
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
            console.log('[PreventSwipe] Gesture start bloqueado');
        }, { passive: false, capture: true });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        }, { passive: false, capture: true });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        }, { passive: false, capture: true });
        
        console.log('[PreventSwipe] Sistema de bloqueo activado');
    }
})();
