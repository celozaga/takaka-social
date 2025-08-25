import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { ContentType } from 'expo-video';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { theme } from '@/lib/theme';
import { formatPlayerTime } from '@/lib/time';
import { AppBskyFeedDefs, AppBskyEmbedVideo } from '@atproto/api';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';

interface VideoPlayerProps {
  post: AppBskyFeedDefs.PostView;
  style?: any;
  showControlsOverlay?: boolean; // permite ocultar controles (ex.: feed /watch estilo tiktok)
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ post, style, showControlsOverlay = true }) => {
  const embed = post.embed as AppBskyEmbedVideo.View;
  if (!embed) return null;

  const {
  hlsUrl,
    hlsPlaylistUrl,
    hlsDirectUrl,
  fallbackUrl,
  streamingUrl,
    preferredUrl,
    contentType,
    isLoading: isLoadingUrl,
  } = useVideoPlayback(embed, post.author.did);

  const containerRef = useRef<View>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const [sourceUri, setSourceUri] = useState<string | undefined>(
    preferredUrl || hlsPlaylistUrl || hlsDirectUrl || streamingUrl || hlsUrl || fallbackUrl || undefined
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contentTypeOverride, setContentTypeOverride] = useState<ContentType>('auto');

  // Web HLS via hls.js
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<any>(null);

  // Evitar carregar .m3u8 com expo-video no web; usar hls.js
  const shouldUseWebHls =
    Platform.OS === 'web' &&
    (contentTypeOverride === 'hls' || contentType === 'hls') &&
    (sourceUri?.includes('.m3u8') ?? false);

  const videoPlayer = useVideoPlayer(
    {
      uri: shouldUseWebHls ? '' : (sourceUri || ''),
      contentType: shouldUseWebHls ? 'auto' : (contentTypeOverride || contentType || 'auto'),
    }
  );

  useEffect(() => {
    const nextSource =
      preferredUrl || hlsPlaylistUrl || hlsDirectUrl || streamingUrl || hlsUrl || fallbackUrl || undefined;
    setSourceUri(nextSource);

    let nextContentType: ContentType = 'auto';
    if (nextSource) {
      if (nextSource === hlsPlaylistUrl || nextSource === hlsDirectUrl || nextSource === hlsUrl) nextContentType = 'hls';
      else if (nextSource === streamingUrl || nextSource === fallbackUrl) nextContentType = 'progressive';
      else if (preferredUrl) nextContentType = contentType || 'auto';
    }
    setContentTypeOverride(nextContentType);

    setIsLoading(true);
    setPlayerError(null);
    setPosition(0);
    setDuration(0);
  }, [preferredUrl, hlsPlaylistUrl, hlsDirectUrl, streamingUrl, hlsUrl, fallbackUrl, contentType]);

  // Eventos do expo-video (nativo/web MP4)
  useEffect(() => {
    if (Platform.OS === 'web' && (contentTypeOverride === 'hls' || contentType === 'hls')) return;
    if (!videoPlayer) return;

    const unsubPlaying = videoPlayer.addListener('playingChange', (e) => setIsPlaying(e.isPlaying));
    const unsubMuted = videoPlayer.addListener('mutedChange', (e) => setIsMuted(e.muted));
    const unsubTime = videoPlayer.addListener('timeUpdate', (e) => setPosition(e.currentTime));
    const unsubLoad = videoPlayer.addListener('sourceLoad', (e) => {
      setDuration(e.duration);
      setIsLoading(false);
      setPlayerError(null);
      try {
        (videoPlayer as any).muted = false;
        videoPlayer.play();
      } catch {}
    });
    const unsubStatus = videoPlayer.addListener('statusChange', (e) => {
      if (e.status === 'readyToPlay') {
        setIsLoading(false);
        setPlayerError(null);
      } else if (e.status === 'error') {
        setIsLoading(false);
        setPlayerError('Could not play video.');
      } else if (e.status === 'loading') {
        setIsLoading(true);
      }
    });

    return () => {
      unsubPlaying.remove();
      unsubMuted.remove();
      unsubTime.remove();
      unsubLoad.remove();
      unsubStatus.remove();
    };
  }, [videoPlayer, contentTypeOverride, contentType]);

  // Inicialização HLS no web via hls.js
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const isHls = (contentTypeOverride === 'hls' || contentType === 'hls') && (sourceUri?.includes('.m3u8') ?? false);
    const videoEl = htmlVideoRef.current;
    if (!isHls || !sourceUri || !videoEl) {
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.destroy();
        } catch {}
        hlsInstanceRef.current = null;
      }
      return;
    }

    const setup = async () => {
      try {
        if (hlsInstanceRef.current) {
          try {
            hlsInstanceRef.current.destroy();
          } catch {}
          hlsInstanceRef.current = null;
        }
        try {
          (videoEl as any).crossOrigin = 'anonymous';
        } catch {}

        const canNative =
          (videoEl as any).canPlayType && (videoEl as any).canPlayType('application/vnd.apple.mpegurl');

        if (canNative) {
          videoEl.src = sourceUri;
          videoEl.muted = false;
          try {
            await videoEl.play();
          } catch {}
          setIsLoading(false);
          setPlayerError(null);
          setIsPlaying(true);
          return;
        }

        const mod: any = await import('hls.js');
        const Hls = mod?.default || mod;
        if (Hls?.isSupported?.()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.attachMedia(videoEl);
          hls.loadSource(sourceUri);
          hlsInstanceRef.current = hls;
          videoEl.muted = false;
          try {
            await videoEl.play();
          } catch {}
        }
      } catch {}
    };

    setup();

    return () => {
      try {
        if (videoEl) {
          videoEl.removeAttribute('src');
          (videoEl as any).load?.();
        }
      } catch {}
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.destroy();
        } catch {}
        hlsInstanceRef.current = null;
      }
    };
  }, [sourceUri, contentTypeOverride, contentType]);

  // Listeners do <video> web (estado básico)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = htmlVideoRef.current;
    if (!el) return;
    const onLoadedMeta = () => {
      setDuration(el.duration || 0);
      setIsLoading(false);
      setPlayerError(null);
    };
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setPosition(el.currentTime || 0);
    const onError = () => {
      setIsLoading(false);
      setPlayerError('Could not play video.');
    };
    el.addEventListener('loadedmetadata', onLoadedMeta);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMeta);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('error', onError);
    };
  }, [htmlVideoRef.current]);

  const hideControls = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  }, [isPlaying]);

  const showControls = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    setControlsVisible(true);
    if (isPlaying) hideControls();
  }, [isPlaying, hideControls]);

  useEffect(() => {
    if (isPlaying) hideControls();
    else {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      setControlsVisible(true);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying, hideControls]);

  const togglePlayPause = () => {
    if (Platform.OS === 'web' && htmlVideoRef.current && (contentTypeOverride === 'hls' || contentType === 'hls')) {
      const el = htmlVideoRef.current;
      if (!el) return;
      if (!el.paused) {
        el.pause();
        setIsPlaying(false);
    } else {
        el.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    if (videoPlayer) {
      if (isPlaying) videoPlayer.pause();
      else videoPlayer.play();
    }
  };

  const toggleMute = useCallback(() => {
    if (Platform.OS === 'web' && htmlVideoRef.current && (contentTypeOverride === 'hls' || contentType === 'hls')) {
      const el = htmlVideoRef.current;
      const newMutedState = !isMuted;
      el.muted = newMutedState;
      setIsMuted(newMutedState);
      if (!newMutedState) {
        el.volume = 0.5;
        el.play().catch(() => {});
      }
      return;
    }
    if (videoPlayer) {
      const newMutedState = !isMuted;
      (videoPlayer as any).muted = newMutedState;
      setIsMuted(newMutedState);
    }
  }, [videoPlayer, isMuted]);

  const handleFullscreen = useCallback(async () => {
    if (Platform.OS === 'web') {
      const node = containerRef.current as any;
      if (node) {
        if (!document.fullscreenElement) await node.requestFullscreen();
        else await document.exitFullscreen();
      }
    } else {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  const progress = duration ? position / duration : 0;
  const showSpinner = isLoadingUrl || isLoading;

  if (isLoadingUrl && !hlsUrl && !fallbackUrl) {
    return (
      <View style={[styles.container, style]}>
        {embed.thumbnail && (
          <Image source={{ uri: embed.thumbnail }} style={StyleSheet.absoluteFill} contentFit="contain" />
        )}
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <Pressable
      ref={containerRef}
      style={[styles.container, style]}
      onPress={showControlsOverlay ? showControls : undefined}
    >
      {Platform.OS === 'web' && (contentTypeOverride === 'hls' || contentType === 'hls') ? (
        sourceUri ? (
          // @ts-ignore web video element
          <video
            ref={htmlVideoRef as any}
            style={
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              } as any
            }
            playsInline
            controls={false}
            autoPlay
          />
        ) : null
      ) : sourceUri && videoPlayer ? (
        <VideoView
          key={Platform.OS === 'web' ? `video-${sourceUri}` : undefined}
          player={videoPlayer}
        style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={true}
        />
      ) : null}

      {showControlsOverlay && isControlsVisible && (
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
            <Pressable onPress={toggleMute} style={styles.iconButton}>
              {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </Pressable>
            <Pressable onPress={handleFullscreen} style={styles.iconButton}>
              {isFullscreen ? <Minimize size={20} color="white" /> : <Maximize size={20} color="white" />}
            </Pressable>
          </View>
        </Pressable>
      )}

      {showSpinner && <ActivityIndicator size="large" color="white" style={StyleSheet.absoluteFill} />}
      {playerError && !showSpinner && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{playerError}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  centerControls: { flexDirection: 'row', alignItems: 'center' },
  playPauseButton: { padding: 16 },
  seekButton: { padding: 16 },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  timeText: { color: 'white', ...theme.typography.bodySmall, width: 50, textAlign: 'center' },
  sliderContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sliderProgress: { height: '100%', backgroundColor: 'white' },
  iconButton: { padding: 8 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorText: { color: 'white', fontWeight: 'bold' },
});

export default VideoPlayer;
