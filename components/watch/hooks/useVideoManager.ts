import { useState, useCallback, useRef, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';

const VIDEOS_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/videos';
const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';
const POSTS_PER_PAGE = 25;

const isVideoPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    return AppBskyEmbedVideo.isView(embed) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media));
};

export const useVideoManager = () => {
    const { agent } = useAtp();
    const [posts, setPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cursorRef = useRef<string | undefined>();
    const hasMoreRef = useRef(true);
    const feedSourceRef = useRef({ uri: VIDEOS_FEED_URI, isFallback: false });

    const fetchPage = useCallback(async (cursor?: string) => {
        const { uri, isFallback } = feedSourceRef.current;
        const limit = isFallback ? 50 : POSTS_PER_PAGE;
        
        const res = await agent.app.bsky.feed.getFeed({ feed: uri, cursor, limit });
        let newPosts = res.data.feed;
        
        if (isFallback) {
            newPosts = newPosts.filter(p => isVideoPost(p.post));
        }

        return { posts: newPosts, cursor: res.data.cursor, originalCount: res.data.feed.length };
    }, [agent]);

    const loadPosts = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
        if (mode === 'more' && (isLoadingMore || !hasMoreRef.current)) return;

        if (mode === 'initial') setIsLoading(true);
        if (mode === 'refresh') setIsRefreshing(true);
        if (mode === 'more') setIsLoadingMore(true);
        setError(null);

        try {
            let page;
            if (mode === 'initial' || mode === 'refresh') {
                try {
                    feedSourceRef.current = { uri: VIDEOS_FEED_URI, isFallback: false };
                    page = await fetchPage(undefined);
                } catch (e) {
                    console.warn(`Primary video feed failed, trying fallback. Error: ${e}`);
                    feedSourceRef.current = { uri: DISCOVER_FEED_URI, isFallback: true };
                    page = await fetchPage(undefined);
                }
                setPosts(page.posts);
            } else { // mode === 'more'
                page = await fetchPage(cursorRef.current);
                setPosts(prev => {
                    const existingUris = new Set(prev.map(p => p.post.uri));
                    const uniqueNewPosts = page.posts.filter(p => !existingUris.has(p.post.uri));
                    return [...prev, ...uniqueNewPosts];
                });
            }
            cursorRef.current = page.cursor;
            hasMoreRef.current = !!page.cursor && page.originalCount > 0;
        } catch (e: any) {
            console.error("Failed to fetch video feed:", e);
            setError(e.message || 'Could not load videos.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [fetchPage]);

    useEffect(() => {
        loadPosts('initial');
    }, [loadPosts]);

    return {
        posts,
        isLoading,
        error,
        isLoadingMore,
        isRefreshing,
        hasMore: hasMoreRef.current,
        refresh: () => loadPosts('refresh'),
        loadMore: () => loadPosts('more'),
    };
};
