import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

const NotificationItemSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={{ flexShrink: 0, width: 32, alignItems: 'center' }}>
        <View style={styles.avatar} />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.s }}>
        <View style={[styles.line, { width: '70%', height: 16 }]} />
        <View style={styles.previewContainer}>
            <View style={styles.previewContent}>
                <View style={styles.previewImage} />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                    <View style={[styles.line, { width: '90%' }]} />
                    <View style={[styles.line, { width: '60%' }]} />
                </View>
            </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 16,
        backgroundColor: theme.colors.background,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    line: {
        height: 12,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
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
