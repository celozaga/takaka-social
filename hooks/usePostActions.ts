


import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../components/ui/use-toast';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAuthGuard } from './useAuthGuard';

interface PostActionable {
  uri: string;
  cid: string;
  likeCount?: number;
  repostCount?: number;
  record: unknown;
  viewer?: {
    like?: string;
    repost?: string;
  };
}

export const usePostActions = (post: PostActionable) => {
  const { agent, session } = useAtp();
  const { openLoginModal } = useUI();
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [likeUri, setLikeUri] = useState(post.viewer?.like);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const [repostUri, setRepostUri] = useState(post.viewer?.repost);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [isReposting, setIsReposting] = useState(false);

  // Sincronizar estado quando o post mudar
  useEffect(() => {
    setRepostUri(post.viewer?.repost);
    setRepostCount(post.repostCount || 0);
  }, [post.viewer?.repost, post.repostCount]);

  const handleLike = async (e?: { stopPropagation: () => void; preventDefault: () => void; }) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!requireAuth('like') || isLiking) return;
    setIsLiking(true);

    const originalLikeUri = likeUri;
    const originalLikeCount = likeCount;

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
    } catch (error: any) {
      console.error('Failed to like/unlike post:', error);
      if (error && error.status === 429) {
        toast({ title: t('common.rateLimitTitle'), description: t('common.rateLimitError'), variant: "destructive" });
      } else {
        toast({ title: t('hooks.actionFailed'), description: t('hooks.likeError'), variant: "destructive" });
      }
      setLikeUri(originalLikeUri);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e?: { stopPropagation: () => void; preventDefault: () => void; }) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!requireAuth('repost') || isReposting) return;

    if (post.record && typeof post.record === 'object' && 'reply' in post.record) {
        toast({ title: t('hooks.repostReplyError'), variant: "destructive" });
        return;
    }

    setIsReposting(true);
    
    const originalRepostUri = repostUri;
    const originalRepostCount = repostCount;

    try {
      if (repostUri) {
        // Undo repost
        setRepostUri(undefined);
        setRepostCount(c => Math.max(0, c - 1));
        await agent.deleteRepost(repostUri);
      } else {
        // Do repost
        const tempUri = 'temp-uri';
        setRepostUri(tempUri);
        setRepostCount(c => c + 1);
        const { uri } = await agent.repost(post.uri, post.cid);
        setRepostUri(uri);
      }
    } catch (error: any) {
      console.error('Failed to repost:', error);
      // Reverter estado em caso de erro
      setRepostUri(originalRepostUri);
      setRepostCount(originalRepostCount);
      
      if (error && error.status === 429) {
        toast({ title: t('common.rateLimitTitle'), description: t('common.rateLimitError'), variant: "destructive" });
      } else {
        toast({ title: t('hooks.actionFailed'), description: t('hooks.repostError'), variant: "destructive" });
      }
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