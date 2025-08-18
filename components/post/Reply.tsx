

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import PostActions from './PostActions';
import { BadgeCheck, Loader2 } from 'lucide-react';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
  isRoot?: boolean;
}

const REPLIES_PER_PAGE = 10;

const Reply: React.FC<ReplyProps> = ({ reply, isRoot = false }) => {
  const { t } = useTranslation();
  const { post, replies } = reply;
  const author = post.author;
  const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
  
  const allSubReplies = (replies || []).filter(r => AppBskyFeedDefs.isThreadViewPost(r)) as AppBskyFeedDefs.ThreadViewPost[];
  const hasSubReplies = allSubReplies.length > 0;

  const [isExpanded, setIsExpanded] = useState(isRoot);
  const [visibleReplies, setVisibleReplies] = useState<AppBskyFeedDefs.ThreadViewPost[]>([]);
  const [replyCursor, setReplyCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), { addSuffix: true });

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    // Add a small delay for a better user experience, showing the loader briefly.
    setTimeout(() => {
        const nextReplies = allSubReplies.slice(replyCursor, replyCursor + REPLIES_PER_PAGE);
        setVisibleReplies(prev => [...prev, ...nextReplies]);
        const newCursor = replyCursor + REPLIES_PER_PAGE;
        setReplyCursor(newCursor);
        setHasMore(allSubReplies.length > newCursor);
        setIsLoadingMore(false);
    }, 500);
  }, [replyCursor, allSubReplies, isLoadingMore]);

  useEffect(() => {
    // Load the initial set of replies when a thread is expanded or for the root replies.
    if (isExpanded && hasSubReplies && visibleReplies.length === 0) {
      const initialReplies = allSubReplies.slice(0, REPLIES_PER_PAGE);
      setVisibleReplies(initialReplies);
      setReplyCursor(REPLIES_PER_PAGE);
      setHasMore(allSubReplies.length > REPLIES_PER_PAGE);
    }
  }, [isExpanded, hasSubReplies, allSubReplies, visibleReplies.length]);
  
   useEffect(() => {
    if (!isExpanded || !hasMore || isLoadingMore) return;
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
  }, [isExpanded, hasMore, loadMore, isLoadingMore]);
  
  const ReplyList = () => (
    <>
      {visibleReplies.map((nestedReply) => (
        <Reply key={nestedReply.post.cid} reply={nestedReply} />
      ))}
      <div ref={loaderRef} className="h-20 flex items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('post.loadingMoreReplies')}</span>
          </div>
        )}
      </div>
      {!hasMore && isExpanded && hasSubReplies && !isRoot && (
         <div className="text-center text-on-surface-variant text-xs py-4">{t('post.endOfThread')}</div>
      )}
    </>
  );

  if (isRoot) {
    // The root component is just a container for the first level of replies.
    return (
      <div>
        <ReplyList />
      </div>
    )
  }

  return (
    <div className="relative flex gap-3 p-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <a href={`#/profile/${author.handle}`} className="block">
          <img src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt={author.displayName} className="w-10 h-10 rounded-full bg-surface-3" loading="lazy" />
        </a>
        {(hasSubReplies || isExpanded) && <div className="w-0.5 flex-1 grow mt-2"></div>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <a href={`#/profile/${author.handle}`} className="font-bold hover:underline leading-tight text-sm inline-flex items-center gap-1">
                <span>{author.displayName || `@${author.handle}`}</span>
                {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                    <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
                )}
            </a>
            <span className="text-on-surface-variant text-sm">{timeAgo}</span>
        </div>
        
        <a href={`#/post/${post.author.did}/${post.uri.split('/').pop()}`} className="block">
            <div className="text-on-surface whitespace-pre-wrap mt-0.5 text-sm break-words">
                <RichTextRenderer record={record} />
            </div>
        </a>
        <div className="mt-2">
            <PostActions post={post} />
        </div>

        {hasSubReplies && !isExpanded && (
            <button onClick={() => setIsExpanded(true)} className="text-sm font-semibold text-on-surface-variant hover:underline mt-2">
                {t('post.viewReplies', { count: allSubReplies.length })}
            </button>
        )}
        
        {isExpanded && hasSubReplies && (
          <div className="mt-4 space-y-4">
            <ReplyList />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Reply);