/**
 * ============================================================================
 * Toaster Component
 * ============================================================================
 *
 * Universal toast system component with animations and theme support.
 * Provides ToastProvider for managing toast state.
 *
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../Theme';
import { ToastContext, useToast, ToastMessage, ToastProps } from './useToast';

// ============================================================================
// Provider Component
// ============================================================================

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const toast = useCallback((props: ToastProps) => {
    const id = toastId++;
    const newToast: ToastMessage = {
      id,
      title: props.title,
      description: props.description,
      variant: props.variant || 'default',
      duration: props.duration || 5000,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// ============================================================================
// Toaster Component
// ============================================================================

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  if (!toasts.length) return null;

  return (
    <View style={styles.toasterContainer}>
      {toasts.map((toast) => (
        <ToastComponent 
          key={toast.id} 
          {...toast} 
          onDismiss={() => removeToast(toast.id)} 
        />
      ))}
    </View>
  );
};

// ============================================================================
// Individual Toast Component
// ============================================================================

const ToastComponent: React.FC<ToastMessage & { onDismiss: () => void }> = ({ 
  id, 
  title, 
  description, 
  variant, 
  duration,
  onDismiss 
}) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 300, 
      useNativeDriver: true 
    }).start();

    // Auto dismiss timer
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { 
        toValue: 0, 
        duration: 300, 
        useNativeDriver: true 
      }).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onDismiss, fadeAnim, duration]);

  // Get variant-specific styling
  const getVariantIcon = () => {
    switch (variant) {
      case 'success': return 'checkmark-circle-outline';
      case 'error':
      case 'destructive': return 'close-circle-outline';
      case 'warning': return 'warning-outline';
      case 'info': return 'information-circle-outline';
      default: return 'checkmark-circle-outline';
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'success': return theme.colors.success;
      case 'error':
      case 'destructive': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.primary;
    }
  };

  const getVariantBackgroundColor = () => {
    switch (variant) {
      case 'success': return theme.colors.successContainer || theme.colors.surfaceContainer;
      case 'error':
      case 'destructive': return theme.colors.errorContainer || theme.colors.surfaceContainer;
      case 'warning': return theme.colors.warningContainer || theme.colors.surfaceContainer;
      case 'info': return theme.colors.infoContainer || theme.colors.surfaceContainer;
      default: return theme.colors.surfaceContainer;
    }
  };

  const iconName = getVariantIcon();
  const iconColor = getVariantColor();
  const backgroundColor = getVariantBackgroundColor();

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView 
      style={[
        createStyles(theme).toast,
        { backgroundColor, opacity: fadeAnim }
      ]}
    >
      <Ionicons 
        name={iconName} 
        color={iconColor} 
        size={24} 
        style={createStyles(theme).icon} 
      />
      <View style={createStyles(theme).content}>
        <Text style={createStyles(theme).title}>{title}</Text>
        {description && (
          <Text style={createStyles(theme).description}>{description}</Text>
        )}
      </View>
      <Pressable onPress={onDismiss} style={createStyles(theme).closeButton}>
        <Ionicons 
          name="close" 
          size={18} 
          color={theme.colors.onSurfaceVariant} 
        />
      </Pressable>
    </AnimatedView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  toasterContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
});

const createStyles = (theme: any) => StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.md,
    ...theme.shadows.sm,
    elevation: 6,
  },
  icon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  description: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
    marginTop: -theme.spacing.xs,
  },
});

export default Toaster;
