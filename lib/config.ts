/**
 * ============================================================================
 * App Configuration
 * ============================================================================
 *
 * This file contains the central configuration for the application.
 * It's the ideal place to manage environment-specific variables
 * and feature flags.
 *
 * @see https://atproto.com/docs/faq#how-do-i-choose-a-pds-server
 * ============================================================================
 */

/**
 * The URL of the Personal Data Server (PDS) to connect to.
 * This is the primary entry point for the Bluesky network.
 * For most users, this will be the default Bluesky PDS.
 *
 * To use a different PDS, simply change this URL.
 * For example: 'https://my-custom-pds.com'
 */
export const PDS_URL = 'https://bsky.social';

/**
 * The URL for the Bluesky web client, used for external links
 * like creating App Passwords. If you are using a custom PDS
 * that has its own web client, update this URL.
 */
export const WEB_CLIENT_URL = 'https://bsky.app';

/**
 * ============================================================================
 * Feature Flags
 * ============================================================================
 */

/**
 * Enables or disables image resizing through an external proxy (images.weserv.nl).
 * When enabled, image URLs are rewritten to serve optimized, cached, and resized
 * versions, which can significantly improve performance and reduce data usage.
 * Set to `false` to use original image URLs directly.
 */
export const ENABLE_IMAGE_RESIZING = true;