
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatusSuccess } from 'expo-av';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Volume2, VolumeX, Play, Plus, Check, BadgeCheck } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useAtp } from '@/context/AtpContext';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const VideoPlayer: React.FC<Props> = ({ postView, paused: isExternallyPaused, isMuted, onMuteToggle }) => {
  const videoRef = useRef<Video>(null);
  
  const [isInternallyPaused, setIsInternallyPaused] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  
  const { post } = postView;
  const { agent, session } = useAtp();
  const record = post.record as any;
  const isMe = session?.did === post.author.did;
  const profileLink = `/profile/${post.author.handle}`;
  
  const [followUri, setFollowUri] = useState(post.author.viewer?.following);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  useEffect(() => setFollowUri(post.author.viewer?.following), [post.author.viewer?.following]);
  
  const handleFollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || followUri) return; setIsFollowLoading(true); agent.follow(post.author.did).then(({ uri }) => setFollowUri(uri)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri, post.author.did]);
  const handleUnfollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || !followUri) return; setIsFollowLoading(true); agent.deleteFollow(followUri).then(() => setFollowUri(undefined)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri]);

  const embedView = useMemo(() => {
    if (AppBskyEmbedVideo.isView(post.embed)) return post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) return post.embed.media as AppBskyEmbedVideo.View;
    return undefined;
  }, [post.embed]);

  const { playbackUrl, isLoading: isLoadingUrl } = useVideoPlayback(post.uri, embedView, post.author.did);

  useEffect(() => {
    // Reset state for new video
    setIsInternallyPaused(false);
    setStatus(null);
    setIsDescriptionExpanded(false);
    setIsTextTruncated(false);
  }, [post.uri]);

  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;
  useEffect(() => {
    if (videoRef.current) {
      if (isEffectivelyPaused) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  }, [isEffectivelyPaused]);

  const resizeMode = useMemo(() => {
    if (!embedView?.aspectRatio) return ResizeMode.CONTAIN;
    const { width, height } = embedView.aspectRatio;
    return width < height ? ResizeMode.COVER : ResizeMode.CONTAIN;
  }, [embedView]);
  
  const showSpinner = isLoadingUrl || (status?.isBuffering && !status?.isPlaying);
  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const handleMuteToggle = (e: any) => { e.stopPropagation(); onMuteToggle(); };
  const toggleDescription = (e: any) => { e.stopPropagation(); setIsDescriptionExpanded(prev => !prev); };
  const needsTruncation = (record.text?.split('\n').length > 2 || record.text?.length > 100);

  const progress = status ? (status.positionMillis / (status.durationMillis || 1)) : 0;

  return (
    <TouchableWithoutFeedback onPress={toggleInternalPlayPause}>
      <View style={styles.container}>
        {resizeMode === ResizeMode.CONTAIN && embedView?.thumbnail && (
          <Image source={{ uri: embedView.thumbnail }} style={styles.backgroundImage} resizeMode="cover" blurRadius={Platform.OS === 'ios' ? 30 : 15} />
        )}
        <View style={styles.backgroundOverlay} />
        
        {playbackUrl && (
          <Video
            ref={videoRef}
            style={StyleSheet.absoluteFill}
            source={{ uri: playbackUrl }}
            posterSource={embedView?.thumbnail ? { uri: embedView.thumbnail } : undefined}
            usePoster
            resizeMode={resizeMode}
            shouldPlay={!isExternallyPaused}
            isLooping
            isMuted={isMuted}
            onPlaybackStatusUpdate={(s) => { if (s.isLoaded) setStatus(s as AVPlaybackStatusSuccess) }}
          />
        )}
        
        {showSpinner && <ActivityIndicator size="large" color="white" style={styles.loader} />}
        {!playbackUrl && !isLoadingUrl && (
            <View style={styles.errorOverlay}><Text style={styles.errorText}>Could not play video</Text></View>
        )}
        
        {isInternallyPaused && !showSpinner && (
          <View style={styles.playButtonOverlay}>
            <Play size={80} color="rgba(255, 255, 255, 0.7)" fill="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
        
        {!isLoadingUrl && (
          <>
            <View style={styles.infoOverlay}>
              <View style={styles.authorContainer}>
                <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
                  <Pressable>
                    <Image source={{ uri: post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                     {post.author.labels?.some(l => l.val === 'blue-check') && (
                        <View style={styles.badgeContainer}><BadgeCheck size={14} color="white" fill={theme.colors.primary} /></View>
                    )}
                  </Pressable>
                </Link>
                {!isMe && (
                  <Pressable onPress={followUri ? handleUnfollow : handleFollow} disabled={isFollowLoading} style={[styles.followButton, !followUri && styles.followButtonActive]}>
                      {followUri ? <Check size={16} color="white" strokeWidth={3} /> : <Plus size={16} color="white" />}
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
                onTextLayout={e => { if (needsTruncation) setIsTextTruncated(e.nativeEvent.lines.length >= 2); }}
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
            <Pressable onPress={handleMuteToggle} style={styles.muteButton}>
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
  backgroundImage: { ...StyleSheet.absoluteFillObject, zIndex: 0, ...(Platform.OS === 'web' && { filter: 'blur(25px) brightness(0.8)', transform: [{ scale: '1.1' }] } as any) },
  backgroundOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 1 },
  loader: { position: 'absolute', zIndex: 4 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 80, padding: theme.spacing.l, zIndex: 3, gap: theme.spacing.s },
  authorContainer: { position: 'relative', width: 48, height: 48, marginBottom: theme.spacing.xs },
  avatar: { width: 48, height: 48, borderRadius: theme.shape.full, borderWidth: 2, borderColor: 'white', backgroundColor: theme.colors.surfaceContainerHigh },
  badgeContainer: { position: 'absolute', bottom: -2, right: -2, backgroundColor: theme.colors.primary, borderRadius: theme.shape.full, padding: 2 },
  followButton: { position: 'absolute', bottom: -8, left: '50%', transform: [{ translateX: -12 }], width: 24, height: 24, borderRadius: theme.shape.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  followButtonActive: { backgroundColor: theme.colors.primary },
  authorText: { ...theme.typography.titleSmall, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  descriptionText: { ...theme.typography.bodyMedium, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  readMoreText: { ...theme.typography.bodyMedium, fontWeight: 'bold', color: 'white', marginTop: theme.spacing.xs },
  muteButton: { position: 'absolute', top: theme.spacing.l, right: theme.spacing.l, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s, borderRadius: theme.shape.full, zIndex: 3 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4 },
  errorText: { color: 'white', fontWeight: 'bold' },
  playButtonOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)', zIndex: 3 },
  progressBar: { height: '100%', backgroundColor: 'white', width: '100%', transformOrigin: 'left' },
});

export default React.memo(VideoPlayer);
