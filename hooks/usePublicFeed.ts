/**
 * Hook para gerenciar feeds públicos com fallbacks apropriados
 * Integra com o sistema de acesso público e fornece estados consistentes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicAccess } from './usePublicAccess';
import { useAtp } from '../context/AtpContext';

interface UsePublicFeedOptions {
  feedType: 'profile' | 'author' | 'list' | 'search' | 'timeline';
  actor?: string;
  list?: string;
  query?: string;
  limit?: number;
  requiresAuth?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePublicFeedResult {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  canAccess: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

export const usePublicFeed = (options: UsePublicFeedOptions): UsePublicFeedResult => {
  const {
    feedType,
    actor,
    list,
    query,
    limit = 25,
    requiresAuth = false,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const { agent } = useAtp();
  const {
    isAuthenticated,
    canAccessContent,
    safeGetProfile,
    safeGetAuthorFeed,
    safeGetListFeed,
    safeSearchPosts,
    retryPublicAccess
  } = usePublicAccess();

  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  const refreshIntervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Limpa interval quando componente desmonta
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        window.clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Função para buscar dados
  const fetchData = useCallback(async (isLoadMore = false, customCursor?: string) => {
    if (!canAccessContent && !isAuthenticated) {
      setError('Acesso ao conteúdo não disponível');
      return;
    }

    if (requiresAuth && !isAuthenticated) {
      setError('Autenticação necessária');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result = null;
      const useCursor = customCursor || (isLoadMore ? cursor : undefined);

      switch (feedType) {
        case 'profile':
          if (actor) {
            result = await safeGetProfile(actor);
            // Para perfis, não há paginação típica
            setHasMore(false);
          }
          break;

        case 'author':
          if (actor) {
            result = await safeGetAuthorFeed(actor, limit);
          }
          break;

        case 'list':
          if (list) {
            result = await safeGetListFeed(list, limit);
          }
          break;

        case 'search':
          if (query) {
            result = await safeSearchPosts(query, limit);
          }
          break;

        case 'timeline':
          if (isAuthenticated && agent) {
            try {
              const response = await agent.getTimeline({ limit, cursor: useCursor });
              result = response.data;
            } catch (err) {
              console.warn('Timeline fetch failed:', err);
              throw err;
            }
          }
          break;

        default:
          throw new Error(`Tipo de feed não suportado: ${feedType}`);
      }

      if (!mountedRef.current) return;

      if (result) {
        const newData = result.feed || result.posts || [result]; // Adapta diferentes formatos
        
        if (isLoadMore) {
          setData(prev => prev ? [...prev, ...newData] : newData);
        } else {
          setData(newData);
        }

        // Atualiza cursor e hasMore
        setCursor(result.cursor);
        setHasMore(!!result.cursor && newData.length === limit);
      } else {
        if (!isLoadMore) {
          setData([]);
        }
        setHasMore(false);
      }
    } catch (err: any) {
      console.warn(`Feed fetch failed for ${feedType}:`, err);
      
      if (!mountedRef.current) return;
      
      setError(err.message || 'Erro ao carregar feed');
      
      if (!isLoadMore) {
        setData(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [feedType, actor, list, query, limit, cursor, canAccessContent, isAuthenticated, requiresAuth, agent, safeGetProfile, safeGetAuthorFeed, safeGetListFeed, safeSearchPosts]);

  // Função de refresh
  const refresh = useCallback(async () => {
    setCursor(undefined);
    setHasMore(true);
    await fetchData(false);
  }, [fetchData]);

  // Função de load more
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchData(true);
  }, [hasMore, loading, fetchData]);

  // Função de retry
  const retry = useCallback(async () => {
    await retryPublicAccess();
    await refresh();
  }, [retryPublicAccess, refresh]);

  // Carrega dados iniciais
  useEffect(() => {
    if (canAccessContent || isAuthenticated) {
      fetchData();
    }
  }, [canAccessContent, isAuthenticated, feedType, actor, list, query]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && data) {
      refreshIntervalRef.current = window.setInterval(() => {
        if (!loading) {
          refresh();
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          window.clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, data, loading, refresh]);

  return {
    data,
    loading,
    error,
    hasMore,
    canAccess: canAccessContent || isAuthenticated,
    isAuthenticated,
    refresh,
    loadMore,
    retry
  };
};

export default usePublicFeed;