import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared';
import SkeletonLine from './SkeletonLine';
import SkeletonAvatar from './SkeletonAvatar';

const PostCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  mediaPlaceholder: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    height: 250,
  },
  contentPlaceholder: {
    padding: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
});

export default PostCardSkeleton;
