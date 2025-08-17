import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyFeedGetTimeline, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';

interface TimelineProps {
  feedUri: string; // 'following' or a feed URI
}

const Timeline: React.FC<TimelineProps> = ({ feedUri }) => {
  const { agent } = useAtp();
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement>(null);

  const filterMediaPosts = (posts: AppBskyFeedDefs.FeedViewPost[]): AppBskyFeedDefs.FeedViewPost[] => {
    return posts.filter(item => {
      const embed = item.post.embed;
      if (!embed) {
        return false;
      }

      // Case 1: Standard image embed
      if (AppBskyEmbedImages.isView(embed)) {
        return true;
      }

      // Case 2: Direct video embed
      if (AppBskyEmbedVideo.isView(embed)) {
        return true;
      }

      // Case 3: Embed with media (could contain images or video)
      if (AppBskyEmbedRecordWithMedia.isView(embed)) {
        const media = embed.media;
        if (AppBskyEmbedImages.isView(media)) {
          return true;
        }
        if (AppBskyEmbedVideo.isView(media)) {
          return true;
        }
      }
      return false;
    });
  };
  
  const fetchPosts = useCallback(async (currentCursor?: string) => {
    if (feedUri === 'following') {
      // UPDATED GUARD: Rely only on the agent's state, which is mutated synchronously on logout,
      // avoiding potential race conditions with React's async state updates.
      if (!agent.hasSession) {
        // Gracefully handle logout race condition
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
        // Avoid adding duplicate posts
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
        setError('Could not load this feed. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialTimeline();
  }, [fetchPosts]);

  // Effect for IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before the element is visible
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
      <div className="grid grid-cols-2 gap-4">
        {[...Array(8)].map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error}</div>;
  }
  
  if (feed.length === 0) {
    return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No visual posts found in this feed.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {feed.map(({ post }) => (
          <PostCard key={post.cid} post={post} />
        ))}
      </div>

      <div ref={loaderRef} className="h-10"> {/* Sentinel element */}
        {isLoadingMore && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}
      </div>

      {!hasMore && feed.length > 0 && (
        <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
      )}
    </div>
  );
};

export default Timeline;