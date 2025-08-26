import React, { useMemo, useCallback } from 'react';
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
import { formatCompactNumber } from '@/lib/formatters';
import { OptimizedImage } from '../ui';

type PostCardProps = {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
    isClickable?: boolean;
}

const PostCard: React.FC<PostCardProps> = React.memo(({ feedViewPost, isClickable = true }) => {
    const { setPostForNav } = useUI();
    const router = useRouter();
    const moderation = useModeration();
    const { theme } = useTheme();
    const [isContentVisible, setIsContentVisible] = React.useState(false);

    // Create dynamic styles
    const styles = createStyles(theme);

    const { post, reason } = feedViewPost;
    
    const modDecision = useMemo(() => {
        return moderation.isReady ? moderatePost(post, moderation) : null;
    }, [post, moderation]);

    const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
    const author = post.author as AppBskyActorDefs.ProfileViewBasic;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
    const rkey = post.uri.split('/').pop() as string;
    const postLink = `/post/${author.did}/${rkey}`;
    const profileLink = `/profile/${author.handle}`;

    const handlePress = useCallback(() => {
        if (!isClickable) return;
        setPostForNav(feedViewPost);
        router.push(postLink as any);
    }, [isClickable, setPostForNav, feedViewPost, router, postLink]);

    const getMediaInfo = useCallback((p: AppBskyFeedDefs.PostView): { mediaEmbed: (AppBskyEmbedImages.View | AppBskyEmbedVideo.View) } | null => {
        const embed = p.embed;
        if (!embed) {
            if (__DEV__) {
                console.log(`🚫 DEBUG getMediaInfo: Post sem embed:`, p.uri);
            }
            return null;
        }
        
        if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
            if (__DEV__) {
                console.log(`✅ DEBUG getMediaInfo: Post com imagens:`, p.uri, 'count:', embed.images.length);
            }
            return { mediaEmbed: embed };
        }
        
        if (AppBskyEmbedVideo.isView(embed)) {
            if (__DEV__) {
                console.log(`✅ DEBUG getMediaInfo: Post com vídeo:`, p.uri);
            }
            return { mediaEmbed: embed };
        }
        
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            if (AppBskyEmbedImages.isView(embed.media) && embed.media.images.length > 0) {
                if (__DEV__) {
                    console.log(`✅ DEBUG getMediaInfo: Post com RecordWithMedia + imagens:`, p.uri);
                }
                return { mediaEmbed: embed.media };
            }
            if (AppBskyEmbedVideo.isView(embed.media)) {
                if (__DEV__) {
                    console.log(`✅ DEBUG getMediaInfo: Post com RecordWithMedia + vídeo:`, p.uri);
                }
                return { mediaEmbed: embed.media };
            }
        }
        
        if (__DEV__) {
            console.log(`🚫 DEBUG getMediaInfo: Post com embed não reconhecido:`, p.uri, 'embed type:', embed.$type);
        }
        return null;
    }, []);

    const mediaInfo = useMemo(() => getMediaInfo(post), [getMediaInfo, post]);

    const renderContext = useCallback(() => {
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
    }, [reason]);

    const renderMedia = useCallback(() => {
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
            let imageHeight = 300; // Default height for better visual balance
            let imageAspectRatio = 1; // Default aspect ratio
            
            if (firstImage.aspectRatio) {
                const originalAspectRatio = firstImage.aspectRatio.width / firstImage.aspectRatio.height;
                // Constrain aspect ratio between 0.5 and 2.0 for better masonry layout
                imageAspectRatio = Math.min(Math.max(originalAspectRatio, 0.5), 2.0);
                
                // Use aspect ratio to determine height, but ensure minimum and maximum bounds
                if (imageAspectRatio > 1) {
                    // Landscape images: use aspect ratio to calculate height
                    imageHeight = Math.min(300 / imageAspectRatio, 500);
                } else {
                    // Portrait images: use aspect ratio but cap at 500px
                    imageHeight = Math.min(300 * (1 / imageAspectRatio), 500);
                }
                
                // Ensure minimum height for very wide images
                imageHeight = Math.max(imageHeight, 150);
            }
            
            return (
                <View style={styles.mediaContainer}>
                    <OptimizedImage 
                        source={firstImage.thumb}
                        accessibilityLabel={firstImage.alt || 'Post image'} 
                        style={[styles.image, { 
                            height: imageHeight,
                            maxHeight: 500,
                            aspectRatio: imageAspectRatio 
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
            const posterUrl = mediaEmbed.thumbnail;
            const videoAspectRatio = mediaEmbed.aspectRatio
                    ? Math.min(Math.max(mediaEmbed.aspectRatio.width / mediaEmbed.aspectRatio.height, 0.5), 2.0)
                    : 16 / 9;
            
            return (
                <View style={styles.mediaContainer}>
                    <OptimizedImage 
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
    }, [mediaInfo, post.uri]);

    if (!modDecision) return <PostCardSkeleton />;
    if (modDecision.visibility === 'hide') return null;
    if (modDecision.visibility === 'warn' && !isContentVisible) {
        return <ContentWarning reason={modDecision.reason!} onShow={() => setIsContentVisible(true)} />;
    }

    const mediaElement = renderMedia();
    if (!mediaElement) {
        if (__DEV__) {
            console.log(`🚫 DEBUG PostCard: Post rejeitado por falta de mídia:`, {
                uri: post.uri,
                hasEmbed: !!post.embed,
                embedType: post.embed?.$type,
                text: record?.text?.substring(0, 50) + '...'
            });
        }
        return null;
    }

    return (
        <Card onPress={handlePress} pressable={true} padding="none" style={styles.cardContainer}>
            {renderContext()}
            {mediaElement}
            <View style={styles.content}>
                {record?.text && (
                    <Typography variant="bodyMedium" color="onSurface" numberOfLines={2}>
                        <RichTextRenderer record={record} />
                    </Typography>
                )}
                <View style={styles.footer}>
                    <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                    <Pressable style={styles.authorContainer}>
                        <Avatar 
                            uri={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} 
                            size="sm"
                            fallback={author.displayName?.charAt(0) || author.handle.charAt(0)}
                            accessibilityLabel={`${author.displayName}'s avatar`} 
                        />
                        <Typography variant="labelMedium" color="onSurfaceVariant" style={styles.authorName} numberOfLines={1}>
                            {author.displayName || `@${author.handle}`}
                        </Typography>
                    </Pressable>
                    </Link>
                    <Pressable 
                        onPress={(e) => { e.stopPropagation(); handleLike(e); }}
                        disabled={isLiking}
                        style={styles.likeButton}
                    >
                        <Heart size={16} color={likeUri ? theme.colors.pink : theme.colors.onSurfaceVariant} fill={likeUri ? theme.colors.pink : 'none'} />
                        {likeCount > 0 && <Text style={[styles.likeCount, !!likeUri && { color: theme.colors.pink }]}>{formatCompactNumber(likeCount)}</Text>}
                    </Pressable>
                </View>
            </View>
        </Card>
    );
});

// Create dynamic styles function
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
        likeCount: { ...theme.typography.labelMedium, color: theme.colors.onSurfaceVariant },
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

export default PostCard;