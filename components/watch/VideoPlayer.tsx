
import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text } from 'react-native';
import { Video, AVPlaybackStatus, AVPlaybackStatusSuccess, ResizeMode } from 'expo-av';
import { AppBskyFeedDefs,AppBskyEmbedVideo,AppBskyEmbedRecordWithMedia } from '@atproto/api';

import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Volume2, VolumeX } from 'lucide-react';
import { theme } from '@/lib/theme';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  hlsUrl?: string;
  blobUrl: string;
}

const VideoPlayer = forwardRef<Video, Props>(({ postView, hlsUrl, blobUrl }, ref) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Start true to show placeholder initially

  useImperativeHandle(ref, () => videoRef.current as Video, []);

  const { post } = postView;
  const record = post.record as any;

  let embedView: AppBskyEmbedVideo.View | undefined;
  if (AppBskyEmbedVideo.isView(post.embed)) embedView = post.embed;
  else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) embedView = post.embed.media as AppBskyEmbedVideo.View;

  if (!embedView) return null;

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      setStatus(null);
      // If error or not loaded, it might still be loading
      if (playbackStatus.error) {
        console.error(`Video Error: ${playbackStatus.error}`);
      }
      setIsLoading(true);
      return;
    }
    
    setStatus(playbackStatus);
    // Show loader only when buffering, not on initial load if thumbnail is present
    setIsLoading(playbackStatus.isBuffering);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    status?.isPlaying ? videoRef.current.pauseAsync() : videoRef.current.playAsync();
  };

  const toggleMuteLocal = (e: any) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }

  return (
    <TouchableWithoutFeedback onPress={togglePlayPause}>
      <View style={styles.container}>
        {/* Placeholder before the buffer starts */}
        {isLoading && embedView.thumbnail && (
          <Image 
            source={{ uri: embedView.thumbnail }} 
            style={[StyleSheet.absoluteFill, styles.thumbnail]} // Use absoluteFill to cover bg
            resizeMode="cover" 
          />
        )}

        <Video
          ref={videoRef}
          source={{ uri: hlsUrl || blobUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          isMuted={isMuted}
          onLoadStart={() => setIsLoading(true)}
          onReadyForDisplay={() => setIsLoading(false)} // Indicates it's ready to play
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loader while buffering */}
        {isLoading && (
          <ActivityIndicator
            size="large"
            color="white"
            style={styles.loader}
          />
        )}

         <View style={styles.infoOverlay}>
            <Pressable onPress={(e) => e.stopPropagation()}>
                <Text style={styles.authorText}>{post.author.displayName || `@${post.author.handle}`}</Text>
            </Pressable>
            <Text style={styles.descriptionText} numberOfLines={2}>
                <RichTextRenderer record={record} />
            </Text>
        </View>

        <VideoActions post={post} />

        <Pressable onPress={toggleMuteLocal} style={styles.muteButton}>
            {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  thumbnail: {
      zIndex: 1,
  },
  video: { width: '100%', height: '100%', zIndex: 2 },
  loader: { position: 'absolute', zIndex: 3 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.l, paddingBottom: 96, zIndex: 20 },
  authorText: { ...theme.typography.titleSmall, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, },
  descriptionText: { ...theme.typography.bodyMedium, color: 'white', marginTop: theme.spacing.xs, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, },
  muteButton: { position: 'absolute', top: theme.spacing.l, right: theme.spacing.l, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s, borderRadius: theme.shape.full, zIndex: 20 },
});

export default React.memo(VideoPlayer);