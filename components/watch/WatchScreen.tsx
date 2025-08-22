
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import WatchFeed from './WatchFeed'; // The new component
import { ArrowLeft } from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

/**
 * This is the main screen for the video feed.
 * It acts as a "container" component, responsible for:
 * - Fetching video posts from the API.
 * - Handling pagination (loading more videos as the user scrolls).
 * - Passing the data down to the `WatchFeed` component, which handles the UI.
 */
const WatchScreen: React.FC = () => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const router = useRouter();
    const [videoPosts, setVideoPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const isPostVideo = (p: AppBskyFeedDefs.PostView) => p.embed && (AppBskyEmbedVideo.isView(p.embed) || (AppBskyEmbedRecordWithMedia.isView(p.embed) && AppBskyEmbedVideo.isView(p.embed.media)));

    const fetchVideos = useCallback(async (currentCursor?: string) => {
        if (!currentCursor) setIsLoading(true);
        else setIsLoadingMore(true);
        
        try {
            let fetchedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
            let nextCursor = currentCursor;
            let attempts = 0;

            // The video feed might contain non-video posts. We loop until we've found
            // enough videos to fill the screen, or until we've tried a few times.
            while (fetchedPosts.filter(p => isPostVideo(p.post)).length < 5 && attempts < 5 && (hasMore || !currentCursor)) {
                attempts++;
                const res = await agent.app.bsky.feed.getFeed({ feed: DISCOVER_FEED_URI, cursor: nextCursor, limit: 50 });
                
                if (res.data.feed.length > 0) {
                    fetchedPosts.push(...res.data.feed);
                }

                nextCursor = res.data.cursor;
                if (!nextCursor) {
                    setHasMore(false);
                    break;
                }
            }
            
            const newVideoPosts = fetchedPosts.filter(p => isPostVideo(p.post));
            setVideoPosts(prev => {
                const existingUris = new Set(prev.map(p => p.post.uri));
                const uniqueNewPosts = newVideoPosts.filter(p => !existingUris.has(p.post.uri));
                return currentCursor ? [...prev, ...uniqueNewPosts] : uniqueNewPosts;
            });
            setCursor(nextCursor);
            if (!nextCursor) setHasMore(false);

        } catch (err: any) { 
            setError(t('feed.loadingError')); 
        } finally { 
            setIsLoading(false); 
            setIsLoadingMore(false); 
        }
    }, [agent, hasMore, t]);

    // Fetch the initial set of videos when the component mounts.
    useEffect(() => {
        fetchVideos();
    }, []); // Note: `fetchVideos` is memoized with useCallback, so this is safe.

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore && cursor) {
            fetchVideos(cursor);
        }
    }, [isLoadingMore, hasMore, cursor, fetchVideos]);

    if (isLoading) return <View style={styles.fullScreenCentered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    if (error) return <View style={styles.fullScreenCentered}><Text style={styles.errorText}>{error}</Text></View>;

    return (
        <>
            <Head><title>{t('more.watch')}</title></Head>
            <View style={styles.container}>
                <WatchFeed 
                    videoPosts={videoPosts}
                    loadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                />
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </Pressable>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    fullScreenCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
    errorText: { color: theme.colors.error, padding: theme.spacing.l, textAlign: 'center' },
    backButton: { position: 'absolute', top: theme.spacing.l, left: theme.spacing.l, zIndex: 30, padding: theme.spacing.s, borderRadius: theme.shape.full, backgroundColor: 'rgba(0,0,0,0.4)' },
});

export default WatchScreen;
