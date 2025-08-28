import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { OptimizedImage } from '../ui';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { ContentType } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/shared/Theme';
import { formatPlayerTime } from '@/lib/time';
import { AppBskyFeedDefs, AppBskyEmbedVideo } from '@atproto/api';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { Tooltip } from './Tooltip';

interface VideoPlayerProps {
  post: AppBskyFeedDefs.PostView;
  style?: any;
  showControlsOverlay?: boolean; // permite ocultar controles (ex.: feed /watch estilo tiktok)
  paused?: boolean; // controle externo de pausa
  isMuted?: boolean; // controle externo de mute
  onMuteToggle?: () => void; // callback para alteração de mute
  isActive?: boolean; // se o vídeo está ativo (usado para otimizações)
  onProgressUpdate?: (progress: number, duration: number, position: number) => void; // callback para progresso do vídeo
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  post, 
  style, 
  showControlsOverlay = true,
  paused: externalPaused,
  isMuted: externalMuted,
  onMuteToggle,
  isActive = true,
  onProgressUpdate
}) => {
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
  const [isPlaying, setIsPlaying] = useState(!externalPaused);
  const [isMuted, setIsMuted] = useState(externalMuted ?? false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contentTypeOverride, setContentTypeOverride] = useState<ContentType>('auto');

  // Web HLS via hls.js
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<any>(null);
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  // Ativação por visibilidade (apenas para /watch onde controls estão ocultos)
  const [isActiveState, setIsActiveState] = useState<boolean>(showControlsOverlay); // default ativo fora do /watch
  
  // Usar prop isActive quando fornecida, senão usar estado interno
  const effectiveIsActive = isActive ?? isActiveState;

  // Evitar carregar .m3u8 com expo-video no web; usar hls.js
  const shouldUseWebHls =
    Platform.OS === 'web' &&
    (contentTypeOverride === 'hls' || contentType === 'hls') &&
    (sourceUri?.includes('.m3u8') ?? false);

  const videoPlayer = useVideoPlayer(
    {
      uri: shouldUseWebHls ? '' : (effectiveIsActive ? (sourceUri || '') : ''),
      contentType: shouldUseWebHls ? 'auto' : (contentTypeOverride || contentType || 'auto'),
    }
  );

  // Sincronização com props externas (após declaração das variáveis)
  useEffect(() => {
    if (externalPaused !== undefined) {
      setIsPlaying(!externalPaused);
      
      // Sincronizar com o player real
      if (Platform.OS === 'web' && htmlVideoRef.current && (contentTypeOverride === 'hls' || contentType === 'hls')) {
        const el = htmlVideoRef.current;
        if (externalPaused && !el.paused) {
          el.pause();
        } else if (!externalPaused && el.paused) {
          el.play().catch(() => {});
        }
      } else if (videoPlayer) {
        if (externalPaused) {
          videoPlayer.pause();
        } else {
          videoPlayer.play();
        }
      }
    }
  }, [externalPaused, videoPlayer, contentTypeOverride, contentType]);

  useEffect(() => {
    if (externalMuted !== undefined) {
      setIsMuted(externalMuted);
      
      // Sincronizar com o player real
      if (Platform.OS === 'web' && htmlVideoRef.current && (contentTypeOverride === 'hls' || contentType === 'hls')) {
        htmlVideoRef.current.muted = externalMuted;
      } else if (videoPlayer) {
        (videoPlayer as any).muted = externalMuted;
      }
    }
  }, [externalMuted, videoPlayer, contentTypeOverride, contentType]);

  // Observa visibilidade no web quando os controles estão ocultos (modo feed /watch)
  useEffect(() => {
    if (Platform.OS !== 'web') { setIsActiveState(true); return; }
    if (showControlsOverlay) { setIsActiveState(true); return; }
    const node = (containerRef.current as any) || null;
    if (!node || typeof (window as any).IntersectionObserver === 'undefined') { setIsActiveState(true); return; }
    const io = new (window as any).IntersectionObserver((entries: any[]) => {
      for (const entry of entries) {
        const visible = entry.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.6;
        setIsActiveState(visible);
      }
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });
    io.observe(node);
    return () => { try { io.disconnect(); } catch {} };
  }, [showControlsOverlay]);

  // No visibility gating to avoid RNW/IntersectionObserver incompat; we pause via event bus

  // Pause others when this mounts/plays: dispatch event on mount after load

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

    const unsubPlaying = videoPlayer.addListener('playingChange', (e) => {
      // Só atualizar se não está sendo controlado externamente
      if (externalPaused === undefined) {
        setIsPlaying(e.isPlaying);
      }
    });
    
    const unsubMuted = videoPlayer.addListener('mutedChange', (e) => {
      // Só atualizar se não está sendo controlado externamente
      if (externalMuted === undefined) {
        setIsMuted(e.muted);
      }
    });
    
    const unsubTime = videoPlayer.addListener('timeUpdate', (e) => {
      setPosition(e.currentTime);
      if (onProgressUpdate && duration > 0) {
        onProgressUpdate(e.currentTime / duration, duration, e.currentTime);
      }
    });
    const unsubLoad = videoPlayer.addListener('sourceLoad', async (e) => {
      setDuration(e.duration);
      setIsLoading(false);
      setPlayerError(null);
      try {
        if (effectiveIsActive && !externalPaused) {
          (videoPlayer as any).muted = externalMuted ?? false;
          await (videoPlayer as any).play();
          if (Platform.OS === 'web' && !showControlsOverlay) {
            try { (window as any).dispatchEvent(new CustomEvent('watch-video-activate', { detail: { id: post.uri } })); } catch {}
          }
        }
      } catch {
        // Autoplay com som pode ser bloqueado; tentar iniciar mudo e mostrar overlay
        try {
          (videoPlayer as any).muted = true;
          await (videoPlayer as any).play();
          setShowTapToPlay(true);
          if (externalPaused === undefined) {
            setIsPlaying(true);
          }
        } catch {}
      }
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
  }, [videoPlayer, contentTypeOverride, contentType, effectiveIsActive, showControlsOverlay, post.uri]);

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
    // Nota: Evitamos abortar o load aqui para não entrar em loop de setup; pausamos a reprodução quando inativo

    const setupHlsPlayer = async () => {
      const videoEl = htmlVideoRef.current;
      if (!videoEl || !sourceUri) return;

      const Hls = (await import('hls.js')).default;
      if (!Hls) return;

      const canNative = videoEl.canPlayType('application/vnd.apple.mpegurl');
      if (Hls.isSupported()) {
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
        }
        const hls = new Hls({
          maxBufferLength: 30,
          maxBufferSize: 60 * 1000 * 1000,
        });
        hlsInstanceRef.current = hls;
        hls.loadSource(sourceUri);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          videoEl.muted = false;
          try {
            if (showControlsOverlay || effectiveIsActive) {
              await videoEl.play();
              if (!showControlsOverlay) {
                // Notifica outros players que este está ativo
                try { (window as any).dispatchEvent(new CustomEvent('watch-video-activate', { detail: { id: post.uri } })); } catch {}
              }
            }
          } catch {
            // fallback: autoplay pode exigir mudo
            try {
              videoEl.muted = true;
              await videoEl.play();
              setShowTapToPlay(true);
              if (!showControlsOverlay) {
                // Notifica outros players que este está ativo
                try { (window as any).dispatchEvent(new CustomEvent('watch-video-activate', { detail: { id: post.uri } })); } catch {}
              }
            } catch {}
          }
          setIsLoading(false);
          setPlayerError(null);
          setIsPlaying(true);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setPlayerError('HLS_FATAL_ERROR');
          }
        });
      } else if (canNative) {
        videoEl.src = sourceUri;
        videoEl.muted = false;
        try {
          if (showControlsOverlay || effectiveIsActive) { await videoEl.play(); }
        } catch {
          // Tentar iniciar sem som para liberar autoplay
          try { videoEl.muted = true; await videoEl.play(); setShowTapToPlay(true); } catch {}
        }
        setIsLoading(false);
        setPlayerError(null);
        setIsPlaying(true);
        return;
      }
    };

    if (Platform.OS === 'web' && sourceUri && (contentTypeOverride === 'hls' || contentType === 'hls')) {
      if (effectiveIsActive) {
        setupHlsPlayer();
      }
    }

    return () => {
      // Cleanup do HLS
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [effectiveIsActive, sourceUri, post.uri, showControlsOverlay, contentType, contentTypeOverride]);

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
    const onTimeUpdate = () => {
      const currentTime = el.currentTime || 0;
      setPosition(currentTime);
      if (onProgressUpdate && el.duration > 0) {
        onProgressUpdate(currentTime / el.duration, el.duration, currentTime);
      }
    };
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

  const togglePlayPause = useCallback(() => {
    setShowTapToPlay(false);
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
  }, [videoPlayer, htmlVideoRef.current, contentTypeOverride, contentType, isPlaying]);

  const toggleMute = useCallback(() => {
    // Se há callback externo, usar ele (para controle global no feed)
    if (onMuteToggle) {
      onMuteToggle();
      return;
    }

    // Caso contrário, controle local
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
  }, [videoPlayer, isMuted, onMuteToggle]);

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

  const { theme } = useTheme();

  // Dynamic styles depending on theme
  const themedStyles = React.useMemo(() => StyleSheet.create({
    timeText: { color: 'white', ...theme.typography.bodySmall, width: 50, textAlign: 'center' }
  }), [theme]);

  const progress = duration ? position / duration : 0;
  const showSpinner = isLoadingUrl || isLoading;

  if (isLoadingUrl && !hlsUrl && !fallbackUrl) {
    return (
      <View style={[styles.container, style]}>
        {embed.thumbnail && (
          <OptimizedImage source={{ uri: embed.thumbnail }} style={StyleSheet.absoluteFill} contentFit="contain" />
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
            <Tooltip contentKey={isPlaying ? "media.pause" : "media.play"} position="top">
              <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="white" />
              </Pressable>
            </Tooltip>
          </View>

          <View style={styles.bottomControls}>
            <Text style={[styles.timeText, themedStyles.timeText]}>{formatPlayerTime(position)}</Text>
            <View style={styles.sliderContainer}>
              <View style={[styles.sliderProgress, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={[styles.timeText, themedStyles.timeText]}>{formatPlayerTime(duration || 0)}</Text>
            <Tooltip contentKey={isMuted ? "media.unmute" : "media.mute"} position="top">
              <Pressable onPress={toggleMute} style={styles.iconButton}>
                <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="white" />
              </Pressable>
            </Tooltip>
            <Tooltip contentKey={isFullscreen ? "media.exitFullscreen" : "media.fullscreen"} position="top">
              <Pressable onPress={handleFullscreen} style={styles.iconButton}>
                <Ionicons name={isFullscreen ? "contract" : "expand"} size={20} color="white" />
              </Pressable>
            </Tooltip>
          </View>
        </Pressable>
      )}
      {showTapToPlay && !showControlsOverlay && (
        <Pressable style={styles.tapOverlay} onPress={togglePlayPause}>
          <Text style={styles.tapText}>Tap to enable sound</Text>
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
  timeText: { color: 'white', width: 50, textAlign: 'center' },
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
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 2,
  },
  tapText: { color: 'white', fontWeight: 'bold' },
});

export default VideoPlayer;
