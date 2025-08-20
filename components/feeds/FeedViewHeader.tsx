
import React from 'react';
import { useUI } from '../../context/UIContext';
import { useFeedActions } from '../../hooks/useFeedActions';
import { ArrowLeft, MoreHorizontal, Heart } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
                    <ArrowLeft size={20} color="#E2E2E6" />
                </Pressable>
                <Text style={styles.errorText}>Could not load feed</Text>
                <View style={{ width: 36 }} />
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <Pressable onPress={onBack} style={styles.button}>
                <ArrowLeft size={20} color="#E2E2E6" />
            </Pressable>
            <View style={styles.titleContainer}>
                <FeedAvatar src={feedView.avatar} alt="" style={styles.avatar} />
                <Text style={styles.title} numberOfLines={1}>{feedView.displayName}</Text>
            </View>
            <View style={styles.rightContainer}>
                <View style={styles.likeContainer}>
                    <Heart size={16} color="#ec4899" />
                    <Text style={styles.likeText}>{likeCount}</Text>
                </View>
                <Pressable onPress={() => openFeedModal(feedUri)} style={styles.button}>
                    <MoreHorizontal size={20} color="#E2E2E6" />
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
        paddingHorizontal: 16,
        backgroundColor: 'rgba(17, 19, 20, 0.8)', // surface-1/80
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
        backgroundColor: '#2b2d2e',
        borderRadius: 8,
    },
    button: {
        padding: 8,
        margin: -8,
        borderRadius: 999,
    },
    errorText: {
        fontSize: 14,
        color: '#F2B8B5',
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minWidth: 0,
        paddingHorizontal: 16,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    title: {
        fontWeight: 'bold',
        color: '#E2E2E6',
        flexShrink: 1,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likeText: {
        fontSize: 14,
        color: '#C3C6CF',
    },
});

export default FeedViewHeader;
