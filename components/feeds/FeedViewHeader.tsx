
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared';
import { BackHeader, IconButton, Tooltip } from '@/components/shared';
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
    const { theme } = useTheme();
    
    const styles = createStyles(theme);

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
            <Tooltip contentKey="common.share" position="bottom">
                <IconButton
                    icon={<Share2 size={20} />}
                    onPress={() => {/* TODO: Implement share */}}
                    variant="ghost"
                    accessibilityLabel="Compartilhar"
                />
            </Tooltip>
            <Tooltip contentKey="common.more" position="bottom">
                <IconButton
                    icon={<MoreHorizontal size={20} />}
                    onPress={() => openFeedModal(feedUri)}
                    variant="ghost"
                    accessibilityLabel="Mais opções"
                />
            </Tooltip>
        </View>
    );

    return (
        <BackHeader 
            title={feedView.displayName || feedView.uri} 
            onBackPress={onBack}
            rightAction={rightActions}
        />
    );
};

const createStyles = (theme: any) => StyleSheet.create({
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
        borderRadius: theme.radius.full,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
});

export default FeedViewHeader;