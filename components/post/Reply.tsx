

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {AppBskyFeedDefs, RichText } from '@atproto/api';
import { format } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import { BadgeCheck } from 'lucide-react';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import ReplyPostPreview from './ReplyPostPreview';


interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
  isRoot?: boolean;
}

const Reply: React.FC<ReplyProps> = ({ reply, isRoot = false }) => {
  const { t } = useTranslation();
  const moderation = useModeration();
  const [isContentVisible, setIsContentVisible] = useState(false);
  
  const { post, replies, parent } = reply;
  const modDecision = moderation.isReady ? moderatePost(post, moderation) : null;
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
  
  const allSubReplies = useMemo(() => (replies || []).filter(r => {
      if (!AppBskyFeedDefs.isThreadViewPost(r)) return false;
      if (!moderation.isReady) return true; // Show all while loading
      const decision = moderatePost(r.post, moderation);
      return decision.visibility !== 'hide';
    }) as AppBskyFeedDefs.ThreadViewPost[], [replies, moderation]);

  const hasSubReplies = allSubReplies.length > 0;
  
  const ReplyList = () => (
    <>
      {allSubReplies.map((nestedReply) => (
        <Reply key={nestedReply.post.cid} reply={nestedReply} />
      ))}
    </>
  );

  if (isRoot) {
    // The root component is just a container for the first level of replies.
    return (
      <div className="space-y-1">
        <ReplyList />
      </div>
    )
  }

  if (!modDecision || modDecision.visibility === 'hide') {
      return null;
  }
  
  if (modDecision.visibility === 'warn' && !isContentVisible) {
      return (
          <div className="flex gap-3 items-start py-1">
              <a href={`#/profile/${author.handle}`}>
                  <img src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt={author.displayName} className="w-9 h-9 rounded-full bg-surface-3 mt-1" loading="lazy" />
              </a>
              <div className="flex-1 min-w-0 pt-1">
                  <ContentWarning reason={modDecision.reason!} onShow={() => setIsContentVisible(true)} />
              </div>
          </div>
      )
  }

  return (
    <div>
        <div className="flex gap-3 items-start py-1">
            <a href={`#/profile/${author.handle}`}>
                <img src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt={author.displayName} className="w-9 h-9 rounded-full bg-surface-3 mt-1" loading="lazy" />
            </a>
            <div className="bg-surface-2 p-3 rounded-2xl rounded-tl-lg flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <a href={`#/profile/${author.handle}`} className="font-bold text-primary hover:underline text-sm inline-flex items-center gap-1">
                        <span>{author.displayName || `@${author.handle}`}</span>
                        {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                            <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
                        )}
                    </a>
                </div>
                {AppBskyFeedDefs.isThreadViewPost(parent) && <ReplyPostPreview post={parent.post} />}
                <div className="text-on-surface whitespace-pre-wrap mt-0.5 text-sm break-words">
                    <RichTextRenderer record={record} />
                </div>
                <div className="flex justify-end items-center gap-3 text-xs text-on-surface-variant mt-1">
                    <span>{format(new Date(record.createdAt), "p")}</span>
                </div>
            </div>
        </div>
        {hasSubReplies && (
            <div className="pl-4">
                <ReplyList />
            </div>
        )}
    </div>
  );
};

export default React.memo(Reply);