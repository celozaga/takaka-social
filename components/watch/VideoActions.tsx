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
        bottom: 20, // Ajustar para dar mais espaço
        right: theme.spacing.s, 
        alignItems: 'center', 
        gap: 20, 
        zIndex: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Adicionar fundo semi-transparente
        padding: theme.spacing.s,
        borderRadius: theme.shape.medium,
    },
    containerMobile: {
        bottom: 10, // Ajustar para dar mais espaço em dispositivos móveis
        right: theme.spacing.s,
    },
    actionButton: { alignItems: 'center', gap: 6, minHeight: 56 },
    actionText: { ...theme.typography.labelLarge, fontWeight: '600', color: 'white' },
    actionTextMobile: {
        fontSize: theme.typography.labelSmall.fontSize,
    },
});

export default React.memo(VideoActions);
