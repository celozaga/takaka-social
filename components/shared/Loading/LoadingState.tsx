import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <LoadingSpinner size="large" />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  message: {
    marginTop: theme.spacing.m,
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default LoadingState;
