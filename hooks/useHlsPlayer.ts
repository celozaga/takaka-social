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
            console.error("Fallback also failed or is unavailable.");
            setError("Could not play video");
        }
    }, [fallbackUrl, currentSource]);

    useEffect(() => {
        // Cleanup function to destroy HLS instance when component unmounts or URLs change
        return () => {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
        };
    }, [hlsUrl, fallbackUrl]);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        const videoNode = (videoElement as any)?._video;

        if (Platform.OS === 'web' && Hls.isSupported() && hlsUrl) {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
            }

            if (videoNode) {
                // If the video node is ready, we have full control. Use HLS.js
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
                // Let HLS.js manage the source, so we tell expo-av there's no source.
                setCurrentSource(null);
            } else {
                // If video node is not ready, we can't use HLS.js yet.
                // Let's pass the HLS stream URL to the <Video> component directly.
                // Many browsers support it. If not, onError will trigger the fallback.
                setCurrentSource(hlsUrl);
            }
        } else {
            // For native or non-HLS browsers, let expo-av handle it
            setCurrentSource(hlsUrl ?? fallbackUrl);
        }
    // We remove videoRef.current from dependencies as it's not a stable prop for effects.
    // The effect will re-run when hlsUrl/fallbackUrl change, and by then the ref should be populated.
    }, [hlsUrl, fallbackUrl, videoRef, triggerFallback]);

    const handleError = useCallback(() => {
        // This is for the <Video> component's onError prop.
        console.error(`Error playing source via <Video> component: ${currentSource}`);
        triggerFallback();
    }, [currentSource, triggerFallback]);

    return { currentSource, error, handleError };
};