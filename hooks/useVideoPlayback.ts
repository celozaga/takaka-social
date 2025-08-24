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
    const [playbackUrls, setPlaybackUrls] = useState<{ hlsUrl: string | null; fallbackUrl: string | null }>({ hlsUrl: null, fallbackUrl: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveUrls = () => {
            setIsLoading(true);
            setError(null);
            setPlaybackUrls({ hlsUrl: null, fallbackUrl: null });

            if (!embed || !authorDid) {
                setIsLoading(false);
                return;
            }
            
            try {
                // 1. Construct HLS URL
                const hlsUrl = `${HLS_BASE_URL}/${authorDid}/${embed.cid}/playlist.m3u8`;

                // 2. Construct fallback getBlob URL
                const serviceUrl = agent.service.toString();
                const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
                const fallbackUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;
                
                setPlaybackUrls({ hlsUrl, fallbackUrl });
            } catch (e) {
                console.error("Failed to construct video URLs", e);
                setError("Could not determine video URL.");
            } finally {
                setIsLoading(false);
            }
        };

        resolveUrls();
    }, [agent.service, embed, authorDid]);

    return { ...playbackUrls, isLoading, error };
};
