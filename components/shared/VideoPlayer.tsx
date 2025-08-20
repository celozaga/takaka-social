import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
  options: any; // video.js options
  onReady?: (player: Player) => void;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady, className, onPlay, onPause, onEnded }) => {
  const { i18n } = useTranslation();
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) {
        return;
    }

    const videoElement = document.createElement("video");
    videoElement.className = "video-js vjs-theme-city";
    videoRef.current.appendChild(videoElement);
    
    const playerOptions = {
      ...options,
      language: i18n.language.split('-')[0],
      responsive: true,
      fluid: true,
    };

    const player = playerRef.current = videojs(videoElement, playerOptions, function() {
      if (onReady) {
        onReady(this);
      }
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []); // Empty deps array means this runs once on mount.

  // Update props
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.autoplay(options.autoplay);
      player.src(options.sources);
      player.poster(options.poster);
      player.muted(options.muted);
      player.loop(options.loop);
    }
  }, [options]);

  // Event handlers
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
        if (onPlay) player.on('play', onPlay);
        if (onPause) player.on('pause', onPause);
        if (onEnded) player.on('ended', onEnded);
    }
    return () => {
        if (player && !player.isDisposed()) { // Check if player is disposed
            if (onPlay) player.off('play', onPlay);
            if (onPause) player.off('pause', onPause);
            if (onEnded) player.off('ended', onEnded);
        }
    }
  }, [onPlay, onPause, onEnded]);

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
