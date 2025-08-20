
import React from 'react';
import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';

interface ReplyPostPreviewProps {
  post: AppBskyFeedDefs.PostView;
}

const ReplyPostPreview: React.FC<ReplyPostPreviewProps> = ({ post }) => {
  const author = post.author;
  const record = post.record as AppBskyFeedPost.Record;

  if (!record || !author) {
    return null;
  }
  
  const text = record.text;

  return (
    <div className="bg-surface-3/50 border-l-4 border-primary rounded-r-lg p-2 my-2">
      <a href={`#/profile/${author.handle}`} className="font-bold text-sm text-primary hover:underline" onClick={e => e.stopPropagation()}>{author.displayName || `@${author.handle}`}</a>
      <p className="text-sm text-on-surface-variant line-clamp-2 break-words">{text}</p>
    </div>
  );
};

export default ReplyPostPreview;
