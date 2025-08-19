
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedGetTimeline, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';

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
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  // Effect for IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { rootMargin: '200px' }
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
      <div className="columns-2 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="break-inside-avoid mb-4">
            <PostCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error}</div>;
  }
  
  if (feed.length === 0) {
    return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">{t('timeline.empty')}</div>;
  }

  return (
    <div>
      <div className="columns-2 gap-4">
        {feed.map((feedViewPost) => (
          <div key={`${feedViewPost.post.cid}-${AppBskyFeedDefs.isReasonRepost(feedViewPost.reason) ? feedViewPost.reason.by.did : ''}`} className="break-inside-avoid mb-4">
            <PostCard feedViewPost={feedViewPost} />
          </div>
        ))}
      </div>

      <div ref={loaderRef} className="h-10"> {/* Sentinel element */}
        {isLoadingMore && (
          <div className="columns-2 gap-4 mt-4">
            <div className="break-inside-avoid mb-4">
              <PostCardSkeleton />
            </div>
            <div className="break-inside-avoid mb-4">
              <PostCardSkeleton />
            </div>
          </div>
        )}
      </div>

      {!hasMore && feed.length > 0 && (
        <div className="text-center text-on-surface-variant py-8">{t('common.endOfList')}</div>
      )}
    </div>
  );
};

export default Timeline;
