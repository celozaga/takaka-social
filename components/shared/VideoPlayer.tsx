import React, { useState, useEffect, useRef } from 'react';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
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
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({ 
  hlsUrl, 
  fallbackUrl, 
  videoOptions, 
  style, 
  onPlaybackStatusUpdate 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [sourceUri, setSourceUri] = useState<string | undefined>(hlsUrl || fallbackUrl || undefined);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    setSourceUri(hlsUrl || fallbackUrl || undefined);
  }, [hlsUrl, fallbackUrl]);

  const handleError = ({ error }: { error: string }) => {
    console.error('VideoPlayer error:', error);
    if (sourceUri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
      console.log('HLS stream failed, attempting fallback to MP4.');
      setSourceUri(fallbackUrl);
      setError(null);
    } else {
      setError("Could not play video.");
    }
  };
  
  if (!sourceUri) {
      return (
        <View style={[styles.video, style, styles.errorContainer]}>
        </View>
      );
  }

  const handleStatusUpdate = (status: AVPlaybackStatus) => {
    if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate(status);
    }
    if (!status.isLoaded) {
        handleError({ error: status.error });
    } else {
        setError(null);
    }
  }

  return (
    <View style={[styles.video, style]}>
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFill}
        source={{ uri: sourceUri }}
        posterSource={videoOptions.poster ? { uri: videoOptions.poster } : undefined}
        useNativeControls={videoOptions.controls}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={videoOptions.loop}
        isMuted={videoOptions.muted}
        shouldPlay={videoOptions.autoplay}
        onPlaybackStatusUpdate={handleStatusUpdate}
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