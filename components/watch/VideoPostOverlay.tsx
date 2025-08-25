import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { AppBskyFeedDefs } from '@atproto/api';
import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Plus, Check, BadgeCheck, ChevronUp, ChevronDown, Play, Pause } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useAtp } from '@/context/AtpContext';

interface Props {
  post: AppBskyFeedDefs.PostView;
  onNext?: () => void;
  onPrevious?: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
}

const VideoPostOverlay: React.FC<Props> = ({ post, onNext, onPrevious, isPlaying, onTogglePlayPause }) => {
  const { agent, session } = useAtp();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const record = post.record as any;
  const isMe = session?.did === post.author.did;
  const profileLink = `/profile/${post.author.handle}`;

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  
  const [followUri, setFollowUri] = useState(post.author.viewer?.following);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  useEffect(() => setFollowUri(post.author.viewer?.following), [post.author.viewer?.following]);
  
  const handleFollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || followUri) return; setIsFollowLoading(true); agent.follow(post.author.did).then(({ uri }) => setFollowUri(uri)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri, post.author.did]);
  const handleUnfollow = useCallback((e: any) => { e.stopPropagation(); if (isFollowLoading || isMe || !followUri) return; setIsFollowLoading(true); agent.deleteFollow(followUri).then(() => setFollowUri(undefined)).finally(() => setIsFollowLoading(false)); }, [agent, isFollowLoading, isMe, followUri]);

  const toggleDescription = (e: any) => { e.stopPropagation(); setIsDescriptionExpanded(prev => !prev); };
  const needsTruncation = (record.text?.split('\n').length > 2 || record.text?.length > 100);

  return (
    <>
      {/* Layout estilo TikTok - informações na parte inferior esquerda */}
      <View style={[styles.bottomInfoContainer, isMobile && styles.bottomInfoContainerMobile]}>
        {/* Informações do autor */}
        <View style={styles.authorRow}>
          <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
            <Pressable style={styles.authorInfo}>
              <Image source={{ uri: post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatarTikTok} />
              <View style={styles.authorTextContainer}>
                <Text style={styles.authorNameTikTok}>{post.author.displayName || `@${post.author.handle}`}</Text>
                <Text style={styles.authorHandleTikTok}>@{post.author.handle}</Text>
              </View>
              {post.author.labels?.some(l => l.val === 'blue-check') && (
                <BadgeCheck size={16} color="white" fill={theme.colors.primary} style={styles.verifiedBadge} />
              )}
            </Pressable>
          </Link>
          
          {!isMe && (
            <Pressable onPress={followUri ? handleUnfollow : handleFollow} disabled={isFollowLoading} style={[styles.followButtonTikTok, followUri && styles.followingButton]}>
              <Text style={styles.followButtonText}>
                {followUri ? "Seguindo" : "Seguir"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Descrição do post */}
        {record.text && (
          <View style={styles.descriptionContainer}>
            <Text 
              style={[styles.descriptionTikTok, isMobile && styles.descriptionTikTokMobile]} 
              numberOfLines={isDescriptionExpanded ? undefined : (isMobile ? 2 : 2)}
              onTextLayout={e => { if (needsTruncation) setIsTextTruncated(e.nativeEvent.lines.length >= 2); }}
            >
              <RichTextRenderer record={record} />
            </Text>
            {(isTextTruncated || (needsTruncation && !isDescriptionExpanded)) && (
              <Pressable onPress={toggleDescription} style={styles.readMoreButton}>
                <Text style={styles.readMoreTextTikTok}>
                  {isDescriptionExpanded ? "menos" : "mais"}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Controle central play/pause (mais discreto) */}
      {onTogglePlayPause && (
        <Pressable onPress={onTogglePlayPause} style={styles.centralPlayButton}>
          {!isPlaying && (
            <View style={styles.playButtonContainer}>
              <Play size={60} color="white" fill="rgba(255,255,255,0.9)" />
            </View>
          )}
        </Pressable>
      )}

      {/* Ações laterais estilo TikTok */}
      <VideoActions post={post} />
    </>
  );
};

const styles = StyleSheet.create({
  // Layout principal estilo TikTok
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 80, // Espaço para ações laterais
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    zIndex: 10,
  },
  bottomInfoContainerMobile: {
    bottom: 15,
    right: 60, // Menos espaço em mobile
    paddingHorizontal: theme.spacing.s,
  },

  // Linha do autor (avatar + nome + botão seguir)
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  // Avatar estilo TikTok
  avatarTikTok: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: theme.spacing.s,
  },
  
  // Textos do autor
  authorTextContainer: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  authorNameTikTok: {
    ...theme.typography.titleSmall,
    color: 'white',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  authorHandleTikTok: {
    ...theme.typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Badge verificado
  verifiedBadge: {
    marginLeft: theme.spacing.xs,
  },
  
  // Botão seguir estilo TikTok
  followButtonTikTok: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  followButtonText: {
    ...theme.typography.bodySmall,
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Container da descrição
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  
  // Texto da descrição estilo TikTok
  descriptionTikTok: {
    ...theme.typography.bodyMedium,
    color: 'white',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  descriptionTikTokMobile: {
    fontSize: 14,
    lineHeight: 16,
  },
  
  // Botão "mais/menos"
  readMoreButton: {
    marginLeft: theme.spacing.xs,
  },
  readMoreTextTikTok: {
    ...theme.typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Controle central play/pause
  centralPlayButton: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  playButtonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default React.memo(VideoPostOverlay);