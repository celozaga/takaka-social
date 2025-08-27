// ============================================================================
// Search Module - Utility Functions
// ============================================================================
//
// This file contains utility functions for search-related operations,
// including query parsing, result formatting, filtering, sorting, and caching.
//

import { 
  SearchQuery, 
  SearchResult, 
  SearchFilters, 
  SearchHistoryEntry, 
  TrendingTopic,
  ProfileSearchResult,
  PostSearchResult,
  FeedSearchResult,
  HashtagSearchResult,
  SearchSuggestion
} from '../types';
import { ProfileData } from '../../profile/types';
import { PostData } from '../../post/types';
import { FeedGenerator } from '../../feed/types';

// ============================================================================
// Search Query Utilities
// ============================================================================

export const searchQueryUtils = {
  /**
   * Parse search query string into structured query
   */
  parseQuery: (queryString: string): Partial<SearchQuery> => {
    const query: Partial<SearchQuery> = {
      term: queryString.trim(),
      filters: {},
    };

    // Extract hashtags
    const hashtags = queryString.match(/#\w+/g);
    if (hashtags) {
      query.term = queryString.replace(/#\w+/g, '').trim();
    }

    // Extract mentions
    const mentions = queryString.match(/@[\w.-]+/g);
    if (mentions) {
      query.term = queryString.replace(/@[\w.-]+/g, '').trim();
    }

    // Extract quoted phrases
    const quotedPhrases = queryString.match(/"[^"]+"/g);
    if (quotedPhrases) {
      query.term = queryString.replace(/"[^"]+"/g, '').trim();
    }

    // Extract filters from query (e.g., "has:media", "from:user")
    const filterMatches = queryString.match(/(\w+):(\w+)/g);
    if (filterMatches) {
      filterMatches.forEach(match => {
        const [key, value] = match.split(':');
        switch (key.toLowerCase()) {
          case 'has':
            if (value === 'media') query.filters!.hasMedia = true;
            if (value === 'links') query.filters!.hasLinks = true;
            break;
          case 'lang':
            query.filters!.language = value;
            break;
          case 'verified':
            query.filters!.verified = value === 'true';
            break;
        }
      });
      query.term = queryString.replace(/(\w+):(\w+)/g, '').trim();
    }

    return query;
  },

  /**
   * Build query string from structured query
   */
  buildQueryString: (query: SearchQuery): string => {
    let queryString = query.term;

    if (query.filters) {
      if (query.filters.hasMedia) queryString += ' has:media';
      if (query.filters.hasLinks) queryString += ' has:links';
      if (query.filters.language) queryString += ` lang:${query.filters.language}`;
      if (query.filters.verified) queryString += ' verified:true';
    }

    return queryString.trim();
  },

  /**
   * Validate search query
   */
  validateQuery: (query: SearchQuery): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!query.term || query.term.trim().length === 0) {
      errors.push('Search term is required');
    }

    if (query.term && query.term.length < 2) {
      errors.push('Search term must be at least 2 characters');
    }

    if (query.term && query.term.length > 100) {
      errors.push('Search term must be less than 100 characters');
    }

    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Extract keywords from query
   */
  extractKeywords: (query: string): string[] => {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  },

  /**
   * Generate search suggestions based on query
   */
  generateSuggestions: (query: string, history: SearchHistoryEntry[]): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Add recent searches that match
    const recentMatches = history
      .filter(entry => entry.query.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .map(entry => ({
        text: entry.query,
        type: 'recent' as const,
        count: entry.resultCount,
      }));

    suggestions.push(...recentMatches);

    // Add hashtag suggestions if query starts with #
    if (query.startsWith('#')) {
      const hashtag = query.slice(1);
      if (hashtag.length > 0) {
        suggestions.push({
          text: `#${hashtag}`,
          type: 'hashtag',
          icon: 'hashtag',
        });
      }
    }

    // Add profile suggestions if query starts with @
    if (query.startsWith('@')) {
      const handle = query.slice(1);
      if (handle.length > 0) {
        suggestions.push({
          text: `@${handle}`,
          type: 'profile',
          icon: 'user',
        });
      }
    }

    return suggestions;
  },
};

// ============================================================================
// Search Result Utilities
// ============================================================================

export const searchResultUtils = {
  /**
   * Merge search results
   */
  mergeResults: (existing: SearchResult, newResults: SearchResult): SearchResult => {
    return {
      profiles: [...existing.profiles, ...newResults.profiles],
      posts: [...existing.posts, ...newResults.posts],
      feeds: [...existing.feeds, ...newResults.feeds],
      hashtags: [...existing.hashtags, ...newResults.hashtags],
      cursor: newResults.cursor,
      hasMore: newResults.hasMore,
      totalCount: newResults.totalCount || existing.totalCount,
      searchTime: newResults.searchTime,
    };
  },

  /**
   * Filter results by type
   */
  filterByType: (results: SearchResult, type: 'profiles' | 'posts' | 'feeds' | 'hashtags'): any[] => {
    return results[type] || [];
  },

  /**
   * Get total result count
   */
  getTotalCount: (results: SearchResult): number => {
    return results.profiles.length + 
           results.posts.length + 
           results.feeds.length + 
           results.hashtags.length;
  },

  /**
   * Sort results by relevance score
   */
  sortByRelevance: <T extends { relevanceScore: number }>(results: T[]): T[] => {
    return [...results].sort((a, b) => b.relevanceScore - a.relevanceScore);
  },

  /**
   * Highlight search terms in text
   */
  highlightText: (text: string, query: string): string => {
    if (!query.trim()) return text;

    const keywords = searchQueryUtils.extractKeywords(query);
    let highlightedText = text;

    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  },

  /**
   * Generate text snippet with highlighted terms
   */
  generateSnippet: (text: string, query: string, maxLength = 150): string => {
    if (!query.trim()) return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');

    const keywords = searchQueryUtils.extractKeywords(query);
    const lowerText = text.toLowerCase();
    
    // Find the first occurrence of any keyword
    let firstMatch = text.length;
    keywords.forEach(keyword => {
      const index = lowerText.indexOf(keyword.toLowerCase());
      if (index !== -1 && index < firstMatch) {
        firstMatch = index;
      }
    });

    // Extract snippet around the first match
    const start = Math.max(0, firstMatch - 50);
    const end = Math.min(text.length, start + maxLength);
    let snippet = text.slice(start, end);

    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return searchResultUtils.highlightText(snippet, query);
  },

  /**
   * Calculate relevance score for profile
   */
  calculateProfileRelevance: (profile: ProfileData, query: string): number => {
    const keywords = searchQueryUtils.extractKeywords(query);
    let score = 0;

    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Handle exact match (higher score)
      if (profile.handle.toLowerCase() === lowerKeyword) score += 100;
      else if (profile.handle.toLowerCase().includes(lowerKeyword)) score += 50;
      
      if (profile.displayName?.toLowerCase() === lowerKeyword) score += 80;
      else if (profile.displayName?.toLowerCase().includes(lowerKeyword)) score += 40;
      
      if (profile.description?.toLowerCase().includes(lowerKeyword)) score += 20;
    });

    // Boost score based on follower count (logarithmic)
    score += Math.log10(profile.followersCount + 1) * 5;

    // Boost verified profiles
    if (profile.labels?.some(label => label.val === 'verified')) {
      score += 10;
    }

    return score;
  },

  /**
   * Calculate relevance score for post
   */
  calculatePostRelevance: (post: PostData, query: string): number => {
    const keywords = searchQueryUtils.extractKeywords(query);
    let score = 0;

    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      const postText = post.record?.text?.toLowerCase() || '';
      
      // Count keyword occurrences
      const occurrences = (postText.match(new RegExp(lowerKeyword, 'g')) || []).length;
      score += occurrences * 10;
      
      // Boost if keyword is in hashtags
      if (post.record?.facets?.some(facet => 
        facet.features.some(feature => 
          feature.$type === 'app.bsky.richtext.facet#tag' && 
          feature.tag.toLowerCase().includes(lowerKeyword)
        )
      )) {
        score += 30;
      }
    });

    // Boost based on engagement
    score += (post.likeCount || 0) * 0.1;
    score += (post.repostCount || 0) * 0.2;
    score += (post.replyCount || 0) * 0.15;

    // Boost recent posts
    const postAge = Date.now() - new Date(post.indexedAt || 0).getTime();
    const daysSincePost = postAge / (1000 * 60 * 60 * 24);
    if (daysSincePost < 7) {
      score += (7 - daysSincePost) * 2;
    }

    return score;
  },
};

// ============================================================================
// Search History Utilities
// ============================================================================

export const searchHistoryUtils = {
  /**
   * Add entry to search history
   */
  addEntry: (history: SearchHistoryEntry[], entry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>): SearchHistoryEntry[] => {
    const newEntry: SearchHistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    // Remove duplicate queries
    const filtered = history.filter(existing => existing.query !== entry.query);
    
    // Add new entry at the beginning
    const updated = [newEntry, ...filtered];
    
    // Keep only the most recent 50 entries
    return updated.slice(0, 50);
  },

  /**
   * Remove entry from history
   */
  removeEntry: (history: SearchHistoryEntry[], id: string): SearchHistoryEntry[] => {
    return history.filter(entry => entry.id !== id);
  },

  /**
   * Get recent queries
   */
  getRecentQueries: (history: SearchHistoryEntry[], limit = 10): string[] => {
    return history
      .slice(0, limit)
      .map(entry => entry.query);
  },

  /**
   * Get popular queries
   */
  getPopularQueries: (history: SearchHistoryEntry[], limit = 10): string[] => {
    const queryCount = new Map<string, number>();
    
    history.forEach(entry => {
      const count = queryCount.get(entry.query) || 0;
      queryCount.set(entry.query, count + 1);
    });
    
    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  },

  /**
   * Export history to JSON
   */
  exportHistory: (history: SearchHistoryEntry[]): string => {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: history,
    }, null, 2);
  },

  /**
   * Import history from JSON
   */
  importHistory: (jsonData: string): SearchHistoryEntry[] => {
    try {
      const data = JSON.parse(jsonData);
      if (data.version === '1.0' && Array.isArray(data.entries)) {
        return data.entries;
      }
      throw new Error('Invalid history format');
    } catch (err) {
      console.error('Failed to import search history:', err);
      return [];
    }
  },
};

// ============================================================================
// Trending Utilities
// ============================================================================

export const trendingUtils = {
  /**
   * Sort trending topics by growth
   */
  sortByGrowth: (topics: TrendingTopic[]): TrendingTopic[] => {
    return [...topics].sort((a, b) => b.growth - a.growth);
  },

  /**
   * Sort trending topics by count
   */
  sortByCount: (topics: TrendingTopic[]): TrendingTopic[] => {
    return [...topics].sort((a, b) => b.count - a.count);
  },

  /**
   * Filter trending topics by category
   */
  filterByCategory: (topics: TrendingTopic[], category: string): TrendingTopic[] => {
    return topics.filter(topic => topic.category === category);
  },

  /**
   * Format trending count
   */
  formatCount: (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  },

  /**
   * Format growth percentage
   */
  formatGrowth: (growth: number): string => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  },

  /**
   * Get trending emoji based on growth
   */
  getTrendingEmoji: (growth: number): string => {
    if (growth > 100) return '🚀';
    if (growth > 50) return '📈';
    if (growth > 0) return '⬆️';
    if (growth === 0) return '➡️';
    return '⬇️';
  },
};

// ============================================================================
// Search Cache Utilities
// ============================================================================

export const searchCacheUtils = {
  /**
   * Generate cache key for search query
   */
  generateKey: (query: SearchQuery): string => {
    const keyParts = [
      query.term,
      query.type || 'all',
      JSON.stringify(query.filters || {}),
      query.sort || 'relevance',
    ];
    return `search:${btoa(keyParts.join('|'))}`;
  },

  /**
   * Check if cached result is expired
   */
  isExpired: (timestamp: number, maxAge = 5 * 60 * 1000): boolean => {
    return Date.now() - timestamp > maxAge;
  },

  /**
   * Store search result in cache
   */
  storeResult: (key: string, result: SearchResult): void => {
    try {
      const cacheData = {
        result,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('Failed to cache search result:', err);
    }
  },

  /**
   * Retrieve search result from cache
   */
  getResult: (key: string): SearchResult | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      if (searchCacheUtils.isExpired(cacheData.timestamp)) {
        localStorage.removeItem(key);
        return null;
      }
      
      return cacheData.result;
    } catch (err) {
      console.warn('Failed to retrieve cached search result:', err);
      return null;
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpired: (): void => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('search:'));
      keys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (searchCacheUtils.isExpired(cacheData.timestamp)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (err) {
      console.warn('Failed to clear expired cache:', err);
    }
  },
};

// ============================================================================
// Main Export
// ============================================================================

export const searchUtils = {
  query: searchQueryUtils,
  results: searchResultUtils,
  history: searchHistoryUtils,
  trending: trendingUtils,
  cache: searchCacheUtils,
};

export default searchUtils;