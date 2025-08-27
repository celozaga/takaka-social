// ============================================================================
// Profile Module - Barrel Export
// ============================================================================
// 
// This module handles profile-related functionality including:
// - Profile viewing and editing
// - Profile posts and media
// - Follow/unfollow actions
// - Profile customization
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

// ============================================================================
// Module Configuration
// ============================================================================

export const PROFILE_MODULE_CONFIG = {
  name: 'profile',
  version: '1.0.0',
  description: 'Profile management and social interactions',
  features: [
    'profile-viewing',
    'profile-editing',
    'follow-actions',
    'profile-customization',
    'social-interactions',
    'profile-analytics',
    'profile-discovery',
  ],
  dependencies: [
    '@atproto/api',
    'react',
  ],
  components: [
    'ProfileScreen',
    'ProfileHeader', 
    'ProfilePosts',
    'EditProfileModal',
    'FollowButton',
    'FollowsHeader',
    'FollowsScreen',
    'SuggestedFollows',
  ],
  hooks: [
    'useProfile',
    'useProfileActions',
    'useFollowActions',
  ],
  utils: [
    'profileParsers',
    'profileValidators',
    'profileFormatters',
    'profileFilters',
    'profileSorters',
    'profileCache',
  ],
} as const;