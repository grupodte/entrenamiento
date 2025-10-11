/**
 * Feature flags configuration for the fitness PWA
 * 
 * Use these flags to control experimental features, gradual rollouts,
 * and emergency rollbacks without code deployments.
 */

const FEATURES = {
  // iOS gesture control feature flag
  IOS_SWIPE_BLOCK: {
    enabled: true, // Set to false to disable globally
    // Additional settings for the iOS swipe block feature
    settings: {
      edgeThreshold: 0.05, // 5% of screen width por defecto (~18px en móvil)
      debugLog: true, // Set to true for development debugging
      // Configuración específica por ruta
      routeSettings: {
        '/curso/': { edgeThreshold: 0.03 }, // 3% para páginas con video
        '/rutina/': { edgeThreshold: 0.08 }, // 8% para rutinas (fullscreen)
        '/dashboard': { edgeThreshold: 0.05 }, // 5% por defecto
        '/admin': { edgeThreshold: 0.06 } // 6% para admin
      },
      // Specific routes where the feature should be active
      enabledRoutes: [
        '/rutina/', // Full-screen workout views (matches /rutina/:id)
        '/dashboard', // Enable on dashboard
        '/mis-cursos', // Enable on courses
        '/mis-dietas', // Enable on diets
        '/curso/', // Enable on video courses
        '/admin', // Enable on admin pages
        // Add other routes as needed during gradual rollout
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
  
  const settings = getFeatureSettings('IOS_SWIPE_BLOCK');
  const enabledRoutes = settings.enabledRoutes || [];
  
  // Check if current path matches any enabled route
  return enabledRoutes.some(route => currentPath.includes(route));
};

export default FEATURES;
