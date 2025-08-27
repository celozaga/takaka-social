// ============================================================================
// API Core - Barrel Export
// ============================================================================
// 
// This module provides centralized API functionality for the application.
// It includes ATProto client management, request handling, and type definitions.
//

// ============================================================================
// CLIENT
// ============================================================================

// ATProto API Client
export { ApiClient, defaultApiClient } from './client';
export type { ApiClientConfig, RequestOptions } from './client';

// ============================================================================
// TYPES
// ============================================================================

// Core API types
export type {
  AtUri,
  Cid,
  Did,
  Handle,
  DateTime,
  Profile,
  ProfileViewBasic,
  Post,
  ThreadViewPost,
  NotFoundPost,
  BlockedPost,
  FeedViewPost,
  ReasonRepost,
  GeneratorView,
  Embed,
  EmbedView,
  EmbedImages,
  EmbedImagesView,
  EmbedVideo,
  EmbedVideoView,
  Notification,
  Facet,
  FacetFeature,
  FacetLink,
  FacetMention,
  FacetTag,
  Label,
  SearchResults,
  ApiError,
  RateLimitError,
  PaginatedResponse,
  FeedResponse,
  PostsResponse,
  ProfilesResponse,
  NotificationsResponse,
  Preferences,
} from './types';

// ============================================================================
// UTILITIES
// ============================================================================

// Common API utilities and helpers
export const apiUtils = {
  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // AT-URI validation
  isValidAtUri: (uri: string): boolean => {
    return uri.startsWith('at://');
  },

  // DID validation
  isValidDid: (did: string): boolean => {
    return did.startsWith('did:');
  },

  // Handle validation
  isValidHandle: (handle: string): boolean => {
    return /^[a-zA-Z0-9.-]+$/.test(handle);
  },

  // Format error message
  formatError: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'Unknown error occurred';
  },
};