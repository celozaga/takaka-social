import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { useFeedActions } from '../../hooks/useFeedActions';
import { Heart, Pin, Share2, AlertCircle, X } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';
import { formatCompactNumber } from '@/lib/formatters';

const FeedHeaderModal: React.FC = () => {
    const { feedModalUri, closeFeedModal } = useUI();
    const { t } = useTranslation();
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
    
    const ActionButton: React.FC<{ icon: React.FC<any>, text: string, onPress: () => void, isDestructive?: boolean, isActive?: boolean }> =
    ({ icon: Icon, text, onPress, isDestructive = false, isActive = false }) => (
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

    const renderContent = () => {
        if (isLoading) {
            return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
        }

        if (error || !feedView) {
            return <Text style={styles.errorText}>{error || t('feedModal.loadingError')}</Text>;
        }

        return (
            <>
                <View style={styles.header}>
                    <Pressable onPress={closeFeedModal} style={styles.headerButton} accessibilityLabel={t('common.close')}>
                        <X size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                     <Pressable onPress={handleShare} style={styles.headerButton} accessibilityLabel={t('common.share')}>
                        <Share2 size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                </View>
                <View style={styles.content}>
                    <FeedAvatar src={feedView.avatar} alt={feedView.displayName} style={styles.avatarImage} />
                    <Text style={styles.title}>{feedView.displayName}</Text>
                    <Text style={styles.byline}>{t('feedModal.byline', { handle: feedView.creator.handle })}</Text>
                    <Text style={styles.likes}>{t('feedModal.likes', { count: formatCompactNumber(feedView.likeCount || 0) })}</Text>
                    {feedView.description && <Text style={styles.description}>{feedView.description}</Text>}
                </View>
                <View style={styles.actionsGrid}>
                    <ActionButton
                        icon={Heart}
                        text={likeUri ? t('feedModal.unlike') : t('feedModal.like')}
                        onPress={handleLike}
                        isActive={!!likeUri}
                    />
                     <ActionButton
                        icon={Pin}
                        text={isPinned ? t('feedModal.unpin') : t('feedModal.pin')}
                        onPress={handlePinToggle}
                    />
                </View>
                 <View style={{ padding: theme.spacing.l, paddingTop: 0 }}>
                    <ActionButton
                        icon={AlertCircle}
                        text={t('feedModal.report')}
                        onPress={() => alert(t('feedModal.reportNotImplemented'))}
                        isDestructive
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

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
    },
    loadingContainer: {
        height: 256,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        textAlign: 'center',
        color: theme.colors.error,
        padding: theme.spacing.l,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        zIndex: 10,
    },
    headerButton: {
        padding: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.l,
        paddingTop: 48,
        alignItems: 'center',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: theme.shape.large,
        marginBottom: theme.spacing.m,
    },
    title: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface,
        textAlign: 'center',
    },
    byline: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
    },
    likes: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.s,
        textAlign: 'center',
    },
    description: {
        marginTop: theme.spacing.m,
        color: theme.colors.onSurface,
        ...theme.typography.bodyLarge,
        textAlign: 'center',
    },
    actionsGrid: {
        padding: theme.spacing.l,
        flexDirection: 'row',
        gap: theme.spacing.s,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.m,
        flex: 1,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.shape.medium,
    },
    actionButtonDefault: { backgroundColor: theme.colors.surfaceContainerHigh },
    actionButtonActive: { backgroundColor: theme.colors.primary },
    actionButtonDestructive: { backgroundColor: theme.colors.surfaceContainerHigh },
    actionButtonText: { ...theme.typography.labelLarge, fontWeight: '600' },
    actionButtonTextDefault: { color: theme.colors.onSurface },
    actionButtonTextActive: { color: theme.colors.onPrimary },
    actionButtonTextDestructive: { color: theme.colors.error },
});

export default FeedHeaderModal;
