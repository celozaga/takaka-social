// ============================================================================
// Search Module - Type Definitions
// ============================================================================
//
// This file contains all TypeScript type definitions for the search module,
// including search queries, results, filters, history, and hook return types.
//

import { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';
import { ProfileData } from '../../profile/types';
import { PostData } from '../../post/types';
import { FeedGenerator } from '../../feed/types';

// ============================================================================
// Core Search Types
// ============================================================================

/**
 * Search query parameters
 */
export interface SearchQuery {
  term: string;
  type?: SearchType;
  filters?: SearchFilters;
  limit?: number;
  cursor?: string;
  sort?: SearchSortOrder;
}

/**
 * Available search types
 */
export type SearchType = 'all' | 'profiles' | 'posts' | 'feeds' | 'hashtags';

/**
 * Search sort orders
 */
export type SearchSortOrder = 'relevance' | 'recent' | 'popular' | 'oldest';

/**
 * Search filters
 */
export interface SearchFilters {
  dateRange?: DateRange;
  hasMedia?: boolean;
  hasLinks?: boolean;
  language?: string;
  verified?: boolean;
  minFollowers?: number;
  maxFollowers?: number;
  location?: string;
}

/**
 * Date range filter
 */
export interface DateRange {
  from?: string; // ISO date string
  to?: string;   // ISO date string
}

// ============================================================================
// Search Results
// ============================================================================

/**
 * Generic search result container
 */
export interface SearchResult {
  profiles: ProfileSearchResult[];
  posts: PostSearchResult[];
  feeds: FeedSearchResult[];
  hashtags: HashtagSearchResult[];
  cursor?: string;
  hasMore: boolean;
  totalCount?: number;
  searchTime?: number; // milliseconds
}

/**
 * Profile search result
 */
export interface ProfileSearchResult {
  profile: ProfileData;
  relevanceScore: number;
  matchedFields: ('handle' | 'displayName' | 'description')[];
  snippet?: string;
}

/**
 * Post search result
 */
export interface PostSearchResult {
  post: PostData;
  relevanceScore: number;
  matchedFields: ('text' | 'author' | 'hashtags')[];
  snippet?: string;
  highlightedText?: string;
}

/**
 * Feed search result
 */
export interface FeedSearchResult {
  feed: FeedGenerator;
  relevanceScore: number;
  matchedFields: ('displayName' | 'description' | 'creator')[];
  snippet?: string;
}

/**
 * Hashtag search result
 */
export interface HashtagSearchResult {
  tag: string;
  count: number;
  trending: boolean;
  relatedTags: string[];
}

// ============================================================================
// Search History
// ============================================================================

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  query: string;
  type: SearchType;
  timestamp: string;
  resultCount?: number;
  clicked?: boolean;
}

/**
 * Search history management
 */
export interface SearchHistory {
  entries: SearchHistoryEntry[];
  maxEntries: number;
  autoSave: boolean;
}

/**
 * Search suggestions
 */
export interface SearchSuggestion {
  text: string;
  type: 'query' | 'profile' | 'hashtag' | 'recent';
  count?: number;
  icon?: string;
}

// ============================================================================
// Trending & Discovery
// ============================================================================

/**
 * Trending topic
 */
export interface TrendingTopic {
  tag: string;
  count: number;
  growth: number; // percentage growth
  category?: TrendingCategory;
  region?: string;
  timeframe: TrendingTimeframe;
}

/**
 * Trending categories
 */
export type TrendingCategory = 
  | 'general'
  | 'technology'
  | 'politics'
  | 'sports'
  | 'entertainment'
  | 'science'
  | 'business'
  | 'health';

/**
 * Trending timeframes
 */
export type TrendingTimeframe = '1h' | '6h' | '24h' | '7d';

/**
 * Trending data
 */
export interface TrendingData {
  topics: TrendingTopic[];
  profiles: ProfileData[];
  posts: PostData[];
  feeds: FeedGenerator[];
  lastUpdated: string;
  region?: string;
}

// ============================================================================
// Search Analytics
// ============================================================================

/**
 * Search analytics data
 */
export interface SearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultsPerQuery: number;
  clickThroughRate: number;
  popularQueries: PopularQuery[];
  searchTrends: SearchTrend[];
  timeRange: AnalyticsTimeRange;
}

/**
 * Popular search query
 */
export interface PopularQuery {
  query: string;
  count: number;
  type: SearchType;
  averageResults: number;
  clickRate: number;
}

/**
 * Search trend data
 */
export interface SearchTrend {
  date: string;
  searches: number;
  uniqueUsers: number;
  topQuery: string;
}

/**
 * Analytics time range
 */
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '1y';

// ============================================================================
// Search State Management
// ============================================================================

/**
 * Search state for state management
 */
export interface SearchState {
  currentQuery?: SearchQuery;
  results?: SearchResult;
  history: SearchHistoryEntry[];
  suggestions: SearchSuggestion[];
  trending: TrendingData;
  isLoading: boolean;
  isLoadingMore: boolean;
  error?: string;
  filters: SearchFilters;
}

/**
 * Search action types for reducers
 */
export type SearchAction =
  | { type: 'SET_QUERY'; payload: SearchQuery }
  | { type: 'SET_RESULTS'; payload: SearchResult }
  | { type: 'APPEND_RESULTS'; payload: SearchResult }
  | { type: 'ADD_HISTORY_ENTRY'; payload: SearchHistoryEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_SUGGESTIONS'; payload: SearchSuggestion[] }
  | { type: 'SET_TRENDING'; payload: TrendingData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_FILTERS'; payload: SearchFilters }
  | { type: 'CLEAR_RESULTS' };

// ============================================================================
// Search Configuration
// ============================================================================

/**
 * Search configuration options
 */
export interface SearchConfig {
  maxHistoryEntries: number;
  suggestionLimit: number;
  debounceMs: number;
  minQueryLength: number;
  enableAnalytics: boolean;
  enableTrending: boolean;
  defaultFilters: SearchFilters;
  resultLimits: {
    profiles: number;
    posts: number;
    feeds: number;
    hashtags: number;
  };
}

/**
 * Search provider configuration
 */
export interface SearchProviderConfig {
  apiEndpoint: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  cacheTtl: number;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for useSearch hook
 */
export interface UseSearchOptions {
  autoSearch?: boolean;
  debounceMs?: number;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  defaultFilters?: SearchFilters;
  maxResults?: number;
}

/**
 * Return type for useSearch hook
 */
export interface UseSearchReturn {
  query: string;
  results?: SearchResult;
  isLoading: boolean;
  isLoadingMore: boolean;
  error?: string;
  hasMore: boolean;
  search: (query: string, options?: Partial<SearchQuery>) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
}

/**
 * Return type for useSearchHistory hook
 */
export interface UseSearchHistoryReturn {
  history: SearchHistoryEntry[];
  addEntry: (entry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getRecentQueries: (limit?: number) => string[];
  getPopularQueries: (limit?: number) => string[];
}

/**
 * Return type for useTrending hook
 */
export interface UseTrendingReturn {
  trending?: TrendingData;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  getTrendingByCategory: (category: TrendingCategory) => TrendingTopic[];
  getTrendingByTimeframe: (timeframe: TrendingTimeframe) => TrendingTopic[];
}

/**
 * Return type for useSearchSuggestions hook
 */
export interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  getSuggestions: (query: string) => Promise<SearchSuggestion[]>;
  clearSuggestions: () => void;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type Search = SearchResult;
export type SearchFilter = SearchFilters;
export type SearchEntry = SearchHistoryEntry;
export type Trending = TrendingData;
export type Topic = TrendingTopic;