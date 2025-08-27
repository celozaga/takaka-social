// ============================================================================
// Profile Module - Components Index
// ============================================================================
//
// Centralized exports for all profile components, providing a clean
// interface for importing components from the profile module.
//

// ============================================================================
// Core Components
// ============================================================================

export { default as ProfileScreen } from './ProfileScreen';
export { default as EditProfileModal } from './EditProfileModal';
export { default as FollowsHeader } from './FollowsHeader';
export { default as FollowsScreen } from './FollowsScreen';
export { default as SuggestedFollows } from './SuggestedFollows';

// ============================================================================
// Component Types
// ============================================================================

// Re-export component prop types if they exist
// These would be defined in the individual component files
export type { ProfileScreenProps } from './ProfileScreen';
export type { EditProfileModalProps } from './EditProfileModal';
export type { FollowsHeaderProps } from './FollowsHeader';
export type { FollowsScreenProps } from './FollowsScreen';
export type { SuggestedFollowsProps } from './SuggestedFollows';

// ============================================================================
// Component Utilities
// ============================================================================

import React from 'react';

/**
 * Configuration for creating profile components
 */
export interface ProfileComponentsConfig {
  /**
   * Default theme variant
   */
  theme?: 'light' | 'dark' | 'auto';
  
  /**
   * Default avatar size
   */
  defaultAvatarSize?: 'small' | 'medium' | 'large' | 'xlarge';
  
  /**
   * Whether to show verification badges by default
   */
  showVerificationBadges?: boolean;
  
  /**
   * Default follow button variant
   */
  followButtonVariant?: 'primary' | 'secondary' | 'outline';
  
  /**
   * Animation preferences
   */
  animations?: {
    enabled: boolean;
    duration: number;
  };
  
  /**
   * Profile image quality settings
   */
  imageQuality?: {
    avatar: 'low' | 'medium' | 'high';
    banner: 'low' | 'medium' | 'high';
  };
}

/**
 * Factory function to create profile components with shared configuration
 */
export function createProfileComponents(config: ProfileComponentsConfig = {}) {
  const {
    defaultAvatarSize = 'medium',
    showVerificationBadges = true,
    followButtonVariant = 'primary',
    animations = { enabled: true, duration: 200 },
    imageQuality = { avatar: 'medium', banner: 'high' },
  } = config;
  
  return {
    /**
     * Pre-configured ProfileScreen component
     */
    Screen: (props: any) => {
      const defaultProps = {
        avatarSize: defaultAvatarSize,
        showVerificationBadge: showVerificationBadges,
        imageQuality,
        ...props,
      };
      
      return React.createElement('ProfileScreen', defaultProps);
    },
    
    /**
     * Pre-configured EditProfileModal component
     */
    EditModal: (props: any) => {
      const defaultProps = {
        animations,
        imageQuality,
        ...props,
      };
      
      return React.createElement('EditProfileModal', defaultProps);
    },
    
    /**
     * Pre-configured FollowsScreen component
     */
    FollowsScreen: (props: any) => {
      const defaultProps = {
        avatarSize: defaultAvatarSize,
        followButtonVariant,
        showVerificationBadge: showVerificationBadges,
        ...props,
      };
      
      return React.createElement('FollowsScreen', defaultProps);
    },
    
    /**
     * Pre-configured SuggestedFollows component
     */
    SuggestedFollows: (props: any) => {
      const defaultProps = {
        avatarSize: defaultAvatarSize,
        followButtonVariant,
        showVerificationBadge: showVerificationBadges,
        ...props,
      };
      
      return React.createElement('SuggestedFollows', defaultProps);
    },
  };
}

/**
 * Utility functions for profile components
 */
export const profileComponentUtils = {
  /**
   * Get avatar size in pixels
   */
  getAvatarSize: (size: 'small' | 'medium' | 'large' | 'xlarge'): number => {
    const sizes = {
      small: 32,
      medium: 48,
      large: 64,
      xlarge: 96,
    };
    return sizes[size];
  },
  
  /**
   * Format follower count for display
   */
  formatFollowerCount: (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  },
  
  /**
   * Generate profile URL
   */
  generateProfileUrl: (handle: string): string => {
    return `/profile/${handle}`;
  },
  
  /**
   * Check if profile is verified
   */
  isVerified: (profile: any): boolean => {
    return profile?.verified === true || profile?.labels?.includes('verified');
  },
  
  /**
   * Get profile display name
   */
  getDisplayName: (profile: any): string => {
    return profile?.displayName || profile?.handle || 'Unknown User';
  },
  
  /**
   * Get profile avatar URL with fallback
   */
  getAvatarUrl: (profile: any, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    const baseUrl = profile?.avatar;
    if (!baseUrl) return '/default-avatar.png';
    
    // Add size parameter if supported
    const sizeParam = size === 'small' ? '?size=32' : size === 'large' ? '?size=128' : '?size=64';
    return `${baseUrl}${sizeParam}`;
  },
  
  /**
   * Get profile banner URL with fallback
   */
  getBannerUrl: (profile: any): string => {
    return profile?.banner || '/default-banner.png';
  },
  
  /**
   * Check if user can edit profile
   */
  canEditProfile: (profile: any, currentUser: any): boolean => {
    return profile?.did === currentUser?.did;
  },
  
  /**
   * Check if user is following
   */
  isFollowing: (profile: any): boolean => {
    return profile?.viewer?.following !== undefined;
  },
  
  /**
   * Check if user is followed by
   */
  isFollowedBy: (profile: any): boolean => {
    return profile?.viewer?.followedBy !== undefined;
  },
};

/**
 * Constants for profile components
 */
export const PROFILE_COMPONENTS_CONFIG = {
  /**
   * Default component configuration
   */
  defaults: {
    avatarSize: 'medium' as const,
    showVerificationBadges: true,
    followButtonVariant: 'primary' as const,
    animations: {
      enabled: true,
      duration: 200,
    },
    imageQuality: {
      avatar: 'medium' as const,
      banner: 'high' as const,
    },
  },
  
  /**
   * Available component variants
   */
  variants: {
    avatarSizes: ['small', 'medium', 'large', 'xlarge'] as const,
    followButtonVariants: ['primary', 'secondary', 'outline'] as const,
    imageQualities: ['low', 'medium', 'high'] as const,
  },
  
  /**
   * Component accessibility labels
   */
  accessibility: {
    profileImage: 'Profile image',
    bannerImage: 'Profile banner',
    followButton: 'Follow user',
    unfollowButton: 'Unfollow user',
    editProfile: 'Edit profile',
    viewFollowers: 'View followers',
    viewFollowing: 'View following',
    verificationBadge: 'Verified account',
  },
  
  /**
   * Test IDs for components
   */
  testIds: {
    profileScreen: 'profile-screen',
    editProfileModal: 'edit-profile-modal',
    followsScreen: 'follows-screen',
    suggestedFollows: 'suggested-follows',
    followButton: 'follow-button',
    profileImage: 'profile-image',
    bannerImage: 'banner-image',
  },
} as const;