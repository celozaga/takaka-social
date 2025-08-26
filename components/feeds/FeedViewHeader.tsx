
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import { BackHeader, IconButton } from '@/components/shared';
import { MoreHorizontal, Share2 } from 'lucide-react';
import { useFeedActions } from '@/hooks/useFeedActions';

interface FeedViewHeaderProps {
    feedUri: string;
    onBack?: () => void;
    openFeedModal: (feedUri: string) => void;
}

const FeedViewHeader: React.FC<FeedViewHeaderProps> = ({ 
    feedUri, 
    onBack, 
    openFeedModal 
}) => {
    const { feedView, isLoading, likeCount } = useFeedActions(feedUri);

    if (isLoading) {
        return (
            <View style={styles.skeletonContainer}>
                <View style={styles.skeletonItem} />
                <View style={styles.skeletonItem} />
            </View>
        );
    }

    if (!feedView) {
        return (
            <View style={styles.skeletonContainer}>
                <View style={styles.skeletonItem} />
                <View style={styles.skeletonItem} />
            </View>
        );
    }

    const rightActions = (
        <View style={styles.actions}>
            <IconButton
                icon={<Share2 size={20} />}
                onPress={() => {/* TODO: Implement share */}}
                variant="ghost"
                accessibilityLabel="Compartilhar"
            />
            <IconButton
                icon={<MoreHorizontal size={20} />}
                onPress={() => openFeedModal(feedUri)}
                variant="ghost"
                accessibilityLabel="Mais opções"
            />
        </View>
    );

    return (
        <BackHeader 
            title={feedView.displayName || feedView.name} 
            onBackPress={onBack}
            rightAction={rightActions}
        />
    );
};

const styles = StyleSheet.create({
    skeletonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.background,
        zIndex: 30,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    skeletonItem: {
        width: 20,
        height: 20,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.full,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
});

export default FeedViewHeader;