

import React, { useState } from 'react';
import { AppBskyFeedDefs } from '@atproto/api';
import { Heart, Repeat, MessageCircle } from 'lucide-react';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { useToast } from './ui/use-toast';

interface PostActionsProps {
  post: {
      uri: string;
      cid: string;
      author: { did: string; };
      likeCount?: number;
      repostCount?: number;
      replyCount?: number;
      viewer?: {
          like?: string;
          repost?: string;
      }
  };
}

const PostActions: React.FC<PostActionsProps> = ({ post }) => {
  const { agent, session } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const { toast } = useToast();

  const [likeUri, setLikeUri] = useState(post.viewer?.like);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const [repostUri, setRepostUri] = useState(post.viewer?.repost);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [isReposting, setIsReposting] = useState(false);
  
  const ensureSession = (action: string) => {
    if (!session) {
      openLoginModal();
      return false;
    }
    return true;
  }

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!ensureSession('reply')) return;
    openComposer({ uri: post.uri, cid: post.cid });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!ensureSession('like')) return;
    if (isLiking) return;
    setIsLiking(true);

    try {
      if (likeUri) {
        setLikeUri(undefined);
        setLikeCount(c => c - 1);
        await agent.deleteLike(likeUri);
      } else {
        const tempUri = 'temp-uri';
        setLikeUri(tempUri);
        setLikeCount(c => c + 1);
        const { uri } = await agent.like(post.uri, post.cid);
        setLikeUri(uri);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
      toast({ title: "Action failed", description: "Could not update like status.", variant: "destructive" });
      setLikeUri(post.viewer?.like);
      setLikeCount(post.likeCount || 0);
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!ensureSession('repost')) return;
    if (isReposting) return;
    setIsReposting(true);

    try {
        if (repostUri) {
            setRepostUri(undefined);
            setRepostCount(c => c - 1);
            await agent.deleteRepost(repostUri);
        } else {
            const tempUri = 'temp-uri';
            setRepostUri(tempUri);
            setRepostCount(c => c + 1);
            const { uri } = await agent.repost(post.uri, post.cid);
            setRepostUri(uri);
        }
    } catch (error) {
        console.error('Failed to repost:', error);
        toast({ title: "Action failed", description: "Could not repost.", variant: "destructive" });
        setRepostUri(post.viewer?.repost);
        setRepostCount(post.repostCount || 0);
    } finally {
        setIsReposting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-on-surface-variant">
      <button onClick={handleReplyClick} className="flex items-center gap-1 hover:text-primary transition-colors">
        <MessageCircle size={16} />
        <span className="text-xs font-semibold">{post.replyCount || 0}</span>
      </button>
      <button 
        onClick={handleRepost} 
        disabled={isReposting}
        className={`flex items-center gap-1 transition-colors ${repostUri ? 'text-primary' : 'hover:text-primary'}`}
        aria-label="Repost"
      >
        <Repeat size={16} />
        <span className="text-xs font-semibold">{repostCount}</span>
      </button>
      <button 
        onClick={handleLike} 
        disabled={isLiking}
        className={`flex items-center gap-1 transition-colors ${likeUri ? 'text-pink-500' : 'hover:text-pink-500'}`}
        aria-label="Like"
      >
        <Heart size={16} fill={likeUri ? 'currentColor' : 'none'} />
        <span className="text-xs font-semibold">{likeCount}</span>
      </button>
    </div>
  );
};

export default PostActions;
