import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import theme from '@/lib/theme';

type MediaFilter = 'all' | 'photos' | 'videos';

interface FeedProps {
  feedUri: string; // 'following', at:// URI, or actor handle/did
  mediaFilter?: MediaFilter;
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


const Feed: React.FC<FeedProps> = ({ feedUri, mediaFilter = 'all', ListHeaderComponent }) => {
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
    try {
        if (feedUri === 'following') {
            if (!session) return { data: { feed: [], cursor: undefined } };
            return agent.app.bsky.feed.getTimeline({ cursor: currentCursor, limit: 30 });
        }
        if (feedUri.startsWith('at://')) {
            return agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
        }
        // Assume it's an actor handle/did for getAuthorFeed
        return agent.app.bsky.feed.getAuthorFeed({ actor: feedUri, cursor: currentCursor, limit: 30 });
    } catch (e: any) {
        // If getAuthorFeed fails for a URI that looked like a handle, it might be a feed URI from a custom domain.
        if (!feedUri.startsWith('at://') && feedUri.includes('/')) {
            try {
                return agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 30 });
            } catch (e2) {
                console.error("Failed to fetch feed as both author and feed URI:", e2);
                throw e2; // throw original error
            }
        }
        throw e;
    }
  }, [agent, feedUri, session]);

  const applyMediaFilter = useCallback((posts: AppBskyFeedDefs.FeedViewPost[]): AppBskyFeedDefs.FeedViewPost[] => {
    const baseFiltered = posts.filter(item => !item.reply && isPostAMediaPost(item.post));
     switch (mediaFilter) {
        case 'all': return baseFiltered;
        case 'photos': return baseFiltered.filter(item => hasPhotos(item.post));
        case 'videos': return baseFiltered.filter(item => hasVideos(item.post));
        default: return baseFiltered;
    }
  }, [mediaFilter]);

  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeed([]);
    setCursor(undefined);
    setHasMore(true);
    try {
        const response = await fetchPosts();
        const mediaPosts = applyMediaFilter(response.data.feed);
        setFeed(mediaPosts);
        setCursor(response.data.cursor);
        setHasMore(!!response.data.cursor && response.data.feed.length > 0);
    } catch (err: any) {
        setError(t('feed.loadingError'));
    } finally {
        setIsLoading(false);
    }
  }, [fetchPosts, applyMediaFilter, t]);

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
      if (response.data.feed.length > 0) {
        const newMediaPosts = applyMediaFilter(response.data.feed);
        setFeed(prevFeed => {
            const existingCids = new Set(prevFeed.map(p => p.post.cid));
            const uniqueNewPosts = newMediaPosts.filter(p => !existingCids.has(p.post.cid));
            return [...prevFeed, ...uniqueNewPosts];
        });
        setCursor(response.data.cursor);
        setHasMore(!!response.data.cursor);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, fetchPosts, applyMediaFilter]);
  
  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) return [];
    return feed.filter(item => moderatePost(item.post, moderation).visibility !== 'hide');
  }, [feed, moderation]);

  const { column1Items, column2Items } = useMemo(() => {
    const col1: AppBskyFeedDefs.FeedViewPost[] = [];
    const col2: AppBskyFeedDefs.FeedViewPost[] = [];
    moderatedFeed.forEach((item, index) => {
        if (index % 2 === 0) {
            col1.push(item);
        } else {
            col2.push(item);
        }
    });
    return { column1Items: col1, column2Items: col2 };
  }, [moderatedFeed]);

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => `${item.post.cid}-${AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : ''}`;
  
  const handleScroll = ({ nativeEvent }: { nativeEvent: { layoutMeasurement: any, contentOffset: any, contentSize: any } }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 500;
    if (isCloseToBottom) {
        loadMorePosts();
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.masonryContainer}>
          <View style={styles.column}>
            {[...Array(4)].map((_, i) => <PostCardSkeleton key={`L-${i}`} />)}
          </View>
          <View style={styles.column}>
            {[...Array(4)].map((_, i) => <PostCardSkeleton key={`R-${i}`} />)}
          </View>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadInitialPosts} style={styles.tryAgainButton}>
            <Text style={styles.tryAgainText}>{t('common.tryAgain')}</Text>
          </Pressable>
        </View>
      );
    }
    if (moderatedFeed.length === 0) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.infoText}>{t('feed.empty')}</Text>
        </View>
      );
    }
    return (
        <View style={styles.masonryContainer}>
            <View style={styles.column}>
                {column1Items.map(item => (
                    <PostCard key={keyExtractor(item)} feedViewPost={item} />
                ))}
            </View>
            <View style={styles.column}>
                {column2Items.map(item => (
                    <PostCard key={keyExtractor(item)} feedViewPost={item} />
                ))}
            </View>
        </View>
    );
  };

  return (
    <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.contentContainer}
    >
        {ListHeaderComponent}
        {renderContent()}
        {isLoadingMore && <ActivityIndicator size="large" style={{ marginVertical: 20 }} color={theme.colors.primary} />}
        {!hasMore && moderatedFeed.length > 0 && <Text style={styles.endOfList}>{t('common.endOfList')}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    contentContainer: { 
        paddingHorizontal: theme.spacing.l, 
        paddingTop: theme.spacing.l
    },
    masonryContainer: {
        flexDirection: 'row',
        gap: theme.spacing.l,
    },
    column: {
        flex: 1,
        gap: theme.spacing.l,
    },
    messageContainer: { 
        padding: theme.spacing.xxl, 
        backgroundColor: theme.colors.surfaceContainer, 
        borderRadius: theme.shape.large, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: theme.spacing.l,
    },
    errorText: { 
        ...theme.typography.bodyLarge,
        color: theme.colors.error, 
        textAlign: 'center', 
        marginBottom: theme.spacing.l
    },
    infoText: { 
        ...theme.typography.bodyLarge,
        color: theme.colors.onSurfaceVariant, 
        textAlign: 'center' 
    },
    endOfList: { 
        ...theme.typography.bodyMedium,
        textAlign: 'center', 
        color: theme.colors.onSurfaceVariant,
        padding: theme.spacing.xxl 
    },
    tryAgainButton: {
        backgroundColor: theme.colors.surfaceContainerHigh,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.shape.full,
    },
    tryAgainText: {
        ...theme.typography.labelLarge,
        color: theme.colors.onSurface,
    }
});

export default Feed;