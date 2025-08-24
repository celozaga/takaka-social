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
            console.error("HLS failed and no fallback is available.");
            setError("Could not play video");
        }
    }, [fallbackUrl, currentSource]);

    useEffect(() => {
        // Cleanup previous instances and reset state when inputs change
        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }
        setError(null);

        // Native or unsupported browsers get the URL directly
        if (Platform.OS !== 'web' || !Hls.isSupported()) {
            setCurrentSource(hlsUrl ?? fallbackUrl);
            return;
        }
        
        // Web with HLS.js support
        if (!hlsUrl) {
            setCurrentSource(fallbackUrl); // No HLS url, use fallback
            return;
        }
        
        // We will manage the source with HLS.js, so don't give a URL to <Video> yet
        setCurrentSource(null);

        // Function to attempt attaching HLS.js
        const attachHlsWithRetry = (attempt = 1) => {
             if (!videoRef.current) { // Check if the component is even mounted
                if (attempt < 10) {
                    setTimeout(() => attachHlsWithRetry(attempt + 1), 50 * attempt);
                } else {
                    console.warn("Video component ref not available. Falling back.");
                    triggerFallback();
                }
                return;
            }
            
            const videoNode = (videoRef.current as any)?._video;

            if (videoNode) {
                console.log("Attaching HLS.js to video element.");
                if (hlsInstanceRef.current) hlsInstanceRef.current.destroy();
                
                const hls = new Hls();
                hlsInstanceRef.current = hls;
                
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    console.error('HLS.js error:', data.details);
                    if (data.fatal) {
                        triggerFallback();
                    }
                });

                hls.loadSource(hlsUrl);
                hls.attachMedia(videoNode);
            } else if (attempt < 10) {
                // If the video node isn't ready, wait and retry.
                setTimeout(() => attachHlsWithRetry(attempt + 1), 50 * attempt);
            } else {
                console.warn("Could not find video node after several attempts. Falling back.");
                triggerFallback();
            }
        };
        
        // Use a timeout to ensure the component has had a chance to render the video element
        const timeoutId = setTimeout(attachHlsWithRetry, 0);

        return () => {
            clearTimeout(timeoutId);
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
        };
    }, [hlsUrl, fallbackUrl, videoRef, triggerFallback]);

    const handleError = useCallback((err: any) => {
        // This handler is for errors from the <Video> component itself.
        // It's most likely to happen when we're trying to play the fallback URL.
        console.error("Error in <Video> component (likely during fallback). Triggering fallback.", err);
        triggerFallback();
    }, [triggerFallback]);

    return { currentSource, error, handleError };
};