import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, NativeScrollEvent, RefreshControl } from 'react-native';

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

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => `${item.post.cid}-${AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : ''}`;

  const columnsData = useMemo(() => {
    const left: AppBskyFeedDefs.FeedViewPost[] = [];
    const right: AppBskyFeedDefs.FeedViewPost[] = [];
    moderatedFeed.forEach((item, index) => {
      if (index % 2 === 0) {
        left.push(item);
      } else {
        right.push(item);
      }
    });
    return { left, right };
  }, [moderatedFeed]);

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
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
      <View>
        <View style={styles.masonryContainer}>
          <View style={styles.column}>
            {columnsData.left.map(item => <PostCard key={keyExtractor(item)} feedViewPost={item} />)}
          </View>
          <View style={styles.column}>
            {columnsData.right.map(item => <PostCard key={keyExtractor(item)} feedViewPost={item} />)}
          </View>
        </View>
        {isLoadingMore && <ActivityIndicator size="large" style={{ marginVertical: 20 }} />}
        {!hasMore && moderatedFeed.length > 0 && <Text style={styles.endOfList}>{t('common.endOfList')}</Text>}
      </View>
    );
  };
  
  const Header = ListHeaderComponent;

  return (
    <ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#A8C7FA" />
      }
    >
      <View>
        {Header && (React.isValidElement(Header) ? Header : <Header />)}
        {renderContent()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    masonryContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    column: {
        flex: 1,
        gap: 16,
    },
    messageContainer: { 
        padding: 32, 
        backgroundColor: '#1E2021', 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 16, 
        marginHorizontal: 16, 
    },
    errorText: { 
        color: '#F2B8B5', 
        textAlign: 'center', 
        marginBottom: 16 
    },
    infoText: { 
        color: '#C3C6CF', 
        textAlign: 'center' 
    },
    endOfList: { 
        textAlign: 'center', 
        color: '#C3C6CF', 
        padding: 32 
    },
    tryAgainButton: {
        backgroundColor: '#2b2d2e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
    },
    tryAgainText: {
        color: '#E2E2E6',
        fontWeight: 'bold',
    }
});

export default Feed;