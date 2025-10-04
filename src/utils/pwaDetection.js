// Utilidades para detectar PWA y configurar posicionamiento de drawers
// src/utils/pwaDetection.js

/**
 * Detecta si la aplicación está ejecutándose como PWA instalada
 * @returns {boolean} true si es PWA instalada, false si es navegador web
 */
export const isPWAInstalled = () => {
    // Verificar display-mode standalone (navegadores estándar)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Verificar iOS Safari PWA
    const isIOSStandalone = window.navigator.standalone === true;
    
    // Verificar Android Chrome PWA
    const isAndroidPWA = document.referrer.includes('android-app://');
    
    // Verificar parámetros de URL que indican PWA
    const urlParams = new URLSearchParams(window.location.search);
    const isPWASource = urlParams.get('utm_source') === 'pwa';
    
    return isStandalone || isIOSStandalone || isAndroidPWA || isPWASource;
};

/**
 * Obtiene información del navegador y plataforma
 * @returns {object} Información del navegador
 */
export const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    return {
        isIOS: /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream,
        isAndroid: /Android/.test(userAgent),
        isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
        isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
        isFirefox: /Firefox/.test(userAgent),
        isEdge: /Edge/.test(userAgent),
        isSamsung: /SamsungBrowser/.test(userAgent),
        platform,
        userAgent,
        isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent)
    };
};

/**
 * Calcula la altura máxima segura para drawers
 * @param {boolean} isStandalone - Si es PWA instalada
 * @param {number} windowHeight - Altura de la ventana
 * @returns {string} Altura CSS
 */
export const calculateDrawerMaxHeight = (isStandalone, windowHeight) => {
    if (isStandalone) {
        return '100vh'; // PWA instalada puede usar toda la altura
    }
    
    const browserInfo = getBrowserInfo();
    
    // En navegadores móviles, usar porcentaje más conservador
    if (browserInfo.isMobile) {
        if (browserInfo.isIOS && browserInfo.isSafari) {
            // Safari iOS necesita más espacio para barras de navegación
            return `${Math.min(windowHeight * 0.75, windowHeight - 60)}px`;
        } else if (browserInfo.isAndroid) {
            // Android Chrome también necesita espacio para barras
            return `${Math.min(windowHeight * 0.85, windowHeight - 40)}px`;
        }
    }
    
    // Desktop o tablets - usar altura estándar
    return `${Math.min(windowHeight * 0.9, windowHeight - 40)}px`;
};

/**
 * Obtiene configuración CSS específica para drawers según el entorno
 * @param {boolean} isStandalone - Si es PWA instalada
 * @param {object} windowDimensions - Dimensiones de ventana {width, height}
 * @returns {object} Estilos CSS
 */
export const getDrawerStyles = (isStandalone, windowDimensions) => {
    const browserInfo = getBrowserInfo();
    const baseStyles = {
        zIndex: 99999,
        bottom: '0px',
        width: '100%'
    };
    
    if (isStandalone) {
        return {
            ...baseStyles,
            paddingTop: 'env(safe-area-inset-top)',
            maxHeight: '100vh'
        };
    }
    
    // Navegador web - estilos seguros
    const maxHeight = calculateDrawerMaxHeight(isStandalone, windowDimensions.height);
    
    return {
        ...baseStyles,
        paddingTop: '0',
        maxHeight,
        height: 'auto',
        minHeight: Math.min(200, windowDimensions.height * 0.3) + 'px',
        // Fixes específicos para navegadores
        ...(browserInfo.isIOS && browserInfo.isSafari && {
            bottom: 'env(safe-area-inset-bottom, 0px)'
        }),
        ...(browserInfo.isMobile && {
            maxWidth: '100vw',
            left: '0',
            right: '0'
        })
    };
};

/**
 * Hook personalizado para debugging de PWA
 */
export const usePWADebug = () => {
    const pwaInstalled = isPWAInstalled();
    const browserInfo = getBrowserInfo();
    
    const debug = () => {
        console.group('🚀 PWA Detection Debug');
        console.log('📱 PWA Instalada:', pwaInstalled);
        console.log('🌐 Info del Navegador:', browserInfo);
        console.log('📏 Dimensiones:', {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        });
        console.log('🎨 Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
        console.log('🔗 URL:', window.location.href);
        console.groupEnd();
    };
    
    return { debug, pwaInstalled, browserInfo };
};

// Exportar como default para uso directo
export default {
    isPWAInstalled,
    getBrowserInfo,
    calculateDrawerMaxHeight,
    getDrawerStyles,
    usePWADebug
};
