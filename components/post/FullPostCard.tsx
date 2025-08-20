
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking } from 'react-native';
import { Link } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Repeat, MessageCircle, ExternalLink } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import PostActions from './PostActions';
import SharedVideoPlayer from '../shared/VideoPlayer';
import ResizedImage from '../shared/ResizedImage';

interface FullPostCardProps {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
}

const FullPostCard: React.FC<FullPostCardProps> = ({ feedViewPost }) => {
    const { agent } = useAtp();
    const { post, reason, reply } = feedViewPost;
    const author = post.author;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

    const postLink = `/post/${author.did}/${post.uri.split('/').pop()}`;

    const renderMedia = () => {
        if (!post.embed) return null;
        
        const processImageEmbed = (embed: AppBskyEmbedImages.View) => {
            if (embed.images.length === 0) return null;

            return (
                <View style={styles.mediaGrid}>
                    {embed.images.map((image, index) => (
                        <Pressable 
                            onPress={() => Linking.openURL(image.fullsize)}
                            key={index} 
                            style={[styles.imageGridItem, { width: embed.images.length > 1 ? '50%' : '100%' }]}
                        >
                            <ResizedImage src={image.thumb} resizeWidth={400} alt={image.alt || `Post image ${index + 1}`} style={styles.gridImage} />
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
            return <SharedVideoPlayer options={playerOptions} className="w-full h-auto bg-black rounded-lg mt-2" />;
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
    
     const renderContext = () => {
        if (reason && AppBskyFeedDefs.isReasonRepost(reason)) {
            return (
                <View style={styles.contextContainer}>
                    <Repeat size={14} color="#C3C6CF" />
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
                    <MessageCircle size={14} color="#C3C6CF" />
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
        <View style={styles.container}>
            <Link href={postLink as any} asChild>
                <Pressable style={({pressed}) => [styles.pressableCard, pressed && styles.pressableCardPressed]}>
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
                                        {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                            <BadgeCheck size={14} color="#A8C7FA" fill="currentColor" />
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
                            <View style={styles.actionsContainer}>
                                <PostActions post={post} />
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Link>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
    },
    pressableCard: {
        padding: 16,
        backgroundColor: '#2b2d2e',
        borderRadius: 12,
    },
    pressableCardPressed: {
        backgroundColor: '#3c3f41',
    },
    contextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        color: '#C3C6CF',
        fontSize: 12,
        marginBottom: 8,
    },
    contextText: {
        color: '#C3C6CF',
        fontSize: 12,
        flexShrink: 1
    },
    contextLink: {
        textDecorationLine: 'underline'
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2b2d2e',
    },
    postContent: {
        flex: 1,
        minWidth: 0,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        fontSize: 14,
    },
    authorNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
    },
    authorName: {
        fontWeight: 'bold',
        color: '#E2E2E6',
        flexShrink: 1,
    },
    timestamp: {
        color: '#C3C6CF',
        flexShrink: 0,
    },
    postText: {
        color: '#E2E2E6',
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
    },
    mediaGrid: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -3,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageGridItem: {
        padding: 3,
        aspectRatio: 1,
        backgroundColor: '#2b2d2e',
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
        marginTop: 12,
    }
});

export default FullPostCard;
