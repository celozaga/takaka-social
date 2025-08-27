// ============================================================================
// Search Module - Hooks Index
// ============================================================================
//
// This file centralizes all hook exports for the search module,
// providing a clean API for importing search-related hooks.
//

// Hook exports
export { useSearch, default as useSearchDefault } from './useSearch';
export { useSearchHistory, default as useSearchHistoryDefault } from './useSearchHistory';
export { useTrending, default as useTrendingDefault } from './useTrending';
export { useSearchSuggestions, default as useSearchSuggestionsDefault } from './useSearchSuggestions';

// Type exports for hook return types
export type {
  UseSearchOptions,
  UseSearchReturn,
  UseSearchHistoryReturn,
  UseTrendingReturn,
  UseSearchSuggestionsReturn,
} from '../types';

// Re-export commonly used types
export type {
  SearchQuery,
  SearchResult,
  SearchState,
  SearchHistoryEntry,
  TrendingTopic,
  TrendingData,
  SearchSuggestion,
} from '../types';