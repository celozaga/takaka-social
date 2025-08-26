
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../ui/use-toast';
import { usePostActions } from '../../hooks/usePostActions';
import { AppBskyFeedDefs, AtUri } from '@atproto/api';
import { Repeat, Share2, X } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Share, Platform, Clipboard } from 'react-native';
import { theme } from '@/lib/theme';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface RepostModalProps {
  post: AppBskyFeedDefs.PostView;
  onClose: () => void;
}

const ActionListItem: React.FC<{
    icon: React.ElementType;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    isDestructive?: boolean;
}> = ({ icon: Icon, label, onPress, disabled = false, isDestructive = false }) => {
    return (
        <Pressable 
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed, isDestructive && pressed && styles.actionItemDestructivePressed, disabled && styles.actionItemDisabled]}
        >
            <Icon color={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant} size={24} />
            <Text style={[styles.actionLabel, isDestructive && styles.actionLabelDestructive]}>{label}</Text>
        </Pressable>
    );
};

const RepostModal: React.FC<RepostModalProps> = ({ post, onClose }) => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { requireAuth } = useAuthGuard();
    const { repostUri, isReposting, handleRepost } = usePostActions(post);

    // Verificar autenticação ao montar o componente
    React.useEffect(() => {
        if (!requireAuth('repost')) {
            onClose();
        }
    }, [requireAuth, onClose]);

    const handleRepostAction = async () => {
        const wasReposted = !!repostUri;
        try {
            await handleRepost();
            toast({ title: wasReposted ? t('repostModal.undoSuccess') : t('repostModal.repostSuccess') });
        } catch (error) {
            console.error('Erro ao repostar:', error);
        } finally {
            onClose();
        }
    };

    const handleShare = async () => {
        const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${new AtUri(post.uri).rkey}`;
        const shareText = `${post.author.displayName || post.author.handle}: ${post.record?.text || 'Check out this post!'}`;
        
        try {
            if (Platform.OS === 'web') {
                // Web: usar Web Share API se disponível
                if (navigator.share) {
                    await navigator.share({
                        title: 'Takaka Post',
                        text: shareText,
                        url: postUrl,
                    });
                } else {
                    // Fallback: copiar para clipboard
                    await Clipboard.setString(`${shareText}\n\n${postUrl}`);
                    toast({ title: t('post.linkCopied') });
                }
            } else {
                // Mobile: usar menu de compartilhamento nativo
                await Share.share({
                    message: shareText + '\n\n' + postUrl,
                    url: postUrl,
                });
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            if (Platform.OS === 'web') {
                // Fallback final para web
                await Clipboard.setString(postUrl);
                toast({ title: t('post.linkCopied') });
            }
        }
        onClose();
    };

    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Repost & Share</Text>
                <Pressable onPress={onClose} style={styles.closeButton}><X color={theme.colors.onSurface} /></Pressable>
            </View>
            
            <View style={styles.content}>
                {isReposting && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={theme.colors.onSurface} /></View>}
                <ActionListItem 
                    icon={Repeat} 
                    label={repostUri ? t('repostModal.undoRepost') : t('repostModal.repost')} 
                    onPress={handleRepostAction}
                    disabled={isReposting}
                    isDestructive={!!repostUri}
                />
                <ActionListItem 
                    icon={Share2} 
                    label={t('repostModal.share')} 
                    onPress={handleShare} 
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.l },
    headerTitle: { ...theme.typography.titleMedium, color: theme.colors.onSurface },
    closeButton: { padding: theme.spacing.s, margin: -theme.spacing.s },
    content: { padding: theme.spacing.s, gap: theme.spacing.xs },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 32, 33, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: theme.shape.large },
    actionItem: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l, padding: theme.spacing.m, borderRadius: theme.shape.medium },
    actionItemPressed: { backgroundColor: theme.colors.surfaceContainerHigh },
    actionItemDestructivePressed: { backgroundColor: theme.colors.errorContainer },
    actionItemDisabled: { opacity: 0.5 },
    actionLabel: { ...theme.typography.bodyLarge, fontWeight: '600', color: theme.colors.onSurface },
    actionLabelDestructive: { color: theme.colors.error },
});

export default RepostModal;
