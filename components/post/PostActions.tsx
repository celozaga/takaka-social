

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
    <div className="flex items-center gap-3 text-on-surface-variant">
      <button onClick={handleReplyClick} className="flex items-center gap-1 hover:text-primary transition-colors">
        <MessageCircle size={18} />
        <span className="text-sm font-semibold">{post.replyCount || 0}</span>
      </button>
      <button 
        onClick={handleRepost} 
        disabled={isReposting}
        className={`flex items-center gap-1 transition-colors ${repostUri ? 'text-primary' : 'hover:text-primary'}`}
        aria-label="Repost"
      >
        <Repeat size={18} />
        <span className="text-sm font-semibold">{repostCount}</span>
      </button>
      <button 
        onClick={handleLike} 
        disabled={isLiking}
        className={`flex items-center gap-1 transition-colors ${likeUri ? 'text-like' : 'hover:text-like'}`}
        aria-label="Like"
      >
        <Heart size={18} fill={likeUri ? 'currentColor' : 'none'} />
        <span className="text-sm font-semibold">{likeCount}</span>
      </button>
    </div>
  );
};

export default PostActions;