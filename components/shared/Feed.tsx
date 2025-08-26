import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedExternal } from '@atproto/api';
import PostCard from '../post/PostCard';
import FullPostCard from '../post/FullPostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, FlatList, ScrollView } from 'react-native';
import { theme } from '@/lib/theme';
import FullPostCardSkeleton from '../post/FullPostCardSkeleton';
import ErrorState from './ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { FEATURES, FEED_CONFIG, isFeatureEnabled } from '@/lib/config';

type MediaFilter = 'all' | 'photos' | 'videos';
type AuthorFeedFilter = 'posts_no_replies' | 'posts_with_replies' | 'posts_with_media';

interface FeedProps {
  feedUri?: string;
  authorFeedFilter?: AuthorFeedFilter;
  searchQuery?: string;
  searchSort?: 'latest' | 'top';
  mediaFilter?: MediaFilter;
  layout?: 'grid' | 'list';
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  postFilter?: 'reposts_only' | 'likes_only' | 'bookmarks_only';
}

const MIN_BATCH_SIZE = 10;
const MAX_FETCH_ATTEMPTS = 5; // To prevent infinite loops

/**
 * Enhanced media post detection using feature flags
 */
const isPostAMediaPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    
    // For search results, be more permissive to show more content
    if (!isFeatureEnabled('VISUAL_ONLY_FEEDS')) {
        return true;
    }
    
    if (!embed) return false;
    
    // Check for images
    if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
        return true;
    }
    
    // Check for videos
    if (AppBskyEmbedVideo.isView(embed)) {
        return true;
    }
    
    // Check for external links with preview images (if enabled)
    if (AppBskyEmbedExternal.isView(embed) && embed.external?.thumb) {
        return true;
    }
    
    // Allow external links even without thumbnails for search results
    if (AppBskyEmbedExternal.isView(embed)) {
        return true;
    }
    
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
    return FEED_CONFIG.ALLOWED_EMBED_TYPES.includes(embedType);
}

/**
 * Check if post is a quote post (should be filtered out)
 */
const isQuotePost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    
    // Check for record embeds (quotes) using config
    return FEED_CONFIG.EXCLUDED_EMBED_TYPES.includes(embed.$type);
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

const Feed: React.FC<FeedProps> = ({ 
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
            return agent.app.bsky.feed.getTimeline({ cursor: currentCursor, limit: 30 });
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
        console.log('🔍 DEBUG: Agent service URL:', feedAgent.service?.baseURL || feedAgent.service);
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
      console.log('🔍 DEBUG: First post sample:', posts[0] ? {
        uri: posts[0].post.uri,
        hasEmbed: !!posts[0].post.embed,
        embedType: posts[0].post.embed?.$type,
        hasReply: !!posts[0].reply
      } : 'No posts');
    }

    const isProfileContext = !!authorFeedFilter || !!postFilter;
    
    // Apply content policy filtering (replies, quotes, text-only posts)
    // STRICT: Apply reply/quote filtering to ALL feeds (including profile context)
    let processedPosts = posts.filter(item => {
        // Always filter replies (except in dedicated reply sections)
        if (item.reply && !postFilter?.includes('replies')) {
            if (__DEV__) console.log('🚫 DEBUG: Removing reply from feed:', item.post.uri);
            return false;
        }
        
        // Always filter quotes (not supported in this app)
        if (isQuotePost(item.post)) {
            if (__DEV__) console.log('🚫 DEBUG: Removing quote from feed:', item.post.uri);
            return false;
        }
        
        // Apply other content policies only to non-profile contexts
        if (!isProfileContext && shouldFilterPost(item)) {
            return false;
        }
        
        return true;
    });
    
    if (__DEV__) console.log('🔍 DEBUG: After policy filter:', processedPosts.length);
    
    // Apply specific post type filters
    if (postFilter === 'reposts_only') {
        processedPosts = processedPosts.filter(item => !!item.reason && AppBskyFeedDefs.isReasonRepost(item.reason));
    }
    
    // Apply layout-specific filtering
    if (layout === 'grid') {
        if (__DEV__) console.log('🔍 DEBUG: Applying grid layout filtering...');
        // For grid layout, ensure posts have media
        const beforeMedia = processedPosts.length;
        processedPosts = processedPosts.filter(item => isPostAMediaPost(item.post));
        if (__DEV__) console.log('🔍 DEBUG: Grid media filter:', beforeMedia, '→', processedPosts.length);
        
        // Apply media type filters
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
  }, [fetchPosts, authorFeedFilter, postFilter, layout, mediaFilter]);

  const loadInitialPosts = useCallback(async () => {
    console.log('📋 DEBUG: Feed loadInitialPosts called - feedUri:', feedUri, 'session:', !!session, 'searchQuery:', searchQuery);
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

        while (accumulatedPosts.length < MIN_BATCH_SIZE && attempts < MAX_FETCH_ATTEMPTS && canFetchMore) {
            const batchResult = await fetchAndFilterPage(nextCursor);
            
            const newUniquePosts = batchResult.posts.filter(p => !accumulatedPosts.some(ap => ap.post.uri === p.post.uri));
            accumulatedPosts.push(...newUniquePosts);
            
            nextCursor = batchResult.cursor;
            canFetchMore = !!nextCursor && batchResult.originalCount > 0;
            attempts++;
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
  }, [fetchAndFilterPage, t, postFilter]);

  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadInitialPosts().finally(() => setIsRefreshing(false));
  }, [loadInitialPosts]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !cursor || !hasMore) return;
    setIsLoadingMore(true);

    try {
        let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let nextCursor: string | undefined = cursor;
        let attempts = 0;
        let canFetchMore = true;

        while (accumulatedPosts.length < MIN_BATCH_SIZE && attempts < MAX_FETCH_ATTEMPTS && canFetchMore) {
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
    }
  }, [cursor, hasMore, isLoadingMore, fetchAndFilterPage]);
  
  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) return [];
    return feed.filter(item => moderatePost(item.post, moderation).visibility !== 'hide');
  }, [feed, moderation]);

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => {
    // Create unique key for each feed item to prevent rendering issues
    const baseKey = item.post.cid || item.post.uri;
    const reasonKey = AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : '';
    const timestampKey = item.post.indexedAt || '';
    return `${baseKey}-${reasonKey}-${timestampKey}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      if (layout === 'grid') {
        // Render skeletons in a 2-column layout to match the grid
        return (
          <View style={[styles.masonryContainer, { marginTop: theme.spacing.l }]}>
            <View style={styles.column}><PostCardSkeleton /></View>
            <View style={styles.column}><PostCardSkeleton /></View>
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
      <View>
        {renderHeader()}
        {layout === 'grid' ? (
          <View style={{ paddingHorizontal: theme.spacing.s }}>
            <View style={styles.masonryContainer}>
                <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
                <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
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

  const flatListProps = {
      data: moderatedFeed,
      keyExtractor,
      ListHeaderComponent,
      ListFooterComponent: renderFooter,
      ListEmptyComponent: renderListEmptyComponent,
      onEndReached: loadMorePosts,
      onEndReachedThreshold: 0.7,
      refreshControl: <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />,
      contentContainerStyle: {paddingTop: theme.spacing.l, paddingBottom: 60}
  };

  if (layout === 'list') {
      return (
          <FlatList 
              {...flatListProps}
              renderItem={({item}: {item: AppBskyFeedDefs.FeedViewPost}) => <View style={{paddingHorizontal: theme.spacing.l}}><FullPostCard feedViewPost={item} /></View>}
              ItemSeparatorComponent={() => <View style={{height: theme.spacing.s}} />}
          />
      )
  }

  // Enhanced masonry layout for grid with better balancing
  const numColumns = 2;
  const columns: AppBskyFeedDefs.FeedViewPost[][] = Array.from({ length: numColumns }, () => []);
  
  // Distribute posts evenly across columns
  if (moderatedFeed.length > 0) {
      moderatedFeed.forEach((item, i) => {
          // Round-robin distribution
          const targetColumn = i % numColumns;
          columns[targetColumn].push(item);
      });
      
      // Final validation: ensure both columns have content if we have posts
      const totalPosts = moderatedFeed.length;
      if (totalPosts > 0) {
          // If one column is empty and we have posts, redistribute
          if (columns[0].length === 0 && columns[1].length > 0) {
              const halfLength = Math.ceil(columns[1].length / 2);
              columns[0] = columns[1].splice(0, halfLength);
          } else if (columns[1].length === 0 && columns[0].length > 0) {
              const halfLength = Math.ceil(columns[0].length / 2);
              columns[1] = columns[0].splice(0, halfLength);
          }
      }
      
      // Debug: Log column distribution in development
      if (__DEV__) {
          console.log('📊 DEBUG: Column distribution:', {
              total: totalPosts,
              column0: columns[0].length,
              column1: columns[1].length,
              balanced: Math.abs(columns[0].length - columns[1].length) <= 1
          });
      }
  }

  return (
      <ScrollView
          refreshControl={
              <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
              />
          }
          onScroll={({ nativeEvent }) => {
              if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 400) {
                  loadMorePosts();
              }
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollViewContentGrid}
      >
          {renderHeader()}
          {moderatedFeed.length === 0 ? (
              renderListEmptyComponent()
          ) : (
              <View style={styles.masonryContainer}>
                  {columns.map((col, colIndex) => (
                      <View key={colIndex} style={styles.column}>
                          {col.map((item) => (
                              <PostCard key={keyExtractor(item)} feedViewPost={item} />
                          ))}
                      </View>
                  ))}
              </View>
          )}
          {renderFooter()}
      </ScrollView>
  );
};

const styles = StyleSheet.create({
    contentContainer: { paddingTop: theme.spacing.l, paddingBottom: 60 },
    listContainer: { gap: theme.spacing.s, paddingHorizontal: theme.spacing.l },
    scrollViewContentGrid: {
        paddingHorizontal: theme.spacing.s,
        paddingBottom: 60,
    },
    masonryContainer: {
        flexDirection: 'row',
    },
    column: {
        flex: 1,
        gap: theme.spacing.l,
        marginHorizontal: theme.spacing.s,
    },
    messageContainerWrapper: {
        padding: theme.spacing.l,
    },
    infoText: { ...theme.typography.bodyLarge, color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: theme.spacing.xl },
    endOfList: { ...theme.typography.bodyMedium, textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: theme.spacing.xxl },
});

export default Feed;