import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '@/lib/theme';

interface TopAppBarProps {
    title: string;
    leading?: React.ReactNode;
    actions?: React.ReactNode;
}

const TopAppBar: React.FC<TopAppBarProps> = ({ title, leading, actions }) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {leading}
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            <View style={styles.rightSection}>
                {actions}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        paddingHorizontal: theme.spacing.l,
        backgroundColor: theme.colors.background,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
        flex: 1,
        minWidth: 0,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    title: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface,
    },
});

export default TopAppBar;