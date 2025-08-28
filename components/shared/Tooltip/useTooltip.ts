/**
 * ============================================================================
 * useTooltip Hook
 * ============================================================================
 *
 * Custom hook for managing tooltip state and behavior.
 * Provides a centralized way to handle tooltip interactions.
 *
 */

import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

export interface UseTooltipOptions {
  /** Delay before showing tooltip (ms) */
  showDelay?: number;
  /** Delay before hiding tooltip (ms) */
  hideDelay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

export interface UseTooltipReturn {
  /** Whether the tooltip is currently visible */
  isVisible: boolean;
  /** Show the tooltip */
  show: () => void;
  /** Hide the tooltip */
  hide: () => void;
  /** Toggle tooltip visibility */
  toggle: () => void;
  /** Props to spread on the trigger element */
  triggerProps: {
    onPressIn?: () => void;
    onPressOut?: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
  };
}

/**
 * Hook for managing tooltip state and interactions
 */
export const useTooltip = ({
  showDelay = 500,
  hideDelay = 0,
  disabled = false,
}: UseTooltipOptions = {}): UseTooltipReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Show tooltip
  const show = useCallback(() => {
    if (disabled) return;
    
    clearTimeouts();
    
    if (showDelay > 0) {
      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);
    } else {
      setIsVisible(true);
    }
  }, [disabled, clearTimeouts, showDelay]);

  // Hide tooltip
  const hide = useCallback(() => {
    clearTimeouts();
    
    if (hideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    } else {
      setIsVisible(false);
    }
  }, [clearTimeouts, hideDelay]);

  // Toggle tooltip
  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  // Platform-specific trigger props
  const triggerProps = {
    ...(Platform.OS !== 'web' && {
      onPressIn: show,
      onPressOut: hide,
    }),
    ...(Platform.OS === 'web' && {
      onHoverIn: show,
      onHoverOut: hide,
    }),
  };

  return {
    isVisible,
    show,
    hide,
    toggle,
    triggerProps,
  };
};

export default useTooltip;