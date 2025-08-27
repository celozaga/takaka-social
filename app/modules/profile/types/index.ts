// ============================================================================
// Profile Module - Type Definitions
// ============================================================================
//
// This file contains all TypeScript type definitions for the profile module,
// including profile data, preferences, interactions, and hook return types.
//

import { AppBskyActorDefs } from '@atproto/api';

// ============================================================================
// Core Profile Types
// ============================================================================

/**
 * Complete profile data structure
 */
export interface ProfileData {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  indexedAt?: string;
  createdAt?: string;
  labels?: AppBskyActorDefs.Label[];
  viewer?: ProfileViewerState;
  associated?: ProfileAssociated;
  joinedViaStarterPack?: AppBskyActorDefs.StarterPackViewBasic;
}

/**
 * Profile viewer state (relationship with current user)
 */
export interface ProfileViewerState {
  muted?: boolean;
  mutedByList?: AppBskyActorDefs.ListViewBasic;
  blockedBy?: boolean;
  blocking?: string;
  blockingByList?: AppBskyActorDefs.ListViewBasic;
  following?: string;
  followedBy?: string;
  knownFollowers?: AppBskyActorDefs.KnownFollowers;
}

/**
 * Profile associated data
 */
export interface ProfileAssociated {
  lists?: number;
  feedgens?: number;
  starterPacks?: number;
  labeler?: boolean;
  chat?: ProfileAssociatedChat;
}

/**
 * Profile chat settings
 */
export interface ProfileAssociatedChat {
  allowIncoming: 'all' | 'none' | 'following';
}

// ============================================================================
// Profile Preferences
// ============================================================================

/**
 * User profile preferences and settings
 */
export interface ProfilePreferences {
  displayName?: string;
  description?: string;
  avatar?: Blob | string;
  banner?: Blob | string;
  labels?: string[];
  pinnedPost?: string;
  chatSettings?: ProfileChatSettings;
  privacySettings?: ProfilePrivacySettings;
  notificationSettings?: ProfileNotificationSettings;
}

/**
 * Profile chat preferences
 */
export interface ProfileChatSettings {
  allowIncoming: 'all' | 'none' | 'following';
  allowFromUnknown: boolean;
}

/**
 * Profile privacy settings
 */
export interface ProfilePrivacySettings {
  hideFollowers: boolean;
  hideFollowing: boolean;
  requireApprovalForFollows: boolean;
  allowMentions: 'all' | 'following' | 'none';
  allowReposts: 'all' | 'following' | 'none';
}

/**
 * Profile notification preferences
 */
export interface ProfileNotificationSettings {
  likes: boolean;
  reposts: boolean;
  follows: boolean;
  mentions: boolean;
  replies: boolean;
  quotes: boolean;
}

// ============================================================================
// Profile Actions & Interactions
// ============================================================================

/**
 * Available profile actions
 */
export interface ProfileActions {
  follow: (did: string) => Promise<void>;
  unfollow: (did: string) => Promise<void>;
  block: (did: string) => Promise<void>;
  unblock: (did: string) => Promise<void>;
  mute: (did: string) => Promise<void>;
  unmute: (did: string) => Promise<void>;
  report: (did: string, reason: string) => Promise<void>;
  updateProfile: (preferences: ProfilePreferences) => Promise<void>;
}

/**
 * Profile interaction types
 */
export type ProfileInteractionType = 
  | 'follow' 
  | 'unfollow' 
  | 'block' 
  | 'unblock' 
  | 'mute' 
  | 'unmute' 
  | 'report';

/**
 * Profile interaction data
 */
export interface ProfileInteraction {
  type: ProfileInteractionType;
  targetDid: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Profile Lists & Discovery
// ============================================================================

/**
 * Profile search query
 */
export interface ProfileSearchQuery {
  term: string;
  limit?: number;
  cursor?: string;
  filters?: ProfileSearchFilters;
}

/**
 * Profile search filters
 */
export interface ProfileSearchFilters {
  hasAvatar?: boolean;
  hasDescription?: boolean;
  minFollowers?: number;
  maxFollowers?: number;
  verified?: boolean;
  associated?: ('lists' | 'feedgens' | 'starterPacks' | 'labeler')[];
}

/**
 * Profile search result
 */
export interface ProfileSearchResult {
  profiles: ProfileData[];
  cursor?: string;
  hasMore: boolean;
}

/**
 * Suggested profiles
 */
export interface SuggestedProfile extends ProfileData {
  reason?: string;
  score?: number;
  mutualFollows?: ProfileData[];
}

// ============================================================================
// Profile Analytics & Stats
// ============================================================================

/**
 * Profile analytics data
 */
export interface ProfileAnalytics {
  profileViews: number;
  followerGrowth: number;
  engagementRate: number;
  topPosts: string[];
  demographics?: ProfileDemographics;
  timeRange: AnalyticsTimeRange;
}

/**
 * Profile demographics
 */
export interface ProfileDemographics {
  countries: Record<string, number>;
  languages: Record<string, number>;
  ageGroups: Record<string, number>;
}

/**
 * Analytics time range
 */
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '1y';

// ============================================================================
// Profile State Management
// ============================================================================

/**
 * Profile state for state management
 */
export interface ProfileState {
  currentProfile?: ProfileData;
  viewedProfiles: Record<string, ProfileData>;
  following: string[];
  followers: string[];
  blocked: string[];
  muted: string[];
  suggestions: SuggestedProfile[];
  isLoading: boolean;
  error?: string;
}

/**
 * Profile action types for reducers
 */
export type ProfileAction =
  | { type: 'SET_CURRENT_PROFILE'; payload: ProfileData }
  | { type: 'SET_VIEWED_PROFILE'; payload: { did: string; profile: ProfileData } }
  | { type: 'ADD_FOLLOWING'; payload: string }
  | { type: 'REMOVE_FOLLOWING'; payload: string }
  | { type: 'ADD_FOLLOWER'; payload: string }
  | { type: 'REMOVE_FOLLOWER'; payload: string }
  | { type: 'ADD_BLOCKED'; payload: string }
  | { type: 'REMOVE_BLOCKED'; payload: string }
  | { type: 'ADD_MUTED'; payload: string }
  | { type: 'REMOVE_MUTED'; payload: string }
  | { type: 'SET_SUGGESTIONS'; payload: SuggestedProfile[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined };

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for useProfile hook
 */
export interface UseProfileOptions {
  did?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeAnalytics?: boolean;
}

/**
 * Return type for useProfile hook
 */
export interface UseProfileReturn {
  profile?: ProfileData;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  updateProfile: (preferences: ProfilePreferences) => Promise<void>;
}

/**
 * Return type for useProfileActions hook
 */
export interface UseProfileActionsReturn {
  follow: (did: string) => Promise<void>;
  unfollow: (did: string) => Promise<void>;
  block: (did: string) => Promise<void>;
  unblock: (did: string) => Promise<void>;
  mute: (did: string) => Promise<void>;
  unmute: (did: string) => Promise<void>;
  report: (did: string, reason: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

/**
 * Return type for useFollowActions hook
 */
export interface UseFollowActionsReturn {
  follow: (did: string) => Promise<void>;
  unfollow: (did: string) => Promise<void>;
  isFollowing: (did: string) => boolean;
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type Profile = ProfileData;
export type ProfilePrefs = ProfilePreferences;
export type ProfileViewer = ProfileViewerState;
export type ProfileStats = Pick<ProfileData, 'followersCount' | 'followsCount' | 'postsCount'>;