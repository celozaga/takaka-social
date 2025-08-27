/**
 * ============================================================================
 * Toast Component
 * ============================================================================
 *
 * Universal toast notification component with different variants and animations.
 * Lightweight React Native implementation for cross-platform compatibility.
 *
 */

import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  Text, 
  View, 
  Pressable, 
  StyleSheet, 
  Dimensions,
  StyleProp,
  ViewStyle 
} from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top' | 'bottom';

interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Toast position */
  position?: ToastPosition;
  /** Whether toast is visible */
  visible: boolean;
  /** Duration in milliseconds */
  duration?: number;
  /** Whether toast can be dismissed by tap */
  dismissible?: boolean;
  /** Called when toast is dismissed */
  onDismiss: () => void;
  /** Action button config */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  position = 'bottom',
  visible,
  duration = 4000,
  dismissible = true,
  onDismiss,
  action,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      showToast();
      
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (dismissible) {
      hideToast();
    }
  };

  const getToastStyles = () => {
    const styles: ViewStyle = {
      backgroundColor: getBackgroundColor(),
      borderLeftWidth: 4,
      borderLeftColor: getBorderColor(),
    };

    return styles;
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.successContainer;
      case 'error':
        return theme.colors.errorContainer;
      case 'warning':
        return theme.colors.warningContainer;
      case 'info':
        return theme.colors.infoContainer;
      default:
        return theme.colors.surfaceContainer;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.outline;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.onSuccessContainer;
      case 'error':
        return theme.colors.onErrorContainer;
      case 'warning':
        return theme.colors.onWarningContainer;
      case 'info':
        return theme.colors.onInfoContainer;
      default:
        return theme.colors.onSurface;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          [position]: theme.spacing.lg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      testID={testID}
    >
      <Pressable
        onPress={handlePress}
        disabled={!dismissible}
        style={[
          toastStyles.toast,
          getToastStyles(),
          style,
        ]}
      >
        <View style={toastStyles.content}>
          <Text 
            style={[
              toastStyles.message,
              theme.typography.bodyMedium,
              { color: getTextColor() }
            ]}
          >
            {message}
          </Text>
          
          {action && (
            <Pressable
              onPress={action.onPress}
              style={[
                toastStyles.action,
                { marginLeft: theme.spacing.md }
              ]}
            >
              <Text
                style={[
                  theme.typography.labelMedium,
                  { color: getBorderColor(), fontWeight: '600' }
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const { width } = Dimensions.get('window');

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    maxWidth: width - 32,
  },
  toast: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
  },
  action: {
    padding: 4,
  },
});

export default Toast;
