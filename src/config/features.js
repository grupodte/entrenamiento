/**
 * Feature flags configuration for the fitness PWA
 * 
 * Use these flags to control experimental features, gradual rollouts,
 * and emergency rollbacks without code deployments.
 */

const FEATURES = {
  // iOS gesture control feature flag
  IOS_SWIPE_BLOCK: {
    enabled: true, // Habilitado para BLOQUEAR completamente el swipe back
    // Additional settings for the iOS swipe block feature
    settings: {
      edgeThreshold: 0.15, // 15% of screen width - zona más amplia de bloqueo
      debugLog: true, // Habilitado temporalmente para verificar
      // Configuración específica por ruta - todas con bloqueo amplio
      routeSettings: {
        '/curso/': { edgeThreshold: 0.15 }, // 15% bloqueo completo
        '/rutina/': { edgeThreshold: 0.15 }, // 15% bloqueo completo
        '/dashboard': { edgeThreshold: 0.15 }, // 15% bloqueo completo
        '/admin': { edgeThreshold: 0.15 }, // 15% bloqueo completo
        '/': { edgeThreshold: 0.15 } // 15% bloqueo completo para todas las rutas
      },
      // Specific routes where the feature should be active - TODAS LAS RUTAS
      enabledRoutes: [
        '/', // Ruta raíz
        '/dashboard', // Dashboard de alumno
        '/rutina/', // Detalles de rutina (matches /rutina/:id)
        '/mis-cursos', // Cursos del alumno
        '/mis-dietas', // Dietas del alumno
        '/curso/', // Visualizar curso (matches /curso/:id)
        '/onboarding', // Proceso de onboarding
        '/admin', // Panel de administración
        '/admin/', // Todas las sub-rutas de admin
        '/login', // Login
        '/register', // Registro
        '/cursos', // Catálogo público
        '/instalar', // Instalación PWA
        '/tyc', // Términos y condiciones
        '/privacidad', // Política de privacidad
        '/callback' // Callbacks (Spotify, etc.)
      ]
    }
  },

  // Placeholder for other experimental features
  EXPERIMENTAL_FEATURES: {
    enabled: false,
    settings: {}
  }
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} - Whether the feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  const feature = FEATURES[featureName];
  return feature && feature.enabled === true;
};

/**
 * Get feature settings
 * @param {string} featureName - Name of the feature
 * @returns {Object} - Feature settings object
 */
export const getFeatureSettings = (featureName) => {
  const feature = FEATURES[featureName];
  return feature?.settings || {};
};

/**
 * Get the edge threshold for iOS swipe block based on current route
 * @param {string} currentPath - Current route path
 * @returns {number} - Edge threshold percentage (0-1)
 */
export const getSwipeThresholdForRoute = (currentPath) => {
  const settings = getFeatureSettings('IOS_SWIPE_BLOCK');
  const routeSettings = settings.routeSettings || {};
  const defaultThreshold = settings.edgeThreshold || 0.05;
  
  // Buscar configuración específica para la ruta actual
  for (const [route, config] of Object.entries(routeSettings)) {
    if (currentPath.includes(route)) {
      return config.edgeThreshold || defaultThreshold;
    }
  }
  
  return defaultThreshold;
};

/**
 * Check if iOS swipe block should be enabled for a specific route
 * @param {string} currentPath - Current route path
 * @returns {boolean} - Whether iOS swipe block should be active
 */
export const shouldEnableIOSSwipeBlock = (currentPath) => {
  if (!isFeatureEnabled('IOS_SWIPE_BLOCK')) {
    return false;
  }
  
  // BLOQUEAR EN TODAS LAS RUTAS - solo excluir rutas específicas si es necesario
  const settings = getFeatureSettings('IOS_SWIPE_BLOCK');
  const disabledRoutes = settings.disabledRoutes || []; // Rutas donde NO bloquear
  
  // Si hay rutas deshabilitadas específicas, verificar si la ruta actual está en esa lista
  const isDisabled = disabledRoutes.some(route => currentPath.includes(route));
  
  // Bloquear en todas las rutas EXCEPTO las específicamente deshabilitadas
  return !isDisabled;
};

export default FEATURES;
