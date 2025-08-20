
import React from 'react';
import { Heart, Repeat, MessageCircle } from 'lucide-react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { AppBskyFeedDefs } from '@atproto/api';

interface PostActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const PostActions: React.FC<PostActionsProps> = ({ post }) => {
  const { session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const {
    likeUri, likeCount, isLiking, handleLike,
    repostUri, repostCount, isReposting, handleRepost
  } = usePostActions(post);
  
  const ensureSession = () => {
    if (!session) {
      openLoginModal();
      return false;
    }
    return true;
  }

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!ensureSession()) return;
    openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
  };

  return (
    <div className="flex items-center gap-1">
      <button 
        onClick={handleLike} 
        disabled={isLiking}
        className={`flex items-center gap-1.5 py-1 pl-1.5 pr-2.5 rounded-full transition-colors group ${
          likeUri 
            ? 'bg-like/20 text-like' 
            : 'text-on-surface-variant hover:bg-like/10 hover:text-like'
        }`}
        aria-label="Like"
      >
        <Heart size={18} fill={likeUri ? 'currentColor' : 'none'} />
        <span className="text-sm font-semibold">{likeCount}</span>
      </button>
      <button 
        onClick={handleRepost} 
        disabled={isReposting}
        className={`flex items-center gap-1.5 py-1 pl-1.5 pr-2.5 rounded-full transition-colors group ${
          repostUri 
            ? 'bg-primary/20 text-primary' 
            : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
        }`}
        aria-label="Repost"
      >
        <Repeat size={18} />
        <span className="text-sm font-semibold">{repostCount}</span>
      </button>
      <button 
        onClick={handleReplyClick} 
        className="flex items-center gap-1.5 py-1 pl-1.5 pr-2.5 rounded-full transition-colors group text-on-surface-variant hover:bg-primary/10 hover:text-primary"
      >
        <MessageCircle size={18} />
        <span className="text-sm font-semibold">{post.replyCount || 0}</span>
      </button>
    </div>
  );
};

export default PostActions;
