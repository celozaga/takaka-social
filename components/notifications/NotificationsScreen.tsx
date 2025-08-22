import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyNotificationListNotifications } from '@atproto/api';
import NotificationItem from './NotificationItem';
import ScreenHeader from '../layout/ScreenHeader';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { theme } from '@/lib/theme';

type NotificationFilter = 'all' | 'mentions' | 'reposts' | 'follows';

const filters: { id: NotificationFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'reposts', label: 'Reposts' },
    { id: 'follows', label: 'Follows' },
];

const NotificationsScreen: React.FC = () => {
  const { agent, resetUnreadCount } = useAtp();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppBskyNotificationListNotifications.Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all');

  const fetchInitialNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotifications([]);
    setCursor(undefined);
    setHasMore(true);

    try {
      await agent.app.bsky.notification.updateSeen({ seenAt: new Date().toISOString() });
      resetUnreadCount();
      const response = await agent.app.bsky.notification.listNotifications({ limit: 40 });
      setNotifications(response.data.notifications);
      setCursor(response.data.cursor);
      setHasMore(!!response.data.cursor && response.data.notifications.length > 0);
    } catch (err) {
      setError(t('notifications.loadingError'));
    } finally {
      setIsLoading(false);
    }
  }, [agent, resetUnreadCount, t]);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  const loadMoreNotifications = useCallback(async () => {
    if (isLoadingMore || !cursor || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const response = await agent.app.bsky.notification.listNotifications({ cursor, limit: 40 });
      if (response.data.notifications.length > 0) {
        setNotifications(prev => [...prev, ...response.data.notifications]);
        setCursor(response.data.cursor);
        setHasMore(!!response.data.cursor);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [agent, cursor, hasMore, isLoadingMore]);
  
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'mentions': return notifications.filter(n => n.reason === 'mention' || n.reason === 'reply');
      case 'reposts': return notifications.filter(n => n.reason === 'repost');
      case 'follows': return notifications.filter(n => n.reason === 'follow');
      default: return notifications;
    }
  }, [notifications, activeTab]);

  const renderListHeader = () => (
    <View style={styles.filterScrollContainer}>
        <FlatList<{ id: NotificationFilter; label: string; }>
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filters}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <Pressable onPress={() => setActiveTab(item.id)} style={[styles.filterButton, activeTab === item.id && styles.activeFilter]}>
                    <Text style={[styles.filterText, activeTab === item.id && styles.activeFilterText]}>{t(`notifications.${item.id}`, { defaultValue: item.label })}</Text>
                </Pressable>
            )}
            contentContainerStyle={styles.filterContainer}
        />
    </View>
  );

  return (
    <>
      <Head><title>{t('notifications.title')}</title></Head>
      <View style={{flex: 1}}>
        <ScreenHeader title={t('notifications.title')} />
        <FlatList<AppBskyNotificationListNotifications.Notification>
            data={filteredNotifications}
            renderItem={({ item }) => <NotificationItem notification={item} />}
            keyExtractor={(item) => item.uri}
            ListHeaderComponent={renderListHeader}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContentContainer}
            onRefresh={fetchInitialNotifications}
            refreshing={isLoading}
            onEndReached={loadMoreNotifications}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
                if (isLoadingMore) return <ActivityIndicator style={{ marginVertical: 24 }} size="large" />;
                if (!hasMore && notifications.length > 0) return <Text style={styles.endText}>{t('common.endOfList')}</Text>;
                return null;
            }}
            ListEmptyComponent={() => {
                if (isLoading) {
                    return null; // Handled by refreshing prop
                }
                if (error) {
                    return <View style={styles.messageContainer}><Text style={styles.errorText}>{error}</Text></View>;
                }
                if (filteredNotifications.length === 0) {
                    return <View style={styles.messageContainer}><Text style={styles.infoText}>{t('notifications.empty')}</Text></View>;
                }
                return null;
            }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
    listContentContainer: { paddingBottom: 16 },
    separator: { height: 1, backgroundColor: theme.colors.outline, marginHorizontal: 16 },
    filterScrollContainer: { paddingHorizontal: 16, paddingTop: 16 },
    filterContainer: { gap: 8, paddingBottom: 16 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.shape.medium, backgroundColor: theme.colors.surfaceContainerHigh },
    activeFilter: { backgroundColor: theme.colors.onSurface },
    filterText: { fontSize: 14, fontWeight: '500', color: theme.colors.onSurface },
    activeFilterText: { color: theme.colors.onPrimary },
    messageContainer: { padding: 32, backgroundColor: theme.colors.surface, borderRadius: 12, alignItems: 'center', margin: 16 },
    errorText: { color: theme.colors.error },
    infoText: { color: theme.colors.onSurfaceVariant },
    endText: { textAlign: 'center', color: theme.colors.onSurfaceVariant, paddingVertical: 32 },
});

export default NotificationsScreen;