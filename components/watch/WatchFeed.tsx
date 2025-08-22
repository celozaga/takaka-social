
import React, { useRef, useState } from 'react';
import { FlatList, View, ActivityIndicator, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import VideoPlayer from './VideoPlayer';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface Props {
  videoPosts: AppBskyFeedDefs.FeedViewPost[];
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const WatchFeed: React.FC<Props> = ({ videoPosts, loadMore, isLoadingMore, hasMore }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const { height } = useWindowDimensions();

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <FlatList
      data={videoPosts}
      keyExtractor={item => item.post.uri}
      renderItem={({ item, index }) => (
        <View style={{ height }}>
          <VideoPlayer 
            postView={item} 
            paused={index !== activeIndex}
          />
        </View>
      )}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
      onEndReached={loadMore}
      onEndReachedThreshold={3}
      ListFooterComponent={() => {
        if (isLoadingMore) return <View style={{height, justifyContent: 'center'}}><ActivityIndicator size="large" color="white" /></View>;
        if (!hasMore && videoPosts.length > 0) return <View style={[styles.fullScreenCentered, {height}]}><Text style={styles.endText}>{t('watch.allSeenTitle')}</Text><Text style={styles.endSubText}>{t('watch.allSeenDescription')}</Text></View>;
        return null;
      }}
      windowSize={3} // Renders the visible screen, and one item above and below
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      removeClippedSubviews
      getItemLayout={(_, index) => ({
        length: height,
        offset: height * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
    fullScreenCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
    endText: { ...theme.typography.titleMedium, color: 'white' },
    endSubText: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.s },
})

export default WatchFeed;
