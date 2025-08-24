import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPostOverlay from './VideoPostOverlay';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { useModeration } from '@/context/ModerationContext';
import { moderatePost, ModerationDecision } from '@/lib/moderation';
import ContentWarning from '@/components/shared/ContentWarning';

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

  const { hlsUrl, fallbackUrl, isLoading: isLoadingUrl } = useVideoPlayback(embedView, post.author.did);
  
  const player = useVideoPlayer(null, p => {
    p.loop = true;
  });

  const { error: playerError } = useHlsPlayer(player, hlsUrl, fallbackUrl);

  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const subscriptions = [
        player.addListener('loadingChange', (event) => setIsLoading(event.isLoading)),
        player.addListener('timeUpdate', (event) => {
            setPosition(event.position);
            setDuration(event.duration);
        }),
    ];
    return () => {
        subscriptions.forEach(sub => sub.remove());
    };
  }, [player]);


  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;

  useEffect(() => {
    player.muted = isMuted;
  }, [player, isMuted]);

  useEffect(() => {
    if (isEffectivelyPaused) {
        player.pause();
    } else {
        player.play();
    }
  }, [player, isEffectivelyPaused]);

  const contentFit = useMemo(() => {
    if (!embedView?.aspectRatio) return 'contain';
    return 'cover';
  }, [embedView]);
  
  const showSpinner = isLoadingUrl || isLoading;
  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const handleMuteToggle = (e: any) => { e.stopPropagation(); onMuteToggle(); };

  const progress = duration ? (position / duration) : 0;

  const renderPlayerContent = () => (
      <>
        <VideoView
          player={player}
          style={styles.video}
          poster={embedView?.thumbnail}
          contentFit={contentFit}
          allowsFullscreen
        />
        
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