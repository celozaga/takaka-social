import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { useHiddenPosts } from '../context/HiddenPostsContext';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyFeedGetTimeline, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';

interface TimelineProps {
  feedUri: string; // 'following' or a feed URI
}

const Timeline: React.FC<TimelineProps> = ({ feedUri }) => {
  const { agent } = useAtp();
  const { hiddenPostUris } = useHiddenPosts();
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement>(null);

  const filterAndSetPosts = (posts: AppBskyFeedDefs.FeedViewPost[], append = false) => {
    const mediaPosts = posts.filter(item => {
        const embed = item.post.embed;
        if (!embed) return false;
        if (AppBskyEmbedImages.isView(embed)) return true;
        if (AppBskyEmbedVideo.isView(embed)) return true;
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            const media = embed.media;
            if (AppBskyEmbedImages.isView(media)) return true;
            if (AppBskyEmbedVideo.isView(media)) return true;
        }
        return false;
    });

    const visiblePosts = mediaPosts.filter(p => !hiddenPostUris.has(p.post.uri));
    
    if (append) {
        setFeed(prevFeed => {
            const existingCids = new Set(prevFeed.map(p => p.post.cid));
            const uniqueNewPosts = visiblePosts.filter(p => !existingCids.has(p.post.cid));
            return [...prevFeed, ...uniqueNewPosts];
        });
    } else {
        setFeed(visiblePosts);
    }
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
        filterAndSetPosts(response.data.feed, true);

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
  }, [cursor, hasMore, isLoadingMore, fetchPosts, hiddenPostUris]);

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
        filterAndSetPosts(response.data.feed);
        
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
  }, [fetchPosts, hiddenPostUris]);

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
    return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No visual posts found in this feed.</div>;
  }

  return (
    <div>
      <div className="columns-2 gap-4">
        {feed.map(({ post }) => (
          <div key={post.cid} className="break-inside-avoid mb-4">
            <PostCard post={post} />
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
        <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
      )}
    </div>
  );
};

export default Timeline;