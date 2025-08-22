import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPlayer from './VideoPlayer';
import { ArrowLeft } from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';

const WatchScreen: React.FC = () => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const router = useRouter();
    const { height, width } = useWindowDimensions();
    const [videoPosts, setVideoPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [playbackUrls, setPlaybackUrls] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const isPostVideo = (p: AppBskyFeedDefs.PostView) => p.embed && (AppBskyEmbedVideo.isView(p.embed) || (AppBskyEmbedRecordWithMedia.isView(p.embed) && AppBskyEmbedVideo.isView(p.embed.media)));

    const fetchVideos = useCallback(async (currentCursor?: string) => {
        if (isLoadingMore || (!hasMore && currentCursor)) return;
        setIsLoadingMore(true);
        
        try {
            let fetchedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
            let nextCursor = currentCursor;
            let attempts = 0;
            while (fetchedPosts.filter(p => isPostVideo(p.post)).length < 5 && attempts < 5 && hasMore) {
                attempts++;
                const res = await agent.app.bsky.feed.getFeed({ feed: DISCOVER_FEED_URI, cursor: nextCursor, limit: 50 });
                fetchedPosts.push(...res.data.feed);
                nextCursor = res.data.cursor;
                if (!nextCursor) { setHasMore(false); break; }
            }
            const newVideoPosts = fetchedPosts.filter(p => isPostVideo(p.post));
            setVideoPosts(prev => [...prev, ...newVideoPosts.filter(p => !prev.some(e => e.post.uri === p.post.uri))]);
            setCursor(nextCursor);
        } catch (err: any) { setError(t('timeline.loadingError')); } finally { setIsLoading(false); setIsLoadingMore(false); }
    }, [agent, hasMore, isLoadingMore, t]);

    const prefetchNextUrl = useCallback(async (post: AppBskyFeedDefs.FeedViewPost) => {
        if (!post || playbackUrls.has(post.post.uri)) return;
        try {
            const embed = post.post.embed;
            let videoEmbed: AppBskyEmbedVideo.View | undefined;
            if (AppBskyEmbedVideo.isView(embed)) videoEmbed = embed;
            else if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media)) videoEmbed = embed.media as AppBskyEmbedVideo.View;
            if (!videoEmbed) return;
            const res = await (agent.api.app.bsky.video as any).getPlaybackUrl({ did: post.post.author.did, cid: videoEmbed.cid });
            setPlaybackUrls(prev => new Map(prev).set(post.post.uri, res.data.url));
        } catch (e) { console.warn(`Could not prefetch playback URL for ${post.post.uri}`, e); }
    }, [agent, playbackUrls]);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            setActiveIndex(newIndex);
            const nextPost = videoPosts[newIndex + 1];
            if (nextPost) prefetchNextUrl(nextPost);
        }
    }).current;
    
    if (isLoading) return <View style={styles.fullScreenCentered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    if (error) return <View style={styles.fullScreenCentered}><Text style={styles.errorText}>{error}</Text></View>;

    return (
        <>
            <Head><title>{t('more.watch')}</title></Head>
            <View style={styles.container}>
                <FlatList<AppBskyFeedDefs.FeedViewPost>
                    data={videoPosts}
                    renderItem={({ item, index }) => (
                        <View style={{ width, height }}>
                            <VideoPlayer 
                                postView={item} 
                                isActive={index === activeIndex} 
                                shouldLoad={Math.abs(index - activeIndex) <= 1}
                                hlsUrl={playbackUrls.get(item.post.uri)}
                            />
                        </View>
                    )}
                    keyExtractor={(item) => item.post.uri}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => fetchVideos(cursor)}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => {
                        if (isLoadingMore) return <View style={{height}}><ActivityIndicator size="large" color="white" /></View>;
                        if (!hasMore) return <View style={[styles.fullScreenCentered, {height}]}><Text style={styles.endTextTitle}>{t('watch.allSeenTitle')}</Text></View>;
                        return null;
                    }}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
                    windowSize={3}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    removeClippedSubviews={true}
                />
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </Pressable>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    fullScreenCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    errorText: { color: theme.colors.error, padding: theme.spacing.l, textAlign: 'center' },
    backButton: { position: 'absolute', top: theme.spacing.l, left: theme.spacing.l, zIndex: 10, padding: theme.spacing.s, borderRadius: theme.shape.full, backgroundColor: 'rgba(0,0,0,0.4)' },
    endTextTitle: { ...theme.typography.titleMedium, color: theme.colors.onSurface },
});

export default WatchScreen;
