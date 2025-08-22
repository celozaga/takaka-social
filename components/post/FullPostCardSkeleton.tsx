import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

const FullPostCardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Context line placeholder */}
      <View style={styles.contextLine} />
      
      {/* Media placeholder */}
      <View style={styles.mediaPlaceholder} />

      {/* Text lines placeholder */}
      <View style={[styles.line, { width: '90%', marginTop: theme.spacing.m }]} />
      <View style={[styles.line, { width: '60%' }]} />
      
      {/* Timestamp placeholder */}
      <View style={[styles.line, { width: '20%', marginTop: theme.spacing.s }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No specific styles needed for container, it just holds the elements
  },
  contextLine: {
    height: 16,
    width: '50%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
    marginBottom: theme.spacing.s,
  },
  mediaPlaceholder: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: theme.shape.medium,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  line: {
    height: 16,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
    marginBottom: theme.spacing.xs,
  },
});

export default FullPostCardSkeleton;
