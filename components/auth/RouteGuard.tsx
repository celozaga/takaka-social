import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAtp } from '@/context/AtpContext';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requireAuth = false, 
  redirectTo = '/home' 
}) => {
  const { session, isLoadingSession } = useAtp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingSession && requireAuth && !session) {
      console.log('🔒 RouteGuard: Redirecting unauthenticated user from protected route');
      router.replace(redirectTo as any);
    }
  }, [session, isLoadingSession, requireAuth, redirectTo, router]);

  // Show loading while checking session
  if (isLoadingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.onSurface} />
      </View>
    );
  }

  // If route requires auth and user is not authenticated, don't render children
  if (requireAuth && !session) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard;
