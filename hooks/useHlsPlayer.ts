
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
        // This is an internal property of expo-av on web, but necessary for HLS.js
        const videoNode = (videoElement as any)?._video;

        if (Platform.OS === 'web' && Hls.isSupported() && hlsUrl) {
            if (videoNode) {
                // If the video node is ready, set up HLS.js
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
                // Set source to null to ensure expo-av doesn't interfere
                setCurrentSource(null);
            } else {
                // If video node is not ready, we still set source to null and wait for a re-render
                setCurrentSource(null);
            }
        } else {
            // For native or non-HLS browsers, let expo-av handle it
            setCurrentSource(hlsUrl ?? fallbackUrl);
        }
    }, [hlsUrl, fallbackUrl, videoRef, triggerFallback, videoRef.current]); // Rely on videoRef.current to re-run this effect

    const handleError = useCallback(() => {
        // This is for the <Video> component's onError prop.
        console.error(`Error playing source via <Video> component: ${currentSource}`);
        triggerFallback();
    }, [currentSource, triggerFallback]);

    return { currentSource, error, handleError };
};