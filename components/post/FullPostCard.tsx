import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, FlatList, Platform, StyleProp, ViewStyle, useWindowDimensions, FlatListProps } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { formatCompactDate } from '@/lib/formatters';
import { BadgeCheck, Repeat, MessageCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import VideoPlayer from '../shared/VideoPlayer';
import { OptimizedImage } from '../ui';
import { useTheme } from '@/components/shared';
// removed direct useVideoPlayback in slideshow; we reuse shared VideoPlayer

interface FullPostCardProps {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
}

type MediaItem = AppBskyEmbedImages.ViewImage | { type: 'video', view: AppBskyEmbedVideo.View };

const FullPostCard: React.FC<FullPostCardProps> = ({ feedViewPost }) => {
  console.log('🎬 FullPostCard: COMPONENT CALLED with feedViewPost:', {
    hasFeedViewPost: !!feedViewPost,
    hasPost: !!feedViewPost?.post,
    postUri: feedViewPost?.post?.uri,
    hasEmbed: !!feedViewPost?.post?.embed,
    embedType: feedViewPost?.post?.embed?.$type
  });

  console.log('🎬 FullPostCard: ABOUT TO CALL useUI()');
  const { setPostForNav } = useUI();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  console.log('🎬 FullPostCard: useUI() called successfully');
  
  console.log('🎬 FullPostCard: ABOUT TO CALL useRouter()');
  const router = useRouter();
  console.log('🎬 FullPostCard: useRouter() called successfully');
  
  console.log('🎬 FullPostCard: ABOUT TO DESTRUCTURE feedViewPost');
  const { post, reason } = feedViewPost;
  console.log('🎬 FullPostCard: Destructuring successful:', { hasPost: !!post, hasReason: !!reason });
    const author = post.author;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

    const [isHovered, setIsHovered] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const { width } = useWindowDimensions();


    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;
    
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const postLink = `/post/${author.did}/${post.uri.split('/').pop()}`;

    const handlePress = () => {
        setPostForNav(feedViewPost);
        router.push(postLink as any);
    };

    const renderMedia = () => {
        if (!post.embed) {
            console.log('🎬 FullPostCard: No post.embed found');
            return null;
        }

        console.log('🎬 FullPostCard: Post has embed:', {
            embedType: post.embed.$type,
            hasEmbed: !!post.embed
        });

        const mediaItems: MediaItem[] = [];
        let videoEmbed: AppBskyEmbedVideo.View | undefined;

        const processEmbed = (embed: unknown) => {
            console.log('🎬 FullPostCard: Processing embed:', {
                embedType: (embed as any)?.$type,
                isVideo: AppBskyEmbedVideo.isView(embed),
                isImage: AppBskyEmbedImages.isView(embed),
                isRecordWithMedia: AppBskyEmbedRecordWithMedia.isView(embed)
            });

            if (AppBskyEmbedImages.isView(embed)) {
                console.log('🎬 FullPostCard: Processing image embed');
                mediaItems.push(...(embed as AppBskyEmbedImages.View).images);
            } else if (AppBskyEmbedVideo.isView(embed)) {
                console.log('🎬 FullPostCard: Processing video embed');
                const view = embed as AppBskyEmbedVideo.View;
                mediaItems.push({ type: 'video', view });
                videoEmbed = view; // Capture video embed for single video case
                console.log('🎬 FullPostCard: Video embed captured:', {
                    cid: view.cid,
                    hasPlaylist: !!view.playlist,
                    playlistUrl: view.playlist
                });
            } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                console.log('🎬 FullPostCard: Processing record with media embed');
                processEmbed((embed as AppBskyEmbedRecordWithMedia.View).media);
            }
        };
        processEmbed(post.embed);

        console.log('🎬 FullPostCard: Media processing complete:', {
            mediaItemsLength: mediaItems.length,
            hasVideoEmbed: !!videoEmbed,
            mediaItemTypes: mediaItems.map(item => 'type' in item ? item.type : 'image')
        });

        if (mediaItems.length === 0) {
            console.log('🎬 FullPostCard: No media items found');
            return null;
        }
        
        const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
        
        if (mediaItems.length === 1) {
            const item = mediaItems[0];
            const isVideo = 'view' in item;

            console.log('🎬 FullPostCard: Single media item:', {
                isVideo,
                itemType: 'type' in item ? item.type : 'image',
                hasVideoEmbed: !!videoEmbed
            });

            const aspectRatio = isVideo
                ? (item as { view: AppBskyEmbedVideo.View }).view.aspectRatio
                    ? (item as { view: AppBskyEmbedVideo.View }).view.aspectRatio?.width / (item as { view: AppBskyEmbedVideo.View }).view.aspectRatio?.height
                    : 16 / 9
                : (item as AppBskyEmbedImages.ViewImage).aspectRatio
                    ? (item as AppBskyEmbedImages.ViewImage).aspectRatio?.width / (item as AppBskyEmbedImages.ViewImage).aspectRatio?.height
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

            if (isVideo && videoEmbed) {
                console.log('🎬 FullPostCard: Rendering VideoPlayer');
                return (
                    <VideoPlayer
                        post={post}
                        style={mediaStyle}
                    />
                );
            } else {
                console.log('🎬 FullPostCard: Rendering image (not video or no videoEmbed)');
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
                        <OptimizedImage source={imageItem.thumb} accessibilityLabel={imageItem.alt || 'Post image'} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={300} />
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

        const SlideshowVideoItem: React.FC<{item: { type: 'video', view: AppBskyEmbedVideo.View }}> = ({item}) => {
            // Monta um PostView mínimo para reutilizar o VideoPlayer unificado
            const miniPost = {
                uri: `${post.uri}#slideshow`,
                author: { ...(post.author as any), did: authorDid },
                embed: item.view,
            } as unknown as AppBskyFeedDefs.PostView;
            return <VideoPlayer post={miniPost} style={{ width: '100%', height: '100%' }} />;
        }

        const renderSlideshowItem = ({ item }: { item: MediaItem }) => {
            const isVideo = 'type' in item && item.type === 'video';
            
            return (
                <View style={{ width: containerWidth, height: finalHeight, justifyContent: 'center' }}>
                    {isVideo ? (
                        <SlideshowVideoItem item={item as { type: 'video', view: AppBskyEmbedVideo.View }} />
                    ) : (
                        <Pressable style={{width: '100%', height: '100%'}} onPress={(e) => { e.stopPropagation(); Linking.openURL((item as AppBskyEmbedImages.ViewImage).fullsize); }}>
                           <OptimizedImage source={(item as AppBskyEmbedImages.ViewImage).thumb} accessibilityLabel={(item as AppBskyEmbedImages.ViewImage).alt} style={styles.slideshowImage} contentFit="contain" transition={300} />
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

        const flatListProps: FlatListProps<MediaItem> = {
            data: mediaItems,
            renderItem: renderSlideshowItem,
            horizontal: true,
            pagingEnabled: true,
            showsHorizontalScrollIndicator: false,
            keyExtractor: (item: MediaItem, index: number) => 'type' in item ? item.view.cid : (item as AppBskyEmbedImages.ViewImage).thumb + index,
            onViewableItemsChanged,
            viewabilityConfig,
            style: StyleSheet.absoluteFillObject,
            getItemLayout: (_: any, index: number) => ({
                length: containerWidth,
                offset: containerWidth * index,
                index,
            }),
        };

        return (
            <View style={styles.slideshowOuterContainer}>
                <View 
                    style={[styles.slideshowInnerContainer, { height: finalHeight }]}
                >
                    <FlatList ref={flatListRef} {...flatListProps} />
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

const createStyles = (theme: any) => StyleSheet.create({
    contextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    contextText: {
        fontSize: theme.typography.bodySmall.fontSize,
        color: theme.colors.onSurfaceVariant,
        flexShrink: 1
    },
    contextLink: {
        textDecorationLine: 'underline'
    },
    timestamp: {
        fontSize: theme.typography.bodySmall.fontSize,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.sm,
    },
    postText: {
        fontSize: theme.typography.bodyMedium.fontSize,
        color: theme.colors.onSurface,
        marginTop: theme.spacing.md,
    },
    slideshowOuterContainer: {
        marginTop: theme.spacing.sm,
    },
    slideshowInnerContainer: {
        position: 'relative',
        borderRadius: theme.radius.md,
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
        top: theme.spacing.md,
        right: theme.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        zIndex: 1,
    },
    counterText: {
        fontSize: theme.typography.bodySmall.fontSize,
        color: 'white',
        fontWeight: 'bold',
    },
    arrow: {
        position: 'absolute',
        top: '50%',
        marginTop: -20,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    arrowLeft: {
        left: theme.spacing.md,
    },
    arrowRight: {
        right: theme.spacing.md,
    },
    arrowIcon: {
        color: 'white'
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: theme.spacing.sm,
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
    }
});

export default FullPostCard;