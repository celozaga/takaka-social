import { useState, useCallback, useRef, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyEmbedVideo } from '@atproto/api';

const HLS_BASE_URL = 'https://video.bsky.app/watch';

export interface BlueskyVideoState {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  progress: number;
  duration: number;
  currentTime: number;
}

export interface BlueskyVideoControls {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  enterFullscreen: () => void;
  seekTo: (time: number) => void;
  reset: () => void;
}

export const useBlueskyVideo = (
  embed: AppBskyEmbedVideo.View | undefined,
  authorDid: string | undefined
) => {
  const { agent } = useAtp();
  const videoRef = useRef<any>(null);
  
  const [state, setState] = useState<BlueskyVideoState>({
    isPlaying: false,
    isMuted: false,
    isFullscreen: false,
    isLoading: true,
    hasError: false,
    errorMessage: null,
    progress: 0,
    duration: 0,
    currentTime: 0,
  });

  const [playbackUrls, setPlaybackUrls] = useState<{
    hlsUrl: string | null;
    fallbackUrl: string | null;
    streamingUrl: string | null;
    isLoading: boolean;
  }>({ hlsUrl: null, fallbackUrl: null, streamingUrl: null, isLoading: true });

  // Resolve video URLs
  useEffect(() => {
    if (!embed || !authorDid || !agent?.service) {
      setState(prev => ({ ...prev, isLoading: false }));
      setPlaybackUrls(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // 1. Construct HLS URL (for future use if service is restored)
      const hlsUrl = `${HLS_BASE_URL}/${authorDid}/${embed.cid}/playlist.m3u8`;

      // 2. Construct fallback getBlob URL
      const serviceUrl = agent.service.toString();
      const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
      const fallbackUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;

      // 3. Construct streaming URL with Range request support
      const streamingUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}&streaming=true`;
      
      setPlaybackUrls({ hlsUrl, fallbackUrl, streamingUrl, isLoading: false });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (e) {
      console.error("Failed to construct video URLs", e);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        hasError: true, 
        errorMessage: "Could not determine video URL." 
      }));
      setPlaybackUrls(prev => ({ ...prev, isLoading: false }));
    }
  }, [agent, embed, authorDid]);

  // Event handlers for BlueskyVideoView
  const handleActiveChange = useCallback((e: any) => {
    const isActive = e.nativeEvent.isActive;
    // Handle when video becomes active/inactive
    console.log('Video active state changed:', isActive);
  }, []);

  const handleLoadingChange = useCallback((e: any) => {
    const isLoading = e.nativeEvent.isLoading;
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const handleMutedChange = useCallback((e: any) => {
    const isMuted = e.nativeEvent.isMuted;
    setState(prev => ({ ...prev, isMuted }));
  }, []);

  const handlePlayerPress = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleStatusChange = useCallback((e: any) => {
    const status = e.nativeEvent.status;
    setState(prev => ({ 
      ...prev, 
      isPlaying: status === 'playing' 
    }));
  }, []);

  const handleTimeRemainingChange = useCallback((e: any) => {
    const timeRemaining = e.nativeEvent.timeRemaining;
    // Note: BlueskyVideo doesn't provide duration directly
    // We'll use a default duration or calculate from other sources
    const defaultDuration = 60; // 60 seconds as fallback
    const currentTime = Math.max(0, defaultDuration - timeRemaining);
    const progress = Math.min(1, currentTime / defaultDuration);
    setState(prev => ({ 
      ...prev, 
      currentTime,
      progress,
      duration: defaultDuration 
    }));
  }, []);

  const handleFullscreenChange = useCallback((e: any) => {
    const isFullscreen = e.nativeEvent.isFullscreen;
    setState(prev => ({ ...prev, isFullscreen }));
  }, []);

  const handleError = useCallback((e: any) => {
    const error = e.nativeEvent.error;
    console.error('BlueskyVideo error:', error);
    setState(prev => ({ 
      ...prev, 
      hasError: true, 
      errorMessage: error,
      isLoading: false 
    }));
  }, []);

  // Control functions
  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.togglePlayback();
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.togglePlayback();
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.toggleMuted();
    }
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const enterFullscreen = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.enterFullscreen();
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    // Note: BlueskyVideo doesn't expose seek functionality directly
    // This would need to be implemented through the native module
    console.log('Seek to:', time);
  }, []);

  const reset = useCallback(() => {
    setState({
      isPlaying: false,
      isMuted: false,
      isFullscreen: false,
      isLoading: true,
      hasError: false,
      errorMessage: null,
      progress: 0,
      duration: 0,
      currentTime: 0,
    });
  }, []);

  const controls: BlueskyVideoControls = {
    play,
    pause,
    togglePlayPause,
    toggleMute,
    enterFullscreen,
    seekTo,
    reset,
  };

  return {
    state,
    controls,
    videoRef,
    playbackUrls,
    eventHandlers: {
      onActiveChange: handleActiveChange,
      onLoadingChange: handleLoadingChange,
      onMutedChange: handleMutedChange,
      onPlayerPress: handlePlayerPress,
      onStatusChange: handleStatusChange,
      onTimeRemainingChange: handleTimeRemainingChange,
      onFullscreenChange: handleFullscreenChange,
      onError: handleError,
    },
  };
};
