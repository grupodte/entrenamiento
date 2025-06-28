import { useState, useRef, useEffect, useCallback } from 'react';
import {
    PULL_THRESHOLD,
    MIN_PULL_DISTANCE,
    SCROLL_TOP_TOLERANCE,
    PULL_INDICATOR_MAX_HEIGHT_ADDITION,
    PULL_DISTANCE_DAMPENING_FACTOR
} from '../utils/constants';

export const usePullToRefresh = (onRefresh, isDragging = false) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollRef = useRef(null); // Ref for the scrollable element
    const isMounted = useRef(true);

    // Gesture state
    const gesture = useRef({
        startX: 0,
        startY: 0,
        active: false,   // Is a touch gesture currently active?
        canPull: false,  // Is the gesture eligible for pull-to-refresh?
        pullStarted: false, // Has the MIN_PULL_DISTANCE been met?
    });

    const resetPullVisuals = () => {
        // Smoothly animate pullDistance back to 0
        const start = pullDistance;
        const duration = 200; // ms
        const startTime = performance.now();

        const animate = (now) => {
            if (!isMounted.current) return;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setPullDistance(start * (1 - progress));
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setPullDistance(0); // Ensure it ends at 0
            }
        };
        requestAnimationFrame(animate);
    };

    const cancelGesture = useCallback(() => {
        gesture.current.active = false;
        gesture.current.canPull = false;
        gesture.current.pullStarted = false;
        if (pullDistance > 0) {
            resetPullVisuals();
        }
    }, [pullDistance]);

    const handleTouchStart = useCallback((e) => {
        if (isDragging) { // Do not initiate pull if an external drag is active
            cancelGesture();
            return;
        }

        const el = scrollRef.current;
        const scrollTop = el ? el.scrollTop : window.scrollY;


        // Only allow pull if near the top of the scrollable content
        if (scrollTop > SCROLL_TOP_TOLERANCE) {
            gesture.current.canPull = false;
            gesture.current.active = false;
            return;
        }

        gesture.current.startX = e.touches[0].clientX;
        gesture.current.startY = e.touches[0].clientY;
        gesture.current.active = true;
        gesture.current.canPull = true; // Eligible to pull if conditions met in touchmove
        gesture.current.pullStarted = false;
        // Reset pull distance only if not refreshing, to allow seeing the spinner
        if (!isRefreshing) {
            setPullDistance(0);
        }
    }, [isDragging, cancelGesture, isRefreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!gesture.current.active || !gesture.current.canPull) {
            return;
        }

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - gesture.current.startX;
        const deltaY = currentY - gesture.current.startY;

        // If horizontal movement is more significant, it's likely a swipe, not a pull
        if (Math.abs(deltaX) > Math.abs(deltaY) && !gesture.current.pullStarted) {
            cancelGesture();
            return;
        }

        const el = scrollRef.current;
        const scrollTop = el ? el.scrollTop : window.scrollY;

        // If user scrolls down while attempting to pull, cancel
        if (scrollTop > SCROLL_TOP_TOLERANCE && !gesture.current.pullStarted) {
            cancelGesture();
            return;
        }


        if (deltaY > 0) { // Pulling down
            if (deltaY < MIN_PULL_DISTANCE && !gesture.current.pullStarted) {
                // Not pulled enough to start, do nothing with pullDistance yet
                return;
            }

            // Prevent default scroll behavior only when pull is active and downward
            e.preventDefault();
            gesture.current.pullStarted = true; // Mark that pull has started

            // Dampen the pull distance for a nicer effect
            const dampenedDeltaY = (deltaY - MIN_PULL_DISTANCE) * PULL_DISTANCE_DAMPENING_FACTOR; // Start counting after min distance
            const newPullDistance = Math.min(dampenedDeltaY, PULL_THRESHOLD + PULL_INDICATOR_MAX_HEIGHT_ADDITION); // Cap at max
            setPullDistance(newPullDistance);

        } else if (deltaY < 0 && !gesture.current.pullStarted) {
            // If pulling up before MIN_PULL_DISTANCE is met, cancel.
            cancelGesture();
        }
    }, [cancelGesture]);


    const handleTouchEnd = useCallback(async () => {
        if (!gesture.current.active || !gesture.current.canPull || !gesture.current.pullStarted) {
            if (gesture.current.active) { // Ensure reset if gesture was active but didn't qualify
                cancelGesture();
            }
            return;
        }

        // Adjust threshold comparison due to dampenedDeltaY starting after MIN_PULL_DISTANCE
        // and using PULL_DISTANCE_DAMPENING_FACTOR
        const effectivePullThreshold = PULL_THRESHOLD - (MIN_PULL_DISTANCE * PULL_DISTANCE_DAMPENING_FACTOR);

        if (pullDistance > effectivePullThreshold) {
            if (isMounted.current) setIsRefreshing(true);
            try {
                await onRefresh?.();
            } catch (error) {
                console.error("Pull to refresh failed:", error);
                // Optionally handle error display to user
            } finally {
                if (isMounted.current) setIsRefreshing(false);
            }
        }

        // Always reset gesture and visual pull state after touch ends
        cancelGesture();

    }, [pullDistance, onRefresh, cancelGesture]);

    useEffect(() => {
        const el = scrollRef.current || window; // Default to window if no ref

        // We need to reference the element for removal if scrollRef changes.
        const currentElement = el;

        currentElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        currentElement.addEventListener('touchmove', handleTouchMove, { passive: false }); // passive: false for e.preventDefault()
        currentElement.addEventListener('touchend', handleTouchEnd);
        currentElement.addEventListener('touchcancel', cancelGesture); // Handle interruption

        return () => {
            currentElement.removeEventListener('touchstart', handleTouchStart);
            currentElement.removeEventListener('touchmove', handleTouchMove);
            currentElement.removeEventListener('touchend', handleTouchEnd);
            currentElement.removeEventListener('touchcancel', cancelGesture);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, cancelGesture, scrollRef]); // scrollRef added to dependencies

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        scrollRef, // The component using this hook should assign its scrollable element's ref here
        isRefreshing,
        pullDistance,
    };
};
