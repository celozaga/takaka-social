// ============================================================================
// Post Module Types
// ============================================================================
//
// Type definitions for post-related functionality
//

// ============================================================================
// CORE POST TYPES
// ============================================================================

export interface PostData {
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
    facets?: PostFacet[];
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
    embed?: PostEmbed;
    langs?: string[];
    labels?: any;
    tags?: string[];
  };
  embed?: PostEmbed;
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
  threadgate?: PostThreadgate;
}

export interface PostFacet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: PostFacetFeature[];
}

export interface PostFacetFeature {
  $type: string;
  uri?: string;
  did?: string;
  tag?: string;
}

export interface PostEmbed {
  $type: string;
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  images?: {
    alt: string;
    aspectRatio?: {
      width: number;
      height: number;
    };
    image: {
      $type: string;
      ref: {
        $link: string;
      };
      mimeType: string;
      size: number;
    };
  }[];
  record?: {
    $type: string;
    record: PostData;
  };
  recordWithMedia?: {
    $type: string;
    record: {
      record: PostData;
    };
    media: PostEmbed;
  };
  video?: {
    $type: string;
    video: {
      $type: string;
      ref: {
        $link: string;
      };
      mimeType: string;
      size: number;
    };
    alt?: string;
    aspectRatio?: {
      width: number;
      height: number;
    };
    captions?: {
      lang: string;
      file: {
        $type: string;
        ref: {
          $link: string;
        };
        mimeType: string;
        size: number;
      };
    }[];
  };
}

export interface PostThreadgate {
  $type: string;
  post: string;
  allow?: {
    $type: string;
    following?: boolean;
    mentioned?: boolean;
    lists?: string[];
  }[];
  createdAt: string;
}

// ============================================================================
// POST INTERACTION TYPES
// ============================================================================

export interface PostInteraction {
  type: 'like' | 'repost' | 'reply' | 'quote' | 'share' | 'bookmark';
  postUri: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PostLike {
  uri: string;
  cid: string;
  subject: {
    uri: string;
    cid: string;
  };
  createdAt: string;
}

export interface PostRepost {
  uri: string;
  cid: string;
  subject: {
    uri: string;
    cid: string;
  };
  createdAt: string;
}

export interface PostReply {
  uri: string;
  cid: string;
  root: {
    uri: string;
    cid: string;
  };
  parent: {
    uri: string;
    cid: string;
  };
  post: PostData;
}

// ============================================================================
// COMPOSER TYPES
// ============================================================================

export interface ComposerState {
  text: string;
  facets: PostFacet[];
  embed?: PostEmbed;
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
  langs?: string[];
  labels?: any;
  tags?: string[];
  threadgate?: {
    allow?: {
      following?: boolean;
      mentioned?: boolean;
      lists?: string[];
    }[];
  };
}

export interface ComposerOptions {
  maxLength?: number;
  allowedEmbedTypes?: string[];
  enableThreadgate?: boolean;
  defaultLanguages?: string[];
  placeholder?: string;
}

export interface ComposerValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  characterCount: number;
  remainingCharacters: number;
}

export interface MediaUpload {
  id: string;
  file: File | { uri: string; type: string; name: string };
  type: 'image' | 'video';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  alt?: string;
  aspectRatio?: {
    width: number;
    height: number;
  };
  error?: string;
}

// ============================================================================
// POST THREAD TYPES
// ============================================================================

export interface PostThread {
  $type: string;
  post: PostData;
  parent?: PostThread;
  replies?: PostThread[];
}

export interface ThreadViewPost {
  $type: string;
  post: PostData;
  parent?: ThreadViewPost;
  replies?: ThreadViewPost[];
  viewer?: {
    threadMuted?: boolean;
  };
}

// ============================================================================
// POST SEARCH TYPES
// ============================================================================

export interface PostSearchQuery {
  q: string;
  sort?: 'top' | 'latest';
  since?: string;
  until?: string;
  mentions?: string;
  author?: string;
  lang?: string;
  domain?: string;
  url?: string;
  tag?: string;
  limit?: number;
  cursor?: string;
}

export interface PostSearchResult {
  posts: PostData[];
  cursor?: string;
  hitsTotal?: number;
}

// ============================================================================
// POST MODERATION TYPES
// ============================================================================

export interface PostModeration {
  uri: string;
  action: 'hide' | 'warn' | 'blur' | 'noOverride';
  reason: string;
  labels?: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface PostReport {
  reasonType: string;
  reason?: string;
  subject: {
    $type: string;
    uri: string;
    cid: string;
  };
}

// ============================================================================
// POST ANALYTICS TYPES
// ============================================================================

export interface PostAnalytics {
  uri: string;
  impressions: number;
  engagements: number;
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  clicks: number;
  profileClicks: number;
  follows: number;
  engagementRate: number;
  period: {
    start: string;
    end: string;
  };
}

// ============================================================================
// POST STATE TYPES
// ============================================================================

export interface PostState {
  posts: Record<string, PostData>;
  threads: Record<string, PostThread>;
  isLoading: boolean;
  error?: string;
  lastRefresh?: string;
}

export interface PostAction {
  type: 'LOAD_POST' | 'LOAD_POST_SUCCESS' | 'LOAD_POST_ERROR' |
        'LOAD_THREAD' | 'LOAD_THREAD_SUCCESS' | 'LOAD_THREAD_ERROR' |
        'LIKE_POST' | 'UNLIKE_POST' | 'REPOST_POST' | 'UNREPOST_POST' |
        'CREATE_POST' | 'DELETE_POST' | 'UPDATE_POST';
  payload?: any;
}

// ============================================================================
// POST HOOK TYPES
// ============================================================================

export interface UsePostOptions {
  postUri?: string;
  includeThread?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export interface UsePostReturn {
  post?: PostData;
  thread?: PostThread;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  like: () => Promise<void>;
  unlike: () => Promise<void>;
  repost: () => Promise<void>;
  unrepost: () => Promise<void>;
  delete: () => Promise<void>;
}

export interface UseComposerReturn {
  state: ComposerState;
  validation: ComposerValidation;
  isSubmitting: boolean;
  error?: string;
  setText: (text: string) => void;
  addEmbed: (embed: PostEmbed) => void;
  removeEmbed: () => void;
  addMedia: (media: MediaUpload[]) => void;
  removeMedia: (id: string) => void;
  setReply: (reply: ComposerState['reply']) => void;
  setLanguages: (langs: string[]) => void;
  setThreadgate: (threadgate: ComposerState['threadgate']) => void;
  submit: () => Promise<PostData>;
  reset: () => void;
  validate: () => ComposerValidation;
}

// ============================================================================
// EXPORT CONVENIENCE TYPES
// ============================================================================

export type {
  // Re-export for convenience
  PostData as Post,
  PostThread as Thread,
  ComposerState as Composer,
  PostInteraction as Interaction,
};