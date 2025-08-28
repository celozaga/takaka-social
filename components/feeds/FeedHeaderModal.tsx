


import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { useFeedActions } from '../../hooks/useFeedActions';
import { Heart, Pin, Share2, AlertCircle, X } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/components/shared';
import { formatCompactNumber } from '@/lib/formatters';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { PrimaryButton, SecondaryButton, LoadingState, Tooltip } from '@/components/shared';

const FeedHeaderModal: React.FC = () => {
    const { feedModalUri, closeFeedModal } = useUI();
    const { t } = useTranslation();
    const { requireAuth } = useAuthGuard();
    const { theme } = useTheme();
    
    const styles = createStyles(theme);
    const {
        feedView,
        isLoading,
        error,
        likeUri,
        handleLike,
        isPinned,
        handlePinToggle,
        handleShare
    } = useFeedActions(feedModalUri);

    // Verificar autenticação ao montar o componente
    React.useEffect(() => {
        if (!requireAuth('feed_customization')) {
            closeFeedModal();
        }
    }, [requireAuth, closeFeedModal]);
    
    const ActionButton: React.FC<{ icon: React.FC<any>, text: string, onPress: () => void, isDestructive?: boolean, isActive?: boolean, tooltipKey?: string }> =
    ({ icon: Icon, text, onPress, isDestructive = false, isActive = false, tooltipKey }) => {
        const button = (
            <Pressable
                onPress={onPress}
                style={[
                    styles.actionButton,
                    isDestructive ? styles.actionButtonDestructive : (isActive ? styles.actionButtonActive : styles.actionButtonDefault)
                ]}
            >
                <Icon size={20} color={isDestructive ? theme.colors.error : (isActive ? theme.colors.onPrimary : theme.colors.onSurface)} fill={isActive && !isDestructive ? theme.colors.onPrimary : 'none'}/>
                <Text style={[styles.actionButtonText, isDestructive ? styles.actionButtonTextDestructive : (isActive ? styles.actionButtonTextActive : styles.actionButtonTextDefault)]}>{text}</Text>
            </Pressable>
        );
        
        if (tooltipKey) {
            return (
                <Tooltip contentKey={tooltipKey as any} position="top">
                    {button}
                </Tooltip>
            );
        }
        
        return button;
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState message="Carregando feed..." />;
        }

        if (error || !feedView) {
            return <Text style={styles.errorText}>{error || t('feedModal.loadingError')}</Text>;
        }

        return (
            <>
                <View style={styles.header}>
                    <Tooltip contentKey="common.close" position="bottom">
                        <Pressable onPress={closeFeedModal} style={styles.headerButton} accessibilityLabel={t('common.close')}>
                            <X size={20} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                    </Tooltip>
                    <Tooltip contentKey="common.share" position="bottom">
                        <Pressable onPress={handleShare} style={styles.headerButton} accessibilityLabel={t('common.share')}>
                            <Share2 size={20} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                    </Tooltip>
                </View>
                <View style={styles.content}>
                    <FeedAvatar src={feedView.avatar} alt={feedView.displayName} style={styles.avatarImage} />
                    <Text style={styles.title}>{feedView.displayName}</Text>
                    <Text style={styles.byline}>{t('feedModal.byline', { handle: feedView.creator.handle })}</Text>
                    <Text style={styles.likes}>{t('feedModal.likes', { count: feedView.likeCount || 0 })}</Text>
                    {feedView.description && <Text style={styles.description}>{feedView.description}</Text>}
                </View>
                <View style={styles.actionsGrid}>
                    <ActionButton
                        icon={Heart}
                        text={likeUri ? t('feedModal.unlike') : t('feedModal.like')}
                        onPress={handleLike}
                        isActive={!!likeUri}
                        tooltipKey={likeUri ? "post.unlike" : "post.like"}
                    />
                     <ActionButton
                        icon={Pin}
                        text={isPinned ? t('feedModal.unpin') : t('feedModal.pin')}
                        onPress={handlePinToggle}
                        tooltipKey={isPinned ? "feeds.unpin" : "feeds.pin"}
                    />
                </View>
                 <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
                    <ActionButton
                        icon={AlertCircle}
                        text={t('feedModal.report')}
                        onPress={() => alert(t('feedModal.reportNotImplemented'))}
                        isDestructive
                        tooltipKey="post.report"
                    />
                </View>
            </>
        )
    }

    return (
        <View style={styles.container}>
            {renderContent()}
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.lg,
    },
    loadingContainer: {
        height: 256,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        textAlign: 'center',
        color: theme.colors.error,
        padding: theme.spacing.lg,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        zIndex: 10,
    },
    headerButton: {
        padding: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.lg,
        paddingTop: 48,
        alignItems: 'center',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: theme.radius.lg,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.titleLarge.fontSize,
        color: theme.colors.onSurface,
        textAlign: 'center',
    },
    byline: {
        fontSize: theme.typography.bodyMedium.fontSize,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
    },
    likes: {
        fontSize: theme.typography.bodyMedium.fontSize,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    description: {
        marginTop: theme.spacing.md,
        color: theme.colors.onSurface,
        fontSize: theme.typography.bodyLarge.fontSize,
        textAlign: 'center',
    },
    actionsGrid: {
        padding: theme.spacing.lg,
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
    },
    actionButtonDefault: { backgroundColor: theme.colors.surfaceContainerHigh },
    actionButtonActive: { backgroundColor: theme.colors.primary },
    actionButtonDestructive: { backgroundColor: theme.colors.surfaceContainerHigh },
    actionButtonText: { fontSize: theme.typography.labelLarge.fontSize, fontWeight: '600' },
    actionButtonTextDefault: { color: theme.colors.onSurface },
    actionButtonTextActive: { color: theme.colors.onPrimary },
    actionButtonTextDestructive: { color: theme.colors.error },
});

export default FeedHeaderModal;