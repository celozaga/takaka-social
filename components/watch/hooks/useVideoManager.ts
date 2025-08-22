
import React, { useEffect } from 'react';
import { Video } from 'expo-av';

/**
 * A custom hook to manage video playback in a vertical feed.
 * It plays the video at the activeIndex and pauses all others.
 * @param videoRefs An array of refs to the Video components.
 * @param activeIndex The index of the currently visible video.
 * @param posts The list of posts, used to detect changes in the list length.
 */
export const useVideoManager = (
  videoRefs: React.RefObject<Video>[],
  activeIndex: number,
  posts: any[]
) => {
  useEffect(() => {
    videoRefs.forEach((ref, index) => {
      if (!ref.current) return;
      
      const playOrPause = async () => {
        try {
          const status = await ref.current.getStatusAsync();
          // Ensure the video component is actually loaded before trying to control it.
          if (!status.isLoaded) return;

          if (index === activeIndex) {
            // If this is the active video and it's not playing, play it.
            // We play from the start to ensure it loops correctly.
            if (!status.isPlaying) {
              await ref.current.playFromPositionAsync(0);
            }
          } else {
            // If this is an inactive video and it's playing, pause it and reset its position.
            if (status.isPlaying) {
              await ref.current.pauseAsync();
              await ref.current.setPositionAsync(0);
            }
          }
        } catch (e) {
            // Errors can happen if the component is unmounting, so we can safely ignore them.
            // console.warn(`Video manager error for index ${index}:`, e)
        }
      };

      playOrPause();
    });
  }, [activeIndex, videoRefs, posts.length]); // Rerun when activeIndex or the list of posts changes
};
