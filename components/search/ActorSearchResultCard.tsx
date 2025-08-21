import React, { useState } from 'react';
import { Link } from 'expo-router';
import { AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

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
          <ActivityIndicator size="small" color="#E2E2E6" />
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
        <Image source={{ uri: actor.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                  <Text style={styles.displayName} numberOfLines={1}>{actor.displayName || `@${actor.handle}`}</Text>
                  {actor.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                    <BadgeCheck size={16} color="#A8C7FA" fill="currentColor" style={{ flexShrink: 0 }} />
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
        padding: 16,
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
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
        backgroundColor: '#2b2d2e',
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
        color: '#E2E2E6',
        flexShrink: 1,
    },
    handle: {
        color: '#C3C6CF',
        fontSize: 14,
    },
    buttonContainer: {
        marginLeft: 8,
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        flexShrink: 0,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 32,
    },
    followingButton: {
        backgroundColor: '#2b2d2e', // surface-3
    },
    followButtonActive: {
        backgroundColor: '#A8C7FA', // primary
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    followingButtonText: {
        color: '#E2E2E6', // on-surface
    },
    followButtonTextActive: {
        color: '#003258', // on-primary
    },
    disabledButton: {
        opacity: 0.5,
    },
    description: {
        marginTop: 8,
        fontSize: 14,
        color: '#E2E2E6',
        lineHeight: 20,
    }
});

export default React.memo(ActorSearchResultCard);