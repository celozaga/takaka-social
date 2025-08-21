import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import { format } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import { BadgeCheck, Loader2, Heart } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

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

  const date = format(new Date(record.createdAt), 'M/d');

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
    <>
      {visibleReplies.map((nestedReply) => (
        <Reply key={nestedReply.post.cid} reply={nestedReply} />
      ))}
      {hasMore && (
        <View style={styles.loadMoreContainer}>
            <Pressable onPress={loadMore} disabled={isLoadingMore} style={styles.loadMoreButton}>
                {isLoadingMore ? <ActivityIndicator color="#A8C7FA" /> : <Text style={styles.loadMoreText}>{t('post.viewReplies_other', { count: allSubReplies.length - visibleReplies.length })}</Text>}
            </Pressable>
        </View>
      )}
      {hasSubReplies && !isRoot && (
        <Pressable onPress={() => setIsExpanded(false)}>
            <Text style={styles.toggleRepliesText}>Hide replies</Text>
        </Pressable>
      )}
    </>
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
  
  if (modDecision.visibility === 'warn' && !isContentVisible) {
      return (
          <View style={styles.replyContainer}>
              <View style={styles.avatarThreadContainer}>
                  <Link href={`/profile/${author.handle}` as any} asChild>
                    <Pressable>
                      <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                    </Pressable>
                  </Link>
                  {(hasSubReplies && isExpanded) && <View style={styles.threadLine} />}
              </View>
              <View style={styles.mainContentWarning}>
                  <ContentWarning reason={modDecision.reason!} onShow={() => setIsContentVisible(true)} />
              </View>
          </View>
      )
  }

  return (
    <View style={styles.replyContainer}>
      <View style={styles.avatarThreadContainer}>
        <Link href={`/profile/${author.handle}` as any} asChild>
            <Pressable>
                <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
            </Pressable>
        </Link>
        {(hasSubReplies && isExpanded) && <View style={styles.threadLine} />}
      </View>

      <View style={styles.mainContentContainer}>
        <View style={styles.mainContent}>
          <View style={{paddingTop: 4}}>
            <Link href={`/profile/${author.handle}` as any} asChild>
              <Pressable style={styles.authorContainer}>
                  <Text style={styles.authorName}>{author.displayName || `@${author.handle}`}</Text>
                  {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                      <BadgeCheck size={14} color="#A8C7FA" fill="currentColor" />
                  )}
              </Pressable>
            </Link>
          
            <Text style={styles.postText}>
                <RichTextRenderer record={record} />
            </Text>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{date}</Text>
                <Pressable onPress={handleReplyClick}>
                    <Text style={styles.replyButtonText}>{t('common.reply')}</Text>
                </Pressable>
            </View>

            {hasSubReplies && !isExpanded && (
                <Pressable onPress={() => setIsExpanded(true)}>
                    <Text style={styles.toggleRepliesText}>View {allSubReplies.length} {allSubReplies.length === 1 ? 'reply' : 'replies'}</Text>
                </Pressable>
            )}
          </View>
        </View>
        
        <View style={styles.likeContainer}>
            <Pressable 
                onPress={(e) => handleLike(e as any)}
                disabled={isLiking}
                style={{ padding: 4 }}
            >
                <Heart size={20} color={likeUri ? '#ec4899' : '#C3C6CF'} fill={likeUri ? 'currentColor' : 'none'} />
            </Pressable>
            <Text style={styles.likeCount}>{likeCount > 0 ? formatCount(likeCount) : ''}</Text>
        </View>
      </View>
      {isExpanded && hasSubReplies && (
        <View style={styles.nestedRepliesContainer}>
          <ReplyList />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    replyContainer: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 16, position: 'relative' },
    avatarThreadContainer: { alignItems: 'center', flexShrink: 0 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2b2d2e' },
    threadLine: { width: 2, flex: 1, marginVertical: 8, backgroundColor: '#2b2d2e', borderRadius: 1 },
    mainContentContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    mainContent: { flex: 1 },
    mainContentWarning: { flex: 1, paddingTop: 4 },
    authorContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    authorName: { fontWeight: 'bold', fontSize: 14 },
    postText: { color: '#E2E2E6', marginVertical: 2, fontSize: 14, lineHeight: 20 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
    footerText: { fontSize: 12, color: '#C3C6CF' },
    replyButtonText: { fontWeight: '600', fontSize: 12, color: '#C3C6CF' },
    toggleRepliesText: { fontSize: 14, fontWeight: '600', color: '#C3C6CF', marginTop: 8 },
    likeContainer: { alignItems: 'center', flexShrink: 0, paddingTop: 4 },
    likeCount: { fontSize: 12, color: '#C3C6CF', fontWeight: '600' },
    nestedRepliesContainer: { position: 'absolute', top: '100%', left: 52, right: 0, marginTop: 8, paddingTop: 8 },
    loadMoreContainer: { alignItems: 'center', marginVertical: 16 },
    loadMoreButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2b2d2e', borderRadius: 999 },
    loadMoreText: { color: '#A8C7FA', fontWeight: '600' },
});


export default React.memo(Reply);