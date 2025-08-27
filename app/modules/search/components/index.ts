// ============================================================================
// Search Module - Components Index
// ============================================================================
//
// Centralized exports for all search components, providing a clean
// interface for importing components from the search module.
//

// ============================================================================
// Core Components
// ============================================================================

export { default as SearchScreen } from './SearchScreen';
export { default as ActorSearchResultCard } from './ActorSearchResultCard';
export { default as TrendingTopics } from './TrendingTopics';

// ============================================================================
// Component Types
// ============================================================================

// Re-export component prop types if they exist
export type { SearchScreenProps } from './SearchScreen';
export type { ActorSearchResultCardProps } from './ActorSearchResultCard';
export type { TrendingTopicsProps } from './TrendingTopics';

// ============================================================================
// Component Utilities
// ============================================================================

import React from 'react';

/**
 * Configuration for creating search components
 */
export interface SearchComponentsConfig {
  /**
   * Default theme variant
   */
  theme?: 'light' | 'dark' | 'auto';
  
  /**
   * Default search result limit
   */
  defaultResultLimit?: number;
  
  /**
   * Whether to show search suggestions by default
   */
  showSuggestions?: boolean;
  
  /**
   * Whether to show trending topics by default
   */
  showTrending?: boolean;
  
  /**
   * Search debounce delay in milliseconds
   */
  debounceDelay?: number;
  
  /**
   * Animation preferences
   */
  animations?: {
    enabled: boolean;
    duration: number;
  };
  
  /**
   * Search result display options
   */
  resultDisplay?: {
    showAvatars: boolean;
    showVerificationBadges: boolean;
    showFollowerCounts: boolean;
  };
}

/**
 * Factory function to create search components with shared configuration
 */
export function createSearchComponents(config: SearchComponentsConfig = {}) {
  const {
    defaultResultLimit = 20,
    showSuggestions = true,
    showTrending = true,
    debounceDelay = 300,
    animations = { enabled: true, duration: 200 },
    resultDisplay = {
      showAvatars: true,
      showVerificationBadges: true,
      showFollowerCounts: true,
    },
  } = config;
  
  return {
    /**
     * Pre-configured SearchScreen component
     */
    Screen: (props: any) => {
      const defaultProps = {
        resultLimit: defaultResultLimit,
        showSuggestions,
        showTrending,
        debounceDelay,
        animations,
        ...props,
      };
      
      return React.createElement('SearchScreen', defaultProps);
    },
    
    /**
     * Pre-configured ActorSearchResultCard component
     */
    ActorCard: (props: any) => {
      const defaultProps = {
        ...resultDisplay,
        animations,
        ...props,
      };
      
      return React.createElement('ActorSearchResultCard', defaultProps);
    },
    
    /**
     * Pre-configured TrendingTopics component
     */
    Trending: (props: any) => {
      const defaultProps = {
        animations,
        ...props,
      };
      
      return React.createElement('TrendingTopics', defaultProps);
    },
  };
}

/**
 * Utility functions for search components
 */
export const searchComponentUtils = {
  /**
   * Highlight search terms in text
   */
  highlightSearchTerms: (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
  
  /**
   * Format search result count
   */
  formatResultCount: (count: number): string => {
    if (count === 0) return 'No results';
    if (count === 1) return '1 result';
    if (count < 1000) return `${count} results`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
    return `${(count / 1000000).toFixed(1)}M results`;
  },
  
  /**
   * Generate search URL
   */
  generateSearchUrl: (query: string, filters?: Record<string, any>): string => {
    const params = new URLSearchParams({ q: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return `/search?${params.toString()}`;
  },
  
  /**
   * Parse search query for filters
   */
  parseSearchQuery: (query: string): { term: string; filters: Record<string, string> } => {
    const filters: Record<string, string> = {};
    let term = query;
    
    // Extract filters like "from:user" or "type:post"
    const filterRegex = /(\w+):(\S+)/g;
    let match;
    
    while ((match = filterRegex.exec(query)) !== null) {
      filters[match[1]] = match[2];
      term = term.replace(match[0], '').trim();
    }
    
    return { term: term.trim(), filters };
  },
  
  /**
   * Get search result type icon
   */
  getResultTypeIcon: (type: 'user' | 'post' | 'hashtag' | 'link'): string => {
    const icons = {
      user: 'user',
      post: 'message-square',
      hashtag: 'hash',
      link: 'external-link',
    };
    return icons[type] || 'search';
  },
  
  /**
   * Sort search results by relevance
   */
  sortByRelevance: (results: any[], searchTerm: string): any[] => {
    return results.sort((a, b) => {
      // Exact matches first
      const aExact = a.displayName?.toLowerCase() === searchTerm.toLowerCase() ? 1 : 0;
      const bExact = b.displayName?.toLowerCase() === searchTerm.toLowerCase() ? 1 : 0;
      
      if (aExact !== bExact) return bExact - aExact;
      
      // Then by follower count or engagement
      const aScore = a.followersCount || a.likesCount || 0;
      const bScore = b.followersCount || b.likesCount || 0;
      
      return bScore - aScore;
    });
  },
  
  /**
   * Filter search results by type
   */
  filterByType: (results: any[], type: string): any[] => {
    if (!type || type === 'all') return results;
    return results.filter(result => result.type === type);
  },
  
  /**
   * Get trending topic URL
   */
  getTrendingTopicUrl: (topic: string): string => {
    const encodedTopic = encodeURIComponent(topic.startsWith('#') ? topic : `#${topic}`);
    return `/search?q=${encodedTopic}`;
  },
  
  /**
   * Format trending topic count
   */
  formatTrendingCount: (count: number): string => {
    if (count < 1000) return `${count} posts`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K posts`;
    return `${(count / 1000000).toFixed(1)}M posts`;
  },
};

/**
 * Constants for search components
 */
export const SEARCH_COMPONENTS_CONFIG = {
  /**
   * Default component configuration
   */
  defaults: {
    resultLimit: 20,
    showSuggestions: true,
    showTrending: true,
    debounceDelay: 300,
    animations: {
      enabled: true,
      duration: 200,
    },
    resultDisplay: {
      showAvatars: true,
      showVerificationBadges: true,
      showFollowerCounts: true,
    },
  },
  
  /**
   * Available search types
   */
  searchTypes: {
    all: 'All',
    users: 'Users',
    posts: 'Posts',
    hashtags: 'Hashtags',
    links: 'Links',
  },
  
  /**
   * Search filters
   */
  filters: {
    timeRange: ['all', 'hour', 'day', 'week', 'month', 'year'] as const,
    sortBy: ['relevance', 'recent', 'popular'] as const,
    resultType: ['all', 'users', 'posts', 'hashtags', 'links'] as const,
  },
  
  /**
   * Component accessibility labels
   */
  accessibility: {
    searchInput: 'Search input',
    searchButton: 'Search',
    clearSearch: 'Clear search',
    searchResult: 'Search result',
    trendingTopic: 'Trending topic',
    searchFilter: 'Search filter',
    resultCount: 'Search result count',
  },
  
  /**
   * Test IDs for components
   */
  testIds: {
    searchScreen: 'search-screen',
    searchInput: 'search-input',
    searchResults: 'search-results',
    actorCard: 'actor-search-result-card',
    trendingTopics: 'trending-topics',
    searchFilter: 'search-filter',
  },
} as const;