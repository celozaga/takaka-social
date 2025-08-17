
import React from 'react';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';
import PostActions from './PostActions';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
}

const Reply: React.FC<ReplyProps> = ({ reply }) => {
  const { post, replies } = reply;
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), { addSuffix: true });
  const nestedReplies = (replies || []).filter(r => AppBskyFeedDefs.isThreadViewPost(r)) as AppBskyFeedDefs.ThreadViewPost[];
  const hasReplies = nestedReplies.length > 0;

  return (
    <div className="relative flex gap-3">
      {/* Thread lines - flex-shrink-0 prevents the column from shrinking */}
      <div className="flex flex-col items-center flex-shrink-0">
        <a href={`#/profile/${author.handle}`} className="block">
          <img src={author.avatar} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" />
        </a>
        {hasReplies && <div className="w-0.5 flex-1 grow bg-outline/20 mt-2"></div>}
      </div>

      <div className="flex-1 min-w-0"> {/* min-w-0 prevents content from overflowing flex container */}
        <div className="flex items-start justify-between">
            <div>
                <a href={`#/profile/${author.handle}`} className="font-bold hover:underline leading-tight text-sm">
                    {author.displayName || author.handle}
                </a>
                <span className="text-on-surface-variant text-sm ml-2">{timeAgo}</span>
            </div>
        </div>
        <a href={`#/post/${post.author.did}/${post.uri.split('/').pop()}`}>
            <p className="text-on-surface whitespace-pre-wrap mt-0.5 text-sm break-words">{record.text}</p>
        </a>
        <div className="mt-2">
            <PostActions post={post} />
        </div>

        {hasReplies && (
          <div className="mt-4 space-y-4">
            {nestedReplies.map((nestedReply) => (
              <Reply key={nestedReply.post.cid} reply={nestedReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reply;
