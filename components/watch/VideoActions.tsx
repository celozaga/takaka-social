import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat, Share2, MoreHorizontal } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useUI } from '../../context/UIContext';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { theme } from '@/lib/theme';
import { formatCompactNumber } from '@/lib/formatters';

interface VideoActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const VideoActions: React.FC<VideoActionsProps> = ({ post }) => {
    const { agent } = useAtp();
    const { openComposer, openMediaActionsModal, openRepliesModal } = useUI();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const { likeUri, likeCount, isLiking, handleLike, repostUri, repostCount, isReposting, handleRepost } = usePostActions(post);
    const [isFetchingThread, setIsFetchingThread] = useState(false);
    
    const handleComment = async (e: any) => {
        e.stopPropagation();
        if (isFetchingThread) return;

        setIsFetchingThread(true);
        try {
            const { data } = await agent.getPostThread({ uri: post.uri, depth: 10 });
            if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
                openRepliesModal({ post, thread: data.thread });
            }
        } catch (error) {
            console.error("Failed to fetch thread for replies modal:", error);
            // Fallback to composer if thread fetch fails
            openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
        } finally {
            setIsFetchingThread(false);
        }
    };
    
    const handleMoreClick = (e: any) => { e.stopPropagation(); openMediaActionsModal(post); };

    return (
        <View style={[styles.container, isMobile && styles.containerMobile]}>
            <Pressable onPress={(e) => { e.stopPropagation(); handleLike(e as any); }} disabled={isLiking} style={styles.actionButton}>
                <Heart size={isMobile ? 28 : 32} color={likeUri ? theme.colors.pink : 'white'} fill={likeUri ? theme.colors.pink : 'none'} />
                <Text style={[styles.actionText, isMobile && styles.actionTextMobile]}>{formatCompactNumber(likeCount)}</Text>
            </Pressable>
            <Pressable onPress={handleComment} style={styles.actionButton}>
                {isFetchingThread ? <ActivityIndicator color="white" size={isMobile ? 28 : 32} /> : <MessageCircle size={isMobile ? 28 : 32} color="white"/>}
                <Text style={[styles.actionText, isMobile && styles.actionTextMobile]}>{formatCompactNumber(post.replyCount || 0)}</Text>
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation(); handleRepost(e as any); }} disabled={isReposting} style={styles.actionButton}>
                <Repeat size={isMobile ? 28 : 32} color={repostUri ? theme.colors.primary : 'white'} />
                <Text style={[styles.actionText, isMobile && styles.actionTextMobile]}>{formatCompactNumber(repostCount)}</Text>
            </Pressable>
            <Pressable onPress={handleMoreClick} style={styles.actionButton}>
                <MoreHorizontal size={isMobile ? 28 : 32} color="white" />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        position: 'absolute', 
        bottom: 80, // Posição mais alta para não conflitar com info do autor
        right: theme.spacing.m, 
        alignItems: 'center', 
        gap: theme.spacing.l, // Mais espaçamento entre botões
        zIndex: 20,
        paddingVertical: theme.spacing.s,
    },
    containerMobile: {
        bottom: 70, // Ajustar para mobile
        right: theme.spacing.s,
        gap: theme.spacing.m,
    },
    actionButton: { 
        alignItems: 'center', 
        gap: theme.spacing.xs,
        minHeight: 48,
        minWidth: 48,
        justifyContent: 'center',
    },
    actionText: { 
        ...theme.typography.labelSmall, 
        fontWeight: '700', 
        color: 'white',
        fontSize: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    actionTextMobile: {
        fontSize: 11,
    },
});

export default React.memo(VideoActions);
