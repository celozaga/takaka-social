import { useState, useEffect } from 'react';
import { VideoPlayer } from 'expo-video';

export const useHlsPlayer = (
    player: VideoPlayer | null,
    hlsUrl: string | null,
    fallbackUrl: string | null
) => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!player) return;

        const sourceToPlay = hlsUrl || fallbackUrl;
        if (!sourceToPlay) return;

        // Only replace if the source is different
        if (player.source?.uri === sourceToPlay) return;

        player.replace(sourceToPlay);
        
        const errorSubscription = player.addListener('error', (event) => {
            console.error('VideoPlayer error:', event.error);
            // If HLS fails and we have a fallback that's different, try it.
            if (player.source?.uri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
                console.log('HLS failed, trying fallback');
                player.replace(fallbackUrl);
            } else {
                setError("Could not play video");
            }
        });

        return () => {
            errorSubscription.remove();
        };
    }, [player, hlsUrl, fallbackUrl]);


    return { error };
};