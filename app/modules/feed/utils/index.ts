// ============================================================================
// Feed Module Utils
// ============================================================================
//
// Utility functions for feed-related operations
//

import { FeedViewPost, SavedFeed, FeedGenerator, FeedPreferences } from '../types';
import { formatters, helpers } from '../../../core/utils';

// ============================================================================
// FEED PARSING UTILITIES
// ============================================================================

export const feedParsers = {
  // Extract feed URI from various formats
  extractFeedUri: (input: string): string | null => {
    if (!input) return null;
    
    // Handle AT URI format
    if (input.startsWith('at://')) {
      return input;
    }
    
    // Handle web URL format
    if (input.includes('feed/')) {
      const match = input.match(/feed\/([^\/?]+)/);
      if (match) {
        return `at://did:plc:${match[1]}/app.bsky.feed.generator/feed`;
      }
    }
    
    // Handle DID format
    if (input.startsWith('did:')) {
      return `at://${input}/app.bsky.feed.generator/feed`;
    }
    
    return null;
  },

  // Parse feed metadata from generator
  parseFeedMetadata: (generator: FeedGenerator) => {
    return {
      uri: generator.uri,
      did: generator.did,
      displayName: generator.displayName,
      description: generator.description,
      avatar: generator.avatar,
      creator: {
        did: generator.creator.did,
        handle: generator.creator.handle,
        displayName: generator.creator.displayName,
        avatar: generator.creator.avatar,
      },
      stats: {
        likes: generator.likeCount || 0,
        indexed: generator.indexedAt,
      },
      isLiked: !!generator.viewer?.like,
    };
  },

  // Extract post content for display
  extractPostContent: (post: FeedViewPost) => {
    const record = post.post.record;
    return {
      text: record.text,
      facets: record.facets || [],
      langs: record.langs || [],
      createdAt: record.createdAt,
      hasEmbed: !!post.post.embed,
      embedType: post.post.embed?.$type,
      isReply: !!record.reply,
      replyTo: record.reply?.parent.uri,
    };
  },
};

// ============================================================================
// FEED FILTERING UTILITIES
// ============================================================================

export const feedFilters = {
  // Filter posts based on preferences
  filterPosts: (posts: FeedViewPost[], preferences: FeedPreferences): FeedViewPost[] => {
    return posts.filter(post => {
      // Filter replies
      if (!preferences.showReplies && post.post.record.reply) {
        return false;
      }
      
      // Filter reposts
      if (!preferences.showReposts && post.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
        return false;
      }
      
      // Filter quote posts
      if (!preferences.showQuotePosts && post.post.embed?.$type === 'app.bsky.embed.record') {
        return false;
      }
      
      // Filter by language
      if (preferences.contentLanguages && preferences.contentLanguages.length > 0) {
        const postLangs = post.post.record.langs || [];
        if (postLangs.length > 0 && !postLangs.some(lang => preferences.contentLanguages!.includes(lang))) {
          return false;
        }
      }
      
      // Filter replies by unfollowed users
      if (preferences.hideRepliesByUnfollowed && post.post.record.reply) {
        const isFollowing = post.post.author.viewer?.following;
        if (!isFollowing) {
          return false;
        }
      }
      
      // Filter replies by like count
      if (preferences.hideRepliesByLikeCount && post.post.record.reply) {
        if (post.post.likeCount < preferences.hideRepliesByLikeCount) {
          return false;
        }
      }
      
      return true;
    });
  },

  // Filter feeds by search term
  searchFeeds: (feeds: FeedGenerator[], searchTerm: string): FeedGenerator[] => {
    if (!searchTerm.trim()) return feeds;
    
    const term = searchTerm.toLowerCase();
    return feeds.filter(feed => 
      feed.displayName.toLowerCase().includes(term) ||
      feed.description?.toLowerCase().includes(term) ||
      feed.creator.handle.toLowerCase().includes(term) ||
      feed.creator.displayName?.toLowerCase().includes(term)
    );
  },

  // Filter feeds by category
  filterByCategory: (feeds: FeedGenerator[], category: string): FeedGenerator[] => {
    if (!category) return feeds;
    
    // This would depend on how categories are stored in your feed data
    // For now, we'll use a simple tag-based approach
    return feeds.filter(feed => {
      // Check if category matches description or other metadata
      const description = feed.description?.toLowerCase() || '';
      return description.includes(category.toLowerCase());
    });
  },
};

// ============================================================================
// FEED SORTING UTILITIES
// ============================================================================

export const feedSorters = {
  // Sort feeds by popularity
  byPopularity: (feeds: FeedGenerator[]): FeedGenerator[] => {
    return [...feeds].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
  },

  // Sort feeds by creation date
  byDate: (feeds: FeedGenerator[], direction: 'asc' | 'desc' = 'desc'): FeedGenerator[] => {
    return [...feeds].sort((a, b) => {
      const dateA = new Date(a.indexedAt).getTime();
      const dateB = new Date(b.indexedAt).getTime();
      return direction === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },

  // Sort feeds alphabetically
  byName: (feeds: FeedGenerator[], direction: 'asc' | 'desc' = 'asc'): FeedGenerator[] => {
    return [...feeds].sort((a, b) => {
      const nameA = a.displayName.toLowerCase();
      const nameB = b.displayName.toLowerCase();
      const comparison = nameA.localeCompare(nameB);
      return direction === 'desc' ? -comparison : comparison;
    });
  },

  // Sort saved feeds by pin status and order
  savedFeeds: (feeds: SavedFeed[], pinnedOrder: string[] = []): SavedFeed[] => {
    return [...feeds].sort((a, b) => {
      const aPinIndex = pinnedOrder.indexOf(a.id);
      const bPinIndex = pinnedOrder.indexOf(b.id);
      
      // Pinned feeds first, in order
      if (aPinIndex !== -1 && bPinIndex !== -1) {
        return aPinIndex - bPinIndex;
      }
      if (aPinIndex !== -1) return -1;
      if (bPinIndex !== -1) return 1;
      
      // Then by creation date
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  },
};

// ============================================================================
// FEED VALIDATION UTILITIES
// ============================================================================

export const feedValidators = {
  // Validate feed URI format
  isValidFeedUri: (uri: string): boolean => {
    if (!uri) return false;
    
    // Basic AT URI validation for feeds
    const atUriRegex = /^at:\/\/did:[a-z0-9]+:[a-zA-Z0-9._:-]+\/app\.bsky\.feed\.generator\/[a-zA-Z0-9._-]+$/;
    return atUriRegex.test(uri);
  },

  // Validate feed display name
  isValidDisplayName: (name: string): boolean => {
    if (!name || name.trim().length === 0) return false;
    if (name.length > 64) return false;
    
    // Check for invalid characters
    return !/[<>"'&]/.test(name);
  },

  // Validate feed preferences
  validatePreferences: (preferences: Partial<FeedPreferences>): string[] => {
    const errors: string[] = [];
    
    if (preferences.hideRepliesByLikeCount !== undefined) {
      if (preferences.hideRepliesByLikeCount < 0) {
        errors.push('Like count threshold must be non-negative');
      }
    }
    
    if (preferences.contentLanguages) {
      if (!Array.isArray(preferences.contentLanguages)) {
        errors.push('Content languages must be an array');
      } else {
        const invalidLangs = preferences.contentLanguages.filter(
          lang => typeof lang !== 'string' || lang.length !== 2
        );
        if (invalidLangs.length > 0) {
          errors.push('Invalid language codes detected');
        }
      }
    }
    
    return errors;
  },
};

// ============================================================================
// FEED FORMATTING UTILITIES
// ============================================================================

export const feedFormatters = {
  // Format feed stats for display
  formatStats: (feed: FeedGenerator) => {
    return {
      likes: formatters.numberFormatters.compact(feed.likeCount || 0),
      created: formatters.timeFormatters.relative(feed.indexedAt),
      creator: `@${feed.creator.handle}`,
    };
  },

  // Format post stats for display
  formatPostStats: (post: FeedViewPost) => {
    return {
      replies: formatters.numberFormatters.compact(post.post.replyCount),
      reposts: formatters.numberFormatters.compact(post.post.repostCount),
      likes: formatters.numberFormatters.compact(post.post.likeCount),
      quotes: formatters.numberFormatters.compact(post.post.quoteCount || 0),
      created: formatters.timeFormatters.relative(post.post.record.createdAt),
    };
  },

  // Format feed description with mentions and links
  formatDescription: (description: string, facets: any[] = []) => {
    if (!description) return '';
    
    let formatted = description;
    
    // Apply facets (mentions, links, etc.)
    facets.forEach(facet => {
      const { index, features } = facet;
      const text = description.slice(index.byteStart, index.byteEnd);
      
      features.forEach((feature: any) => {
        if (feature.$type === 'app.bsky.richtext.facet#mention') {
          formatted = formatted.replace(text, `@${feature.did}`);
        } else if (feature.$type === 'app.bsky.richtext.facet#link') {
          formatted = formatted.replace(text, `[${text}](${feature.uri})`);
        }
      });
    });
    
    return formatted;
  },

  // Format feed URI for display
  formatFeedUri: (uri: string): string => {
    if (!uri) return '';
    
    // Extract the feed ID from the URI
    const match = uri.match(/\/([^/]+)$/);
    return match ? match[1] : uri;
  },
};

// ============================================================================
// FEED CACHE UTILITIES
// ============================================================================

export const feedCache = {
  // Generate cache key for feed
  generateCacheKey: (feedUri: string, params?: Record<string, any>): string => {
    const baseKey = `feed:${feedUri}`;
    if (!params) return baseKey;
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${baseKey}?${paramString}`;
  },

  // Check if cache is expired
  isCacheExpired: (timestamp: number, maxAge: number = 5 * 60 * 1000): boolean => {
    return Date.now() - timestamp > maxAge;
  },

  // Merge feed data with cache
  mergeFeedData: (cached: FeedViewPost[], fresh: FeedViewPost[]): FeedViewPost[] => {
    const merged = [...cached];
    const existingUris = new Set(cached.map(post => post.post.uri));
    
    fresh.forEach(post => {
      if (!existingUris.has(post.post.uri)) {
        merged.push(post);
      }
    });
    
    return merged;
  },
};

// ============================================================================
// COMBINED FEED UTILS EXPORT
// ============================================================================

export const feedUtils = {
  parsers: feedParsers,
  filters: feedFilters,
  sorters: feedSorters,
  validators: feedValidators,
  formatters: feedFormatters,
  cache: feedCache,
};

export default feedUtils;