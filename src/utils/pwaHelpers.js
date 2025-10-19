/**
 * Utilidades para manejo de PWAs (Progressive Web Apps)
 */

/**
 * Detecta si la aplicación está ejecutándose como PWA
 * @returns {boolean} true si está ejecutándose como PWA
 */
export const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
};

/**
 * Detecta si está ejecutándose en un dispositivo iOS
 * @returns {boolean} true si es iOS
 */
export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detecta si está ejecutándose en Android
 * @returns {boolean} true si es Android
 */
export const isAndroid = () => {
    return /Android/.test(navigator.userAgent);
};

/**
 * Maneja la descarga de archivos de manera optimizada para PWAs
 * @param {string} url - URL del archivo a descargar
 * @param {string} filename - Nombre del archivo
 * @param {object} options - Opciones adicionales
 * @returns {Promise<void>}
 */
export const handleFileDownload = async (url, filename, options = {}) => {
    const {
        onSuccess = () => {},
        onError = (error) => console.error('Error en descarga:', error),
        delay = 100
    } = options;

    try {
        if (isPWA()) {
            console.log('PWA detectada - Usando estrategia de apertura en navegador externo');
            
            // Intentar abrir en el navegador del sistema
            window.open(url, '_blank', 'noopener,noreferrer');
            
            // También crear un enlace de descarga como backup
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_system'; // Para Cordova/PWA
            link.rel = 'noopener noreferrer';
            
            document.body.appendChild(link);
            
            // Simular click con user gesture
            setTimeout(() => {
                try {
                    link.click();
                    document.body.removeChild(link);
                    onSuccess('archivo abierto en navegador');
                } catch (clickError) {
                    console.warn('Error en click de enlace:', clickError);
                    document.body.removeChild(link);
                    onSuccess('archivo abierto en navegador');
                }
            }, delay);
            
        } else {
            console.log('Navegador web - Usando descarga estándar');
            
            // Descarga normal para navegador web
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            onSuccess('descarga iniciada');
        }
        
    } catch (error) {
        console.error('Error en handleFileDownload:', error);
        
        // Fallback final: abrir directamente la URL
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
            onSuccess('archivo abierto como fallback');
        } catch (fallbackError) {
            console.error('Error en fallback final:', fallbackError);
            onError(fallbackError);
        }
    }
};

/**
 * Obtiene información del entorno de ejecución
 * @returns {object} Información del entorno
 */
export const getEnvironmentInfo = () => {
    return {
        isPWA: isPWA(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
        userAgent: navigator.userAgent,
        standalone: window.navigator.standalone
    };
};