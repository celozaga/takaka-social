import { useState, useCallback, useRef, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';

const VIDEOS_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/the-vids';
const POSTS_PER_PAGE = 25;

export const useVideoManager = () => {
    const { agent } = useAtp();
    const [posts, setPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cursorRef = useRef<string | undefined>(undefined);
    const hasMoreRef = useRef(true);

    const fetchPage = useCallback(async (cursor?: string) => {
        const res = await agent.app.bsky.feed.getFeed({ feed: VIDEOS_FEED_URI, cursor, limit: POSTS_PER_PAGE });
        return { posts: res.data.feed, cursor: res.data.cursor };
    }, [agent]);

    const loadPosts = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
        if (mode === 'more' && (isLoadingMore || !hasMoreRef.current)) return;

        if (mode === 'initial') setIsLoading(true);
        if (mode === 'refresh') setIsRefreshing(true);
        if (mode === 'more') setIsLoadingMore(true);
        setError(null);

        try {
            const cursor = (mode === 'initial' || mode === 'refresh') ? undefined : cursorRef.current;
            const page = await fetchPage(cursor);

            if (mode === 'initial' || mode === 'refresh') {
                setPosts(page.posts);
            } else { // mode === 'more'
                setPosts(prev => {
                    const existingUris = new Set(prev.map(p => p.post.uri));
                    const uniqueNewPosts = page.posts.filter(p => !existingUris.has(p.post.uri));
                    return [...prev, ...uniqueNewPosts];
                });
            }
            cursorRef.current = page.cursor;
            hasMoreRef.current = !!page.cursor && page.posts.length > 0;
        } catch (e: any) {
            console.error("Failed to fetch video feed:", e);
            setError(e.message || 'Could not load videos.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [fetchPage, isLoadingMore]);

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
