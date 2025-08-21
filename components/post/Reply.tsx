import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import { BadgeCheck, Loader2, Heart } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import theme from '@/lib/theme';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
  isRoot?: boolean;
}

const REPLIES_PER_PAGE = 10;

const formatCount = (count: number): string => {
    if (count > 999) return `${(count/1000).toFixed(1)}k`.replace('.0', '');
    return count.toString();
}

const Reply: React.FC<ReplyProps> = ({ reply, isRoot = false }) => {
  const { t } = useTranslation();
  const moderation = useModeration();
  const [isContentVisible, setIsContentVisible] = useState(false);
  
  const { post, replies } = reply;
  const modDecision = moderation.isReady ? moderatePost(post, moderation) : null;
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

  const { session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
  
  const allSubReplies = (replies || []).filter(r => {
      if (!AppBskyFeedDefs.isThreadViewPost(r)) return false;
      if (!moderation.isReady) return true; // Show all while loading
      const decision = moderatePost(r.post, moderation);
      return decision.visibility !== 'hide';
    }) as AppBskyFeedDefs.ThreadViewPost[];
  const hasSubReplies = allSubReplies.length > 0;

  const [isExpanded, setIsExpanded] = useState(isRoot);
  const [visibleReplies, setVisibleReplies] = useState<AppBskyFeedDefs.ThreadViewPost[]>([]);
  const [replyCursor, setReplyCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
        const nextReplies = allSubReplies.slice(replyCursor, replyCursor + REPLIES_PER_PAGE);
        setVisibleReplies(prev => [...prev, ...nextReplies]);
        const newCursor = replyCursor + REPLIES_PER_PAGE;
        setReplyCursor(newCursor);
        setHasMore(allSubReplies.length > newCursor);
        setIsLoadingMore(false);
    }, 500);
  }, [replyCursor, allSubReplies, isLoadingMore]);

  useEffect(() => {
    if (isExpanded && hasSubReplies && visibleReplies.length === 0) {
      const initialReplies = allSubReplies.slice(0, REPLIES_PER_PAGE);
      setVisibleReplies(initialReplies);
      setReplyCursor(REPLIES_PER_PAGE);
      setHasMore(allSubReplies.length > REPLIES_PER_PAGE);
    }
  }, [isExpanded, hasSubReplies, allSubReplies, visibleReplies.length]);
  
  const ReplyList = () => (
    <View style={styles.nestedRepliesContainer}>
      {visibleReplies.map((nestedReply) => (
        <Reply key={nestedReply.post.cid} reply={nestedReply} />
      ))}
      {hasMore && (
        <View style={styles.loadMoreContainer}>
            <Pressable onPress={loadMore} disabled={isLoadingMore} style={styles.loadMoreButton}>
                {isLoadingMore ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={styles.loadMoreText}>{t('post.viewReplies_other', { count: allSubReplies.length - visibleReplies.length })}</Text>}
            </Pressable>
        </View>
      )}
    </View>
  );

  if (isRoot) {
    return (
      <View>
        <ReplyList />
      </View>
    )
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
             <ContentWarning reason={modDecision.reason!} onShow={() => setIsContentVisible(true)} />
        ) : (
            <>
                <Text style={styles.postText}>
                    <RichTextRenderer record={record} />
                </Text>

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

                {hasSubReplies && !isExpanded && (
                    <Pressable onPress={() => setIsExpanded(true)} style={styles.toggleButton}>
                        <View style={styles.threadLineToggle} />
                        <Text style={styles.toggleText}>{t(allSubReplies.length === 1 ? 'post.viewReplies_one' : 'post.viewReplies_other', { count: allSubReplies.length })}</Text>
                    </Pressable>
              )}
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
                {hasSubReplies && isExpanded && <View style={styles.threadLine} />}
            </View>
            {content}
        </View>
        {isExpanded && hasSubReplies && <ReplyList />}
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
    toggleButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginTop: theme.spacing.m },
    threadLineToggle: { height: 2, width: 32, backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 1 },
    toggleText: { ...theme.typography.labelLarge, color: theme.colors.primary },
    nestedRepliesContainer: { paddingLeft: 20 + theme.spacing.m, borderLeftWidth: 2, borderLeftColor: theme.colors.surfaceContainerHigh, marginLeft: 20 },
    loadMoreContainer: { alignItems: 'center', marginVertical: theme.spacing.l },
    loadMoreButton: { paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.s, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.full },
    loadMoreText: { ...theme.typography.labelLarge, color: theme.colors.primary },
});


export default React.memo(Reply);