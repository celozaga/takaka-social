
import { useState, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyEmbedVideo } from '@atproto/api';

/**
 * Resolves the best video playback URL for a given post.
 * It prioritizes fetching an HLS streaming URL for a better user experience
 * (progressive loading). If that fails, it gracefully falls back to a direct
 * blob URL.
 */
export const useVideoPlayback = (postUri: string | undefined, embed: AppBskyEmbedVideo.View | undefined, authorDid: string | undefined) => {
    const { agent } = useAtp();
    const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveUrl = async () => {
            if (!postUri || !embed || !authorDid) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            // --- Fallback URL ---
            // The official, documented, and stable way to get the video blob.
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
            const blobUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;
            
            try {
                // --- Primary Method: HLS Streaming (Used by official client) ---
                // This provides a better user experience with progressive loading.
                const res = await (agent.app.bsky.video as any).getPlaybackUrl({
                    video: postUri,
                });

                if (res.data?.playbackUrl) {
                    setPlaybackUrl(res.data.playbackUrl);
                } else {
                    // If the HLS endpoint doesn't return a URL, use the fallback immediately.
                    console.warn(`HLS endpoint returned no playbackUrl for post ${postUri}, falling back to direct blob.`);
                    setPlaybackUrl(blobUrl);
                }
            } catch (e) {
                console.warn(`HLS playback URL fetch failed for post ${postUri}, falling back to direct blob.`, e);
                // If the HLS endpoint throws an error, fall back to the direct blob URL.
                setPlaybackUrl(blobUrl);
            } finally {
                setIsLoading(false);
            }
        };

        resolveUrl();

    }, [agent, postUri, embed, authorDid]);

    return { playbackUrl, isLoading, error };
};
