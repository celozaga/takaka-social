import React, { useState, useEffect } from 'react';
import { VideoView, useVideoPlayer, VideoStatusUpdateEvent } from 'expo-video';
import { StyleSheet, StyleProp, ViewStyle, View, Text } from 'react-native';

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
  onPlaybackStatusUpdate?: (status: VideoStatusUpdateEvent) => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({ 
  hlsUrl, 
  fallbackUrl, 
  videoOptions, 
  style, 
  onPlaybackStatusUpdate 
}) => {
  const [error, setError] = useState<string | null>(null);
  const player = useVideoPlayer(null, (p) => {
    p.loop = videoOptions.loop ?? false;
    p.muted = videoOptions.muted ?? false;
    if (videoOptions.autoplay) {
      p.play();
    }
  });

  useEffect(() => {
    const sourceToPlay = hlsUrl || fallbackUrl;
    if (sourceToPlay) {
      player.replace(sourceToPlay);
    }
  }, [hlsUrl, fallbackUrl, player]);

  useEffect(() => {
    const subscription = player.addListener('statusChange', (event) => {
      onPlaybackStatusUpdate?.(event);

      if (typeof event.status === 'object' && event.status.error) {
        console.error('VideoPlayer error:', event.status.error);
        const currentSourceUri = player.currentSource?.uri;

        if (currentSourceUri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
          console.log('HLS stream failed, attempting fallback to MP4.');
          player.replace(fallbackUrl);
          setError(null); // Clear previous error
        } else {
          setError("Could not play video.");
        }
      } else {
        setError(null);
      }
    });
    return () => subscription.remove();
  }, [player, onPlaybackStatusUpdate, hlsUrl, fallbackUrl]);
  
  return (
    <View style={[styles.video, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        posterSource={videoOptions.poster ? { uri: videoOptions.poster } : null}
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