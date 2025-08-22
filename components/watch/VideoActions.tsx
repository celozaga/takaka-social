import React from 'react';
import { Heart, MessageCircle, Repeat, Share2, MoreHorizontal } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useUI } from '../../context/UIContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import { formatCompactNumber } from '@/lib/formatters';

interface VideoActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const VideoActions: React.FC<VideoActionsProps> = ({ post }) => {
    const { openComposer, openMediaActionsModal } = useUI();
    const { likeUri, likeCount, isLiking, handleLike, repostUri, repostCount, isReposting, handleRepost } = usePostActions(post);
    
    const handleComment = (e: any) => { e.stopPropagation(); openComposer({ replyTo: { uri: post.uri, cid: post.cid } }); };
    const handleMoreClick = (e: any) => { e.stopPropagation(); openMediaActionsModal(post); };

    return (
        <View style={styles.container}>
            <Pressable onPress={(e) => { e.stopPropagation(); handleLike(e as any); }} disabled={isLiking} style={styles.actionButton}>
                <Heart size={32} color={likeUri ? theme.colors.pink : 'white'} fill={likeUri ? theme.colors.pink : 'none'} />
                <Text style={styles.actionText}>{formatCompactNumber(likeCount)}</Text>
            </Pressable>
            <Pressable onPress={handleComment} style={styles.actionButton}>
                <MessageCircle size={32} color="white"/>
                <Text style={styles.actionText}>{formatCompactNumber(post.replyCount || 0)}</Text>
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation(); handleRepost(e as any); }} disabled={isReposting} style={styles.actionButton}>
                <Repeat size={32} color={repostUri ? theme.colors.primary : 'white'} />
                <Text style={styles.actionText}>{formatCompactNumber(repostCount)}</Text>
            </Pressable>
            <Pressable onPress={handleMoreClick} style={styles.actionButton}>
                <MoreHorizontal size={32} color="white" />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { position: 'absolute', bottom: 96, right: theme.spacing.s, alignItems: 'center', gap: 20, zIndex: 20 },
    actionButton: { alignItems: 'center', gap: 6 },
    actionText: { ...theme.typography.labelLarge, fontWeight: '600', color: 'white' },
});

export default React.memo(VideoActions);