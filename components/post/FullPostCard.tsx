import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking, FlatList, Platform, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { formatCompactDate } from '@/lib/formatters';
import { BadgeCheck, Repeat, MessageCircle, ExternalLink, ChevronLeft, ChevronRight, PlayCircle, VolumeX, Volume2 } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import SharedVideoPlayer, { PlayerRef } from '../shared/VideoPlayer';
import ResizedImage from '../shared/ResizedImage';
import { theme } from '@/lib/theme';
import type { AVPlaybackStatusSuccess } from 'expo-av';

interface FullPostCardProps {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
}

type MediaItem = AppBskyEmbedImages.ViewImage | { type: 'video', view: AppBskyEmbedVideo.View };

const FullPostCard: React.FC<FullPostCardProps> = ({ feedViewPost }) => {
    const { agent } = useAtp();
    const { setPostForNav } = useUI();
    const router = useRouter();
    const { post, reason } = feedViewPost;
    const author = post.author;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

    const [isHovered, setIsHovered] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const [playbackUrls, setPlaybackUrls] = useState<Map<string, string>>(new Map());

    const playerRef = useRef<PlayerRef | null>(null);
    const [videoStatus, setVideoStatus] = useState<AVPlaybackStatusSuccess | null>(null);
    const { width } = useWindowDimensions();


    const fetchPlaybackUrl = useCallback(async (postUri: string, authorDid: string, videoCid: string) => {
        if (playbackUrls.has(postUri)) return;
        try {
            const res = await (agent.api.app.bsky.video as any).getPlaybackUrl({
                did: authorDid,
                cid: videoCid,
            });
            if (res.data.url) {
                setPlaybackUrls(prev => new Map(prev).set(postUri, res.data.url));
            }
        } catch (e) {
            console.warn(`Could not fetch playback URL for ${postUri}`, e);
        }
    }, [agent, playbackUrls]);

    useEffect(() => {
        if (post.embed) {
            let videoEmbed: AppBskyEmbedVideo.View | undefined;
            if (AppBskyEmbedVideo.isView(post.embed)) {
                videoEmbed = post.embed;
            } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
                if (AppBskyEmbedVideo.isView(post.embed.media)) {
                    videoEmbed = post.embed.media;
                }
            }

            if (videoEmbed) {
                fetchPlaybackUrl(post.uri, post.author.did, videoEmbed.cid);
            }
        }
    }, [post.embed, post.uri, post.author.did, fetchPlaybackUrl]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;
    
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const postLink = `/post/${author.did}/${post.uri.split('/').pop()}`;

    const handlePress = () => {
        setPostForNav(feedViewPost);
        router.push(postLink);
    };

    const handleVideoPress = async () => {
        if (!playerRef.current) return;
        if (videoStatus?.isPlaying) {
            await playerRef.current.pauseAsync();
        } else {
            await playerRef.current.playAsync();
        }
    };

    const toggleMute = async (e: any) => {
        e.stopPropagation();
        if (!playerRef.current) return;
        await playerRef.current.setIsMutedAsync(!videoStatus?.isMuted);
    };

    const renderMedia = () => {
        if (!post.embed) return null;

        const mediaItems: MediaItem[] = [];
        const processEmbed = (embed: unknown) => {
            if (AppBskyEmbedImages.isView(embed)) {
                mediaItems.push(...(embed as AppBskyEmbedImages.View).images);
            } else if (AppBskyEmbedVideo.isView(embed)) {
                mediaItems.push({ type: 'video', view: embed as AppBskyEmbedVideo.View });
            } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                processEmbed((embed as AppBskyEmbedRecordWithMedia.View).media);
            }
        };
        processEmbed(post.embed);

        if (mediaItems.length === 0) return null;
        
        const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
        
        if (mediaItems.length === 1) {
            const item = mediaItems[0];
            const isVideo = 'view' in item;

            const aspectRatio = isVideo
                ? (item as { view: AppBskyEmbedVideo.View }).view.aspectRatio
                    ? (item as { view: AppBskyEmbedVideo.View }).view.aspectRatio.width / (item as { view: AppBskyEmbedVideo.View }).view.aspectRatio.height
                    : 16 / 9
                : (item as AppBskyEmbedImages.ViewImage).aspectRatio
                    ? (item as AppBskyEmbedImages.ViewImage).aspectRatio.width / (item as AppBskyEmbedImages.ViewImage).aspectRatio.height
                    : 1.5;

            const mediaStyle = {
                marginTop: theme.spacing.s,
                borderRadius: theme.shape.medium,
                overflow: 'hidden',
                aspectRatio,
                maxHeight: 700,
                width: '100%',
                backgroundColor: 'black'
            } as const;

            if (isVideo) {
                const videoItem = item as { type: 'video', view: AppBskyEmbedVideo.View };
                const hlsUrl = playbackUrls.get(post.uri);
                const blobUrl = new URL('xrpc/com.atproto.sync.getBlob', agent.service.toString());
                blobUrl.searchParams.set('did', authorDid);
                blobUrl.searchParams.set('cid', videoItem.view.cid);
                const blobVideoUrl = blobUrl.toString();

                return (
                    <Pressable onPress={handleVideoPress} style={mediaStyle}>
                        <SharedVideoPlayer
                            onReady={(player) => { playerRef.current = player; }}
                            onPlaybackStatusUpdate={(status) => { if(status.isLoaded) setVideoStatus(status as AVPlaybackStatusSuccess) }}
                            options={{
                                autoplay: true,
                                controls: false,
                                poster: videoItem.view.thumbnail,
                                sources: [{ src: hlsUrl || blobVideoUrl, type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4' }],
                                loop: true,
                                muted: true,
                            }}
                            style={{ width: '100%', height: '100%' }}
                        />
                        {videoStatus && !videoStatus.isPlaying && (
                            <View style={styles.playButtonOverlay}>
                                <PlayCircle size={64} color="rgba(255, 255, 255, 0.8)" fill="rgba(0,0,0,0.3)" />
                            </View>
                        )}
                        <Pressable onPress={toggleMute} style={styles.muteButton}>
                            {videoStatus?.isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
                        </Pressable>
                    </Pressable>
                );
            } else {
                const imageItem = item as AppBskyEmbedImages.ViewImage;
                return (
                    <Pressable 
                        style={mediaStyle}
                        onPress={(e) => { e.stopPropagation(); Linking.openURL(imageItem.fullsize); }}
                        {...(Platform.OS === 'web' && {
                            onMouseEnter: () => setIsHovered(true),
                            onMouseLeave: () => setIsHovered(false),
                        } as any)}
                    >
                        <ResizedImage src={imageItem.thumb} resizeWidth={1200} alt={imageItem.alt || 'Post image'} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        <View style={[styles.imageOverlay, { opacity: (Platform.OS === 'web' && isHovered) ? 1 : 0 }]}><ExternalLink color="white" size={24} /></View>
                    </Pressable>
                );
            }
        }

        const firstItem = mediaItems[0];
        let slideshowAspectRatio;
        if ('view' in firstItem) {
            slideshowAspectRatio = firstItem.view.aspectRatio ? firstItem.view.aspectRatio.width / firstItem.view.aspectRatio.height : 16 / 9;
        } else {
            slideshowAspectRatio = firstItem.aspectRatio ? firstItem.aspectRatio.width / firstItem.aspectRatio.height : 1.5;
        }
        
        const isDesktop = width >= 768;
        const mainContentMaxWidth = 640;
        const navRailWidth = 80;
        const listPadding = theme.spacing.l * 2;

        const effectiveContentWidth = isDesktop
            ? Math.min(width - navRailWidth, mainContentMaxWidth)
            : width;
        
        const containerWidth = effectiveContentWidth - listPadding;
        
        const calculatedHeight = containerWidth / slideshowAspectRatio;
        const finalHeight = Math.min(calculatedHeight, 700);

        const renderSlideshowItem = ({ item }: { item: MediaItem }) => {
            const isVideo = 'type' in item && item.type === 'video';
            
            return (
                <View style={{ width: containerWidth, height: finalHeight, justifyContent: 'center' }}>
                    {isVideo ? (
                         (() => {
                            const videoItem = item as { type: 'video', view: AppBskyEmbedVideo.View };
                            const hlsUrl = playbackUrls.get(post.uri);
                            const blobUrl = new URL('xrpc/com.atproto.sync.getBlob', agent.service.toString());
                            blobUrl.searchParams.set('did', authorDid);
                            blobUrl.searchParams.set('cid', videoItem.view.cid);
                            const blobVideoUrl = blobUrl.toString();
                            return (
                                <SharedVideoPlayer
                                    options={{
                                        autoplay: false,
                                        controls: true,
                                        poster: videoItem.view.thumbnail,
                                        sources: [{ src: hlsUrl || blobVideoUrl, type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4' }],
                                        loop: false,
                                        muted: false,
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            );
                        })()
                    ) : (
                        <Pressable style={{width: '100%', height: '100%'}} onPress={(e) => { e.stopPropagation(); Linking.openURL((item as AppBskyEmbedImages.ViewImage).fullsize); }}>
                           <ResizedImage src={(item as AppBskyEmbedImages.ViewImage).thumb} resizeWidth={1200} alt={(item as AppBskyEmbedImages.ViewImage).alt} style={styles.slideshowImage} resizeMode="contain" />
                        </Pressable>
                    )}
                </View>
            );
        };

        const showArrows = true;

        const handlePrev = () => {
            if (currentIndex > 0) {
                flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
            }
        };
        const handleNext = () => {
            if (currentIndex < mediaItems.length - 1) {
                flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            }
        };

        return (
            <View style={styles.slideshowOuterContainer}>
                <View 
                    style={[styles.slideshowInnerContainer, { height: finalHeight }]}
                >
                    {/* @ts-ignore Type definitions for FlatList seem to be incorrect in this environment */}
                    <FlatList
                        ref={flatListRef}
                        data={mediaItems}
                        renderItem={renderSlideshowItem}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => 'type' in item ? item.view.cid : (item as AppBskyEmbedImages.ViewImage).thumb + index}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        style={StyleSheet.absoluteFillObject}
                        getItemLayout={(_, index) => ({
                            length: containerWidth,
                            offset: containerWidth * index,
                            index,
                        })}
                    />
                    <View style={styles.counterOverlay}>
                        <Text style={styles.counterText}>{currentIndex + 1} / {mediaItems.length}</Text>
                    </View>
                        {showArrows && currentIndex > 0 && (
                        <Pressable style={[styles.arrow, styles.arrowLeft]} onPress={handlePrev}>
                            <ChevronLeft style={styles.arrowIcon} color="white" size={24} />
                        </Pressable>
                    )}
                    {showArrows && currentIndex < mediaItems.length - 1 && (
                        <Pressable style={[styles.arrow, styles.arrowRight]} onPress={handleNext}>
                            <ChevronRight style={styles.arrowIcon} color="white" size={24} />
                        </Pressable>
                    )}
                </View>
                <View style={styles.dotsContainer}>
                    {mediaItems.map((_, index) => (
                        <View key={index} style={[styles.dot, index === currentIndex && styles.dotActive]} />
                    ))}
                </View>
            </View>
        );
    };
    
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
        return null;
    };

    const timeAgo = formatCompactDate(record.createdAt);

    return (
        <View>
            <Pressable onPress={handlePress}>
                {renderContext()}
                <View>
                    {renderMedia()}
                    {record.text && (
                        <Text style={styles.postText}>
                            <RichTextRenderer record={record} />
                        </Text>
                    )}
                    <Text style={styles.timestamp}>{timeAgo}</Text>
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
    timestamp: {
        ...theme.typography.bodySmall,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.s,
    },
    postText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurface,
        marginTop: theme.spacing.m,
    },
    slideshowOuterContainer: {
        marginTop: theme.spacing.s,
    },
    slideshowInnerContainer: {
        position: 'relative',
        borderRadius: theme.shape.medium,
        overflow: 'hidden',
        backgroundColor: '#000',
        width: '100%',
    },
    slideshowImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
        transition: 'opacity 0.2s',
    } as any,
    counterOverlay: {
        position: 'absolute',
        top: theme.spacing.m,
        right: theme.spacing.m,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: theme.shape.medium,
        paddingHorizontal: theme.spacing.s,
        paddingVertical: theme.spacing.xs,
        zIndex: 1,
    },
    counterText: {
        ...theme.typography.bodySmall,
        color: 'white',
        fontWeight: 'bold',
    },
    arrow: {
        position: 'absolute',
        top: '50%',
        marginTop: -20,
        width: 40,
        height: 40,
        borderRadius: theme.shape.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    arrowLeft: {
        left: theme.spacing.m,
    },
    arrowRight: {
        right: theme.spacing.m,
    },
    arrowIcon: {
        color: 'white'
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: theme.spacing.s,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.surfaceContainerHighest,
        marginHorizontal: theme.spacing.xs,
    },
    dotActive: {
        backgroundColor: theme.colors.primary,
    },
    playButtonOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    muteButton: {
        position: 'absolute',
        bottom: theme.spacing.m,
        right: theme.spacing.m,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: theme.spacing.s,
        borderRadius: theme.shape.full,
        zIndex: 1,
    },
});

export default FullPostCard;