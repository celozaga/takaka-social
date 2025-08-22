import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyNotificationListNotifications } from '@atproto/api';
import NotificationItem from './NotificationItem';
import ScreenHeader from '../layout/ScreenHeader';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { theme } from '@/lib/theme';
import NotificationItemSkeleton from './NotificationItemSkeleton';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all');

  const fetchNotifications = useCallback(async () => {
    setError(null);
    try {
      await agent.app.bsky.notification.updateSeen({ seenAt: new Date().toISOString() });
      resetUnreadCount();
      const response = await agent.app.bsky.notification.listNotifications({ limit: 40 });
      setNotifications(response.data.notifications);
      setCursor(response.data.cursor);
      setHasMore(!!response.data.cursor && response.data.notifications.length > 0);
    } catch (err) {
      setError(t('notifications.loadingError'));
    }
  }, [agent, resetUnreadCount, t]);

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      await fetchNotifications();
      setIsLoading(false);
    }
    loadInitial();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  }, [fetchNotifications]);

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

  if (isLoading) {
    return (
      <>
        <Head><title>{t('notifications.title')}</title></Head>
        <View style={{flex: 1}}>
            <ScreenHeader title={t('notifications.title')} />
            {renderListHeader()}
            <View>
                {[...Array(10)].map((_, i) => (
                    <React.Fragment key={i}>
                        <NotificationItemSkeleton />
                        <View style={styles.separator} />
                    </React.Fragment>
                ))}
            </View>
        </View>
      </>
    )
  }

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
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            onEndReached={loadMoreNotifications}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
                if (isLoadingMore) return <ActivityIndicator style={{ marginVertical: 24 }} size="large" />;
                if (!hasMore && notifications.length > 0) return <Text style={styles.endText}>{t('common.endOfList')}</Text>;
                return null;
            }}
            ListEmptyComponent={() => {
                if (isLoading) {
                    return null;
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
    filterButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainer },
    activeFilter: { backgroundColor: theme.colors.onSurface },
    filterText: { fontSize: 14, fontWeight: '500', color: theme.colors.onSurface },
    activeFilterText: { color: theme.colors.background, fontWeight: 'bold' },
    messageContainer: { padding: 32, backgroundColor: theme.colors.surface, borderRadius: 12, alignItems: 'center', margin: 16 },
    errorText: { color: theme.colors.error },
    infoText: { color: theme.colors.onSurfaceVariant },
    endText: { textAlign: 'center', color: theme.colors.onSurfaceVariant, paddingVertical: 32 },
});

export default NotificationsScreen;