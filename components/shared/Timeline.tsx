
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyFeedGetTimeline, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

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
  const { width } = useWindowDimensions();
  const isWide = width > 640;


  const loaderRef = useRef<HTMLDivElement>(null);

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


  // Effect for IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { rootMargin: '400px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMorePosts]);

  if (isLoading) {
    return (
        <View style={styles.grid}>
            {[...Array(8)].map((_, i) => (
                <View key={i} style={styles.gridItem}>
                    <PostCardSkeleton />
                </View>
            ))}
        </View>
    );
  }

  if (error) {
    return <View style={styles.messageContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }
  
  if (moderatedFeed.length === 0 && !isLoading && !hasMore) {
    return <View style={styles.messageContainer}><Text style={styles.infoText}>{t('timeline.empty')}</Text></View>;
  }

  const columns = isWide ? 2 : 1;
  const columnData: AppBskyFeedDefs.FeedViewPost[][] = Array.from({ length: columns }, () => []);
  moderatedFeed.forEach((item, index) => {
    columnData[index % columns].push(item);
  });

  return (
    <View>
      <View style={styles.timelineContainer}>
        {columnData.map((columnItems, colIndex) => (
          <View key={colIndex} style={{ flex: 1, gap: 16 }}>
            {columnItems.map((feedViewPost) => (
              <PostCard key={`${feedViewPost.post.cid}-${AppBskyFeedDefs.isReasonRepost(feedViewPost.reason) ? feedViewPost.reason.by.did : ''}`} feedViewPost={feedViewPost} />
            ))}
          </View>
        ))}
      </View>


      <View ref={loaderRef as any} style={{ height: 40 }}>
        {isLoadingMore && (
          <View style={[styles.timelineContainer, { marginTop: 16 }]}>
            <View style={{ flex: 1, gap: 16 }}>
              <PostCardSkeleton />
            </View>
            {isWide && <View style={{ flex: 1, gap: 16 }}><PostCardSkeleton /></View>}
          </View>
        )}
      </View>

      {!hasMore && moderatedFeed.length > 0 && (
        <View style={styles.endMessageContainer}>
            <Text style={styles.infoText}>{t('common.endOfList')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        gap: 16,
    },
    gridItem: {
        flex: 1,
    },
    messageContainer: {
        padding: 32,
        backgroundColor: '#1E2021',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#F2B8B5',
        textAlign: 'center',
    },
    infoText: {
        color: '#C3C6CF',
        textAlign: 'center',
    },
    timelineContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    endMessageContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    }
});

export default Timeline;
