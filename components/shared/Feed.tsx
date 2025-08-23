import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import FullPostCard from '../post/FullPostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl, FlatList } from 'react-native';
import { theme } from '@/lib/theme';
import FullPostCardSkeleton from '../post/FullPostCardSkeleton';

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
}

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
    ListHeaderComponent 
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

  const fetchPosts = useCallback(async (currentCursor?: string) => {
    if (searchQuery) {
        const res = await agent.app.bsky.feed.searchPosts({ q: searchQuery, cursor: currentCursor, sort: searchSort, limit: 40 });
        const feed: AppBskyFeedDefs.FeedViewPost[] = res.data.posts.map(post => ({ post }));
        return { data: { feed, cursor: res.data.cursor } };
    }
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
    return Promise.resolve({ data: { feed: [], cursor: undefined } });
  }, [agent, feedUri, session, searchQuery, searchSort, authorFeedFilter]);

  
  const processAndSetFeed = useCallback((newPosts: AppBskyFeedDefs.FeedViewPost[], currentCursor?: string) => {
      // Per user request, all replies are filtered from feed views.
      let processedPosts = newPosts.filter(item => !item.reply);
      
      if (layout === 'grid') {
          processedPosts = processedPosts.filter(item => isPostAMediaPost(item.post));
          if (mediaFilter === 'photos') processedPosts = processedPosts.filter(item => hasPhotos(item.post));
          if (mediaFilter === 'videos') processedPosts = processedPosts.filter(item => hasVideos(item.post));
      }
      // For list view, no further filtering is needed here as replies are already removed.
      
      if (currentCursor) {
          setFeed(prevFeed => {
              const existingUris = new Set(prevFeed.map(p => p.post.uri));
              const uniqueNewPosts = processedPosts.filter(p => !existingUris.has(p.post.uri));
              return [...prevFeed, ...uniqueNewPosts];
          });
      } else {
          setFeed(processedPosts);
      }

  }, [layout, mediaFilter]);

  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeed([]);
    setCursor(undefined);
    setHasMore(true);
    try {
        const response = await fetchPosts();
        const posts = response.data.feed || [];
        processAndSetFeed(posts);
        setCursor(response.data.cursor);
        setHasMore(!!response.data.cursor && posts.length > 0);
    } catch (err: any) {
        setError(t('feed.loadingError'));
    } finally {
        setIsLoading(false);
    }
  }, [fetchPosts, processAndSetFeed, t]);

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
      const response = await fetchPosts(cursor);
      const posts = response.data.feed || [];
      if (posts.length > 0) {
        processAndSetFeed(posts, cursor);
        setCursor(response.data.cursor);
        setHasMore(!!response.data.cursor);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, fetchPosts, processAndSetFeed]);
  
  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) return [];
    return feed.filter(item => moderatePost(item.post, moderation).visibility !== 'hide');
  }, [feed, moderation]);

  const { column1Items, column2Items } = useMemo(() => {
    if (layout !== 'grid') return { column1Items: [], column2Items: [] };
    const col1: AppBskyFeedDefs.FeedViewPost[] = [];
    const col2:AppBskyFeedDefs.FeedViewPost[] = [];
    moderatedFeed.forEach((item, index) => {
        if (index % 2 === 0) col1.push(item);
        else col2.push(item);
    });
    return { column1Items: col1, column2Items: col2 };
  }, [moderatedFeed, layout]);

  const renderHeader = () => {
    if (!ListHeaderComponent) {
      return null;
    }
    // Handle both Component and Element types
    if (typeof ListHeaderComponent === 'function') {
      const Header = ListHeaderComponent;
      return <Header />;
    }
    return ListHeaderComponent;
  };

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => `${item.post.cid}-${AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : ''}`;
  
  const handleScroll = ({ nativeEvent }: { nativeEvent: { layoutMeasurement: any, contentOffset: any, contentSize: any } }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 500;
    if (isCloseToBottom && !isLoadingMore && hasMore) {
        loadMorePosts();
    }
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      if (layout === 'grid') {
        return (
          <View style={styles.masonryContainer}>
            <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
            <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
          </View>
        );
      }
      return (
        <View style={{ paddingHorizontal: theme.spacing.l, gap: theme.spacing.s, marginTop: theme.spacing.s }}>
          <FullPostCardSkeleton />
          <FullPostCardSkeleton />
        </View>
      );
    }
    if (!hasMore && moderatedFeed.length > 0) {
      return <Text style={styles.endOfList}>{t('common.endOfList')}</Text>;
    }
    return null;
  };
  
  const renderListEmptyComponent = () => (
    <View style={styles.messageContainer}>
      {error ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadInitialPosts} style={styles.tryAgainButton}><Text style={styles.tryAgainText}>{t('common.tryAgain')}</Text></Pressable>
        </View>
      ) : (
        <Text style={styles.infoText}>{t('feed.empty')}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View>
        <>
          {renderHeader()}
          {layout === 'grid' ? (
            <View style={styles.masonryContainer}>
              <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
              <View style={styles.column}><PostCardSkeleton /><PostCardSkeleton /></View>
            </View>
          ) : (
            <View style={styles.listContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          )}
        </>
      </View>
    );
  }

  if (moderatedFeed.length === 0 && !isLoading) {
      return (
          <ScrollView 
            contentContainerStyle={{paddingTop: theme.spacing.l}}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          >
              <View>
                <>
                  {renderHeader()}
                  {renderListEmptyComponent()}
                </>
              </View>
          </ScrollView>
      )
  }

  if (layout === 'list') {
      return (
          <FlatList
              data={moderatedFeed}
              renderItem={({item}) => <View style={{paddingHorizontal: theme.spacing.l}}><FullPostCard feedViewPost={item} /></View>}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={() => <View style={{height: theme.spacing.s}} />}
              ListHeaderComponent={ListHeaderComponent}
              ListFooterComponent={renderFooter}
              onEndReached={loadMorePosts}
              onEndReachedThreshold={0.7}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
              contentContainerStyle={{paddingTop: theme.spacing.l, paddingBottom: 80}}
          />
      )
  }

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>
        <View style={styles.contentContainer}>
            <>
              {renderHeader()}
              <View style={styles.masonryContainer}>
                  <View style={styles.column}>{column1Items.map(item => <PostCard key={keyExtractor(item)} feedViewPost={item} />)}</View>
                  <View style={styles.column}>{column2Items.map(item => <PostCard key={keyExtractor(item)} feedViewPost={item} />)}</View>
              </View>
              {renderFooter()}
            </>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    contentContainer: { paddingTop: theme.spacing.l, paddingBottom: 60 },
    masonryContainer: { flexDirection: 'row', gap: theme.spacing.l, paddingHorizontal: theme.spacing.l, },
    listContainer: { gap: theme.spacing.s, paddingHorizontal: theme.spacing.l, alignItems: 'center' },
    column: { flex: 1, gap: theme.spacing.l, },
    messageContainer: { padding: theme.spacing.xxl, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.large, alignItems: 'center', justifyContent: 'center', margin: theme.spacing.l },
    errorText: { ...theme.typography.bodyLarge, color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.l },
    infoText: { ...theme.typography.bodyLarge, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
    endOfList: { ...theme.typography.bodyMedium, textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: theme.spacing.xxl },
    tryAgainButton: { backgroundColor: theme.colors.surfaceContainerHigh, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.m, borderRadius: theme.shape.full, },
    tryAgainText: { ...theme.typography.labelLarge, color: theme.colors.onSurface, }
});

export default Feed;