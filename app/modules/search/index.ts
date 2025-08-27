// ============================================================================
// Search Module - Main Index
// ============================================================================
//
// This file serves as the main entry point for the search module,
// providing a clean API for importing search-related functionality.
//

// ============================================================================
// Module Exports
// ============================================================================

// Components
export * from './components';

// Hooks
export * from './hooks';

// Types
export * from './types';

// Utilities
export * from './utils';

// Module configuration
export const SEARCH_MODULE_CONFIG = {
  name: 'search',
  version: '1.0.0',
  description: 'Search functionality for profiles, posts, feeds, and hashtags',
  features: [
    'Global search',
    'Search suggestions',
    'Search history',
    'Trending topics',
    'Advanced filters',
    'Real-time results',
    'Search analytics',
  ],
  dependencies: [
    '@takaka/core/api',
    '@takaka/core/state',
    '@takaka/modules/profile',
    '@takaka/modules/post',
    '@takaka/modules/feed',
  ],
  components: [
    'SearchScreen',
    'TrendingTopics', 
    'ActorSearchResultCard',
  ],
  hooks: [
    'useSearch',
    'useSearchHistory',
    'useTrending',
    'useSearchSuggestions',
  ],
  utils: [
    'searchQueryUtils',
    'searchResultUtils',
    'searchHistoryUtils',
    'trendingUtils',
    'searchCacheUtils',
  ],
} as const;