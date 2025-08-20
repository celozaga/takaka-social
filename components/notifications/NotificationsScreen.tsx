
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyNotificationListNotifications } from '@atproto/api';
import NotificationItem from './NotificationItem';
import ScreenHeader from '../layout/ScreenHeader';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

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

  useEffect(() => {
    const fetchInitialNotifications = async () => {
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
    };
    fetchInitialNotifications();
  }, [agent, resetUnreadCount, t]);

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


  const renderContent = () => {
    if (isLoading) {
      return <View style={{ gap: 8 }}>{[...Array(10)].map((_, i) => <View key={i} style={styles.skeletonItem} />)}</View>;
    }
    if (error) {
      return <View style={styles.messageContainer}><Text style={styles.errorText}>{error}</Text></View>;
    }
    if (filteredNotifications.length === 0) {
      return <View style={styles.messageContainer}><Text style={styles.infoText}>{t('notifications.empty')}</Text></View>;
    }
    return (
      <View>
        {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.uri} notification={notification} />
        ))}
      </View>
    );
  };
  
  return (
    <>
      <Head><title>{t('notifications.title')}</title></Head>
      <ScreenHeader title={t('notifications.title')} />
      <ScrollView
        contentContainerStyle={styles.container}
        onScroll={({ nativeEvent }) => {
            if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 400) {
                loadMoreNotifications();
            }
        }}
        scrollEventThrottle={16}
      >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            {filters.map(filter => (
              <Pressable key={filter.id} onPress={() => setActiveTab(filter.id)} style={[styles.filterButton, activeTab === filter.id && styles.activeFilter]}>
                <Text style={[styles.filterText, activeTab === filter.id && styles.activeFilterText]}>{filter.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ marginTop: 16 }}>
              {renderContent()}
          </View>
          {isLoadingMore && <ActivityIndicator style={{ marginVertical: 24 }} size="large" />}
          {!hasMore && notifications.length > 0 && <Text style={styles.endText}>{t('common.endOfList')}</Text>}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    filterContainer: { gap: 8, paddingBottom: 8 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    activeFilter: { backgroundColor: '#D1E4FF' },
    filterText: { fontSize: 14, fontWeight: '500', color: '#C3C6CF' },
    activeFilterText: { color: '#001D35' },
    skeletonItem: { backgroundColor: '#1E2021', borderRadius: 12, height: 80, opacity: 0.5 },
    messageContainer: { padding: 32, backgroundColor: '#1E2021', borderRadius: 12, alignItems: 'center' },
    errorText: { color: '#F2B8B5' },
    infoText: { color: '#C3C6CF' },
    endText: { textAlign: 'center', color: '#C3C6CF', paddingVertical: 32 },
});

export default NotificationsScreen;
