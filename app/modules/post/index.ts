// ============================================================================
// Post Module - Barrel Export
// ============================================================================
// 
// This module handles post-related functionality including:
// - Post rendering and display
// - Post interactions (like, repost, reply)
// - Post composition
// - Media handling
//

// Components
export { default as PostCard } from './PostCard';
export { default as FullPostCard } from './FullPostCard';
export { default as FullPostCardSkeleton } from './FullPostCardSkeleton';
export { default as PostScreen } from './PostScreen';
export { default as PostActions } from './PostActions';
export { default as PostActionsModal } from './PostActionsModal';
export { default as PostHeader } from './PostHeader';
export { default as PostPageWebActionBar } from './PostPageWebActionBar';
export { default as PostScreenActionBar } from './PostScreenActionBar';
export { default as QuotedPost } from './QuotedPost';
export { default as Reply } from './Reply';

// Hooks
export * from './hooks';

// Types
export * from './types';

// Utils
export * from './utils';

// ============================================================================
// MODULE CONFIGURATION
// ============================================================================

export const POST_MODULE_CONFIG = {
  name: 'post',
  version: '1.0.0',
  description: 'Post management and interaction module',
  features: [
    'post-display',
    'post-interactions',
    'post-composition',
    'media-handling',
    'thread-management',
    'post-moderation'
  ],
  dependencies: [
    '@core/api',
    '@core/utils',
    '@core/ui'
  ],
  exports: {
    components: [
      'PostCard',
      'FullPostCard',
      'FullPostCardSkeleton',
      'PostScreen',
      'PostActions',
      'PostActionsModal',
      'PostHeader',
      'PostPageWebActionBar',
      'PostScreenActionBar',
      'QuotedPost',
      'Reply'
    ],
    hooks: [
      'usePostActions',
      'usePostData',
      'useComposer'
    ],
    types: [
      'PostData',
      'PostInteraction',
      'ComposerState',
      'PostThread',
      'PostEmbed',
      'MediaUpload'
    ],
    utils: [
      'postUtils'
    ]
  }
} as const;