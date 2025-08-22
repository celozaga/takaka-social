

import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { theme } from '@/lib/theme';

const NotificationsHeader: React.FC = () => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.leftContainer}>
                    <Pressable onPress={() => router.back()} style={styles.button}>
                        <ArrowLeft size={20} color={theme.colors.onSurface} />
                    </Pressable>
                    <Text style={styles.title}>Notifications</Text>
                </View>
                <Link href="/settings/notifications" asChild>
                    <Pressable style={styles.button} aria-label="Settings">
                        <Settings size={20} color={theme.colors.onSurface} />
                    </Pressable>
                </Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.background,
        zIndex: 30,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    button: {
        padding: 8,
        marginHorizontal: -8,
        borderRadius: 999,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
});

export default NotificationsHeader;
