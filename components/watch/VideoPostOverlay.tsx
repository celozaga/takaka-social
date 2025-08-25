import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { AppBskyFeedDefs } from '@atproto/api';
import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Plus, Check, BadgeCheck } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useAtp } from '@/context/AtpContext';

interface Props {
  post: AppBskyFeedDefs.PostView;
}

const VideoPostOverlay: React.FC<Props> = ({ post }) => {
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
      <View style={[styles.infoOverlay, isMobile && styles.infoOverlayMobile]}>
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
        {record.text && (
          <>
            <Text 
              style={[styles.descriptionText, isMobile && styles.descriptionTextMobile]} 
              numberOfLines={isDescriptionExpanded ? undefined : (isMobile ? 3 : 2)}
              onTextLayout={e => { if (needsTruncation) setIsTextTruncated(e.nativeEvent.lines.length >= (isMobile ? 3 : 2)); }}
            >
              <RichTextRenderer record={record} />
            </Text>
            {(isTextTruncated || (needsTruncation && !isDescriptionExpanded)) && (
              <Pressable onPress={toggleDescription}>
                  <Text style={styles.readMoreText}>{isDescriptionExpanded ? "Read less" : "Read more"}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      <VideoActions post={post} />
    </>
  );
};

const styles = StyleSheet.create({
  infoOverlay: { 
    position: 'absolute', 
    bottom: 80, // Aumentar o bottom para dar espaço aos controles do vídeo
    left: 0, 
    right: 80, 
    padding: theme.spacing.l, 
    zIndex: 3, 
    gap: theme.spacing.s,
    maxHeight: '40%', // Limitar altura máxima para evitar sobreposição
  },
  infoOverlayMobile: {
    bottom: 120, // Aumentar o bottom para dar espaço aos controles do vídeo em dispositivos móveis
    left: 0, 
    right: 0, 
    padding: theme.spacing.m,
    maxHeight: '35%', // Reduzir altura máxima em dispositivos móveis
    overflow: 'hidden', // Garantir que o conteúdo não transborde
  },
  authorContainer: { position: 'relative', width: 48, height: 48, marginBottom: theme.spacing.xs },
  avatar: { width: 48, height: 48, borderRadius: theme.shape.full, borderWidth: 2, borderColor: 'white', backgroundColor: theme.colors.surfaceContainerHigh },
  badgeContainer: { position: 'absolute', bottom: -2, right: -2, backgroundColor: theme.colors.primary, borderRadius: theme.shape.full, padding: 2 },
  followButton: { position: 'absolute', bottom: -8, left: '50%', transform: [{ translateX: -12 }], width: 24, height: 24, borderRadius: theme.shape.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  followButtonActive: { backgroundColor: theme.colors.primary },
  authorText: { ...theme.typography.titleSmall, color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  descriptionText: { 
    ...theme.typography.bodyMedium, 
    color: 'white', 
    textShadowColor: 'rgba(0, 0, 0, 0.75)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 2,
    lineHeight: 20, // Adicionar line-height para melhor legibilidade
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Adicionar fundo semi-transparente
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.shape.small,
  },
  descriptionTextMobile: {
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fundo mais escuro em dispositivos móveis
  },
  readMoreText: { ...theme.typography.bodyMedium, fontWeight: 'bold', color: 'white', marginTop: theme.spacing.xs },
});

export default React.memo(VideoPostOverlay);