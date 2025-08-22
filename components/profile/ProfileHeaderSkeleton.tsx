
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

const ProfileHeaderSkeleton: React.FC = () => (
    <View style={styles.container}>
        <View style={styles.statsRow}>
            <View style={styles.avatar} />
            <View style={styles.stats}>
                <View style={styles.statItem} />
                <View style={styles.statItem} />
                <View style={styles.statItem} />
            </View>
        </View>
        <View style={styles.lineLg} />
        <View style={styles.lineSm} />
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
    avatar: {
        width: 80,
        height: 80,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
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
    lineLg: {
        height: 20,
        width: '60%',
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
    },
    lineSm: {
        height: 16,
        width: '80%',
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