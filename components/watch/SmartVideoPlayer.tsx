import React from 'react';
import { AppBskyFeedDefs } from '@atproto/api';
import VideoPlayer from './VideoPlayer';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isActive?: boolean;
}

const SmartVideoPlayer: React.FC<Props> = (props) => {
  // Use VideoPlayer directly since it's the only player we need
  // Pass through all props including the new navigation props
  return <VideoPlayer {...props} />;
};

export default SmartVideoPlayer;
