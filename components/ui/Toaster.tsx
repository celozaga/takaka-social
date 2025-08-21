import React, { useState, useCallback, useEffect } from 'react';
import { ToastContext, useToast, ToastMessage, ToastProps } from './use-toast';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';

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
  const Icon = isDestructive ? AlertTriangle : CheckCircle;
  const iconColor = isDestructive ? '#F2B8B5' : '#A8C7FA';

  return (
    <Animated.View style={[styles.toast, isDestructive ? styles.toastDestructive : styles.toastDefault, { opacity: fadeAnim }]}>
        <Icon color={iconColor} size={24} style={styles.icon} />
        <View style={styles.textContainer}>
            <Text style={[styles.title, isDestructive && styles.textDestructive]}>{title}</Text>
            {description && <Text style={[styles.description, isDestructive && styles.textDestructive]}>{description}</Text>}
        </View>
        <Pressable onPress={onDismiss} style={styles.closeButton}>
            <X size={16} color={isDestructive ? '#F2B8B5' : '#C3C6CF'} />
        </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    toasterContainer: { position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 100, gap: 12, alignItems: 'center' },
    toast: { width: '100%', maxWidth: 448, padding: 16, paddingRight: 40, borderRadius: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    toastDefault: { backgroundColor: '#2b2d2e' },
    toastDestructive: { backgroundColor: '#601410' },
    icon: { flexShrink: 0, marginTop: 2 },
    textContainer: { flex: 1 },
    title: { fontWeight: '600', color: '#E2E2E6' },
    description: { fontSize: 14, marginTop: 4, color: '#E2E2E6', opacity: 0.9 },
    textDestructive: { color: '#F2B8B5' },
    closeButton: { position: 'absolute', top: '50%', right: 8, transform: [{ translateY: -16 }], padding: 8, borderRadius: 999 },
});