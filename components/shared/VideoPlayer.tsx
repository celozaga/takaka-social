import React from 'react';
import { useTranslation } from 'react-i18next';
import VideoJS from 'videojs-player';
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

  const playerOptions = {
    ...options,
    language: i18n.language.split('-')[0], // 'en-US' -> 'en'
    responsive: true,
    fluid: true,
  };

  return (
    <div data-vjs-player className={className}>
        <VideoJS
            options={playerOptions}
            onReady={onReady as any}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            className="video-js vjs-theme-city"
        />
    </div>
  );
};

export default VideoPlayer;
