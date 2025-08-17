
import React, { useState } from 'react';
import { AppBskyFeedDefs, RichText } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { useToast } from './ui/use-toast';

interface ReplyProps {
  reply: AppBskyFeedDefs.ThreadViewPost;
}

const LikeButton: React.FC<{ post: AppBskyFeedDefs.PostView }> = ({ post }) => {
    const { agent, session } = useAtp();
    const { openLoginModal } = useUI();
    const { toast } = useToast();

    const [likeUri, setLikeUri] = useState(post.viewer?.like);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [isLiking, setIsLiking] = useState(false);
    
    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!session) {
          openLoginModal();
          return;
        }
        if (isLiking) return;
        setIsLiking(true);

        try {
            if (likeUri) {
                setLikeUri(undefined);
                setLikeCount(c => c - 1);
                await agent.deleteLike(likeUri);
            } else {
                setLikeUri('temp-uri');
                setLikeCount(c => c + 1);
                const { uri } = await agent.like(post.uri, post.cid);
                setLikeUri(uri);
            }
        } catch(err) {
            toast({ title: 'Error', description: 'Could not like post.', variant: 'destructive' });
            setLikeUri(post.viewer?.like);
            setLikeCount(post.likeCount || 0);
        } finally {
            setIsLiking(false);
        }
    }

    return (
        <button 
            onClick={handleLike} 
            disabled={isLiking}
            className={`flex items-center gap-1.5 transition-colors ${likeUri ? 'text-pink-500' : 'text-on-surface-variant hover:text-pink-500'}`}
        >
            <Heart size={16} fill={likeUri ? 'currentColor' : 'none'}/>
            {likeCount > 0 && <span className="text-xs font-semibold">{likeCount}</span>}
        </button>
    )
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
      {/* Thread lines */}
      <div className="flex flex-col items-center">
        <a href={`#/profile/${author.handle}`} className="block flex-shrink-0">
          <img src={author.avatar} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" />
        </a>
        {hasReplies && <div className="w-0.5 grow bg-outline/20 mt-2"></div>}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
            <div>
                <a href={`#/profile/${author.handle}`} className="font-bold hover:underline leading-tight text-sm">
                    {author.displayName || author.handle}
                </a>
                <p className="text-on-surface whitespace-pre-wrap mt-0.5 text-sm">{record.text}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{timeAgo}</span>
                    <button className="font-semibold hover:underline">Reply</button>
                </div>
            </div>
            <div className="flex-shrink-0 mt-1">
                <LikeButton post={post} />
            </div>
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
