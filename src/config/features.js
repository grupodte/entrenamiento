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
      edgeThreshold: 0.1, // 10% of screen width
      debugLog: false, // Set to true for development debugging
      // Specific routes where the feature should be active
      enabledRoutes: [
        '/rutina-detalle', // Full-screen workout views
        // '/dashboard', // Uncomment to enable on dashboard (with carousels)
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
