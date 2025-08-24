import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoFullscreenUpdateState, VideoStatusUpdateEvent, VideoTimeUpdateEvent, VideoFullscreenUpdateEvent } from 'expo-video';
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
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const player = useVideoPlayer(null, p => {
    p.muted = false;
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    const sourceToPlay = hlsUrl || fallbackUrl;
    if (sourceToPlay) {
        player.replace(sourceToPlay);
    }
  }, [hlsUrl, fallbackUrl, player]);


  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);


  useEffect(() => {
      const statusSubscription = player.addListener('statusChange', (event: VideoStatusUpdateEvent) => {
          const status = event.status;
          if (status) {
            setIsPlaying(status.isPlaying);
            setIsMuted(status.isMuted);
            setIsLoading(status.isLoading);
          }
          if (status.error) {
            console.error('VideoPlayer error:', status.error);
            const currentSourceUri = player.currentSource?.uri;
            if (currentSourceUri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
                console.log('HLS stream failed, attempting fallback to MP4.');
                player.replace(fallbackUrl);
                setPlayerError(null);
            } else {
                setPlayerError("Could not play video.");
            }
          } else {
            setPlayerError(null);
          }
      });
      const timeSubscription = player.addListener('timeUpdate', (event: VideoTimeUpdateEvent) => {
          setPosition(event.position);
          setDuration(event.duration);
      });
      const fullscreenSubscription = player.addListener('fullscreenUpdate', (event: VideoFullscreenUpdateEvent) => {
        if (Platform.OS !== 'web') {
          setIsFullscreen(event.fullscreenState === VideoFullscreenUpdateState.ENTERED);
        }
      });
      return () => {
          statusSubscription.remove();
          timeSubscription.remove();
          fullscreenSubscription.remove();
      };
  }, [player, hlsUrl, fallbackUrl]);

  const [isControlsVisible, setControlsVisible] = useState(true);
  
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

  const togglePlayPause = () => (player.playing ? player.pause() : player.play());
  const toggleMute = () => { player.muted = !player.muted };

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
            await player.exitFullscreen();
        } else {
            await player.enterFullscreen();
        }
    }
  }, [player, isFullscreen]);
  
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    if (Platform.OS === 'web') {
      document.addEventListener('fullscreenchange', onFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }
  }, []);

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
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        posterSource={embed.thumbnail ? { uri: embed.thumbnail } : null}
        contentFit='contain'
        allowsFullscreen
      />

      {isControlsVisible && (
        <Pressable style={styles.controlsOverlay} onPress={showControls}>
          <View style={styles.centerControls}>
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
              {isPlaying ? <Pause size={48} color="white" fill="white" /> : <Play size={48} color="white" fill="white" />}
            </Pressable>
          </View>

          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatPlayerTime(position * 1000)}</Text>
            <View style={styles.sliderContainer}>
                <View style={[styles.sliderProgress, { flex: progress }]} />
                <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={styles.timeText}>{formatPlayerTime(duration * 1000)}</Text>
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