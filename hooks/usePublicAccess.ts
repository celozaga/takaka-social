/**
 * Hook para gerenciar acesso público e tratamento de erros de autenticação
 * Fornece funcionalidades para usuários não autenticados
 */

import { useState, useEffect, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { publicApi } from '../lib/publicApi';

interface PublicAccessState {
  isPublicApiAvailable: boolean;
  isCheckingAvailability: boolean;
  lastError: Error | null;
  retryCount: number;
}

interface UsePublicAccessReturn extends PublicAccessState {
  // Estado
  isAuthenticated: boolean;
  canAccessContent: boolean;
  
  // Funções
  checkPublicApiAvailability: () => Promise<boolean>;
  retryPublicAccess: () => Promise<void>;
  resetErrors: () => void;
  
  // Wrappers seguros para API pública
  safeGetProfile: (actor: string) => Promise<any>;
  safeGetAuthorFeed: (actor: string, limit?: number) => Promise<any>;
  safeGetListFeed: (list: string, limit?: number) => Promise<any>;
  safeSearchPosts: (query: string, limit?: number) => Promise<any>;
}

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 2000; // 2 segundos

export const usePublicAccess = (): UsePublicAccessReturn => {
  const { session } = useAtp();
  
  const [state, setState] = useState<PublicAccessState>({
    isPublicApiAvailable: true, // Assume disponível inicialmente
    isCheckingAvailability: false,
    lastError: null,
    retryCount: 0
  });

  const isAuthenticated = !!session;
  const canAccessContent = isAuthenticated || state.isPublicApiAvailable;

  // Verifica disponibilidade da API pública
  const checkPublicApiAvailability = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isCheckingAvailability: true }));
    
    try {
      const isAvailable = await publicApi.isAvailable();
      
      setState(prev => ({
        ...prev,
        isPublicApiAvailable: isAvailable,
        isCheckingAvailability: false,
        lastError: null
      }));
      
      return isAvailable;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isPublicApiAvailable: false,
        isCheckingAvailability: false,
        lastError: error as Error
      }));
      
      return false;
    }
  }, []);

  // Tenta novamente o acesso público
  const retryPublicAccess = useCallback(async (): Promise<void> => {
    if (state.retryCount >= MAX_RETRY_COUNT) {
      console.warn('🔄 Max retry attempts reached for public API access');
      return;
    }

    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
    
    // Aguarda antes de tentar novamente
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    
    await checkPublicApiAvailability();
  }, [state.retryCount, checkPublicApiAvailability]);

  // Reseta erros e contador de tentativas
  const resetErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastError: null,
      retryCount: 0
    }));
  }, []);

  // Wrappers seguros para chamadas da API pública
  const safeGetProfile = useCallback(async (actor: string) => {
    console.log('🔍 DEBUG: safeGetProfile called for actor:', actor, 'isPublicApiAvailable:', state.isPublicApiAvailable);
    
    if (!state.isPublicApiAvailable) {
      console.log('🔍 DEBUG: Public API not available, skipping profile fetch for:', actor);
      return null;
    }

    try {
      console.log('🔍 DEBUG: Calling publicApi.getProfile for:', actor);
      const result = await publicApi.getProfile(actor);
      console.log('🔍 DEBUG: publicApi.getProfile result for:', actor, result);
      
      if (result) {
        console.log('✅ SUCCESS: Public profile fetched for:', actor, result);
        return result;
      } else {
        console.log('❌ ERROR: No profile data returned for:', actor);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to fetch public profile for:', actor, error);
      return null;
    }
  }, [state.isPublicApiAvailable]);

  const safeGetAuthorFeed = useCallback(async (actor: string, limit: number = 20) => {
    console.log('🔍 DEBUG: safeGetAuthorFeed called for actor:', actor, 'limit:', limit, 'isPublicApiAvailable:', state.isPublicApiAvailable);
    
    if (!state.isPublicApiAvailable) {
      console.log('🔍 DEBUG: Public API not available, skipping author feed fetch for:', actor);
      return null;
    }

    try {
      console.log('🔍 DEBUG: Calling publicApi.getAuthorFeed for:', actor);
      const result = await publicApi.getAuthorFeed(actor, limit);
      console.log('🔍 DEBUG: publicApi.getAuthorFeed result for:', actor, result);
      
      if (result?.data) {
        console.log('✅ SUCCESS: Public author feed fetched for:', actor, result.data);
        return result.data;
      } else {
        console.log('❌ ERROR: No author feed data returned for:', actor);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to fetch public author feed for:', actor, error);
      return null;
    }
  }, [state.isPublicApiAvailable]);

  const safeGetListFeed = useCallback(async (list: string, limit: number = 20) => {
    if (!isAuthenticated) {
      return await publicApi.getListFeed(list, limit);
    }
    
    return await publicApi.getListFeed(list, limit);
  }, [isAuthenticated]);

  const safeSearchPosts = useCallback(async (query: string, limit: number = 20) => {
    if (!isAuthenticated) {
      return await publicApi.searchPosts(query, limit);
    }
    
    return await publicApi.searchPosts(query, limit);
  }, [isAuthenticated]);

  // Verifica disponibilidade na inicialização (apenas se não autenticado)
  useEffect(() => {
    if (!isAuthenticated) {
      checkPublicApiAvailability();
    }
  }, [isAuthenticated, checkPublicApiAvailability]);

  // Auto-retry em caso de falha (com limite)
  useEffect(() => {
    if (!isAuthenticated && !state.isPublicApiAvailable && state.retryCount < MAX_RETRY_COUNT) {
      const timer = setTimeout(() => {
        retryPublicAccess();
      }, RETRY_DELAY * (state.retryCount + 1)); // Backoff exponencial
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, state.isPublicApiAvailable, state.retryCount, retryPublicAccess]);

  return {
    // Estado
    ...state,
    isAuthenticated,
    canAccessContent,
    
    // Funções
    checkPublicApiAvailability,
    retryPublicAccess,
    resetErrors,
    
    // Wrappers seguros
    safeGetProfile,
    safeGetAuthorFeed,
    safeGetListFeed,
    safeSearchPosts
  };
};

export default usePublicAccess;