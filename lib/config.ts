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
 * Enables or disables the image resizing proxy.
 * When `true`, images in feeds are served through an external proxy
 * (`images.weserv.nl`) to optimize size and improve performance.
 * When `false`, original full-resolution images are loaded directly
 * from the Bluesky API. This acts as a master switch for the feature.
 */
export const ENABLE_IMAGE_RESIZING = true;