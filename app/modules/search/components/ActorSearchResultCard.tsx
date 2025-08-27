import React, { useState } from 'react';
import { Link } from 'expo-router';
import { AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '@/components/shared';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { OptimizedImage } from '../ui';
import { theme } from '@/lib/theme';

interface ActorSearchResultCardProps {
  actor: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed;
}

const ActorSearchResultCard: React.FC<ActorSearchResultCardProps> = ({ actor }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const [viewerState, setViewerState] = useState(actor.viewer);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const profileLink = `/profile/${actor.handle}`;

  const handleFollow = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (isActionLoading || !session) return;
    setIsActionLoading(true);
    const oldViewerState = viewerState;
    setViewerState(prev => ({ ...prev, following: 'temp-uri' }));
    try {
      const { uri } = await agent.follow(actor.did);
      setViewerState(prev => ({ ...prev, following: uri }));
    } catch (err) {
      console.error("Failed to follow:", err);
      toast({ title: "Error", description: "Could not follow user.", variant: "destructive" });
      setViewerState(oldViewerState);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnfollow = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!viewerState?.following || isActionLoading) return;
    setIsActionLoading(true);
    const oldViewerState = viewerState;
    setViewerState(prev => ({ ...prev, following: undefined }));
    try {
      await agent.deleteFollow(viewerState.following);
    } catch (err) {
      console.error("Failed to unfollow:", err);
      toast({ title: "Error", description: "Could not unfollow user.", variant: "destructive" });
      setViewerState(oldViewerState);
    } finally {
      setIsActionLoading(false);
    }
  };

  const FollowButton = () => {
    if (!session || (session.did === actor.did)) return null;

    return (
      <Pressable
        onPress={viewerState?.following ? handleUnfollow : handleFollow}
        disabled={isActionLoading}
        style={[styles.followButton, viewerState?.following ? styles.followingButton : styles.followButtonActive, isActionLoading && styles.disabledButton]}
      >
        {isActionLoading ? (
          <ActivityIndicator size="small" color={viewerState?.following ? theme.colors.onSurface : theme.colors.onPrimary} />
        ) : (
          <Text style={[styles.followButtonText, viewerState?.following ? styles.followingButtonText : styles.followButtonTextActive]}>
            {viewerState?.following ? 'Following' : 'Follow'}
          </Text>
        )}
      </Pressable>
    );
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <OptimizedImage source={{ uri: actor.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                  <Text style={styles.displayName} numberOfLines={1}>{actor.displayName || `@${actor.handle}`}</Text>
                  {actor.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                    <BadgeCheck size={16} color={theme.colors.onSurface} fill="currentColor" style={{ flexShrink: 0 }} />
                  )}
              </View>
              <Text style={styles.handle} numberOfLines={1}>@{actor.handle}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <FollowButton />
            </View>
          </View>
          {actor.description && (
            <Text style={styles.description} numberOfLines={2}>
              {actor.description}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Link href={profileLink as any} asChild>
      <Pressable>{content}</Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surfaceContainerHigh,
        flexShrink: 0,
    },
    mainContent: {
        flex: 1,
        minWidth: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    displayName: {
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        flexShrink: 1,
    },
    handle: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },
    buttonContainer: {
        marginLeft: 8,
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: theme.shape.medium,
        flexShrink: 0,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 32,
    },
    followingButton: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    followButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    followingButtonText: {
        color: theme.colors.onSurface,
    },
    followButtonTextActive: {
        color: theme.colors.onPrimary,
    },
    disabledButton: {
        opacity: 0.5,
    },
    description: {
        marginTop: 8,
        fontSize: 14,
        color: theme.colors.onSurface,
        lineHeight: 20,
    }
});

export default React.memo(ActorSearchResultCard);