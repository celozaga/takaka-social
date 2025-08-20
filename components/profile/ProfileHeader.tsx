
import React from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface ProfileHeaderProps {
    handle: string;
    onMoreClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ handle, onMoreClick }) => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Pressable onPress={() => router.back()} style={styles.button}>
                    <ArrowLeft size={24} color="#E2E2E6" />
                </Pressable>
                <Text style={styles.title} numberOfLines={1}>@{handle}</Text>
                <Pressable onPress={onMoreClick} style={styles.button}>
                    <MoreHorizontal size={24} color="#E2E2E6" />
                </Pressable>
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
        justifyContent: 'space-between',
        height: 64,
    },
    button: {
        padding: 8,
        borderRadius: 999,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E2E2E6',
        textAlign: 'center',
        flex: 1,
    },
});


export default ProfileHeader;
