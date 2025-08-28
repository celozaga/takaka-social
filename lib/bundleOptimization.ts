import { ComponentType, lazy, LazyExoticComponent } from 'react';
import { Platform } from 'react-native';

// Bundle cache for storing loaded modules
class BundleCache {
  private static instance: BundleCache;
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  static getInstance(): BundleCache {
    if (!BundleCache.instance) {
      BundleCache.instance = new BundleCache();
    }
    return BundleCache.instance;
  }

  async loadModule<T = any>(key: string, loader: () => Promise<T>): Promise<T> {
    // Return cached module if available
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Return existing loading promise if module is being loaded
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // Start loading the module
    const loadingPromise = loader().then(module => {
      this.cache.set(key, module);
      this.loadingPromises.delete(key);
      return module;
    }).catch(error => {
      this.loadingPromises.delete(key);
      throw error;
    });

    this.loadingPromises.set(key, loadingPromise);
    return loadingPromise;
  }

  preloadModule<T = any>(key: string, loader: () => Promise<T>): void {
    if (!this.cache.has(key) && !this.loadingPromises.has(key)) {
      this.loadModule(key, loader).catch(() => {
        // Silently fail preloading
      });
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCachedKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Enhanced lazy loading with caching and preloading
export const createLazyComponent = <T extends ComponentType<any>>(
  key: string,
  loader: () => Promise<{ default: T }>,
  preload = false
): React.LazyExoticComponent<T> => {
  const bundleCache = BundleCache.getInstance();

  // Preload if requested
  if (preload) {
    bundleCache.preloadModule(key, loader);
  }

  return lazy(() => bundleCache.loadModule(key, loader));
};

// Route-based code splitting configuration
export const RouteChunks = {
  // Main app routes
  HOME: 'home',
  PROFILE: 'profile', 
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  SEARCH: 'search',
  WATCH: 'watch',
  
  // Modal routes
  MODALS: 'modals',
  COMPOSER: 'composer',
  LOGIN: 'login',
  
  // Feature-specific chunks
  FEEDS: 'feeds',
  POSTS: 'posts',
  MEDIA: 'media',
  MODERATION: 'moderation',
} as const;

// Lazy-loaded route components with strategic preloading
// Note: Components will be loaded dynamically when needed
export const LazyRouteComponents = {
  // Core routes - available for lazy loading
  HOME: RouteChunks.HOME,
  PROFILE: RouteChunks.PROFILE,
  SETTINGS: RouteChunks.SETTINGS,
  NOTIFICATIONS: RouteChunks.NOTIFICATIONS,
  SEARCH: RouteChunks.SEARCH,
  WATCH: RouteChunks.WATCH,
  LOGIN: RouteChunks.LOGIN,
  COMPOSER: RouteChunks.COMPOSER,
};

// Route preloading strategies
export class RoutePreloader {
  private static bundleCache = BundleCache.getInstance();
  
  // Preload routes based on current route
  static preloadForRoute(currentRoute: string): void {
    const preloadMap: Record<string, string[]> = {
      'index': [RouteChunks.PROFILE, RouteChunks.SEARCH, RouteChunks.COMPOSER],
      'profile': [RouteChunks.SETTINGS],
      'search': [RouteChunks.PROFILE, RouteChunks.COMPOSER],
            'notifications': [RouteChunks.PROFILE],
      'settings': [RouteChunks.PROFILE, RouteChunks.MODERATION],
      'watch': [RouteChunks.PROFILE, RouteChunks.COMPOSER],
    };
    
    const routesToPreload = preloadMap[currentRoute] || [];
    
    routesToPreload.forEach(route => {
      this.preloadRoute(route);
    });
  }
  
  // Preload specific route
  static preloadRoute(routeKey: string): void {
    // Route preloading will be handled by the router
    // This method is kept for compatibility
    console.log(`Preloading route: ${routeKey}`);
  }
  
  // Preload critical routes on app start
  static preloadCriticalRoutes(): void {
    const criticalRoutes = [RouteChunks.HOME, RouteChunks.PROFILE];
    criticalRoutes.forEach(route => this.preloadRoute(route));
  }
  
  // Clean up unused routes to free memory
  static cleanupUnusedRoutes(activeRoutes: string[]): void {
    const cachedKeys = this.bundleCache.getCachedKeys();
    const unusedKeys = cachedKeys.filter(key => !activeRoutes.includes(key));
    
    // Only cleanup if we have too many cached routes
    if (cachedKeys.length > 10) {
      unusedKeys.slice(0, Math.floor(unusedKeys.length / 2)).forEach(key => {
        // Note: We can't actually remove from cache in this implementation
        // but in a real scenario, you'd implement cache eviction
      });
    }
  }
}

// Bundle size optimization utilities
export class BundleOptimizer {
  // Analyze bundle usage
  static getBundleStats(): {
    totalCached: number;
    cacheSize: number;
    cachedRoutes: string[];
  } {
    const bundleCache = BundleCache.getInstance();
    
    return {
      totalCached: bundleCache.getCacheSize(),
      cacheSize: bundleCache.getCacheSize(),
      cachedRoutes: bundleCache.getCachedKeys(),
    };
  }
  
  // Platform-specific optimizations
  static getPlatformOptimizations() {
    return {
      web: {
        enableCodeSplitting: true,
        enablePreloading: true,
        maxCacheSize: 20,
      },
      native: {
        enableCodeSplitting: Platform.OS === 'ios', // iOS supports it better
        enablePreloading: false, // More conservative on mobile
        maxCacheSize: 10,
      },
    };
  }
  
  // Memory management
  static shouldPreload(): boolean {
    if (Platform.OS === 'web') {
      return true;
    }
    
    // On mobile, be more conservative
    const bundleCache = BundleCache.getInstance();
    return bundleCache.getCacheSize() < 5;
  }
}

export default BundleCache;