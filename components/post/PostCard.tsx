import React from 'react';
import { Link, useRouter } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages,AppBskyActorDefs, RichText,AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { Images, PlayCircle, Heart, Repeat } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import PostCardSkeleton from './PostCardSkeleton';
import ResizedImage from '../shared/ResizedImage';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';
import Card from '../ui/Card';
import { formatCompactNumber } from '@/lib/formatters';

type PostCardProps = {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
    isClickable?: boolean;
    style?: StyleProp<ViewStyle>;
}

const PostCard: React.FC<PostCardProps> = ({ feedViewPost, isClickable = true, style }) => {
    const { setPostForNav } = useUI();
    const router = useRouter();
    const moderation = useModeration();
    const [isContentVisible, setIsContentVisible] = React.useState(false);

    const { post, reason } = feedViewPost;
    
    const modDecision = moderation.isReady ? moderatePost(post, moderation) : null;

    const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
    const author = post.author as AppBskyActorDefs.ProfileViewBasic;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
    const rkey = post.uri.split('/').pop() as string;
    const postLink = `/post/${author.did}/${rkey}`;
    const profileLink = `/profile/${author.handle}`;

    const handlePress = () => {
        if (!isClickable) return;
        setPostForNav(feedViewPost);
        router.push(postLink);
    };

    const getMediaInfo = (p: AppBskyFeedDefs.PostView): { mediaEmbed: (AppBskyEmbedImages.View | AppBskyEmbedVideo.View) } | null => {
        const embed = p.embed;
        if (!embed) return null;
        if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) return { mediaEmbed: embed };
        if (AppBskyEmbedVideo.isView(embed)) return { mediaEmbed: embed };
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            if (AppBskyEmbedImages.isView(embed.media) && embed.media.images.length > 0) return { mediaEmbed: embed.media };
            if (AppBskyEmbedVideo.isView(embed.media)) return { mediaEmbed: embed.media };
        }
        return null;
    }
    
    const mediaInfo = getMediaInfo(post);

    const renderMedia = () => {
        if (!mediaInfo) return null;
        
        const { mediaEmbed } = mediaInfo;
        const isRepost = reason && AppBskyFeedDefs.isReasonRepost(reason);

        if (AppBskyEmbedImages.isView(mediaEmbed)) {
            const firstImage = mediaEmbed.images[0];
            const hasMultipleImages = mediaEmbed.images.length > 1;
            const imageAspectRatio = firstImage.aspectRatio
                ? firstImage.aspectRatio.width / firstImage.aspectRatio.height
                : 1;
            
            return (
                <View>
                    <ResizedImage 
                        src={firstImage.thumb}
                        resizeWidth={400}
                        alt={firstImage.alt || 'Post image'} 
                        style={[styles.image, { aspectRatio: imageAspectRatio }]} 
                    />
                    {(hasMultipleImages || isRepost) && (
                         <View style={styles.mediaBadgeContainer}>
                            {isRepost && <View style={styles.mediaBadge}><Repeat size={14} color="white" /></View>}
                            {hasMultipleImages && (
                                <View style={[styles.mediaBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                    <Images size={14} color="white" />
                                    <Text style={styles.mediaBadgeText}>{mediaEmbed.images.length}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );
        }

        if (AppBskyEmbedVideo.isView(mediaEmbed)) {
            const posterUrl = mediaEmbed.thumbnail;
            const videoAspectRatio = mediaEmbed.aspectRatio
                ? mediaEmbed.aspectRatio.width / mediaEmbed.aspectRatio.height
                : 16 / 9;
            
            return (
                <View>
                    <ResizedImage src={posterUrl || ''} resizeWidth={400} alt="Video poster" style={[styles.image, styles.videoPoster, {backgroundColor: '#000', aspectRatio: videoAspectRatio}]} />
                    <View style={styles.mediaBadgeContainer}>
                        {isRepost && <View style={styles.mediaBadge}><Repeat size={14} color="white" /></View>}
                        <View style={styles.mediaBadge}><PlayCircle size={14} color="white" /></View>
                    </View>
                </View>
            );
        }
        return null;
    };
    
    if (!modDecision) return <PostCardSkeleton />;
    if (modDecision.visibility === 'hide') return null;
    if (modDecision.visibility === 'warn' && !isContentVisible) {
        return <ContentWarning reason={modDecision.reason!} onShow={() => setIsContentVisible(true)} />;
    }

    const mediaElement = renderMedia();
    if (!mediaElement) return null;

    return (
        <Card onPress={handlePress} style={style}>
            {mediaElement}
            <View style={styles.content}>
                {record?.text && (
                    <Text style={styles.postText} numberOfLines={2}>
                        <RichTextRenderer record={record} />
                    </Text>
                )}
                <View style={styles.footer}>
                    <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                    <Pressable style={styles.authorContainer}>
                        <ResizedImage 
                            src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} 
                            alt={`${author.displayName}'s avatar`} 
                            style={styles.avatar} 
                            resizeWidth={48}
                        />
                        <Text style={styles.authorName} numberOfLines={1}>{author.displayName || `@${author.handle}`}</Text>
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
};

const styles = StyleSheet.create({
    image: { width: '100%', resizeMode: 'cover' },
    videoPoster: { resizeMode: 'contain' },
    mediaBadgeContainer: { position: 'absolute', top: theme.spacing.s, right: theme.spacing.s, flexDirection: 'row', gap: theme.spacing.xs },
    mediaBadge: { backgroundColor: 'rgba(0,0,0,0.7)', padding: theme.spacing.xs, borderRadius: theme.shape.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    mediaBadgeText: { ...theme.typography.labelSmall, color: 'white' },
    content: { padding: theme.spacing.m, gap: theme.spacing.s },
    postText: { ...theme.typography.bodyMedium, color: theme.colors.onSurface },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.s },
    authorContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, flex: 1, minWidth: 0 },
    avatar: { width: 24, height: 24, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh },
    authorName: { ...theme.typography.labelMedium, color: theme.colors.onSurfaceVariant, flexShrink: 1 },
    likeButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, padding: theme.spacing.xs, margin: -theme.spacing.xs },
    likeCount: { ...theme.typography.labelMedium, color: theme.colors.onSurfaceVariant },
});

export default React.memo(PostCard);