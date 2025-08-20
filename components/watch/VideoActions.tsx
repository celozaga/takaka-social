import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'expo-router';
import { Heart, MessageCircle, Repeat, Share2, BadgeCheck, Plus, Check, MoreHorizontal } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useUI } from '../../context/UIContext';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyFeedDefs} from '@atproto/api';

interface VideoActionsProps {
  post: AppBskyFeedDefs.PostView;
}

const formatCount = (count: number): string => {
    if (count > 9999) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    if (count > 999) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return count.toString();
};

const VideoActions: React.FC<VideoActionsProps> = ({ post }) => {
    const { openComposer, openMediaActionsModal } = useUI();
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { likeUri, likeCount, isLiking, handleLike, repostUri, repostCount, isReposting, handleRepost } = usePostActions(post);

    const [followUri, setFollowUri] = useState(post.author.viewer?.following);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        setFollowUri(post.author.viewer?.following);
    }, [post.author.viewer?.following]);

    const isMe = session?.did === post.author.did;

    const handleFollow = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFollowLoading || isMe || followUri) return;

        setIsFollowLoading(true);
        agent.follow(post.author.did)
            .then(({ uri }) => {
                setFollowUri(uri);
            })
            .catch(err => {
                console.error("Failed to follow:", err);
                toast({ title: "Error", description: "Could not follow user.", variant: "destructive" });
            })
            .finally(() => {
                setIsFollowLoading(false);
            });
    }, [agent, isFollowLoading, isMe, followUri, post.author.did, toast]);
    
    const handleUnfollow = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFollowLoading || isMe || !followUri) return;

        setIsFollowLoading(true);
        agent.deleteFollow(followUri)
            .then(() => {
                setFollowUri(undefined);
            })
            .catch(err => {
                console.error("Failed to unfollow:", err);
                toast({ title: "Error", description: "Could not unfollow user.", variant: "destructive" });
            })
            .finally(() => {
                setIsFollowLoading(false);
            });
    }, [agent, isFollowLoading, isMe, followUri, toast]);

    const handleComment = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
    }, [openComposer, post.uri, post.cid]);

    const handleLikeClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleLike();
    }, [handleLike]);
    
    const handleRepostClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleRepost();
    }, [handleRepost]);
    
    const handleMoreClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        openMediaActionsModal(post);
    }, [openMediaActionsModal, post]);

    return (
        <div className="absolute bottom-24 right-2 flex flex-col items-center gap-5 text-white">
            <div className="relative">
                <Link href={`/profile/${post.author.handle}` as any} className="relative group block" onClick={e => e.stopPropagation()}>
                    <img src={post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt={post.author.displayName || post.author.handle} className="w-12 h-12 rounded-full border-2 border-white bg-surface-3" />
                    {post.author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-black">
                            <BadgeCheck size={14} className="text-on-primary" fill="currentColor" />
                        </div>
                    )}
                </Link>
                {!isMe && (
                    <button 
                        onClick={followUri ? handleUnfollow : handleFollow} 
                        disabled={isFollowLoading}
                        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2 border-black transition-colors ${
                            followUri ? 'bg-zinc-800' : 'bg-red-500'
                        }`}
                        aria-label={followUri ? "Unfollow user" : "Follow user"}
                    >
                        {followUri ? (
                            <Check size={16} className="text-red-500" strokeWidth={3} />
                        ) : (
                            <Plus size={16} className="text-white" />
                        )}
                    </button>
                )}
            </div>
            
            <button onClick={handleLikeClick} disabled={isLiking} className="flex flex-col items-center gap-1.5">
                <Heart size={32} className={`transition-transform transform active:scale-125 ${likeUri ? 'text-pink-500' : 'text-white'}`} fill={likeUri ? 'currentColor' : 'none'} />
                <span className="text-sm font-semibold drop-shadow">{formatCount(likeCount)}</span>
            </button>
            <button onClick={handleComment} className="flex flex-col items-center gap-1.5">
                <MessageCircle size={32} className="transform active:scale-110"/>
                <span className="text-sm font-semibold drop-shadow">{formatCount(post.replyCount || 0)}</span>
            </button>
            <button onClick={handleRepostClick} disabled={isReposting} className="flex flex-col items-center gap-1.5">
                <Repeat size={32} className={`transition-colors transform active:scale-110 ${repostUri ? 'text-primary' : 'text-white'}`} />
                <span className="text-sm font-semibold drop-shadow">{formatCount(repostCount)}</span>
            </button>
            <button onClick={handleMoreClick} className="flex flex-col items-center gap-1.5">
                <MoreHorizontal size={32} className="transform active:scale-110" />
            </button>
        </div>
    );
};

export default React.memo(VideoActions);
