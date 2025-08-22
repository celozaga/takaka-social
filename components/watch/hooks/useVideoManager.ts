
import React, { useEffect, useRef } from 'react';
import { Video } from 'expo-av';

/**
 * A custom hook to manage video playback in a vertical feed.
 * It plays the video at the activeIndex and pauses all others.
 * This version is smarter: it only autoplays when a video *becomes* active,
 * allowing a user to manually pause the current video.
 * @param videoRefs An array of refs to the Video components.
 * @param activeIndex The index of the currently visible video.
 * @param posts The list of posts, used to detect changes in the list length.
 */
export const useVideoManager = (
  videoRefs: React.RefObject<Video>[],
  activeIndex: number,
  posts: any[]
) => {
  const activeIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const prevActiveIndex = activeIndexRef.current;

    // This logic ensures that as you scroll, the old video stops and the new one starts.
    // It doesn't interfere if you manually pause the currently active video.

    // Pause the video that was previously active if it's no longer the current one.
    if (prevActiveIndex !== null && prevActiveIndex !== activeIndex) {
      const prevVideoRef = videoRefs[prevActiveIndex];
      if (prevVideoRef?.current) {
        // We don't need to await these, and we catch errors in case the component unmounted.
        prevVideoRef.current.pauseAsync().catch(() => {});
        prevVideoRef.current.setPositionAsync(0).catch(() => {});
      }
    }

    // Play the new active video if it has just become active.
    if (activeIndex !== prevActiveIndex) {
        const currentVideoRef = videoRefs[activeIndex];
        if (currentVideoRef?.current) {
            currentVideoRef.current.playFromPositionAsync(0).catch(() => {});
        }
    }
    
    // Update the ref to the current active index for the next render cycle.
    activeIndexRef.current = activeIndex;

  }, [activeIndex, videoRefs, posts.length]); // Rerun when activeIndex or the list of posts changes
};