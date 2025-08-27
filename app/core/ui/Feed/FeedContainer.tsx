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

interface FeedContainerProps {
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
        
        const res = await searchAgent.app.bsky.feed.searchPosts({ q: searchQuery, cursor: currentCursor, sort: searchSort, limit: 40 });
        const feed: AppBskyFeedDefs.FeedViewPost[] = res.data.posts.map(post => ({ post }));
        console.log('✅ SUCCESS: Search completed');
        return { data: { feed, cursor: res.data.cursor } };
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
        const feedAgent = session ? agent : publicApiAgent;
        console.log('🔍 DEBUG: Using agent type:', session ? 'authenticated' : 'public-api');
        console.log('🔍 DEBUG: Agent service URL:', feedAgent.service);
        console.log('🔍 DEBUG: Feed request parameters:', { feed: feedUri, cursor: currentCursor, limit: 30 });
        
        try {
            console.log('🔍 DEBUG: Starting getFeed request...');
            const result = await feedAgent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
            console.log('✅ SUCCESS: Feed fetched successfully, posts count:', result?.data?.feed?.length);
            return result;
        } catch (error: any) {
            console.error('❌ ERROR: Feed fetch failed:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                name: error.name,
                error: error
            });
            
            // If it's a public feed and we got a 401, try alternative approach for public content
            if (!session && (error.status === 401 || error.status === 403)) {
                console.log('🔄 DEBUG: Trying alternative public content approach...');
                
                try {
                    // Alternative 1: Try list feed endpoint (public, no auth required)
                    if (feedUri.includes('whats-hot') || feedUri.includes('discovery')) {
                        console.log('🔄 DEBUG: Using getListFeed as fallback for Discovery content');
                        try {
                            // Use a popular list for discovery content
                            const listResult = await publicApiAgent.app.bsky.feed.getListFeed({
                                list: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.graph.list/bsky-team',
                                cursor: currentCursor,
                                limit: 30
                            });
                            console.log('✅ SUCCESS: List feed approach worked, posts count:', listResult?.data?.feed?.length);
                            return listResult;
                        } catch (listError: any) {
                            console.log('⚠️ WARNING: List feed failed, trying search fallback...');
                        }
                    }
                    
                    // Alternative 2: Try searchPosts with relevant terms for discovery-like content
                    if (feedUri.includes('whats-hot') || feedUri.includes('discovery')) {
                        console.log('🔄 DEBUG: Using searchPosts as fallback for Discovery content');
                        const searchResult = await publicApiAgent.app.bsky.feed.searchPosts({ 
                            q: 'bluesky OR atproto OR social', 
                            cursor: currentCursor,
                            limit: 30,
                            sort: 'top'
                        });
                        const feed: AppBskyFeedDefs.FeedViewPost[] = searchResult.data.posts.map(post => ({ post }));
                        console.log('✅ SUCCESS: Alternative search approach worked, posts count:', feed.length);
                        return { data: { feed, cursor: searchResult.data.cursor } };
                    }
                    
                    // Alternative 3: For other feeds, try getting feed generator info and use search
                    console.log('🔄 DEBUG: Trying to fetch feed generator info as fallback');
                    const feedGenResult = await publicApiAgent.app.bsky.feed.getFeedGenerators({
                        feeds: [feedUri]
                    });
                    
                    if (feedGenResult.data.feeds.length > 0) {
                        const feedGen = feedGenResult.data.feeds[0];
                        console.log('🔄 DEBUG: Found feed generator, trying search with description terms');
                        
                        // Extract search terms from feed description
                        const searchTerms = feedGen.description?.split(' ').slice(0, 3).join(' ') || feedGen.displayName;
                        const searchResult = await publicApiAgent.app.bsky.feed.searchPosts({ 
                            q: searchTerms, 
                            cursor: currentCursor,
                            limit: 30 
                        });
                        const feed: AppBskyFeedDefs.FeedViewPost[] = searchResult.data.posts.map(post => ({ post }));
                        console.log('✅ SUCCESS: Feed generator info approach worked, posts count:', feed.length);
                        return { data: { feed, cursor: searchResult.data.cursor } };
                    }
                    
                } catch (fallbackError: any) {
                    console.error('❌ ERROR: All fallback approaches failed:', fallbackError);
                }
            }
            
            throw error;
        }
    }
    
    // D. FALLBACK
    return Promise.resolve({ data: { feed: [], cursor: undefined } });
  }, [agent, publicAgent, publicApiAgent, feedUri, session, searchQuery, searchSort, authorFeedFilter, postFilter]);

  const fetchAndFilterPage = useCallback(async (currentCursor?: string) => {
    const response = await fetchPosts(currentCursor);
    const posts = response.data.feed || [];
    const nextCursor = response.data.cursor;

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
  }, [fetchPosts, authorFeedFilter, postFilter, layout, mediaFilter, feedUri]);

  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeed([]);
    setCursor(undefined);
    setHasMore(true);

    try {
        let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let nextCursor: string | undefined;
        let attempts = 0;
        let canFetchMore = true;

        // Para o layout grid, carregar posts de forma otimizada
        const targetLoadSize = layout === 'grid' ? 20 : (feedUri === 'following' ? 20 : INITIAL_LOAD_SIZE);
        const maxAttempts = layout === 'grid' ? 6 : (feedUri === 'following' ? 5 : 3);

        while (accumulatedPosts.length < targetLoadSize && attempts < maxAttempts && canFetchMore) {
            const batchResult = await fetchAndFilterPage(nextCursor);
            
            const newUniquePosts = batchResult.posts.filter(p => !accumulatedPosts.some(ap => ap.post.uri === p.post.uri));
            accumulatedPosts.push(...newUniquePosts);
            
            nextCursor = batchResult.cursor;
            canFetchMore = !!nextCursor && batchResult.originalCount > 0;
            attempts++;
            
            // Break early if we have enough posts for grid layout
            if (layout === 'grid' && accumulatedPosts.length >= 12) break;
            if (accumulatedPosts.length >= targetLoadSize) break;
        }

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

  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadInitialPosts().finally(() => setIsRefreshing(false));
  }, [loadInitialPosts]);

  const loadMorePosts = useCallback(async () => {
    // Previne múltiplas chamadas simultâneas
    if (isLoadingMoreRef.current || !cursor || !hasMore) return;
    
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
        let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let nextCursor: string | undefined = cursor;
        let attempts = 0;
        let canFetchMore = true;

        // Carregamento progressivo otimizado para layout grid
        const targetLoadSize = layout === 'grid' ? 15 : PROGRESSIVE_LOAD_SIZE;
        while (accumulatedPosts.length < targetLoadSize && attempts < MAX_FETCH_ATTEMPTS && canFetchMore) {
            const batchResult = await fetchAndFilterPage(nextCursor);
            accumulatedPosts.push(...batchResult.posts);
            nextCursor = batchResult.cursor;
            canFetchMore = !!nextCursor && batchResult.originalCount > 0;
            attempts++;
        }

        if (accumulatedPosts.length > 0) {
            setFeed(prevFeed => {
                const existingUris = new Set(prevFeed.map(p => p.post.uri));
                const uniqueNewPosts = accumulatedPosts.filter(p => !existingUris.has(p.post.uri));
                return [...prevFeed, ...uniqueNewPosts];
            });
        }
        setCursor(nextCursor);
        setHasMore(canFetchMore);

    } finally {
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
    }
  }, [cursor, hasMore, fetchAndFilterPage]);

  // Função otimizada para carregamento progressivo durante scroll
  const handleScrollProgress = useCallback((nativeEvent: any) => {
    const now = Date.now();
    const scrollPosition = nativeEvent.contentOffset.y;
    const contentHeight = nativeEvent.contentSize.height;
    const layoutHeight = nativeEvent.layoutMeasurement.height;
    
    // Carrega mais posts quando está a 70% do scroll e não está carregando
    const shouldLoadMore = scrollPosition + layoutHeight >= contentHeight * 0.7;
    
    // Previne múltiplas chamadas em um curto período (debounce de 300ms)
    if (shouldLoadMore && !isLoadingMoreRef.current && now - lastLoadTriggerRef.current > 300) {
      lastLoadTriggerRef.current = now;
      loadMorePosts();
    }
  }, [loadMorePosts]);
  
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
                     <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
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
      onLoadMore={loadMorePosts}
      onScrollProgress={handleScrollProgress}
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
  contentContainer: { paddingTop: theme.spacing.lg, paddingBottom: 60 },
          listContainer: { gap: theme.spacing.xs, paddingHorizontal: theme.spacing.lg },
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
      padding: theme.spacing.lg,
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
