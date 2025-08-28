/**
 * ============================================================================
 * Tooltip Component
 * ============================================================================
 *
 * Universal tooltip component for displaying contextual help messages.
 * Provides consistent styling and behavior across all platforms.
 *
 * Features:
 * - Automatic positioning (top, bottom, left, right)
 * - Customizable content and styling
 * - Accessibility support
 * - Touch and hover interactions
 * - Theme integration
 *
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../Theme';
import { TooltipContentKey, useTooltipContent, getTooltipContentByKey } from './TooltipContent';

// ============================================================================
// Types
// ============================================================================

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TooltipProps {
  /** Content to display in the tooltip (use this OR contentKey) */
  content?: string;
  /** Predefined content key for centralized tooltip management */
  contentKey?: TooltipContentKey;
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  /** Element that triggers the tooltip */
  children: React.ReactNode;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Custom style for the tooltip container */
  tooltipStyle?: any;
  /** Custom style for the tooltip text */
  textStyle?: any;
  /** Test ID for testing */
  testID?: string;
  /** Delay before showing tooltip (ms) */
  showDelay?: number;
  /** Delay before hiding tooltip (ms) */
  hideDelay?: number;
  /** Maximum width of the tooltip */
  maxWidth?: number;
}

// ============================================================================
// Component
// ============================================================================

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  contentKey,
  position = 'auto',
  children,
  disabled = false,
  tooltipStyle,
  textStyle,
  testID,
  showDelay = 500,
  hideDelay = 0,
  maxWidth = 250,
}) => {
  const { theme } = useTheme();
  const { getTooltipContent } = useTooltipContent();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>('top');
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const triggerRef = useRef<View>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the actual tooltip content
  const tooltipContent = contentKey ? getTooltipContent(contentKey) : content || '';
  
  // Early return if no content is provided
  if (!tooltipContent) {
    console.warn('Tooltip: No content or contentKey provided');
    return <>{children}</>;
  }

  const styles = createStyles(theme, maxWidth, screenDimensions);

  // Listen to screen dimension changes for responsive behavior
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Clear timeouts
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

  // Get responsive tooltip dimensions
  const getTooltipDimensions = useCallback(() => {
    const { width: screenWidth } = screenDimensions;
    const isDesktop = screenWidth >= 768;
    const isMobile = screenWidth < 480;
    
    // Responsive max width based on screen size
    let responsiveMaxWidth = maxWidth;
    if (isDesktop) {
      responsiveMaxWidth = Math.min(maxWidth, screenWidth * 0.25); // Max 25% of screen width on desktop
    } else if (isMobile) {
      responsiveMaxWidth = Math.min(maxWidth, screenWidth * 0.8); // Max 80% of screen width on mobile
    } else {
      responsiveMaxWidth = Math.min(maxWidth, screenWidth * 0.6); // Max 60% of screen width on tablet
    }
    
    // Calculate tooltip dimensions
     const estimatedTextWidth = tooltipContent.length * (isDesktop ? 7 : 8);
     const tooltipWidth = Math.min(responsiveMaxWidth, Math.max(120, estimatedTextWidth));
     const tooltipHeight = isDesktop ? 36 : 40; // Slightly smaller on desktop
     
     return { width: tooltipWidth, height: tooltipHeight };
   }, [maxWidth, tooltipContent, screenDimensions]);

  // Calculate optimal position
  const calculatePosition = useCallback((layout: typeof triggerLayout): TooltipPosition => {
    if (position !== 'auto') return position;

    const { width: screenWidth, height: screenHeight } = screenDimensions;
    const { width: tooltipWidth, height: tooltipHeight } = getTooltipDimensions();
    const margin = screenWidth >= 768 ? 16 : 10; // Larger margin on desktop

    // Check if there's space above
    if (layout.y > tooltipHeight + margin) {
      return 'top';
    }
    
    // Check if there's space below
    if (layout.y + layout.height + tooltipHeight + margin < screenHeight) {
      return 'bottom';
    }
    
    // Check if there's space to the right
    if (layout.x + layout.width + tooltipWidth + margin < screenWidth) {
      return 'right';
    }
    
    // Check if there's space to the left
    if (layout.x > tooltipWidth + margin) {
      return 'left';
    }
    
    // Default to top if no optimal position found
    return 'top';
  }, [position, getTooltipDimensions, screenDimensions]);

  // Show tooltip
  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    clearTimeouts();
    
    showTimeoutRef.current = setTimeout(() => {
      triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const layout = { x: pageX, y: pageY, width, height };
        setTriggerLayout(layout);
        setTooltipPosition(calculatePosition(layout));
        setIsVisible(true);
      });
    }, showDelay);
  }, [disabled, clearTimeouts, showDelay, calculatePosition]);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    clearTimeouts();
    
    if (hideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    } else {
      setIsVisible(false);
    }
  }, [clearTimeouts, hideDelay]);

  // Calculate tooltip position styles
  const getTooltipPositionStyle = useCallback(() => {
    const { width: screenWidth, height: screenHeight } = screenDimensions;
    const { width: tooltipWidth, height: tooltipHeight } = getTooltipDimensions();
    const arrowSize = screenWidth >= 768 ? 8 : 6; // Larger arrow on desktop
    const margin = screenWidth >= 768 ? 16 : 10;
    
    let top = 0;
    let left = 0;
    
    switch (tooltipPosition) {
      case 'top':
        top = triggerLayout.y - tooltipHeight - arrowSize;
        left = triggerLayout.x + (triggerLayout.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = triggerLayout.y + triggerLayout.height + arrowSize;
        left = triggerLayout.x + (triggerLayout.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = triggerLayout.y + (triggerLayout.height / 2) - (tooltipHeight / 2);
        left = triggerLayout.x - tooltipWidth - arrowSize;
        break;
      case 'right':
        top = triggerLayout.y + (triggerLayout.height / 2) - (tooltipHeight / 2);
        left = triggerLayout.x + triggerLayout.width + arrowSize;
        break;
    }
    
    // Ensure tooltip stays within screen bounds with responsive margins
    left = Math.max(margin, Math.min(left, screenWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, screenHeight - tooltipHeight - margin));
    
    return {
      position: 'absolute' as const,
      top,
      left,
      width: tooltipWidth,
      minHeight: tooltipHeight,
    };
  }, [tooltipPosition, triggerLayout, getTooltipDimensions, screenDimensions]);

  // Render tooltip content
  const renderTooltip = () => {
    if (!isVisible) return null;

    const isDesktop = screenDimensions.width >= 768;
    const maxLines = isDesktop ? 2 : 3; // Fewer lines on desktop for better UX

    const tooltipElement = (
       <View style={[styles.tooltip, getTooltipPositionStyle(), tooltipStyle]}>
         <Text style={[styles.tooltipText, textStyle]} numberOfLines={maxLines}>
           {tooltipContent}
         </Text>
       </View>
     );

    if (Platform.OS === 'web') {
      // On web, use a positioned container instead of full-screen overlay
       return (
         <View style={styles.webOverlay} pointerEvents="none">
           {tooltipElement}
         </View>
       );
    }

    return (
      <Modal
        transparent
        visible={isVisible}
        animationType="fade"
        onRequestClose={hideTooltip}
      >
        <TouchableWithoutFeedback onPress={hideTooltip}>
         <View style={styles.mobileOverlay}>
           {tooltipElement}
         </View>
       </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPressIn={Platform.OS !== 'web' ? showTooltip : undefined}
        onPressOut={Platform.OS !== 'web' ? hideTooltip : undefined}
        onHoverIn={Platform.OS === 'web' ? showTooltip : undefined}
        onHoverOut={Platform.OS === 'web' ? hideTooltip : undefined}
        testID={testID}
        accessible
        accessibilityRole="button"
        accessibilityHint={tooltipContent}
      >
        {children}
      </Pressable>
      {renderTooltip()}
    </>
  );
};

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: any, maxWidth: number, screenDimensions: { width: number; height: number }) => {
  const isDesktop = screenDimensions.width >= 768;
  const isMobile = screenDimensions.width < 480;
  
  return StyleSheet.create({
    // Web overlay - positioned relative to viewport, not full screen
    webOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: screenDimensions.width,
      height: screenDimensions.height,
      zIndex: 9999,
      pointerEvents: 'none',
    },
    // Mobile overlay - full screen for modal behavior
    mobileOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      pointerEvents: 'auto',
    },
    tooltip: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: isDesktop ? theme.radius.lg : theme.radius.md,
      paddingHorizontal: isDesktop ? theme.spacing.lg : theme.spacing.md,
      paddingVertical: isDesktop ? theme.spacing.md : theme.spacing.sm,
      maxWidth,
      minWidth: isDesktop ? 120 : 100,
      shadowColor: theme.colors.onSurface,
      shadowOffset: {
        width: 0,
        height: isDesktop ? 4 : 2,
      },
      shadowOpacity: isDesktop ? 0.15 : 0.25,
      shadowRadius: isDesktop ? 8 : 4,
      elevation: isDesktop ? 8 : 5,
      borderWidth: isDesktop ? 0 : 1,
      borderColor: theme.colors.outline,
      // Responsive sizing
      ...(isMobile && {
        marginHorizontal: theme.spacing.sm,
      }),
    },
    tooltipText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurface,
      textAlign: 'center',
      fontSize: isDesktop ? 13 : theme.typography.bodySmall.fontSize,
      lineHeight: isDesktop ? 18 : theme.typography.bodySmall.lineHeight,
      fontWeight: isDesktop ? '500' : theme.typography.bodySmall.fontWeight,
    },
  });
};

export default Tooltip;