import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyFeedGetTimeline, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, FlatList } from 'react-native';

interface TimelineProps {
  feedUri: string; // 'following' or a feed URI
}

const isPostAMediaPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;

    // Only show posts with direct media.
    return (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) || AppBskyEmbedVideo.isView(embed);
};

const Timeline: React.FC<TimelineProps> = ({ feedUri }) => {
  const { agent } = useAtp();
  const { t } = useTranslation();
  const moderation = useModeration();
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const columns = 2;


  const filterMediaPosts = (posts: AppBskyFeedDefs.FeedViewPost[]): AppBskyFeedDefs.FeedViewPost[] => {
    // Filter out replies and posts without direct media.
    return posts.filter(item => !item.reply && isPostAMediaPost(item.post));
  };
  
  const fetchPosts = useCallback(async (currentCursor?: string) => {
    if (feedUri === 'following') {
      if (!agent.hasSession) {
        return Promise.resolve({
            success: true,
            data: { feed: [], cursor: undefined }
        } as AppBskyFeedGetTimeline.Response);
      }
      return agent.getTimeline({ cursor: currentCursor, limit: 25 });
    }
    return agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 25 });
  }, [agent, feedUri]);


  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !cursor || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetchPosts(cursor);

      if (response.data.feed.length > 0) {
        const newMediaPosts = filterMediaPosts(response.data.feed);
        setFeed(prevFeed => {
            const existingCids = new Set(prevFeed.map(p => p.post.cid));
            const uniqueNewPosts = newMediaPosts.filter(p => !existingCids.has(p.post.cid));
            return [...prevFeed, ...uniqueNewPosts];
        });

        if (response.data.cursor) {
          setCursor(response.data.cursor);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, fetchPosts]);

  // Effect for initial data load
  useEffect(() => {
    const fetchInitialTimeline = async () => {
      setIsLoading(true);
      setError(null);
      setFeed([]);
      setCursor(undefined);
      setHasMore(true);

      try {
        const response = await fetchPosts();
        const mediaPosts = filterMediaPosts(response.data.feed);
        setFeed(mediaPosts);
        
        if (response.data.cursor && response.data.feed.length > 0) {
          setCursor(response.data.cursor);
        } else {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch timeline:', err);
        setError(t('timeline.loadingError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialTimeline();
  }, [fetchPosts, t]);
  
  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) {
        return [];
    }
    return feed.filter(item => {
        const decision = moderatePost(item.post, moderation);
        return decision.visibility !== 'hide';
    });
  }, [feed, moderation]);

  const keyExtractor = (item: AppBskyFeedDefs.FeedViewPost) => `${item.post.cid}-${AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by.did : ''}`;
  
  const renderItem = ({ item }: { item: AppBskyFeedDefs.FeedViewPost }) => (
    <View style={{ flex: 1 }}>
      <PostCard feedViewPost={item} />
    </View>
  );

  if (isLoading) {
    return (
        <View style={styles.grid}>
            {[...Array(columns)].map((_, colIndex) => (
              <View key={colIndex} style={styles.gridItem}>
                {[...Array(4)].map((_, i) => <PostCardSkeleton key={i} />)}
              </View>
            ))}
        </View>
    );
  }

  if (error) {
    return <View style={styles.messageContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <FlatList
        data={moderatedFeed}
        key={columns} // Change key on column change to re-render
        numColumns={columns}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
        ListFooterComponent={() => (
            <>
            {isLoadingMore && (
                <View style={styles.grid}>
                    {[...Array(columns)].map((_, i) => <View key={i} style={styles.gridItem}><PostCardSkeleton /></View>)}
                </View>
            )}
            {!hasMore && moderatedFeed.length > 0 && (
                <View style={styles.endMessageContainer}>
                    <Text style={styles.infoText}>{t('common.endOfList')}</Text>
                </View>
            )}
            </>
        )}
        ListEmptyComponent={
            !isLoading && !hasMore ? (
                <View style={styles.messageContainer}>
                    <Text style={styles.infoText}>{t('timeline.empty')}</Text>
                </View>
            ) : null
        }
    />
  );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 16,
        paddingHorizontal: 16,
    },
    gridItem: {
        flex: 1,
        gap: 16,
    },
    columnWrapper: {
      gap: 16,
    },
    contentContainer: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    messageContainer: {
        padding: 32,
        backgroundColor: '#1E2021',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    errorText: {
        color: '#F2B8B5',
        textAlign: 'center',
    },
    infoText: {
        color: '#C3C6CF',
        textAlign: 'center',
    },
    endMessageContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    }
});

export default Timeline;