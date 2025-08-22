import React from 'react';
import { useUI } from '../../context/UIContext';
import { useFeedActions } from '../../hooks/useFeedActions';
import { ArrowLeft, MoreHorizontal, Heart } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface FeedViewHeaderProps {
    feedUri: string;
    onBack: () => void;
}

const FeedViewHeader: React.FC<FeedViewHeaderProps> = ({ feedUri, onBack }) => {
    const { openFeedModal } = useUI();
    const { feedView, isLoading, likeCount } = useFeedActions(feedUri);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.skeletonContainer}>
                    <View style={styles.skeletonItem} />
                    <View style={styles.skeletonItem} />
                </View>
            </View>
        )
    }

    if (!feedView) {
        return (
            <View style={styles.container}>
                <Pressable onPress={onBack} style={styles.button}>
                    <ArrowLeft size={20} color={theme.colors.onSurface} />
                </Pressable>
                <Text style={styles.errorText}>Could not load feed</Text>
                <View style={{ width: 36 }} />
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <Pressable onPress={onBack} style={styles.button}>
                <ArrowLeft size={20} color={theme.colors.onSurface} />
            </Pressable>
            <View style={styles.titleContainer}>
                <FeedAvatar src={feedView.avatar} alt="" style={styles.avatar} />
                <Text style={styles.title} numberOfLines={1}>{feedView.displayName}</Text>
            </View>
            <View style={styles.rightContainer}>
                <View style={styles.likeContainer}>
                    <Heart size={16} color={theme.colors.pink} />
                    <Text style={styles.likeText}>{likeCount}</Text>
                </View>
                <Pressable onPress={() => openFeedModal(feedUri)} style={styles.button}>
                    <MoreHorizontal size={20} color={theme.colors.onSurface} />
                </Pressable>
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
        backgroundColor: 'rgba(16, 16, 16, 0.8)', // theme.colors.background with transparency
    },
    skeletonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    skeletonItem: {
        height: 32,
        width: '40%',
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.medium,
    },
    button: {
        padding: theme.spacing.s,
        margin: -theme.spacing.s,
        borderRadius: theme.shape.full,
    },
    errorText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.error,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.s,
        minWidth: 0,
        paddingHorizontal: theme.spacing.l,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: theme.shape.small,
    },
    title: {
        ...theme.typography.titleSmall,
        color: theme.colors.onSurface,
        flexShrink: 1,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    likeText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
    },
});

export default FeedViewHeader;
