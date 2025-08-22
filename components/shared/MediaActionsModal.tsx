import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useHiddenPosts } from '../../context/HiddenPostsContext';
import { AtUri,AppBskyFeedDefs } from '@atproto/api';
import { EyeOff, MicOff, Shield, AlertTriangle, Trash2, X, ShieldOff } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { theme } from '@/lib/theme';

interface MediaActionsModalProps {
  post: AppBskyFeedDefs.PostView;
  onClose: () => void;
}

const ActionListItem: React.FC<{
    icon: React.ElementType;
    label: string;
    onPress: () => void;
    isDestructive?: boolean;
    disabled?: boolean;
}> = ({ icon: Icon, label, onPress, isDestructive = false, disabled = false }) => {
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

const MediaActionsModal: React.FC<MediaActionsModalProps> = ({ post, onClose }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { hidePost } = useHiddenPosts();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [viewerState, setViewerState] = useState(post.author.viewer);

    if (!post) return null;

    const isMe = post.author.did === session?.did;
    
    const confirmAction = (title: string, message: string, onConfirm: () => void) => {
        if (Platform.OS === 'web') {
            if (window.confirm(message)) onConfirm();
        } else {
            Alert.alert(title, message, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', style: 'destructive', onPress: onConfirm }
            ]);
        }
    }

    const handleHide = () => { hidePost(post.uri); toast({ title: t('postActions.toast.postHidden') }); onClose(); };
    const handleMute = async (mute: boolean) => { setIsLoading('mute'); try { if (mute) await agent.mute(post.author.did); else await agent.unmute(post.author.did); setViewerState(p => ({ ...p, muted: mute })); } finally { setIsLoading(null); onClose(); } };
    const handleBlock = async (block: boolean) => confirmAction('Block User', t('profile.confirmBlock', { handle: post.author.handle }), async () => { setIsLoading('block'); try { if (block) { const { uri } = await agent.app.bsky.graph.block.create({ repo: session!.did }, { subject: post.author.did, createdAt: new Date().toISOString() }); setViewerState(p => ({ ...p, blocking: uri, following: undefined })); } else if (viewerState?.blocking) { await agent.app.bsky.graph.block.delete({ repo: session!.did, rkey: new AtUri(viewerState.blocking).rkey }); setViewerState(p => ({ ...p, blocking: undefined })); } } finally { setIsLoading(null); onClose(); } });
    const handleReport = () => { Linking.openURL(`mailto:moderation@blueskyweb.xyz`); onClose(); };
    const handleDelete = () => confirmAction('Delete Post', t('postActions.confirmDelete'), async () => { setIsLoading('delete'); try { await agent.deletePost(post.uri); toast({ title: t('postActions.toast.deleteSuccess') }); } catch (e) { toast({ title: t('postActions.toast.deleteError'), variant: 'destructive' }); } finally { setIsLoading(null); onClose(); } });
    
    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('mediaActions.title')}</Text>
                <Pressable onPress={onClose} style={styles.closeButton}><X color={theme.colors.onSurface} /></Pressable>
            </View>

            <View style={styles.content}>
                {isLoading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" /></View>}
                <ActionListItem icon={EyeOff} label={t('mediaActions.notInterested')} onPress={handleHide} />
                {!isMe && (
                    <>
                        <ActionListItem icon={MicOff} label={viewerState?.muted ? t('mediaActions.unmuteUser', { handle: post.author.handle }) : t('mediaActions.muteUser', { handle: post.author.handle })} onPress={() => handleMute(!viewerState?.muted)} />
                        <ActionListItem icon={viewerState?.blocking ? ShieldOff : Shield} label={viewerState?.blocking ? t('mediaActions.unblockUser', { handle: post.author.handle }) : t('mediaActions.blockUser', { handle: post.author.handle })} onPress={() => handleBlock(!viewerState?.blocking)} isDestructive />
                    </>
                )}
                <ActionListItem icon={AlertTriangle} label={t('postActions.report')} onPress={handleReport} isDestructive />
                {isMe && <ActionListItem icon={Trash2} label={t('postActions.delete')} onPress={handleDelete} isDestructive />}
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

export default MediaActionsModal;
