
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatusSuccess, VideoFullscreenUpdate } from 'expo-av';
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
  const { playbackUrl, isLoading: isLoadingUrl } = useVideoPlayback(post.uri, embed, post.author.did);

  const videoRef = useRef<Video>(null);
  const containerRef = useRef<View>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  const [isControlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hideControls = () => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (status?.isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  const showControls = () => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    setControlsVisible(true);
    if (status?.isPlaying) {
      hideControls();
    }
  };
  
  useEffect(() => {
    if (status?.isPlaying) {
        hideControls();
    } else {
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        setControlsVisible(true);
    }
    
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [status?.isPlaying]);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (status?.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    showControls();
  };
  
  const toggleMute = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!status?.isMuted);
    showControls();
  };

  const handleFullscreen = useCallback(async () => {
    if (Platform.OS === 'web') {
      const node = containerRef.current as any;
      if (!document.fullscreenElement) {
        await node?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } else {
      if (!isFullscreen) {
        await videoRef.current?.presentFullscreenPlayer();
      } else {
        await videoRef.current?.dismissFullscreenPlayer();
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

  const progress = status?.durationMillis ? status.positionMillis / status.durationMillis : 0;
  const showSpinner = isLoadingUrl || (status?.isBuffering && !status?.isPlaying);

  if (!playbackUrl && !isLoadingUrl) {
    return (
        <View style={[styles.container, style]}>
            <Image source={{ uri: embed.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="contain" />
            <View style={styles.errorOverlay}><Text style={styles.errorText}>Could not play video</Text></View>
        </View>
    )
  }

  return (
    <Pressable ref={containerRef} style={[styles.container, style]} onPress={showControls}>
      <Video
        ref={videoRef}
        source={{ uri: playbackUrl || undefined }}
        posterSource={embed.thumbnail ? { uri: embed.thumbnail } : undefined}
        usePoster={!!embed.thumbnail}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        isMuted={false}
        isLooping
        onPlaybackStatusUpdate={(s) => { if (s.isLoaded) setStatus(s); else if (s.isLoaded === false && s.error) setError(s.error) }}
        onFullscreenUpdate={(e) => setIsFullscreen(e.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT)}
        onError={setError}
      />

      {isControlsVisible && (
        <Pressable style={styles.controlsOverlay} onPress={showControls}>
          <View style={styles.centerControls}>
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
              {status?.isPlaying ? <Pause size={48} color="white" fill="white" /> : <Play size={48} color="white" fill="white" />}
            </Pressable>
          </View>

          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatPlayerTime(status?.positionMillis ?? 0)}</Text>
            <View style={styles.sliderContainer}>
                <View style={[styles.sliderProgress, { flex: progress }]} />
                <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={styles.timeText}>{formatPlayerTime(status?.durationMillis ?? 0)}</Text>
            <Pressable onPress={toggleMute} style={styles.iconButton}>{status?.isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}</Pressable>
            <Pressable onPress={handleFullscreen} style={styles.iconButton}>{isFullscreen ? <Minimize size={20} color="white" /> : <Maximize size={20} color="white" />}</Pressable>
          </View>
        </Pressable>
      )}

      {showSpinner && <ActivityIndicator size="large" color="white" style={StyleSheet.absoluteFill} />}
      {error && !showSpinner && <View style={styles.errorOverlay}><Text style={styles.errorText}>Could not play video</Text></View>}
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
