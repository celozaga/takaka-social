import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPostOverlay from './VideoPostOverlay';
import { theme } from '@/lib/theme';
import { useModeration } from '@/context/ModerationContext';
import { moderatePost, ModerationDecision } from '@/lib/moderation';
import ContentWarning from '@/components/shared/ContentWarning';
import SharedVideoPlayer from '../shared/VideoPlayer';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
}

const VideoPlayer: React.FC<Props> = ({ postView }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { post } = postView;
  const moderation = useModeration();

  const modDecision: ModerationDecision = useMemo(() => {
    if (!moderation.isReady) return { visibility: 'show' };
    return moderatePost(post, moderation);
  }, [post, moderation]);

  const embedView = useMemo(() => {
    if (AppBskyEmbedVideo.isView(post.embed)) return post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) return post.embed.media as AppBskyEmbedVideo.View;
    return undefined;
  }, [post.embed]);

  const [isContentVisible, setIsContentVisible] = useState(false);

  const renderPlayerContent = () => (
    <>
      <View style={styles.videoContainer}>
        <SharedVideoPlayer post={post} style={styles.video} showControlsOverlay={false} />
      </View>
      <VideoPostOverlay post={post} />
    </>
  );

  return (
      <View style={styles.container}>
        {embedView?.thumbnail && (
          <Image 
            source={{ uri: embedView.thumbnail }} 
            style={styles.backgroundImage} 
            contentFit="cover" 
            blurRadius={Platform.OS === 'ios' ? 30 : 15} 
          />
        )}
        <View style={styles.backgroundOverlay} />
        
        {modDecision.visibility === 'warn' && !isContentVisible ? (
          <ContentWarning
            reason={modDecision.reason!}
            onShow={() => setIsContentVisible(true)}
          />
        ) : (
          renderPlayerContent()
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'black', 
    overflow: 'hidden' 
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  backgroundImage: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 0, 
    ...(Platform.OS === 'web' && { 
      filter: 'blur(25px) brightness(0.8)', 
      transform: [{ scale: '1.1' }] 
    } as any) 
  },
  backgroundOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    zIndex: 1 
  },
  errorOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 4 
  },
  errorText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
});

export default React.memo(VideoPlayer);
