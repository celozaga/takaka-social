import React from 'react';
import { VideoView, useVideoPlayer, VideoPlayerStatus } from 'expo-video';
import { StyleSheet, StyleProp, ViewStyle, View, Text } from 'react-native';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';

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
  style?: StyleProp<ViewStyle>;
  onPlaybackStatusUpdate?: (status: VideoPlayerStatus) => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({ 
  hlsUrl, 
  fallbackUrl, 
  videoOptions, 
  style, 
  onPlaybackStatusUpdate 
}) => {
  const player = useVideoPlayer(null, (p) => {
    p.loop = videoOptions.loop ?? false;
    p.muted = videoOptions.muted ?? false;
    if (videoOptions.autoplay) {
      p.play();
    }
  });

  const { error } = useHlsPlayer(player, hlsUrl, fallbackUrl);

  React.useEffect(() => {
    if (!onPlaybackStatusUpdate) return;
    const subscription = player.addListener('statusChange', (status) => {
        onPlaybackStatusUpdate(status);
    });
    return () => subscription.remove();
  }, [player, onPlaybackStatusUpdate]);

  return (
    <View style={[styles.video, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        poster={videoOptions.poster}
        contentFit="contain"
        allowsFullscreen
        nativeControls={videoOptions.controls}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black'
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default SimpleVideoPlayer;