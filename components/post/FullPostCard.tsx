import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyActorDefs, AppBskyEmbedRecord } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Repeat, MessageCircle, ExternalLink } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import PostActions from './PostActions';
import SharedVideoPlayer from '../shared/VideoPlayer';
import ResizedImage from '../shared/ResizedImage';
import QuotedPost from './QuotedPost';
import { theme } from '@/lib/theme';

interface FullPostCardProps {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
}

const FullPostCard: React.FC<FullPostCardProps> = ({ feedViewPost }) => {
    const { agent } = useAtp();
    const { setPostForNav } = useUI();
    const router = useRouter();
    const { post, reason, reply } = feedViewPost;
    const author = post.author;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

    const postLink = `/post/${author.did}/${post.uri.split('/').pop()}`;

    const handlePress = () => {
        setPostForNav(feedViewPost);
        router.push(postLink);
    };

    const renderMedia = () => {
        if (!post.embed) return null;
        
        const processImageEmbed = (embed: AppBskyEmbedImages.View) => {
            if (embed.images.length === 0) return null;

            return (
                <View style={styles.mediaGrid}>
                    {embed.images.map((image, index) => (
                        <Pressable 
                            onPress={(e) => { e.stopPropagation(); Linking.openURL(image.fullsize); }}
                            key={index} 
                            style={[styles.imageGridItem, { width: embed.images.length > 1 ? '49%' : '100%', aspectRatio: embed.images.length > 1 ? 1 : (image.aspectRatio ? image.aspectRatio.width / image.aspectRatio.height : 1.5) }]}
                        >
                            <ResizedImage src={image.thumb} resizeWidth={600} alt={image.alt || `Post image ${index + 1}`} style={styles.gridImage} />
                             <View style={styles.imageOverlay}>
                                <ExternalLink color="white" size={24} />
                            </View>
                        </Pressable>
                    ))}
                </View>
            );
        };
        
        const processVideoEmbed = (embedView: AppBskyEmbedVideo.View) => {
            const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
            const videoCid = embedView.cid;
            if (!authorDid || !videoCid || !agent.service) return null;
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
            const videoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
            const playerOptions = { autoplay: true, controls: true, poster: embedView.thumbnail, sources: [{ src: videoUrl, type: 'video/mp4' }], loop: true, muted: true, playsinline: true };
            const videoAspectRatio = embedView.aspectRatio
                ? embedView.aspectRatio.width / embedView.aspectRatio.height
                : 16 / 9;
            return <Pressable onPress={(e) => e.stopPropagation()}><SharedVideoPlayer options={playerOptions} style={{ width: '100%', aspectRatio: videoAspectRatio, backgroundColor: 'black', borderRadius: theme.shape.medium, marginTop: theme.spacing.s }} /></Pressable>;
        }

        const embed = post.embed;
        if (AppBskyEmbedImages.isView(embed)) return processImageEmbed(embed);
        if (AppBskyEmbedVideo.isView(embed)) return processVideoEmbed(embed);
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            const media = embed.media;
            if (AppBskyEmbedImages.isView(media)) return processImageEmbed(media);
            if (AppBskyEmbedVideo.isView(media)) return processVideoEmbed(media);
        }
        return null;
    };
    
    const renderQuotedPost = () => {
        if (!post.embed) return null;
        const embed = post.embed;
        if (AppBskyEmbedRecord.isView(embed)) {
            return <QuotedPost embed={embed} />;
        }
        if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedRecord.isView(embed.record)) {
            return <QuotedPost embed={embed.record} />;
        }
        return null;
    }
    
     const renderContext = () => {
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
    
        if (reply && AppBskyFeedDefs.isPostView(reply.parent)) {
            return (
                <View style={styles.contextContainer}>
                    <MessageCircle size={14} color={theme.colors.onSurfaceVariant} />
                     <Text style={styles.contextText} numberOfLines={1}>
                        Reply to{' '}
                        <Link href={`/profile/${reply.parent.author.handle}` as any} onPress={e => e.stopPropagation()} asChild>
                            <Text style={styles.contextLink}>{reply.parent.author.displayName || `@${reply.parent.author.handle}`}</Text>
                        </Link>
                    </Text>
                </View>
            );
        }
        return null;
    };


    return (
        <View>
            <Pressable onPress={handlePress}>
                {renderContext()}
                <View style={styles.mainRow}>
                    <Link href={`/profile/${author.handle}` as any} onPress={e => e.stopPropagation()} asChild>
                        <Pressable>
                            <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                        </Pressable>
                    </Link>
                    <View style={styles.postContent}>
                        <View style={styles.authorInfo}>
                            <Link href={`/profile/${author.handle}` as any} onPress={e => e.stopPropagation()} asChild>
                                <Pressable style={styles.authorNameContainer}>
                                    <Text style={styles.authorName} numberOfLines={1}>{author.displayName || `@${author.handle}`}</Text>
                                    {author.labels?.some(l => l.val === 'blue-check') && (
                                        <BadgeCheck size={16} color={theme.colors.primary} fill="currentColor" />
                                    )}
                                </Pressable>
                            </Link>
                             <Text style={styles.timestamp}>· {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}</Text>
                        </View>
                        {record.text && (
                            <Text style={styles.postText}>
                                <RichTextRenderer record={record} />
                            </Text>
                        )}
                        {renderMedia()}
                        {renderQuotedPost()}
                        <View style={styles.actionsContainer}>
                            <PostActions post={post} />
                        </View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    contextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
        marginBottom: theme.spacing.s,
    },
    contextText: {
        ...theme.typography.bodySmall,
        color: theme.colors.onSurfaceVariant,
        flexShrink: 1
    },
    contextLink: {
        textDecorationLine: 'underline'
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.m,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    postContent: {
        flex: 1,
        minWidth: 0,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    authorNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        flexShrink: 1,
    },
    authorName: {
        ...theme.typography.titleMedium,
        color: theme.colors.onSurface,
        flexShrink: 1,
    },
    timestamp: {
        ...theme.typography.bodySmall,
        color: theme.colors.onSurfaceVariant,
        flexShrink: 0,
    },
    postText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurface,
        marginTop: theme.spacing.xs,
    },
    mediaGrid: {
        marginTop: theme.spacing.s,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        borderRadius: theme.shape.medium,
        overflow: 'hidden',
    },
    imageGridItem: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0, // This would need state to handle hover
    },
    actionsContainer: {
        marginTop: theme.spacing.m,
    }
});

export default FullPostCard;
