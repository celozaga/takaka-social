// ============================================================================
// API Types
// ============================================================================
//
// Centralized type definitions for API interactions
// Based on ATProto/Bluesky API specifications
//

import { AppBskyFeedDefs, AppBskyActorDefs, AppBskyNotificationListNotifications } from '@atproto/api';

// ============================================================================
// CORE TYPES
// ============================================================================

export type AtUri = string;
export type Cid = string;
export type Did = string;
export type Handle = string;
export type DateTime = string;

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface Profile {
  did: Did;
  handle: Handle;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  indexedAt?: DateTime;
  viewer?: {
    muted?: boolean;
    blockedBy?: boolean;
    blocking?: AtUri;
    following?: AtUri;
    followedBy?: AtUri;
  };
  labels?: Label[];
}

export interface ProfileViewBasic {
  did: Did;
  handle: Handle;
  displayName?: string;
  avatar?: string;
  viewer?: {
    muted?: boolean;
    blockedBy?: boolean;
  };
  labels?: Label[];
}

// ============================================================================
// POST TYPES
// ============================================================================

export interface Post {
  uri: AtUri;
  cid: Cid;
  author: ProfileViewBasic;
  record: {
    text: string;
    facets?: Facet[];
    reply?: {
      root: { uri: AtUri; cid: Cid };
      parent: { uri: AtUri; cid: Cid };
    };
    embed?: Embed;
    langs?: string[];
    createdAt: DateTime;
  };
  embed?: EmbedView;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  indexedAt: DateTime;
  viewer?: {
    repost?: AtUri;
    like?: AtUri;
  };
  labels?: Label[];
}

export interface ThreadViewPost {
  post: Post;
  parent?: ThreadViewPost | NotFoundPost | BlockedPost;
  replies?: (ThreadViewPost | NotFoundPost | BlockedPost)[];
}

export interface NotFoundPost {
  $type: 'app.bsky.feed.defs#notFoundPost';
  uri: AtUri;
  notFound: true;
}

export interface BlockedPost {
  $type: 'app.bsky.feed.defs#blockedPost';
  uri: AtUri;
  blocked: true;
  author: {
    did: Did;
    viewer?: {
      blockedBy?: boolean;
      blocking?: AtUri;
    };
  };
}

// ============================================================================
// FEED TYPES
// ============================================================================

export interface FeedViewPost {
  post: Post;
  reply?: {
    root: Post | NotFoundPost | BlockedPost;
    parent: Post | NotFoundPost | BlockedPost;
  };
  reason?: ReasonRepost;
}

export interface ReasonRepost {
  $type: 'app.bsky.feed.defs#reasonRepost';
  by: ProfileViewBasic;
  indexedAt: DateTime;
}

export interface GeneratorView {
  uri: AtUri;
  cid: Cid;
  did: Did;
  creator: ProfileViewBasic;
  displayName: string;
  description?: string;
  descriptionFacets?: Facet[];
  avatar?: string;
  likeCount?: number;
  indexedAt: DateTime;
  viewer?: {
    like?: AtUri;
  };
  labels?: Label[];
}

// ============================================================================
// EMBED TYPES
// ============================================================================

export interface Embed {
  $type: string;
  [key: string]: any;
}

export interface EmbedView {
  $type: string;
  [key: string]: any;
}

export interface EmbedImages {
  $type: 'app.bsky.embed.images';
  images: {
    alt: string;
    image: {
      $type: 'blob';
      ref: {
        $link: string;
      };
      mimeType: string;
      size: number;
    };
  }[];
}

export interface EmbedImagesView {
  $type: 'app.bsky.embed.images#view';
  images: {
    thumb: string;
    fullsize: string;
    alt: string;
  }[];
}

export interface EmbedVideo {
  $type: 'app.bsky.embed.video';
  video: {
    $type: 'blob';
    ref: {
      $link: string;
    };
    mimeType: string;
    size: number;
  };
  alt?: string;
  captions?: {
    lang: string;
    file: {
      $type: 'blob';
      ref: {
        $link: string;
      };
      mimeType: string;
      size: number;
    };
  }[];
}

export interface EmbedVideoView {
  $type: 'app.bsky.embed.video#view';
  cid: string;
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: {
    width: number;
    height: number;
  };
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  uri: AtUri;
  cid: Cid;
  author: ProfileViewBasic;
  reason: 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote';
  record: any;
  isRead: boolean;
  indexedAt: DateTime;
  labels?: Label[];
}

// ============================================================================
// FACET TYPES
// ============================================================================

export interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: FacetFeature[];
}

export interface FacetFeature {
  $type: string;
  [key: string]: any;
}

export interface FacetLink {
  $type: 'app.bsky.richtext.facet#link';
  uri: string;
}

export interface FacetMention {
  $type: 'app.bsky.richtext.facet#mention';
  did: Did;
}

export interface FacetTag {
  $type: 'app.bsky.richtext.facet#tag';
  tag: string;
}

// ============================================================================
// LABEL TYPES
// ============================================================================

export interface Label {
  src: Did;
  uri: AtUri;
  cid?: Cid;
  val: string;
  neg?: boolean;
  cts: DateTime;
  exp?: DateTime;
  sig?: Uint8Array;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchResults {
  actors?: ProfileViewBasic[];
  posts?: Post[];
  feeds?: GeneratorView[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  status?: number;
}

export interface RateLimitError extends ApiError {
  error: 'RateLimitExceeded';
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  cursor?: string;
  data: T[];
}

export interface FeedResponse extends PaginatedResponse<FeedViewPost> {}
export interface PostsResponse extends PaginatedResponse<Post> {}
export interface ProfilesResponse extends PaginatedResponse<Profile> {}
export interface NotificationsResponse extends PaginatedResponse<Notification> {}

// ============================================================================
// PREFERENCES TYPES
// ============================================================================

export interface Preferences {
  feeds?: {
    pinned?: AtUri[];
    saved?: AtUri[];
  };
  moderationPrefs?: {
    adultContentEnabled?: boolean;
    labels?: Record<string, 'ignore' | 'warn' | 'hide'>;
    labelers?: {
      did: Did;
      labels?: Record<string, 'ignore' | 'warn' | 'hide'>;
    }[];
    mutedWords?: {
      value: string;
      targets: ('content' | 'tag')[];
    }[];
    hiddenPosts?: AtUri[];
  };
  threadViewPrefs?: {
    sort?: 'oldest' | 'newest' | 'most-likes' | 'random';
    prioritizeFollowedUsers?: boolean;
  };
  interests?: {
    tags?: string[];
  };
}