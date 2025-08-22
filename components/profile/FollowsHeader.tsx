import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

interface FollowsHeaderProps {
  type: 'followers' | 'following';
}

const FollowsHeader: React.FC<FollowsHeaderProps> = ({ type }) => {
    const router = useRouter();
    const title = type === 'followers' ? 'Followers' : 'Following';

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Pressable onPress={() => router.back()} style={styles.button}>
                    <ArrowLeft size={20} color={theme.colors.onSurface} />
                </Pressable>
                <Text style={styles.title}>{title}</Text>
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
        paddingHorizontal: theme.spacing.l,
        backgroundColor: theme.colors.background,
        zIndex: 30,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
        height: 64,
    },
    button: {
        padding: theme.spacing.s,
        marginLeft: -theme.spacing.s,
        borderRadius: theme.shape.full,
    },
    title: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface,
        textTransform: 'capitalize',
    },
});


export default FollowsHeader;
