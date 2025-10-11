import { useEffect, useRef, useCallback } from 'react';

/**
 * Improved hook to prevent iOS Safari back/forward swipe gestures while preserving clicks.
 * 
 * Uses intelligent swipe detection that analyzes touch movement patterns to distinguish
 * between actual swipe gestures and regular taps/clicks. Only blocks genuine horizontal
 * swipes that start near screen edges, allowing normal UI interactions to work properly.
 * 
 * IMPORTANT: This is a workaround that exploits WebKit behavior, not a guaranteed API.
 * - May fail intermittently during heavy main thread usage
 * - Will not work inside iframes
 * - Could break with iOS updates
 * - Has performance impact due to non-passive event listeners
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable the gesture blocking (default: true)
 * @param {number} options.edgeThreshold - Edge detection threshold as percentage of screen width (default: 0.1 = 10%)
 * @param {boolean} options.debugLog - Whether to log touch events for debugging (default: false)
 * @returns {Object} - { isActive: boolean, stats: { blockedCount: number, totalTouches: number } }
 */
const useIOSBackSwipeBlock = ({
  enabled = true,
  edgeThreshold = 0.1,
  debugLog = false
} = {}) => {
  const statsRef = useRef({ blockedCount: 0, totalTouches: 0 });
  const isIOSRef = useRef(null);

  // Detect iOS environment once
  const detectIOS = useCallback(() => {
    if (isIOSRef.current !== null) return isIOSRef.current;

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isIOSSafari = isIOSDevice && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);

    isIOSRef.current = isIOSSafari;
    return isIOSRef.current;
  }, []);

  // Track touch state for swipe detection
  const touchStateRef = useRef({
    startX: null,
    startY: null,
    startTime: null,
    isTracking: false
  });

  const handleTouchStart = useCallback((event) => {
    statsRef.current.totalTouches++;

    // Only process single-finger touches
    if (event.touches.length !== 1) {
      if (debugLog) console.log('[iOS Swipe Block] Multi-touch detected, ignoring');
      return;
    }

    const touch = event.touches[0];
    const screenWidth = window.innerWidth;
    const edgePixels = screenWidth * edgeThreshold;
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Check if touch is near left or right edge
    const isNearLeftEdge = touchX <= edgePixels;
    const isNearRightEdge = touchX >= screenWidth - edgePixels;

    if (isNearLeftEdge || isNearRightEdge) {
      // Store touch start data for movement analysis
      touchStateRef.current = {
        startX: touchX,
        startY: touchY,
        startTime: Date.now(),
        isTracking: true
      };

      if (debugLog) {
        console.log(`[iOS Swipe Block] Tracking potential swipe at x=${touchX}, edge=${isNearLeftEdge ? 'left' : 'right'}`);
      }
    }
  }, [edgeThreshold, debugLog]);

  const handleTouchMove = useCallback((event) => {
    if (!touchStateRef.current.isTracking || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const { startX, startY, startTime } = touchStateRef.current;
    
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    const deltaTime = Date.now() - startTime;
    
    // Define thresholds for swipe detection
    const MIN_SWIPE_DISTANCE = 50; // minimum horizontal movement (increased)
    const MAX_SWIPE_TIME = 500; // maximum time for swipe gesture
    const MAX_VERTICAL_DRIFT = 75; // maximum vertical movement allowed
    const MIN_SWIPE_VELOCITY = MIN_SWIPE_DISTANCE / deltaTime; // pixels per ms
    
    // Calculate velocity and direction
    const horizontalVelocity = deltaX / deltaTime;
    const isMovingHorizontally = deltaX > deltaY * 2; // horizontal movement is dominant
    
    // Detect horizontal swipe gesture (fast horizontal movement with limited vertical drift)
    const isHorizontalSwipe = deltaX > MIN_SWIPE_DISTANCE && 
                             deltaTime < MAX_SWIPE_TIME && 
                             deltaY < MAX_VERTICAL_DRIFT &&
                             isMovingHorizontally &&
                             horizontalVelocity > 0.15; // minimum velocity threshold
    
    if (isHorizontalSwipe) {
      // This looks like a swipe gesture - block it
      event.preventDefault();
      statsRef.current.blockedCount++;
      touchStateRef.current.isTracking = false; // Stop tracking
      
      if (debugLog) {
        console.log(`[iOS Swipe Block] Blocked swipe: deltaX=${deltaX}, deltaY=${deltaY}, time=${deltaTime}ms`);
      }
    }
  }, [debugLog]);

  const handleTouchEnd = useCallback((event) => {
    if (touchStateRef.current.isTracking) {
      const touch = event.changedTouches[0];
      const { startX, startY, startTime } = touchStateRef.current;
      
      // If this was just a tap/click (minimal movement and time)
      if (touch) {
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);
        const deltaTime = Date.now() - startTime;
        
        const MAX_TAP_MOVEMENT = 10; // maximum movement for a tap
        const MAX_TAP_TIME = 200; // maximum time for a tap
        
        const isSimpleTap = deltaX < MAX_TAP_MOVEMENT && 
                           deltaY < MAX_TAP_MOVEMENT && 
                           deltaTime < MAX_TAP_TIME;
        
        if (isSimpleTap && debugLog) {
          console.log('[iOS Swipe Block] Allowing simple tap/click');
        }
      }
    }
    
    // Reset tracking state
    touchStateRef.current.isTracking = false;
  }, [debugLog]);

  useEffect(() => {
    // Early exit if not enabled or not iOS
    if (!enabled || !detectIOS()) {
      if (debugLog && !detectIOS()) {
        console.log('[iOS Swipe Block] Not iOS Safari, skipping gesture prevention');
      }
      return;
    }

    // Feature detection for touch events
    if (!('ontouchstart' in window)) {
      if (debugLog) console.log('[iOS Swipe Block] Touch events not supported');
      return;
    }

    if (debugLog) {
      console.log(`[iOS Swipe Block] Activating with ${(edgeThreshold * 100).toFixed(1)}% edge threshold`);
    }

    // Add the non-passive touchstart listener
    // CRITICAL: { passive: false } is required for preventDefault() to work
    const options = { passive: false };
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd, options);

    // Cleanup function
    return () => {
      window.removeEventListener('touchstart', handleTouchStart, options);
      window.removeEventListener('touchmove', handleTouchMove, options);
      window.removeEventListener('touchend', handleTouchEnd, options);
      if (debugLog) {
        console.log(
          `[iOS Swipe Block] Deactivated. Stats: ${statsRef.current.blockedCount}/${statsRef.current.totalTouches} touches blocked`
        );
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, detectIOS, debugLog, edgeThreshold]);

  // Also apply CSS fallback (even though it doesn't work on iOS, it helps other browsers)
  useEffect(() => {
    if (!enabled) return;

    // Apply CSS overscroll-behavior as fallback for other browsers
    const originalBodyX = document.body.style.overscrollBehaviorX;
    const originalDocX = document.documentElement.style.overscrollBehaviorX;

    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';

    return () => {
      document.body.style.overscrollBehaviorX = originalBodyX;
      document.documentElement.style.overscrollBehaviorX = originalDocX;
    };
  }, [enabled]);

  return {
    isActive: enabled && detectIOS(),
    stats: {
      blockedCount: statsRef.current.blockedCount,
      totalTouches: statsRef.current.totalTouches
    },
    isIOSDetected: detectIOS()
  };
};

export default useIOSBackSwipeBlock;
