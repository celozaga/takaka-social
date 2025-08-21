import React, { useState } from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs, RichText, AppBskyEmbedImages, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import { BadgeCheck, Heart } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost, ModerationDecision } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import QuotedPost from './QuotedPost';
import ResizedImage from '../shared/ResizedImage';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
}

const formatCount = (count: number): string => {
    if (count > 999) return `${(count/1000).toFixed(1)}k`.replace('.0', '');
    return count.toString();
}

const Reply: React.FC<ReplyProps> = ({ reply }) => {
  const { t } = useTranslation();
  const moderation = useModeration();
  const [isContentVisible, setIsContentVisible] = useState(false);
  
  const { post, replies } = reply;
  if(!post) return null;

  const modDecision: ModerationDecision = moderation.isReady ? moderatePost(post, moderation) : { visibility: 'show' };
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

  const { session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
  
  const subReplies = (replies || []).filter(r => AppBskyFeedDefs.isThreadViewPost(r)) as AppBskyFeedDefs.ThreadViewPost[];

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), { addSuffix: true });

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
  
  const renderMediaAndQuote = () => {
    const embed = post.embed;
    if(!embed) return null;
    
    if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
      const image = embed.images[0];
      return <ResizedImage src={image.thumb} resizeWidth={200} alt={image.alt} style={styles.mediaPreview} />;
    }
    
    if (AppBskyEmbedRecord.isView(embed)) {
        return <QuotedPost embed={embed} />;
    }

    if(AppBskyEmbedRecordWithMedia.isView(embed)) {
        const mediaEmbed = embed.media;
        const recordEmbed = embed.record;
        return (
            <View>
                {AppBskyEmbedImages.isView(mediaEmbed) && mediaEmbed.images.length > 0 &&
                    <ResizedImage src={mediaEmbed.images[0].thumb} resizeWidth={200} alt={mediaEmbed.images[0].alt} style={styles.mediaPreview} />
                }
                {AppBskyEmbedRecord.isView(recordEmbed) &&
                    <QuotedPost embed={recordEmbed} />
                }
            </View>
        );
    }
    
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
                
                {renderMediaAndQuote()}

                <View style={styles.footer}>
                    <Pressable
                        onPress={(e) => handleLike(e as any)}
                        disabled={isLiking}
                        style={styles.footerButton}
                    >
                        <Heart size={16} color={likeUri ? theme.colors.pink : theme.colors.onSurfaceVariant} fill={likeUri ? 'currentColor' : 'none'} />
                        {likeCount > 0 && <Text style={[styles.footerText, !!likeUri && {color: theme.colors.pink}]}>{formatCount(likeCount)}</Text>}
                    </Pressable>
                     <Pressable onPress={handleReplyClick} style={styles.footerButton}>
                         <Text style={styles.footerText}>{t('common.reply')}</Text>
                    </Pressable>
                </View>
            </>
        )}
    </View>
  );
  
  return (
    <View>
        <View style={styles.replyContainer}>
            <View style={styles.avatarThreadContainer}>
                <Link href={`/profile/${author.handle}` as any} asChild>
                    <Pressable>
                        <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                    </Pressable>
                </Link>
                {subReplies.length > 0 && <View style={styles.threadLine} />}
            </View>
            {content}
        </View>
        {subReplies.length > 0 && 
            <View style={styles.nestedRepliesContainer}>
                {subReplies.map(nestedReply => <Reply key={nestedReply.post.cid} reply={nestedReply} />)}
            </View>
        }
    </View>
  );
};

const styles = StyleSheet.create({
    replyContainer: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.l },
    avatarThreadContainer: { alignItems: 'center', flexShrink: 0 },
    avatar: { width: 40, height: 40, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh },
    threadLine: { width: 2, flex: 1, marginVertical: theme.spacing.s, backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    authorContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, flexShrink: 1 },
    authorName: { ...theme.typography.titleSmall, color: theme.colors.onSurface },
    timeAgo: { ...theme.typography.bodySmall, color: theme.colors.onSurfaceVariant },
    postText: { ...theme.typography.bodyMedium, color: theme.colors.onSurface, marginVertical: theme.spacing.xs },
    footer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l, marginTop: theme.spacing.s },
    footerButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    footerText: { ...theme.typography.labelMedium, color: theme.colors.onSurfaceVariant },
    nestedRepliesContainer: { paddingLeft: 20 + theme.spacing.m, borderLeftWidth: 2, borderLeftColor: theme.colors.surfaceContainerHigh, marginLeft: 20 },
    mediaPreview: {
        width: '100%',
        aspectRatio: 1.5,
        borderRadius: theme.shape.medium,
        marginTop: theme.spacing.s,
    }
});

export default React.memo(Reply);