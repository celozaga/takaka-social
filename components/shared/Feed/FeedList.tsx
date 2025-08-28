import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import { useTheme } from '@/components/shared';
import VirtualizedFeedList from './VirtualizedFeedList';

interface FeedListProps {
  data: AppBskyFeedDefs.FeedViewPost[];
  layout: 'grid' | 'list';
  isLoadingMore: boolean;
  hasMore: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void; // Replaces onLoadMore and onScrollProgress
  keyExtractor: (item: AppBskyFeedDefs.FeedViewPost) => string;
  renderItem: ({ item }: { item: AppBskyFeedDefs.FeedViewPost }) => React.ReactElement;
  renderFooter: () => React.ReactElement | null;
  renderEmpty: () => React.ReactElement | null;
  renderHeader: () => React.ReactElement | null;
  getItemType: (item: AppBskyFeedDefs.FeedViewPost) => string;
}

const FeedList: React.FC<FeedListProps> = ({
  data,
  layout,
  isLoadingMore,
  hasMore,
  isRefreshing,
  onRefresh,
  onEndReached,
  keyExtractor,
  renderItem,
  renderFooter,
  renderEmpty,
  renderHeader,
  getItemType,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Use VirtualizedFeedList for list layout, custom masonry for grid
  if (layout === 'list') {
    return (
      <VirtualizedFeedList
        data={data}
        layout={layout}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        keyExtractor={keyExtractor}
        renderFooter={renderFooter}
        renderEmpty={renderEmpty}
        renderHeader={renderHeader}
        getItemType={getItemType}
      />
    );
  }

  // For grid layout, use custom masonry implementation
  if (layout === 'grid') {
    // True masonry layout with dynamic column distribution
      const renderMasonryLayout = () => {
      const columns: AppBskyFeedDefs.FeedViewPost[][] = [[], []];
      let columnHeights = [0, 0]; // Track heights of each column
      
      // Distribute posts across columns based on estimated height
      data.forEach((item, index) => {
        // Estimate height based on content type
        let estimatedHeight = 200; // Base height
        
        if (item.post.embed?.$type === 'app.bsky.embed.images#view') {
          const images = (item.post.embed as AppBskyEmbedImages.View).images;
          if (images.length > 0) {
            const aspectRatio = images[0].aspectRatio;
            if (aspectRatio) {
              // Calculate height based on image aspect ratio
              const imageHeight = (150 * aspectRatio.height) / aspectRatio.width; // 150px width
              estimatedHeight = Math.max(200, imageHeight + 100); // Add padding for text
            }
          }
        } else if (item.post.embed?.$type === 'app.bsky.embed.video#view') {
          const video = item.post.embed as AppBskyEmbedVideo.View;
          if (video.aspectRatio) {
            const videoHeight = (150 * video.aspectRatio.height) / video.aspectRatio.width;
            estimatedHeight = Math.max(200, videoHeight + 100);
          }
        }
        
        // Add text content height estimation
        const record = item.post.record as { text?: string };
        if (record.text) {
          const textLength = record.text.length;
          const textLines = Math.ceil(textLength / 50); // Rough estimate: 50 chars per line
          estimatedHeight += textLines * 20; // 20px per line
        }
        
        // Choose the shorter column
        const targetColumn = columnHeights[0] <= columnHeights[1] ? 0 : 1;
        columns[targetColumn].push(item);
        columnHeights[targetColumn] += estimatedHeight;
      });

      return (
        <View style={{ flexDirection: 'row', paddingHorizontal: theme.spacing.sm }}>
          {columns.map((column, columnIndex) => (
            <View key={columnIndex} style={{ flex: 1, marginHorizontal: theme.spacing.xs }}>
              {column.map((item, itemIndex) => (
                <View key={item.post.uri} style={{ marginBottom: theme.spacing.sm }}>
                  {renderItem({ item })}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    };

    // Use ScrollView for masonry layout with infinite loading
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: theme.spacing.lg,
          paddingBottom: 60,
          flexGrow: 1
        }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary} 
          />
        }
        showsVerticalScrollIndicator={true}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          const paddingToBottom = 20;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom) {
            onEndReached();
          }
        }}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        {renderMasonryLayout()}
        
        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <View style={{ padding: theme.spacing.sm, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
        
        {/* End of list indicator */}
        {!hasMore && data.length > 0 && (
          <View style={{ padding: theme.spacing.sm, alignItems: 'center' }}>
            <Text style={styles.endOfList}>End of list</Text>
          </View>
        )}
        
        {/* Empty state */}
        {data.length === 0 && renderEmpty()}
      </ScrollView>
    );
  }

  // Fallback return (should not reach here)
  return null;
};

const createStyles = (theme: any) => StyleSheet.create({
  endOfList: { 
    fontSize: theme.typography.bodyMedium.fontSize,
    textAlign: 'center', 
    color: theme.colors.onSurfaceVariant, 
    padding: theme.spacing['2xl'] 
  },
});

export default FeedList;
