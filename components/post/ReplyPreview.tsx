
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import ReplyPostPreview from './ReplyPostPreview';
import { Share } from 'lucide-react';

interface ReplyPreviewProps {
  replyRef: AppBskyFeedPost.ReplyRef;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyRef }) => {
    const { agent } = useAtp();
    const [parentPost, setParentPost] = useState<AppBskyFeedDefs.PostView | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;
        const fetchParent = async () => {
            setIsLoading(true);
            try {
                const { data } = await agent.getPostThread({ uri: replyRef.parent.uri, depth: 0 });
                if (!isCancelled && AppBskyFeedDefs.isThreadViewPost(data.thread)) {
                    setParentPost(data.thread.post);
                }
            } catch (err) {
                // Don't show an error, just fail silently and show no preview
                console.warn("Failed to fetch parent post for preview", err);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };
        fetchParent();
        return () => { isCancelled = true; };
    }, [agent, replyRef.parent.uri]);

    if (isLoading) {
        return <div className="h-20 w-full bg-surface-3/50 rounded-lg animate-pulse my-2"></div>;
    }

    if (!parentPost) {
        return null;
    }
    
    const author = parentPost.author;

    return (
        <div className="mt-2">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-1">
                <Share size={16} className="-scale-x-100" />
                <span>
                    Replied to <a href={`#/profile/${author.handle}`} className="hover:underline font-semibold text-on-surface" onClick={e => e.stopPropagation()}>{author.displayName || `@${author.handle}`}</a>
                </span>
            </div>
            <ReplyPostPreview post={parentPost} />
        </div>
    );
};

export default ReplyPreview;
