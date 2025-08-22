
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FlatList, View, ActivityIndicator, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia, AppBskyActorDefs } from '@atproto/api';
import VideoPlayer from './VideoPlayer';
import { useVideoManager } from './hooks/useVideoManager';
import { theme } from '@/lib/theme';
import { useAtp } from '@/context/AtpContext';

interface Props {
  videoPosts: AppBskyFeedDefs.FeedViewPost[];
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
}

/**
 * Renders the vertical, swipeable video feed.
 * - Uses a highly optimized FlatList for performance.
 * - Manages which video is currently active.
 * - Uses the `useVideoManager` hook to control playback.
 * - Handles data prefetching and pagination.
 */
const WatchFeed: React.FC<Props> = ({ videoPosts, loadMore, isLoadingMore, hasMore }) => {
  const { agent } = useAtp();
  const [activeIndex, setActiveIndex] = useState(0);
  const { height } = useWindowDimensions();
  const [playbackUrls, setPlaybackUrls] = useState<Map<string, string>>(new Map());

  // Create an array of refs, one for each video player.
  const videoRefs = useRef(videoPosts.map(() => React.createRef<Video>())).current;
  
  // As new posts are loaded via pagination, we need to add new refs to our array.
  useEffect(() => {
    if (videoPosts.length > videoRefs.length) {
      const diff = videoPosts.length - videoRefs.length;
      for (let i = 0; i < diff; i++) {
        videoRefs.push(React.createRef<Video>());
      }
    }
  }, [videoPosts.length, videoRefs]);


  const prefetchNextUrl = useCallback(async (post: AppBskyFeedDefs.FeedViewPost) => {
    // Fetches the high-quality HLS stream URL for a video before it becomes visible.
    if (!post || playbackUrls.has(post.post.uri)) return;
    try {
        const embed = post.post.embed;
        let videoEmbed: AppBskyEmbedVideo.View | undefined;
        if (AppBskyEmbedVideo.isView(embed)) videoEmbed = embed;
        else if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media)) videoEmbed = embed.media as AppBskyEmbedVideo.View;
        if (!videoEmbed) return;
        const res = await (agent.api.app.bsky.video as any).getPlaybackUrl({ did: post.post.author.did, cid: videoEmbed.cid });
        if (res.data.url) {
            setPlaybackUrls(prev => new Map(prev).set(post.post.uri, res.data.url));
        }
    } catch (e) { console.warn(`Could not prefetch playback URL for ${post.post.uri}`, e); }
  }, [agent, playbackUrls]);


  // This callback from FlatList tells us which item is currently visible.
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== activeIndex) {
          setActiveIndex(newIndex);
          // When the active video changes, prefetch the next one.
          const nextPost = videoPosts[newIndex + 1];
          if (nextPost) prefetchNextUrl(nextPost);
      }
    }
  }).current;

  // Configuration for the onViewableItemsChanged callback.
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Custom hook that handles playing the active video and pausing the others.
  useVideoManager(videoRefs, activeIndex, videoPosts);

  const getBlobUrl = (post: AppBskyFeedDefs.PostView) => {
    // Constructs the direct, lower-quality video URL as a fallback.
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
                ref={videoRefs[index]} 
                postView={item} 
                hlsUrl={playbackUrls.get(item.post.uri)}
                blobUrl={getBlobUrl(item.post)}
            />
        </View>
      )}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
      onEndReached={loadMore}
      onEndReachedThreshold={3} // Load more when 3 items from the end
      ListFooterComponent={() => {
          if (isLoadingMore) return <View style={{height, justifyContent: 'center'}}><ActivityIndicator size="large" color="white" /></View>;
          if (!hasMore && videoPosts.length > 0) return <View style={[styles.fullScreenCentered, {height}]}><Text style={styles.endText}>You've seen it all!</Text></View>;
          return null;
      }}
      // Performance optimizations for FlatList
      windowSize={3}
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
})

export default WatchFeed;
