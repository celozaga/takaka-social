

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import WatchFeed from './WatchFeed';
import { ArrowLeft } from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

const VIDEOS_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/videos';
const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

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
    const [activeFeed, setActiveFeed] = useState({ uri: VIDEOS_FEED_URI, isFallback: false });

    const isVideoPost = (post:AppBskyFeedDefs.PostView) => {
        const embed = post.embed;
        if (!embed) return false;
        return AppBskyEmbedVideo.isView(embed) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media));
    };

    const fetchVideos = useCallback(async (currentCursor?: string) => {
        if (!currentCursor) {
            setIsLoading(true);
            setVideoPosts([]);
        } else {
            if (isLoadingMore || !hasMore) return;
            setIsLoadingMore(true);
        }
        
        const feedToFetch = currentCursor ? activeFeed.uri : VIDEOS_FEED_URI;
        let isFallback = currentCursor ? activeFeed.isFallback : false;

        try {
            const res = await agent.app.bsky.feed.getFeed({ feed: feedToFetch, cursor: currentCursor, limit: 25 });
            
            let posts = res.data.feed;
            if (isFallback) {
                posts = posts.filter(p => isVideoPost(p.post));
            }

            if (posts.length > 0) {
                setVideoPosts(prev => {
                    const existingUris = new Set(prev.map(p => p.post.uri));
                    const uniqueNewPosts = posts.filter(p => !existingUris.has(p.post.uri));
                    return currentCursor ? [...prev, ...uniqueNewPosts] : uniqueNewPosts;
                });
            }

            const nextCursor = res.data.cursor;
            setCursor(nextCursor);
            setHasMore(!!nextCursor && res.data.feed.length > 0);
            if (!currentCursor) setActiveFeed({ uri: feedToFetch, isFallback: false });

        } catch (err: any) {
            if (!currentCursor) {
                console.warn(`Primary video feed failed, attempting fallback...`, err);
                try {
                    const res = await agent.app.bsky.feed.getFeed({ feed: DISCOVER_FEED_URI, limit: 50 });
                    const posts = res.data.feed.filter(p => isVideoPost(p.post));
                    
                    setVideoPosts(posts);
                    const nextCursor = res.data.cursor;
                    setCursor(nextCursor);
                    setHasMore(!!nextCursor && res.data.feed.length > 0);
                    setActiveFeed({ uri: DISCOVER_FEED_URI, isFallback: true });

                } catch (fallbackErr) {
                    console.error("Fallback feed also failed:", fallbackErr);
                    setError(t('feed.loadingError'));
                }
            } else {
                console.error(`Failed to load more videos from ${feedToFetch}`, err);
                setHasMore(false);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent, t, isLoadingMore, hasMore, activeFeed]);
    
    useEffect(() => {
        fetchVideos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMore = useCallback(() => {
        if (cursor) {
            fetchVideos(cursor);
        }
    }, [cursor, fetchVideos]);

    if (isLoading) return <View style={styles.fullScreenCentered}><ActivityIndicator size="large" color={theme.colors.onSurface} /></View>;
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
