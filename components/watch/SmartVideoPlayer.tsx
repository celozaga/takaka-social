import React from 'react';
import { AppBskyFeedDefs } from '@atproto/api';
import BlueskyVideoPlayer from './BlueskyVideoPlayer';

interface Props {
  postView: AppBskyFeedDefs.FeedViewPost;
  paused: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const SmartVideoPlayer: React.FC<Props> = (props) => {
  // Use BlueskyVideoPlayer directly since it's the only player we need
  return <BlueskyVideoPlayer {...props} />;
};

export default SmartVideoPlayer;
