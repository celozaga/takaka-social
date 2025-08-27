// ============================================================================
// Post Module Utilities
// ============================================================================
//
// Utility functions for post-related operations
//

import { PostData, PostFacet, PostEmbed, ComposerState, PostThread } from '../types';
import { helpers } from '../../../core/utils';

// ============================================================================
// POST PARSERS
// ============================================================================

export const postParsers = {
  /**
   * Extract AT URI from post
   */
  extractUri: (post: PostData): string => {
    return post.uri;
  },

  /**
   * Extract post text content
   */
  extractText: (post: PostData): string => {
    return post.record.text || '';
  },

  /**
   * Extract mentions from post
   */
  extractMentions: (post: PostData): string[] => {
    const text = post.record.text || '';
    return helpers.stringHelpers.extractMentions(text);
  },

  /**
   * Extract hashtags from post
   */
  extractHashtags: (post: PostData): string[] => {
    const text = post.record.text || '';
    return helpers.stringHelpers.extractHashtags(text);
  },

  /**
   * Extract links from post facets
   */
  extractLinks: (post: PostData): string[] => {
    const facets = post.record.facets || [];
    return facets
      .filter(facet => facet.features.some(f => f.$type === 'app.bsky.richtext.facet#link'))
      .map(facet => {
        const linkFeature = facet.features.find(f => f.$type === 'app.bsky.richtext.facet#link');
        return linkFeature?.uri || '';
      })
      .filter(Boolean);
  },

  /**
   * Extract media from post embed
   */
  extractMedia: (post: PostData): { type: string; url?: string; alt?: string }[] => {
    const embed = post.embed || post.record.embed;
    if (!embed) return [];

    if (embed.$type === 'app.bsky.embed.images#view' && embed.images) {
      return embed.images.map(img => ({
        type: 'image',
        url: img.image?.ref?.$link,
        alt: img.alt
      }));
    }

    if (embed.$type === 'app.bsky.embed.video#view' && embed.video) {
      return [{
        type: 'video',
        url: embed.video?.ref?.$link,
        alt: embed.alt
      }];
    }

    return [];
  },

  /**
   * Parse post creation date
   */
  parseCreatedAt: (post: PostData): Date => {
    return new Date(post.record.createdAt);
  },

  /**
   * Parse post author information
   */
  parseAuthor: (post: PostData) => {
    return {
      did: post.author.did,
      handle: post.author.handle,
      displayName: post.author.displayName,
      avatar: post.author.avatar,
      isFollowing: !!post.author.viewer?.following,
      isFollowedBy: !!post.author.viewer?.followedBy,
      isMuted: !!post.author.viewer?.muted,
      isBlocked: !!post.author.viewer?.blocking
    };
  }
};

// ============================================================================
// POST VALIDATORS
// ============================================================================

export const postValidators = {
  /**
   * Validate post text length
   */
  validateTextLength: (text: string, maxLength: number = 300): boolean => {
    return text.length <= maxLength;
  },

  /**
   * Validate post URI format
   */
  validateUri: (uri: string): boolean => {
    return /^at:\/\/[a-zA-Z0-9._-]+\/app\.bsky\.feed\.post\/[a-zA-Z0-9]+$/.test(uri);
  },

  /**
   * Validate post facets
   */
  validateFacets: (facets: PostFacet[], text: string): boolean => {
    return facets.every(facet => {
      const { byteStart, byteEnd } = facet.index;
      return byteStart >= 0 && byteEnd <= text.length && byteStart < byteEnd;
    });
  },

  /**
   * Validate composer state
   */
  validateComposerState: (state: ComposerState): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!state.text.trim()) {
      errors.push('Post text cannot be empty');
    }

    if (state.text.length > 300) {
      errors.push('Post text exceeds maximum length');
    }

    if (state.facets && !postValidators.validateFacets(state.facets, state.text)) {
      errors.push('Invalid facets detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate media upload
   */
  validateMedia: (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 50MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported file type' };
    }

    return { isValid: true };
  }
};

// ============================================================================
// POST FORMATTERS
// ============================================================================

export const postFormatters = {
  /**
   * Format post stats
   */
  formatStats: (post: PostData) => {
    return {
      likes: helpers.numberFormatters.formatCompact(post.likeCount),
      reposts: helpers.numberFormatters.formatCompact(post.repostCount),
      replies: helpers.numberFormatters.formatCompact(post.replyCount),
      quotes: helpers.numberFormatters.formatCompact(post.quoteCount || 0)
    };
  },

  /**
   * Format post timestamp
   */
  formatTimestamp: (post: PostData, format: 'relative' | 'absolute' | 'compact' = 'relative'): string => {
    const date = new Date(post.record.createdAt);
    
    switch (format) {
      case 'relative':
        return helpers.timeFormatters.formatRelative(date);
      case 'absolute':
        return helpers.timeFormatters.formatAbsolute(date);
      case 'compact':
        return helpers.timeFormatters.formatCompact(date);
      default:
        return date.toISOString();
    }
  },

  /**
   * Format post text with rich text features
   */
  formatRichText: (post: PostData): { text: string; facets: PostFacet[] } => {
    return {
      text: post.record.text,
      facets: post.record.facets || []
    };
  },

  /**
   * Format post for sharing
   */
  formatForSharing: (post: PostData): string => {
    const author = post.author.displayName || post.author.handle;
    const text = post.record.text;
    const url = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`;
    
    return `"${text}" - ${author}\n\n${url}`;
  },

  /**
   * Format post preview
   */
  formatPreview: (post: PostData, maxLength: number = 100): string => {
    const text = post.record.text;
    return helpers.stringHelpers.truncate(text, maxLength);
  }
};

// ============================================================================
// POST FILTERS
// ============================================================================

export const postFilters = {
  /**
   * Filter posts by author
   */
  byAuthor: (posts: PostData[], authorDid: string): PostData[] => {
    return posts.filter(post => post.author.did === authorDid);
  },

  /**
   * Filter posts by date range
   */
  byDateRange: (posts: PostData[], startDate: Date, endDate: Date): PostData[] => {
    return posts.filter(post => {
      const postDate = new Date(post.record.createdAt);
      return postDate >= startDate && postDate <= endDate;
    });
  },

  /**
   * Filter posts with media
   */
  withMedia: (posts: PostData[]): PostData[] => {
    return posts.filter(post => {
      const embed = post.embed || post.record.embed;
      return embed && (embed.$type === 'app.bsky.embed.images#view' || embed.$type === 'app.bsky.embed.video#view');
    });
  },

  /**
   * Filter posts by text content
   */
  byTextContent: (posts: PostData[], searchTerm: string): PostData[] => {
    const term = searchTerm.toLowerCase();
    return posts.filter(post => 
      post.record.text.toLowerCase().includes(term)
    );
  },

  /**
   * Filter posts by engagement threshold
   */
  byEngagement: (posts: PostData[], minEngagement: number): PostData[] => {
    return posts.filter(post => {
      const totalEngagement = post.likeCount + post.repostCount + post.replyCount;
      return totalEngagement >= minEngagement;
    });
  },

  /**
   * Filter out blocked or muted authors
   */
  filterModerated: (posts: PostData[]): PostData[] => {
    return posts.filter(post => {
      const viewer = post.author.viewer;
      return !viewer?.muted && !viewer?.blocking && !viewer?.blockedBy;
    });
  }
};

// ============================================================================
// POST SORTERS
// ============================================================================

export const postSorters = {
  /**
   * Sort posts by creation date
   */
  byDate: (posts: PostData[], order: 'asc' | 'desc' = 'desc'): PostData[] => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.record.createdAt).getTime();
      const dateB = new Date(b.record.createdAt).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },

  /**
   * Sort posts by engagement
   */
  byEngagement: (posts: PostData[], order: 'asc' | 'desc' = 'desc'): PostData[] => {
    return [...posts].sort((a, b) => {
      const engagementA = a.likeCount + a.repostCount + a.replyCount;
      const engagementB = b.likeCount + b.repostCount + b.replyCount;
      return order === 'desc' ? engagementB - engagementA : engagementA - engagementB;
    });
  },

  /**
   * Sort posts by like count
   */
  byLikes: (posts: PostData[], order: 'asc' | 'desc' = 'desc'): PostData[] => {
    return [...posts].sort((a, b) => {
      return order === 'desc' ? b.likeCount - a.likeCount : a.likeCount - b.likeCount;
    });
  },

  /**
   * Sort posts by author handle
   */
  byAuthor: (posts: PostData[], order: 'asc' | 'desc' = 'asc'): PostData[] => {
    return [...posts].sort((a, b) => {
      const comparison = a.author.handle.localeCompare(b.author.handle);
      return order === 'desc' ? -comparison : comparison;
    });
  }
};

// ============================================================================
// POST THREAD UTILITIES
// ============================================================================

export const threadUtils = {
  /**
   * Flatten thread structure
   */
  flattenThread: (thread: PostThread): PostData[] => {
    const posts: PostData[] = [thread.post];
    
    if (thread.parent) {
      posts.unshift(...threadUtils.flattenThread(thread.parent));
    }
    
    if (thread.replies) {
      thread.replies.forEach(reply => {
        posts.push(...threadUtils.flattenThread(reply));
      });
    }
    
    return posts;
  },

  /**
   * Get thread depth
   */
  getThreadDepth: (thread: PostThread): number => {
    let maxDepth = 0;
    
    if (thread.replies) {
      thread.replies.forEach(reply => {
        const depth = threadUtils.getThreadDepth(reply);
        maxDepth = Math.max(maxDepth, depth);
      });
    }
    
    return maxDepth + 1;
  },

  /**
   * Find post in thread
   */
  findPostInThread: (thread: PostThread, postUri: string): PostData | null => {
    if (thread.post.uri === postUri) {
      return thread.post;
    }
    
    if (thread.parent) {
      const found = threadUtils.findPostInThread(thread.parent, postUri);
      if (found) return found;
    }
    
    if (thread.replies) {
      for (const reply of thread.replies) {
        const found = threadUtils.findPostInThread(reply, postUri);
        if (found) return found;
      }
    }
    
    return null;
  },

  /**
   * Get thread root
   */
  getThreadRoot: (thread: PostThread): PostData => {
    let current = thread;
    while (current.parent) {
      current = current.parent;
    }
    return current.post;
  }
};

// ============================================================================
// POST CACHE UTILITIES
// ============================================================================

export const postCache = {
  /**
   * Generate cache key for post
   */
  generateKey: (postUri: string, includeThread: boolean = false): string => {
    const base = `post:${postUri}`;
    return includeThread ? `${base}:thread` : base;
  },

  /**
   * Check if post data is expired
   */
  isExpired: (timestamp: string, maxAge: number = 5 * 60 * 1000): boolean => {
    return Date.now() - new Date(timestamp).getTime() > maxAge;
  },

  /**
   * Merge post data with cached data
   */
  mergePostData: (cached: PostData, fresh: PostData): PostData => {
    return {
      ...cached,
      ...fresh,
      // Preserve viewer state if not in fresh data
      viewer: {
        ...cached.viewer,
        ...fresh.viewer
      },
      // Update stats
      likeCount: fresh.likeCount,
      repostCount: fresh.repostCount,
      replyCount: fresh.replyCount,
      quoteCount: fresh.quoteCount
    };
  }
};

// ============================================================================
// COMBINED EXPORT
// ============================================================================

export const postUtils = {
  parsers: postParsers,
  validators: postValidators,
  formatters: postFormatters,
  filters: postFilters,
  sorters: postSorters,
  thread: threadUtils,
  cache: postCache
};

export default postUtils;