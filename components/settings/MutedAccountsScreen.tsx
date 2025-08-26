

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs } from '@atproto/api';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, FlatListProps } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/lib/theme';
import { BadgeCheck } from 'lucide-react';
import SettingsDivider from '../ui/SettingsDivider';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const MutedAccountItem: React.FC<{
    actor: AppBskyActorDefs.ProfileView;
    onUnmute: (did: string) => void;
    isUnmuting: boolean;
}> = React.memo(({ actor, onUnmute, isUnmuting }) => {
    const { t } = useTranslation();
    const profileLink = `/profile/${actor.handle}`;

    const content = (
        <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
                <Image source={{ uri: actor.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.displayName} numberOfLines={1}>{actor.displayName || `@${actor.handle}`}</Text>
                        {actor.labels?.some(l => l.val === 'blue-check') && (
                            <BadgeCheck size={16} color={theme.colors.onSurface} fill="currentColor" />
                        )}
                    </View>
                    <Text style={styles.handle} numberOfLines={1}>@{actor.handle}</Text>
                </View>
            </View>
            <Pressable
                onPress={() => onUnmute(actor.did)}
                disabled={isUnmuting}
                style={[styles.unmuteButton, isUnmuting && styles.disabledButton]}
            >
                {isUnmuting ? (
                    <ActivityIndicator size="small" color={theme.colors.onSurface} />
                ) : (
                    <Text style={styles.unmuteButtonText}>{t('mutedAccounts.unmute')}</Text>
                )}
            </Pressable>
        </View>
    );

    return (
        <Link href={profileLink as any} asChild>
            <Pressable>{content}</Pressable>
        </Link>
    );
});

const MutedAccountsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { agent } = useAtp();
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<AppBskyActorDefs.ProfileView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [unmutingDid, setUnmutingDid] = useState<string | null>(null);

    const fetchMutes = useCallback(async (currentCursor?: string) => {
        try {
            const { data } = await agent.app.bsky.graph.getMutes({ cursor: currentCursor, limit: 50 });
            if (currentCursor) {
                setAccounts(prev => [...prev, ...data.mutes]);
            } else {
                setAccounts(data.mutes);
            }
            setCursor(data.cursor);
            setHasMore(!!data.cursor && data.mutes.length > 0);
        } catch (err) {
            setError(t('mutedAccounts.loadingError'));
        }
    }, [agent, t]);

    useEffect(() => {
        setIsLoading(true);
        fetchMutes().finally(() => setIsLoading(false));
    }, [fetchMutes]);

    const loadMore = useCallback(() => {
        if (isLoadingMore || !cursor || !hasMore) return;
        setIsLoadingMore(true);
        fetchMutes(cursor).finally(() => setIsLoadingMore(false));
    }, [isLoadingMore, cursor, hasMore, fetchMutes]);

    const handleUnmute = useCallback(async (did: string) => {
        setUnmutingDid(did);
        try {
            await agent.app.bsky.graph.unmuteActor({ actor: did });
            setAccounts(prev => prev.filter(account => account.did !== did));
            toast({ title: t('mutedAccounts.unmuted'), description: t('mutedAccounts.unmutedDescription') });
        } catch (error) {
            console.error('Failed to unmute account:', error);
            toast({ title: t('common.error'), description: t('mutedAccounts.unmuteError'), variant: "destructive" });
        } finally {
            setUnmutingDid(null);
        }
    }, [agent, toast, t]);

    const renderItem = useCallback(({ item }: { item: AppBskyActorDefs.ProfileView }) => (
        <MutedAccountItem
            actor={item}
            onUnmute={handleUnmute}
            isUnmuting={unmutingDid === item.did}
        />
    ), [handleUnmute, unmutingDid]);

    const renderListEmptyComponent = useCallback(() => (
        <View style={styles.centeredMessage}>
            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <Text style={styles.infoText}>{t('mutedAccounts.empty')}</Text>
            )}
        </View>
    ), [error, t]);

    const flatListProps: FlatListProps<AppBskyActorDefs.ProfileView> = {
        data: accounts,
        renderItem,
        keyExtractor: (item: AppBskyActorDefs.ProfileView) => item.did,
        contentContainerStyle: theme.settingsStyles.container,
        ListHeaderComponent: <Text style={theme.settingsStyles.description}>{t('mutedAccounts.description')}</Text>,
        ListEmptyComponent: renderListEmptyComponent,
        onEndReached: loadMore,
        onEndReachedThreshold: 0.5,
        ItemSeparatorComponent: SettingsDivider,
        ListFooterComponent: isLoadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.onSurface} /> : null,
    };

    if (isLoading) {
        return (
            <SettingsScreenLayout title={t('mutedAccounts.title')}>
                <View style={styles.centeredMessage}>
                    <ActivityIndicator size="large" color={theme.colors.onSurface} />
                </View>
            </SettingsScreenLayout>
        );
    }

    return (
        <>
            <Head><title>{t('mutedAccounts.title')}</title></Head>
            <SettingsScreenLayout title={t('mutedAccounts.title')}>
                <SettingsSection>
                    <FlatList {...flatListProps} />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.l,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        flex: 1,
        minWidth: 0,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    displayName: {
        ...theme.typography.bodyLarge,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        flexShrink: 1,
    },
    handle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
    },
    unmuteButton: {
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 36,
        minWidth: 90,
    },
    unmuteButtonText: {
        ...theme.typography.labelLarge,
        color: theme.colors.onSurface,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
    centeredMessage: {
        padding: theme.spacing.xxl,
        alignItems: 'center',
    },
    errorText: {
        color: theme.colors.error,
    },
    infoText: {
        color: theme.colors.onSurfaceVariant,
    },
});

export default MutedAccountsScreen;