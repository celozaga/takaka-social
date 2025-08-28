import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, useWindowDimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { OptimizedImage } from '../ui';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPostOverlay from './VideoPostOverlay';
import VideoProgressBar from './VideoProgressBar';

import { useModeration } from '@/context/ModerationContext';
import { moderatePost, ModerationDecision } from '@/lib/moderation';
import ContentWarning from '@/components/shared/ContentWarning';
import SharedVideoPlayer from '../shared/VideoPlayer';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused?: boolean;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isActive?: boolean;
}

const VideoPlayer: React.FC<Props> = ({ 
  postView, 
  paused = false, 
  isMuted = false, 
  onMuteToggle, 
  onNext, 
  onPrevious, 
  isActive = true 
}) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const { post } = postView;
  const moderation = useModeration();
  const panRef = useRef<any>(null);

  const modDecision: ModerationDecision = useMemo(() => {
    if (!moderation.isReady) return { visibility: 'show' };
    return moderatePost(post, moderation);
  }, [post, moderation]);

  const embedView = useMemo(() => {
    if (AppBskyEmbedVideo.isView(post.embed)) return post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) return post.embed.media as AppBskyEmbedVideo.View;
    return undefined;
  }, [post.embed]);

  const [isContentVisible, setIsContentVisible] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);

  // Gestão de gestos para navegação estilo TikTok
  const onSwipeGestureEvent = useCallback((event: any) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    // Detectar swipe para cima (próximo vídeo) ou para baixo (vídeo anterior)
    if (Math.abs(velocityY) > 500) { // Velocidade mínima para considerar como swipe
      if (translationY < -50 && onNext) { // Swipe para cima
        onNext();
      } else if (translationY > 50 && onPrevious) { // Swipe para baixo  
        onPrevious();
      }
    }
  }, [onNext, onPrevious]);

  const onSwipeStateChange = useCallback((event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Detectar swipe rápido mesmo com pouco movimento
      if (Math.abs(velocityY) > 2000) {
        if (velocityY < 0 && onNext) { // Swipe rápido para cima
          onNext();
        } else if (velocityY > 0 && onPrevious) { // Swipe rápido para baixo
          onPrevious();
        }
      }
    }
  }, [onNext, onPrevious]);

  const renderPlayerContent = () => (
    <>
      <View style={styles.videoContainer}>
        <SharedVideoPlayer 
          post={post} 
          style={styles.video} 
          showControlsOverlay={false}
          paused={paused}
          isMuted={isMuted}
          onMuteToggle={onMuteToggle}
          isActive={isActive}
          onProgressUpdate={(progress, duration, position) => {
            setVideoProgress(progress);
            setVideoDuration(duration);
            setVideoPosition(position);
          }}
        />
      </View>
      
      {/* Barra de progresso estilo TikTok */}
      <VideoProgressBar 
        progress={videoProgress}
        duration={videoDuration}
        position={videoPosition}
      />
      
      <VideoPostOverlay 
        post={post} 
        onNext={onNext}
        onPrevious={onPrevious}
        isPlaying={!paused}
        onTogglePlayPause={() => {
          // Implementar toggle local se necessário
          console.log('Toggle play/pause requested');
        }}
      />
    </>
  );

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onSwipeGestureEvent}
      onHandlerStateChange={onSwipeStateChange}
      activeOffsetY={[-10, 10]}
      failOffsetX={[-50, 50]}
    >
      <View style={styles.container}>
        {/* Removido o backgroundImage com blur que estava impedindo interação */}
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
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'black', 
    overflow: 'hidden' // Alterado para hidden para evitar problemas de layout
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: 'visible',
  },
  backgroundOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    zIndex: 0 // Reduzido para não interferir com botões
  },
  errorOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 4 
  },
  errorText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
});

export default React.memo(VideoPlayer);
