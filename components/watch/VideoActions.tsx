
import React from 'react';
import { Heart, MessageCircle, Repeat, Share2, BadgeCheck } from 'lucide-react';
import { usePostActions } from '../../hooks/usePostActions';
import { useUI } from '../../context/UIContext';
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
    const { openComposer } = useUI();
    const { likeUri, likeCount, isLiking, handleLike, repostUri, repostCount, isReposting, handleRepost } = usePostActions(post);

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        openComposer({ replyTo: { uri: post.uri, cid: post.cid } });
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleLike();
    };
    
    const handleRepostClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleRepost();
    };

    return (
        <div className="absolute bottom-24 right-2 flex flex-col items-center gap-5 text-white">
            <a href={`#/profile/${post.author.handle}`} className="relative group" onClick={e => e.stopPropagation()}>
                <img src={post.author.avatar} alt={post.author.displayName} className="w-12 h-12 rounded-full border-2 border-white bg-surface-3" />
                {post.author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-black">
                        <BadgeCheck size={14} className="text-on-primary" fill="currentColor" />
                    </div>
                )}
            </a>
            
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
        </div>
    );
};

export default VideoActions;
