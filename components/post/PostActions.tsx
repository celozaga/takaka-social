import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import { formatCompactNumber } from '@/lib/formatters';

interface PostActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const PostActions: React.FC<PostActionsProps> = ({ post }) => {
  const { session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const {
    likeUri, likeCount, isLiking, handleLike,
    repostUri, repostCount, isReposting, handleRepost
  } = usePostActions(post);
  
  const ensureSession = () => {
    if (!session) {
      openLoginModal();
      return false;
    }
    return true;
  }

  const handleReplyClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!ensureSession()) return;
    openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleReplyClick} style={styles.actionButton}>
        <Ionicons name="chatbubble-outline" size={18} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.actionText}>{formatCompactNumber(post.replyCount || 0)}</Text>
      </Pressable>
      <Pressable 
        onPress={(e) => { e.stopPropagation(); e.preventDefault(); handleRepost(e); }}
        disabled={isReposting}
        style={styles.actionButton}
      >
        <Ionicons name="repeat-outline" size={18} color={repostUri ? theme.colors.primary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.actionText, repostUri && styles.repostTextActive]}>{formatCompactNumber(repostCount)}</Text>
      </Pressable>
      <Pressable 
        onPress={(e) => { e.stopPropagation(); e.preventDefault(); handleLike(e); }}
        disabled={isLiking}
        style={styles.actionButton}
      >
        <Ionicons name={likeUri ? "heart" : "heart-outline"} size={18} color={likeUri ? theme.colors.pink : theme.colors.onSurfaceVariant} />
        <Text style={[styles.actionText, likeUri && styles.likeTextActive]}>{formatCompactNumber(likeCount)}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    actionText: {
        ...theme.typography.labelLarge,
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
