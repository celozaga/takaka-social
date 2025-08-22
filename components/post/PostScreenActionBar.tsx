import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { MessageSquare, Heart, Repeat } from 'lucide-react';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { theme } from '@/lib/theme';

interface PostScreenActionBarProps {
    post: AppBskyFeedDefs.PostView;
}

const formatCount = (count: number): string => {
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
};

const PostScreenActionBar: React.FC<PostScreenActionBarProps> = ({ post }) => {
    const { session } = useAtp();
    const { openComposer, openRepostModal } = useUI();
    const {
        likeUri, likeCount, isLiking, handleLike,
        repostUri, repostCount, isReposting
    } = usePostActions(post);

    if (!session) return null;

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => openComposer({ replyTo: { uri: post.uri, cid: post.cid } })}
                style={styles.replyButton}
            >
                <Text style={styles.replyButtonText}>Reply...</Text>
            </Pressable>
            <View style={styles.actionsContainer}>
                <Pressable
                    onPress={(e) => handleLike(e as any)}
                    disabled={isLiking}
                    style={styles.actionItem}
                >
                    <Heart size={22} color={likeUri ? theme.colors.pink : theme.colors.onSurfaceVariant} fill={likeUri ? 'currentColor' : 'none'} />
                    <Text style={[styles.actionText, likeUri && styles.likeTextActive]}>{formatCount(likeCount)}</Text>
                </Pressable>
                 <Pressable
                    onPress={() => openRepostModal(post)}
                    disabled={isReposting}
                    style={styles.actionItem}
                >
                    <Repeat size={22} color={repostUri ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    <Text style={[styles.actionText, repostUri && styles.repostTextActive]}>{formatCount(repostCount)}</Text>
                </Pressable>
                 <View style={styles.actionItem}>
                    <MessageSquare size={22} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.actionText}>{formatCount(post.replyCount || 0)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...Platform.select({
            web: {
                paddingVertical: theme.spacing.m,
                marginVertical: theme.spacing.l,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing.l,
            },
            default: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                backgroundColor: theme.colors.surfaceContainer,
                paddingHorizontal: theme.spacing.l,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing.l,
                zIndex: 30,
            }
        }),
    },
    replyButton: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainerHigh,
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.shape.full,
    },
    replyButtonText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
    },
    likeTextActive: {
        color: theme.colors.pink,
    },
    repostTextActive: {
        color: theme.colors.primary,
    }
});

export default PostScreenActionBar;
