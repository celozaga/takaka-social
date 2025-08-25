import { useState, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyEmbedVideo } from '@atproto/api';

const HLS_BASE_URL = 'https://video.bsky.app/watch';

/**
 * Resolves video playback URLs for a given post, providing both a primary HLS URL
 * and a fallback MP4 URL from the getBlob endpoint.
 */
export const useVideoPlayback = (embed: AppBskyEmbedVideo.View | undefined, authorDid: string | undefined) => {
    const { agent } = useAtp();
    const [playbackUrls, setPlaybackUrls] = useState<{ 
        hlsUrl: string | null; 
        fallbackUrl: string | null;
        streamingUrl: string | null;
    }>({ hlsUrl: null, fallbackUrl: null, streamingUrl: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveUrls = () => {
            setIsLoading(true);
            setError(null);
            setPlaybackUrls({ hlsUrl: null, fallbackUrl: null, streamingUrl: null });

            if (!embed || !authorDid || !agent?.service) {
                setIsLoading(false);
                return;
            }
            
            try {
                // 1. Construct HLS URL (for future use if service is restored)
                const hlsUrl = `${HLS_BASE_URL}/${authorDid}/${embed.cid}/playlist.m3u8`;

                // 2. Construct fallback getBlob URL
                const serviceUrl = agent.service.toString();
                const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
                const fallbackUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;

                // 3. Construct streaming URL with Range request support
                // This URL will support HTTP Range requests for progressive loading
                const streamingUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}&streaming=true`;
                
                setPlaybackUrls({ hlsUrl, fallbackUrl, streamingUrl });
            } catch (e) {
                console.error("Failed to construct video URLs", e);
                setError("Could not determine video URL.");
            } finally {
                setIsLoading(false);
            }
        };

        // Only resolve URLs if agent is ready
        if (agent && agent.service) {
            resolveUrls();
        } else {
            setIsLoading(false);
        }
    }, [agent, embed, authorDid]);

    return { ...playbackUrls, isLoading, error };
};
