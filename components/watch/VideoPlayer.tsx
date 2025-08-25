import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPostOverlay from './VideoPostOverlay';
import { Volume2, VolumeX, Play, Fullscreen } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useModeration } from '@/context/ModerationContext';
import { moderatePost, ModerationDecision } from '@/lib/moderation';
import ContentWarning from '@/components/shared/ContentWarning';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const VideoPlayer: React.FC<Props> = ({ postView, paused: isExternallyPaused, isMuted, onMuteToggle }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { post } = postView;
  const moderation = useModeration();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  const modDecision: ModerationDecision = useMemo(() => {
    if (!moderation.isReady) return { visibility: 'show' };
    return moderatePost(post, moderation);
  }, [post, moderation]);

  const embedView = useMemo(() => {
    if (AppBskyEmbedVideo.isView(post.embed)) return post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) return post.embed.media as AppBskyEmbedVideo.View;
    return undefined;
  }, [post.embed]);

  const { 
    state, 
    controls, 
    playbackUrls, 
    eventHandlers 
  } = useVideoPlayer(embedView, post.author.did);

  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    // Reset state for new video
    controls.reset();
  }, [post.uri, controls]);

  const isEffectivelyPaused = isExternallyPaused || !state.isPlaying;
  const showSpinner = playbackUrls.isLoading || state.isLoading;
  const isLoading = status?.isLoaded ? status.isBuffering : true;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 0;

  // Sync mute state with expo-av
  useEffect(() => {
    videoRef.current?.setIsMutedAsync(isMuted);
  }, [isMuted]);

  // Sync play/pause state with expo-av
  useEffect(() => {
    if (isEffectivelyPaused) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  }, [isEffectivelyPaused]);

  const contentFit = useMemo(() => {
    if (!embedView?.aspectRatio) return ResizeMode.CONTAIN;
    return embedView.aspectRatio.width > embedView.aspectRatio.height ? ResizeMode.CONTAIN : ResizeMode.COVER;
  }, [embedView]);

  const handleStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      // Update our state based on expo-av status
      if (newStatus.isPlaying !== state.isPlaying) {
        controls.togglePlayPause();
      }
    }
  };

  const handleMuteToggle = (e: any) => { 
    e.stopPropagation(); 
    onMuteToggle(); 
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isEffectivelyPaused) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  };

  const progress = duration ? (position / duration) : 0;

  const renderPlayerContent = () => (
    <>
      {playbackUrls.streamingUrl && (
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: playbackUrls.streamingUrl }}
          posterSource={embedView?.thumbnail ? { uri: embedView.thumbnail } : undefined}
          resizeMode={contentFit}
          shouldPlay={!isEffectivelyPaused}
          isLooping
          isMuted={isMuted}
          onPlaybackStatusUpdate={handleStatusUpdate}
          // Performance optimizations
          useNativeControls={false}
          shouldCorrectPitch={false}
          // Buffer settings for better performance
          progressUpdateIntervalMillis={100}
          positionMillis={0}
        />
      )}
      
      {showSpinner && <ActivityIndicator size="large" color="white" style={styles.loader} />}
      {state.hasError && !showSpinner && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{state.errorMessage}</Text>
        </View>
      )}
      
      {isEffectivelyPaused && !showSpinner && (
        <View style={styles.playButtonOverlay}>
          <Play size={80} color="rgba(255, 255, 255, 0.7)" fill="rgba(255, 255, 255, 0.5)" />
        </View>
      )}
      
      {!playbackUrls.isLoading && (
        <>
          <VideoPostOverlay post={post} />
          <View style={styles.controlsContainer}>
            <Pressable onPress={handleMuteToggle} style={[styles.controlButton, isMobile && styles.controlButtonMobile]}>
              {isMuted ? <VolumeX size={isMobile ? 18 : 20} color="white" /> : <Volume2 size={isMobile ? 18 : 20} color="white" />}
            </Pressable>
            <Pressable onPress={controls.enterFullscreen} style={[styles.controlButton, isMobile && styles.controlButtonMobile]}>
              <Fullscreen size={isMobile ? 18 : 20} color="white" />
            </Pressable>
          </View>
          <View style={[styles.progressBarContainer, isMobile && styles.progressBarContainerMobile]}>
            <View style={[styles.progressBar, { transform: [{ scaleX: progress }] }]} />
          </View>
        </>
      )}
    </>
  );

  return (
    <TouchableWithoutFeedback onPress={togglePlayPause}>
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
    </TouchableWithoutFeedback>
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
  loader: { 
    position: 'absolute', 
    zIndex: 4 
  },
  controlsContainer: {
    position: 'absolute',
    top: theme.spacing.l,
    right: theme.spacing.l,
    flexDirection: 'row',
    gap: theme.spacing.s,
    zIndex: 3,
  },
  controlButton: { 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: theme.spacing.s, 
    borderRadius: theme.shape.full,
  },
  controlButtonMobile: {
    padding: theme.spacing.xs,
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
  playButtonOverlay: { 
    position: 'absolute', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 5 
  },
  progressBarContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    zIndex: 3 
  },
  progressBarContainerMobile: {
    bottom: theme.spacing.m,
    height: 6,
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: 'white', 
    transformOrigin: 'left' 
  },
});

export default React.memo(VideoPlayer);
