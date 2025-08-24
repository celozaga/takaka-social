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
    const hlsAttemptFailed = useRef(false);

    const triggerFallback = useCallback(() => {
        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }

        if (fallbackUrl && currentSource !== fallbackUrl) {
            console.log("HLS playback failed, attempting fallback to MP4.");
            hlsAttemptFailed.current = true;
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
        hlsAttemptFailed.current = false;
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
        const attemptAttachHls = (attempt = 1) => {
            const videoNode = (videoRef.current as any)?._video;

            if (videoNode) {
                console.log("Attaching HLS.js to video element.");
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
            } else if (attempt < 5) {
                // If the video node isn't ready, wait and retry.
                setTimeout(() => attemptAttachHls(attempt + 1), 100 * attempt);
            } else {
                console.warn("Could not find video node after several attempts. Falling back.");
                triggerFallback();
            }
        };
        
        attemptAttachHls();

        return () => {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
        };
    }, [hlsUrl, fallbackUrl, videoRef, triggerFallback]);

    const handleError = useCallback((err: any) => {
        // This will be called if the <Video> component fails, which should only happen
        // with the fallback URL or in a browser that doesn't use our HLS.js path.
        console.error("Error in <Video> component. Triggering fallback.", err);
        triggerFallback();
    }, [triggerFallback]);

    return { currentSource, error, handleError };
};
