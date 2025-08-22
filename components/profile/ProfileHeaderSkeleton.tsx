import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

const ProfileHeaderSkeleton: React.FC = () => (
    <View style={styles.headerContainer}>
        <View style={styles.banner} />
        <View style={styles.profileInfoContainer}>
            <View style={styles.avatarActionRow}>
                <View style={styles.avatar} />
                <View style={styles.actionButton} />
            </View>
            <View style={styles.detailsContainer}>
                <View style={[styles.line, { width: '50%', height: 28 }]} />
                <View style={[styles.line, { width: '30%' }]} />
                <View style={[styles.line, { width: '90%', marginTop: theme.spacing.s }]} />
                <View style={[styles.line, { width: '70%' }]} />
                <View style={styles.statsContainer}>
                    <View style={[styles.line, { width: '25%' }]} />
                    <View style={[styles.line, { width: '25%' }]} />
                </View>
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    headerContainer: { backgroundColor: theme.colors.background },
    banner: { width: '100%', height: 150, backgroundColor: theme.colors.surfaceContainerHigh },
    profileInfoContainer: { paddingHorizontal: theme.spacing.l, paddingBottom: theme.spacing.l },
    avatarActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -48, marginBottom: theme.spacing.m },
    avatar: { width: 96, height: 96, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh, borderWidth: 4, borderColor: theme.colors.background },
    actionButton: { paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.l, borderRadius: theme.shape.medium, minWidth: 120, height: 40, backgroundColor: theme.colors.surfaceContainerHigh },
    detailsContainer: { gap: theme.spacing.s },
    line: {
        height: 16,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
        marginBottom: theme.spacing.xs,
    },
    statsContainer: { flexDirection: 'row', gap: theme.spacing.l, marginTop: theme.spacing.s },
});

export default ProfileHeaderSkeleton;
