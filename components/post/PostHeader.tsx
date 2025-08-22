import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAtp } from '@/context/AtpContext';
import { useUI } from '@/context/UIContext';
import { useToast } from '@/components/ui/use-toast';
import { theme } from '@/lib/theme';

interface PostHeaderProps {
  post: AppBskyFeedDefs.PostView;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
};

const PostHeader: React.FC<PostHeaderProps> = ({ post }) => {
  const router = useRouter();
  const { agent, session } = useAtp();
  const { openMediaActionsModal } = useUI();
  const { toast } = useToast();

  const author = post.author;
  const [viewerState, setViewerState] = useState(author.viewer);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    setViewerState(author.viewer);
  }, [author]);

  const handleFollowToggle = async () => {
    if (!session) return;
    if (isFollowLoading) return;
    setIsFollowLoading(true);

    const isFollowing = !!viewerState?.following;
    const originalViewerState = viewerState;

    setViewerState(prev => ({ ...prev, following: isFollowing ? undefined : 'temp-uri' }));

    try {
      if (isFollowing && viewerState?.following) {
        await agent.deleteFollow(viewerState.following);
      } else {
        const { uri } = await agent.follow(author.did);
        setViewerState(prev => ({ ...prev, following: uri }));
      }
    } catch (e) {
      setViewerState(originalViewerState);
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const isMe = session?.did === author.did;

  const FollowButton = () => {
    if (isMe) return null;

    const isFollowing = !!viewerState?.following;

    return (
      <Pressable onPress={handleFollowToggle} disabled={isFollowLoading} style={[styles.followButton, !isFollowing && styles.followButtonActive]}>
        {isFollowLoading ? (
          <ActivityIndicator size="small" color={isFollowing ? theme.colors.onSurface : '#000'} />
        ) : (
          <Text style={[styles.followButtonText, !isFollowing && styles.followButtonTextActive]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Link href={`/profile/${author.handle}` as any} asChild>
          <Pressable style={styles.authorInfo}>
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.displayName} numberOfLines={1}>{author.displayName || author.handle}</Text>
            </View>
          </Pressable>
        </Link>
      </View>
      <View style={styles.rightSection}>
        <FollowButton />
        <Pressable onPress={() => openMediaActionsModal(post)} style={styles.iconButton}>
          <MoreHorizontal size={24} color={theme.colors.onSurface} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerHigh,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    flex: 1,
    minWidth: 0,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    flexShrink: 0,
  },
  iconButton: {
    padding: theme.spacing.s,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    flexShrink: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  displayName: {
    ...theme.typography.titleSmall,
    color: theme.colors.onSurface,
  },
  followButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  followButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  followButtonText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  followButtonTextActive: {
    color: theme.colors.onPrimary,
  },
});

export default PostHeader;