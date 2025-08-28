import { useMemo, useCallback, useRef } from 'react';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import { ListRenderItem } from '@shopify/flash-list';

interface UseVirtualizedFeedProps {
  data: AppBskyFeedDefs.FeedViewPost[];
  layout: 'grid' | 'list';
  onLoadMore: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoadingMore: boolean;
}

interface UseVirtualizedFeedReturn {
  flashListProps: any;
  getItemSize: (item: AppBskyFeedDefs.FeedViewPost) => number;
  keyExtractor: (item: AppBskyFeedDefs.FeedViewPost) => string;
  getItemType: (item: AppBskyFeedDefs.FeedViewPost) => string;
}

export const useVirtualizedFeed = ({
  data,
  layout,
  onLoadMore,
  onRefresh,
  isRefreshing,
  isLoadingMore,
}: UseVirtualizedFeedProps): UseVirtualizedFeedReturn => {
  const scrollOffsetRef = useRef(0);
  const lastScrollTimeRef = useRef(0);

  // Optimized key extractor with caching
  const keyExtractor = useCallback(
    (item: AppBskyFeedDefs.FeedViewPost) => {
      return `${item.post.uri}-${layout}`;
    },
    [layout]
  );

  // Enhanced item type detection for better recycling
  const getItemType = useCallback(
    (item: AppBskyFeedDefs.FeedViewPost) => {
      const embed = item.post.embed;
      const record = item.post.record as { text?: string };
      
      if (embed?.$type === 'app.bsky.embed.video#view') {
        return layout === 'grid' ? 'video-grid' : 'video-list';
      }
      
      if (embed?.$type === 'app.bsky.embed.images#view') {
        const images = (embed as AppBskyEmbedImages.View).images;
        const hasMultipleImages = images.length > 1;
        const aspectRatio = images[0]?.aspectRatio;
        
        if (aspectRatio) {
          const ratio = aspectRatio.width / aspectRatio.height;
          if (ratio > 1.5) {
            return layout === 'grid' ? 'image-landscape-grid' : 'image-landscape-list';
          } else if (ratio < 0.7) {
            return layout === 'grid' ? 'image-portrait-grid' : 'image-portrait-list';
          }
        }
        
        return hasMultipleImages 
          ? (layout === 'grid' ? 'image-multiple-grid' : 'image-multiple-list')
          : (layout === 'grid' ? 'image-single-grid' : 'image-single-list');
      }
      
      // Text-only posts
      const textLength = record?.text?.length || 0;
      if (textLength > 200) {
        return layout === 'grid' ? 'text-long-grid' : 'text-long-list';
      }
      
      return layout === 'grid' ? 'text-short-grid' : 'text-short-list';
    },
    [layout]
  );

  // Advanced item size estimation
  const getItemSize = useCallback(
    (item: AppBskyFeedDefs.FeedViewPost) => {
      const embed = item.post.embed;
      const record = item.post.record as { text?: string };
      
      if (layout === 'list') {
        let baseHeight = 120; // Author info + padding
        
        // Add text height
        if (record?.text) {
          const textLength = record.text.length;
          const lines = Math.ceil(textLength / 60); // Approximate characters per line
          baseHeight += Math.min(lines * 20, 80); // Max 4 lines for preview
        }
        
        // Add media height
        if (embed?.$type === 'app.bsky.embed.images#view') {
          const images = (embed as AppBskyEmbedImages.View).images;
          if (images[0]?.aspectRatio) {
            const aspectRatio = images[0].aspectRatio;
            const imageHeight = (350 * aspectRatio.height) / aspectRatio.width;
            baseHeight += Math.min(Math.max(imageHeight, 200), 500);
          } else {
            baseHeight += 300;
          }
        } else if (embed?.$type === 'app.bsky.embed.video#view') {
          const video = embed as AppBskyEmbedVideo.View;
          if (video.aspectRatio) {
            const videoHeight = (350 * video.aspectRatio.height) / video.aspectRatio.width;
            baseHeight += Math.min(Math.max(videoHeight, 200), 500);
          } else {
            baseHeight += 300;
          }
        }
        
        return baseHeight + 40; // Footer height
      } else {
        // Grid layout
        let baseHeight = 100; // Base card height
        
        // Add text height (limited in grid)
        if (record?.text) {
          const textLength = record.text.length;
          baseHeight += Math.min(textLength / 4, 40);
        }
        
        // Add media height
        if (embed?.$type === 'app.bsky.embed.images#view') {
          const images = (embed as AppBskyEmbedImages.View).images;
          if (images[0]?.aspectRatio) {
            const aspectRatio = images[0].aspectRatio;
            // Grid column is roughly 180px wide
            const imageHeight = (180 * aspectRatio.height) / aspectRatio.width;
            baseHeight += Math.min(Math.max(imageHeight, 150), 400);
          } else {
            baseHeight += 200;
          }
        } else if (embed?.$type === 'app.bsky.embed.video#view') {
          const video = embed as AppBskyEmbedVideo.View;
          if (video.aspectRatio) {
            const videoHeight = (180 * video.aspectRatio.height) / video.aspectRatio.width;
            baseHeight += Math.min(Math.max(videoHeight, 150), 400);
          } else {
            baseHeight += 200;
          }
        }
        
        return baseHeight + 60; // Author info + padding
      }
    },
    [layout]
  );

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(
    (event: any) => {
      const currentTime = Date.now();
      const { contentOffset } = event.nativeEvent;
      
      // Throttle scroll events to improve performance
      if (currentTime - lastScrollTimeRef.current < 16) {
        return;
      }
      
      lastScrollTimeRef.current = currentTime;
      scrollOffsetRef.current = contentOffset.y;
    },
    []
  );

  // Optimized load more with debouncing
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore) {
      onLoadMore();
    }
  }, [onLoadMore, isLoadingMore]);

  // Memoized FlashList props
  const flashListProps = useMemo(
    () => ({
      // Performance optimizations
      removeClippedSubviews: true,
      maxToRenderPerBatch: layout === 'grid' ? 8 : 4,
      updateCellsBatchingPeriod: 50,
      windowSize: layout === 'grid' ? 8 : 6,
      initialNumToRender: layout === 'grid' ? 6 : 3,
      
      // Scroll optimizations
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      
      // Load more optimization
      onEndReached: handleLoadMore,
      onEndReachedThreshold: 0.3,
      
      // Layout-specific optimizations
      ...(layout === 'grid' && {
        numColumns: 2,
        // Staggered rendering for masonry effect
        drawDistance: 250,
      }),
      
      // Memory management
      recycleItems: true,
      estimatedItemSize: layout === 'list' ? 400 : 280,
      
      // Refresh control
      refreshing: isRefreshing,
      onRefresh,
    }),
    [
      layout,
      handleScroll,
      handleLoadMore,
      isRefreshing,
      onRefresh,
    ]
  );

  return {
    flashListProps,
    getItemSize,
    keyExtractor,
    getItemType,
  };
};

export default useVirtualizedFeed;