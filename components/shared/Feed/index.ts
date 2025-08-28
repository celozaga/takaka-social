// ============================================================================
// Feed Component Library - Barrel Export
// ============================================================================
// 
// This file exports all feed components for easy importing throughout the app.
// Components are organized by responsibility for better maintainability.
//

// Main Feed Container (orchestrates data and state)
export { default as FeedContainer } from './FeedContainer';

// Feed List Component (handles rendering of lists)
export { default as FeedList } from './FeedList';

// Feed Item Component (renders individual feed items)
export { default as FeedItem } from './FeedItem';

// Public Feed Wrapper (handles public access and authentication fallbacks)
export { PublicFeedWrapper } from './PublicFeedWrapper';

// Main Feed Component (with public access support)
export { default } from './Feed';
