import { useCallback } from 'react';
import { useAtp } from '@/context/AtpContext';
import { useUI } from '@/context/UIContext';

interface UseAuthGuardReturn {
  requireAuth: (action?: string) => boolean;
  protectAction: (action: () => void, actionName?: string) => void;
  isFeatureEnabled: (feature: string) => boolean;
}

export const useAuthGuard = (): UseAuthGuardReturn => {
  const { session, requireAuth: baseRequireAuth } = useAtp();
  const { openLoginModal } = useUI();

  const requireAuth = useCallback((action?: string) => {
    if (!session) {
      console.log(`🔒 AuthGuard: Authentication required for action: ${action || 'unknown'}`);
      openLoginModal();
      return false;
    }
    return true;
  }, [session, openLoginModal]);

  const protectAction = useCallback((action: () => void, actionName?: string) => {
    if (requireAuth(actionName)) {
      action();
    }
  }, [requireAuth]);

  const isFeatureEnabled = useCallback((feature: string) => {
    const protectedFeatures = [
      'bookmark',
      'mute', 
      'block',
      'report',
      'compose',
      'edit_profile',
      'feed_customization',
      'media_actions'
    ];

    if (protectedFeatures.includes(feature)) {
      return !!session;
    }

    return true; // Features não protegidas sempre habilitadas
  }, [session]);

  return {
    requireAuth,
    protectAction,
    isFeatureEnabled
  };
};
