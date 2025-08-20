
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import ReplyPostPreview from './ReplyPostPreview';

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
        return <div className="h-16 w-full bg-surface-3/50 rounded-lg animate-pulse my-2"></div>;
    }

    if (!parentPost) {
        return null;
    }

    return <ReplyPostPreview post={parentPost} />;
};

export default ReplyPreview;
