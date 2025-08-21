import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import theme from '@/lib/theme';

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
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceContainerHigh,
        // The following styles are for web to ensure the header is fixed
        ...Platform.select({
            web: {
                position: 'fixed' as any,
                top: 0,
                left: 0,
                right: 0,
                zIndex: 40,
                // Account for navigation rail on desktop
                '@media (min-width: 768px)': {
                    left: 80,
                },
            },
        }),
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