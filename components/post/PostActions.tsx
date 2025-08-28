import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared';
import { Tooltip } from '@/components/shared/Tooltip';
import { formatCompactNumber } from '@/lib/formatters';

interface PostActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const PostActions: React.FC<PostActionsProps> = ({ post }) => {
  const { session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const { requireAuth } = useAuthGuard();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  const {
    likeUri, likeCount, isLiking, handleLike,
    repostUri, repostCount, isReposting, handleRepost
  } = usePostActions(post);
  
  const handleReplyClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (requireAuth('compose')) {
      openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
    }
  };

  const handleRepostClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (requireAuth('repost')) {
      handleRepost(e);
    }
  };

  const handleLikeClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (requireAuth('like')) {
      handleLike(e);
    }
  };

  return (
    <View style={styles.container}>
      <Tooltip contentKey="post.reply" position="top">
        <Pressable onPress={handleReplyClick} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.actionText}>{formatCompactNumber(post.replyCount || 0)}</Text>
        </Pressable>
      </Tooltip>
      
      <Tooltip contentKey={repostUri ? "post.unrepost" : "post.repost"} position="top">
        <Pressable 
          onPress={handleRepostClick}
          disabled={isReposting}
          style={styles.actionButton}
        >
          <Ionicons name="repeat-outline" size={18} color={repostUri ? theme.colors.primary : theme.colors.onSurfaceVariant} />
          <Text style={[styles.actionText, repostUri && styles.repostTextActive]}>{formatCompactNumber(repostCount)}</Text>
        </Pressable>
      </Tooltip>
      
      <Tooltip contentKey={likeUri ? "post.unlike" : "post.like"} position="top">
        <Pressable 
          onPress={handleLikeClick}
          disabled={isLiking}
          style={styles.actionButton}
        >
          <Ionicons name={likeUri ? "heart" : "heart-outline"} size={18} color={likeUri ? theme.colors.pink : theme.colors.onSurfaceVariant} />
          <Text style={[styles.actionText, likeUri && styles.likeTextActive]}>{formatCompactNumber(likeCount)}</Text>
        </Pressable>
      </Tooltip>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    actionText: {
        fontSize: theme.typography.labelLarge.fontSize,
        fontWeight: '600',
        color: theme.colors.onSurfaceVariant,
    },
    repostTextActive: {
        color: theme.colors.primary,
    },
    likeTextActive: {
        color: theme.colors.pink,
    }
});

export default PostActions;
