import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform, useWindowDimensions, ViewStyle } from 'react-native';
import { Link } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Volume2, VolumeX, Play, Plus, Check, BadgeCheck } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useAtp } from '@/context/AtpContext';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
}

type VideoStatus = 'loading' | 'buffering' | 'playing' | 'error';

const VideoPlayer: React.FC<Props> = ({ postView, paused: isExternallyPaused }) => {
  const { agent, session } = useAtp();
  const videoRef = useRef<Video>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isInternallyPaused, setIsInternallyPaused] = useState(false);
  const [status, setStatus] = useState<VideoStatus>('loading');
  const [isMuted, setIsMuted] = useState(false); // Audio on by default
  const [progress, setProgress] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { post } = postView;
  const record = post.record as any;
  const isMe = session?.did === post.author.did;
  const profileLink = `/profile/${post.author.handle}`;

  // Follow state logic moved from VideoActions
  const [followUri, setFollowUri] = useState(post.author.viewer?.following);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  useEffect(() => setFollowUri(post.author.viewer?.following), [post.author.viewer?.following]);
  const handleFollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || followUri) return; setIsFollowLoading(true); agent.follow(post.author.did).then(({ uri }) => setFollowUri(uri)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri, post.author.did]);
  const handleUnfollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || !followUri) return; setIsFollowLoading(true); agent.deleteFollow(followUri).then(() => setFollowUri(undefined)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri]);

  useEffect(() => {
    // Reset state for new video
    setStatus('loading');
    setIsInternallyPaused(false);
    setVideoUrl(null);
    setProgress(0);
    setIsDescriptionExpanded(false);
    setIsTextTruncated(false);

    let currentEmbedView: AppBskyEmbedVideo.View | undefined;
    if (AppBskyEmbedVideo.isView(post.embed)) currentEmbedView = post.embed;
    else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) currentEmbedView = post.embed.media as AppBskyEmbedVideo.View;

    if (!currentEmbedView) {
      setStatus('error');
      return;
    }

    try {
      const did = post.author.did;
      const cid = currentEmbedView.cid;
      const serviceUrl = agent.service.toString();
      const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
      const blobUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
      setVideoUrl(blobUrl);
    } catch (e) {
      console.error('Failed to construct blob URL', e);
      setStatus('error');
    }
  }, [postView, agent]);
  
  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;

  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;
    
    if (isEffectivelyPaused) {
      player.pauseAsync();
    } else {
      player.playAsync();
    }
  }, [isEffectivelyPaused]);

  let embedView: AppBskyEmbedVideo.View | undefined;
  if (AppBskyEmbedVideo.isView(post.embed)) embedView = post.embed;
  else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) embedView = post.embed.media as AppBskyEmbedVideo.View;

  if (!embedView) return null;

  const videoAspectRatio = embedView.aspectRatio ? embedView.aspectRatio.width / embedView.aspectRatio.height : 16 / 9;
  const screenAspectRatio = screenWidth / screenHeight;

  // Determine the correct styling to make the video fit the screen using "contain" logic,
  // which will then be centered by the parent flex container.
  const videoStyle: ViewStyle = videoAspectRatio > screenAspectRatio
    ? { width: '100%', aspectRatio: videoAspectRatio } // Video is wider than screen, fit to width
    : { height: '100%', aspectRatio: videoAspectRatio }; // Video is taller than screen, fit to height
  
  const showSpinner = status === 'buffering';

  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const toggleMuteLocal = (e: any) => { e.stopPropagation(); setIsMuted(prev => !prev); };
  const toggleDescription = (e: any) => { e.stopPropagation(); setIsDescriptionExpanded(prev => !prev); };
  
  const needsTruncation = (record.text?.split('\n').length > 2 || record.text?.length > 100);

  return (
    <TouchableWithoutFeedback onPress={toggleInternalPlayPause}>
      <View style={styles.container}>
        {/* Blurred Background */}
        {embedView.thumbnail && (
          <Image
            source={{ uri: embedView.thumbnail }}
            style={styles.backgroundImage}
            resizeMode="cover"
            blurRadius={Platform.OS === 'ios' ? 30 : 0}
          />
        )}
        <View style={styles.backgroundOverlay} />

        {/* The main video content, contained within the screen bounds */}
        {videoUrl && (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={[styles.video, videoStyle]}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={!isEffectivelyPaused}
              isMuted={isMuted}
              onPlaybackStatusUpdate={(s: AVPlaybackStatus) => {
                if (!s.isLoaded) {
                  if ('error' in s && s.error) {
                    console.error('Video Error:', s.error);
                    setStatus('error');
                  }
                  return;
                }
                
                const newProgress = s.positionMillis / (s.durationMillis || 1);
                setProgress(newProgress || 0);
                
                if (s.isBuffering) {
                  if (status !== 'loading') setStatus('buffering');
                } else {
                  setStatus('playing');
                }
              }}
              onLoadStart={() => setStatus('loading')}
              onReadyForDisplay={() => setStatus('playing')}
            />
        )}
        
        {showSpinner && (
          <ActivityIndicator size="large" color="white" style={styles.loader} />
        )}
        
        {status === 'error' && (
            <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>Could not play video</Text>
            </View>
        )}
        
        {isInternallyPaused && status === 'playing' && (
          <View style={styles.playButtonOverlay}>
            <Play size={80} color="rgba(255, 255, 255, 0.7)" fill="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
        
        {status !== 'loading' && status !== 'error' && (
          <>
            <View style={styles.infoOverlay}>
              <View style={styles.authorContainer}>
                <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                  <Pressable>
                    <Image source={{ uri: post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                     {post.author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                        <View style={styles.badgeContainer}><BadgeCheck size={14} color="white" fill="currentColor" /></View>
                    )}
                  </Pressable>
                </Link>
                {!isMe && (
                  <Pressable onPress={followUri ? handleUnfollow : handleFollow} disabled={isFollowLoading} style={[styles.followButton, !followUri && styles.followButtonActive]}>
                      {followUri ? <Check size={16} color={theme.colors.primary} strokeWidth={3} /> : <Plus size={16} color="white" />}
                  </Pressable>
                )}
              </View>
              <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                <Pressable>
                  <Text style={styles.authorText}>{post.author.displayName || `@${post.author.handle}`}</Text>
                </Pressable>
              </Link>
              <Text 
                style={styles.descriptionText} 
                numberOfLines={isDescriptionExpanded ? undefined : 2}
                onTextLayout={e => {
                    if (needsTruncation) {
                        setIsTextTruncated(e.nativeEvent.lines.length >= 2);
                    }
                }}
              >
                <RichTextRenderer record={record} />
              </Text>
              {(isTextTruncated || (needsTruncation && !isDescriptionExpanded)) && (
                <Pressable onPress={toggleDescription}>
                    <Text style={styles.readMoreText}>{isDescriptionExpanded ? "Read less" : "Read more"}</Text>
                </Pressable>
              )}
            </View>
            <VideoActions post={post} />
            <Pressable onPress={toggleMuteLocal} style={styles.muteButton}>
              {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </Pressable>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { transform: [{ scaleX: progress }] }]} />
            </View>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', overflow: 'hidden' },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    ...(Platform.OS === 'web' && {
      filter: 'blur(25px) brightness(0.8)', // CSS filter for web
      transform: [{ scale: '1.1' }], // Scale to cover edges after blur
    } as any),
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Darken the background for better contrast
    zIndex: 1,
    // On Android, where blurRadius is not great, this overlay is more important.
    ...(Platform.OS === 'android' && {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    })
  },
  video: {
    zIndex: 2,
  },
  loader: { position: 'absolute', zIndex: 4 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.l, paddingBottom: theme.spacing.l, zIndex: 3, gap: theme.spacing.s },
  authorContainer: { position: 'relative', width: 48, height: 48, marginBottom: theme.spacing.xs },
  avatar: { width: 48, height: 48, borderRadius: theme.shape.full, borderWidth: 2, borderColor: 'white', backgroundColor: theme.colors.surfaceContainerHigh },
  badgeContainer: { position: 'absolute', bottom: -2, right: -2, backgroundColor: theme.colors.primary, borderRadius: theme.shape.full, padding: 2, borderWidth: 1, borderColor: 'black' },
  followButton: { position: 'absolute', bottom: -8, left: '50%', transform: [{ translateX: -12 }], width: 24, height: 24, borderRadius: theme.shape.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'black', backgroundColor: theme.colors.onSurfaceVariant },
  followButtonActive: { backgroundColor: theme.colors.error },
  authorText: { ...theme.typography.titleSmall, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  descriptionText: { ...theme.typography.bodyMedium, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  readMoreText: { ...theme.typography.bodyMedium, fontWeight: 'bold', color: 'white', marginTop: theme.spacing.xs },
  muteButton: { position: 'absolute', top: theme.spacing.l, right: theme.spacing.l, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s, borderRadius: theme.shape.full, zIndex: 3 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4 },
  errorText: { color: 'white', fontWeight: 'bold' },
  playButtonOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    width: '100%',
    transformOrigin: 'left',
  },
});

export default React.memo(VideoPlayer);