
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../ui/use-toast';
import { usePostActions } from '../../hooks/usePostActions';
import { AppBskyFeedDefs, AtUri } from '@atproto/api';
import { Repeat, Share2, X } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Share, Platform, Clipboard } from 'react-native';

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
            <Icon color={isDestructive ? '#F2B8B5' : '#C3C6CF'} size={24} />
            <Text style={[styles.actionLabel, isDestructive && styles.actionLabelDestructive]}>{label}</Text>
        </Pressable>
    );
};

const RepostModal: React.FC<RepostModalProps> = ({ post, onClose }) => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { repostUri, isReposting, handleRepost } = usePostActions(post);

    const handleRepostAction = async () => {
        const wasReposted = !!repostUri;
        await handleRepost();
        toast({ title: wasReposted ? t('repostModal.undoSuccess') : t('repostModal.repostSuccess') });
        onClose();
    };

    const handleShare = async () => {
        const postUrl = `https://bsky.app/profile/${post.author.did}/post/${new AtUri(post.uri).rkey}`;
        try {
            await Share.share({
                message: postUrl,
                url: postUrl, // for iOS
            });
        } catch (error) {
            if (Platform.OS === 'web') {
                Clipboard.setString(postUrl);
                toast({ title: t('post.linkCopied') });
            }
        }
        onClose();
    };

    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('common.share')}</Text>
                <Pressable onPress={onClose} style={styles.closeButton}><X color="#E2E2E6" /></Pressable>
            </View>
            
            <View style={styles.content}>
                {isReposting && <View style={styles.loadingOverlay}><ActivityIndicator size="large" /></View>}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    headerTitle: { fontWeight: 'bold', fontSize: 18, color: '#E2E2E6' },
    closeButton: { padding: 8, margin: -8 },
    content: { padding: 8, gap: 4 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 32, 33, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: 12 },
    actionItem: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12, borderRadius: 8 },
    actionItemPressed: { backgroundColor: '#2b2d2e' },
    actionItemDestructivePressed: { backgroundColor: 'rgba(242, 184, 181, 0.1)' },
    actionItemDisabled: { opacity: 0.5 },
    actionLabel: { fontWeight: '600', color: '#E2E2E6' },
    actionLabelDestructive: { color: '#F2B8B5' },
});

export default RepostModal;
