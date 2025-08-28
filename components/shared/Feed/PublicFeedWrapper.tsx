import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePublicAccess } from '../../../hooks/usePublicAccess';
import { PublicContentFallback, NetworkErrorFallback, AuthRequiredFallback } from '../PublicContentFallback';
import { LoadingSpinner } from '../Loading';
import { useTheme } from '../Theme';

interface PublicFeedWrapperProps {
  children: React.ReactNode;
  feedType: 'profile' | 'author' | 'list' | 'search' | 'timeline';
  actor?: string;
  list?: string;
  query?: string;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
  fallbackMessage?: string;
}

export const PublicFeedWrapper: React.FC<PublicFeedWrapperProps> = ({
  children,
  feedType,
  actor,
  list,
  query,
  requiresAuth = false,
  onAuthRequired,
  fallbackMessage
}) => {
  const { theme } = useTheme();
  const {
    isAuthenticated,
    canAccessContent,
    isPublicApiAvailable,
    isCheckingAvailability,
    lastError,
    retryPublicAccess,
    resetErrors,
    safeGetProfile,
    safeGetListFeed,
    safeSearchPosts
  } = usePublicAccess();

  const [hasTestedAccess, setHasTestedAccess] = useState(false);
  const [accessTestResult, setAccessTestResult] = useState<'success' | 'failed' | 'pending'>('pending');

  // Testa acesso ao conteúdo específico
  const testContentAccess = useCallback(async () => {
    if (isAuthenticated || hasTestedAccess) return;
    
    setAccessTestResult('pending');

    try {
      let testResult = null;
      
      switch (feedType) {
        case 'profile':
        case 'author':
          if (actor) {
            testResult = await safeGetProfile(actor);
          }
          break;
        case 'list':
          if (list) {
            testResult = await safeGetListFeed(list, 1);
          }
          break;
        case 'search':
          if (query) {
            testResult = await safeSearchPosts(query, 1);
          }
          break;
        default:
          // Para timeline e outros, assume que precisa de auth
          if (!isAuthenticated) {
            setAccessTestResult('failed');
            setHasTestedAccess(true);
            return;
          }
      }
      
      setAccessTestResult(testResult ? 'success' : 'failed');
    } catch (error) {
      console.warn(`🔍 Content access test failed for ${feedType}:`, error);
      setAccessTestResult('failed');
    } finally {
      setHasTestedAccess(true);
    }
  }, [feedType, actor, list, query, isAuthenticated, hasTestedAccess, safeGetProfile, safeGetListFeed, safeSearchPosts]);

  // Executa teste de acesso quando necessário
  useEffect(() => {
    if (!requiresAuth && !isAuthenticated && !hasTestedAccess) {
      testContentAccess();
    }
  }, [requiresAuth, isAuthenticated, hasTestedAccess, testContentAccess]);

  // Reset quando parâmetros mudam
  useEffect(() => {
    setHasTestedAccess(false);
    setAccessTestResult('pending');
    resetErrors();
  }, [feedType, actor, list, query, resetErrors]);

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    loadingContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200
    }
  });

  // Mostra loading durante verificação inicial
  if (isCheckingAvailability || (!isAuthenticated && accessTestResult === 'pending')) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  // Se requer autenticação e usuário não está logado
  if (requiresAuth && !isAuthenticated) {
    return (
      <AuthRequiredFallback onLogin={onAuthRequired} />
    );
  }

  // Se não pode acessar conteúdo (API pública indisponível)
  if (!canAccessContent) {
    return (
      <NetworkErrorFallback onRetry={retryPublicAccess} />
    );
  }

  // Se teste de acesso falhou para usuário não autenticado
  if (!isAuthenticated && accessTestResult === 'failed') {
    return (
      <PublicContentFallback
        type="auth"
        message={fallbackMessage || "Este conteúdo requer autenticação ou não está disponível publicamente."}
        onRetry={onAuthRequired}
        showRetryButton={!!onAuthRequired}
      />
    );
  }

  // Se há erro de rede
  if (lastError) {
    return (
      <NetworkErrorFallback onRetry={retryPublicAccess} />
    );
  }

  // Renderiza o conteúdo normalmente
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

export default PublicFeedWrapper;