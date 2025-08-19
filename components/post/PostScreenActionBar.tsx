

import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Smile, Paperclip } from 'lucide-react';
import { AppBskyFeedDefs } from '@atproto/api';

interface PostScreenActionBarProps {
    post: AppBskyFeedDefs.PostView;
}

const PostScreenActionBar: React.FC<PostScreenActionBarProps> = ({ post }) => {
    const { session, profile } = useAtp();
    const { openComposer } = useUI();

    if (!session) return null;

    return (
        <div className="flex-shrink-0 bg-surface-1 p-2 border-t border-outline">
            <div className="flex items-center gap-2">
                <img src={profile?.avatar} alt="My avatar" className="w-9 h-9 rounded-full bg-surface-3" />
                <button
                    onClick={() => openComposer({ replyTo: { uri: post.uri, cid: post.cid } })}
                    className="flex-1 bg-surface-2 h-10 rounded-2xl flex items-center px-4 gap-3 text-left"
                >
                    <Smile className="w-5 h-5 text-on-surface-variant" />
                    <span className="text-on-surface-variant text-base">Comment...</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-primary" aria-label="Attach file">
                    <Paperclip className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default PostScreenActionBar;