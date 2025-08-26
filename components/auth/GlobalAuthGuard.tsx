import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAtp } from '@/context/AtpContext';
import { useUI } from '@/context/UIContext';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';

interface GlobalAuthGuardProps {
  children: React.ReactNode;
}

const GlobalAuthGuard: React.FC<GlobalAuthGuardProps> = ({ children }) => {
  const { session, isLoadingSession, isProtectedRoute, requireAuth } = useAtp();
  const { openLoginModal } = useUI();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoadingSession) return;

    // Verificar se a rota atual requer autenticação
    if (isProtectedRoute(pathname) && !session) {
      console.log('🔒 GlobalAuthGuard: Protected route accessed without authentication:', pathname);
      
      // Redirecionar para home e abrir modal de login
      router.replace('/home' as any);
      
      // Pequeno delay para garantir que o redirecionamento aconteceu
      setTimeout(() => {
        openLoginModal();
      }, 100);
    }
  }, [pathname, session, isLoadingSession, isProtectedRoute, router, openLoginModal]);

  // Mostrar loading enquanto verifica a sessão
  if (isLoadingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.onSurface} />
      </View>
    );
  }

  return <>{children}</>;
};

export default GlobalAuthGuard;
