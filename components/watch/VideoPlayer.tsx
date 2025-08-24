import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text, Platform, useWindowDimensions } from 'react-native';
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

const VideoPlayer: React.FC<Props> = ({ postView, paused: isExternallyPaused }) => {
  const { agent, session } = useAtp();
  const videoRef = useRef<Video>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [isInternallyPaused, setIsInternallyPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTextTruncated, setIsTextTruncated] = useState(false);

  const { post } = postView;
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

  useEffect(() => {
    setIsInternallyPaused(false);
    setProgress(0);

    if (!embedView) {
      setIsLoadingUrl(false);
      setPlaybackUrl(null);
      return;
    }

    const fetchUrl = async () => {
      setIsLoadingUrl(true);
      try {
        const res = await (agent.api.app.bsky.video as any).getPlaybackUrl({ did: post.author.did, cid: embedView.cid });
        setPlaybackUrl(res.data.url);
      } catch (e) {
        console.warn("Could not fetch playback URL, falling back to blob", e);
        try {
          const serviceUrl = agent.service.toString();
          const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
          const blobUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${post.author.did}&cid=${embedView.cid}`;
          setPlaybackUrl(blobUrl);
        } catch (blobError) {
          console.error("Failed to construct blob URL", blobError);
          setPlaybackUrl(null);
        }
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchUrl();
  }, [agent, embedView, post.author.did]);

  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;
  useEffect(() => {
    videoRef.current?.[isEffectivelyPaused ? 'pauseAsync' : 'playAsync']();
  }, [isEffectivelyPaused]);

  const resizeMode = useMemo(() => {
    if (!embedView?.aspectRatio) return ResizeMode.CONTAIN;
    const { width, height } = embedView.aspectRatio;
    return width < height ? ResizeMode.COVER : ResizeMode.CONTAIN;
  }, [embedView]);
  
  const showSpinner = isLoadingUrl || isBuffering;
  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const toggleMuteLocal = (e: any) => { e.stopPropagation(); setIsMuted(prev => !prev); };
  const toggleDescription = (e: any) => { e.stopPropagation(); setIsDescriptionExpanded(prev => !prev); };
  const needsTruncation = (record.text?.split('\n').length > 2 || record.text?.length > 100);

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
            source={{ uri: playbackUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeMode}
            isLooping
            shouldPlay={!isEffectivelyPaused}
            isMuted={isMuted}
            onPlaybackStatusUpdate={(s: AVPlaybackStatus) => {
              if (s.isLoaded) {
                setIsBuffering(s.isBuffering);
                setProgress((s.positionMillis / (s.durationMillis || 1)) || 0);
              }
            }}
          />
        )}
        
        {showSpinner && <ActivityIndicator size="large" color="white" style={styles.loader} />}
        {!playbackUrl && !isLoadingUrl && (
            <View style={styles.errorOverlay}><Text style={styles.errorText}>Could not play video</Text></View>
        )}
        
        {isInternallyPaused && !isBuffering && (
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
  backgroundImage: { ...StyleSheet.absoluteFillObject, zIndex: 0, ...(Platform.OS === 'web' && { filter: 'blur(25px) brightness(0.8)', transform: [{ scale: '1.1' }] } as any) },
  backgroundOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 1 },
  loader: { position: 'absolute', zIndex: 4 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.l, zIndex: 3, gap: theme.spacing.s },
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
  playButtonOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)', zIndex: 3 },
  progressBar: { height: '100%', backgroundColor: 'white', width: '100%', transformOrigin: 'left' },
});

export default React.memo(VideoPlayer);
