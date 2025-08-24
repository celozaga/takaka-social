
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const hlsInstanceRef = useRef<Hls | null>(null);
    
    // Internal fallback handler, can be called from HLS.js error or component error
    const triggerFallback = useCallback(() => {
        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }

        if (fallbackUrl && currentSource !== fallbackUrl) {
            console.log("HLS playback failed, attempting fallback to MP4.");
            setCurrentSource(fallbackUrl);
            setError(null);
        } else {
            console.error("Fallback also failed or is unavailable.");
            setError("Failed to play video.");
        }
    }, [fallbackUrl, currentSource]);

    const setupHls = useCallback(() => {
        if (!hlsUrl || !videoRef.current) return;
        // This is an internal property of expo-av on web, but necessary for HLS.js
        const videoNode = (videoRef.current as any)._video;
        if (!videoNode) return;
        
        const hls = new Hls();
        hlsInstanceRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoNode);

        hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error('HLS.js error:', data.details);
            if (data.fatal) {
                triggerFallback();
            }
        });
    }, [hlsUrl, videoRef, triggerFallback]);

    useEffect(() => {
        // This is the main strategy selector.
        if (Platform.OS === 'web' && Hls.isSupported() && hlsUrl) {
            setCurrentSource(null); // Use HLS.js by setting source to null initially
        } else {
            setCurrentSource(hlsUrl ?? fallbackUrl); // Use native/expo-av handling
        }
        
        return () => {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
        };
    }, [hlsUrl, fallbackUrl]);

    useEffect(() => {
        // If strategy is HLS.js (signaled by currentSource being null), set it up.
        if (currentSource === null) {
            setupHls();
        }
    }, [currentSource, setupHls]);

    const handleError = useCallback(() => {
        // This is for the <Video> component's onError prop.
        // It's mainly for when native HLS playback fails (e.g., on Chrome).
        console.error(`Error playing source via <Video> component: ${currentSource}`);
        triggerFallback();
    }, [currentSource, triggerFallback]);

    return { currentSource, error, handleError };
};
