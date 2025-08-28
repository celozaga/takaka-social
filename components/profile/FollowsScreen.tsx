

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyActorDefs, AppBskyGraphGetFollowers, AppBskyGraphGetFollows } from '@atproto/api';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import ScreenHeader from '../layout/ScreenHeader';
import Head from 'expo-router/head';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/components/shared';
import { SkeletonAvatar, SkeletonLine } from '@/components/shared';

interface FollowsScreenProps {
    actor: string;
    type: 'followers' | 'following';
}

// Skeleton card placeholder
const FollowsSkeletonCard: React.FC = () => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.skeletonCardContainer}>
            <View style={styles.skeletonCardContent}>
                <SkeletonAvatar size={48} />
                <View style={styles.skeletonCardMain}>
                    <View style={styles.skeletonCardHeader}>
                        <SkeletonLine width={128} height={16} />
                        <SkeletonLine width={96} height={12} />
                    </View>
                    <SkeletonLine width="83.33%" height={12} style={{ marginTop: theme.spacing.md }} />
                </View>
            </View>
        </View>
    );
};

const FollowsScreen: React.FC<FollowsScreenProps> = ({ actor, type }) => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const { setCustomFeedHeaderVisible } = useUI();
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const [list, setList] = useState<AppBskyActorDefs.ProfileView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const title = t(`common.${type}`);

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const fetchList = useCallback(async (currentCursor?: string) => {
        return type === 'followers'
            ? agent.getFollowers({ actor, cursor: currentCursor, limit: 50 })
            : agent.getFollows({ actor, cursor: currentCursor, limit: 50 });
    }, [agent, actor, type]);

    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await fetchList();
                const items = type === 'followers' 
                    ? (data as AppBskyGraphGetFollowers.OutputSchema).followers 
                    : (data as AppBskyGraphGetFollows.OutputSchema).follows;
                setList(items);
                setCursor(data.cursor);
                setHasMore(!!data.cursor);
            } catch (err: any) {
                setError(t('follows.loadingError', { type }));
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [fetchList, type, t]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !cursor || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const { data } = await fetchList(cursor);
            const newList = type === 'followers' 
                ? (data as AppBskyGraphGetFollowers.OutputSchema).followers 
                : (data as AppBskyGraphGetFollows.OutputSchema).follows;
            if (newList.length > 0) {
                setList(prev => [...prev, ...newList]);
                setCursor(data.cursor);
                setHasMore(!!data.cursor);
            } else {
                setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    }, [cursor, hasMore, isLoadingMore, fetchList, type]);
    
    return (
        <>
            <Head><title>{title}</title></Head>
            <ScreenHeader title={title} />
            <ScrollView 
                contentContainerStyle={styles.container}
                onScroll={({ nativeEvent }) => {
                    if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 400) {
                        loadMore();
                    }
                }}
                scrollEventThrottle={16}
            >
                {isLoading && [...Array(8)].map((_, i) => <FollowsSkeletonCard key={i} />)}
                {!isLoading && error && <View style={styles.messageContainer}><Text style={styles.errorText}>{error}</Text></View>}
                {!isLoading && !error && list.length === 0 && <View style={styles.messageContainer}><Text style={styles.infoText}>{t('follows.empty')}</Text></View>}
                {list.map(user => <ActorSearchResultCard key={user.did} actor={user} />)}
                {isLoadingMore && <ActivityIndicator style={{ marginVertical: 24 }} size="large" color={theme.colors.onSurface} />}
            </ScrollView>
        </>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    skeletonItem: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.lg,
        height: 88,
        opacity: 0.5,
    },
    // novos estilos
    skeletonCardContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.lg,
    },
    skeletonCardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.lg,
    },
    skeletonCardMain: {
        flex: 1,
        minWidth: 0,
        gap: theme.spacing.sm,
    },
    skeletonCardHeader: {
        gap: theme.spacing.sm,
    },
    messageContainer: {
        padding: theme.spacing.xxl,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
    },
    errorText: {
        color: theme.colors.error,
    },
    infoText: {
        color: theme.colors.onSurfaceVariant,
    },
});
export default FollowsScreen;