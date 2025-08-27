// ============================================================================
// Profile Module - Utility Functions
// ============================================================================
//
// This file contains utility functions for profile-related operations,
// including parsers, validators, formatters, filters, sorters, and cache utilities.
//

import { ProfileData, ProfilePreferences, ProfileSearchFilters, SuggestedProfile } from '../types';
import { AppBskyActorDefs } from '@atproto/api';

// ============================================================================
// Profile Parsers
// ============================================================================

export const profileParsers = {
  /**
   * Extract DID from profile URI or handle
   */
  extractDid: (identifier: string): string => {
    if (identifier.startsWith('did:')) {
      return identifier;
    }
    if (identifier.startsWith('at://')) {
      const parts = identifier.split('/');
      return parts[2] || identifier;
    }
    return identifier;
  },

  /**
   * Parse handle from various formats
   */
  parseHandle: (handle: string): string => {
    return handle.replace(/^@/, '').toLowerCase();
  },

  /**
   * Extract profile metadata from AT Protocol record
   */
  parseProfileRecord: (record: any): Partial<ProfileData> => {
    return {
      displayName: record.displayName,
      description: record.description,
      avatar: record.avatar?.ref?.toString(),
      banner: record.banner?.ref?.toString(),
      labels: record.labels,
    };
  },

  /**
   * Parse profile viewer state
   */
  parseViewerState: (viewer: any): ProfileData['viewer'] => {
    if (!viewer) return undefined;
    
    return {
      muted: viewer.muted,
      mutedByList: viewer.mutedByList,
      blockedBy: viewer.blockedBy,
      blocking: viewer.blocking,
      blockingByList: viewer.blockingByList,
      following: viewer.following,
      followedBy: viewer.followedBy,
      knownFollowers: viewer.knownFollowers,
    };
  },

  /**
   * Extract mentions from profile description
   */
  extractMentions: (description: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9.-]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(description)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  },

  /**
   * Extract hashtags from profile description
   */
  extractHashtags: (description: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags: string[] = [];
    let match;
    
    while ((match = hashtagRegex.exec(description)) !== null) {
      hashtags.push(match[1]);
    }
    
    return hashtags;
  },
};

// ============================================================================
// Profile Validators
// ============================================================================

export const profileValidators = {
  /**
   * Validate profile handle format
   */
  isValidHandle: (handle: string): boolean => {
    const handleRegex = /^[a-zA-Z0-9.-]+$/;
    return handleRegex.test(handle) && handle.length >= 3 && handle.length <= 253;
  },

  /**
   * Validate DID format
   */
  isValidDid: (did: string): boolean => {
    return did.startsWith('did:') && did.length > 10;
  },

  /**
   * Validate display name
   */
  isValidDisplayName: (displayName: string): boolean => {
    return displayName.length <= 64 && displayName.trim().length > 0;
  },

  /**
   * Validate profile description
   */
  isValidDescription: (description: string): boolean => {
    return description.length <= 256;
  },

  /**
   * Validate profile preferences
   */
  validatePreferences: (preferences: ProfilePreferences): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (preferences.displayName && !profileValidators.isValidDisplayName(preferences.displayName)) {
      errors.push('Display name must be 1-64 characters');
    }
    
    if (preferences.description && !profileValidators.isValidDescription(preferences.description)) {
      errors.push('Description must be 256 characters or less');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Check if profile is complete
   */
  isProfileComplete: (profile: ProfileData): boolean => {
    return !!(profile.displayName && profile.description && profile.avatar);
  },

  /**
   * Validate image file for avatar/banner
   */
  isValidImage: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 1024 * 1024; // 1MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 1MB.' };
    }
    
    return { valid: true };
  },
};

// ============================================================================
// Profile Formatters
// ============================================================================

export const profileFormatters = {
  /**
   * Format follower count with abbreviations
   */
  formatFollowerCount: (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  },

  /**
   * Format profile handle with @ prefix
   */
  formatHandle: (handle: string): string => {
    return handle.startsWith('@') ? handle : `@${handle}`;
  },

  /**
   * Format profile description with rich text
   */
  formatDescription: (description: string): string => {
    return description
      .replace(/@([a-zA-Z0-9.-]+)/g, '<span class="mention">@$1</span>')
      .replace(/#([a-zA-Z0-9_]+)/g, '<span class="hashtag">#$1</span>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  },

  /**
   * Format profile join date
   */
  formatJoinDate: (createdAt: string): string => {
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  },

  /**
   * Format profile stats for display
   */
  formatStats: (profile: ProfileData): { posts: string; followers: string; following: string } => {
    return {
      posts: profileFormatters.formatFollowerCount(profile.postsCount),
      followers: profileFormatters.formatFollowerCount(profile.followersCount),
      following: profileFormatters.formatFollowerCount(profile.followsCount),
    };
  },

  /**
   * Generate profile URL
   */
  getProfileUrl: (handle: string): string => {
    const cleanHandle = profileParsers.parseHandle(handle);
    return `/profile/${cleanHandle}`;
  },

  /**
   * Generate avatar URL with fallback
   */
  getAvatarUrl: (profile: ProfileData, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    if (profile.avatar) {
      const sizeParam = size === 'small' ? '?w=64&h=64' : size === 'large' ? '?w=256&h=256' : '?w=128&h=128';
      return `${profile.avatar}${sizeParam}`;
    }
    
    // Generate deterministic avatar based on DID
    const hash = profile.did.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[Math.abs(hash) % colors.length];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" fill="${color}"/>
        <text x="64" y="80" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
          ${(profile.displayName || profile.handle).charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;
  },
};

// ============================================================================
// Profile Filters
// ============================================================================

export const profileFilters = {
  /**
   * Filter profiles by search term
   */
  bySearchTerm: (profiles: ProfileData[], term: string): ProfileData[] => {
    const searchTerm = term.toLowerCase();
    return profiles.filter(profile => 
      profile.handle.toLowerCase().includes(searchTerm) ||
      profile.displayName?.toLowerCase().includes(searchTerm) ||
      profile.description?.toLowerCase().includes(searchTerm)
    );
  },

  /**
   * Filter profiles by search filters
   */
  byFilters: (profiles: ProfileData[], filters: ProfileSearchFilters): ProfileData[] => {
    return profiles.filter(profile => {
      if (filters.hasAvatar && !profile.avatar) return false;
      if (filters.hasDescription && !profile.description) return false;
      if (filters.minFollowers && profile.followersCount < filters.minFollowers) return false;
      if (filters.maxFollowers && profile.followersCount > filters.maxFollowers) return false;
      if (filters.verified && !profile.labels?.some(label => label.val === 'verified')) return false;
      
      if (filters.associated) {
        const hasAssociated = filters.associated.some(type => {
          switch (type) {
            case 'lists': return profile.associated?.lists && profile.associated.lists > 0;
            case 'feedgens': return profile.associated?.feedgens && profile.associated.feedgens > 0;
            case 'starterPacks': return profile.associated?.starterPacks && profile.associated.starterPacks > 0;
            case 'labeler': return profile.associated?.labeler;
            default: return false;
          }
        });
        if (!hasAssociated) return false;
      }
      
      return true;
    });
  },

  /**
   * Filter out blocked/muted profiles
   */
  removeBlocked: (profiles: ProfileData[]): ProfileData[] => {
    return profiles.filter(profile => 
      !profile.viewer?.blocking && 
      !profile.viewer?.blockedBy &&
      !profile.viewer?.muted
    );
  },

  /**
   * Filter profiles by relationship status
   */
  byRelationship: (profiles: ProfileData[], relationship: 'following' | 'followers' | 'mutual'): ProfileData[] => {
    return profiles.filter(profile => {
      const viewer = profile.viewer;
      if (!viewer) return false;
      
      switch (relationship) {
        case 'following': return !!viewer.following;
        case 'followers': return !!viewer.followedBy;
        case 'mutual': return !!(viewer.following && viewer.followedBy);
        default: return false;
      }
    });
  },
};

// ============================================================================
// Profile Sorters
// ============================================================================

export const profileSorters = {
  /**
   * Sort profiles by follower count
   */
  byFollowers: (profiles: ProfileData[], ascending = false): ProfileData[] => {
    return [...profiles].sort((a, b) => 
      ascending ? a.followersCount - b.followersCount : b.followersCount - a.followersCount
    );
  },

  /**
   * Sort profiles by join date
   */
  byJoinDate: (profiles: ProfileData[], ascending = false): ProfileData[] => {
    return [...profiles].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  },

  /**
   * Sort profiles alphabetically by handle
   */
  byHandle: (profiles: ProfileData[], ascending = true): ProfileData[] => {
    return [...profiles].sort((a, b) => {
      const comparison = a.handle.localeCompare(b.handle);
      return ascending ? comparison : -comparison;
    });
  },

  /**
   * Sort profiles by display name
   */
  byDisplayName: (profiles: ProfileData[], ascending = true): ProfileData[] => {
    return [...profiles].sort((a, b) => {
      const nameA = a.displayName || a.handle;
      const nameB = b.displayName || b.handle;
      const comparison = nameA.localeCompare(nameB);
      return ascending ? comparison : -comparison;
    });
  },

  /**
   * Sort suggested profiles by score
   */
  bySuggestionScore: (profiles: SuggestedProfile[], ascending = false): SuggestedProfile[] => {
    return [...profiles].sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return ascending ? scoreA - scoreB : scoreB - scoreA;
    });
  },

  /**
   * Sort profiles by activity (posts count)
   */
  byActivity: (profiles: ProfileData[], ascending = false): ProfileData[] => {
    return [...profiles].sort((a, b) => 
      ascending ? a.postsCount - b.postsCount : b.postsCount - a.postsCount
    );
  },
};

// ============================================================================
// Profile Cache Utilities
// ============================================================================

export const profileCache = {
  /**
   * Generate cache key for profile
   */
  generateKey: (did: string, includeAnalytics = false): string => {
    return `profile:${did}${includeAnalytics ? ':analytics' : ''}`;
  },

  /**
   * Check if cached profile data is expired
   */
  isExpired: (timestamp: number, maxAge = 5 * 60 * 1000): boolean => {
    return Date.now() - timestamp > maxAge;
  },

  /**
   * Merge profile data with cached data
   */
  mergeProfileData: (cached: ProfileData, fresh: Partial<ProfileData>): ProfileData => {
    return {
      ...cached,
      ...fresh,
      viewer: {
        ...cached.viewer,
        ...fresh.viewer,
      },
      associated: {
        ...cached.associated,
        ...fresh.associated,
      },
    };
  },

  /**
   * Extract cacheable profile data
   */
  extractCacheableData: (profile: ProfileData): ProfileData => {
    // Remove sensitive or frequently changing data
    const { viewer, ...cacheableData } = profile;
    return {
      ...cacheableData,
      viewer: viewer ? {
        following: viewer.following,
        followedBy: viewer.followedBy,
        blocking: viewer.blocking,
        blockedBy: viewer.blockedBy,
        muted: viewer.muted,
      } : undefined,
    };
  },
};

// ============================================================================
// Main Export
// ============================================================================

export const profileUtils = {
  parsers: profileParsers,
  validators: profileValidators,
  formatters: profileFormatters,
  filters: profileFilters,
  sorters: profileSorters,
  cache: profileCache,
};

export default profileUtils;