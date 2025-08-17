
import { useState } from 'react';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../components/ui/use-toast';

interface PostActionable {
  uri: string;
  cid: string;
  likeCount?: number;
  repostCount?: number;
  viewer?: {
    like?: string;
    repost?: string;
  };
}

export const usePostActions = (post: PostActionable) => {
  const { agent, session } = useAtp();
  const { openLoginModal } = useUI();
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
  };

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!ensureSession('like') || isLiking) return;
    setIsLiking(true);

    const originalLikeUri = post.viewer?.like;
    const originalLikeCount = post.likeCount || 0;

    try {
      if (likeUri) {
        setLikeUri(undefined);
        setLikeCount(c => Math.max(0, c - 1));
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
      setLikeUri(originalLikeUri);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!ensureSession('repost') || isReposting) return;
    setIsReposting(true);
    
    const originalRepostUri = post.viewer?.repost;
    const originalRepostCount = post.repostCount || 0;

    try {
      if (repostUri) {
        setRepostUri(undefined);
        setRepostCount(c => Math.max(0, c - 1));
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
      setRepostUri(originalRepostUri);
      setRepostCount(originalRepostCount);
    } finally {
      setIsReposting(false);
    }
  };

  return {
    likeUri,
    likeCount,
    isLiking,
    handleLike,
    repostUri,
    repostCount,
    isReposting,
    handleRepost,
  };
};
