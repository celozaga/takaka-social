import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatusSuccess } from 'expo-av';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPostOverlay from './VideoPostOverlay';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const VideoPlayer: React.FC<Props> = ({ postView, paused: isExternallyPaused, isMuted, onMuteToggle }) => {
  const videoRef = useRef<Video>(null);
  
  const [isInternallyPaused, setIsInternallyPaused] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  
  const { post } = postView;
  
  useEffect(() => {
    // Reset state for new video
    setIsInternallyPaused(false);
    setStatus(null);
  }, [post.uri]);

  const embedView = useMemo(() => {
    if (AppBskyEmbedVideo.isView(post.embed)) return post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) return post.embed.media as AppBskyEmbedVideo.View;
    return undefined;
  }, [post.embed]);

  const { hlsUrl, fallbackUrl, isLoading: isLoadingUrl } = useVideoPlayback(embedView, post.author.did);
  const { currentSource, error: playerError, handleError } = useHlsPlayer(videoRef, hlsUrl, fallbackUrl);

  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;
  useEffect(() => {
    if (videoRef.current) {
      if (isEffectivelyPaused) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  }, [isEffectivelyPaused]);

  const resizeMode = useMemo(() => {
    if (!embedView?.aspectRatio) return ResizeMode.CONTAIN;
    const { width, height } = embedView.aspectRatio;
    return width < height ? ResizeMode.COVER : ResizeMode.CONTAIN;
  }, [embedView]);
  
  const showSpinner = isLoadingUrl || (status?.isBuffering && !status?.isPlaying);
  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const handleMuteToggle = (e: any) => { e.stopPropagation(); onMuteToggle(); };

  const progress = status ? (status.positionMillis / (status.durationMillis || 1)) : 0;

  return (
    <TouchableWithoutFeedback onPress={toggleInternalPlayPause}>
      <View style={styles.container}>
        {resizeMode === ResizeMode.CONTAIN && embedView?.thumbnail && (
          <Image source={{ uri: embedView.thumbnail }} style={styles.backgroundImage} resizeMode="cover" blurRadius={Platform.OS === 'ios' ? 30 : 15} />
        )}
        <View style={styles.backgroundOverlay} />
        
        {currentSource && (
          <Video
            ref={videoRef}
            style={styles.videoPlayer}
            source={{ uri: currentSource }}
            posterSource={embedView?.thumbnail ? { uri: embedView.thumbnail } : undefined}
            usePoster
            resizeMode={resizeMode}
            shouldPlay={!isExternallyPaused}
            isLooping
            isMuted={isMuted}
            onPlaybackStatusUpdate={(s) => { if (s.isLoaded) setStatus(s as AVPlaybackStatusSuccess) }}
            onError={handleError}
          />
        )}
        
        {showSpinner && <ActivityIndicator size="large" color="white" style={styles.loader} />}
        {playerError && !showSpinner && (
            <View style={styles.errorOverlay}><Text style={styles.errorText}>{playerError}</Text></View>
        )}
        
        {isInternallyPaused && !showSpinner && (
          <View style={styles.playButtonOverlay}>
            <Play size={80} color="rgba(255, 255, 255, 0.7)" fill="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
        
        {!isLoadingUrl && (
          <>
            <VideoPostOverlay post={post} />
            <Pressable onPress={handleMuteToggle} style={styles.muteButton}>
              {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </Pressable>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { transform: [{ scaleX: progress }] }]} />
            </View>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', overflow: 'hidden' },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: { ...StyleSheet.absoluteFillObject, zIndex: 0, ...(Platform.OS === 'web' && { filter: 'blur(25px) brightness(0.8)', transform: [{ scale: '1.1' }] } as any) },
  backgroundOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 1 },
  loader: { position: 'absolute', zIndex: 4 },
  muteButton: { position: 'absolute', top: theme.spacing.l, right: theme.spacing.l, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s, borderRadius: theme.shape.full, zIndex: 3 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4 },
  errorText: { color: 'white', fontWeight: 'bold' },
  playButtonOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)', zIndex: 3 },
  progressBar: { height: '100%', backgroundColor: 'white', transformOrigin: 'left' },
});

export default React.memo(VideoPlayer);