// ============================================================================
// State Core Module - Barrel Export
// ============================================================================
// 
// This module handles all state management functionality including:
// - Context providers (AtpProvider, UIProvider, etc.)
// - Combined providers for easy setup
// - State hooks and utilities
// - Session persistence
//

// ============================================================================
// PROVIDERS
// ============================================================================

// Combined Providers
export {
  AppProviders,
  ConfigurableProviders,
  withProviders,
  useProviderCheck,
} from './providers';
export type { AppProvidersProps, ProviderConfig } from './providers';

// Individual Context Providers
export { AtpProvider, useAtp } from './AtpContext';
export { UIProvider, useUI } from './UIContext';
export { ModerationProvider, useModeration } from './ModerationContext';
export { BookmarksProvider, useBookmarks } from './BookmarksContext';
export { HiddenPostsProvider, useHiddenPosts } from './HiddenPostsContext';

// ============================================================================
// HOOKS
// ============================================================================

// State hooks for common functionality
export const useTheme = () => {
  const { theme, setTheme } = useUI();
  return { theme, setTheme };
};

export const useToast = () => {
  const { showToast, hideToast } = useUI();
  return { showToast, hideToast };
};

export const useSession = () => {
  const { session, login, logout, isAuthenticated } = useAtp();
  return { session, login, logout, isAuthenticated };
};

// ============================================================================
// TYPES
// ============================================================================

// Re-export context types
export type { AtpContextType } from './AtpContext';
export type { UIContextType } from './UIContext';
export type { ModerationContextType } from './ModerationContext';
export type { BookmarksContextType } from './BookmarksContext';
export type { HiddenPostsContextType } from './HiddenPostsContext';

// ============================================================================
// UTILITIES
// ============================================================================

// State utilities
export const stateUtils = {
  // Check if user is authenticated
  isAuthenticated: (session: any): boolean => {
    return !!session?.accessJwt;
  },

  // Get user DID from session
  getUserDid: (session: any): string | null => {
    return session?.did || null;
  },

  // Get user handle from session
  getUserHandle: (session: any): string | null => {
    return session?.handle || null;
  },

  // Format session data for storage
  formatSessionForStorage: (session: any) => {
    if (!session) return null;
    return {
      did: session.did,
      handle: session.handle,
      accessJwt: session.accessJwt,
      refreshJwt: session.refreshJwt,
      email: session.email,
    };
  },

  // Validate session data
  isValidSession: (session: any): boolean => {
    return !!(session?.did && session?.accessJwt && session?.refreshJwt);
  },
};