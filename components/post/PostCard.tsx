import React, { useMemo, useCallback, memo } from 'react';
import { Link, useRouter } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages,AppBskyActorDefs, RichText,AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { Images, PlayCircle, Heart, Repeat } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import { PostCardSkeleton, useTheme, Typography, Avatar } from '@/components/shared';
import Card from '@/components/shared/Card';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AccessibleText } from '@/components/shared';
import { formatCompactNumber } from '@/lib/formatters';
import { OptimizedImage } from '../ui';
import { Tooltip } from '../shared/Tooltip';

type PostCardProps = {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
    isClickable?: boolean;
}

// Memoized sub-components for better performance
const MemoizedAvatar = memo(Avatar);
const MemoizedOptimizedImage = memo(OptimizedImage);
const MemoizedRichTextRenderer = memo(RichTextRenderer);

// Memoized context component
const PostContext = memo(({ reason, theme }: { reason: any; theme: any }) => {
    const styles = useMemo(() => createContextStyles(theme), [theme]);
    
    if (reason && AppBskyFeedDefs.isReasonRepost(reason)) {
        return (
            <View style={styles.contextContainer}>
                <Repeat size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.contextText} numberOfLines={1}>
                    Reposted by{' '}
                    <Link href={`/profile/${reason.by.handle}` as any} onPress={e => e.stopPropagation()} asChild>
                        <Text style={styles.contextLink}>{reason.by.displayName || `@${reason.by.handle}`}</Text>
                    </Link>
                </Text>
            </View>
        );
    }
    return null;
});

// Memoized media component
const PostMedia = memo(({ mediaInfo, post, theme }: { mediaInfo: any; post: any; theme: any }) => {
    const styles = useMemo(() => createMediaStyles(theme), [theme]);
    
    if (!mediaInfo) {
        if (__DEV__) {
            console.log(`🚫 DEBUG renderMedia: mediaInfo é null para post:`, post.uri);
        }
        return null;
    }
    
    const { mediaEmbed } = mediaInfo;

    if (AppBskyEmbedImages.isView(mediaEmbed)) {
        const firstImage = mediaEmbed.images[0];
        const hasMultipleImages = mediaEmbed.images.length > 1;
        
        // Calculate image dimensions with max height constraint
        const imageDimensions = useMemo(() => {
            let imageHeight = 300;
            let imageAspectRatio = 1;
            
            if (firstImage.aspectRatio) {
                const originalAspectRatio = firstImage.aspectRatio.width / firstImage.aspectRatio.height;
                imageAspectRatio = Math.min(Math.max(originalAspectRatio, 0.5), 2.0);
                
                if (imageAspectRatio > 1) {
                    imageHeight = Math.min(300 / imageAspectRatio, 500);
                } else {
                    imageHeight = Math.min(300 * (1 / imageAspectRatio), 500);
                }
                
                imageHeight = Math.max(imageHeight, 150);
            }
            
            return { imageHeight, imageAspectRatio };
        }, [firstImage.aspectRatio]);
        
        return (
            <View style={styles.mediaContainer}>
                <MemoizedOptimizedImage 
                    source={firstImage.thumb}
                    accessibilityLabel={firstImage.alt || 'Post image'} 
                    style={[styles.image, { 
                        height: imageDimensions.imageHeight,
                        maxHeight: 500,
                        aspectRatio: imageDimensions.imageAspectRatio 
                    }]}
                    contentFit="cover"
                    transition={200}
                />
                {hasMultipleImages && (
                     <View style={styles.mediaBadgeContainer}>
                        <View style={[styles.mediaBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                            <Images size={14} color="white" />
                            <Text style={styles.mediaBadgeText}>{mediaEmbed.images.length}</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    if (AppBskyEmbedVideo.isView(mediaEmbed)) {
        const posterUrl = (mediaEmbed as any).thumbnail;
        const videoAspectRatio = useMemo(() => {
            return (mediaEmbed as any).aspectRatio
                ? Math.min(Math.max((mediaEmbed as any).aspectRatio.width / (mediaEmbed as any).aspectRatio.height, 0.5), 2.0)
                : 16 / 9;
        }, [(mediaEmbed as any).aspectRatio]);
        
        return (
            <View style={styles.mediaContainer}>
                <MemoizedOptimizedImage 
                    source={posterUrl || ''} 
                    accessibilityLabel="Video poster" 
                    style={[styles.image, styles.videoPoster, {backgroundColor: '#000', aspectRatio: videoAspectRatio}]}
                    contentFit={'cover'}
                    transition={200}
                />
                <View style={styles.mediaBadgeContainer}>
                    <View style={styles.mediaBadge}><PlayCircle size={14} color="white" /></View>
                </View>
            </View>
        );
    }
    return null;
});

// Memoized footer component
const PostFooter = memo(({ author, likeUri, likeCount, isLiking, handleLike, theme }: {
    author: any;
    likeUri: string | undefined;
    likeCount: number;
    isLiking: boolean;
    handleLike: (e: any) => void;
    theme: any;
}) => {
    const styles = useMemo(() => createFooterStyles(theme), [theme]);
    const profileLink = `/profile/${author.handle}`;
    
    return (
        <View style={styles.footer}>
            <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                <Pressable style={styles.authorContainer}>
                    <MemoizedAvatar 
                        uri={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} 
                        size="xs"
                        fallback={author.displayName?.charAt(0) || author.handle.charAt(0)}
                        accessibilityLabel={`${author.displayName}'s avatar`} 
                    />
                    <AccessibleText variant="bodySmall" style={[styles.authorName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {author.displayName || `@${author.handle}`}
                    </AccessibleText>
                </Pressable>
            </Link>
            <Tooltip contentKey={likeUri ? 'post.unlike' : 'post.like'} position="top">
                <Pressable 
                    onPress={(e) => { e.stopPropagation(); handleLike(e); }}
                    disabled={isLiking}
                    style={styles.likeButton}
                >
                    <Heart size={16} color={likeUri ? theme.colors.pink : theme.colors.onSurface} fill={likeUri ? theme.colors.pink : 'none'} />
                    {likeCount > 0 && <Text style={[styles.likeCount, !!likeUri && { color: theme.colors.pink }]}>{formatCompactNumber(likeCount)}</Text>}
                </Pressable>
            </Tooltip>
        </View>
    );
});

const PostCard: React.FC<PostCardProps> = memo(({ feedViewPost, isClickable = true }) => {
    const { setPostForNav } = useUI();
    const router = useRouter();
    const moderation = useModeration();
    const { theme } = useTheme();
    const [isContentVisible, setIsContentVisible] = React.useState(false);

    const { post, reason } = feedViewPost;
    
    // Memoize expensive computations
    const postData = useMemo(() => {
        const author = post.author as AppBskyActorDefs.ProfileViewBasic;
        const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
        const rkey = post.uri.split('/').pop() as string;
        const postLink = `/post/${author.did}/${rkey}`;
        
        return { author, record, rkey, postLink };
    }, [post.author, post.record, post.uri]);
    
    const modDecision = useMemo(() => {
        return moderation.isReady ? moderatePost(post, moderation) : null;
    }, [post, moderation.isReady, moderation]);

    const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
    
    // Create dynamic styles with memoization
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handlePress = useCallback(() => {
        if (!isClickable) return;
        setPostForNav(feedViewPost);
        router.push(postData.postLink as any);
    }, [isClickable, setPostForNav, feedViewPost, router, postData.postLink]);

    const mediaInfo = useMemo(() => {
        const embed = post.embed;
        if (!embed) {
            if (__DEV__) {
                console.log(`🚫 DEBUG getMediaInfo: Post sem embed:`, post.uri);
            }
            return null;
        }
        
        if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
            if (__DEV__) {
                console.log(`✅ DEBUG getMediaInfo: Post com imagens:`, post.uri, 'count:', embed.images.length);
            }
            return { mediaEmbed: embed };
        }
        
        if (AppBskyEmbedVideo.isView(embed)) {
            if (__DEV__) {
                console.log(`✅ DEBUG getMediaInfo: Post com vídeo:`, post.uri);
            }
            return { mediaEmbed: embed };
        }
        
        if (AppBskyEmbedRecordWithMedia.isView(embed) && 'media' in embed && embed.media) {
            if (AppBskyEmbedImages.isView(embed.media) && embed.media.images.length > 0) {
                if (__DEV__) {
                    console.log(`✅ DEBUG getMediaInfo: Post com RecordWithMedia + imagens:`, post.uri);
                }
                return { mediaEmbed: embed.media };
            }
            if (AppBskyEmbedVideo.isView(embed.media)) {
                if (__DEV__) {
                    console.log(`✅ DEBUG getMediaInfo: Post com RecordWithMedia + vídeo:`, post.uri);
                }
                return { mediaEmbed: embed.media };
            }
        }
        
        if (__DEV__) {
            console.log(`🚫 DEBUG getMediaInfo: Post com embed não reconhecido:`, post.uri, 'embed type:', embed.$type);
        }
        return null;
    }, [post.embed, post.uri]);

    // No longer need these render functions as they're now memoized components

    if (!modDecision) return <PostCardSkeleton />;
    if (modDecision.visibility === 'hide') return null;
    if (modDecision.visibility === 'warn' && !isContentVisible) {
        return <ContentWarning reason={modDecision.reason!} onShow={() => setIsContentVisible(true)} />;
    }

    if (!mediaInfo) {
        if (__DEV__) {
            console.log(`🚫 DEBUG PostCard: Post rejeitado por falta de mídia:`, {
                uri: post.uri,
                hasEmbed: !!post.embed,
                embedType: post.embed?.$type,
                text: postData.record?.text?.substring(0, 50) + '...'
            });
        }
        return null;
    }

    return (
        <Card onPress={handlePress} pressable={true} padding="none" style={styles.cardContainer}>
            <PostContext reason={reason} theme={theme} />
            <PostMedia mediaInfo={mediaInfo} post={post} theme={theme} />
            <View style={styles.content}>
                {postData.record?.text && (
                    <AccessibleText variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
                        <MemoizedRichTextRenderer record={postData.record} />
                    </AccessibleText>
                )}
                <PostFooter 
                    author={postData.author}
                    likeUri={likeUri}
                    likeCount={likeCount}
                    isLiking={isLiking}
                    handleLike={handleLike}
                    theme={theme}
                />
            </View>
        </Card>
    );
});

// Create dynamic styles functions
const createContextStyles = (theme: any) => StyleSheet.create({
    contextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },
    contextText: {
        ...theme.typography.bodySmall,
        color: theme.colors.onSurfaceVariant,
        flexShrink: 1
    },
    contextLink: {
        fontWeight: 'bold',
        color: theme.colors.onSurfaceVariant,
    },
});

const createMediaStyles = (theme: any) => StyleSheet.create({
    mediaContainer: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    image: { 
        width: '100%',
        objectFit: 'cover',
    },
    videoPoster: { resizeMode: 'contain' },
    mediaBadgeContainer: { position: 'absolute', top: theme.spacing.sm, right: theme.spacing.sm, flexDirection: 'row', gap: theme.spacing.xs },
    mediaBadge: { backgroundColor: 'rgba(0,0,0,0.7)', padding: theme.spacing.xs, borderRadius: theme.radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    mediaBadgeText: { ...theme.typography.labelSmall, color: 'white' },
});

const createFooterStyles = (theme: any) => StyleSheet.create({
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
    authorContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1, minWidth: 0 },
    authorName: { flexShrink: 1 },
    likeButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, padding: theme.spacing.xs, margin: -theme.spacing.xs },
    likeCount: { ...theme.typography.labelMedium, color: theme.colors.onSurface },
});

const createStyles = (theme: any) => StyleSheet.create({
        cardContainer: {
            width: '100%',
            marginBottom: 0,
        },
        mediaContainer: {
            width: '100%',
            position: 'relative',
            overflow: 'hidden', // Ensure images don't overflow
        },
        image: { 
            width: '100%',
            objectFit: 'cover', // CSS cover behavior
        },
        videoPoster: { resizeMode: 'contain' },

        mediaBadgeContainer: { position: 'absolute', top: theme.spacing.sm, right: theme.spacing.sm, flexDirection: 'row', gap: theme.spacing.xs },
        mediaBadge: { backgroundColor: 'rgba(0,0,0,0.7)', padding: theme.spacing.xs, borderRadius: theme.radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
        mediaBadgeText: { ...theme.typography.labelSmall, color: 'white' },
        content: { padding: theme.spacing.md, gap: theme.spacing.sm },
        footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
        authorContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1, minWidth: 0 },
        authorName: { flexShrink: 1 },
        likeButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, padding: theme.spacing.xs, margin: -theme.spacing.xs },
        likeCount: { ...theme.typography.labelMedium, color: theme.colors.onSurface },

    });

export default PostCard;