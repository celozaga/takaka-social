
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyFeedGetTimeline } from '@atproto/api';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import PostBubble from '../post/PostBubble';

interface TimelineProps {
  feedUri: string; // 'following' or a feed URI
}

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

  const loaderRef = useRef<HTMLDivElement>(null);

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
        setFeed(response.data.feed);
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
        setFeed(prevFeed => {
            const existingCids = new Set(prevFeed.map(p => p.post.cid));
            const uniqueNewPosts = response.data.feed.filter(p => !existingCids.has(p.post.cid));
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

  useEffect(() => {
    fetchInitialTimeline();
  }, [fetchInitialTimeline]);
  
  const moderatedFeed = useMemo(() => {
    if (!moderation.isReady) {
        return [];
    }
    return feed.filter(item => {
        const decision = moderatePost(item.post, moderation);
        return decision.visibility !== 'hide';
    });
  }, [feed, moderation]);

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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface-2 rounded-xl p-4 h-32 animate-pulse"></div>
        ))}
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
    <div className="space-y-4">
      {moderatedFeed.map((feedViewPost) => (
        <PostBubble key={`${feedViewPost.post.cid}-${AppBskyFeedDefs.isReasonRepost(feedViewPost.reason) ? feedViewPost.reason.by.did : ''}`} post={feedViewPost.post} showAuthor />
      ))}

      <div ref={loaderRef} className="h-10">
        {isLoadingMore && (
           <div className="bg-surface-2 rounded-xl p-4 h-20 animate-pulse"></div>
        )}
      </div>

      {!hasMore && moderatedFeed.length > 0 && (
        <div className="text-center text-on-surface-variant py-8">{t('common.endOfList')}</div>
      )}
    </div>
  );
};

export default Timeline;
