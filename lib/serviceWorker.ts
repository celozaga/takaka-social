import { Platform } from 'react-native';

// Service Worker configuration for web platform only
interface CacheConfig {
  name: string;
  version: string;
  assets: string[];
  strategies: {
    [key: string]: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  };
}

interface ServiceWorkerStats {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  cacheSize: number;
  lastUpdate: number | null;
}

const CACHE_CONFIG: CacheConfig = {
  name: 'takaka-social',
  version: 'v1.0.0',
  assets: [
    // Static assets
    '/favicon.ico',
    '/manifest.json',
    '/robots.txt',
    
    // Core app files
    '/_expo/static/js/web/entry.js',
    '/_expo/static/css/web/entry.css',
    
    // Common images and icons
    '/assets/icons/',
    '/assets/images/logo.png',
    
    // Fonts
    '/assets/fonts/',
  ],
  strategies: {
    // Static assets - cache first
    '\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$': 'cache-first',
    
    // API calls - network first with cache fallback
    '/api/': 'network-first',
    
    // Images - stale while revalidate
    '/images/': 'stale-while-revalidate',
    
    // Default - network first
    '.*': 'network-first',
  },
};

/**
 * Service Worker Manager - Web only
 */
class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;
  private stats: ServiceWorkerStats = {
    isSupported: false,
    isRegistered: false,
    isActive: false,
    cacheSize: 0,
    lastUpdate: null,
  };

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    // Only supported on web platform
    if (Platform.OS !== 'web') {
      this.isSupported = false;
      return;
    }

    // Check if service workers are supported
    this.isSupported = 'serviceWorker' in navigator && 'caches' in window;
    this.stats.isSupported = this.isSupported;
  }

  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Service Workers not supported on this platform');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.stats.isRegistered = true;
      this.stats.isActive = this.registration.active !== null;
      this.stats.lastUpdate = Date.now();

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate();
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.stats.isActive = true;
        this.updateCacheSize();
      });

      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  private handleUpdate(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available
        this.notifyUpdate();
      }
    });
  }

  private notifyUpdate(): void {
    // Notify app about available update
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    }
  }

  async updateServiceWorker(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      this.stats.lastUpdate = Date.now();
      return true;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      this.stats.isRegistered = false;
      this.stats.isActive = false;
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  private async updateCacheSize(): Promise<void> {
    if (!this.isSupported) return;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }

      this.stats.cacheSize = totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
    }
  }

  async clearCache(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      this.stats.cacheSize = 0;
      console.log('Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  getStats(): ServiceWorkerStats {
    return { ...this.stats };
  }

  isReady(): boolean {
    return this.isSupported && this.stats.isRegistered && this.stats.isActive;
  }
}

/**
 * Hook for Service Worker management
 */
export function useServiceWorker() {
  const manager = ServiceWorkerManager.getInstance();
  
  const register = async (): Promise<boolean> => {
    return manager.register();
  };

  const update = async (): Promise<boolean> => {
    return manager.updateServiceWorker();
  };

  const unregister = async (): Promise<boolean> => {
    return manager.unregister();
  };

  const clearCache = async (): Promise<boolean> => {
    return manager.clearCache();
  };

  const getStats = (): ServiceWorkerStats => {
    return manager.getStats();
  };

  const isReady = (): boolean => {
    return manager.isReady();
  };

  return {
    register,
    update,
    unregister,
    clearCache,
    getStats,
    isReady,
    isSupported: Platform.OS === 'web',
  };
}

/**
 * Service Worker script content generator
 */
export function generateServiceWorkerScript(): string {
  if (Platform.OS !== 'web') {
    return '';
  }

  return `
const CACHE_NAME = '${CACHE_CONFIG.name}-${CACHE_CONFIG.version}';
const ASSETS_TO_CACHE = ${JSON.stringify(CACHE_CONFIG.assets)};
const CACHE_STRATEGIES = ${JSON.stringify(CACHE_CONFIG.strategies)};

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const strategy = getStrategy(url);
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;
    case 'network-first':
      event.respondWith(networkFirst(event.request));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    default:
      event.respondWith(networkFirst(event.request));
  }
});

// Get caching strategy for URL
function getStrategy(url) {
  for (const [pattern, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (new RegExp(pattern).test(url)) {
      return strategy;
    }
  }
  return 'network-first';
}

// Cache first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return fetchPromise;
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
}

/**
 * Initialize Service Worker for web platform
 */
export async function initializeServiceWorker(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    console.log('Service Worker not available on', Platform.OS);
    return false;
  }

  const manager = ServiceWorkerManager.getInstance();
  return manager.register();
}

/**
 * Cross-platform cache management
 */
export function useCacheManager() {
  const clearAppCache = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      const manager = ServiceWorkerManager.getInstance();
      return manager.clearCache();
    } else {
      // For mobile platforms, clear other caches
      // This would integrate with expo-file-system or AsyncStorage
      console.log('Cache clearing not implemented for', Platform.OS);
      return true;
    }
  };

  const getCacheStats = (): ServiceWorkerStats | null => {
    if (Platform.OS === 'web') {
      const manager = ServiceWorkerManager.getInstance();
      return manager.getStats();
    }
    return null;
  };

  return {
    clearAppCache,
    getCacheStats,
    isSupported: Platform.OS === 'web',
  };
}

export default ServiceWorkerManager;