import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface VideoProgressBarProps {
  progress: number; // 0 to 1
  duration: number; // em segundos
  position: number; // em segundos
  onSeek?: (position: number) => void;
}

const VideoProgressBar: React.FC<VideoProgressBarProps> = ({ 
  progress, 
  duration, 
  position, 
  onSeek 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
});

export default VideoProgressBar;
