
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
            <View style={styles.sideContainer}>
                {leading}
            </View>
            <View style={styles.titleContainer}>
                 <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            <View style={[styles.sideContainer, styles.actionsContainer]}>
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
    sideContainer: {
        minWidth: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionsContainer: {
        justifyContent: 'flex-end',
        gap: theme.spacing.s,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.s,
    },
    title: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface,
        textAlign: 'center',
    },
});

export default TopAppBar;