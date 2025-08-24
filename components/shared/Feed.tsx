import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import FullPostCard from '../post/FullPostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, FlatList, LayoutChangeEvent, ScrollView } from 'react-native';
import { theme } from '@/lib/theme';
import FullPostCardSkeleton from '../post/FullPostCardSkeleton';
import ErrorState from './ErrorState';
import { Frown } from 'lucide-react';

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

const isPostAMediaPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    return (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) || AppBskyEmbedVideo.isView(embed);
};

const hasPhotos = (post: AppBskyFeedDefs.PostView): boolean => {
    return post.embed?.$type === 'app.bsky.embed.images#view' && (post.embed as AppBskyEmbedImages.View).images.length > 0;
}
const hasVideos = (post: AppBskyFeedDefs.PostView): boolean => {
    return post.embed?.$type === 'app.bsky.embed.video#view';
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
  const { agent, session } = useAtp();
  const { t } = useTranslation();
  const moderation = useModeration();
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const imageWidth = useMemo(() => {
    if (layout !== 'grid' || containerWidth === 0) return undefined;
    // containerWidth - horizontal padding - gap between columns
    const contentWidth = containerWidth - (theme.spacing.s * 2) - (theme.spacing.s * 2);
    return Math.floor(contentWidth / 2);
  }, [containerWidth, layout]);

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
        const res = await agent.app.bsky.feed.searchPosts({ q: searchQuery, cursor: currentCursor, sort: searchSort, limit: 40 });
        const feed: AppBskyFeedDefs.FeedViewPost[] = res.data.posts.map(post => ({ post }));
        return { data: { feed, cursor: res.data.cursor } };
    }

    // C. FEED-BASED FETCHING
    if (feedUri) {
        if (feedUri === 'following') {
            if (!session) return { data: { feed: [], cursor: undefined } };
            return agent.app.bsky.feed.getTimeline({ cursor: currentCursor, limit: 30 });
        }
        if (authorFeedFilter) {
            return agent.app.bsky.feed.getAuthorFeed({ actor: feedUri, cursor: currentCursor, limit: 30, filter: authorFeedFilter });
        }
        return agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
    }
    
    // D. FALLBACK
    return Promise.resolve({ data: { feed: [], cursor: undefined } });
  }, [agent, feedUri, session, searchQuery, searchSort, authorFeedFilter, postFilter]);

  const fetchAndFilterPage = useCallback(async (currentCursor?: string) => {
    const response = await fetchPosts(currentCursor);
    const posts = response.data.feed || [];
    const nextCursor = response.data.cursor;

    const isProfileContext = !!authorFeedFilter || !!postFilter;
    let processedPosts = isProfileContext ? posts : posts.filter(item => !item.reply);
    
    if (postFilter === 'reposts_only') {
        processedPosts = processedPosts.filter(item => !!item.reason && AppBskyFeedDefs.isReasonRepost(item.reason));
    }
    
    if (layout === 'grid') {
        processedPosts = processedPosts.filter(item => isPostAMediaPost(item.post));
        if (mediaFilter === 'photos') processedPosts = processedPosts.filter(item => hasPhotos(item.post));
        if (mediaFilter === 'videos') processedPosts = processedPosts.filter(item => hasVideos(item.post));
    }

    return { posts: processedPosts, cursor: nextCursor, originalCount: posts.length };
  }, [fetchPosts, authorFeedFilter, postFilter, layout, mediaFilter]);

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

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => `${item.post.cid}-${AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : ''}`;

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={{ paddingVertical: theme.spacing.xl }}>
          <ActivityIndicator size="large" color={theme.colors.onSurface} />
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
                    icon={Frown}
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
      <View onLayout={onLayout}>
        {renderHeader()}
        {layout === 'grid' ? (
          <View style={styles.skeletonContainer}>
            <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
            <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
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
              onLayout={onLayout}
              {...flatListProps}
              renderItem={({item}: {item: AppBskyFeedDefs.FeedViewPost}) => <View style={{paddingHorizontal: theme.spacing.l}}><FullPostCard feedViewPost={item} /></View>}
              ItemSeparatorComponent={() => <View style={{height: theme.spacing.s}} />}
          />
      )
  }

  // Masonry layout for grid
  const numColumns = 2;
  const columns: AppBskyFeedDefs.FeedViewPost[][] = Array.from({ length: numColumns }, () => []);
  moderatedFeed.forEach((item, i) => {
      columns[i % numColumns].push(item);
  });

  return (
      <ScrollView
          onLayout={onLayout}
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
                              <PostCard key={keyExtractor(item)} feedViewPost={item} imageWidth={imageWidth} />
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
    skeletonContainer: { flexDirection: 'row', gap: theme.spacing.l, paddingHorizontal: theme.spacing.l },
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