
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedGetTimeline, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';

interface TimelineProps {
  feedUri: string; // 'following' or a feed URI
  cache?: {
    get: () => TimelineCache,
    set: (state: TimelineCache) => void,
  }
}

export interface TimelineCache {
  feed: AppBskyFeedDefs.FeedViewPost[];
  cursor?: string;
  scrollPosition: number;
  hasMore: boolean;
}

const isPostAMediaPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;

    // Only show posts with direct media.
    return (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) || AppBskyEmbedVideo.isView(embed);
};

const Timeline: React.FC<TimelineProps> = ({ feedUri, cache }) => {
  const initialState = cache?.get();
  const { agent } = useAtp();
  const { t } = useTranslation();
  const moderation = useModeration();
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>(initialState?.feed || []);
  const [isLoading, setIsLoading] = useState(!initialState?.feed || initialState.feed.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(initialState?.cursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialState?.hasMore ?? true);

  const loaderRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<Omit<TimelineCache, 'scrollPosition'> | undefined>(undefined);
  
  useEffect(() => {
    stateRef.current = { feed, cursor, hasMore };
  });

  const filterMediaPosts = (posts: AppBskyFeedDefs.FeedViewPost[]): AppBskyFeedDefs.FeedViewPost[] => {
    // Filter out replies and posts without direct media.
    return posts.filter(item => !item.reply && isPostAMediaPost(item.post));
  };
  
  const fetchPosts = useCallback(async (currentCursor?: string) => {
    if (feedUri === 'following') {
      if (!agent.hasSession) {
        return Promise.resolve({
            success: true,
            headers: {},
            data: { feed: [] }
        } as AppBskyFeedGetTimeline.Response);
      }
      return agent.getTimeline({ cursor: currentCursor, limit: 25 });
    }
    return agent.app.bsky.feed.getFeed({ feed: feedUri, cursor: currentCursor, limit: 25 });
  }, [agent, feedUri]);

  const fetchInitialTimeline = useCallback(async () => {
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
  }, [fetchPosts, t]);


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

  // Effect for initial data load or cache restoration
  useEffect(() => {
    if (!initialState || initialState.feed.length === 0) {
      fetchInitialTimeline();
    }
  }, [fetchInitialTimeline, initialState]);
  
  // Effect for saving state on unmount and restoring scroll
  useEffect(() => {
    if (initialState?.scrollPosition) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: initialState.scrollPosition, behavior: 'auto' });
      });
    }

    return () => {
      if (cache && stateRef.current) {
        cache.set({
          ...stateRef.current,
          scrollPosition: window.scrollY,
        });
      }
    };
  }, [cache]);
  
  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) {
        return [];
    }
    return feed.filter(item => {
        const decision = moderatePost(item.post, moderation);
        return decision.visibility !== 'hide';
    });
  }, [feed, moderation]);

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: AppBskyFeedDefs.FeedViewPost[] = [];
    const right: AppBskyFeedDefs.FeedViewPost[] = [];
    moderatedFeed.forEach((item, index) => {
      if (index % 2 === 0) {
        left.push(item);
      } else {
        right.push(item);
      }
    });
    return { leftColumn: left, rightColumn: right };
  }, [moderatedFeed]);


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
      <div className="flex gap-4">
        <div className="w-1/2 space-y-4">
            {[...Array(4)].map((_, i) => <PostCardSkeleton key={`L-${i}`} />)}
        </div>
        <div className="w-1/2 space-y-4">
            {[...Array(4)].map((_, i) => <PostCardSkeleton key={`R-${i}`} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error}</div>;
  }
  
  if (moderatedFeed.length === 0 && !isLoading && !hasMore) {
    return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">{t('timeline.empty')}</div>;
  }

  return (
    <div>
      <div className="flex gap-4 items-start">
        <div className="w-1/2 space-y-4">
          {leftColumn.map((feedViewPost) => (
            <PostCard key={`${feedViewPost.post.cid}-${AppBskyFeedDefs.isReasonRepost(feedViewPost.reason) ? feedViewPost.reason.by.did : ''}`} feedViewPost={feedViewPost} />
          ))}
        </div>
        <div className="w-1/2 space-y-4">
          {rightColumn.map((feedViewPost) => (
            <PostCard key={`${feedViewPost.post.cid}-${AppBskyFeedDefs.isReasonRepost(feedViewPost.reason) ? feedViewPost.reason.by.did : ''}`} feedViewPost={feedViewPost} />
          ))}
        </div>
      </div>

      <div ref={loaderRef} className="h-10">
        {isLoadingMore && (
          <div className="flex gap-4 mt-4">
             <div className="w-1/2 space-y-4">
                <PostCardSkeleton />
             </div>
             <div className="w-1/2 space-y-4">
                <PostCardSkeleton />
             </div>
          </div>
        )}
      </div>

      {!hasMore && moderatedFeed.length > 0 && (
        <div className="text-center text-on-surface-variant py-8">{t('common.endOfList')}</div>
      )}
    </div>
  );
};

export default Timeline;
