import React from 'react';
import { AppBskyFeedDefs } from '@atproto/api';

interface PostStatsProps {
  post: AppBskyFeedDefs.PostView;
}

const formatCount = (count: number): string => {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
};


const PostStats: React.FC<PostStatsProps> = ({ post }) => {
    const repostCount = post.repostCount || 0;
    const likeCount = post.likeCount || 0;

    if (repostCount === 0 && likeCount === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-4 text-sm text-on-surface-variant px-3">
            {repostCount > 0 && (
                <span>
                    <strong className="text-on-surface font-semibold">{formatCount(repostCount)}</strong> Reposts
                </span>
            )}
             {likeCount > 0 && (
                <span>
                    <strong className="text-on-surface font-semibold">{formatCount(likeCount)}</strong> Likes
                </span>
            )}
        </div>
    )
}

export default PostStats;
