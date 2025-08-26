import React, { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useUI } from '../../context/UIContext';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions, Alert, Platform, Share, Linking, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { theme } from '@/lib/theme';
import { formatCompactNumber } from '@/lib/formatters';

interface VideoActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const VideoActions: React.FC<VideoActionsProps> = ({ post }) => {
    const { agent, session } = useAtp();
    const { openComposer, openMediaActionsModal, openRepliesModal } = useUI();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    
    // Estados locais para evitar re-renderizações desnecessárias
    const [likeUri, setLikeUri] = useState<string | null>(post.viewer?.like || null);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [repostUri, setRepostUri] = useState<string | null>(post.viewer?.repost || null);
    const [repostCount, setRepostCount] = useState(post.repostCount || 0);
    const [isReposting, setIsReposting] = useState(false);
    const [isFetchingThread, setIsFetchingThread] = useState(false);
    
    // Estados para seguir/deixar de seguir
    const [followUri, setFollowUri] = useState<string | null>(post.author.viewer?.following || null);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const isMe = session?.did === post.author.did;
    const profileLink = `/profile/${post.author.handle}`;
    
    // Estado para o modal de repost/share
    const [isRepostShareModalVisible, setIsRepostShareModalVisible] = useState(false);
    
    // Sincronizar estados locais com dados do post
    useEffect(() => {
        if (post) {
            setFollowUri(post.author?.viewer?.following || null);
            setLikeUri(post.viewer?.like || null);
            setLikeCount(post.likeCount || 0);
            setRepostUri(post.viewer?.repost || null);
            setRepostCount(post.repostCount || 0);
        }
    }, [post]);
    
    const handleFollow = useCallback((e: any) => { 
        e.stopPropagation(); 
        if (isFollowLoading || isMe || followUri) return; 
        setIsFollowLoading(true); 
        agent.follow(post.author.did).then(({ uri }) => setFollowUri(uri)).finally(() => setIsFollowLoading(false)); 
    }, [agent, isFollowLoading, isMe, followUri, post.author.did]);
    
    const handleUnfollow = useCallback((e: any) => { 
        e.stopPropagation(); 
        if (isFollowLoading || isMe || !followUri) return; 
        setIsFollowLoading(true); 
        agent.deleteFollow(followUri).then(() => setFollowUri(null)).finally(() => setIsFollowLoading(false)); 
    }, [agent, isFollowLoading, isMe, followUri]);
    
    // Função local para like/unlike
    const handleLike = useCallback(async (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        if (!session || isLiking) return;
        
        setIsLiking(true);
        const originalLikeUri = likeUri;
        const originalLikeCount = likeCount;

        try {
            if (likeUri) {
                setLikeUri(null);
                setLikeCount(c => Math.max(0, c - 1));
                await agent.deleteLike(likeUri);
            } else {
                const tempUri = 'temp-uri';
                setLikeUri(tempUri);
                setLikeCount(c => c + 1);
                const { uri } = await agent.like(post.uri, post.cid);
                setLikeUri(uri);
            }
        } catch (error: any) {
            console.error('Failed to like/unlike post:', error);
            setLikeUri(originalLikeUri);
            setLikeCount(originalLikeCount);
        } finally {
            setIsLiking(false);
        }
    }, [session, isLiking, likeUri, likeCount, agent, post.uri, post.cid]);

    // Função local para repost/unrepost
    const handleRepost = useCallback(async (e?: any) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!session || isReposting) return;
        
        setIsReposting(true);
        const originalRepostUri = repostUri;
        const originalRepostCount = repostCount;

        try {
            if (repostUri) {
                setRepostUri(null);
                setRepostCount(c => Math.max(0, c - 1));
                await agent.deleteRepost(repostUri);
            } else {
                const tempUri = 'temp-uri';
                setRepostUri(tempUri);
                setRepostCount(c => c + 1);
                const { uri } = await agent.repost(post.uri, post.cid);
                setRepostUri(uri);
            }
        } catch (error: any) {
            console.error('Failed to repost/unrepost post:', error);
            setRepostUri(originalRepostUri);
            setRepostCount(originalRepostCount);
        } finally {
            setIsReposting(false);
        }
    }, [session, isReposting, repostUri, repostCount, agent, post.uri, post.cid]);

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

    const openRepostModal = () => {
        setIsRepostShareModalVisible(true);
    };

    const handleShare = async () => {
        const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`;
        const shareText = `${post.author.displayName || post.author.handle}: ${post.record?.text || 'Check out this post!'}`;

        try {
            if (Platform.OS === 'web') {
                if (navigator.share) {
                    await navigator.share({
                        title: 'Takaka Post',
                        text: shareText,
                        url: postUrl,
                    });
                } else {
                    await navigator.clipboard.writeText(`${shareText}\n\n${postUrl}`);
                }
            } else {
                await Share.share({
                    message: `${shareText}\n\n${postUrl}`,
                    url: postUrl,
                });
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
        }
        setIsRepostShareModalVisible(false);
    };

    const handleRepostAction = async () => {
        try {
            await handleRepost();
            setIsRepostShareModalVisible(false);
        } catch (error) {
            console.error('Erro ao repostar:', error);
        }
    };

    return (
        <>
            <View style={[styles.container, isMobile && styles.containerMobile]}>
                {/* Avatar + Botão de Seguir integrado */}
                <View style={styles.avatarContainer}>
                    <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                        <Pressable style={styles.avatarWrapper}>
                            <Image 
                                source={{ uri: post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} 
                                style={styles.avatar} 
                            />
                            {post.author.labels?.some(l => l.val === 'blue-check') && (
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} style={styles.verifiedBadge} />
                            )}
                        </Pressable>
                    </Link>
                    
                    {/* Botão de seguir sobreposto no avatar */}
                    {!isMe && (
                        <Pressable 
                            onPress={followUri ? handleUnfollow : handleFollow} 
                            disabled={isFollowLoading} 
                            style={[styles.followButton, followUri && styles.followingButton]}
                        >
                            {isFollowLoading ? (
                                <ActivityIndicator color="white" size={18} />
                            ) : followUri ? (
                                <Ionicons name="checkmark" size={18} color="white" />
                            ) : (
                                <Ionicons name="add" size={18} color="white" />
                            )}
                        </Pressable>
                    )}
                </View>

                {/* Botões de ação */}
                <Pressable onPress={(e) => { e.stopPropagation(); handleLike(e as any); }} disabled={isLiking} style={styles.actionButton}>
                    <Ionicons name={likeUri ? "heart" : "heart-outline"} size={isMobile ? 28 : 32} color={likeUri ? theme.colors.pink : 'white'} />
                    <Text style={[styles.actionText, isMobile && styles.actionTextMobile]}>{formatCompactNumber(likeCount)}</Text>
                </Pressable>
                <Pressable onPress={handleComment} style={styles.actionButton}>
                    {isFetchingThread ? <ActivityIndicator color="white" size={isMobile ? 28 : 32} /> : <Ionicons name="chatbubble-outline" size={isMobile ? 28 : 32} color="white"/>}
                    <Text style={[styles.actionText, isMobile && styles.actionTextMobile]}>{formatCompactNumber(post.replyCount || 0)}</Text>
                </Pressable>
                <Pressable 
                    onPress={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        openRepostModal(); 
                    }} 
                    style={styles.actionButton}
                    disabled={isReposting}
                >
                    <Ionicons name="repeat-outline" size={isMobile ? 28 : 32} color={repostUri ? theme.colors.primary : 'white'} />
                    <Text style={[styles.actionText, isMobile && styles.actionTextMobile]}>{formatCompactNumber(repostCount)}</Text>
                </Pressable>
                <Pressable onPress={handleMoreClick} style={styles.actionButton}>
                    <Ionicons name="ellipsis-horizontal" size={isMobile ? 28 : 32} color="white" />
                </Pressable>
            </View>

            {/* Modal de Repost & Share */}
            <Modal
                visible={isRepostShareModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsRepostShareModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Indicador de arraste */}
                        <View style={styles.dragIndicator} />
                        
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Repost & Share</Text>
                            <Pressable onPress={() => setIsRepostShareModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.colors.onSurface} />
                            </Pressable>
                        </View>
                        
                        <View style={styles.modalActions}>
                            <Pressable 
                                onPress={handleRepostAction}
                                style={({ pressed }) => [
                                    styles.modalActionItem, 
                                    pressed && styles.modalActionItemPressed,
                                    repostUri && pressed && styles.modalActionItemDestructivePressed,
                                    isReposting && styles.modalActionItemDisabled
                                ]}
                                disabled={isReposting}
                            >
                                <Ionicons name="repeat-outline" size={24} color={repostUri ? theme.colors.error : theme.colors.onSurfaceVariant} />
                                <Text style={[
                                    styles.modalActionLabel,
                                    repostUri && styles.modalActionLabelDestructive
                                ]}>
                                    {repostUri ? 'Undo Repost' : 'Repost'}
                                </Text>
                                {isReposting && <ActivityIndicator size={20} color={theme.colors.primary} />}
                            </Pressable>
                            
                            <Pressable 
                                onPress={handleShare}
                                style={({ pressed }) => [
                                    styles.modalActionItem,
                                    pressed && styles.modalActionItemPressed
                                ]}
                            >
                                <Ionicons name="share-outline" size={24} color={theme.colors.onSurfaceVariant} />
                                <Text style={styles.modalActionLabel}>Share</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: { 
        position: 'absolute', 
        bottom: 16,
        right: theme.spacing.m, 
        alignItems: 'center', 
        gap: theme.spacing.l,
        zIndex: 20,
        paddingVertical: theme.spacing.s,
    },
    containerMobile: {
        bottom: 16,
        right: theme.spacing.s,
        gap: theme.spacing.m,
    },
    
    // Container do avatar com botão de seguir
    avatarContainer: {
        position: 'relative',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 28,
        elevation: 3,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 1,
    },
    followButton: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    followingButton: {
        backgroundColor: theme.colors.primary,
    },
    
    // Botões de ação
    actionButton: {
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.xs,
    },
    actionText: {
        ...theme.typography.labelSmall,
        color: 'white',
        textAlign: 'center',
    },
    actionTextMobile: {
        ...theme.typography.labelSmall,
        fontSize: 10,
    },

    // Estilos do modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surfaceContainer,
        borderTopLeftRadius: theme.shape.large,
        borderTopRightRadius: theme.shape.large,
        paddingBottom: theme.spacing.l,
        maxHeight: '80%',
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.onSurfaceVariant,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.s,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.l,
        paddingBottom: theme.spacing.m,
    },
    modalTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.onSurface,
    },
    closeButton: {
        padding: theme.spacing.s,
        margin: -theme.spacing.s,
    },
    modalActions: {
        padding: theme.spacing.s,
        gap: theme.spacing.s,
    },
    modalActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        borderRadius: theme.shape.medium,
        gap: theme.spacing.m,
    },
    modalActionItemPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    modalActionItemDestructivePressed: {
        backgroundColor: theme.colors.errorContainer,
    },
    modalActionItemDisabled: {
        opacity: 0.6,
    },
    modalActionLabel: {
        ...theme.typography.bodyLarge,
        color: theme.colors.onSurface,
        flex: 1,
    },
    modalActionLabelDestructive: {
        color: theme.colors.error,
    },
});

export default React.memo(VideoActions);