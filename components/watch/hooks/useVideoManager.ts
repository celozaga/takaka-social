import { useState, useCallback, useRef, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import { useModeration } from '@/context/ModerationContext';
import { moderatePost } from '@/lib/moderation';

const VIDEOS_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
const POSTS_PER_PAGE = 25;

// Cache para posts já carregados (melhor performance)
const postsCache = new Map<string, AppBskyFeedDefs.FeedViewPost>();
const MAX_CACHE_SIZE = 100;

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

// Preload seguro de thumbnails e avatars (sem requests de vídeo)
const preloadThumbnails = async (posts: AppBskyFeedDefs.FeedViewPost[], startIndex: number = 0) => {
    const preloadCount = 3; // Precarregar próximos 3 vídeos
    
    for (let i = startIndex; i < Math.min(startIndex + preloadCount, posts.length); i++) {
        const post = posts[i];
        if (hasVideoEmbed(post.post)) {
            try {
                const embed = post.post.embed as AppBskyEmbedVideo.View;
                
                // Preload apenas de thumbnails e avatars (requisições GET seguras)
                if (embed?.thumbnail) {
                    // Preload thumbnail do vídeo
                    const img = new Image();
                    img.src = embed.thumbnail;
                    
                    // Preload avatar do autor
                    if (post.post.author?.avatar) {
                        const avatarImg = new Image();
                        avatarImg.src = post.post.author.avatar.replace('/img/avatar/', '/img/avatar_thumbnail/');
                    }
                }
            } catch (e) {
                // Ignorar erros de preload silenciosamente
                console.debug('Thumbnail preload error (ignored):', e);
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
                // Preload dos primeiros vídeos após carregamento inicial
                setTimeout(() => preloadThumbnails(page.posts, 0), 100);
            } else { // mode === 'more'
                setPosts(prev => {
                    const existingUris = new Set(prev.map(p => p.post.uri));
                    const uniqueNewPosts = page.posts.filter(p => !existingUris.has(p.post.uri));
                    const newPosts = [...prev, ...uniqueNewPosts];
                    
                    // Preload dos novos vídeos adicionados
                    setTimeout(() => preloadThumbnails(uniqueNewPosts, 0), 100);
                    
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

    // Função para preload baseado no vídeo ativo (para ser chamada quando vídeo muda)
    const preloadFromIndex = useCallback((activeIndex: number) => {
        if (posts.length > 0 && activeIndex >= 0) {
            // Preload vídeos próximos ao ativo
            const startIndex = Math.max(0, activeIndex);
            setTimeout(() => preloadThumbnails(posts, startIndex + 1), 50);
        }
    }, [posts]);

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