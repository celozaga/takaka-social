
const RESIZE_PROXY = 'https://images.weserv.nl/';

/**
 * Resizes an image URL using the images.weserv.nl proxy.
 * This helps in optimizing image loading times and reducing data usage.
 * @param url The original image URL.
 * @param width The target width in pixels.
 * @returns The new proxied and resized image URL.
 */
export const resizeImage = (url: string, width: number): string => {
  // Return empty string if URL is not provided to avoid errors.
  if (!url) {
    return '';
  }

  try {
    // The proxy works best with the URL without the protocol part (e.g., "cdn.bsky.app/...").
    const urlObject = new URL(url);
    const urlWithoutProtocol = urlObject.host + urlObject.pathname + urlObject.search;

    // Construct the new URL with width, quality, and webp output for optimization.
    return `${RESIZE_PROXY}?url=${encodeURIComponent(urlWithoutProtocol)}&w=${width}&q=80&output=webp`;
  } catch (e) {
    // If the URL is invalid or parsing fails, log the error and return the original URL as a fallback.
    console.error("Invalid URL provided for resizing:", url, e);
    return url;
  }
};
