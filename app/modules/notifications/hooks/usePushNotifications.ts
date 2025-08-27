// ============================================================================
// Notifications Module - usePushNotifications Hook
// ============================================================================
//
// This hook manages push notification functionality, including subscription,
// permission handling, and service worker registration.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PushSubscription,
  PushNotificationPayload,
  NotificationPreferences,
  UsePushNotificationsReturn
} from '../types';
import { defaultApiClient } from '../../../core/api';
import { notificationUtils } from '../utils';

// ============================================================================
// Types
// ============================================================================

interface UsePushNotificationsOptions {
  /**
   * VAPID public key for push subscription
   */
  vapidPublicKey?: string;
  
  /**
   * Service worker script path
   * @default '/sw.js'
   */
  serviceWorkerPath?: string;
  
  /**
   * Auto-request permission on mount
   * @default false
   */
  autoRequestPermission?: boolean;
  
  /**
   * Enable automatic subscription
   * @default true
   */
  autoSubscribe?: boolean;
  
  /**
   * Subscription retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Retry delay in milliseconds
   * @default 5000
   */
  retryDelay?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UsePushNotificationsOptions> = {
  vapidPublicKey: '',
  serviceWorkerPath: '/sw.js',
  autoRequestPermission: false,
  autoSubscribe: true,
  maxRetries: 3,
  retryDelay: 5000,
};

// ============================================================================
// Main Hook
// ============================================================================

export function usePushNotifications(options: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  // ============================================================================
  // Refs
  // ============================================================================
  
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // Service Worker Management
  // ============================================================================
  
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }
    
    try {
      const registration = await navigator.serviceWorker.register(config.serviceWorkerPath);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      setServiceWorkerRegistration(registration);
      return registration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      throw new Error('Failed to register service worker');
    }
  }, [config.serviceWorkerPath]);
  
  // ============================================================================
  // Permission Management
  // ============================================================================
  
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!notificationUtils.push.isSupported()) {
      throw new Error('Push notifications are not supported');
    }
    
    try {
      const permission = await notificationUtils.push.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw new Error('Failed to request notification permission');
    }
  }, []);
  
  const checkPermission = useCallback((): NotificationPermission => {
    const currentPermission = notificationUtils.push.getPermissionStatus();
    setPermission(currentPermission);
    return currentPermission;
  }, []);
  
  // ============================================================================
  // Subscription Management
  // ============================================================================
  
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if already subscribed
      if (isSubscribed && subscription) {
        return subscription;
      }
      
      // Check permission
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }
      
      // Register service worker if needed
      let registration = serviceWorkerRegistration;
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) {
          throw new Error('Failed to register service worker');
        }
      }
      
      // Check for existing subscription
      let pushSubscription = await registration.pushManager.getSubscription();
      
      if (!pushSubscription) {
        // Create new subscription
        if (!config.vapidPublicKey) {
          throw new Error('VAPID public key is required for push subscription');
        }
        
        const applicationServerKey = urlBase64ToUint8Array(config.vapidPublicKey);
        
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }
      
      // Convert to our format
      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
        },
      };
      
      // Send subscription to server
      await defaultApiClient.post('/notifications/push/subscribe', {
        subscription: subscriptionData,
      });
      
      setSubscription(subscriptionData);
      setIsSubscribed(true);
      retryCountRef.current = 0;
      
      return subscriptionData;
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setError(error as Error);
      
      // Retry logic
      if (retryCountRef.current < config.maxRetries) {
        retryCountRef.current++;
        retryTimeoutRef.current = setTimeout(() => {
          subscribe();
        }, config.retryDelay);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isSubscribed,
    subscription,
    permission,
    serviceWorkerRegistration,
    config.vapidPublicKey,
    config.maxRetries,
    config.retryDelay,
    requestPermission,
    registerServiceWorker,
  ]);
  
  const unsubscribe = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get service worker registration
      const registration = serviceWorkerRegistration || await navigator.serviceWorker.ready;
      
      // Get current subscription
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        // Unsubscribe from push manager
        await pushSubscription.unsubscribe();
        
        // Notify server
        if (subscription) {
          await defaultApiClient.post('/notifications/push/unsubscribe', {
            subscription,
          });
        }
      }
      
      setSubscription(null);
      setIsSubscribed(false);
      
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [serviceWorkerRegistration, subscription]);
  
  const checkSubscription = useCallback(async (): Promise<boolean> => {
    try {
      if (!serviceWorkerRegistration) {
        return false;
      }
      
      const pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (pushSubscription) {
        const subscriptionData: PushSubscription = {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
          },
        };
        
        setSubscription(subscriptionData);
        setIsSubscribed(true);
        return true;
      } else {
        setSubscription(null);
        setIsSubscribed(false);
        return false;
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  }, [serviceWorkerRegistration]);
  
  // ============================================================================
  // Notification Testing
  // ============================================================================
  
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!isSubscribed || !subscription) {
      throw new Error('Not subscribed to push notifications');
    }
    
    try {
      await defaultApiClient.post('/notifications/push/test', {
        subscription,
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }, [isSubscribed, subscription]);
  
  const showLocalNotification = useCallback((payload: PushNotificationPayload): void => {
    if (permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }
    
    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge?.toString(),
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
      });
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle navigation based on notification data
        if (payload.data?.postUri) {
          // Navigate to post
          window.location.href = `/post/${payload.data.postUri}`;
        } else if (payload.data?.actorDid) {
          // Navigate to profile
          window.location.href = `/profile/${payload.data.actorDid}`;
        }
      };
      
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }, [permission]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Check support and initial state
  useEffect(() => {
    const supported = notificationUtils.push.isSupported();
    setIsSupported(supported);
    
    if (supported) {
      checkPermission();
    }
  }, [checkPermission]);
  
  // Register service worker and check subscription
  useEffect(() => {
    if (!isSupported) return;
    
    const initializeServiceWorker = async () => {
      try {
        const registration = await registerServiceWorker();
        if (registration) {
          await checkSubscription();
        }
      } catch (error) {
        console.error('Failed to initialize service worker:', error);
        setError(error as Error);
      }
    };
    
    initializeServiceWorker();
  }, [isSupported, registerServiceWorker, checkSubscription]);
  
  // Auto-request permission
  useEffect(() => {
    if (config.autoRequestPermission && isSupported && permission === 'default') {
      requestPermission();
    }
  }, [config.autoRequestPermission, isSupported, permission, requestPermission]);
  
  // Auto-subscribe
  useEffect(() => {
    if (config.autoSubscribe && isSupported && permission === 'granted' && !isSubscribed) {
      subscribe();
    }
  }, [config.autoSubscribe, isSupported, permission, isSubscribed, subscribe]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // State
    isSupported,
    permission,
    isSubscribed,
    subscription,
    isLoading,
    error,
    serviceWorkerRegistration,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
    sendTestNotification,
    showLocalNotification,
    
    // Utilities
    checkPermission,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert URL-safe base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
}

export default usePushNotifications;