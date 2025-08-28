import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import { useImagePreloader } from '@/components/shared/Image/SmartImageCache';
import { debounce } from 'lodash';

interface FeedOptimizationOptions {
  preloadDistance?: number; // Distance in pixels to start preloading
  maxPreloadItems?: number; // Maximum items to preload ahead
  enableImagePreload?: boolean;
  enableVideoPreload?: boolean;
}

interface FeedItem {
  post: AppBskyFeedDefs.PostView;
  index: number;
}

export const useFeedOptimization = (
  data: AppBskyFeedDefs.FeedViewPost[],
  options: FeedOptimizationOptions = {}
) => {
  const {
    preloadDistance = 1000,
    maxPreloadItems = 5,
    enableImagePreload = true,
    enableVideoPreload = true,
  } = options;

  const { preloadImages } = useImagePreloader();
  const scrollOffsetRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const preloadedItemsRef = useRef(new Set<number>());
  const itemPositionsRef = useRef(new Map<number, { y: number; height: number }>());

  // Extract images and videos from post embeds
  const extractMediaFromPost = useCallback((post: AppBskyFeedDefs.PostView) => {
    const media: { images: string[]; videos: string[] } = { images: [], videos: [] };

    if (post.embed) {
      // Handle image embeds
      if (AppBskyEmbedImages.isView(post.embed)) {
        media.images = post.embed.images.map(img => 
          typeof img.thumb === 'string' ? img.thumb : (img.thumb as any)?.uri || ''
        );
      }

      // Handle video embeds
      if (AppBskyEmbedVideo.isView(post.embed)) {
        if (post.embed.thumbnail) {
          const thumbnailUrl = typeof post.embed.thumbnail === 'string' 
            ? post.embed.thumbnail 
            : (post.embed.thumbnail as any)?.uri || '';
          media.images.push(thumbnailUrl);
        }
      }

      // Handle record with media embeds
      if (post.embed.$type === 'app.bsky.embed.recordWithMedia#view' && 'media' in post.embed && post.embed.media) {
        if (AppBskyEmbedImages.isView(post.embed.media)) {
          media.images.push(...post.embed.media.images.map(img => 
            typeof img.thumb === 'string' ? img.thumb : (img.thumb as any)?.uri || ''
          ));
        }
        if (AppBskyEmbedVideo.isView(post.embed.media) && 'thumbnail' in post.embed.media && post.embed.media.thumbnail) {
          const thumbnailUrl = typeof post.embed.media.thumbnail === 'string'
            ? post.embed.media.thumbnail
            : (post.embed.media.thumbnail as any)?.uri || '';
          media.images.push(thumbnailUrl);
        }
      }
    }

    return media;
  }, []);

  // Preload media for specific items
  const preloadMediaForItems = useCallback(
    (itemIndices: number[]) => {
      itemIndices.forEach(index => {
        if (preloadedItemsRef.current.has(index) || !data[index]) return;

        const feedViewPost = data[index];
        const media = extractMediaFromPost(feedViewPost.post);

        // Preload images
        if (enableImagePreload && media.images.length > 0) {
          preloadImages(media.images, 'low');
        }

        // Mark as preloaded
        preloadedItemsRef.current.add(index);
      });
    },
    [data, extractMediaFromPost, preloadImages, enableImagePreload]
  );

  // Calculate which items should be preloaded based on scroll position
  const calculatePreloadItems = useCallback(() => {
    const currentScrollY = scrollOffsetRef.current;
    const viewportHeight = viewportHeightRef.current;
    const preloadThreshold = currentScrollY + viewportHeight + preloadDistance;

    const itemsToPreload: number[] = [];
    let preloadCount = 0;

    // Find items within preload distance
    for (const [index, position] of itemPositionsRef.current.entries()) {
      if (preloadCount >= maxPreloadItems) break;
      
      if (position.y <= preloadThreshold && !preloadedItemsRef.current.has(index)) {
        itemsToPreload.push(index);
        preloadCount++;
      }
    }

    return itemsToPreload;
  }, [preloadDistance, maxPreloadItems]);

  // Debounced scroll handler
  const debouncedScrollHandler = useMemo(
    () => debounce(() => {
      const itemsToPreload = calculatePreloadItems();
      if (itemsToPreload.length > 0) {
        preloadMediaForItems(itemsToPreload);
      }
    }, 100),
    [calculatePreloadItems, preloadMediaForItems]
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      scrollOffsetRef.current = contentOffset.y;
      viewportHeightRef.current = layoutMeasurement.height;
      
      debouncedScrollHandler();
    },
    [debouncedScrollHandler]
  );

  // Handle item layout to track positions
  const handleItemLayout = useCallback(
    (index: number, layout: { y: number; height: number }) => {
      itemPositionsRef.current.set(index, layout);
    },
    []
  );

  // Optimized render item with layout tracking
  const createOptimizedRenderItem = useCallback(
    (originalRenderItem: (info: any) => React.ReactElement) => {
      return (info: any) => {
        const { index } = info;
        
        return React.createElement(
          View,
          {
            onLayout: (event: any) => {
              const { y, height } = event.nativeEvent.layout;
              handleItemLayout(index, { y, height });
            }
          },
          originalRenderItem(info)
        );
      };
    },
    [handleItemLayout]
  );

  // Preload initial items
  useEffect(() => {
    if (data.length > 0) {
      const initialItems = Array.from({ length: Math.min(3, data.length) }, (_, i) => i);
      preloadMediaForItems(initialItems);
    }
  }, [data, preloadMediaForItems]);

  // Clean up preloaded items when data changes
  useEffect(() => {
    preloadedItemsRef.current.clear();
    itemPositionsRef.current.clear();
  }, [data]);

  // Get optimized FlashList props
  const getOptimizedProps = useCallback(() => {
    return {
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      removeClippedSubviews: true,
      maxToRenderPerBatch: 3,
      updateCellsBatchingPeriod: 50,
      windowSize: 6,
      initialNumToRender: 3,
      getItemLayout: (data: any, index: number) => {
        const position = itemPositionsRef.current.get(index);
        return position ? {
          length: position.height,
          offset: position.y,
          index,
        } : null;
      },
    };
  }, [handleScroll]);

  return {
    handleScroll,
    handleItemLayout,
    createOptimizedRenderItem,
    getOptimizedProps,
    preloadMediaForItems,
  };
};

export default useFeedOptimization;