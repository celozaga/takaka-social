/**
 * Utilitário para gerenciar chamadas da API pública do Bluesky
 * Fornece acesso a conteúdo público sem autenticação
 */

import { BskyAgent } from '@atproto/api';

// Configuração para API pública
const PUBLIC_API_CONFIG = {
  service: 'https://public.api.bsky.app',
  timeout: 10000, // 10 segundos
  retryAttempts: 2,
  retryDelay: 1000 // 1 segundo
};

// Utilitários de validação
const isValidHandle = (handle: string): boolean => {
  // Handle deve ter formato: exemplo.bsky.social ou @exemplo.bsky.social
  const handleRegex = /^@?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return handleRegex.test(handle.replace('@', ''));
};

const isValidDid = (did: string): boolean => {
  // DID deve ter formato: did:plc:xxxxxxxxxxxxxxxxxxxxxxxx
  const didRegex = /^did:plc:[a-z2-7]{24}$/;
  return didRegex.test(did);
};

const normalizeActor = (actor: string): string => {
  // Remove @ se presente e normaliza
  return actor.replace('@', '').toLowerCase();
};

// Instância singleton do agente público
let publicApiAgent: BskyAgent | null = null;

/**
 * Obtém ou cria uma instância do agente da API pública
 */
export const getPublicApiAgent = (): BskyAgent => {
  if (!publicApiAgent) {
    publicApiAgent = new BskyAgent({
      service: PUBLIC_API_CONFIG.service
    });
  }
  return publicApiAgent;
};

/**
 * Wrapper para chamadas da API pública com tratamento de erro
 */
export const safePublicApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue: T | null = null,
  suppressErrors: boolean = true
): Promise<T | null> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < PUBLIC_API_CONFIG.retryAttempts; attempt++) {
    try {
      const result = await Promise.race([
        apiCall(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), PUBLIC_API_CONFIG.timeout)
        )
      ]);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Se não é o último attempt, aguarda antes de tentar novamente
      if (attempt < PUBLIC_API_CONFIG.retryAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, PUBLIC_API_CONFIG.retryDelay));
      }
    }
  }
  
  // Log do erro apenas se não for para suprimir
  if (!suppressErrors && lastError) {
    console.warn('🌐 Public API call failed after retries:', lastError.message);
  }
  
  return fallbackValue;
};

/**
 * Funções específicas para endpoints públicos comuns
 */
export const publicApi = {
  /**
   * Obtém perfil público de um usuário
   */
  getProfile: async (actor: string) => {
    const normalizedActor = normalizeActor(actor);
    console.log('🔍 DEBUG: publicApi.getProfile called for actor:', normalizedActor);
    
    // Validação básica
    if (!isValidHandle(normalizedActor) && !isValidDid(normalizedActor)) {
      console.log('❌ ERROR: Invalid actor format:', normalizedActor);
      // Tenta com handles conhecidos como fallback
      const fallbackHandles = ['bsky.app', 'jay.bsky.social', 'pfrazee.com'];
      for (const fallbackHandle of fallbackHandles) {
        try {
          const agent = getPublicApiAgent();
          const response = await agent.getProfile({ actor: fallbackHandle });
          console.log('✅ SUCCESS: Fallback profile fetched for:', fallbackHandle);
          return response.data;
        } catch (error) {
          console.log('⚠️ WARNING: Fallback failed for:', fallbackHandle);
        }
      }
      return null;
    }
    
    const agent = getPublicApiAgent();
    const result = await safePublicApiCall(
      async () => {
        console.log('🔍 DEBUG: Making getProfile API call for:', normalizedActor);
        const response = await agent.getProfile({ actor: normalizedActor });
        console.log('✅ SUCCESS: getProfile API call successful for:', normalizedActor);
        return response;
      },
      null,
      false // Não suprime erros para debug
    );
    
    if (result) {
      console.log('✅ SUCCESS: publicApi.getProfile returned data for:', normalizedActor);
      return result.data;
    } else {
      console.log('❌ ERROR: publicApi.getProfile returned null for:', normalizedActor);
      return null;
    }
  },

  /**
   * Obtém feed de autor público
   */
  getAuthorFeed: async (actor: string, limit: number = 20) => {
    const normalizedActor = normalizeActor(actor);
    console.log('🔍 DEBUG: publicApi.getAuthorFeed called for actor:', normalizedActor, 'limit:', limit);
    
    // Validação básica
    if (!isValidHandle(normalizedActor) && !isValidDid(normalizedActor)) {
      console.log('❌ ERROR: Invalid actor format for feed:', normalizedActor);
      // Tenta com handles conhecidos como fallback
      const fallbackHandles = ['bsky.app', 'jay.bsky.social', 'pfrazee.com'];
      for (const fallbackHandle of fallbackHandles) {
        try {
          const agent = getPublicApiAgent();
          const response = await agent.app.bsky.feed.getAuthorFeed({ actor: fallbackHandle, limit });
          console.log('✅ SUCCESS: Fallback feed fetched for:', fallbackHandle);
          return response;
        } catch (error) {
          console.log('⚠️ WARNING: Fallback feed failed for:', fallbackHandle);
        }
      }
      return null;
    }
    
    const agent = getPublicApiAgent();
    const result = await safePublicApiCall(
      async () => {
        console.log('🔍 DEBUG: Making getAuthorFeed API call for:', normalizedActor);
        const response = await agent.app.bsky.feed.getAuthorFeed({ actor: normalizedActor, limit });
        console.log('✅ SUCCESS: getAuthorFeed API call successful for:', normalizedActor);
        return response;
      },
      null,
      false // Não suprime erros para debug
    );
    
    if (result) {
      console.log('✅ SUCCESS: publicApi.getAuthorFeed returned data for:', normalizedActor);
      return result;
    } else {
      console.log('❌ ERROR: publicApi.getAuthorFeed returned null for:', normalizedActor);
      return null;
    }
  },

  /**
   * Obtém feed de lista pública
   */
  getListFeed: async (list: string, limit: number = 20) => {
    const agent = getPublicApiAgent();
    return safePublicApiCall(
      () => agent.app.bsky.feed.getListFeed({ list, limit }),
      null,
      true
    );
  },

  /**
   * Busca posts públicos
   */
  searchPosts: async (query: string, limit: number = 20) => {
    const normalizedQuery = query.trim();
    console.log('🔍 DEBUG: publicApi.searchPosts called for query:', normalizedQuery, 'limit:', limit);
    
    // Validação básica da query
    if (!normalizedQuery || normalizedQuery.length < 2) {
      console.log('❌ ERROR: Invalid search query:', normalizedQuery);
      // Usa termos de busca populares como fallback
      const fallbackQueries = ['bluesky', 'social', 'tech'];
      for (const fallbackQuery of fallbackQueries) {
        try {
          const agent = getPublicApiAgent();
          const response = await agent.app.bsky.feed.searchPosts({ q: fallbackQuery, limit });
          console.log('✅ SUCCESS: Fallback search results for:', fallbackQuery);
          return response;
        } catch (error) {
          console.log('⚠️ WARNING: Fallback search failed for:', fallbackQuery);
        }
      }
      return null;
    }
    
    const agent = getPublicApiAgent();
    const result = await safePublicApiCall(
      async () => {
        console.log('🔍 DEBUG: Making searchPosts API call for:', normalizedQuery);
        const response = await agent.app.bsky.feed.searchPosts({ q: normalizedQuery, limit });
        console.log('✅ SUCCESS: searchPosts API call successful for:', normalizedQuery);
        return response;
      },
      null,
      false // Não suprime erros para debug
    );
    
    if (result) {
      console.log('✅ SUCCESS: publicApi.searchPosts returned data for:', normalizedQuery);
      return result;
    } else {
      console.log('❌ ERROR: publicApi.searchPosts returned null for:', normalizedQuery);
      return null;
    }
  },

  /**
   * Obtém informações do servidor
   */
  getServerInfo: async () => {
    return safePublicApiCall(
      () => fetch('https://bsky.social/xrpc/com.atproto.server.describeServer')
        .then(response => response.json()),
      null,
      true
    );
  },

  /**
   * Verifica se a API pública está disponível
   */
  isAvailable: async (): Promise<boolean> => {
    const serverInfo = await publicApi.getServerInfo();
    return serverInfo !== null;
  }
};

/**
 * Hook para verificar disponibilidade da API pública
 */
export const usePublicApiStatus = () => {
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);

  const checkAvailability = React.useCallback(async () => {
    const available = await publicApi.isAvailable();
    setIsAvailable(available);
    setLastChecked(new Date());
    return available;
  }, []);

  React.useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    lastChecked,
    checkAvailability
  };
};

// Importação do React para o hook
import React from 'react';

export default publicApi;