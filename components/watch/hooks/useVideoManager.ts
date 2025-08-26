import { useState, useCallback, useRef, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import { useModeration } from '@/context/ModerationContext';
import { moderatePost } from '@/lib/moderation';
import { FEATURES, UI_CONFIG, isFeatureEnabled } from '@/lib/config';

const VIDEOS_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
const POSTS_PER_PAGE = UI_CONFIG.POSTS_PER_PAGE;

// Enhanced cache for posts with feature flag support
const postsCache = new Map<string, AppBskyFeedDefs.FeedViewPost>();
const MAX_CACHE_SIZE = 200; // Increased for better watch experience

// Configuration for video preloading
const PRELOAD_CONFIG = {
    THUMBNAIL_COUNT: isFeatureEnabled('VIDEO_PRELOADING') ? 5 : 2,
    VIDEO_COUNT: isFeatureEnabled('VIDEO_PRELOADING') ? 2 : 1,
    DELAY_MS: 50,
};

// Helper to check if a post has a video embed
const hasVideoEmbed = (post: AppBskyFeedDefs.PostView): boolean => {
    if (!post.embed) return false;
    if (AppBskyEmbedVideo.isView(post.embed)) return true;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
        return AppBskyEmbedVideo.isView(post.embed.media);
    }
    return false;
};

// Funções de cache para melhor performance
const addToCache = (posts: AppBskyFeedDefs.FeedViewPost[]) => {
    posts.forEach(post => {
        if (postsCache.size >= MAX_CACHE_SIZE) {
            // Remove o primeiro item se exceder o limite
            const firstKey = postsCache.keys().next().value;
            if (firstKey) postsCache.delete(firstKey);
        }
        postsCache.set(post.post.uri, post);
    });
};

const getFromCache = (uri: string): AppBskyFeedDefs.FeedViewPost | undefined => {
    return postsCache.get(uri);
};

/**
 * Enhanced preloading system for immersive watch experience
 * Preloads thumbnails, avatars, and optionally video URLs
 */
const preloadContent = async (posts: AppBskyFeedDefs.FeedViewPost[], startIndex: number = 0, mode: 'thumbnails' | 'videos' = 'thumbnails') => {
    if (!isFeatureEnabled('VIDEO_PRELOADING') && mode === 'videos') {
        return; // Skip video preloading if disabled
    }
    
    const preloadCount = mode === 'videos' ? PRELOAD_CONFIG.VIDEO_COUNT : PRELOAD_CONFIG.THUMBNAIL_COUNT;
    
    for (let i = startIndex; i < Math.min(startIndex + preloadCount, posts.length); i++) {
        const post = posts[i];
        if (hasVideoEmbed(post.post)) {
            try {
                const embed = post.post.embed as AppBskyEmbedVideo.View;
                
                // Always preload thumbnails and avatars (safe GET requests)
                if (embed?.thumbnail && typeof window !== 'undefined') {
                    const img = new window.Image();
                    img.src = embed.thumbnail;
                }
                
                if (post.post.author?.avatar && typeof window !== 'undefined') {
                    const avatarImg = new window.Image();
                    avatarImg.src = post.post.author.avatar.replace('/img/avatar/', '/img/avatar_thumbnail/');
                }
                
                // Preload video URLs for better streaming (only if enabled and in video mode)
                if (mode === 'videos' && isFeatureEnabled('VIDEO_PRELOADING') && embed?.playlist) {
                    // This doesn't download the video, just primes the browser's network stack
                    if (typeof document !== 'undefined') {
                        const link = document.createElement('link');
                        link.rel = 'preload';
                        link.as = 'video';
                        link.href = embed.playlist;
                        document.head.appendChild(link);
                        
                        // Clean up after a delay to avoid memory issues
                        setTimeout(() => {
                            try {
                                document.head.removeChild(link);
                            } catch (e) {
                                // Ignore cleanup errors
                            }
                        }, 30000); // 30 seconds
                    }
                }
            } catch (e) {
                if (__DEV__) {
                    console.debug('Content preload error (ignored):', e);
                }
            }
        }
    }
};

export const useVideoManager = () => {
    const { agent } = useAtp();
    const moderation = useModeration();
    const [posts, setPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cursorRef = useRef<string | undefined>(undefined);
    const hasMoreRef = useRef(true);
    const MIN_POSTS_TO_RENDER = 5;

    const fetchPage = useCallback(async (cursor?: string) => {
        let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let nextCursor = cursor;
        let attempts = 0;
        const MAX_ATTEMPTS = 5; // To prevent infinite loops

        // Keep fetching pages until we have enough video posts or run out of pages/attempts
        while (accumulatedPosts.length < MIN_POSTS_TO_RENDER && attempts < MAX_ATTEMPTS && (attempts === 0 || nextCursor)) {
            if (attempts > 0 && nextCursor === undefined) break; // Stop if we run out of cursor
            
            const res = await agent.app.bsky.feed.getFeed({ feed: VIDEOS_FEED_URI, cursor: nextCursor, limit: POSTS_PER_PAGE });
            
            const videoPosts = res.data.feed
                .filter(item => hasVideoEmbed(item.post))
                .filter(item => {
                    if (!moderation.isReady) return true; // Default to showing if moderation isn't ready
                    return moderatePost(item.post, moderation).visibility !== 'hide';
                });

            // Adicionar ao cache para performance
            addToCache(videoPosts);

            accumulatedPosts.push(...videoPosts);

            nextCursor = res.data.cursor;
            attempts++;
            
            // If the feed returns no items, stop trying.
            if (res.data.feed.length === 0) break;
        }

        return { posts: accumulatedPosts, cursor: nextCursor };
    }, [agent, moderation]);

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
                // Enhanced preloading for immersive experience
                if (isFeatureEnabled('VIDEO_PRELOADING')) {
                    setTimeout(() => preloadContent(page.posts, 0, 'thumbnails'), PRELOAD_CONFIG.DELAY_MS);
                    setTimeout(() => preloadContent(page.posts, 0, 'videos'), PRELOAD_CONFIG.DELAY_MS * 2);
                } else {
                    setTimeout(() => preloadContent(page.posts, 0, 'thumbnails'), 100);
                }
            } else { // mode === 'more'
                setPosts(prev => {
                    const existingUris = new Set(prev.map(p => p.post.uri));
                    const uniqueNewPosts = page.posts.filter(p => !existingUris.has(p.post.uri));
                    const newPosts = [...prev, ...uniqueNewPosts];
                    
                    // Preload new content
                    if (uniqueNewPosts.length > 0) {
                        setTimeout(() => preloadContent(uniqueNewPosts, 0, 'thumbnails'), PRELOAD_CONFIG.DELAY_MS);
                        if (isFeatureEnabled('VIDEO_PRELOADING')) {
                            setTimeout(() => preloadContent(uniqueNewPosts, 0, 'videos'), PRELOAD_CONFIG.DELAY_MS * 2);
                        }
                    }
                    
                    return newPosts;
                });
            }
            cursorRef.current = page.cursor;
            hasMoreRef.current = !!page.cursor;
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
    }, [loadPosts]); // This dependency is stable

    // Enhanced preload function based on active video index
    const preloadFromIndex = useCallback((activeIndex: number) => {
        if (posts.length > 0 && activeIndex >= 0) {
            // Preload content around the active video for smooth transitions
            const startIndex = Math.max(0, activeIndex);
            
            // Preload thumbnails immediately for next videos
            setTimeout(() => preloadContent(posts, startIndex + 1, 'thumbnails'), PRELOAD_CONFIG.DELAY_MS);
            
            // Preload videos if feature is enabled for seamless playback
            if (isFeatureEnabled('VIDEO_PRELOADING')) {
                setTimeout(() => preloadContent(posts, startIndex + 1, 'videos'), PRELOAD_CONFIG.DELAY_MS * 2);
            }
            
            // Load more posts if we're getting close to the end
            if (activeIndex >= posts.length - 3 && !isLoadingMore && hasMoreRef.current) {
                loadPosts('more');
            }
        }
    }, [posts, isLoadingMore, loadPosts]);

    return {
        posts,
        isLoading,
        error,
        isLoadingMore,
        isRefreshing,
        hasMore: hasMoreRef.current,
        refresh: () => loadPosts('refresh'),
        loadMore: () => loadPosts('more'),
        preloadFromIndex, // Nova função para preload otimizado
    };
};