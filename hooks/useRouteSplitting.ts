import { lazy, ComponentType, LazyExoticComponent, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface RouteChunkConfig {
  component: () => Promise<{ default: ComponentType<any> }>;
  preloadTriggers?: string[]; // Routes that should trigger preload of this chunk
  priority: 'high' | 'medium' | 'low';
  platforms?: ('web' | 'ios' | 'android')[];
}

interface ChunkLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Configuração de chunks por rota principal
 */
const ROUTE_CHUNKS: Record<string, RouteChunkConfig> = {
  // Main feed routes
  'feeds': {
    component: () => import('@/app/(tabs)/feeds'),
    preloadTriggers: ['/home', '/'],
    priority: 'high',
  },
  'home': {
    component: () => import('@/app/(tabs)/home'),
    preloadTriggers: ['/'],
    priority: 'high',
  },
  'search': {
    component: () => import('@/app/(tabs)/search'),
    preloadTriggers: ['/home', '/feeds'],
    priority: 'medium',
  },
  'notifications': {
    component: () => import('@/app/(tabs)/notifications'),
    preloadTriggers: ['/home'],
    priority: 'medium',
  },
  
  // Profile routes
  'profile': {
    component: () => import('@/app/profile/[actor]'),
    preloadTriggers: ['/home', '/feeds'],
    priority: 'medium',
  },
  

  
  // Settings
  'settings': {
    component: () => import('@/app/(tabs)/settings'),
    preloadTriggers: ['/more'],
    priority: 'low',
  },
  'settings-account': {
    component: () => import('@/app/settings/account'),
    preloadTriggers: ['/settings'],
    priority: 'low',
  },
  'settings-privacy': {
    component: () => import('@/app/settings/privacy'),
    preloadTriggers: ['/settings'],
    priority: 'low',
  },
  'settings-notifications': {
    component: () => import('@/app/settings/notifications'),
    preloadTriggers: ['/settings'],
    priority: 'low',
  },
  'settings-accessibility': {
    component: () => import('@/app/settings/accessibility'),
    preloadTriggers: ['/settings'],
    priority: 'low',
  },
  'settings-moderation': {
    component: () => import('@/app/settings/moderation'),
    preloadTriggers: ['/settings'],
    priority: 'low',
  },
  
  // Watch/Video
  'watch': {
    component: () => import('@/app/(tabs)/watch'),
    preloadTriggers: ['/home', '/feeds'],
    priority: 'medium',
    platforms: ['web', 'ios', 'android'], // Video works on all platforms
  },
  
  // More/Additional
  'more': {
    component: () => import('@/app/(tabs)/more'),
    preloadTriggers: [],
    priority: 'low',
  },
  
  // Bookmarks and Likes
  'bookmarks': {
    component: () => import('@/app/bookmarks'),
    preloadTriggers: ['/more', '/profile'],
    priority: 'low',
  },
  'likes': {
    component: () => import('@/app/likes'),
    preloadTriggers: ['/profile'],
    priority: 'low',
  },
};

/**
 * Cache global para chunks carregados
 */
class RouteChunkCache {
  private static instance: RouteChunkCache;
  private cache = new Map<string, LazyExoticComponent<any>>();
  private loadingStates = new Map<string, ChunkLoadingState>();
  private preloadQueue = new Set<string>();
  private maxRetries = 3;
  private retryDelay = 1000;

  static getInstance(): RouteChunkCache {
    if (!RouteChunkCache.instance) {
      RouteChunkCache.instance = new RouteChunkCache();
    }
    return RouteChunkCache.instance;
  }

  private getLoadingState(chunkId: string): ChunkLoadingState {
    if (!this.loadingStates.has(chunkId)) {
      this.loadingStates.set(chunkId, {
        isLoading: false,
        isLoaded: false,
        error: null,
        retryCount: 0,
      });
    }
    return this.loadingStates.get(chunkId)!;
  }

  private updateLoadingState(chunkId: string, updates: Partial<ChunkLoadingState>) {
    const current = this.getLoadingState(chunkId);
    this.loadingStates.set(chunkId, { ...current, ...updates });
  }

  getLazyComponent(chunkId: string): LazyExoticComponent<any> {
    if (this.cache.has(chunkId)) {
      return this.cache.get(chunkId)!;
    }

    const config = ROUTE_CHUNKS[chunkId];
    if (!config) {
      throw new Error(`Route chunk '${chunkId}' not found`);
    }

    // Check platform compatibility
    if (config.platforms && !this.isPlatformSupported(config.platforms)) {
      throw new Error(`Route chunk '${chunkId}' not supported on ${Platform.OS}`);
    }

    const lazyComponent = lazy(async () => {
      this.updateLoadingState(chunkId, { isLoading: true, error: null });
      
      try {
        const module = await config.component();
        this.updateLoadingState(chunkId, {
          isLoading: false,
          isLoaded: true,
          retryCount: 0,
        });
        return module;
      } catch (error) {
        const state = this.getLoadingState(chunkId);
        this.updateLoadingState(chunkId, {
          isLoading: false,
          error: error as Error,
          retryCount: state.retryCount + 1,
        });
        
        // Auto-retry logic
        if (state.retryCount < this.maxRetries) {
          setTimeout(() => {
            this.preloadChunk(chunkId);
          }, this.retryDelay * (state.retryCount + 1));
        }
        
        throw error;
      }
    });

    this.cache.set(chunkId, lazyComponent);
    return lazyComponent;
  }

  private isPlatformSupported(platforms: string[]): boolean {
    return platforms.includes(Platform.OS);
  }

  preloadChunk(chunkId: string): void {
    if (this.preloadQueue.has(chunkId)) return;
    
    const config = ROUTE_CHUNKS[chunkId];
    if (!config) return;

    // Check platform compatibility
    if (config.platforms && !this.isPlatformSupported(config.platforms)) {
      return;
    }

    this.preloadQueue.add(chunkId);
    
    // Preload with priority-based delay
    const delay = this.getPreloadDelay(config.priority);
    
    setTimeout(() => {
      config.component().catch(() => {
        // Silently handle preload errors
        this.preloadQueue.delete(chunkId);
      }).finally(() => {
        this.preloadQueue.delete(chunkId);
      });
    }, delay);
  }

  private getPreloadDelay(priority: 'high' | 'medium' | 'low'): number {
    const delays = {
      high: 500,
      medium: 1500,
      low: 3000,
    };
    
    // Adjust delays for mobile platforms
    const multiplier = Platform.OS === 'web' ? 1 : 1.5;
    return delays[priority] * multiplier;
  }

  preloadTriggeredChunks(currentRoute: string): void {
    Object.entries(ROUTE_CHUNKS).forEach(([chunkId, config]) => {
      if (config.preloadTriggers?.includes(currentRoute)) {
        this.preloadChunk(chunkId);
      }
    });
  }

  getLoadingStates(): Map<string, ChunkLoadingState> {
    return new Map(this.loadingStates);
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingStates.clear();
    this.preloadQueue.clear();
  }

  getCacheStats() {
    return {
      cachedChunks: this.cache.size,
      loadingChunks: Array.from(this.loadingStates.values()).filter(s => s.isLoading).length,
      loadedChunks: Array.from(this.loadingStates.values()).filter(s => s.isLoaded).length,
      failedChunks: Array.from(this.loadingStates.values()).filter(s => s.error).length,
      queuedPreloads: this.preloadQueue.size,
    };
  }
}

/**
 * Hook para gerenciar code splitting baseado em rotas
 */
export function useRouteSplitting(currentRoute: string) {
  const cache = RouteChunkCache.getInstance();
  const [stats, setStats] = useState(cache.getCacheStats());

  useEffect(() => {
    // Preload chunks triggered by current route
    cache.preloadTriggeredChunks(currentRoute);
    
    // Update stats
    const updateStats = () => setStats(cache.getCacheStats());
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, [currentRoute, cache]);

  return {
    getLazyComponent: (chunkId: string) => cache.getLazyComponent(chunkId),
    preloadChunk: (chunkId: string) => cache.preloadChunk(chunkId),
    stats,
    clearCache: () => cache.clearCache(),
  };
}

/**
 * Hook para preload inteligente baseado na navegação do usuário
 */
export function useIntelligentPreload(currentRoute: string, navigationHistory: string[] = []) {
  const cache = RouteChunkCache.getInstance();

  useEffect(() => {
    // Preload based on user navigation patterns
    const predictNextRoutes = (history: string[], current: string): string[] => {
      // Simple prediction based on common navigation patterns
      const patterns: Record<string, string[]> = {
        '/home': ['feeds', 'search', 'notifications'],
        '/feeds': ['home', 'search', 'profile'],
        '/search': ['profile', 'home'],
        '/notifications': ['profile'],
        '/profile': ['settings'],
        '/settings': ['settings-account', 'settings-privacy', 'settings-notifications'],
      };
      
      return patterns[current] || [];
    };

    const predictedRoutes = predictNextRoutes(navigationHistory, currentRoute);
    
    // Preload predicted routes with delay
    predictedRoutes.forEach((chunkId, index) => {
      setTimeout(() => {
        cache.preloadChunk(chunkId);
      }, (index + 1) * 1000);
    });
  }, [currentRoute, navigationHistory, cache]);
}

/**
 * Componentes lazy otimizados para rotas principais
 */
export const lazyRouteComponents = {
  // Main tabs
  FeedsPage: () => RouteChunkCache.getInstance().getLazyComponent('feeds'),
  HomePage: () => RouteChunkCache.getInstance().getLazyComponent('home'),
  SearchPage: () => RouteChunkCache.getInstance().getLazyComponent('search'),
  NotificationsPage: () => RouteChunkCache.getInstance().getLazyComponent('notifications'),
  WatchPage: () => RouteChunkCache.getInstance().getLazyComponent('watch'),
  MorePage: () => RouteChunkCache.getInstance().getLazyComponent('more'),
  SettingsPage: () => RouteChunkCache.getInstance().getLazyComponent('settings'),
  
  // Profile
  ProfilePage: () => RouteChunkCache.getInstance().getLazyComponent('profile'),
  

  // Settings
  SettingsAccountPage: () => RouteChunkCache.getInstance().getLazyComponent('settings-account'),
  SettingsPrivacyPage: () => RouteChunkCache.getInstance().getLazyComponent('settings-privacy'),
  SettingsNotificationsPage: () => RouteChunkCache.getInstance().getLazyComponent('settings-notifications'),
  SettingsAccessibilityPage: () => RouteChunkCache.getInstance().getLazyComponent('settings-accessibility'),
  SettingsModerationPage: () => RouteChunkCache.getInstance().getLazyComponent('settings-moderation'),
  
  // Additional
  BookmarksPage: () => RouteChunkCache.getInstance().getLazyComponent('bookmarks'),
  LikesPage: () => RouteChunkCache.getInstance().getLazyComponent('likes'),
};

export default RouteChunkCache;