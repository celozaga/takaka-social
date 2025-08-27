// ============================================================================
// Feed Module - Barrel Export
// ============================================================================
// 
// This module handles feed-related functionality including:
// - Feed listing and management
// - Feed discovery
// - Feed preferences and customization
// - Popular feeds
//

// ============================================================================
// COMPONENTS
// ============================================================================

export { default as FeedsScreen } from './FeedsScreen';
export { default as FeedAvatar } from './FeedAvatar';
export { default as PopularFeeds } from './PopularFeeds';
export { default as FeedSelector } from './FeedSelector';
export { default as FeedHeaderModal } from './FeedHeaderModal';
export { default as FeedSearchResultCard } from './FeedSearchResultCard';
export { default as FeedViewHeader } from './FeedViewHeader';
export { default as FeedViewScreen } from './FeedViewScreen';

// ============================================================================
// HOOKS
// ============================================================================

export * from './hooks';

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// UTILS
// ============================================================================

export * from './utils';
export { default as feedUtils } from './utils';

// ============================================================================
// MODULE CONFIGURATION
// ============================================================================

export const FEED_MODULE_CONFIG = {
  name: 'feed',
  version: '1.0.0',
  description: 'Feed management and discovery module',
  features: [
    'feed-listing',
    'feed-discovery',
    'feed-preferences',
    'feed-search',
    'saved-feeds',
    'popular-feeds',
  ],
  dependencies: [
    '@core/api',
    '@core/state',
    '@core/ui',
    '@core/utils',
  ],
} as const;