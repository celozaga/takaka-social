import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

const FullPostCardSkeleton = () => {
  return (
    <View style={styles.mainRow}>
      <View style={styles.avatar} />
      <View style={styles.postContent}>
        <View style={styles.authorInfo}>
          <View style={[styles.line, { width: '40%' }]} />
          <View style={[styles.line, { width: '20%' }]} />
        </View>
        <View style={[styles.line, { width: '90%', marginTop: theme.spacing.s }]} />
        <View style={[styles.line, { width: '60%' }]} />
        <View style={styles.mediaPlaceholder} />
        <View style={styles.actionsContainer}>
          <View style={styles.actionItem} />
          <View style={styles.actionItem} />
          <View style={styles.actionItem} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  postContent: {
    flex: 1,
    minWidth: 0,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    height: 24,
  },
  mediaPlaceholder: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: theme.shape.medium,
    backgroundColor: theme.colors.surfaceContainerHigh,
    marginTop: theme.spacing.m,
  },
  actionsContainer: {
    marginTop: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.l,
  },
  actionItem: {
    height: 20,
    width: 40,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
  },
  line: {
    height: 16,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
    marginBottom: theme.spacing.xs,
  },
});

export default FullPostCardSkeleton;
