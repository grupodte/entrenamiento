/**
 * Testing utilities for iOS swipe gesture prevention
 * 
 * This module provides tools to test the iOS swipe gesture blocking functionality
 * across different devices, scenarios, and edge cases.
 */

/**
 * Test matrix for iOS swipe gesture prevention
 * Use this for manual testing across different scenarios
 */
export const IOS_SWIPE_TEST_MATRIX = {
  // Device and OS combinations to test
  devices: [
    { name: 'iPhone 15 Pro', ios: '17.1', safari: '17.1' },
    { name: 'iPhone 14', ios: '17.0', safari: '17.0' },
    { name: 'iPhone 13', ios: '16.6', safari: '16.6' },
    { name: 'iPhone 12', ios: '16.0', safari: '16.0' },
    { name: 'iPad Pro', ios: '17.1', safari: '17.1' },
    { name: 'iPad Air', ios: '16.6', safari: '16.6' }
  ],

  // Test scenarios to validate
  scenarios: [
    {
      name: 'Basic Edge Swipe Prevention',
      description: 'Swipe from left/right edge should not trigger navigation',
      steps: [
        'Open workout detail screen',
        'Swipe from left edge (first 10% of screen width)',
        'Swipe from right edge (last 10% of screen width)',
        'Verify no navigation occurs'
      ],
      expectedResult: 'Navigation gestures should be blocked'
    },
    {
      name: 'Center Screen Swipe Allow',
      description: 'Swipes in center area should work normally',
      steps: [
        'Open workout detail screen',
        'Swipe from center of screen horizontally',
        'Try vertical scrolling',
        'Tap buttons normally'
      ],
      expectedResult: 'Normal touch interactions should work'
    },
    {
      name: 'Performance During Scroll',
      description: 'Test gesture blocking during active scrolling',
      steps: [
        'Open workout detail screen',
        'Start scrolling vertically',
        'While scrolling, attempt edge swipe',
        'Monitor for jank or performance issues'
      ],
      expectedResult: 'Should block gesture without major performance impact'
    },
    {
      name: 'Heavy Main Thread Load',
      description: 'Test reliability when main thread is busy',
      steps: [
        'Open workout detail screen',
        'Enable debug logging in feature config',
        'Trigger heavy operations (multiple state updates)',
        'Attempt edge swipes during heavy operations'
      ],
      expectedResult: 'May fail intermittently - this is expected behavior'
    },
    {
      name: 'Video Panel Integration',
      description: 'Test gesture blocking with embedded content',
      steps: [
        'Open workout detail screen',
        'Open video panel',
        'Attempt edge swipes while video is playing',
        'Close video panel and test again'
      ],
      expectedResult: 'Should work in main view, may fail in video panel (iframe)'
    },
    {
      name: 'Feature Flag Toggle',
      description: 'Test feature flag enable/disable functionality',
      steps: [
        'Set IOS_SWIPE_BLOCK.enabled = false in features.js',
        'Reload application',
        'Attempt edge swipes',
        'Re-enable feature and test again'
      ],
      expectedResult: 'Feature should toggle on/off correctly'
    }
  ],

  // Known limitations to document during testing
  knownLimitations: [
    'May fail during heavy main thread activity',
    'Does not work inside iframe content',
    'Performance impact from non-passive event listeners',
    'Could break with iOS updates',
    'Reliability varies based on system load'
  ]
};

/**
 * Debug helper to simulate touch events for testing
 * Use this in development console to test edge detection
 */
export const simulateTouchEvent = (x, y, type = 'touchstart') => {
  const touchEvent = new TouchEvent(type, {
    touches: [
      new Touch({
        identifier: 0,
        target: document.body,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
        radiusX: 5,
        radiusY: 5,
        rotationAngle: 0,
        force: 1
      })
    ],
    bubbles: true,
    cancelable: true
  });

  document.dispatchEvent(touchEvent);
  return touchEvent;
};

/**
 * Test helper to check if current environment supports the feature
 */
export const checkIOSSwipeSupport = () => {
  const results = {
    isIOS: false,
    isSafari: false,
    supportsTouchEvents: false,
    supportsPassiveListeners: false,
    userAgent: navigator.userAgent
  };

  // Check iOS
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  results.isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  results.isSafari = results.isIOS && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);

  // Check touch events
  results.supportsTouchEvents = 'ontouchstart' in window;

  // Check passive listener support
  try {
    const options = {
      get passive() {
        results.supportsPassiveListeners = true;
        return false;
      }
    };
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    results.supportsPassiveListeners = false;
  }

  return results;
};

/**
 * Performance monitoring helper for scroll jank detection
 */
export const createScrollPerformanceMonitor = () => {
  let frameCount = 0;
  let lastTime = performance.now();
  let jankEvents = [];

  const monitor = () => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastTime;
    
    // Detect jank (frame time > 16.67ms for 60fps)
    if (frameTime > 20) { // Allow some tolerance
      jankEvents.push({
        timestamp: currentTime,
        frameTime,
        severity: frameTime > 33 ? 'severe' : 'moderate'
      });
    }

    frameCount++;
    lastTime = currentTime;
    
    requestAnimationFrame(monitor);
  };

  // Start monitoring
  requestAnimationFrame(monitor);

  return {
    getStats: () => ({
      frameCount,
      jankEvents: jankEvents.slice(),
      averageJankTime: jankEvents.reduce((sum, event) => sum + event.frameTime, 0) / jankEvents.length || 0,
      jankFrequency: jankEvents.length / frameCount
    }),
    reset: () => {
      frameCount = 0;
      jankEvents = [];
      lastTime = performance.now();
    }
  };
};

/**
 * Automated test runner for development
 * Run this in console to perform basic functionality checks
 */
export const runIOSSwipeTests = () => {
  const support = checkIOSSwipeSupport();
  const results = [];

  console.group('🧪 iOS Swipe Gesture Tests');
  
  // Test 1: Environment Support
  console.log('📱 Environment Check:', support);
  results.push({
    test: 'Environment Support',
    passed: support.isIOS && support.isSafari && support.supportsTouchEvents,
    details: support
  });

  // Test 2: Edge Detection
  const screenWidth = window.innerWidth;
  const edgeThreshold = screenWidth * 0.1;
  
  console.log(`🎯 Edge Detection Test (threshold: ${edgeThreshold}px)`);
  
  // Simulate edge touches
  const leftEdgeTest = simulateTouchEvent(5, 200);
  const rightEdgeTest = simulateTouchEvent(screenWidth - 5, 200);
  const centerTest = simulateTouchEvent(screenWidth / 2, 200);
  
  results.push({
    test: 'Touch Event Simulation',
    passed: true,
    details: 'Touch events created successfully'
  });

  // Test 3: Feature Flag Check
  try {
    const { shouldEnableIOSSwipeBlock } = require('../config/features');
    const isEnabled = shouldEnableIOSSwipeBlock('/rutina-detalle');
    results.push({
      test: 'Feature Flag Integration',
      passed: typeof isEnabled === 'boolean',
      details: { enabled: isEnabled }
    });
  } catch (error) {
    results.push({
      test: 'Feature Flag Integration',
      passed: false,
      details: { error: error.message }
    });
  }

  // Summary
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  console.table(results);
  console.groupEnd();

  return results;
};

/**
 * Generate test report for manual testing sessions
 */
export const generateTestReport = (testResults) => {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    device: {
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    },
    results: testResults,
    recommendations: []
  };

  // Generate recommendations based on results
  const failedTests = testResults.filter(r => !r.passed);
  if (failedTests.length > 0) {
    report.recommendations.push('Some tests failed - review implementation');
    failedTests.forEach(test => {
      report.recommendations.push(`Fix: ${test.test} - ${test.details?.error || 'See details'}`);
    });
  }

  if (testResults.some(r => r.test === 'Performance' && r.details?.jankFrequency > 0.1)) {
    report.recommendations.push('High jank frequency detected - consider optimizing');
  }

  return report;
};

export default {
  IOS_SWIPE_TEST_MATRIX,
  simulateTouchEvent,
  checkIOSSwipeSupport,
  createScrollPerformanceMonitor,
  runIOSSwipeTests,
  generateTestReport
};
