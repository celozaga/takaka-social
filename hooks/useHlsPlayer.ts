import { useState, useEffect, useRef } from 'react';
import { VideoPlayer, VideoView } from 'expo-video';
import Hls from 'hls.js';
import { Platform } from 'react-native';

export const useHlsPlayer = (
    player: VideoPlayer | null,
    hlsUrl: string | null,
    fallbackUrl: string | null,
    videoRef: React.RefObject<VideoView>
) => {
    const [error, setError] = useState<string | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        // Cleanup function to be returned
        const cleanup = () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
        
        if (!player) return cleanup;

        // --- Web specific HLS.js implementation ---
        if (Platform.OS === 'web' && hlsUrl && Hls.isSupported()) {
            cleanup(); // Destroy previous instance if it exists

            // The 'data-player-id' attribute is set by expo-video on the underlying <video> tag.
            const videoElement = videoRef.current as unknown as HTMLVideoElement | null;
            if (!videoElement) {
                console.warn("HLS.js: Could not find video element. Falling back to player.replace().");
                player.replace(hlsUrl); // Let expo-video try first
            } else {
                const hls = new Hls();
                hlsRef.current = hls;

                hls.loadSource(hlsUrl);
                hls.attachMedia(videoElement);

                hls.on(Hls.Events.ERROR, (_event, data) => {
                    console.error('HLS.js Error:', data);
                    if (data.fatal) {
                        if (fallbackUrl) {
                            console.log('HLS.js: Unrecoverable error, trying fallback URL.');
                            hls.destroy();
                            hlsRef.current = null;
                            player.replace(fallbackUrl);
                        } else {
                            setError('Could not play video.');
                            hls.destroy();
                            hlsRef.current = null;
                        }
                    }
                });
                
                // By handling HLS here, we don't call player.replace() for the hlsUrl on web.
                return cleanup;
            }
        }

        // --- Native or Fallback Logic ---
        const sourceToPlay = hlsUrl || fallbackUrl;
        if (sourceToPlay) {
             // Avoid replacing if source is already set, preventing loops
            if (player.source?.uri !== sourceToPlay) {
                player.replace(sourceToPlay);
            }
        }
        
        const statusSubscription = player.addListener('statusChange', (event) => {
            if (event.status.error) {
                console.error('VideoPlayer error:', event.status.error);
                if (player.source?.uri === hlsUrl && fallbackUrl && hlsUrl !== fallbackUrl) {
                    console.log('Player error with HLS url, trying fallback');
                    player.replace(fallbackUrl);
                } else {
                    setError("Could not play video");
                }
            }
        });

        return () => {
            cleanup();
            statusSubscription.remove();
        };
    }, [player, hlsUrl, fallbackUrl, videoRef]);

    return { error };
};