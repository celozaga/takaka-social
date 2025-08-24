
import { useState, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyEmbedVideo } from '@atproto/api';

/**
 * Resolves the video playback URL for a given post using the official and stable
 * `com.atproto.sync.getBlob` endpoint.
 * This ensures API compliance and reliable video loading.
 */
export const useVideoPlayback = (postUri: string | undefined, embed: AppBskyEmbedVideo.View | undefined, authorDid: string | undefined) => {
    const { agent } = useAtp();
    const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveUrl = () => {
            setIsLoading(true);
            setError(null);
            setPlaybackUrl(null);

            if (!postUri || !embed || !authorDid) {
                // Not enough info to build a URL
                setIsLoading(false);
                return;
            }
            
            try {
                // The official, documented, and stable way to get the video blob.
                const serviceUrl = agent.service.toString();
                const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
                const blobUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;
                setPlaybackUrl(blobUrl);
            } catch (e) {
                console.error("Failed to construct blob URL", e);
                setError("Could not determine video URL.");
            } finally {
                setIsLoading(false);
            }
        };

        resolveUrl();

    }, [agent.service, postUri, embed, authorDid]);

    return { playbackUrl, isLoading, error };
};
