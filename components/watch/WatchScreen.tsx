import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react';
import { theme } from '@/lib/theme';
import Head from '../shared/Head';
import WatchFeed from './WatchFeed';
import { useVideoManager } from './hooks/useVideoManager';
import ErrorState from '../shared/ErrorState';
import { VideoOff } from 'lucide-react';

const WatchScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const {
        posts,
        isLoading,
        error,
        isLoadingMore,
        isRefreshing,
        hasMore,
        refresh,
        loadMore,
    } = useVideoManager();

    if (isLoading) {
        return (
            <View style={styles.fullScreenCentered}>
                <ActivityIndicator size="large" color={theme.colors.onSurface} />
            </View>
        );
    }

    if (error && posts.length === 0) {
        return (
            <View style={styles.container}>
                 <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </Pressable>
                <ErrorState 
                    icon={VideoOff}
                    title={t('feed.loadingError')}
                    message={error}
                    onRetry={refresh}
                />
            </View>
        );
    }
    
    return (
        <>
            <Head><title>{t('more.watch')}</title></Head>
            <View style={styles.container}>
                <WatchFeed 
                    videoPosts={posts}
                    loadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    onRefresh={refresh}
                    isRefreshing={isRefreshing}
                />
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </Pressable>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    fullScreenCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
    backButton: { position: 'absolute', top: theme.spacing.l, left: theme.spacing.l, zIndex: 30, padding: theme.spacing.s, borderRadius: theme.shape.full, backgroundColor: 'rgba(0,0,0,0.4)' },
});

export default WatchScreen;
