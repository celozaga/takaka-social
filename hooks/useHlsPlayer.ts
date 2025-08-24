import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Hls from 'hls.js';
import { Video } from 'expo-av';

export const useHlsPlayer = (
    videoRef: React.RefObject<Video>, 
    hlsUrl: string | null, 
    fallbackUrl: string | null
) => {
    const [currentSource, setCurrentSource] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set initial source when URLs are available
        if (hlsUrl) {
            setCurrentSource(hlsUrl);
        } else if (fallbackUrl) {
            setCurrentSource(fallbackUrl);
        }
    }, [hlsUrl, fallbackUrl]);

    useEffect(() => {
        if (Platform.OS !== 'web' || !videoRef.current || !currentSource) return;

        // This is a way to get the <video> element from expo-av's web implementation
        const videoNode = (videoRef.current as any)._video;
        if (!videoNode) return;
        
        let hls: Hls | undefined;

        if (currentSource.includes('.m3u8')) {
            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(currentSource);
                hls.attachMedia(videoNode);
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS.js error:', data);
                    // Let the Video component's onError handle the fallback
                });
            } else if (videoNode.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support in browser (e.g., Safari)
                videoNode.src = currentSource;
            } else {
                // Browser supports neither, immediately fallback
                console.warn('HLS not supported on this browser, falling back.');
                if (fallbackUrl) setCurrentSource(fallbackUrl);
            }
        }
        
        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [currentSource, fallbackUrl, videoRef]);

    const handleError = useCallback(() => {
        console.error(`Error playing source: ${currentSource}`);
        if (currentSource === hlsUrl && fallbackUrl) {
            console.log("HLS playback failed, attempting fallback to MP4.");
            setCurrentSource(fallbackUrl);
            setError(null); // Clear previous error
        } else {
            console.error("Fallback also failed or is unavailable.");
            setError("Failed to play video.");
        }
    }, [currentSource, hlsUrl, fallbackUrl]);

    return { currentSource, error, handleError };
};
