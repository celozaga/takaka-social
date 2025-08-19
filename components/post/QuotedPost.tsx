
import React from 'react';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import { BadgeCheck } from 'lucide-react';

const QuotedPost: React.FC<{ post: AppBskyFeedDefs.PostView }> = ({ post }) => {
    const record = post.record as { text: string; facets?: RichText['facets'] };
    const firstImage = (AppBskyEmbedImages.isView(post.embed) && post.embed.images.length > 0)
        ? post.embed.images[0]
        : null;

    const postLink = `#/post/${post.author.did}/${post.uri.split('/').pop()}`;

    return (
        <a href={postLink} className="block border border-outline rounded-xl p-3 hover:bg-surface-3/50 transition-colors">
            <div className="flex items-center gap-2">
                <img src={post.author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} className="w-5 h-5 rounded-full bg-surface-3" />
                <span className="font-bold text-sm flex items-center gap-1">
                    <span>{post.author.displayName || `@${post.author.handle}`}</span>
                     {post.author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                        <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
                    )}
                </span>
                <span className="text-sm text-on-surface-variant truncate">@{post.author.handle}</span>
            </div>
            {record.text && (
                <p className="text-sm text-on-surface line-clamp-4 mt-1 whitespace-pre-wrap break-words">
                    <RichTextRenderer record={record} />
                </p>
            )}
            {firstImage && (
                <img src={firstImage.thumb} className="mt-2 w-full h-auto max-h-48 object-cover rounded-lg" />
            )}
        </a>
    );
};

export default QuotedPost;
