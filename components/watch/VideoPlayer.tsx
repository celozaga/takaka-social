import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform } from 'react-native';

import { Image } from 'expo-image';
import { Video, AVPlaybackStatus } from 'expo-av';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPostOverlay from './VideoPostOverlay';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { useModeration } from '@/context/ModerationContext';
import { moderatePost, ModerationDecision } from '@/lib/moderation';
import ContentWarning from '@/components/shared/ContentWarning';
import { ResizeMode } from 'expo-av';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const VideoPlayer: React.FC<Props> = ({ postView, paused: isExternallyPaused, isMuted, onMuteToggle }) => {
  const [isInternallyPaused, setIsInternallyPaused] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const { post } = postView;
  const moderation = useModeration();
  const [playerError, setPlayerError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    // Reset state for new video
    setIsInternallyPaused(false);
    setIsContentVisible(false);
  }, [post.uri]);

  const modDecision: ModerationDecision = useMemo(() => {
    if (!moderation.isReady) return { visibility: 'show' };
    return moderatePost(post, moderation);
  }, [post, moderation]);

  const embedView = useMemo(() => {
    if (AppBskyEmbedVideo.isView(post.embed)) return post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) return post.embed.media as AppBskyEmbedVideo.View;
    return undefined;
  }, [post.embed]);

  const { hlsUrl, fallbackUrl, streamingUrl, isLoading: isLoadingUrl } = useVideoPlayback(embedView, post.author.did);
  const [sourceUri, setSourceUri] = useState<string | undefined>(undefined);

  useEffect(() => {
      setSourceUri(streamingUrl || hlsUrl || fallbackUrl || undefined);
  }, [streamingUrl, hlsUrl, fallbackUrl]);
  
  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;
  const isLoading = status?.isLoaded ? status.isBuffering : true;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 0;
  
  useEffect(() => {
    videoRef.current?.setIsMutedAsync(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (isEffectivelyPaused) {
        videoRef.current?.pauseAsync();
    } else {
        videoRef.current?.playAsync();
    }
  }, [isEffectivelyPaused]);

  const contentFit = useMemo(() => {
    if (!embedView?.aspectRatio) return ResizeMode.CONTAIN;
    // Simple logic, can be improved to handle portrait/landscape better
    return embedView.aspectRatio.width > embedView.aspectRatio.height ? ResizeMode.CONTAIN : ResizeMode.COVER;
  }, [embedView]);
  
  const handleStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
        setPlayerError(null);
    } else {
        console.error('VideoPlayer error: Video could not be loaded');
        if (sourceUri === streamingUrl && fallbackUrl) {
            console.log('Streaming failed, attempting fallback to MP4.');
            setSourceUri(fallbackUrl);
            setPlayerError(null);
        } else if (sourceUri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
            console.log('HLS stream failed, attempting fallback to MP4.');
            setSourceUri(fallbackUrl);
            setPlayerError(null);
        } else {
            setPlayerError("Could not play video.");
        }
    }
  };

  const showSpinner = isLoadingUrl || isLoading;
  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const handleMuteToggle = (e: any) => { e.stopPropagation(); onMuteToggle(); };

  const progress = duration ? (position / duration) : 0;

  const renderPlayerContent = () => (
      <>
        {sourceUri && (
            <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: sourceUri }}
                posterSource={embedView?.thumbnail ? { uri: embedView.thumbnail } : undefined}
                resizeMode={contentFit}
                shouldPlay={!isEffectivelyPaused}
                isLooping
                isMuted={isMuted}
                onPlaybackStatusUpdate={handleStatusUpdate}
            />
        )}
        
        {showSpinner && <ActivityIndicator size="large" color="white" style={styles.loader} />}
        {playerError && !showSpinner && (
            <View style={styles.errorOverlay}><Text style={styles.errorText}>{playerError}</Text></View>
        )}
        
        {isInternallyPaused && !showSpinner && (
          <View style={styles.playButtonOverlay}>
            <Play size={80} color="rgba(255, 255, 255, 0.7)" fill="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
        
        {!isLoadingUrl && (
          <>
            <VideoPostOverlay post={post} />
            <Pressable onPress={handleMuteToggle} style={styles.muteButton}>
              {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </Pressable>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { transform: [{ scaleX: progress }] }]} />
            </View>
          </>
        )}
      </>
  );

  return (
    <TouchableWithoutFeedback onPress={toggleInternalPlayPause}>
      <View style={styles.container}>
        {embedView?.thumbnail && (
          <Image source={{ uri: embedView.thumbnail }} style={styles.backgroundImage} contentFit="cover" blurRadius={Platform.OS === 'ios' ? 30 : 15} />
        )}
        <View style={styles.backgroundOverlay} />
        
        {modDecision.visibility === 'warn' && !isContentVisible ? (
          <ContentWarning
            reason={modDecision.reason!}
            onShow={() => setIsContentVisible(true)}
          />
        ) : (
          renderPlayerContent()
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', overflow: 'hidden' },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundImage: { ...StyleSheet.absoluteFillObject, zIndex: 0, ...(Platform.OS === 'web' && { filter: 'blur(25px) brightness(0.8)', transform: [{ scale: '1.1' }] } as any) },
  backgroundOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 1 },
  loader: { position: 'absolute', zIndex: 4 },
  muteButton: { position: 'absolute', top: theme.spacing.l, right: theme.spacing.l, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s, borderRadius: theme.shape.full, zIndex: 3 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4 },
  errorText: { color: 'white', fontWeight: 'bold' },
  playButtonOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)', zIndex: 3 },
  progressBar: { height: '100%', backgroundColor: 'white', transformOrigin: 'left' },
});

export default React.memo(VideoPlayer);