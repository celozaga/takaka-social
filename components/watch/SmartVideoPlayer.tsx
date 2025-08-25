import React from 'react';
import { AppBskyFeedDefs } from '@atproto/api';
import VideoPlayer from './VideoPlayer';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const SmartVideoPlayer: React.FC<Props> = (props) => {
  // Use VideoPlayer directly since it's the only player we need
  return <VideoPlayer {...props} />;
};

export default SmartVideoPlayer;
