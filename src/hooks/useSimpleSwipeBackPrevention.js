import { useEffect, useRef, useCallback } from 'react';

/**
 * Production-ready hook to prevent iOS Safari back/forward swipe gestures in PWAs.
 * 
 * Uses touchstart interception with { passive: false } to cancel system navigation
 * gestures when they originate near screen edges. This addresses the conflict between
 * iOS system gestures and PWA UI elements like side menus, carousels, and fullscreen interfaces.
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

    // Check if touch is near left or right edge
    const isNearLeftEdge = touchX <= edgePixels;
    const isNearRightEdge = touchX >= screenWidth - edgePixels;

    if (isNearLeftEdge || isNearRightEdge) {
      // Prevent the default browser navigation gesture
      event.preventDefault();
      statsRef.current.blockedCount++;

      if (debugLog) {
        console.log(`[iOS Swipe Block] Blocked gesture at x=${touchX}, edge=${isNearLeftEdge ? 'left' : 'right'}`);
      }
    }
  }, [edgeThreshold, debugLog]);

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

    // Cleanup function
    return () => {
      window.removeEventListener('touchstart', handleTouchStart, options);
      if (debugLog) {
        console.log(
          `[iOS Swipe Block] Deactivated. Stats: ${statsRef.current.blockedCount}/${statsRef.current.totalTouches} touches blocked`
        );
      }
    };
  }, [enabled, handleTouchStart, detectIOS, debugLog, edgeThreshold]);

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
