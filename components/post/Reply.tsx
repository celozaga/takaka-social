import React, { useState } from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs, RichText, AppBskyEmbedImages,AppBskyEmbedRecordWithMedia,AppBskyEmbedVideo, AppBskyActorDefs } from '@atproto/api';
import { formatCompactNumber, formatCompactDate } from '@/lib/formatters';
import RichTextRenderer from '../shared/RichTextRenderer';
import { BadgeCheck, Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost, ModerationDecision } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/lib/theme';
import VideoPlayer from '../shared/VideoPlayer';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';

const MAX_REPLY_DEPTH = 4; // Reduzido de 6 para 4 para evitar distorção
const MAX_VISUAL_DEPTH = 3; // Máximo de níveis com indentação visual

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
  depth?: number;
}

const ReplyVideo: React.FC<{embed: AppBskyEmbedVideo.View, authorDid: string}> = ({embed, authorDid}) => {
    const aspectRatio = embed.aspectRatio ? embed.aspectRatio.width / embed.aspectRatio.height : 16/9;
    return (
      <View style={[styles.mediaPreview, { aspectRatio, overflow: 'hidden' }]}>
        <VideoPlayer post={{...({} as any), embed, author: { did: authorDid } as any } as any} />
      </View>
    );
};

const Reply: React.FC<ReplyProps> = ({ reply, depth = 0 }) => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const moderation = useModeration();
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { post, replies } = reply;
  if(!post) return null;

  const modDecision: ModerationDecision = moderation.isReady ? moderatePost(post, moderation) : { visibility: 'show' };
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

  const { session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
  
  const subReplies = (replies || []).filter(r => AppBskyFeedDefs.isThreadViewPost(r)) as AppBskyFeedDefs.ThreadViewPost[];

  const timeAgo = formatCompactDate(record.createdAt);

  // Calcular indentação baseada na profundidade e largura da tela
  const getIndentation = () => {
    if (depth >= MAX_VISUAL_DEPTH) {
      return 0; // Sem indentação visual após o máximo
    }
    
    // Indentação proporcional à largura da tela
    const baseIndent = Math.min(screenWidth * 0.08, 24); // Máximo de 8% da tela ou 24px
    return baseIndent * (depth + 1);
  };

  const ensureSession = () => {
    if (!session) {
      openLoginModal();
      return false;
    }
    return true;
  };

  const handleReplyClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!ensureSession()) return;
    openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const renderMedia = () => {
    const embed = post.embed;
    if (!embed) return null;

    let mediaEmbed: AppBskyEmbedImages.View | AppBskyEmbedVideo.View | undefined;

    if (AppBskyEmbedImages.isView(embed)) {
        if(embed.images.length > 0) mediaEmbed = embed;
    } else if (AppBskyEmbedVideo.isView(embed)) {
        mediaEmbed = embed;
    } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
        const recordWithMediaView = embed;
        if (AppBskyEmbedImages.isView(recordWithMediaView.media) && recordWithMediaView.media.images.length > 0) {
            mediaEmbed = recordWithMediaView.media;
        } else if (AppBskyEmbedVideo.isView(recordWithMediaView.media)) {
            mediaEmbed = recordWithMediaView.media as AppBskyEmbedVideo.View;
        }
    }
    
    if (AppBskyEmbedImages.isView(mediaEmbed)) {
        const image = mediaEmbed.images[0]; // Show first image only in replies
        const imageAspectRatio = image.aspectRatio ? image.aspectRatio.width / image.aspectRatio.height : 1.5;
        return <Image source={image.thumb} accessibilityLabel={image.alt || 'Reply image'} style={[styles.mediaPreview, { aspectRatio: imageAspectRatio }]} contentFit="cover" placeholder={theme.colors.surfaceContainerHigh} transition={300} />;
    }

    if (AppBskyEmbedVideo.isView(mediaEmbed)) {
        const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
        return <ReplyVideo embed={mediaEmbed} authorDid={authorDid} />;
    }
    
    // Quoted posts are removed as per user request.
    return null;
  }

  if (!modDecision || modDecision.visibility === 'hide') {
      return null;
  }
  
  const content = (
    <View style={{flex: 1}}>
        <View style={styles.header}>
            <Link href={`/profile/${author.handle}` as any} onPress={e => e.stopPropagation()} asChild>
                <Pressable style={styles.authorContainer}>
                    <Text style={styles.authorName} numberOfLines={1}>{author.displayName || `@${author.handle}`}</Text>
                    {author.labels?.some(l => l.val === 'blue-check') && (
                        <BadgeCheck size={14} color={theme.colors.primary} fill={theme.colors.primary} />
                    )}
                </Pressable>
            </Link>
            <Text style={styles.timeAgo}>· {timeAgo}</Text>
        </View>

        {modDecision.visibility === 'warn' && !isContentVisible ? (
             <ContentWarning reason={modDecision.reason || 'Content Warning'} onShow={() => setIsContentVisible(true)} />
        ) : (
            <>
                <Text style={styles.postText}>
                    <RichTextRenderer record={record} />
                </Text>
                
                {renderMedia()}

                <View style={styles.footer}>
                    <Pressable
                        onPress={(e) => handleLike(e as any)}
                        disabled={isLiking}
                        style={styles.footerButton}
                    >
                        <Heart size={16} color={likeUri ? theme.colors.pink : theme.colors.onSurfaceVariant} fill={likeUri ? 'currentColor' : 'none'} />
                        {likeCount > 0 && <Text style={[styles.footerText, !!likeUri && {color: theme.colors.pink}]}>{formatCompactNumber(likeCount)}</Text>}
                    </Pressable>
                     <Pressable onPress={handleReplyClick} style={styles.footerButton}>
                         <MessageCircle size={16} color={theme.colors.onSurfaceVariant} />
                         <Text style={styles.footerText}>{t('common.reply')}</Text>
                    </Pressable>
                </View>
            </>
        )}
    </View>
  );
  
  const indentation = getIndentation();
  const showThreadLine = depth < MAX_VISUAL_DEPTH && subReplies.length > 0;
  const hasSubReplies = subReplies.length > 0;
  
  return (
    <View>
        <View style={[styles.replyContainer, { marginLeft: indentation }]}>
            <View style={styles.avatarThreadContainer}>
                <Link href={`/profile/${author.handle}` as any} asChild>
                    <Pressable>
                        <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                    </Pressable>
                </Link>
                {showThreadLine && <View style={styles.threadLine} />}
            </View>
            {content}
        </View>
        
        {/* Botão para expandir/recolher replies aninhados */}
        {hasSubReplies && (
          <View style={[styles.expandButtonContainer, { marginLeft: indentation + 48 }]}>
            <Pressable 
              onPress={handleToggleExpanded}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                Ver {subReplies.length} respostas
              </Text>
              {isExpanded ? (
                <ChevronUp size={16} color={theme.colors.onSurfaceVariant} />
              ) : (
                <ChevronDown size={16} color={theme.colors.onSurfaceVariant} />
              )}
            </Pressable>
          </View>
        )}
        
        {/* Replies aninhados expandidos */}
        {hasSubReplies && isExpanded && depth < MAX_REPLY_DEPTH && (
            <View style={styles.nestedRepliesContainer}>
                {subReplies.map(nestedReply => (
                  <Reply key={nestedReply.post.cid} reply={nestedReply} depth={depth + 1} />
                ))}
            </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
    replyContainer: { 
        flexDirection: 'row', 
        gap: theme.spacing.m, 
        marginTop: theme.spacing.l,
        flex: 1,
    },
    avatarThreadContainer: { 
        alignItems: 'center', 
        flexShrink: 0,
        position: 'relative',
    },
    avatar: { 
        width: 40, 
        height: 40, 
        borderRadius: theme.shape.full, 
        backgroundColor: theme.colors.surfaceContainerHigh 
    },
    threadLine: { 
        width: 2, 
        flex: 1, 
        marginVertical: theme.spacing.s, 
        backgroundColor: theme.colors.outline, 
        borderRadius: 1,
        opacity: 0.6,
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: theme.spacing.xs,
        flexWrap: 'wrap',
    },
    authorContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: theme.spacing.xs, 
        flexShrink: 1 
    },
    authorName: { 
        ...theme.typography.titleSmall, 
        color: theme.colors.onSurface,
        flexShrink: 1,
    },
    timeAgo: { 
        ...theme.typography.bodySmall, 
        color: theme.colors.onSurfaceVariant,
        flexShrink: 0,
    },
    postText: { 
        ...theme.typography.bodyMedium, 
        color: theme.colors.onSurface, 
        marginVertical: theme.spacing.xs,
        flexShrink: 1,
    },
    footer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: theme.spacing.l, 
        marginTop: theme.spacing.s,
        flexWrap: 'wrap',
    },
    footerButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: theme.spacing.xs,
        flexShrink: 0,
    },
    footerText: { 
        ...theme.typography.labelMedium, 
        color: theme.colors.onSurfaceVariant 
    },
    expandButtonContainer: {
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.xs,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.small,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    expandButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '500',
    },
    nestedRepliesContainer: { 
        marginTop: theme.spacing.s,
        marginLeft: theme.spacing.m,
    },
    mediaPreview: {
        width: '100%',
        borderRadius: theme.shape.medium,
        marginTop: theme.spacing.s,
        backgroundColor: theme.colors.surfaceContainerHigh,
    }
});

export default React.memo(Reply);