
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { useFeedActions } from '../../hooks/useFeedActions';
import { Heart, Pin, Share2, AlertCircle, X } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

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
            <Icon size={20} color={isDestructive ? '#F2B8B5' : (isActive ? '#001D35' : '#E2E2E6')} fill={isActive && !isDestructive ? '#001D35' : 'none'}/>
            <Text style={[styles.actionButtonText, isDestructive ? styles.actionButtonTextDestructive : (isActive ? styles.actionButtonTextActive : styles.actionButtonTextDefault)]}>{text}</Text>
        </Pressable>
    );

    const renderContent = () => {
        if (isLoading) {
            return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#A8C7FA" /></View>;
        }

        if (error || !feedView) {
            return <Text style={styles.errorText}>{error || t('feedModal.loadingError')}</Text>;
        }

        return (
            <>
                <View style={styles.header}>
                    <Pressable onPress={closeFeedModal} style={styles.headerButton} accessibilityLabel={t('common.close')}>
                        <X size={20} color="#C3C6CF" />
                    </Pressable>
                     <Pressable onPress={handleShare} style={styles.headerButton} accessibilityLabel={t('common.share')}>
                        <Share2 size={20} color="#C3C6CF" />
                    </Pressable>
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
                    />
                     <ActionButton
                        icon={Pin}
                        text={isPinned ? t('feedModal.unpin') : t('feedModal.pin')}
                        onPress={handlePinToggle}
                    />
                </View>
                 <View style={{ padding: 16, paddingTop: 0 }}>
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
        backgroundColor: '#1E2021',
        borderRadius: 12,
    },
    loadingContainer: {
        height: 256,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        textAlign: 'center',
        color: '#F2B8B5',
        padding: 16,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        padding: 12,
        zIndex: 10,
    },
    headerButton: {
        padding: 4,
    },
    content: {
        padding: 16,
        paddingTop: 48,
        alignItems: 'center',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E2E2E6',
        textAlign: 'center',
    },
    byline: {
        fontSize: 14,
        color: '#C3C6CF',
        textAlign: 'center',
    },
    likes: {
        fontSize: 14,
        color: '#C3C6CF',
        marginTop: 8,
        textAlign: 'center',
    },
    description: {
        marginTop: 12,
        color: '#E2E2E6',
        fontSize: 16,
        textAlign: 'center',
    },
    actionsGrid: {
        padding: 16,
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
    },
    actionButtonDefault: { backgroundColor: '#2b2d2e' },
    actionButtonActive: { backgroundColor: '#D1E4FF' },
    actionButtonDestructive: { backgroundColor: '#2b2d2e' },
    actionButtonText: { fontWeight: '600' },
    actionButtonTextDefault: { color: '#E2E2E6' },
    actionButtonTextActive: { color: '#001D35' },
    actionButtonTextDestructive: { color: '#F2B8B5' },
});

export default FeedHeaderModal;
