
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const SearchHeader: React.FC = () => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Pressable onPress={() => router.back()} style={styles.button}>
                    <ArrowLeft size={20} color="#E2E2E6" />
                </Pressable>
                <Text style={styles.title}>Search</Text>
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
        backgroundColor: '#111314', // surface-1
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
        color: '#E2E2E6',
    },
});

export default SearchHeader;
