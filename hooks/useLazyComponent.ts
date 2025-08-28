import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { useEffect, useState } from 'react';

interface LazyComponentOptions {
  preload?: boolean;
  preloadDelay?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface LazyComponentState<T extends ComponentType<any>> {
  Component: LazyExoticComponent<T> | null;
  isLoading: boolean;
  error: Error | null;
  preload: () => void;
  retry: () => void;
}

/**
 * Hook personalizado para gerenciar lazy loading de componentes com recursos avançados
 * @param importFn Função que retorna a promise do import dinâmico
 * @param options Opções de configuração
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyComponentState<T> {
  const {
    preload = false,
    preloadDelay = 1000,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [Component, setComponent] = useState<LazyExoticComponent<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempts, setAttempts] = useState(0);

  const createLazyComponent = () => {
    return lazy(async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const module = await importFn();
        setIsLoading(false);
        setAttempts(0);
        return module;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setIsLoading(false);
        
        if (attempts < retryAttempts) {
          setTimeout(() => {
            setAttempts(prev => prev + 1);
            preloadComponent();
          }, retryDelay);
        }
        
        throw error;
      }
    });
  };

  const preloadComponent = () => {
    if (!Component) {
      const LazyComp = createLazyComponent();
      setComponent(LazyComp);
      
      // Trigger preload
      importFn().catch(() => {
        // Silently handle preload errors
      });
    }
  };

  const retry = () => {
    setError(null);
    setAttempts(0);
    preloadComponent();
  };

  useEffect(() => {
    if (preload) {
      const timer = setTimeout(preloadComponent, preloadDelay);
      return () => clearTimeout(timer);
    }
  }, [preload, preloadDelay]);

  useEffect(() => {
    if (!Component) {
      setComponent(createLazyComponent());
    }
  }, []);

  return {
    Component,
    isLoading,
    error,
    preload: preloadComponent,
    retry
  };
}

/**
 * Hook para precarregar múltiplos componentes
 */
export function usePreloadComponents(
  components: Array<() => Promise<any>>,
  delay = 2000
) {
  useEffect(() => {
    const timer = setTimeout(() => {
      components.forEach(importFn => {
        importFn().catch(() => {
          // Silently handle preload errors
        });
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [components, delay]);
}

/**
 * Componentes lazy pré-configurados para uso comum
 */
export const lazyComponents = {
  LoginScreen: lazy(() => import('@/components/auth/LoginScreen')),
  Composer: lazy(() => import('@/components/composer/Composer')),
  FeedHeaderModal: lazy(() => import('@/components/feeds/FeedHeaderModal')),
  EditProfileModal: lazy(() => import('@/components/profile/EditProfileModal')),
  UpdateEmailModal: lazy(() => import('@/components/settings/UpdateEmailModal')),
  UpdateHandleModal: lazy(() => import('@/components/settings/UpdateHandleModal')),
  MediaActionsModal: lazy(() => import('@/components/shared/MediaActionsModal')),
  RepostModal: lazy(() => import('@/components/shared/RepostModal')),
  RepliesModal: lazy(() => import('@/components/replies/RepliesModal')),
};

/**
 * Preload estratégico baseado na rota atual
 */
export function useRouteBasedPreload(currentRoute: string) {
  useEffect(() => {
    const preloadMap: Record<string, Array<() => Promise<any>>> = {
      '/': [
        () => import('@/components/composer/Composer'),
        () => import('@/components/auth/LoginScreen'),
      ],
      '/profile': [
        () => import('@/components/profile/EditProfileModal'),
        () => import('@/components/settings/UpdateEmailModal'),
        () => import('@/components/settings/UpdateHandleModal'),
      ],
      '/feeds': [
        () => import('@/components/feeds/FeedHeaderModal'),
        () => import('@/components/composer/Composer'),
      ],
    };

    const componentsToPreload = preloadMap[currentRoute];
    if (componentsToPreload) {
      const timer = setTimeout(() => {
        componentsToPreload.forEach(importFn => {
          importFn().catch(() => {
            // Silently handle preload errors
          });
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentRoute]);
}