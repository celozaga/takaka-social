import React from 'react';
import { Link } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages,AppBskyActorDefs, RichText, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { usePostActions } from '../../hooks/usePostActions';
import { Images, ExternalLink, PlayCircle, Heart, BadgeCheck, Repeat } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import PostCardSkeleton from './PostCardSkeleton';
import ResizedImage from '../shared/ResizedImage';
import SharedVideoPlayer from '../shared/VideoPlayer';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type PostCardProps = {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
    isClickable?: boolean;
    showAllMedia?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ feedViewPost, isClickable = true, showAllMedia = false }) => {
    const { agent } = useAtp();
    const moderation = useModeration();
    const [isContentVisible, setIsContentVisible] = React.useState(false);
    const [hlsUrl, setHlsUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!showAllMedia) return;

        const { post } = feedViewPost;
        const embed = post.embed;
        let videoEmbed: AppBskyEmbedVideo.View | undefined;

        if (AppBskyEmbedVideo.isView(embed)) {
            videoEmbed = embed;
        } else if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media)) {
            videoEmbed = embed.media as AppBskyEmbedVideo.View;
        }

        if (videoEmbed) {
            const fetchUrl = async () => {
                try {
                    const result = await (agent.api.app.bsky.video as any).getPlaybackUrl({
                        did: post.author.did,
                        cid: videoEmbed!.cid,
                    });
                    setHlsUrl(result.data.url);
                } catch (error) {
                    console.warn(`Could not get HLS playback URL for ${post.uri}, falling back to blob.`, error);
                    setHlsUrl(null);
                }
            };
            fetchUrl();
        }
    }, [showAllMedia, feedViewPost, agent]);
    
    const { post, reason } = feedViewPost;
    
    const modDecision = moderation.isReady ? moderatePost(post, moderation) : null;

    const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
    const author = post.author as AppBskyActorDefs.ProfileViewBasic;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
    const postText = record?.text || '';
    const rkey = post.uri.split('/').pop() as string;
    const postLink = `/post/${author.did}/${rkey}`;
    const profileLink = `/profile/${author.handle}`;

    const getMediaInfo = (p: AppBskyFeedDefs.PostView): { mediaPost: AppBskyFeedDefs.PostView, mediaEmbed: (AppBskyEmbedImages.View | AppBskyEmbedVideo.View) } | null => {
        const embed = p.embed;
        if (!embed) return null;
        if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) return { mediaPost: p, mediaEmbed: embed };
        if (AppBskyEmbedVideo.isView(embed)) return { mediaPost: p, mediaEmbed: embed };
        return null;
    }
    
    const mediaInfo = getMediaInfo(post);

    const renderMedia = () => {
        if (!mediaInfo) return null;
        
        const { mediaPost, mediaEmbed } = mediaInfo;
        const isRepost = reason && AppBskyFeedDefs.isReasonRepost(reason);

        if (AppBskyEmbedImages.isView(mediaEmbed)) {
            const embed = mediaEmbed;
            if (showAllMedia && embed.images.length > 0) {
                const gridCols = embed.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1';
                return (
                    <View style={styles.imageGrid}>
                        {embed.images.map((image, index) => {
                            return (
                                <Link key={index} href={image.fullsize} asChild>
                                <Pressable style={styles.imageGridItem}>
                                    <ResizedImage
                                        src={image.thumb}
                                        resizeWidth={400}
                                        alt={image.alt || `Post image ${index + 1}`}
                                        style={styles.image}
                                        loading="lazy"
                                    />
                                </Pressable>
                                </Link>
                            );
                        })}
                    </View>
                );
            }
            
            const firstImage = embed.images[0];
            if (!firstImage) return null;
            
            const hasMultipleImages = embed.images.length > 1;
            
            return (
                <View style={{ position: 'relative' }}>
                    <ResizedImage 
                        src={firstImage.thumb}
                        resizeWidth={400}
                        alt={firstImage.alt || 'Post image'} 
                        style={styles.image} 
                        loading="lazy"
                    />
                    {(hasMultipleImages || isRepost) && (
                         <View style={styles.mediaBadgeContainer}>
                            {isRepost && (
                                <View style={styles.mediaBadge}>
                                    <Repeat size={14} color="white" />
                                </View>
                            )}
                            {hasMultipleImages && (
                                <View style={[styles.mediaBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                    <Images size={14} color="white" />
                                    <Text style={styles.mediaBadgeText}>{embed.images.length}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );
        }

        if (AppBskyEmbedVideo.isView(mediaEmbed)) {
            const embedView = mediaEmbed;
            const authorDid = (mediaPost.author as AppBskyActorDefs.ProfileViewBasic).did;
            const videoCid = embedView.cid;
            const posterUrl = embedView.thumbnail;
            
            if (!authorDid || !videoCid || !agent.service) {
                return <View style={styles.videoPlaceholder}><Text style={styles.videoPlaceholderText}>Video data unavailable</Text></View>;
            }
            
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;

            if (showAllMedia) {
                const blobVideoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
                const playerOptions = {
                    autoplay: true,
                    controls: true,
                    poster: posterUrl,
                    sources: [{ 
                        src: hlsUrl || blobVideoUrl, 
                        type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4' 
                    }],
                    loop: true,
                    muted: true,
                    playsinline: true
                };
                return <SharedVideoPlayer options={playerOptions} className="w-full h-auto bg-black rounded-lg" />;
            }
            
            return (
                <View style={{ position: 'relative' }}>
                    <ResizedImage src={posterUrl || ''} resizeWidth={400} style={{...styles.image, backgroundColor: '#000'}} />
                    <View style={styles.mediaBadgeContainer}>
                        {isRepost && (
                            <View style={styles.mediaBadge}>
                                <Repeat size={14} color="white" />
                            </View>
                        )}
                        <View style={styles.mediaBadge}>
                            <PlayCircle size={14} color="white" />
                        </View>
                    </View>
                </View>
            );
        }

        return null;
    };

    const renderContext = () => {
        if (reason && AppBskyFeedDefs.isReasonRepost(reason)) {
            return (
                <View style={styles.contextContainer}>
                    <Repeat size={14} color="#C3C6CF" />
                    <Text style={styles.contextText} numberOfLines={1}>
                        Reposted by <Link href={`/profile/${reason.by.handle}` as any} style={styles.contextLink} onPress={e => e.stopPropagation()}>{reason.by.displayName || `@${reason.by.handle}`}</Link>
                    </Text>
                </View>
            );
        }
    
        return null;
    };
    
    if (!modDecision) {
        return <View style={styles.container}><PostCardSkeleton /></View>;
    }
    
    if (modDecision.visibility === 'hide') {
        return null;
    }
    
    if (modDecision.visibility === 'warn' && !isContentVisible) {
        return (
             <View style={styles.card}>
                <ContentWarning 
                    reason={modDecision.reason!} 
                    onShow={() => setIsContentVisible(true)} 
                />
            </View>
        );
    }


    const mediaElement = renderMedia();
    if (!mediaElement) return null;
    
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if(isClickable) {
            return <Link href={postLink as any} asChild><Pressable>{children}</Pressable></Link>
        }
        return <View>{children}</View>;
    }


    return (
         <View style={styles.card}>
            <Wrapper>{mediaElement}</Wrapper>
            <View style={styles.content}>
                {renderContext()}
                {postText && (
                    <Wrapper>
                        <View style={{ marginBottom: 8 }}>
                            <Text style={styles.postText} numberOfLines={3}>
                                <RichTextRenderer record={record} />
                            </Text>
                        </View>
                    </Wrapper>
                )}
                 <View style={styles.footer}>
                   <Link href={profileLink as any} style={styles.authorContainer} asChild>
                    <Pressable>
                     <ResizedImage 
                        src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') || `https://picsum.photos/seed/${author.did}/24`} 
                        alt={`${author.displayName}'s avatar`} 
                        style={styles.avatar} 
                        resizeWidth={48}
                        loading="lazy"
                     />
                     <View style={styles.authorInfo}>
                        <Text style={styles.authorName} numberOfLines={1}>{author.displayName || `@${author.handle}`}</Text>
                        {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                            <BadgeCheck size={14} color="#A8C7FA" fill="currentColor" style={{ flexShrink: 0 }} />
                        )}
                     </View>
                    </Pressable>
                   </Link>
                   <Pressable 
                        onPress={(e) => { e.stopPropagation(); handleLike(e); }}
                        disabled={isLiking}
                        style={styles.likeButton}
                    >
                        <Heart size={16} color={likeUri ? '#ec4899' : '#C3C6CF'} fill={likeUri ? '#ec4899' : 'none'} />
                        <Text style={[styles.likeCount, !!likeUri && { color: '#ec4899'}]}>{likeCount}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // @ts-ignore: breakInside is a web-only property for column layout
        breakInside: 'avoid',
        marginBottom: 16
    },
    card: {
        backgroundColor: '#1E2021',
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'column'
    },
    image: {
        width: '100%',
        height: 'auto',
        aspectRatio: 1,
        objectFit: 'cover',
    },
    imageGrid: {
        display: 'grid' as any,
        gap: 6,
    },
    imageGridItem: {
        backgroundColor: '#2b2d2e',
        borderRadius: 6,
        overflow: 'hidden',
        aspectRatio: 1
    },
    videoPlaceholder: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#2b2d2e',
        alignItems: 'center',
        justifyContent: 'center'
    },
    videoPlaceholderText: {
        color: '#C3C6CF'
    },
    mediaBadgeContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        gap: 6,
    },
    mediaBadge: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mediaBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    contextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    contextText: {
        color: '#C3C6CF',
        fontSize: 12,
    },
    contextLink: {
        textDecorationLine: 'underline',
    },
    postText: {
        fontSize: 14,
        color: '#E2E2E6',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 8,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 999,
        backgroundColor: '#2b2d2e',
        flexShrink: 0,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        minWidth: 0,
    },
    authorName: {
        color: '#E2E2E6',
        fontWeight: '600',
        fontSize: 12,
        flex: 1,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    likeCount: {
        fontWeight: '600',
        fontSize: 12,
        color: '#C3C6CF',
    }
} as any);

export default React.memo(PostCard);
