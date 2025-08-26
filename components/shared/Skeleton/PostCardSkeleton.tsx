import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import SkeletonLine from './SkeletonLine';
import SkeletonAvatar from './SkeletonAvatar';

const PostCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Media placeholder */}
      <View style={styles.mediaPlaceholder} />
      
      {/* Content placeholder */}
      <View style={styles.contentPlaceholder}>
        <SkeletonLine width="83.3333%" height={16} />
        <View style={styles.footer}>
          <View style={styles.authorInfo}>
            <SkeletonAvatar size={28} />
            <SkeletonLine width={96} height={16} />
          </View>
          <SkeletonLine width={80} height={20} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.shape.large,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  mediaPlaceholder: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    height: 250,
  },
  contentPlaceholder: {
    padding: theme.spacing.m,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
});

export default PostCardSkeleton;
