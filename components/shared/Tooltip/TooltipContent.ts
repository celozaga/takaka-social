/**
 * ============================================================================
 * Tooltip Content Registry
 * ============================================================================
 *
 * Centralized registry for all tooltip content in the application.
 * This provides a single source of truth for tooltip messages,
 * making it easy to maintain and update help text across the app.
 *
 */

import { useTranslation } from 'react-i18next';

// ============================================================================
// Tooltip Content Keys
// ============================================================================

export type TooltipContentKey =
  // Navigation
  | 'nav.home'
  | 'nav.search'
  | 'nav.notifications'
  | 'nav.compose'
  | 'nav.more'
  | 'nav.profile'
  | 'nav.settings'
  
  // Post Actions
  | 'post.like'
  | 'post.unlike'
  | 'post.repost'
  | 'post.unrepost'
  | 'post.reply'
  | 'post.share'
  | 'post.bookmark'
  | 'post.unbookmark'
  | 'post.more'
  | 'post.delete'
  | 'post.edit'
  | 'post.report'
  
  // Profile Actions
  | 'profile.follow'
  | 'profile.unfollow'
  | 'profile.pending'
  | 'profile.block'
  | 'profile.unblock'
  | 'profile.mute'
  | 'profile.unmute'
  | 'profile.report'
  | 'profile.share'
  | 'profile.edit'
  
  // Settings
  | 'settings.theme'
  | 'settings.language'
  | 'settings.notifications'
  | 'settings.privacy'
  | 'settings.accessibility'
  | 'settings.account'
  | 'settings.moderation'
  | 'settings.advanced'
  | 'settings.help'
  
  // Feed Settings
  | 'feed.autoRefresh'
  | 'feed.showMediaOnly'
  | 'feed.showReposts'
  | 'feed.discover'
  | 'feed.video'
  | 'feed.whatsHotClassic'
  | 'feed.mobileGames'
  | 'feed.esportsBrasil'
  
  // Search Filters
  | 'search.filter.all'
  | 'search.filter.posts'
  | 'search.filter.users'
  | 'search.filter.media'
  
  // Accessibility Settings
  | 'accessibility.reduceMotion'
  | 'accessibility.highContrast'
  | 'accessibility.largeText'
  | 'accessibility.screenReader'
  | 'accessibility.increaseFontSize'
  | 'accessibility.boldText'
  | 'accessibility.autoPlayVideos'
  | 'accessibility.showAltText'
  | 'accessibility.soundEffects'
  | 'accessibility.hapticFeedback'
  
  // Notification Settings
  | 'notifications.push'
  | 'notifications.email'
  | 'notifications.likes'
  | 'notifications.reposts'
  | 'notifications.follows'
  | 'notifications.mentions'
  
  // Privacy Settings
  | 'privacy.publicProfile'
  | 'privacy.discoverableByEmail'
  | 'privacy.allowDirectMessages'
  | 'privacy.requireFollowApproval'
  | 'privacy.adultContent'
  | 'privacy.searchable'
  | 'privacy.showOnlineStatus'
  
  // Forms
  | 'form.required'
  | 'form.optional'
  | 'form.password.show'
  | 'form.password.hide'
  | 'form.clear'
  | 'form.search'
  
  // Media
  | 'media.play'
  | 'media.pause'
  | 'media.mute'
  | 'media.unmute'
  | 'media.fullscreen'
  | 'media.exitFullscreen'
  | 'media.download'
  | 'media.previousImage'
  | 'media.nextImage'
  | 'media.viewImage'
  | 'media.imageCounter'
  
  // Modals
  | 'modal.close'
  | 'modal.minimize'
  | 'modal.maximize'
  
  // General
  | 'general.close'
  | 'general.back'
  | 'general.refresh'
  | 'general.loading'
  | 'general.error'
  | 'general.retry'
  | 'general.help'
  | 'general.info'
  
  // Common Actions
  | 'common.close'
  | 'common.share'
  | 'common.more'
  
  // Simple Actions
  | 'follow'
  | 'like'
  | 'share'
  | 'reply';

// ============================================================================
// Default Tooltip Content (English)
// ============================================================================

const defaultTooltipContent: Record<TooltipContentKey, string> = {
  // Navigation
  'nav.home': 'Go to home feed',
  'nav.search': 'Search posts and users',
  'nav.notifications': 'View notifications',
  'nav.compose': 'Create a new post',
  'nav.more': 'More options',
  'nav.profile': 'View your profile',
  'nav.settings': 'Open settings',
  
  // Post Actions
  'post.like': 'Like this post',
  'post.unlike': 'Unlike this post',
  'post.repost': 'Repost to your feed',
  'post.unrepost': 'Remove repost',
  'post.reply': 'Reply to this post',
  'post.share': 'Share this post',
  'post.bookmark': 'Save to bookmarks',
  'post.unbookmark': 'Remove from bookmarks',
  'post.more': 'More post options',
  'post.delete': 'Delete this post',
  'post.edit': 'Edit this post',
  'post.report': 'Report this post',
  
  // Profile Actions
  'profile.follow': 'Follow this user',
  'profile.unfollow': 'Unfollow this user',
  'profile.pending': 'Follow request pending',
  'profile.block': 'Block this user',
  'profile.unblock': 'Unblock this user',
  'profile.mute': 'Mute this user',
  'profile.unmute': 'Unmute this user',
  'profile.report': 'Report this user',
  'profile.share': 'Share this profile',
  'profile.edit': 'Edit your profile',
  
  // Settings
  'settings.theme': 'Change app theme',
  'settings.language': 'Change app language',
  'settings.notifications': 'Notification preferences',
  'settings.privacy': 'Privacy settings',
  'settings.accessibility': 'Accessibility options',
  'settings.account': 'Account settings',
  'settings.moderation': 'Content moderation',
  'settings.advanced': 'Advanced settings',
  'settings.help': 'Get help and support',
  
  // Feed Settings
  'feed.autoRefresh': 'Automatically refresh your feed with new posts',
  'feed.showMediaOnly': 'Show only posts with images or videos',
  'feed.showReposts': 'Include reposts in your feed',
  'feed.discover': 'Explore trending content and discover new accounts',
  'feed.video': 'Browse video content from the Bluesky network',
  'feed.whatsHotClassic': 'See what\'s trending and popular right now',
  'feed.mobileGames': 'Gaming content including mobile gaming news',
  'feed.esportsBrasil': 'Brazilian esports content and gaming news',
  
  // Search Filters
  'search.filter.all': 'Search all content types',
  'search.filter.posts': 'Search only posts',
  'search.filter.users': 'Search only user profiles',
  'search.filter.media': 'Search only media content',
  
  // Accessibility Settings
  'accessibility.reduceMotion': 'Reduce animations and motion effects',
  'accessibility.highContrast': 'Increase contrast for better visibility',
  'accessibility.largeText': 'Use larger text size for better readability',
  'accessibility.screenReader': 'Optimize interface for screen readers',
  'accessibility.increaseFontSize': 'Make text larger throughout the app',
  'accessibility.boldText': 'Use bold text for better readability',
  'accessibility.autoPlayVideos': 'Automatically play videos when they appear',
  'accessibility.showAltText': 'Display alternative text for images',
  'accessibility.soundEffects': 'Play sound effects for interactions',
  'accessibility.hapticFeedback': 'Provide vibration feedback for actions',
  
  // Notification Settings
  'notifications.push': 'Receive push notifications on your device',
  'notifications.email': 'Receive notifications via email',
  'notifications.likes': 'Get notified when someone likes your posts',
  'notifications.reposts': 'Get notified when someone reposts your content',
  'notifications.follows': 'Get notified when someone follows you',
  'notifications.mentions': 'Get notified when someone mentions you',
  
  // Privacy Settings
  'privacy.publicProfile': 'Make your profile visible to everyone',
  'privacy.discoverableByEmail': 'Allow others to find you by email address',
  'privacy.allowDirectMessages': 'Allow others to send you direct messages',
  'privacy.requireFollowApproval': 'Require approval for new followers',
  'privacy.adultContent': 'Show content marked as adult/mature',
  'privacy.searchable': 'Allow your profile to appear in search results',
  'privacy.showOnlineStatus': 'Show when you are online to other users',
  
  // Forms
  'form.required': 'This field is required',
  'form.optional': 'This field is optional',
  'form.password.show': 'Show password',
  'form.password.hide': 'Hide password',
  'form.clear': 'Clear input',
  'form.search': 'Search',
  
  // Media
  'media.play': 'Play video',
  'media.pause': 'Pause video',
  'media.mute': 'Mute audio',
  'media.unmute': 'Unmute audio',
  'media.fullscreen': 'Enter fullscreen',
  'media.exitFullscreen': 'Exit fullscreen',
  'media.download': 'Download media',
  'media.previousImage': 'Previous image',
  'media.nextImage': 'Next image',
  'media.viewImage': 'View full size image',
  'media.imageCounter': 'Image counter',
  
  // Modals
  'modal.close': 'Close modal',
  'modal.minimize': 'Minimize modal',
  'modal.maximize': 'Maximize modal',
  
  // General
  'general.close': 'Close',
  'general.back': 'Go back',
  'general.refresh': 'Refresh',
  'general.loading': 'Loading...',
  'general.error': 'An error occurred',
  'general.retry': 'Try again',
  'general.help': 'Get help',
  'general.info': 'More information',
  
  // Common Actions
  'common.close': 'Close',
  'common.share': 'Share',
  'common.more': 'More options',
  
  // Simple Actions
  'follow': 'Follow',
  'like': 'Like',
  'share': 'Share',
  'reply': 'Reply',
};

// ============================================================================
// Tooltip Content Hook
// ============================================================================

/**
 * Hook to get tooltip content with internationalization support
 */
export const useTooltipContent = () => {
  const { t } = useTranslation();
  
  const getTooltipContent = (key: TooltipContentKey): string => {
    // Try to get translated content first
    const translationKey = `tooltip.${key}`;
    const translatedContent = t(translationKey);
    
    // If translation exists and is different from the key, use it
    if (translatedContent !== translationKey) {
      return translatedContent;
    }
    
    // Fallback to default English content
    return defaultTooltipContent[key] || key;
  };
  
  return { getTooltipContent };
};

// ============================================================================
// Tooltip Content Component
// ============================================================================

export interface TooltipContentProps {
  /** The tooltip content key */
  contentKey: TooltipContentKey;
  /** Optional custom content that overrides the key */
  customContent?: string;
  /** Optional interpolation values for translated content */
  values?: Record<string, any>;
}

/**
 * Get tooltip content by key with fallback support
 */
export const getTooltipContentByKey = (
  key: TooltipContentKey,
  customContent?: string,
  t?: (key: string, options?: any) => string
): string => {
  // Use custom content if provided
  if (customContent) {
    return customContent;
  }
  
  // Try translation if t function is available
  if (t) {
    const translationKey = `tooltip.${key}`;
    const translatedContent = t(translationKey);
    
    if (translatedContent !== translationKey) {
      return translatedContent;
    }
  }
  
  // Fallback to default content
  return defaultTooltipContent[key] || key;
};

export default defaultTooltipContent;