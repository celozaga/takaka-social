
import React from 'react';
import { Heart, Repeat, MessageCircle } from 'lucide-react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
        <MessageCircle size={18} color="#C3C6CF" />
        <Text style={styles.actionText}>{post.replyCount || 0}</Text>
      </Pressable>
      <Pressable 
        onPress={(e) => { e.stopPropagation(); e.preventDefault(); handleRepost(e); }}
        disabled={isReposting}
        style={styles.actionButton}
      >
        <Repeat size={18} color={repostUri ? '#A8C7FA' : '#C3C6CF'} />
        <Text style={[styles.actionText, repostUri && styles.repostTextActive]}>{repostCount}</Text>
      </Pressable>
      <Pressable 
        onPress={(e) => { e.stopPropagation(); e.preventDefault(); handleLike(e); }}
        disabled={isLiking}
        style={styles.actionButton}
      >
        <Heart size={18} color={likeUri ? '#ec4899' : '#C3C6CF'} fill={likeUri ? '#ec4899' : 'none'} />
        <Text style={[styles.actionText, likeUri && styles.likeTextActive]}>{likeCount}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#C3C6CF',
    },
    repostTextActive: {
        color: '#A8C7FA',
    },
    likeTextActive: {
        color: '#ec4899',
    }
});

export default PostActions;
