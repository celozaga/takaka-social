import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking, FlatList, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Repeat, MessageCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import PostActions from './PostActions';
import SharedVideoPlayer from '../shared/VideoPlayer';
import ResizedImage from '../shared/ResizedImage';
import { theme } from '@/lib/theme';

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

    const [containerWidth, setContainerWidth] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

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
            
            let aspectRatio;
            if ('view' in item) { // item is a video
                aspectRatio = item.view.aspectRatio ? item.view.aspectRatio.width / item.view.aspectRatio.height : 16 / 9;
            } else { // item is an image
                aspectRatio = item.aspectRatio ? item.aspectRatio.width / item.aspectRatio.height : 1.5;
            }

            return (
                <View style={{ maxHeight: 1000, marginTop: theme.spacing.s, aspectRatio: aspectRatio, width: '100%' }}>
                    {'view' in item ? (
                        <SharedVideoPlayer
                            options={{
                                autoplay: true,
                                controls: true,
                                poster: (item as { type: 'video', view: AppBskyEmbedVideo.View }).view.thumbnail,
                                sources: [{ src: `${agent.service.toString()}/xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${(item as { type: 'video', view: AppBskyEmbedVideo.View }).view.cid}`, type: 'video/mp4' }],
                                loop: true,
                                muted: true,
                            }}
                            style={{ width: '100%', height: '100%', borderRadius: theme.shape.medium }}
                        />
                    ) : (
                        <Pressable onPress={(e) => { e.stopPropagation(); Linking.openURL((item as AppBskyEmbedImages.ViewImage).fullsize); }}>
                            <ResizedImage src={(item as AppBskyEmbedImages.ViewImage).thumb} resizeWidth={1200} alt={(item as AppBskyEmbedImages.ViewImage).alt || 'Post image'} style={styles.singleImage} resizeMode="contain" />
                            <View style={styles.imageOverlay}><ExternalLink color="white" size={24} /></View>
                        </Pressable>
                    )}
                </View>
            );
        }

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

        const renderSlideshowItem = ({ item }: { item: MediaItem }) => {
            const isVideo = 'type' in item && item.type === 'video';
            return (
                <View style={{ width: containerWidth, height: '100%', justifyContent: 'center' }}>
                    {isVideo ? (
                         <SharedVideoPlayer
                            options={{
                                autoplay: false,
                                controls: true,
                                poster: (item as { type: 'video', view: AppBskyEmbedVideo.View }).view.thumbnail,
                                sources: [{ src: `${agent.service.toString()}/xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${(item as { type: 'video', view: AppBskyEmbedVideo.View }).view.cid}`, type: 'video/mp4' }],
                                loop: false,
                                muted: false,
                            }}
                            style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        <Pressable onPress={(e) => { e.stopPropagation(); Linking.openURL((item as AppBskyEmbedImages.ViewImage).fullsize); }}>
                           <ResizedImage src={(item as AppBskyEmbedImages.ViewImage).thumb} resizeWidth={1200} alt={(item as AppBskyEmbedImages.ViewImage).alt} style={styles.slideshowImage} resizeMode="contain" />
                        </Pressable>
                    )}
                </View>
            );
        };
        
        const showArrows = Platform.OS !== 'web' || isHovered;

        return (
            <View style={styles.slideshowOuterContainer} onLayout={onLayout}>
                {containerWidth > 0 && (
                    <View 
                        style={styles.slideshowInnerContainer}
                        {...(Platform.OS === 'web' && {
                            onMouseEnter: () => setIsHovered(true),
                            onMouseLeave: () => setIsHovered(false),
                        } as any)}
                    >
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
                            style={{ width: containerWidth, borderRadius: theme.shape.medium }}
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
                )}
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
        // Reply context is removed as per user request to not show replies in feeds.
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
                        {/* Quoted posts are removed as per user request */}
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
    slideshowOuterContainer: {
        marginTop: theme.spacing.s,
    },
    slideshowInnerContainer: {
        maxHeight: 1000,
        borderRadius: theme.shape.medium,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    slideshowImage: {
        width: '100%',
        height: '100%',
    },
    singleImage: {
        width: '100%',
        height: '100%',
        borderRadius: theme.shape.medium
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    counterOverlay: {
        position: 'absolute',
        top: theme.spacing.m,
        right: theme.spacing.m,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: theme.shape.medium,
        paddingHorizontal: theme.spacing.s,
        paddingVertical: theme.spacing.xs,
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
    actionsContainer: {
        marginTop: theme.spacing.m,
    }
});

export default FullPostCard;
