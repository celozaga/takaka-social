
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import ReplyPostPreview from './ReplyPostPreview';

interface ReplyParentPreviewProps {
  parentUri: string;
}

const ReplyParentPreview: React.FC<ReplyParentPreviewProps> = ({ parentUri }) => {
    const { agent } = useAtp();
    const [parentPost, setParentPost] = useState<AppBskyFeedDefs.PostView | null>(null);
    
    useEffect(() => {
        let isCancelled = false;
        const fetchParent = async () => {
            try {
                const { data } = await agent.getPostThread({ uri: parentUri, depth: 0 });
                if (!isCancelled && AppBskyFeedDefs.isThreadViewPost(data.thread) && data.thread.post) {
                    setParentPost(data.thread.post);
                }
            } catch (error) {
                console.error("Failed to fetch reply parent", error);
            }
        };
        fetchParent();
        return () => { isCancelled = true; };
    }, [agent, parentUri]);

    if (!parentPost) return null;

    return <ReplyPostPreview post={parentPost} />;
};
export default ReplyParentPreview;
