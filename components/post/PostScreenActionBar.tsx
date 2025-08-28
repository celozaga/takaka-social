
import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { MessageSquare, Heart, Repeat } from 'lucide-react';
import { AppBskyFeedDefs } from '@atproto/api';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '@/components/shared/Theme';
import { formatCompactNumber } from '@/lib/formatters';

interface PostScreenActionBarProps {
    post: AppBskyFeedDefs.PostView;
    onReplyPress?: () => void;
}

const PostScreenActionBar: React.FC<PostScreenActionBarProps> = ({ post, onReplyPress }) => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const { session } = useAtp();
    const { openComposer, openRepostModal } = useUI();
    const {
        likeUri, likeCount, isLiking, handleLike,
        repostUri, repostCount, isReposting
    } = usePostActions(post);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const isMobile = Platform.OS !== 'web' || !isDesktop;

    if (!session) return null;

    const handleReplyPress = () => {
        if (onReplyPress) {
            onReplyPress();
        } else {
            openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
        }
    };

    return (
        <View style={isMobile ? styles.containerMobile : styles.containerWeb}>
            <Pressable
                onPress={handleReplyPress}
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
                    <Text style={[styles.actionText, likeUri && styles.likeTextActive]}>{formatCompactNumber(likeCount)}</Text>
                </Pressable>
                 <Pressable
                    onPress={() => openRepostModal(post)}
                    disabled={isReposting}
                    style={styles.actionItem}
                >
                    <Repeat size={22} color={repostUri ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    <Text style={[styles.actionText, repostUri && styles.repostTextActive]}>{formatCompactNumber(repostCount)}</Text>
                </Pressable>
                 <View style={styles.actionItem}>
                    <MessageSquare size={22} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.actionText}>{formatCompactNumber(post.replyCount || 0)}</Text>
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    containerMobile: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.l,
        borderTopWidth: 1,
        borderTopColor: theme.colors.surfaceContainerHigh,
        zIndex: 30,
    },
    containerWeb: {
        paddingVertical: theme.spacing.m,
        marginVertical: theme.spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.l,
    },
    replyButton: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainerHigh,
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.radius.full,
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
        gap: 5,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 14,
        color: theme.colors.onSurface,
    },
    likeTextActive: {
        color: theme.colors.pink,
    },
    repostTextActive: {
        color: theme.colors.primary,
    }
});

export default PostScreenActionBar;
