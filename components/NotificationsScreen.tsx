
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyNotificationListNotifications } from '@atproto/api';
import NotificationItem from './NotificationItem';
import { useUI } from '../context/UIContext';
import NotificationsHeader from './NotificationsHeader';

type NotificationFilter = 'all' | 'mentions';

const NotificationsScreen: React.FC = () => {
  const { agent, resetUnreadCount } = useAtp();
  const { setCustomFeedHeaderVisible } = useUI();
  const [notifications, setNotifications] = useState<AppBskyNotificationListNotifications.Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all');

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomFeedHeaderVisible(true);
    return () => setCustomFeedHeaderVisible(false);
  }, [setCustomFeedHeaderVisible]);

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
    if (activeTab === 'mentions') {
      return notifications.filter(n => n.reason === 'mention' || n.reason === 'reply');
    }
    return notifications;
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
      <NotificationsHeader />
      <div className="mt-4">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'all' ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('mentions')}
            className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'mentions' ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant'}`}
          >
            Mentions
          </button>
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
