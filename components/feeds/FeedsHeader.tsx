

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

const FeedsHeader: React.FC = () => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Pressable onPress={() => router.back()} style={styles.button}>
                    <ArrowLeft size={20} color={theme.colors.onSurface} />
                </Pressable>
                <Text style={styles.title}>Feeds</Text>
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
        gap: 16,
        height: 64,
    },
    button: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 999,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
});

export default FeedsHeader;
