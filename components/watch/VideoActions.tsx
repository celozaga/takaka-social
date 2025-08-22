import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'expo-router';
import { Heart, MessageCircle, Repeat, Share2, BadgeCheck, Plus, Check, MoreHorizontal } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useUI } from '../../context/UIContext';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import { formatCompactNumber } from '@/lib/formatters';

interface VideoActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const VideoActions: React.FC<VideoActionsProps> = ({ post }) => {
    const { openComposer, openMediaActionsModal } = useUI();
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { likeUri, likeCount, isLiking, handleLike, repostUri, repostCount, isReposting, handleRepost } = usePostActions(post);
    const [followUri, setFollowUri] = useState(post.author.viewer?.following);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => setFollowUri(post.author.viewer?.following), [post.author.viewer?.following]);

    const isMe = session?.did === post.author.did;
    const handleFollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || followUri) return; setIsFollowLoading(true); agent.follow(post.author.did).then(({ uri }) => setFollowUri(uri)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri, post.author.did]);
    const handleUnfollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || !followUri) return; setIsFollowLoading(true); agent.deleteFollow(followUri).then(() => setFollowUri(undefined)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri]);
    const handleComment = useCallback((e: any) => { e.stopPropagation(); openComposer({ replyTo: { uri: post.uri, cid: post.cid } }); }, [openComposer, post.uri, post.cid]);
    const handleMoreClick = useCallback((e: any) => { e.stopPropagation(); openMediaActionsModal(post); }, [openMediaActionsModal, post]);

    return (
        <View style={styles.container}>
            <View>
                <Link href={`/profile/${post.author.handle}` as any} onPress={e => e.stopPropagation()} asChild>
                    <Pressable>
                        <Image source={{ uri: post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                        {post.author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                            <View style={styles.badgeContainer}><BadgeCheck size={14} color="white" fill="currentColor" /></View>
                        )}
                    </Pressable>
                </Link>
                {!isMe && (
                    <Pressable onPress={followUri ? handleUnfollow : handleFollow} disabled={isFollowLoading} style={[styles.followButton, !followUri && styles.followButtonActive]}>
                        {followUri ? <Check size={16} color={theme.colors.primary} strokeWidth={3} /> : <Plus size={16} color="white" />}
                    </Pressable>
                )}
            </View>
            
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
    avatar: { width: 48, height: 48, borderRadius: theme.shape.full, borderWidth: 2, borderColor: 'white', backgroundColor: theme.colors.surfaceContainerHigh },
    badgeContainer: { position: 'absolute', bottom: -2, right: -2, backgroundColor: theme.colors.primary, borderRadius: theme.shape.full, padding: 2, borderWidth: 1, borderColor: 'black' },
    followButton: { position: 'absolute', bottom: -8, left: '50%', transform: [{ translateX: -12 }], width: 24, height: 24, borderRadius: theme.shape.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'black', backgroundColor: theme.colors.onSurfaceVariant },
    followButtonActive: { backgroundColor: theme.colors.error },
    actionButton: { alignItems: 'center', gap: 6 },
    actionText: { ...theme.typography.labelLarge, fontWeight: '600', color: 'white' },
});

export default React.memo(VideoActions);
