import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import SkeletonLine from './SkeletonLine';
import SkeletonAvatar from './SkeletonAvatar';

const NotificationItemSkeleton = () => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <View style={{ flexShrink: 0, width: 32, alignItems: 'center' }}>
        <SkeletonAvatar size={32} />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.s }}>
        <SkeletonLine width="70%" height={16} />
        <View style={styles.previewContainer}>
            <View style={styles.previewContent}>
                <View style={styles.previewImage} />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                    <SkeletonLine width="90%" />
                    <SkeletonLine width="60%" />
                </View>
            </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 16,
        backgroundColor: theme.colors.background,
    },
    previewContainer: {
        borderRadius: 8,
        padding: 8,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    previewContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    previewImage: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: theme.colors.surfaceContainerHighest,
    },
});

export default NotificationItemSkeleton;
