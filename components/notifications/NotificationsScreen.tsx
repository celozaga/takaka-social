import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyNotificationListNotifications } from '@atproto/api';
import NotificationItem from './NotificationItem';
import ScreenHeader from '../layout/ScreenHeader';
import { Settings } from 'lucide-react';
import { useHeadManager } from '../../hooks/useHeadManager';

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

  const loaderRef = useRef<HTMLDivElement>(null);

  useHeadManager({ title: t('notifications.title') });

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
        
        if (response.data.cursor && response.data.notifications.length > 0) {
          setCursor(response.data.cursor);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Could not load your notifications. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialNotifications();
  }, [agent, resetUnreadCount]);

  const loadMoreNotifications = useCallback(async () => {
    if (isLoadingMore || !cursor || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const response = await agent.app.bsky.notification.listNotifications({ cursor, limit: 40 });
      if (response.data.notifications.length > 0) {
        setNotifications(prev => [...prev, ...response.data.notifications]);
        if (response.data.cursor) {
          setCursor(response.data.cursor);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more notifications:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [agent, cursor, hasMore, isLoadingMore]);
  
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'all':
        return notifications;
      case 'mentions':
        return notifications.filter(n => n.reason === 'mention' || n.reason === 'reply');
      case 'reposts':
        return notifications.filter(n => n.reason === 'repost');
      case 'follows':
        return notifications.filter(n => n.reason === 'follow');
      default:
        return notifications;
    }
  }, [notifications, activeTab]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMoreNotifications();
        }
      },
      { rootMargin: '400px' }
    );
    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMore, isLoading, isLoadingMore, loadMoreNotifications]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-surface-2 p-4 rounded-xl animate-pulse h-20"></div>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error}</div>;
    }

    if (filteredNotifications.length === 0) {
      return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">You don't have any notifications here.</div>;
    }

    return (
      <div className="flow-root">
        <ul className="-my-2">
          {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.uri} notification={notification} />
          ))}
        </ul>
      </div>
    );
  };
  
  return (
    <div>
        <ScreenHeader title={t('notifications.title')}>
            <a href="#/settings" className="p-2 rounded-full hover:bg-surface-3" aria-label={t('nav.settings')}>
                <Settings size={20} />
            </a>
        </ScreenHeader>
        <div className="mt-4">
            <div className="no-scrollbar -mx-4 px-4 flex items-center gap-2 overflow-x-auto pb-2">
            {filters.map(filter => (
                <button
                key={filter.id}
                onClick={() => setActiveTab(filter.id)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap
                    ${activeTab === filter.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-3'}
                `}
                >
                {filter.label}
                </button>
            ))}
            </div>
            <div className="mt-4">
                {renderContent()}
            </div>
            <div ref={loaderRef} className="h-10">
                {isLoadingMore && <div className="bg-surface-2 p-4 rounded-xl animate-pulse h-20 mt-4"></div>}
            </div>
            {!hasMore && notifications.length > 0 && (
                <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
            )}
        </div>
    </div>
  );
};

export default NotificationsScreen;
