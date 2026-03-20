'use client';

/**
 * Custom hook for tracking user activity with throttling.
 * Throttles updates to prevent excessive localStorage writes.
 * 
 * @module hooks/useActivityTracker
 */

import { useEffect, useCallback, useRef } from 'react';
import { updateLastActivity } from '@/lib/security';

/**
 * Configuration options for the activity tracker.
 */
interface ActivityTrackerOptions {
  /** Throttle interval in milliseconds (default: 5000) */
  throttleMs?: number;
  /** Whether to track mouse movements (default: true) */
  trackMouse?: boolean;
  /** Whether to track keyboard input (default: true) */
  trackKeyboard?: boolean;
  /** Whether to track touch events (default: true) */
  trackTouch?: boolean;
  /** Whether the tracker is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook that tracks user activity and updates the last activity timestamp.
 * Uses throttling to prevent excessive updates.
 * 
 * @param options - Configuration options
 * @returns Object with reset function
 * 
 * @example
 * ```tsx
 * function App() {
 *   useActivityTracker({ throttleMs: 5000 });
 *   return <div>...</div>;
 * }
 * ```
 */
export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const {
    throttleMs = 5000,
    trackMouse = true,
    trackKeyboard = true,
    trackTouch = true,
    enabled = true,
  } = options;

  const lastUpdateRef = useRef<number>(0);

  /**
   * Throttled function to update last activity.
   * Only updates if the throttle interval has passed.
   */
  const handleActivity = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastUpdateRef.current >= throttleMs) {
      lastUpdateRef.current = now;
      updateLastActivity();
    }
  }, [throttleMs, enabled]);

  /**
   * Force an immediate activity update, bypassing the throttle.
   */
  const forceUpdate = useCallback(() => {
    if (!enabled) return;
    lastUpdateRef.current = Date.now();
    updateLastActivity();
  }, [enabled]);

  /**
   * Reset the throttle timer.
   */
  const reset = useCallback(() => {
    lastUpdateRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial activity update
    handleActivity();

    // Set up event listeners based on options
    const events: Array<{ event: string; handler: () => void }> = [];

    if (trackMouse) {
      events.push({ event: 'mousemove', handler: handleActivity });
      events.push({ event: 'mousedown', handler: handleActivity });
      events.push({ event: 'scroll', handler: handleActivity });
    }

    if (trackKeyboard) {
      events.push({ event: 'keydown', handler: handleActivity });
    }

    if (trackTouch) {
      events.push({ event: 'touchstart', handler: handleActivity });
      events.push({ event: 'touchmove', handler: handleActivity });
    }

    // Add event listeners
    events.forEach(({ event, handler }) => {
      window.addEventListener(event, handler, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [enabled, trackMouse, trackKeyboard, trackTouch, handleActivity]);

  return { reset, forceUpdate };
}

export default useActivityTracker;
