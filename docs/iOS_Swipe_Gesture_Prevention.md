# iOS Swipe Gesture Prevention in PWAs

## Overview

This document describes the implementation of iOS Safari back/forward swipe gesture prevention in our fitness PWA. This feature addresses the conflict between iOS system navigation gestures and PWA interface elements like full-screen workout views, carousels, and side menus.

## ⚠️ Important Disclaimers

**This is a workaround, not an official API.** The implementation exploits WebKit behavior and comes with significant limitations:

- **Unreliable**: May fail intermittently during heavy main thread usage
- **Performance Impact**: Uses non-passive event listeners which can cause scroll jank  
- **Platform Specific**: Only works on iOS Safari, not other browsers
- **Fragile**: Could break with iOS updates without notice
- **Limited Scope**: Does not work inside iframes or embedded content

## Architecture

### Components

1. **`useIOSBackSwipeBlock`** - Core React hook (`src/hooks/useSimpleSwipeBackPrevention.js`)
2. **Feature Flags** - Configuration system (`src/config/features.js`) 
3. **Testing Utils** - Test utilities (`src/utils/iosSwipeTestUtils.js`)
4. **Integration** - Implemented in `RutinaDetalle` component

### How It Works

The solution intercepts `touchstart` events near screen edges (10% threshold by default) and calls `preventDefault()` to cancel the browser's navigation gesture. This requires:

- `{ passive: false }` option on event listeners
- Edge detection logic to avoid interfering with normal touches
- iOS Safari detection to avoid running on other platforms

## Implementation

### Basic Usage

```javascript
import useIOSBackSwipeBlock from '../hooks/useSimpleSwipeBackPrevention';
import { shouldEnableIOSSwipeBlock, getFeatureSettings } from '../config/features';

const MyComponent = () => {
  const location = useLocation();
  const shouldBlock = shouldEnableIOSSwipeBlock(location.pathname);
  const settings = getFeatureSettings('IOS_SWIPE_BLOCK');
  
  const swipeStatus = useIOSBackSwipeBlock({
    enabled: shouldBlock,
    edgeThreshold: settings.edgeThreshold || 0.1,
    debugLog: settings.debugLog || false
  });
  
  // Component renders...
};
```

### Feature Flag Configuration

Edit `src/config/features.js`:

```javascript
const FEATURES = {
  IOS_SWIPE_BLOCK: {
    enabled: true, // Global toggle
    settings: {
      edgeThreshold: 0.1, // 10% of screen width
      debugLog: false, // Enable for debugging
      enabledRoutes: [
        '/rutina-detalle', // Workout detail screen
        // Add more routes as needed
      ]
    }
  }
};
```

### Hook API

The `useIOSBackSwipeBlock` hook accepts these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Whether to activate gesture blocking |
| `edgeThreshold` | number | `0.1` | Edge detection threshold (0.0-1.0) |
| `debugLog` | boolean | `false` | Enable console logging for debugging |

Returns:

```javascript
{
  isActive: boolean,      // Whether blocking is currently active
  stats: {
    blockedCount: number, // Number of gestures blocked
    totalTouches: number  // Total touch events processed
  },
  isIOSDetected: boolean  // Whether iOS Safari was detected
}
```

## Testing

### Manual Testing Matrix

Use the test scenarios in `src/utils/iosSwipeTestUtils.js`:

1. **Basic Edge Swipe Prevention** - Swipes from edges should not navigate
2. **Center Screen Functionality** - Normal touches should work
3. **Performance During Scroll** - Should not cause major jank
4. **Heavy Main Thread Load** - May fail intermittently (expected)
5. **Video Panel Integration** - Test with embedded content
6. **Feature Flag Toggle** - Verify enable/disable works

### Automated Testing

Run in browser console:

```javascript
import { runIOSSwipeTests } from './src/utils/iosSwipeTestUtils';
runIOSSwipeTests();
```

### Performance Monitoring

Monitor scroll performance:

```javascript
import { createScrollPerformanceMonitor } from './src/utils/iosSwipeTestUtils';

const monitor = createScrollPerformanceMonitor();
// ... perform actions
const stats = monitor.getStats();
console.log('Jank events:', stats.jankEvents);
```

## Deployment Strategy

### Phase 1: Limited Rollout ✅ 
- **Scope**: Workout detail screen only (`/rutina-detalle`)
- **Rationale**: Highest impact, contained risk
- **Monitoring**: Performance metrics, user feedback

### Phase 2: Gradual Expansion (Future)
- **Scope**: Dashboard carousels, side menu interactions
- **Prerequisites**: Successful Phase 1, no major issues
- **Process**: Add routes to `enabledRoutes` array

### Phase 3: Full Integration (Future)
- **Scope**: System-wide where beneficial
- **Prerequisites**: Proven reliability across multiple views

## Emergency Rollback

If issues arise:

1. **Immediate**: Set `IOS_SWIPE_BLOCK.enabled = false` in features.js
2. **Route-specific**: Remove problematic routes from `enabledRoutes`
3. **Component-level**: Pass `enabled: false` to hook

No deployment required for rollback via feature flags.

## Debugging

### Enable Debug Logging

```javascript
// In features.js
IOS_SWIPE_BLOCK: {
  settings: {
    debugLog: true // Enable console logging
  }
}
```

### Console Commands

```javascript
// Check environment support
import { checkIOSSwipeSupport } from './src/utils/iosSwipeTestUtils';
checkIOSSwipeSupport();

// Simulate touch events
import { simulateTouchEvent } from './src/utils/iosSwipeTestUtils';
simulateTouchEvent(10, 200); // Near left edge
simulateTouchEvent(window.innerWidth - 10, 200); // Near right edge
```

## UX Considerations

### Always Provide Alternatives

When blocking system navigation gestures, ensure visible alternatives:

✅ **Good**: Back button visible in header  
✅ **Good**: Menu button for side navigation  
✅ **Good**: Clear navigation breadcrumbs  

❌ **Bad**: Only gesture-based navigation  
❌ **Bad**: Hidden or unclear navigation options

### Accessibility

- Gesture blocking must not interfere with screen readers
- All functionality must be accessible via visible controls
- Test with VoiceOver and other assistive technologies

## Monitoring & Metrics

### Key Metrics to Track

1. **Navigation Success Rate**: User ability to navigate as intended
2. **Accidental Navigation Events**: Reduced incidents of unwanted back navigation
3. **Performance Impact**: Scroll jank frequency and severity
4. **User Complaints**: Feedback about navigation issues

### Performance Budgets

- **Scroll Jank**: < 5% of frames over 20ms
- **Edge Detection Accuracy**: > 95% correct classification
- **Feature Reliability**: > 80% success rate in blocking gestures

## Known Issues & Limitations

### Technical Limitations

- **Unreliable during high CPU usage**: May fail when main thread is busy
- **No iframe support**: Embedded content (videos, ads) not protected
- **Performance overhead**: Non-passive listeners impact scroll performance
- **Platform fragility**: Could break with iOS updates

### Specific Scenarios

1. **Video Panel**: Gestures may work inside video iframes
2. **Heavy Animations**: Lower reliability during complex transitions
3. **System Lag**: May fail during device performance issues

### Mitigation Strategies

- **Conservative edge threshold**: 10% to minimize false positives
- **Route-based activation**: Only enable where truly necessary
- **Feature flag system**: Quick disable capability
- **User education**: Clear visual cues for navigation alternatives

## Future Improvements

### Standards Track
- Monitor W3C Web App Manifest proposals for official swipe control
- Watch for CSS `overscroll-behavior` support in Safari
- Consider View Transitions API extensions

### Implementation Enhancements
- Dynamic edge threshold based on device characteristics
- Machine learning to improve gesture detection accuracy
- Better integration with React Router navigation

## Support & Troubleshooting

### Common Issues

**Issue**: Feature not working on iOS  
**Solution**: Check iOS version (requires 13.4+), verify Safari browser

**Issue**: Scroll performance degraded  
**Solution**: Check edge threshold setting, monitor jank frequency

**Issue**: Still getting navigation gestures  
**Solution**: Enable debug logging, check for main thread blocking

### Getting Help

1. Check browser console for debug logs
2. Run automated test suite in console
3. Review test matrix for manual validation
4. Check feature flag configuration

---

**Last Updated**: January 2024  
**Next Review**: After iOS 17.2 release
