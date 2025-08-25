import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { theme } from '@/lib/theme';
import { formatPlayerTime } from '@/lib/time';
import { AppBskyFeedDefs, AppBskyEmbedVideo } from '@atproto/api';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';

interface AdvancedVideoPlayerProps {
  post: AppBskyFeedDefs.PostView;
  style?: any;
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({ post, style }) => {
  const embed = post.embed as AppBskyEmbedVideo.View;
  const { hlsUrl, fallbackUrl, isLoading: isLoadingUrl } = useVideoPlayback(embed, post.author.did);

  const containerRef = useRef<View>(null);
  const videoRef = useRef<Video>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [sourceUri, setSourceUri] = useState<string | undefined>(hlsUrl || fallbackUrl || undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setControlsVisible] = useState(true);

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const isMuted = status?.isLoaded ? status.isMuted : false;
  const isLoading = status?.isLoaded ? status.isBuffering : true;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 0;
  
  useEffect(() => {
    setSourceUri(hlsUrl || fallbackUrl || undefined);
  }, [hlsUrl, fallbackUrl]);
  
  const hideControls = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [isPlaying]);

  const showControls = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    setControlsVisible(true);
    if (isPlaying) {
      hideControls();
    }
  }, [isPlaying, hideControls]);
  
  useEffect(() => {
    if (isPlaying) {
        hideControls();
    } else {
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        setControlsVisible(true);
    }
    
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying, hideControls]);
  
  const togglePlayPause = () => {
      if (!status?.isLoaded) return;
      if (status.isPlaying) {
          videoRef.current?.pauseAsync();
      } else {
          videoRef.current?.playAsync();
      }
  };
  const toggleMute = () => {
      if (!status?.isLoaded) return;
      videoRef.current?.setIsMutedAsync(!status.isMuted);
  };

  const handleFullscreen = useCallback(async () => {
    if (Platform.OS === 'web') {
      const node = containerRef.current as any;
      if (node) {
        if (!document.fullscreenElement) {
          await node.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      }
    } else {
        if (isFullscreen) {
            await videoRef.current?.dismissFullscreenPlayer();
        } else {
            await videoRef.current?.presentFullscreenPlayer();
        }
    }
  }, [isFullscreen]);
  
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    if (Platform.OS === 'web') {
      document.addEventListener('fullscreenchange', onFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }
  }, []);

  const handleStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
        setPlayerError(null);
    } else {
        console.error('VideoPlayer error: Video could not be loaded');
        if (sourceUri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
            console.log('HLS stream failed, attempting fallback to MP4.');
            setSourceUri(fallbackUrl);
            setPlayerError(null);
        } else {
            setPlayerError("Could not play video.");
        }
    }
  };

  const progress = duration ? position / duration : 0;
  const showSpinner = isLoadingUrl || isLoading;

  if (isLoadingUrl && !hlsUrl && !fallbackUrl) {
    return (
        <View style={[styles.container, style]}>
            {embed.thumbnail && <Image source={{ uri: embed.thumbnail }} style={StyleSheet.absoluteFill} contentFit="contain" />}
            <ActivityIndicator size="large" color="white" />
        </View>
    );
  }

  return (
    <Pressable ref={containerRef} style={[styles.container, style]} onPress={showControls}>
      {sourceUri && (
          <Video
            ref={videoRef}
            style={StyleSheet.absoluteFill}
            source={{ uri: sourceUri }}
            posterSource={embed.thumbnail ? { uri: embed.thumbnail } : undefined}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            isMuted={false}
            onPlaybackStatusUpdate={handleStatusUpdate}
            onFullscreenUpdate={({ fullscreenUpdate }) => {
                if (Platform.OS !== 'web') {
                    setIsFullscreen(fullscreenUpdate === 1 || fullscreenUpdate === 3); // WillPresent, DidPresent
                }
            }}
          />
      )}
      {isControlsVisible && (
        <Pressable style={styles.controlsOverlay} onPress={showControls}>
          <View style={styles.centerControls}>
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
              {isPlaying ? <Pause size={48} color="white" fill="white" /> : <Play size={48} color="white" fill="white" />}
            </Pressable>
          </View>

          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatPlayerTime(position)}</Text>
            <View style={styles.sliderContainer}>
                <View style={[styles.sliderProgress, { flex: progress }]} />
                <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={styles.timeText}>{formatPlayerTime(duration || 0)}</Text>
            <Pressable onPress={toggleMute} style={styles.iconButton}>{isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}</Pressable>
            <Pressable onPress={handleFullscreen} style={styles.iconButton}>{isFullscreen ? <Minimize size={20} color="white" /> : <Maximize size={20} color="white" />}</Pressable>
          </View>
        </Pressable>
      )}

      {showSpinner && <ActivityIndicator size="large" color="white" style={StyleSheet.absoluteFill} />}
      {playerError && !showSpinner && <View style={styles.errorOverlay}><Text style={styles.errorText}>{playerError}</Text></View>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  controlsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  centerControls: { flexDirection: 'row', alignItems: 'center' },
  playPauseButton: { padding: 16 },
  seekButton: { padding: 16 },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, backgroundColor: 'rgba(0,0,0,0.6)' },
  timeText: { color: 'white', ...theme.typography.bodySmall, width: 50, textAlign: 'center' },
  sliderContainer: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, flexDirection: 'row', overflow: 'hidden' },
  sliderProgress: { height: '100%', backgroundColor: 'white' },
  iconButton: { padding: 8 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  errorText: { color: 'white', fontWeight: 'bold' }
});

export default AdvancedVideoPlayer;