
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FlatList, View, ActivityIndicator, Text, useWindowDimensions, StyleSheet } from 'react-native';
import {AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia, AppBskyActorDefs } from '@atproto/api';
import VideoPlayer from './VideoPlayer';
import { theme } from '@/lib/theme';
import { useAtp } from '@/context/AtpContext';
import { useTranslation } from 'react-i18next';

interface Props {
  videoPosts: AppBskyFeedDefs.FeedViewPost[];
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const WatchFeed: React.FC<Props> = ({ videoPosts, loadMore, isLoadingMore, hasMore }) => {
  const { agent } = useAtp();
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

  const getBlobUrl = (post: AppBskyFeedDefs.PostView) => {
    let embedView: AppBskyEmbedVideo.View | undefined;
    if (AppBskyEmbedVideo.isView(post.embed)) embedView = post.embed;
    else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) embedView = post.embed.media as AppBskyEmbedVideo.View;
    
    if (!embedView) return '';

    const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
    const videoCid = embedView.cid;
    if (!authorDid || !videoCid || !agent.service) return '';

    const serviceUrl = agent.service.toString();
    const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
    return `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
  };

  return (
    <FlatList
      data={videoPosts}
      keyExtractor={item => item.post.uri}
      renderItem={({ item, index }) => (
        <View style={{ height }}>
          <VideoPlayer 
            postView={item} 
            blobUrl={getBlobUrl(item.post)}
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
      windowSize={5}
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
