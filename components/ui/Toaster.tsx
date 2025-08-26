import React, { useState, useCallback, useEffect } from 'react';
import { ToastContext, useToast, ToastMessage, ToastProps } from './use-toast';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { theme } from '@/lib/theme';

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toast = useCallback((props: ToastProps) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, title: props.title, description: props.description, variant: props.variant || 'default' }]);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return <ToastContext.Provider value={{ toasts, toast, removeToast }}>{children}</ToastContext.Provider>;
};

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast();
  if (!toasts.length) return null;

  return (
    <View style={styles.toasterContainer}>
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </View>
  );
};

const ToastComponent: React.FC<ToastMessage & { onDismiss: () => void }> = ({ id, title, description, variant, onDismiss }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDismiss());
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss, fadeAnim]);

  const isDestructive = variant === 'destructive';
  const iconName = isDestructive ? "warning-outline" : "checkmark-circle-outline";
  const iconColor = isDestructive ? theme.colors.onErrorContainer : theme.colors.primary;
  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView style={[styles.toast, isDestructive ? styles.toastDestructive : styles.toastDefault, { opacity: fadeAnim }]}>
        <Ionicons name={iconName} color={iconColor} size={24} style={styles.icon} />
        <View style={styles.textContainer}>
            <Text style={[styles.title, isDestructive && styles.textDestructive]}>{title}</Text>
            {description && <Text style={[styles.description, isDestructive && styles.textDestructive]}>{description}</Text>}
        </View>
        <Pressable onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={16} color={isDestructive ? theme.colors.onErrorContainer : theme.colors.onSurfaceVariant} />
        </Pressable>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
    toasterContainer: { position: 'absolute', bottom: theme.spacing.l, left: theme.spacing.l, right: theme.spacing.l, zIndex: 100, gap: theme.spacing.m, alignItems: 'center' },
    toast: { width: '100%', maxWidth: 448, padding: theme.spacing.l, paddingRight: 40, borderRadius: theme.shape.medium, flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.m },
    toastDefault: { backgroundColor: theme.colors.surfaceContainerHigh },
    toastDestructive: { backgroundColor: theme.colors.errorContainer },
    icon: { flexShrink: 0, marginTop: 2 },
    textContainer: { flex: 1 },
    title: { ...theme.typography.labelLarge, color: theme.colors.onSurface },
    description: { ...theme.typography.bodyMedium, marginTop: theme.spacing.xs, color: theme.colors.onSurface, opacity: 0.9 },
    textDestructive: { color: theme.colors.onErrorContainer },
    closeButton: { position: 'absolute', top: '50%', right: theme.spacing.s, transform: [{ translateY: -16 }], padding: theme.spacing.s, borderRadius: theme.shape.full },
});
