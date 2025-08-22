import React, { useRef, useEffect } from 'react';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';

// The player ref will be an expo-av Video component instance
export type PlayerRef = Video;

interface VideoPlayerProps {
  options: {
    autoplay?: boolean;
    controls?: boolean;
    poster?: string;
    sources: { src: string; type?: string }[];
    loop?: boolean;
    muted?: boolean;
  };
  onReady?: (player: PlayerRef) => void;
  style?: StyleProp<ViewStyle>;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

const SharedVideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady, style, onPlay, onPause, onEnded, onPlaybackStatusUpdate: onStatusUpdateProp }) => {
  const videoRef = useRef<Video>(null);
  const onReadyRef = React.useRef(onReady);

  // Keep onReady ref up to date without re-running effect
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (videoRef.current) {
        onReadyRef.current?.(videoRef.current);
    }
  }, [videoRef.current]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    onStatusUpdateProp?.(status);

    if (!status.isLoaded) return;
    
    const successStatus = status as AVPlaybackStatusSuccess;
    
    if (successStatus.isPlaying) onPlay?.();
    else onPause?.();
    
    if (successStatus.didJustFinish && !successStatus.isLooping) onEnded?.();
  };

  if (!options.sources || options.sources.length === 0 || !options.sources[0].src) {
      return null;
  }
  
  return (
    <Video
      ref={videoRef}
      style={[styles.video, style]}
      source={{ uri: options.sources[0].src }}
      posterSource={options.poster ? { uri: options.poster } : undefined}
      usePoster={!!options.poster}
      shouldPlay={options.autoplay}
      isLooping={options.loop}
      isMuted={options.muted}
      resizeMode={ResizeMode.COVER}
      useNativeControls={options.controls}
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black'
  },
});

export default SharedVideoPlayer;