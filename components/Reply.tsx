import React from 'react';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import PostActions from './PostActions';
import { formatDistanceToNow } from 'date-fns';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
  isLast?: boolean;
}

const RichTextViewer: React.FC<{ record: { text: string; facets?: RichText['facets'] } }> = ({ record }) => {
    if (!record.facets) return <>{record.text}</>;
    const rt = new RichText({ text: record.text, facets: record.facets });
    return (
      <>
        {rt.segments().map((segment, i) => {
          if (segment.isLink()) {
            return (
              <a key={i} href={segment.link.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                {segment.text}
              </a>
            );
          }
          if (segment.isMention()) {
            return (
              <a key={i} href={`#/profile/${segment.mention.did}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                {segment.text}
              </a>
            );
          }
          return segment.text;
        })}
      </>
    );
};


const Reply: React.FC<ReplyProps> = ({ reply, isLast = true }) => {
  const { post, replies, parent } = reply;
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), { addSuffix: true });
  const nestedReplies = (replies || []).filter(r => AppBskyFeedDefs.isThreadViewPost(r)) as AppBskyFeedDefs.ThreadViewPost[];
  
  const hasParent = AppBskyFeedDefs.isThreadViewPost(parent);
  const hasReplies = nestedReplies.length > 0;

  return (
    <div className="relative flex gap-3">
      {/* Thread lines */}
      <div className="flex flex-col items-center">
        <a href={`#/profile/${author.handle}`} className="block flex-shrink-0">
          <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full bg-surface-3" />
        </a>
        {hasReplies && (
          <div className="w-0.5 grow bg-outline/50 mt-2"></div>
        )}
      </div>

      <div className="flex-1 pb-4">
        <div className="flex items-baseline justify-between">
          <a href={`#/profile/${author.handle}`} className="font-bold hover:underline leading-tight">
            {author.displayName || author.handle}
            <span className="text-on-surface-variant font-normal ml-2 text-sm">@{author.handle}</span>
          </a>
          <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">{timeAgo}</span>
        </div>

        <div className="text-on-surface whitespace-pre-wrap mt-1">
          <RichTextViewer record={record} />
        </div>
        
        <div className="mt-2 -ml-2">
            <PostActions post={post} />
        </div>

        {hasReplies && (
          <div className="mt-4 space-y-4">
            {nestedReplies.map((nestedReply, index) => (
              <Reply key={nestedReply.post.cid} reply={nestedReply} isLast={index === nestedReplies.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reply;
