
import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { usePostActions } from '../../hooks/usePostActions';
import { MessageSquare, Heart, Repeat } from 'lucide-react';
import { AppBskyFeedDefs } from '@atproto/api';

interface PostScreenActionBarProps {
    post: AppBskyFeedDefs.PostView;
}

const formatCount = (count: number): string => {
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
};

const PostScreenActionBar: React.FC<PostScreenActionBarProps> = ({ post }) => {
    const { session } = useAtp();
    const { openComposer, openRepostModal } = useUI();
    const {
        likeUri, likeCount, isLiking, handleLike,
        repostUri, repostCount, isReposting
    } = usePostActions(post);

    if (!session) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-2 h-20 px-4 flex items-center justify-between gap-4 z-30 md:static md:h-auto md:bg-transparent md:py-3 md:my-4">
            <button
                onClick={() => openComposer({ replyTo: { uri: post.uri, cid: post.cid } })}
                className="flex-1 bg-surface-3 text-on-surface-variant text-left text-sm px-4 py-2.5 rounded-full hover:bg-surface-3/80"
            >
                Reply...
            </button>
            <div className="flex items-center gap-4">
                <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 ${likeUri ? 'text-pink-500' : 'text-on-surface-variant'}`}
                >
                    <Heart size={22} fill={likeUri ? 'currentColor' : 'none'} />
                    <span className="font-semibold text-sm">{formatCount(likeCount)}</span>
                </button>
                 <button
                    onClick={() => openRepostModal(post)}
                    disabled={isReposting}
                    className={`flex items-center gap-1.5 ${repostUri ? 'text-primary' : 'text-on-surface-variant'}`}
                >
                    <Repeat size={22} />
                    <span className="font-semibold text-sm">{formatCount(repostCount)}</span>
                </button>
                 <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <MessageSquare size={22} />
                    <span className="font-semibold text-sm">{formatCount(post.replyCount || 0)}</span>
                </div>
            </div>
        </div>
    );
};

export default PostScreenActionBar;
