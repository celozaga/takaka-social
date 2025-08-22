
import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Pressable, Text } from 'react-native';
import Video from 'react-native-video';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { theme } from '@/lib/theme';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  blobUrl: string;
  paused: boolean;
}

type VideoStatus = 'loading' | 'buffering' | 'playing' | 'error';

const VideoPlayer: React.FC<Props> = ({ postView, blobUrl, paused: isExternallyPaused }) => {
  const [isInternallyPaused, setIsInternallyPaused] = useState(false);
  const [status, setStatus] = useState<VideoStatus>('loading');
  const [isMuted, setIsMuted] = useState(true);

  const { post } = postView;
  const record = post.record as any;

  let embedView: AppBskyEmbedVideo.View | undefined;
  if (AppBskyEmbedVideo.isView(post.embed)) embedView = post.embed;
  else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) embedView = post.embed.media as AppBskyEmbedVideo.View;

  // Reset the state when the video changes
  useEffect(() => {
    setStatus('loading');
    setIsInternallyPaused(false);
  }, [post.uri]);

  if (!embedView) return null;
  
  const isEffectivelyPaused = isExternallyPaused || isInternallyPaused;
  const showThumbnail = status === 'loading' || status === 'error';
  const showSpinner = status === 'buffering';

  const toggleInternalPlayPause = () => setIsInternallyPaused(prev => !prev);
  const toggleMuteLocal = (e: any) => { e.stopPropagation(); setIsMuted(prev => !prev); };

  return (
    <TouchableWithoutFeedback onPress={toggleInternalPlayPause}>
      <View style={styles.container}>
        {/* 1. Thumbnail: Shown during initial load or on error */}
        {showThumbnail && embedView.thumbnail && (
          <Image 
            source={{ uri: embedView.thumbnail }} 
            style={[StyleSheet.absoluteFill, styles.thumbnail]}
            resizeMode="cover" 
          />
        )}

        <Video
          source={{ uri: blobUrl }}
          style={styles.video}
          resizeMode="contain"
          repeat
          paused={isEffectivelyPaused}
          muted={isMuted}
          onLoadStart={() => setStatus('loading')}
          onLoad={() => setStatus('playing')}
          onReadyForDisplay={() => setStatus('playing')} // For faster start on iOS
          onBuffer={({ isBuffering }) => {
            // Only show buffering spinner after initial load
            if (status !== 'loading') {
                setStatus(isBuffering ? 'buffering' : 'playing');
            }
          }}
          onError={(e: any) => {
            console.error('Video Error:', e);
            setStatus('error');
          }}
          playInBackground={false}
          playWhenInactive={false}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 60000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
        />

        {/* 2. Spinner: Shown only during mid-playback buffering */}
        {showSpinner && (
          <ActivityIndicator
            size="large"
            color="white"
            style={styles.loader}
          />
        )}
        
        {/* 3. Error message */}
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

        {/* UI Overlays: Shown when video is visible (not during initial load) */}
        {!showThumbnail && (
          <>
            <View style={styles.infoOverlay}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Text style={styles.authorText}>{post.author.displayName || `@${post.author.handle}`}</Text>
              </Pressable>
              <Text style={styles.descriptionText} numberOfLines={2}>
                <RichTextRenderer record={record} />
              </Text>
            </View>

            <VideoActions post={post} />

            <Pressable onPress={toggleMuteLocal} style={styles.muteButton}>
              {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </Pressable>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  thumbnail: { zIndex: 1 },
  video: { width: '100%', height: '100%', zIndex: 2 },
  loader: { position: 'absolute', zIndex: 4 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.l, paddingBottom: 96, zIndex: 3 },
  authorText: { ...theme.typography.titleSmall, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  descriptionText: { ...theme.typography.bodyMedium, color: 'white', marginTop: theme.spacing.xs, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  muteButton: { position: 'absolute', top: theme.spacing.l, right: theme.spacing.l, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s, borderRadius: theme.shape.full, zIndex: 3 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4 },
  errorText: { color: 'white', fontWeight: 'bold' },
  playButtonOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});

export default React.memo(VideoPlayer);