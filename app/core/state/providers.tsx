// ============================================================================
// State Providers
// ============================================================================
//
// Centralized state management providers for the application
// Combines all context providers in a single, composable structure
//

import React from 'react';
import { AtpProvider } from './AtpContext';
import { UIProvider } from './UIContext';
import { ModerationProvider } from './ModerationContext';
import { BookmarksProvider } from './BookmarksContext';
import { HiddenPostsProvider } from './HiddenPostsContext';

// ============================================================================
// TYPES
// ============================================================================

export interface AppProvidersProps {
  children: React.ReactNode;
}

// ============================================================================
// COMBINED PROVIDERS
// ============================================================================

/**
 * Combined providers component that wraps the entire application
 * with all necessary context providers in the correct order
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AtpProvider>
      <UIProvider>
        <ModerationProvider>
          <BookmarksProvider>
            <HiddenPostsProvider>
              {children}
            </HiddenPostsProvider>
          </BookmarksProvider>
        </ModerationProvider>
      </UIProvider>
    </AtpProvider>
  );
}

// ============================================================================
// INDIVIDUAL PROVIDER EXPORTS
// ============================================================================

// Re-export individual providers for granular usage
export {
  AtpProvider,
  UIProvider,
  ModerationProvider,
  BookmarksProvider,
  HiddenPostsProvider,
};

// ============================================================================
// HOOKS EXPORTS
// ============================================================================

// Re-export hooks for easy access
export { useAtp } from './AtpContext';
export { useUI } from './UIContext';
export { useModeration } from './ModerationContext';
export { useBookmarks } from './BookmarksContext';
export { useHiddenPosts } from './HiddenPostsContext';

// ============================================================================
// PROVIDER UTILITIES
// ============================================================================

/**
 * Higher-order component to wrap components with specific providers
 */
export function withProviders<P extends object>(
  Component: React.ComponentType<P>,
  providers: React.ComponentType<{ children: React.ReactNode }>[]
) {
  return function WrappedComponent(props: P) {
    return providers.reduceRight(
      (children, Provider) => <Provider>{children}</Provider>,
      <Component {...props} />
    );
  };
}

/**
 * Hook to check if a specific provider is available in the context tree
 */
export function useProviderCheck(providerName: string): boolean {
  try {
    switch (providerName) {
      case 'atp':
        useAtp();
        return true;
      case 'ui':
        useUI();
        return true;
      case 'moderation':
        useModeration();
        return true;
      case 'bookmarks':
        useBookmarks();
        return true;
      case 'hiddenPosts':
        useHiddenPosts();
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

export interface ProviderConfig {
  atp?: {
    service?: string;
    persistSession?: boolean;
  };
  ui?: {
    theme?: 'light' | 'dark' | 'auto';
    animations?: boolean;
  };
  moderation?: {
    strictMode?: boolean;
    autoHide?: boolean;
  };
}

/**
 * Configurable providers component
 */
export function ConfigurableProviders({
  children,
  config = {},
}: {
  children: React.ReactNode;
  config?: ProviderConfig;
}) {
  return (
    <AtpProvider {...config.atp}>
      <UIProvider {...config.ui}>
        <ModerationProvider {...config.moderation}>
          <BookmarksProvider>
            <HiddenPostsProvider>
              {children}
            </HiddenPostsProvider>
          </BookmarksProvider>
        </ModerationProvider>
      </UIProvider>
    </AtpProvider>
  );
}