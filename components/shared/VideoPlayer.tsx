import React, { useRef } from 'react';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { StyleSheet, StyleProp, ViewStyle, View, Text } from 'react-native';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';

export type PlayerRef = Video;

interface SimpleVideoPlayerProps {
  hlsUrl: string | null;
  fallbackUrl: string | null;
  videoOptions: {
    autoplay?: boolean;
    controls?: boolean;
    poster?: string;
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

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({ 
  hlsUrl, 
  fallbackUrl, 
  videoOptions, 
  onReady, 
  style, 
  onPlay, 
  onPause, 
  onEnded, 
  onPlaybackStatusUpdate: onStatusUpdateProp 
}) => {
  const videoRef = useRef<Video>(null);
  const { currentSource, error, handleError } = useHlsPlayer(videoRef, hlsUrl, fallbackUrl);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    onStatusUpdateProp?.(status);
    if (!status.isLoaded) return;
    
    const successStatus = status as AVPlaybackStatusSuccess;
    if (successStatus.isPlaying) onPlay?.();
    else onPause?.();
    if (successStatus.didJustFinish && !successStatus.isLooping) onEnded?.();
  };

  if (error) {
    return (
      <View style={[styles.video, style, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!currentSource) {
      return <View style={[styles.video, style]} />;
  }
  
  return (
    <Video
      ref={videoRef}
      style={[styles.video, style]}
      source={{ uri: currentSource }}
      posterSource={videoOptions.poster ? { uri: videoOptions.poster } : undefined}
      usePoster={!!videoOptions.poster}
      shouldPlay={videoOptions.autoplay}
      isLooping={videoOptions.loop}
      isMuted={videoOptions.muted}
      resizeMode={ResizeMode.CONTAIN}
      posterStyle={{ resizeMode: ResizeMode.CONTAIN }}
      useNativeControls={videoOptions.controls}
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      onError={handleError}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black'
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default SimpleVideoPlayer;
