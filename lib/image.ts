import { ENABLE_IMAGE_RESIZING } from './config';

const RESIZE_PROXY = 'https://images.weserv.nl/';

/**
 * Resizes an image URL using the images.weserv.nl proxy.
 * This helps in optimizing image loading times and reducing data usage.
 * This feature can be toggled via the `ENABLE_IMAGE_RESIZING` flag in config.ts.
 * @param url The original image URL.
 * @param width The target width in pixels.
 * @returns The new proxied and resized image URL, or the original if resizing is disabled.
 */
export const resizeImage = (url: string, width: number): string => {
  // Return empty string if URL is not provided to avoid errors.
  if (!url) {
    return '';
  }

  // If the feature is disabled via the config flag, return the original URL.
  if (!ENABLE_IMAGE_RESIZING) {
    return url;
  }

  try {
    const urlObject = new URL(url);

    // BSKY VIDEO THUMBNAIL FIX: The video.bsky.app domain returns 503 errors when proxied.
    // To prevent broken thumbnails, we bypass the proxy for these specific URLs.
    if (urlObject.hostname === 'video.bsky.app') {
      return url;
    }

    // The proxy works best with the URL without the protocol part (e.g., "cdn.bsky.app/...").
    const urlWithoutProtocol = urlObject.host + urlObject.pathname + urlObject.search;

    // Construct the new URL with width, quality, and webp output for optimization.
    return `${RESIZE_PROXY}?url=${encodeURIComponent(urlWithoutProtocol)}&w=${width}&q=50&output=webp`;
  } catch (e) {
    // If the URL is invalid or parsing fails, log the error and return the original URL as a fallback.
    console.error("Invalid URL provided for resizing:", url, e);
    return url;
  }
};