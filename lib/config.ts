/**
 * Central feature flag configuration for Takaka
 * 
 * This module controls what features are enabled/disabled across the app.
 * All new features must respect these flags to maintain the visual-first,
 * Xiaohongshu-style experience.
 */

export const FEATURES = {
  // Core content policies
  TEXT_POSTING: false,                    // Disable text-only posts
  QUOTE_POSTING: false,                   // Disable quote compose UI 
  SHOW_REPLIES_IN_MAIN_FEEDS: false,     // Hide replies from main discovery feeds (STRICT)
  VISUAL_ONLY_FEEDS: true,                // Filter feeds to show only image/video posts
  
  // Media features
  IMAGE_POSTING: true,                    // Allow image uploads
  VIDEO_POSTING: true,                    // Allow video uploads
  HLS_VIDEO: true,                        // Enable HLS video streaming
  VIDEO_THUMBNAILS: true,                 // Generate video thumbnails
  
  // User features
  BOOKMARKS: true,                        // Private bookmarks system
  FOLLOW_SYSTEM: true,                    // Follow/unfollow users
  SHARE_POSTS: true,                      // Cross-platform sharing
  
  // Feed features
  MASONRY_LAYOUT: true,                   // Grid/masonry feed layout
  INFINITE_SCROLL: true,                  // Pagination and infinite scroll
  PULL_TO_REFRESH: true,                  // Pull-to-refresh functionality
  
  // Watch section
  WATCH_SECTION: true,                    // Dedicated /watch video feed
  VIDEO_AUTOPLAY: true,                   // Autoplay videos in watch
  VIDEO_PRELOADING: true,                 // Preload next videos
  
  // Safety and moderation
  CONTENT_FILTERING: true,                // Respect ATProto labels and safety
  USER_BLOCKING: true,                    // Block/mute functionality
  NSFW_FILTERING: true,                   // NSFW content filtering
  
  // Platform-specific features
  WEB_SHARE_API: true,                    // Use Web Share API when available
  NATIVE_SHARING: true,                   // Native share sheet on mobile
  HARDWARE_ACCELERATION: true,            // Video hardware acceleration
} as const;

/**
 * Feature flags that can be overridden at runtime for testing
 * These should not be used in production
 */
export const RUNTIME_FLAGS = {
  DEBUG_VIDEO_LOGS: __DEV__,
  VERBOSE_API_LOGS: __DEV__,
  SHOW_PERFORMANCE_METRICS: __DEV__,
} as const;

/**
 * Media configuration settings
 */
export const MEDIA_CONFIG = {
  // Image settings
  MAX_IMAGES_PER_POST: 4,
  MAX_IMAGE_SIZE_MB: 10,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Video settings  
  MAX_VIDEOS_PER_POST: 1,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_VIDEO_DURATION_SECONDS: 300, // 5 minutes
  SUPPORTED_VIDEO_FORMATS: ['video/mp4', 'video/mov', 'video/avi'],
  
  // Thumbnail settings
  THUMBNAIL_WIDTH: 320,
  THUMBNAIL_HEIGHT: 180,
  THUMBNAIL_QUALITY: 0.8,
} as const;

/**
 * Feed filtering configuration
 */
export const FEED_CONFIG = {
  // Content types to show in main feeds when VISUAL_ONLY_FEEDS is true
  ALLOWED_EMBED_TYPES: [
    'app.bsky.embed.images#view',
    'app.bsky.embed.video#view',
    'app.bsky.embed.external#view', // External links with preview images
  ],
  
  // Content types to EXCLUDE from ALL feeds (strict policy)
  EXCLUDED_EMBED_TYPES: [
    'app.bsky.embed.record#view',           // Quote posts (not supported)
    'app.bsky.embed.recordWithMedia#view',  // Quote posts with media (not supported)
  ],
  
  // Content types to exclude from main feeds
  EXCLUDED_POST_TYPES: [
    // Text-only posts (no embed)
    'text-only',
    // Reply posts (unless in dedicated reply views)
    'reply',
    // Quote posts (never supported in this app)
    'quote',
  ],
  
  // Minimum requirements for posts to appear in visual feeds
  MIN_IMAGE_COUNT: 0, // Allow posts with any number of images
  MIN_VIDEO_COUNT: 0, // Allow posts with any number of videos
  REQUIRE_MEDIA: true, // Require at least one image or video
} as const;

/**
 * ATProto and Bluesky configuration
 */
export const ATP_CONFIG = {
  // Default PDS
  DEFAULT_PDS: 'https://bsky.social',
  
  // App identification
  APP_NAME: 'Takaka',
  APP_VERSION: '1.0.0',
  
  // Session settings
  SESSION_REFRESH_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  // Feed layout
  GRID_COLUMNS: 2,
  MASONRY_GAP: 8,
  
  // Video player
  CONTROLS_HIDE_DELAY_MS: 3000,
  SEEK_INTERVAL_SECONDS: 10,
  
  // Loading and pagination
  POSTS_PER_PAGE: 20,
  LOAD_MORE_THRESHOLD: 0.7,
  
  // Animation durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
} as const;

/**
 * Type helper to ensure feature flags are used correctly
 */
export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 * @param feature The feature flag to check
 * @returns Whether the feature is enabled
 */
export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURES[feature] === true;
};

/**
 * Get media configuration
 */
export const getMediaConfig = () => MEDIA_CONFIG;

/**
 * Get feed configuration
 */
export const getFeedConfig = () => FEED_CONFIG;

/**
 * Get UI configuration
 */
export const getUIConfig = () => UI_CONFIG;

/**
 * Get ATP configuration
 */
export const getATPConfig = () => ATP_CONFIG;

/**
 * Legacy exports for backwards compatibility
 */
export const PDS_URL = ATP_CONFIG.DEFAULT_PDS;
export const WEB_CLIENT_URL = 'https://bsky.app';