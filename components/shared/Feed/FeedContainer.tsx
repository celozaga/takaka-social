import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedExternal } from '@atproto/api';
import { useModeration } from '../../../context/ModerationContext';
import { moderatePost } from '../../../lib/moderation';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/components/shared';
import { PostCardSkeleton } from '../Skeleton';
import FullPostCardSkeleton from '../../post/FullPostCardSkeleton';
import ErrorState from '../ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { FEATURES, FEED_CONFIG, isFeatureEnabled } from '@/lib/config';
import FeedList from './FeedList';
import FeedItem from './FeedItem';

type MediaFilter = 'all' | 'photos' | 'videos';
type AuthorFeedFilter = 'posts_no_replies' | 'posts_with_replies' | 'posts_with_media';

export interface FeedContainerProps {
  feedUri?: string;
  authorFeedFilter?: AuthorFeedFilter;
  searchQuery?: string;
  searchSort?: 'latest' | 'top';
  mediaFilter?: MediaFilter;
  layout?: 'grid' | 'list';
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  postFilter?: 'reposts_only' | 'likes_only' | 'bookmarks_only';
}

const MIN_BATCH_SIZE = 6; // Reduzido de 10 para 6 para carregamento mais rápido
const MAX_FETCH_ATTEMPTS = 5; // To prevent infinite loops
const INITIAL_LOAD_SIZE = 8; // Tamanho inicial para carregamento mais rápido
const PROGRESSIVE_LOAD_SIZE = 12; // Tamanho para carregamentos subsequentes

/**
 * Enhanced media post detection using feature flags
 */
const isPostAMediaPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    
    // For search results, be more permissive to show more content
    if (!isFeatureEnabled('VISUAL_ONLY_FEEDS')) {
        return true;
    }
    
    if (!embed) {
        if (__DEV__) console.log('🚫 DEBUG: Post sem embed:', post.uri);
        return false;
    }
    
    // Check for images
    if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
        if (__DEV__) console.log('✅ DEBUG: Post com imagens:', post.uri);
        return true;
    }
    
    // Check for videos
    if (AppBskyEmbedVideo.isView(embed)) {
        if (__DEV__) console.log('✅ DEBUG: Post com vídeo:', post.uri);
        return true;
    }
    
    // Check for external links with preview images (if enabled)
    if (AppBskyEmbedExternal.isView(embed) && embed.external?.thumb) {
        if (__DEV__) console.log('✅ DEBUG: Post com link externo e thumbnail:', post.uri);
        return true;
    }
    
    // Allow external links even without thumbnails for search results
    if (AppBskyEmbedExternal.isView(embed)) {
        if (__DEV__) console.log('✅ DEBUG: Post com link externo:', post.uri);
        return true;
    }
    
    if (__DEV__) console.log('🚫 DEBUG: Post não é mídia válida:', post.uri, 'embed type:', embed.$type);
    return false;
};

const hasPhotos = (post: AppBskyFeedDefs.PostView): boolean => {
    return post.embed?.$type === 'app.bsky.embed.images#view' && (post.embed as AppBskyEmbedImages.View).images.length > 0;
}

const hasVideos = (post: AppBskyFeedDefs.PostView): boolean => {
    return post.embed?.$type === 'app.bsky.embed.video#view';
}

/**
 * Check if post is allowed in visual-only feeds
 */
const isPostAllowedInVisualFeed = (post: AppBskyFeedDefs.PostView): boolean => {
    // If visual-only feeds are disabled, allow all posts
    if (!isFeatureEnabled('VISUAL_ONLY_FEEDS')) {
        return true;
    }
    
    const embed = post.embed;
    if (!embed) {
        // No embed = text-only post, not allowed in visual feeds
        return false;
    }
    
    // Check if embed type is in allowed list
    const embedType = embed.$type;
    return FEED_CONFIG.ALLOWED_EMBED_TYPES.includes(embedType as any);
}

/**
 * Check if post is a quote post (should be filtered out)
 */
const isQuotePost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    
    // Check for record embeds (quotes) using config
    return FEED_CONFIG.EXCLUDED_EMBED_TYPES.includes(embed.$type as any);
}

/**
 * Check if post should be filtered out based on content policies
 */
const shouldFilterPost = (item: AppBskyFeedDefs.FeedViewPost): boolean => {
    // STRICT: Always filter replies from main feeds (Xiaohongshu-style)
    if (item.reply) {
        console.log('🚫 DEBUG: Filtering reply post:', item.post.uri);
        return true;
    }
    
    // STRICT: Always filter quote posts (not supported in this app)
    if (!isFeatureEnabled('QUOTE_POSTING') && isQuotePost(item.post)) {
        console.log('🚫 DEBUG: Filtering quote post:', item.post.uri);
        return true;
    }
    
    // Filter text-only posts from visual feeds
    if (isFeatureEnabled('VISUAL_ONLY_FEEDS') && !isPostAllowedInVisualFeed(item.post)) {
        console.log('🚫 DEBUG: Filtering text-only post:', item.post.uri);
        return true;
    }
    
    return false;
}

const FeedContainer: React.FC<FeedContainerProps> = ({ 
    feedUri, 
    authorFeedFilter,
    searchQuery,
    searchSort = 'top',
    mediaFilter = 'all',
    layout = 'grid', 
    ListHeaderComponent,
    postFilter,
}) => {
  const { agent, publicAgent, publicApiAgent, session } = useAtp();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  
  console.log('📋 DEBUG Feed Component initialized:', {
    feedUri,
    hasSession: !!session,
    hasAgent: !!agent,
    hasPublicAgent: !!publicAgent,
    searchQuery,
    authorFeedFilter,
    postFilter
  });
  const { t } = useTranslation();
  const moderation = useModeration();
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs para controle de carregamento progressivo
  const isLoadingMoreRef = useRef(false);
  const lastLoadTriggerRef = useRef(0);
  const lastApiCallRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async (currentCursor?: string) => {
    // A. PRIVATE FEEDS (Bookmarks, Likes)
    if (postFilter === 'bookmarks_only' || postFilter === 'likes_only') {
        if (!session) return { data: { feed: [], cursor: undefined } };

        let records: any[] = [];
        let nextCursor: string | undefined;

        if (postFilter === 'bookmarks_only') {
            const res = await agent.com.atproto.repo.listRecords({
                repo: session.did,
                collection: 'app.myclient.bookmark',
                limit: 50, // Fetch more to have enough items after potential filtering
                cursor: currentCursor,
            });
            const bookmarkUris = res.data.records.map(r => (r.value as any).subject.uri);
            if (bookmarkUris.length > 0) {
                const postsRes = await agent.getPosts({ uris: bookmarkUris });
                const postsByUri = new Map(postsRes.data.posts.map(p => [p.uri, { post: p }]));
                records = bookmarkUris.map(uri => postsByUri.get(uri)).filter(Boolean) as AppBskyFeedDefs.FeedViewPost[];
            }
            nextCursor = res.data.cursor;
        } else { // likes_only
            const res = await agent.app.bsky.feed.getActorLikes({
                actor: session.did,
                limit: 50,
                cursor: currentCursor,
            });
            records = res.data.feed;
            nextCursor = res.data.cursor;
        }
        
        if (searchQuery) {
            const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
            records = records.filter(item => {
                const record = item.post.record as { text?: string };
                const postText = record.text?.toLowerCase();
                if (!postText) return false;
                return searchTerms.every(term => postText.includes(term));
            });
        }
        
        return { data: { feed: records, cursor: nextCursor } };
    }

    // B. GENERAL SEARCH
    if (searchQuery) {
        console.log('🔍 DEBUG: Attempting search for:', searchQuery, 'Session exists:', !!session);
        const searchAgent = session ? agent : publicApiAgent;
        console.log('🔍 DEBUG: Using agent type:', session ? 'authenticated' : 'public-api');
        
        try {
            const res = await searchAgent.app.bsky.feed.searchPosts({ q: searchQuery, cursor: currentCursor, sort: searchSort, limit: 40 });
            const feed: AppBskyFeedDefs.FeedViewPost[] = res.data.posts.map(post => ({ post }));
            console.log('✅ SUCCESS: Search completed');
            return { data: { feed, cursor: res.data.cursor } };
        } catch (searchError: any) {
            console.error('❌ ERROR: Search failed:', searchError);
            // Return empty results instead of throwing error
            console.log('🔄 DEBUG: Returning empty search results due to API failure');
            return { data: { feed: [], cursor: undefined } };
        }
    }

    // C. FEED-BASED FETCHING
    if (feedUri) {
        if (feedUri === 'following') {
            if (!session) return { data: { feed: [], cursor: undefined } };
            console.log('🔍 DEBUG: Fetching following feed with getTimeline, limit: 30');
            const result = await agent.app.bsky.feed.getTimeline({ cursor: currentCursor, limit: 30 });
            console.log('🔍 DEBUG: Following feed raw response:', {
                postsCount: result?.data?.feed?.length || 0,
                cursor: result?.data?.cursor,
                firstPost: result?.data?.feed?.[0] ? {
                    uri: result.data.feed[0].post.uri,
                    hasEmbed: !!result.data.feed[0].post.embed,
                    embedType: result.data.feed[0].post.embed?.$type,
                    hasReply: !!result.data.feed[0].reply
                } : 'No posts'
            });
            return result;
        }
        if (authorFeedFilter) {
            console.log('🔍 DEBUG: Attempting author feed for:', feedUri, 'Session exists:', !!session);
            const feedAgent = session ? agent : publicApiAgent;
            console.log('🔍 DEBUG: Using agent type:', session ? 'authenticated' : 'public-api');
            
            return await feedAgent.app.bsky.feed.getAuthorFeed({ actor: feedUri, cursor: currentCursor, limit: 30, filter: authorFeedFilter });
        }
        
        // For public feeds (including Discovery), use appropriate agent
        console.log('🔍 DEBUG: Attempting to fetch feed:', feedUri, 'Session exists:', !!session);
        
        // For discovery feeds, try multiple strategies for public access
        if (feedUri.includes('whats-hot') || feedUri.includes('discovery')) {
            console.log('🔍 DEBUG: Attempting Discovery feed access, Session exists:', !!session);
            
            // Strategy 1: Try authenticated getFeed if session exists
            if (session) {
                try {
                    const result = await agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
                    console.log('✅ SUCCESS: Authenticated Discovery feed fetched, posts count:', result?.data?.feed?.length);
                    return result;
                } catch (error: any) {
                    console.log('⚠️ WARNING: Authenticated Discovery feed failed, trying public access:', error.message);
                }
            }
            
            // Strategy 2: Try public API agent for discovery
            try {
                console.log('🔍 DEBUG: Trying public API agent for Discovery feed');
                const result = await publicApiAgent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
                console.log('✅ SUCCESS: Public Discovery feed fetched, posts count:', result?.data?.feed?.length);
                return result;
            } catch (publicError: any) {
                console.log('⚠️ WARNING: Public Discovery feed failed, trying search fallback:', publicError.message);
            }
            
            // Strategy 3: Fallback to search for discovery content
            try {
                console.log('🔍 DEBUG: Using search fallback for Discovery feed');
                const searchResult = await publicApiAgent.app.bsky.feed.searchPosts({ 
                    q: 'bluesky OR social OR atproto OR bsky', 
                    cursor: currentCursor,
                    limit: 30,
                    sort: 'top'
                });
                const feed: AppBskyFeedDefs.FeedViewPost[] = searchResult.data.posts.map(post => ({ post }));
                console.log('✅ SUCCESS: Discovery search fallback worked, posts count:', feed.length);
                return { data: { feed, cursor: searchResult.data.cursor } };
            } catch (searchError: any) {
                console.warn('⚠️ WARNING: Discovery search fallback failed:', searchError.message);
                
                // Strategy 4: Return empty feed instead of throwing error
                console.log('🔄 DEBUG: Returning empty Discovery feed to prevent app crash');
                return { data: { feed: [], cursor: undefined } };
            }
        }
        
        // For other public feeds, try public access first, then authenticated
        console.log('🔍 DEBUG: Attempting public feed access for:', feedUri, 'Session exists:', !!session);
        
        // Try public API agent first for all feeds
        try {
            console.log('🔍 DEBUG: Using public API agent for feed:', feedUri);
            const result = await publicApiAgent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
            console.log('✅ SUCCESS: Public feed fetched successfully, posts count:', result?.data?.feed?.length);
            return result;
        } catch (publicError: any) {
            console.log('⚠️ WARNING: Public feed access failed:', publicError.message);
            
            // Fallback to authenticated agent if available
            if (session) {
                try {
                    console.log('🔍 DEBUG: Falling back to authenticated agent for feed:', feedUri);
                    const result = await agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
                    console.log('✅ SUCCESS: Authenticated feed fallback worked, posts count:', result?.data?.feed?.length);
                    return result;
                } catch (authError: any) {
                    console.error('❌ ERROR: Both public and authenticated feed access failed:', authError.message);
                }
            }
            
            console.log('🔄 DEBUG: No feed access available for:', feedUri);
            return { data: { feed: [], cursor: undefined } };
        }
    }
    
    // D. FALLBACK
    return Promise.resolve({ data: { feed: [], cursor: undefined } });
  }, [agent, publicAgent, publicApiAgent, feedUri, session, searchQuery, searchSort, authorFeedFilter, postFilter]);

  const fetchAndFilterPage = useCallback(async (currentCursor?: string) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallRef.current;
    const MIN_API_INTERVAL = 500; // Minimum 500ms between API calls
    
    // Prevent rapid successive API calls
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      console.log('🚫 DEBUG: API call blocked - too frequent:', timeSinceLastCall, 'ms since last call');
      await new Promise(resolve => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall));
    }
    
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      console.log('🚫 DEBUG: Aborting previous API request');
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    lastApiCallRef.current = Date.now();
    
    try {
      console.log('🌐 DEBUG: Making API call with cursor:', currentCursor);
      const response = await fetchPosts(currentCursor);
      const posts = response.data.feed || [];
      const nextCursor = response.data.cursor;
      
      // Reset failure count on success
      consecutiveFailuresRef.current = 0;

      // Debug logging (can be removed in production)
      if (__DEV__) {
        console.log('🔍 DEBUG: Raw posts received:', posts.length);
        if (feedUri === 'following') {
          console.log('🔍 DEBUG: Following feed - detailed post analysis:');
          posts.forEach((post, index) => {
            if (index < 5) { // Log first 5 posts
              console.log(`  Post ${index + 1}:`, {
                uri: post.post.uri,
                hasEmbed: !!post.post.embed,
                embedType: post.post.embed?.$type,
                hasReply: !!post.reply,
                isMediaPost: isPostAMediaPost(post.post)
              });
            }
          });
        } else {
          console.log('🔍 DEBUG: First post sample:', posts[0] ? {
            uri: posts[0].post.uri,
            hasEmbed: !!posts[0].post.embed,
            embedType: posts[0].post.embed?.$type,
            hasReply: !!posts[0].reply
          } : 'No posts');
        }
      }

    const isProfileContext = !!authorFeedFilter || !!postFilter;
    
    // Apply content policy filtering (replies, quotes, text-only posts)
    // STRICT: Apply reply/quote filtering to ALL feeds (including profile context)
    // OPTIMIZED: Combined filtering in single pass for better performance
    let processedPosts = posts.filter(item => {
        // 1. Filter replies (except in dedicated reply sections)
        if (item.reply && !postFilter?.includes('replies')) {
            if (__DEV__) console.log('🚫 DEBUG: Removing reply from feed:', item.post.uri);
            return false;
        }
        
        // 2. Filter quotes (not supported in this app)
        if (isQuotePost(item.post)) {
            if (__DEV__) console.log('🚫 DEBUG: Removing quote from feed:', item.post.uri);
            return false;
        }
        
        // 3. For grid layout, apply media filtering but be more permissive for following feed
        if (layout === 'grid') {
            // Para o feed Following, ser mais permissivo
            if (feedUri === 'following') {
                // Permitir posts com texto + links externos, mesmo sem thumbnail
                if (item.post.embed && AppBskyEmbedExternal.isView(item.post.embed)) {
                    return true;
                }
                // Permitir posts com texto + qualquer embed válido
                if (item.post.embed) {
                    return true;
                }
                // Permitir posts apenas com texto para o feed Following
                return true;
            } else {
                // Para outros feeds, manter filtro rigoroso
                if (!isPostAMediaPost(item.post)) {
                    if (__DEV__) console.log('🚫 DEBUG: Removing non-media post from grid:', item.post.uri);
                    return false;
                }
            }
        }
        
        // 4. Apply other content policies only to non-profile contexts
        if (!isProfileContext && shouldFilterPost(item)) {
            return false;
        }
        
        return true;
    });
    
    if (__DEV__) {
        console.log('🔍 DEBUG: After combined filter:', processedPosts.length);
        if (feedUri === 'following') {
            console.log('🔍 DEBUG: Following feed - posts after combined filter:', processedPosts.length);
            processedPosts.forEach((post, index) => {
                if (index < 3) { // Log first 3 posts
                    console.log(`  Post ${index + 1} after combined filter:`, {
                        uri: post.post.uri,
                        hasEmbed: !!post.post.embed,
                        embedType: post.post.embed?.$type,
                        isMediaPost: isPostAMediaPost(post.post)
                    });
                }
            });
        }
    }
    
    // Apply specific post type filters
    if (postFilter === 'reposts_only') {
        processedPosts = processedPosts.filter(item => !!item.reason && AppBskyFeedDefs.isReasonRepost(item.reason));
    }
    
    // Apply layout-specific filtering (media filtering now handled in combined filter above)
    if (layout === 'grid') {
        // Grid layout: STRICT media filtering - only photos and videos
        const beforeGrid = processedPosts.length;
        processedPosts = processedPosts.filter(item => {
            const hasPhoto = hasPhotos(item.post);
            const hasVideo = hasVideos(item.post);
            return hasPhoto || hasVideo;
        });
        if (__DEV__) console.log('🔍 DEBUG: Grid strict media filter:', beforeGrid, '→', processedPosts.length);
        
        // Apply specific media type filters if set
        if (mediaFilter === 'photos') {
            const beforePhotos = processedPosts.length;
            processedPosts = processedPosts.filter(item => hasPhotos(item.post));
            if (__DEV__) console.log('🔍 DEBUG: Photos filter:', beforePhotos, '→', processedPosts.length);
        } else if (mediaFilter === 'videos') {
            const beforeVideos = processedPosts.length;
            processedPosts = processedPosts.filter(item => hasVideos(item.post));
            if (__DEV__) console.log('🔍 DEBUG: Videos filter:', beforeVideos, '→', processedPosts.length);
        }
    } else if (layout === 'list' && isFeatureEnabled('VISUAL_ONLY_FEEDS') && !isProfileContext) {
        if (__DEV__) console.log('🔍 DEBUG: Applying list visual-only filtering...');
        const beforeList = processedPosts.length;
        // For list layout in visual-only mode, still filter for media posts in main feeds
        processedPosts = processedPosts.filter(item => isPostAMediaPost(item.post));
        if (__DEV__) console.log('🔍 DEBUG: List visual filter:', beforeList, '→', processedPosts.length);
    }

      if (__DEV__) console.log('🔍 DEBUG: Final posts:', processedPosts.length);
      return { posts: processedPosts, cursor: nextCursor, originalCount: posts.length };
    } catch (error: any) {
      consecutiveFailuresRef.current++;
      console.error('❌ ERROR: fetchAndFilterPage failed:', error, 'Consecutive failures:', consecutiveFailuresRef.current);
      
      // If too many consecutive failures, stop trying
      if (consecutiveFailuresRef.current >= MAX_FETCH_ATTEMPTS) {
        console.error('🛑 ERROR: Too many consecutive failures, stopping pagination');
        throw error;
      }
      
      // Return empty result for recoverable errors
      return { posts: [], cursor: undefined, originalCount: 0 };
    } finally {
      abortControllerRef.current = null;
    }
  }, [fetchPosts, authorFeedFilter, postFilter, layout, mediaFilter, feedUri]);

  const loadInitialPosts = useCallback(async () => {
    console.log('🔄 DEBUG: loadInitialPosts called for:', { feedUri, postFilter, layout });
    setIsLoading(true);
    setError(null);
    setFeed([]);
    setCursor(undefined);
    setHasMore(true);
    
    // Reset loading refs
    isLoadingMoreRef.current = false;
    lastLoadTriggerRef.current = 0;

    try {
        let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let nextCursor: string | undefined;
        let attempts = 0;
        let canFetchMore = true;

        // Para o layout grid, carregar posts de forma otimizada
        const targetLoadSize = layout === 'grid' ? 20 : (feedUri === 'following' ? 20 : INITIAL_LOAD_SIZE);
        const maxAttempts = layout === 'grid' ? 6 : (feedUri === 'following' ? 5 : 3);

        console.log('🎯 DEBUG: Initial load target:', { targetLoadSize, maxAttempts });

        while (accumulatedPosts.length < targetLoadSize && attempts < maxAttempts && canFetchMore) {
            console.log(`🔄 DEBUG: Initial load attempt ${attempts + 1}`);
            const batchResult = await fetchAndFilterPage(nextCursor);
            
            console.log('📦 DEBUG: Initial batch result:', {
              posts: batchResult.posts.length,
              originalCount: batchResult.originalCount,
              cursor: batchResult.cursor
            });
            
            const newUniquePosts = batchResult.posts.filter(p => !accumulatedPosts.some(ap => ap.post.uri === p.post.uri));
            console.log('✨ DEBUG: New unique posts in initial batch:', newUniquePosts.length);
            accumulatedPosts.push(...newUniquePosts);
            
            nextCursor = batchResult.cursor;
            canFetchMore = !!nextCursor; // Allow continuation as long as we have a cursor
            attempts++;
            
            // Break early if we have enough posts for grid layout
            if (layout === 'grid' && accumulatedPosts.length >= 12) break;
            if (accumulatedPosts.length >= targetLoadSize) break;
        }

        console.log('📊 DEBUG: Initial load completed:', {
          totalPosts: accumulatedPosts.length,
          hasMore: canFetchMore,
          cursor: nextCursor
        });

        setFeed(accumulatedPosts);
        setCursor(nextCursor);
        setHasMore(canFetchMore);

    } catch (err: any) {
        console.error('❌ FAILED: Feed loading failed:', {
            error: err,
            status: err.status,
            message: err.message,
            feedUri,
            hasSession: !!session,
            postFilter
        });
        
        if (postFilter === 'likes_only' && (err.error === 'AuthRequiredError' || err.message?.includes('private'))) {
            setError(t('profile.privateLikes'));
        } else if (err.error === 'BlockedByActor' || err.error === 'BlockedActor') {
            setError(t('profile.blockedBy'));
        } else {
            setError(t('feed.loadingError'));
        }
    } finally {
        setIsLoading(false);
    }
  }, [fetchAndFilterPage, t, postFilter, feedUri, layout]);

  // Stable effect that only runs when core feed parameters change
  useEffect(() => {
    console.log('🔄 DEBUG: useEffect triggered for feed reload:', { feedUri, postFilter, searchQuery, authorFeedFilter, mediaFilter });
    loadInitialPosts();
  }, [feedUri, postFilter, searchQuery, authorFeedFilter, mediaFilter, layout]); // Removed loadInitialPosts dependency to prevent loops

  // Cleanup effect to abort pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 DEBUG: Cleaning up - aborting pending API request');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadInitialPosts().finally(() => setIsRefreshing(false));
  }, [loadInitialPosts]);

  const loadMorePosts = useCallback(async () => {
    // More robust blocking conditions
    if (isLoadingMoreRef.current || !cursor || !hasMore || feed.length === 0) {
      console.log('🚫 DEBUG: loadMorePosts blocked:', { 
        isLoading: isLoadingMoreRef.current, 
        hasCursor: !!cursor, 
        hasMore,
        feedLength: feed.length
      });
      return;
    }
    
    console.log('🚀 DEBUG: Starting loadMorePosts with cursor:', cursor);
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
        let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let nextCursor: string | undefined = cursor;
        let attempts = 0;
        let canFetchMore = true;
        let totalOriginalCount = 0;

        // Get current feed URIs to check for duplicates
        const currentFeedUris = new Set(feed.map(p => p.post.uri));
        console.log('🔍 DEBUG: Current feed has', currentFeedUris.size, 'posts');

        // Carregamento progressivo otimizado para layout grid
        const targetLoadSize = layout === 'grid' ? 15 : PROGRESSIVE_LOAD_SIZE;
        while (accumulatedPosts.length < targetLoadSize && attempts < MAX_FETCH_ATTEMPTS && canFetchMore) {
            console.log(`🔄 DEBUG: Fetch attempt ${attempts + 1}, cursor:`, nextCursor);
            const batchResult = await fetchAndFilterPage(nextCursor);
            
            console.log('📦 DEBUG: Batch result:', {
              posts: batchResult.posts.length,
              originalCount: batchResult.originalCount,
              cursor: batchResult.cursor
            });
            
            // Filter out posts that already exist in current feed
            const newUniquePosts = batchResult.posts.filter(p => !currentFeedUris.has(p.post.uri));
            console.log('✨ DEBUG: New unique posts in this batch:', newUniquePosts.length);
            
            accumulatedPosts.push(...newUniquePosts);
            // Update the set with new posts to prevent duplicates in subsequent batches
            newUniquePosts.forEach(p => currentFeedUris.add(p.post.uri));
            
            nextCursor = batchResult.cursor;
            totalOriginalCount += batchResult.originalCount;
            canFetchMore = !!nextCursor; // Allow continuation as long as we have a cursor
            attempts++;
            
            // Break if no new posts were found in this batch
            if (newUniquePosts.length === 0 && batchResult.posts.length > 0) {
              console.log('⚠️ DEBUG: No new unique posts found, stopping pagination');
              canFetchMore = false;
              break;
            }
        }

        console.log('📊 DEBUG: Final accumulated posts:', accumulatedPosts.length);
        
        let actuallyAddedCount = 0;
        if (accumulatedPosts.length > 0) {
            setFeed(prevFeed => {
                const existingUris = new Set(prevFeed.map(p => p.post.uri));
                const uniqueNewPosts = accumulatedPosts.filter(p => !existingUris.has(p.post.uri));
                actuallyAddedCount = uniqueNewPosts.length;
                console.log('➕ DEBUG: Actually adding', actuallyAddedCount, 'new posts to feed');
                return [...prevFeed, ...uniqueNewPosts];
            });
        }
        
        // More robust hasMore logic: continue if we have a cursor AND can fetch more
        // Allow continuation even if no posts were added this round (due to filtering)
        const newHasMore = canFetchMore && !!nextCursor && (actuallyAddedCount > 0 || totalOriginalCount > 0);
        console.log('🎯 DEBUG: Setting hasMore to:', newHasMore, {
          canFetchMore,
          actuallyAddedCount,
          hasNextCursor: !!nextCursor,
          totalOriginalCount
        });
        
        setCursor(nextCursor);
        setHasMore(newHasMore);

    } catch (error) {
        console.error('❌ ERROR: loadMorePosts failed:', error);
        setHasMore(false); // Stop pagination on error
    } finally {
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
        console.log('✅ DEBUG: loadMorePosts completed');
    }
  }, [cursor, hasMore, fetchAndFilterPage, layout, feed]);

  const onEndReached = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTrigger = now - (lastLoadTriggerRef.current || 0);
    const MIN_TRIGGER_INTERVAL = 500; // Reduced to 500ms for better responsiveness
    
    console.log('🎯 DEBUG: onEndReached triggered', {
      hasMore,
      isLoading: isLoadingMoreRef.current,
      timeSinceLastTrigger,
      minInterval: MIN_TRIGGER_INTERVAL,
      feedLength: feed.length,
      cursor: !!cursor
    });
    
    // More robust conditions check
    if (hasMore && !isLoadingMoreRef.current && timeSinceLastTrigger >= MIN_TRIGGER_INTERVAL && cursor && feed.length > 0) {
      lastLoadTriggerRef.current = now;
      console.log('✅ DEBUG: Triggering loadMorePosts');
      loadMorePosts();
    } else {
      console.log('🚫 DEBUG: onEndReached blocked - conditions not met', {
        hasMore,
        isLoading: isLoadingMoreRef.current,
        timeSinceLastTrigger,
        hasCursor: !!cursor,
        feedLength: feed.length
      });
    }
  }, [hasMore, loadMorePosts, cursor, feed.length]);

  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) return [];
    
    if (__DEV__) {
      console.log('🔍 DEBUG: Moderation filter - posts before:', feed.length);
    }
    
    const filtered = feed.filter(item => {
      const modDecision = moderatePost(item.post, moderation);
      if (modDecision.visibility === 'hide') {
        if (__DEV__) {
          console.log('🚫 DEBUG: Post hidden by moderation:', item.post.uri, 'reason:', modDecision.reason);
        }
        return false;
      }
      return true;
    });
    
    if (__DEV__) {
      console.log('🔍 DEBUG: Moderation filter - posts after:', filtered.length);
      console.log('🔍 DEBUG: Moderation filter - posts removed:', feed.length - filtered.length);
    }
    
    return filtered;
  }, [feed, moderation]);

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => {
    // Create unique key for each feed item to prevent rendering issues
    const baseKey = item.post.cid || item.post.uri;
    const reasonKey = AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : '';
    const timestampKey = item.post.indexedAt || '';
    return `${baseKey}-${reasonKey}-${timestampKey}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  };

  const renderItem = ({ item }: { item: AppBskyFeedDefs.FeedViewPost }) => {
    return <FeedItem item={item} layout={layout} />;
  };

  // Function to get item type for better recycling - essential for masonry layout
  const getItemType = (item: AppBskyFeedDefs.FeedViewPost) => {
    if (item.post.embed?.$type === 'app.bsky.embed.video#view') {
      return 'video';
    }
    if (item.post.embed?.$type === 'app.bsky.embed.images#view') {
      return 'image';
    }
    return 'text';
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      if (layout === 'grid') {
        // Render skeletons in masonry layout to match the grid
        return (
          <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg }}>
            <View style={{ flex: 1, marginHorizontal: theme.spacing.xs }}>
              <PostCardSkeleton />
            </View>
            <View style={{ flex: 1, marginHorizontal: theme.spacing.xs }}>
              <PostCardSkeleton />
            </View>
          </View>
        );
      }
      // For list layout, render a single full post skeleton
      return (
        <View style={styles.listContainer}>
          <FullPostCardSkeleton />
        </View>
      );
    }
    if (!hasMore && moderatedFeed.length > 0) {
      return <Text style={styles.endOfList}>{t('common.endOfList')}</Text>;
    }
    return null;
  };
  
  const renderListEmptyComponent = () => {
    if (isLoading) return null; // Don't show empty message while initially loading

    if (error) {
        const isNonRecoverableError = error === t('profile.privateLikes') || error === t('profile.blockedBy');
        
        return (
            <View style={styles.messageContainerWrapper}>
                 <ErrorState
                    icon={({ size, color, style }: any) => <Ionicons name="sad-outline" size={size} color={color} style={style} />}
                    title={error}
                    message={isNonRecoverableError ? '' : t('errors.genericError.message')}
                    onRetry={isNonRecoverableError ? undefined : loadInitialPosts}
                    retryText={t('common.tryAgain')}
                />
            </View>
        )
    }

    let emptyText = t('feed.empty');
    if (searchQuery) {
        emptyText = t('search.empty', { query: searchQuery });
    } else if (postFilter === 'reposts_only') {
        emptyText = t('profile.emptyReposts');
    } else if (postFilter === 'likes_only') {
        emptyText = t('feed.emptyLikes');
    } else if (postFilter === 'bookmarks_only') {
        emptyText = t('feed.emptyBookmarks');
    } else if (authorFeedFilter) {
        emptyText = t('profile.emptyFeed', { mediaType: 'media' });
    }

    return (
        <View style={styles.messageContainerWrapper}>
            <Text style={styles.infoText}>{emptyText}</Text>
        </View>
    );
  };

  const renderHeader = () => {
    if (!ListHeaderComponent) {
      return null;
    }
    if (React.isValidElement(ListHeaderComponent)) {
      return ListHeaderComponent;
    }
    const Header = ListHeaderComponent as React.ComponentType<any>;
    return <Header />;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        {renderHeader()}
        {layout === 'grid' ? (
                     <View style={{ paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginHorizontal: theme.spacing.xs }}>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </View>
              <View style={{ flex: 1, marginHorizontal: theme.spacing.xs }}>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FullPostCardSkeleton />
            <FullPostCardSkeleton />
          </View>
        )}
      </View>
    );
  }

  return (
    <FeedList
      data={moderatedFeed}
      layout={layout}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached} // Pass the new onEndReached prop
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderFooter={renderFooter}
      renderEmpty={renderListEmptyComponent}
      renderHeader={renderHeader}
      getItemType={getItemType}
    />
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  contentContainer: { paddingTop: theme.spacing.sm, paddingBottom: 60 },
          listContainer: { gap: theme.spacing.xs, paddingHorizontal: theme.spacing.sm },
  scrollViewContentGrid: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: 60,
      flexGrow: 1,
      width: '100%',
  },
  masonryContainer: {
      flexDirection: 'row',
      width: '100%',
      minHeight: 200,
  },
  column: {
      flex: 1,
      gap: theme.spacing.lg,
      marginHorizontal: theme.spacing.sm,
      minHeight: 200,
      alignSelf: 'stretch',
      width: '50%',
      overflow: 'visible',
      zIndex: 1,
  },
  messageContainerWrapper: {
      padding: theme.spacing.sm,
  },
  infoText: { 
      fontSize: theme.typography.bodyLarge.fontSize,
      color: theme.colors.onSurfaceVariant, 
      textAlign: 'center', 
      padding: theme.spacing.xl 
  },
  endOfList: { 
      fontSize: theme.typography.bodyMedium.fontSize,
      textAlign: 'center', 
      color: theme.colors.onSurfaceVariant, 
      padding: theme.spacing['2xl'] 
  },
});

export default FeedContainer;
