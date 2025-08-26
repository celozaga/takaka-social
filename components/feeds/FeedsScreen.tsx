
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs } from '@atproto/api';
import { Pin, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import PopularFeeds from './PopularFeeds';
import { useUI } from '../../context/UIContext';
import ScreenHeader from '../layout/ScreenHeader';
import FeedAvatar from './FeedAvatar';
import Head from 'expo-router/head';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/components/shared';

const EditableFeedItem: React.FC<{
    feed:AppBskyFeedDefs.GeneratorView;
    isPinned: boolean;
    isFirst: boolean;
    isLast: boolean;
    disabled: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onTogglePin: () => void;
    onRemove: () => void;
}> = ({ feed, isPinned, isFirst, isLast, disabled, onMoveUp, onMoveDown, onTogglePin, onRemove }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    
    const styles = createStyles(theme);
    const feedLink = `/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`;

    return (
        <View style={[styles.itemContainer, disabled && styles.itemDisabled]}>
            <FeedAvatar src={feed.avatar} alt={feed.displayName} style={styles.avatar} />
            <View style={styles.itemMain}>
                <Link href={feedLink as any} asChild>
                    <Pressable>
                        <Text style={styles.itemTitle} numberOfLines={1}>{feed.displayName}</Text>
                    </Pressable>
                </Link>
                <Text style={styles.itemByline}>{t('feeds.byline', { handle: feed.creator.handle })}</Text>
            </View>
            <View style={styles.itemActions}>
                {isPinned ? (
                    <>
                        <Pressable onPress={onMoveUp} disabled={isFirst || disabled} style={styles.actionButton}>
                            <ArrowUp size={18} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                        <Pressable onPress={onMoveDown} disabled={isLast || disabled} style={styles.actionButton}>
                            <ArrowDown size={18} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                        <Pressable onPress={onTogglePin} disabled={disabled} style={styles.actionButton}>
                            <Pin size={18} color={theme.colors.primary} fill={theme.colors.primary} />
                        </Pressable>
                    </>
                ) : (
                    <>
                         <Pressable onPress={onRemove} disabled={disabled} style={[styles.actionButton, styles.actionButtonDestructive]}>
                            <Trash2 size={18} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                        <Pressable onPress={onTogglePin} disabled={disabled} style={styles.actionButton}>
                            <Pin size={18} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                    </>
                )}
            </View>
        </View>
    );
};

const FeedsScreen: React.FC = () => {
    const { session } = useAtp();
    const { t } = useTranslation();
    const { setCustomFeedHeaderVisible } = useUI();
    const { theme } = useTheme();
    
    const styles = createStyles(theme);
    const { 
        isLoading: isLoadingSavedFeeds, 
        feedViews, 
        preferences,
        reorder,
        togglePin,
        removeFeed
    } = useSavedFeeds();

    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleAction = async (action: () => Promise<void>) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await action();
        } finally {
            setIsUpdating(false);
        }
    };

    const pinnedItems = preferences?.items.filter(item => item.pinned) || [];
    const savedItems = preferences?.items.filter(item => !item.pinned) || [];
    
    if (!session) {
        return (
            <>
                <Head><title>{t('feeds.title')}</title></Head>
                <ScreenHeader title={t('feeds.title')} />
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={styles.discoverHeader}>
                        <Text style={styles.sectionTitle}>{t('feeds.discover')}</Text>
                        <Link href="/search?filter=feeds" asChild>
                            <Pressable style={styles.searchButton}>
                                <Search size={20} color={theme.colors.onSurfaceVariant} />
                            </Pressable>
                        </Link>
                    </View>
                    <PopularFeeds showHeader={false} />
                </ScrollView>
            </>
        );
    }
    
    if (isLoadingSavedFeeds) {
        return (
             <>
                <Head><title>{t('feeds.title')}</title></Head>
                <ScreenHeader title={t('feeds.title')} />
                <View style={styles.contentContainer}>
                    {[...Array(5)].map((_, i) => <View key={i} style={styles.skeletonItem} />)}
                </View>
            </>
        );
    }

    return (
        <>
            <Head><title>{t('feeds.title')}</title></Head>
            <ScreenHeader title={t('feeds.title')} />
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.description}>{t('feeds.manageDescription')}</Text>
                <View style={{ gap: theme.spacing.xl }}>
                    <View>
                        <Text style={styles.sectionTitle}>{t('feeds.pinned')}</Text>
                        {pinnedItems.length > 0 ? (
                            <View style={{ gap: theme.spacing.sm }}>
                                {pinnedItems.map((item, index) => {
                                    const feed = feedViews.get(item.value);
                                    if (!feed) return null;
                                    const currentIndex = pinnedItems.findIndex(i => i.value === item.value);
                                    return <EditableFeedItem
                                        key={item.id}
                                        feed={feed}
                                        isPinned
                                        isFirst={index === 0}
                                        isLast={index === pinnedItems.length - 1}
                                        disabled={isUpdating}
                                        onMoveUp={() => handleAction(() => reorder(currentIndex, currentIndex - 1))}
                                        onMoveDown={() => handleAction(() => reorder(currentIndex, currentIndex + 1))}
                                        onTogglePin={() => handleAction(() => togglePin(item.value))}
                                        onRemove={() => handleAction(() => removeFeed(item.value))}
                                    />
                                })}
                            </View>
                        ) : <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('feeds.emptyPinned')}</Text></View>}
                    </View>
                    
                     <View>
                        <Text style={styles.sectionTitle}>{t('feeds.saved')}</Text>
                        {savedItems.length > 0 ? (
                            <View style={{ gap: theme.spacing.sm }}>
                                {savedItems.map((item) => {
                                    const feed = feedViews.get(item.value);
                                    if (!feed) return null;
                                    return <EditableFeedItem
                                        key={item.id}
                                        feed={feed}
                                        isPinned={false} isFirst={false} isLast={false} onMoveUp={()=>{}} onMoveDown={()=>{}}
                                        disabled={isUpdating}
                                        onTogglePin={() => handleAction(() => togglePin(item.value))}
                                        onRemove={() => handleAction(() => removeFeed(item.value))}
                                    />
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{t('feeds.emptySaved')}</Text>
                                <Link href="/search?filter=feeds" asChild>
                                    <Pressable><Text style={styles.emptyLink}>{t('feeds.findNew')}</Text></Pressable>
                                </Link>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    contentContainer: { padding: theme.spacing.lg },
    description: { color: theme.colors.onSurfaceVariant, fontSize: theme.typography.bodyMedium.fontSize, marginBottom: theme.spacing.xl },
    sectionTitle: { fontSize: theme.typography.titleMedium.fontSize, marginBottom: theme.spacing.md, color: theme.colors.onSurfaceVariant },
    itemContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.lg },
    itemDisabled: { opacity: 0.5 },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.lg,
        flexShrink: 0,
    },
    itemMain: { flex: 1, minWidth: 0 },
    itemTitle: { fontSize: theme.typography.titleSmall.fontSize, color: theme.colors.onSurface },
    itemByline: { fontSize: theme.typography.bodyMedium.fontSize, color: theme.colors.onSurfaceVariant },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    actionButton: { padding: theme.spacing.sm, borderRadius: theme.radius.full },
    actionButtonDestructive: {},
    emptyContainer: { alignItems: 'center', paddingVertical: theme.spacing.lg, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.md },
    emptyText: { color: theme.colors.onSurfaceVariant, fontSize: theme.typography.bodyMedium.fontSize },
    emptyLink: { fontSize: theme.typography.labelLarge.fontSize, fontWeight: '600', color: theme.colors.primary, textDecorationLine: 'underline', marginTop: theme.spacing.xs },
    discoverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
    searchButton: { padding: theme.spacing.sm, marginRight: -theme.spacing.sm },
    skeletonItem: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.lg, height: 84, opacity: 0.5 },
});

export default FeedsScreen;