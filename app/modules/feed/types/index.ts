// ============================================================================
// Feed Module Types
// ============================================================================
//
// Type definitions for feed-related functionality
//

// ============================================================================
// CORE FEED TYPES
// ============================================================================

export interface SavedFeed {
  id: string;
  type: 'feed' | 'list';
  value: string; // Feed URI or list URI
  displayName?: string;
  pinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedPreferences {
  showReplies?: boolean;
  showReposts?: boolean;
  showQuotePosts?: boolean;
  hideRepliesByUnfollowed?: boolean;
  hideRepliesByLikeCount?: number;
  hideReposts?: boolean;
  hideQuotePosts?: boolean;
  adultContentEnabled?: boolean;
  contentLanguages?: string[];
}

export interface FeedGenerator {
  uri: string;
  cid: string;
  did: string;
  creator: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
    associated?: {
      chat?: {
        allowIncoming: 'all' | 'none' | 'following';
      };
    };
    viewer?: {
      muted?: boolean;
      blockedBy?: boolean;
      blocking?: string;
      following?: string;
      followedBy?: string;
    };
    labels?: any[];
    createdAt?: string;
  };
  displayName: string;
  description?: string;
  descriptionFacets?: any[];
  avatar?: string;
  likeCount?: number;
  acceptsInteractions?: boolean;
  labels?: any[];
  viewer?: {
    like?: string;
  };
  indexedAt: string;
}

export interface FeedViewPost {
  post: {
    uri: string;
    cid: string;
    author: {
      did: string;
      handle: string;
      displayName?: string;
      avatar?: string;
      associated?: {
        chat?: {
          allowIncoming: 'all' | 'none' | 'following';
        };
      };
      viewer?: {
        muted?: boolean;
        blockedBy?: boolean;
        blocking?: string;
        following?: string;
        followedBy?: string;
      };
      labels?: any[];
      createdAt?: string;
    };
    record: {
      $type: string;
      createdAt: string;
      text: string;
      facets?: any[];
      reply?: {
        root: {
          uri: string;
          cid: string;
        };
        parent: {
          uri: string;
          cid: string;
        };
      };
      embed?: any;
      langs?: string[];
      labels?: any;
      tags?: string[];
    };
    embed?: any;
    replyCount: number;
    repostCount: number;
    likeCount: number;
    quoteCount?: number;
    indexedAt: string;
    viewer?: {
      repost?: string;
      like?: string;
      threadMuted?: boolean;
      replyDisabled?: boolean;
      embeddingDisabled?: boolean;
      pinned?: boolean;
    };
    labels?: any[];
    threadgate?: any;
  };
  reply?: {
    root: FeedViewPost;
    parent: FeedViewPost;
    grandparentAuthor?: {
      did: string;
      handle: string;
      displayName?: string;
      avatar?: string;
    };
  };
  reason?: {
    $type: string;
    by: {
      did: string;
      handle: string;
      displayName?: string;
      avatar?: string;
      associated?: {
        chat?: {
          allowIncoming: 'all' | 'none' | 'following';
        };
      };
      viewer?: {
        muted?: boolean;
        blockedBy?: boolean;
        blocking?: string;
        following?: string;
        followedBy?: string;
      };
      labels?: any[];
      createdAt?: string;
    };
    indexedAt: string;
  };
  feedContext?: string;
}

export interface FeedTimeline {
  feed: FeedViewPost[];
  cursor?: string;
}

// ============================================================================
// FEED DISCOVERY TYPES
// ============================================================================

export interface PopularFeedGenerator extends FeedGenerator {
  popularity?: number;
  trending?: boolean;
  category?: string;
  tags?: string[];
}

export interface FeedCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface FeedDiscoveryResult {
  feeds: PopularFeedGenerator[];
  cursor?: string;
  categories?: FeedCategory[];
}

// ============================================================================
// FEED SEARCH TYPES
// ============================================================================

export interface FeedSearchQuery {
  term: string;
  limit?: number;
  cursor?: string;
  sort?: 'relevance' | 'popularity' | 'recent';
  category?: string;
}

export interface FeedSearchResult {
  feeds: FeedGenerator[];
  cursor?: string;
  total?: number;
}

// ============================================================================
// FEED CONFIGURATION TYPES
// ============================================================================

export interface FeedConfiguration {
  uri: string;
  preferences: FeedPreferences;
  displayName?: string;
  pinned: boolean;
  order?: number;
  lastViewed?: string;
  notifications?: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  };
}

export interface FeedLayout {
  type: 'list' | 'grid' | 'card';
  showAvatars: boolean;
  showMetrics: boolean;
  compactMode: boolean;
  imagePreview: boolean;
}

// ============================================================================
// FEED INTERACTION TYPES
// ============================================================================

export interface FeedInteraction {
  type: 'like' | 'repost' | 'reply' | 'quote' | 'follow' | 'mute' | 'block';
  targetUri: string;
  targetDid?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FeedAnalytics {
  views: number;
  interactions: number;
  uniqueViewers: number;
  averageTimeSpent: number;
  topPosts: string[];
  engagementRate: number;
  period: {
    start: string;
    end: string;
  };
}

// ============================================================================
// FEED STATE TYPES
// ============================================================================

export interface FeedState {
  feeds: SavedFeed[];
  currentFeed?: string;
  isLoading: boolean;
  error?: string;
  lastRefresh?: string;
  hasMore: boolean;
  cursor?: string;
}

export interface FeedAction {
  type: 'LOAD_FEEDS' | 'LOAD_FEEDS_SUCCESS' | 'LOAD_FEEDS_ERROR' |
        'ADD_FEED' | 'REMOVE_FEED' | 'UPDATE_FEED' |
        'SET_CURRENT_FEED' | 'REFRESH_FEED' |
        'LOAD_MORE' | 'LOAD_MORE_SUCCESS' | 'LOAD_MORE_ERROR';
  payload?: any;
}

// ============================================================================
// FEED HOOK TYPES
// ============================================================================

export interface UseFeedOptions {
  feedUri?: string;
  limit?: number;
  refreshInterval?: number;
  autoRefresh?: boolean;
  prefetchNext?: boolean;
}

export interface UseFeedReturn {
  posts: FeedViewPost[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error?: string;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export for convenience
  SavedFeed as Feed,
  FeedGenerator as Generator,
  FeedViewPost as Post,
  FeedTimeline as Timeline,
};