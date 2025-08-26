import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/components/shared';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  style
}) => {
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  return (
    <View style={[styles.container, style]}>
      <LoadingSpinner size="large" />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  message: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.bodyMedium.fontSize,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default LoadingState;
