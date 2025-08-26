import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import SkeletonLine from './SkeletonLine';
import SkeletonAvatar from './SkeletonAvatar';

const ProfileHeaderSkeleton: React.FC = () => (
    <View style={styles.container}>
        <View style={styles.statsRow}>
            <SkeletonAvatar size={80} />
            <View style={styles.stats}>
                <View style={styles.statItem} />
                <View style={styles.statItem} />
                <View style={styles.statItem} />
            </View>
        </View>
        <SkeletonLine width="60%" height={20} />
        <SkeletonLine width="80%" height={16} />
        <View style={styles.button} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.l,
        gap: theme.spacing.m,
        backgroundColor: theme.colors.background,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xl,
        marginBottom: theme.spacing.s,
    },
    stats: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        height: 40,
        width: 60,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
    },
    button: {
        height: 44,
        width: '100%',
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.medium,
        marginTop: theme.spacing.s,
    },
});

export default ProfileHeaderSkeleton;
