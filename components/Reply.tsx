

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';
import { useUI } from '../context/UIContext';
import { usePostActions } from '../hooks/usePostActions';
import { Heart, Repeat } from 'lucide-react';
import RichTextRenderer from './RichTextRenderer';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
  isRoot?: boolean;
}

const REPLIES_PER_PAGE = 10;

const Reply: React.FC<ReplyProps> = ({ reply, isRoot = false }) => {
  const { openComposer } = useUI();
  const { post, replies } = reply;
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
  
  const { likeUri, handleLike, repostUri, handleRepost } = usePostActions(post);

  const allSubReplies = (replies || []).filter(r => AppBskyFeedDefs.isThreadViewPost(r)) as AppBskyFeedDefs.ThreadViewPost[];
  const hasSubReplies = allSubReplies.length > 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleReplies, setVisibleReplies] = useState<AppBskyFeedDefs.ThreadViewPost[]>([]);
  const [replyCursor, setReplyCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), { addSuffix: true });

  const loadMore = useCallback(() => {
    const nextReplies = allSubReplies.slice(replyCursor, replyCursor + REPLIES_PER_PAGE);
    setVisibleReplies(prev => [...prev, ...nextReplies]);
    const newCursor = replyCursor + REPLIES_PER_PAGE;
    setReplyCursor(newCursor);
    setHasMore(allSubReplies.length > newCursor);
  }, [replyCursor, allSubReplies]);

  useEffect(() => {
    if (isExpanded) {
      // Load initial batch when expanded for the first time
      const initialReplies = allSubReplies.slice(0, REPLIES_PER_PAGE);
      setVisibleReplies(initialReplies);
      setReplyCursor(REPLIES_PER_PAGE);
      setHasMore(allSubReplies.length > REPLIES_PER_PAGE);
    }
  }, [isExpanded, allSubReplies]);
  
   useEffect(() => {
    if (!isExpanded || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [isExpanded, hasMore, loadMore]);

  if (isRoot) {
    // Special case for the root of the thread to just render the replies
    return (
      <div className="divide-y divide-surface-3">
        {allSubReplies.map(r => <Reply key={r.post.cid} reply={r} />)}
      </div>
    )
  }

  return (
    <div className="relative flex gap-3 p-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <a href={`#/profile/${author.handle}`} className="block">
          <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full bg-surface-3" />
        </a>
        {(hasSubReplies || isExpanded) && <div className="w-0.5 flex-1 grow bg-outline/20 mt-2"></div>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <a href={`#/profile/${author.handle}`} className="font-bold hover:underline leading-tight text-sm">
                {author.displayName || `@${author.handle}`}
            </a>
            <span className="text-on-surface-variant text-sm">{timeAgo}</span>
        </div>
        
        <a href={`#/post/${post.author.did}/${post.uri.split('/').pop()}`} className="block">
            <div className="text-on-surface whitespace-pre-wrap mt-0.5 text-sm break-words">
                <RichTextRenderer record={record} />
            </div>
        </a>
        <div className="mt-2 flex items-center gap-4 text-on-surface-variant text-sm">
           <button onClick={handleRepost} className={`flex items-center gap-1 transition-colors ${repostUri ? 'text-primary' : 'hover:text-primary'}`}>
             <Repeat size={16} />
           </button>
           <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${likeUri ? 'text-pink-500' : 'hover:text-pink-500'}`}>
             <Heart size={16} fill={likeUri ? 'currentColor' : 'none'} />
           </button>
           <button 
                onClick={() => openComposer({ uri: post.uri, cid: post.cid })}
                className="font-semibold hover:underline"
            >
                Reply
            </button>
        </div>

        {hasSubReplies && !isExpanded && (
            <button onClick={() => setIsExpanded(true)} className="text-sm font-semibold text-on-surface-variant hover:underline mt-2">
                View {allSubReplies.length} replies
            </button>
        )}
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {visibleReplies.map((nestedReply) => (
              <Reply key={nestedReply.post.cid} reply={nestedReply} />
            ))}
            <div ref={loaderRef} className="h-1"></div>
             {!hasMore && visibleReplies.length > 0 && (
                <div className="text-center text-on-surface-variant text-xs py-4">You've reached the end!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reply;