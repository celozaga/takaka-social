import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import { useTheme } from '@/components/shared';
import FeedItem from './FeedItem';
import useFeedOptimization from '@/hooks/useFeedOptimization';

interface VirtualizedFeedListProps {
  data: AppBskyFeedDefs.FeedViewPost[];
  layout: 'grid' | 'list';
  isLoadingMore: boolean;
  hasMore: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  keyExtractor: (item: AppBskyFeedDefs.FeedViewPost) => string;
  renderFooter: () => React.ReactElement | null;
  renderEmpty: () => React.ReactElement | null;
  renderHeader: () => React.ReactElement | null;
  getItemType: (item: AppBskyFeedDefs.FeedViewPost) => string;
}

const VirtualizedFeedList: React.FC<VirtualizedFeedListProps> = ({
  data,
  layout,
  isLoadingMore,
  hasMore,
  isRefreshing,
  onRefresh,
  onEndReached,
  keyExtractor,
  renderFooter,
  renderEmpty,
  renderHeader,
  getItemType,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Feed optimization with smart preloading
  const {
    handleScroll: optimizedHandleScroll,
    createOptimizedRenderItem,
    getOptimizedProps,
  } = useFeedOptimization(data, {
    preloadDistance: 1000,
    maxPreloadItems: 5,
    enableImagePreload: true,
    enableVideoPreload: false, // Keep videos on-demand for performance
  });

  // Base render item function
  const baseRenderItem: ListRenderItem<AppBskyFeedDefs.FeedViewPost> = useCallback(
    ({ item }) => {
      return <FeedItem item={item} layout={layout} />;
    },
    [layout]
  );

  // Optimized render item with preloading
  const renderItem = useMemo(
    () => createOptimizedRenderItem(baseRenderItem),
    [createOptimizedRenderItem, baseRenderItem]
  );

  // Estimate item size for better virtualization
  const getItemSize = useCallback(
    (item: AppBskyFeedDefs.FeedViewPost) => {
      if (layout === 'list') {
        // Base size for full post cards
        let estimatedHeight = 200;
        
        // Add height for media content
        if (item.post.embed?.$type === 'app.bsky.embed.images#view') {
          const images = (item.post.embed as AppBskyEmbedImages.View).images;
          if (images.length > 0 && images[0].aspectRatio) {
            const aspectRatio = images[0].aspectRatio;
            const imageHeight = (350 * aspectRatio.height) / aspectRatio.width;
            estimatedHeight += Math.min(Math.max(imageHeight, 200), 600);
          } else {
            estimatedHeight += 300; // Default image height
          }
        } else if (item.post.embed?.$type === 'app.bsky.embed.video#view') {
          const video = item.post.embed as AppBskyEmbedVideo.View;
          if (video.aspectRatio) {
            const videoHeight = (350 * video.aspectRatio.height) / video.aspectRatio.width;
            estimatedHeight += Math.min(Math.max(videoHeight, 200), 600);
          } else {
            estimatedHeight += 300; // Default video height
          }
        }
        
        // Add height for text content
        const record = item.post.record as { text?: string };
        if (record.text) {
          const textLength = record.text.length;
          const estimatedTextHeight = Math.ceil(textLength / 50) * 20; // Rough estimation
          estimatedHeight += Math.min(estimatedTextHeight, 100);
        }
        
        return estimatedHeight;
      } else {
        // Grid layout - variable heights for masonry effect
        let estimatedHeight = 200; // Base height
        
        if (item.post.embed?.$type === 'app.bsky.embed.images#view') {
          const images = (item.post.embed as AppBskyEmbedImages.View).images;
          if (images.length > 0 && images[0].aspectRatio) {
            const aspectRatio = images[0].aspectRatio;
            // Calculate height based on grid column width (roughly half screen)
            const imageHeight = (180 * aspectRatio.height) / aspectRatio.width;
            estimatedHeight = Math.max(200, imageHeight + 100);
          }
        } else if (item.post.embed?.$type === 'app.bsky.embed.video#view') {
          const video = item.post.embed as AppBskyEmbedVideo.View;
          if (video.aspectRatio) {
            const videoHeight = (180 * video.aspectRatio.height) / video.aspectRatio.width;
            estimatedHeight = Math.max(200, videoHeight + 100);
          }
        }
        
        // Add text content height
        const record = item.post.record as { text?: string };
        if (record.text) {
          const textLength = record.text.length;
          estimatedHeight += Math.min(textLength / 3, 60);
        }
        
        return estimatedHeight;
      }
    },
    [layout]
  );

  // Combine all props for FlashList with optimizations
  const flashListProps = useMemo(
    () => {
      const optimizedProps = getOptimizedProps();
      
      return {
        data,
        renderItem,
        keyExtractor,
        getItemType,
        estimatedItemSize: layout === 'list' ? 400 : 300,
        ListHeaderComponent: renderHeader,
        ListFooterComponent: renderFooter,
        ListEmptyComponent: renderEmpty,
        onEndReached: onEndReached,
        onEndReachedThreshold: 0.1, // More conservative threshold for better control
        refreshControl: (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ),
        contentContainerStyle: {
          paddingTop: theme.spacing.lg,
          paddingBottom: 60,
        },
        showsVerticalScrollIndicator: true,
        // Combine scroll handlers
        onScroll: optimizedHandleScroll,
        // Enhanced performance optimizations
        removeClippedSubviews: true,
        maxToRenderPerBatch: layout === 'grid' ? 8 : 4,
        updateCellsBatchingPeriod: 30, // Faster batching for smoother scrolling
        windowSize: 12, // Increased window size for better virtualization
        initialNumToRender: layout === 'grid' ? 6 : 3,
        // Memory management
        recycleItems: true,
        drawDistance: layout === 'grid' ? 300 : 400,
        // Apply optimization props
        ...optimizedProps,
        // Override scroll throttle for better performance
        scrollEventThrottle: 8, // Reduced for smoother scrolling
        // Grid-specific props
        ...(layout === 'grid' && {
          numColumns: 2,
          ItemSeparatorComponent: () => <View style={{ height: theme.spacing.sm }} />,
        }),
        // List-specific props
        ...(layout === 'list' && {
          ItemSeparatorComponent: () => <View style={{ height: theme.spacing.sm }} />,
          contentContainerStyle: {
            paddingTop: theme.spacing.lg,
            paddingBottom: 60,
            paddingHorizontal: 0,
          },
        }),
      };
    },
    [
      getOptimizedProps,
      optimizedHandleScroll,
      data,
      renderItem,
      keyExtractor,
      getItemType,
      layout,
      renderHeader,
      renderFooter,
      renderEmpty,
      onEndReached,
      isRefreshing,
      onRefresh,
      theme.colors.primary,
      theme.spacing.lg,
      theme.spacing.sm,
    ]
  );

  return (
    <FlashList
      {...flashListProps}
    />
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    endOfList: {
      fontSize: theme.typography.bodyMedium.fontSize,
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      padding: theme.spacing['2xl'],
    },
  });

export default VirtualizedFeedList;