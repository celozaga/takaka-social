import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ icon: Icon, title, message, onRetry, retryText }) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Icon size={48} color={theme.colors.onSurfaceVariant} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttonContainer}>
        {onRetry && (
          <Pressable onPress={onRetry} style={[styles.button, styles.retryButton]}>
            <Text style={[styles.buttonText, styles.retryButtonText]}>{retryText || t('common.tryAgain')}</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.replace('/home')} style={[styles.button, styles.homeButton]}>
          <Home size={16} color={theme.colors.onPrimary} />
          <Text style={[styles.buttonText, styles.homeButtonText]}>{t('errors.goToHome')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  icon: {
    marginBottom: theme.spacing.l,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  message: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    maxWidth: 300,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.shape.full,
    gap: theme.spacing.s,
  },
  buttonText: {
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  retryButtonText: {
    color: theme.colors.onSurface,
  },
  homeButton: {
    backgroundColor: theme.colors.primary,
  },
  homeButtonText: {
    color: theme.colors.onPrimary,
  },
});

export default ErrorState;
