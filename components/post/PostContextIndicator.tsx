



import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedRecord, AppBskyFeedPost, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import { MessageSquare, Quote } from 'lucide-react';

interface PostContextIndicatorProps {
  post: AppBskyFeedDefs.PostView;
}

const PostContextIndicator: React.FC<PostContextIndicatorProps> = ({ post }) => {
    const { agent } = useAtp();
    const [authorName, setAuthorName] = useState<string | null>(null);
    const [authorHandle, setAuthorHandle] = useState<string | null>(null);
    const [type, setType] = useState<'reply' | 'quote' | null>(null);

    const record = post.record;
    const embed = post.embed;

    useEffect(() => {
        let isCancelled = false;
        
        // Check for reply first, as it's the primary context
        if (AppBskyFeedPost.isRecord(record)) {
            const postRecord = record as AppBskyFeedPost.Record;
            if (postRecord.reply?.parent) {
                setType('reply');
                const parentUri = postRecord.reply.parent.uri;
                agent.getPostThread({ uri: parentUri, depth: 0 }).then(({ data }) => {
                    if (!isCancelled && AppBskyFeedDefs.isThreadViewPost(data.thread)) {
                        const parentAuthor = data.thread.post.author;
                        setAuthorName(parentAuthor.displayName || `@${parentAuthor.handle}`);
                        setAuthorHandle(parentAuthor.handle);
                    }
                }).catch(err => console.error("Failed to fetch parent post for reply context", err));
                // Reply context found, don't check for quote
                return () => { isCancelled = true; };
            }
        }
        
        // Then check for quote
        let quotedPost: AppBskyFeedDefs.PostView | undefined;

        if (embed && AppBskyEmbedRecord.isViewRecord(embed) && AppBskyFeedDefs.isPostView(embed.record)) {
            quotedPost = embed.record;
        } else if (embed && AppBskyEmbedRecordWithMedia.isView(embed)) {
            const recordWithMediaViewRecord = embed.record;
            const embedRecordViewRecord = recordWithMediaViewRecord.record;
            if (AppBskyEmbedRecord.isViewRecord(embedRecordViewRecord) && AppBskyFeedDefs.isPostView(embedRecordViewRecord.record)) {
                quotedPost = embedRecordViewRecord.record;
            }
        }

        if (quotedPost) {
            setType('quote');
            const quotedAuthor = quotedPost.author;
            setAuthorName(quotedAuthor.displayName || `@${quotedAuthor.handle}`);
            setAuthorHandle(quotedAuthor.handle);
        }

        return () => { isCancelled = true; };
    }, [agent, record, embed]);

    if (!type || !authorName || !authorHandle) {
        return null;
    }
    
    const Icon = type === 'reply' ? MessageSquare : Quote;
    const text = type === 'reply' ? 'Replying to' : 'Quoting';

    return (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
            <Icon size={14} />
            <span className="truncate">
                {text} <a href={`#/profile/${authorHandle}`} className="hover:underline font-semibold" onClick={e => e.stopPropagation()}>{authorName}</a>
            </span>
        </div>
    );
};

export default PostContextIndicator;
