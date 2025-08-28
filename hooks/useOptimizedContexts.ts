import { createContext, useContext, useMemo, useCallback, ReactNode, useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface ContextConfig {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  lazyInit?: boolean;
  dependencies?: string[];
  platforms?: ('web' | 'ios' | 'android')[];
}

interface OptimizedContextState<T> {
  data: T | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
}

/**
 * Configuração de contextos com prioridades
 */
const CONTEXT_CONFIGS: Record<string, ContextConfig> = {
  theme: {
    name: 'ThemeContext',
    priority: 'critical',
    lazyInit: false,
  },
  auth: {
    name: 'AtpContext',
    priority: 'critical',
    lazyInit: false,
  },
  ui: {
    name: 'UIContext',
    priority: 'critical',
    lazyInit: false,
  },
  accessibility: {
    name: 'AccessibilityContext',
    priority: 'high',
    lazyInit: true,
  },
  moderation: {
    name: 'ModerationContext',
    priority: 'high',
    lazyInit: true,
    dependencies: ['auth'],
  },
  profileCache: {
    name: 'ProfileCacheContext',
    priority: 'medium',
    lazyInit: true,
    dependencies: ['auth'],
  },
  bookmarks: {
    name: 'BookmarksContext',
    priority: 'medium',
    lazyInit: true,
    dependencies: ['auth'],
  },
  hiddenPosts: {
    name: 'HiddenPostsContext',
    priority: 'medium',
    lazyInit: true,
    dependencies: ['auth'],
  },
  toast: {
    name: 'ToastContext',
    priority: 'low',
    lazyInit: true,
  },
};

/**
 * Gerenciador de contextos otimizados
 */
class OptimizedContextManager {
  private static instance: OptimizedContextManager;
  private contexts = new Map<string, any>();
  private initializationQueue = new Map<string, Promise<any>>();
  private dependencyGraph = new Map<string, string[]>();
  private initialized = new Set<string>();
  private loading = new Set<string>();

  static getInstance(): OptimizedContextManager {
    if (!OptimizedContextManager.instance) {
      OptimizedContextManager.instance = new OptimizedContextManager();
    }
    return OptimizedContextManager.instance;
  }

  constructor() {
    this.buildDependencyGraph();
  }

  private buildDependencyGraph() {
    Object.entries(CONTEXT_CONFIGS).forEach(([contextId, config]) => {
      this.dependencyGraph.set(contextId, config.dependencies || []);
    });
  }

  private async resolveDependencies(contextId: string): Promise<void> {
    const dependencies = this.dependencyGraph.get(contextId) || [];
    
    for (const depId of dependencies) {
      if (!this.initialized.has(depId)) {
        await this.initializeContext(depId);
      }
    }
  }

  private getInitializationDelay(priority: string): number {
    const delays = {
      critical: 0,
      high: 100,
      medium: 500,
      low: 1000,
    };
    
    // Adjust delays for mobile platforms
    const multiplier = Platform.OS === 'web' ? 1 : 1.2;
    return (delays[priority as keyof typeof delays] || 1000) * multiplier;
  }

  async initializeContext(contextId: string): Promise<any> {
    if (this.initialized.has(contextId)) {
      return this.contexts.get(contextId);
    }

    if (this.initializationQueue.has(contextId)) {
      return this.initializationQueue.get(contextId);
    }

    const config = CONTEXT_CONFIGS[contextId];
    if (!config) {
      throw new Error(`Context '${contextId}' not found`);
    }

    // Check platform compatibility
    if (config.platforms && !config.platforms.includes(Platform.OS as any)) {
      console.warn(`Context '${contextId}' not supported on ${Platform.OS}`);
      return null;
    }

    this.loading.add(contextId);

    const initPromise = this.performInitialization(contextId, config);
    this.initializationQueue.set(contextId, initPromise);

    try {
      const result = await initPromise;
      this.contexts.set(contextId, result);
      this.initialized.add(contextId);
      this.loading.delete(contextId);
      this.initializationQueue.delete(contextId);
      return result;
    } catch (error) {
      this.loading.delete(contextId);
      this.initializationQueue.delete(contextId);
      throw error;
    }
  }

  private async performInitialization(contextId: string, config: ContextConfig): Promise<any> {
    // Resolve dependencies first
    await this.resolveDependencies(contextId);

    // Add delay based on priority
    const delay = this.getInitializationDelay(config.priority);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Simulate context initialization
    // In real implementation, this would initialize the actual context
    return {
      contextId,
      initialized: true,
      timestamp: Date.now(),
    };
  }

  isContextLoading(contextId: string): boolean {
    return this.loading.has(contextId);
  }

  isContextInitialized(contextId: string): boolean {
    return this.initialized.has(contextId);
  }

  getContext(contextId: string): any {
    return this.contexts.get(contextId);
  }

  preloadContext(contextId: string): void {
    if (!this.initialized.has(contextId) && !this.loading.has(contextId)) {
      this.initializeContext(contextId).catch(error => {
        console.warn(`Failed to preload context '${contextId}':`, error);
      });
    }
  }

  preloadContextsByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): void {
    Object.entries(CONTEXT_CONFIGS)
      .filter(([, config]) => config.priority === priority)
      .forEach(([contextId]) => {
        this.preloadContext(contextId);
      });
  }

  getStats() {
    return {
      total: Object.keys(CONTEXT_CONFIGS).length,
      initialized: this.initialized.size,
      loading: this.loading.size,
      pending: Object.keys(CONTEXT_CONFIGS).length - this.initialized.size - this.loading.size,
      contexts: Object.fromEntries(
        Object.keys(CONTEXT_CONFIGS).map(id => [
          id,
          {
            initialized: this.initialized.has(id),
            loading: this.loading.has(id),
            config: CONTEXT_CONFIGS[id],
          }
        ])
      ),
    };
  }

  reset(): void {
    this.contexts.clear();
    this.initializationQueue.clear();
    this.initialized.clear();
    this.loading.clear();
  }
}

/**
 * Hook para usar contextos otimizados com lazy initialization
 */
export function useOptimizedContext<T>(contextId: string): OptimizedContextState<T> {
  const manager = OptimizedContextManager.getInstance();
  const [state, setState] = useState<OptimizedContextState<T>>(() => ({
    data: manager.getContext(contextId) || null,
    isLoading: manager.isContextLoading(contextId),
    isInitialized: manager.isContextInitialized(contextId),
    error: null,
  }));

  useEffect(() => {
    const config = CONTEXT_CONFIGS[contextId];
    if (!config) {
      setState(prev => ({
        ...prev,
        error: new Error(`Context '${contextId}' not found`),
      }));
      return;
    }

    // Initialize context if it should be lazy loaded and not yet initialized
    if (config.lazyInit && !manager.isContextInitialized(contextId)) {
      setState(prev => ({ ...prev, isLoading: true }));
      
      manager.initializeContext(contextId)
        .then(data => {
          setState({
            data,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        })
        .catch(error => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error,
          }));
        });
    }
  }, [contextId, manager]);

  return state;
}

/**
 * Hook para preload estratégico de contextos
 */
export function useContextPreloader() {
  const manager = OptimizedContextManager.getInstance();

  const preloadByRoute = useCallback((route: string) => {
    const routeContextMap: Record<string, string[]> = {
      '/': ['theme', 'auth', 'ui'],
      '/home': ['theme', 'auth', 'ui', 'profileCache'],
      '/feeds': ['theme', 'auth', 'ui', 'profileCache', 'hiddenPosts'],
      '/profile': ['theme', 'auth', 'ui', 'profileCache', 'bookmarks'],
      '/settings': ['theme', 'auth', 'ui', 'accessibility', 'moderation'],
      '/notifications': ['theme', 'auth', 'ui', 'profileCache'],
    };

    const contextsToPreload = routeContextMap[route] || ['theme', 'auth', 'ui'];
    contextsToPreload.forEach(contextId => {
      manager.preloadContext(contextId);
    });
  }, [manager]);

  const preloadByPriority = useCallback((priority: 'critical' | 'high' | 'medium' | 'low') => {
    manager.preloadContextsByPriority(priority);
  }, [manager]);

  const getStats = useCallback(() => {
    return manager.getStats();
  }, [manager]);

  return {
    preloadByRoute,
    preloadByPriority,
    getStats,
    reset: () => manager.reset(),
  };
}

/**
 * Hook para otimização automática de contextos baseada na rota
 */
export function useAutoContextOptimization(currentRoute: string) {
  const { preloadByRoute, preloadByPriority } = useContextPreloader();

  useEffect(() => {
    // Preload critical contexts immediately
    preloadByPriority('critical');
    
    // Preload route-specific contexts
    preloadByRoute(currentRoute);
    
    // Preload high priority contexts after a delay
    const timer = setTimeout(() => {
      preloadByPriority('high');
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentRoute, preloadByRoute, preloadByPriority]);
}

/**
 * Provider otimizado que gerencia lazy initialization
 */
interface OptimizedProviderProps {
  children: ReactNode;
  contextId: string;
  fallback?: ReactNode;
}

export function OptimizedProvider({ children, contextId, fallback }: OptimizedProviderProps) {
  const { data, isLoading, error } = useOptimizedContext(contextId);

  if (error) {
    console.error(`Error in OptimizedProvider for ${contextId}:`, error);
    return fallback || children;
  }

  if (isLoading) {
    return fallback || children;
  }

  return children;
}

export default OptimizedContextManager;