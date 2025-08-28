/**
 * Componente de fallback para conteúdo público
 * Exibido quando a API pública não está disponível ou falha
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../Theme';
import { PrimaryButton } from '../Button';
import Card from '../Card';

interface PublicContentFallbackProps {
  title?: string;
  message?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
  type?: 'network' | 'auth' | 'content' | 'generic';
}

const FALLBACK_MESSAGES = {
  network: {
    title: 'Conexão Indisponível',
    message: 'Não foi possível conectar aos servidores do Bluesky. Verifique sua conexão e tente novamente.'
  },
  auth: {
    title: 'Acesso Limitado',
    message: 'Alguns conteúdos requerem autenticação. Faça login para ver mais posts e interagir.'
  },
  content: {
    title: 'Conteúdo Indisponível',
    message: 'Este conteúdo não está disponível no momento. Tente novamente mais tarde.'
  },
  generic: {
    title: 'Algo deu errado',
    message: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.'
  }
};

export const PublicContentFallback: React.FC<PublicContentFallbackProps> = ({
  title,
  message,
  showRetryButton = true,
  onRetry,
  type = 'generic'
}) => {
  const { theme } = useTheme();
  
  const fallbackContent = FALLBACK_MESSAGES[type];
  const displayTitle = title || fallbackContent.title;
  const displayMessage = message || fallbackContent.message;

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200
    },
    icon: {
      fontSize: 48,
      marginBottom: theme.spacing.md,
      opacity: 0.6
    },
    title: {
      fontSize: theme.typography.titleLarge.fontSize,
        fontWeight: theme.typography.titleLarge.fontWeight,
        color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.sm
    },
    message: {
      fontSize: theme.typography.bodyMedium.fontSize,
        color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.lg
    },
    retryButton: {
      marginTop: theme.spacing.md
    }
  });

  const getIcon = () => {
    switch (type) {
      case 'network':
        return '🌐';
      case 'auth':
        return '🔒';
      case 'content':
        return '📄';
      default:
        return '⚠️';
    }
  };

  return (
    <Card>
      <View style={styles.container}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.message}>{displayMessage}</Text>
        
        {showRetryButton && onRetry && (
          <PrimaryButton
            title="Tentar Novamente"
            onPress={onRetry}
            style={styles.retryButton}
          />
        )}
      </View>
    </Card>
  );
};

/**
 * Componente específico para erro de autenticação
 */
export const AuthRequiredFallback: React.FC<{
  onLogin?: () => void;
}> = ({ onLogin }) => {
  return (
    <PublicContentFallback
      type="auth"
      showRetryButton={!!onLogin}
      onRetry={onLogin}
    />
  );
};

/**
 * Componente específico para erro de rede
 */
export const NetworkErrorFallback: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => {
  return (
    <PublicContentFallback
      type="network"
      onRetry={onRetry}
    />
  );
};

/**
 * Componente específico para conteúdo indisponível
 */
export const ContentUnavailableFallback: React.FC<{
  customMessage?: string;
}> = ({ customMessage }) => {
  return (
    <PublicContentFallback
      type="content"
      message={customMessage}
      showRetryButton={false}
    />
  );
};

export default PublicContentFallback;