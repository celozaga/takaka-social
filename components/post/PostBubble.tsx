

import React from 'react';
import { 
    AppBskyFeedDefs, 
    RichText, 
    AppBskyEmbedImages, 
    AppBskyEmbedVideo, 
    AppBskyEmbedRecord, 
    AppBskyEmbedRecordWithMedia,
    AppBskyFeedPost,
    AppBskyEmbedExternal
} from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import PostActions from './PostActions';
import { BadgeCheck, ExternalLink, PlayCircle, Repeat } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import ExternalLinkEmbed from './ExternalLinkEmbed';
import ReplyPreview from './ReplyPreview';

interface PostBubbleProps {
    post: AppBskyFeedDefs.PostView;
    reason?: AppBskyFeedDefs.ReasonRepost;
    showAuthor?: boolean;
    profileOwnerActor?: string;
}

const QuotedPost: React.FC<{ embed: AppBskyEmbedRecord.View }> = ({ embed }) => {
    if (AppBskyEmbedRecord.isViewRecord(embed)) {
        if (AppBskyFeedDefs.isPostView(embed.record)) {
            const postView: AppBskyFeedDefs.PostView = embed.record;
            const author = postView.author;
            const postViewRecord = postView.record;

            if (AppBskyFeedPost.isRecord(postViewRecord)) {
                const postRecord = postViewRecord as AppBskyFeedPost.Record;

                return (
                    <a href={`#/post/${author.did}/${postView.uri.split('/').pop()}`} className="block border border-outline rounded-lg p-2 mt-2 hover:bg-surface-3/50">
                        <div className="flex items-center gap-2 text-sm">
                            <img src={author.avatar} className="w-5 h-5 rounded-full bg-surface-3" />
                            <span className="font-semibold">{author.displayName}</span>
                            <span className="text-on-surface-variant">@{author.handle}</span>
                        </div>
                        <p className="text-sm mt-1 line-clamp-4">{postRecord.text}</p>
                    </a>
                );
            }
        }
    }
    
    if (AppBskyEmbedRecord.isViewNotFound(embed)) {
        return <div className="border border-outline rounded-lg p-2 mt-2 text-sm text-on-surface-variant">Quoted post not found.</div>;
    }

    if (AppBskyEmbedRecord.isViewBlocked(embed)) {
        return <div className="border border-outline rounded-lg p-2 mt-2 text-sm text-on-surface-variant">Content from a blocked user.</div>;
    }

    return null; // It's a valid record but not a post (e.g., a feed generator)
};

const PostBubble: React.FC<PostBubbleProps> = ({ post, reason, showAuthor = false, profileOwnerActor }) => {
    const { record: unknownRecord } = post;
    if (!AppBskyFeedPost.isRecord(unknownRecord)) {
        return null; // This is not a standard post, maybe a list or something else.
    }
    const record = unknownRecord as AppBskyFeedPost.Record;
    const author = post.author;
    const isReply = !!(record.reply);

    const renderMedia = () => {
        if (!post.embed) return null;
        
        const processImageEmbed = (embed:AppBskyEmbedImages.View) => {
            if (embed.images.length === 0) return null;
            
            const imageCount = embed.images.length;
            let containerClasses = 'mt-2 grid gap-1.5 rounded-xl overflow-hidden';
            
            const baseImageComponent = (image:AppBskyEmbedImages.ViewImage, index: number, className: string = "block relative group bg-surface-3 aspect-square") => (
                 <a href={image.fullsize} target="_blank" rel="noopener noreferrer" key={index} className={className}>
                    <img src={image.thumb} alt={image.alt || `Post image ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="text-white w-6 h-6" />
                    </div>
                </a>
            );

            let imageComponents = embed.images.map((img, i) => baseImageComponent(img, i));

            switch(imageCount) {
                case 2:
                    containerClasses += ' grid-cols-2';
                    break;
                case 3:
                    containerClasses += ' grid-cols-2 grid-rows-2';
                    imageComponents = [
                        baseImageComponent(embed.images[0], 0, "block relative group bg-surface-3 aspect-square row-span-2"),
                        baseImageComponent(embed.images[1], 1),
                        baseImageComponent(embed.images[2], 2),
                    ];
                    break;
                case 4:
                    containerClasses += ' grid-cols-2 grid-rows-2';
                    break;
            }

            return (
                <div className={containerClasses} style={{gridTemplateRows: (imageCount > 2) ? 'repeat(2, minmax(0, 1fr))' : 'none'}}>
                    {imageComponents}
                </div>
            );
        };
        
        const processVideoEmbed = (embedView:AppBskyEmbedVideo.View) => {
            return (
                 <a href={`#/post/${author.did}/${post.uri.split('/').pop()}`} className="block relative group bg-black rounded-xl overflow-hidden mt-2">
                    <img src={embedView.thumbnail} className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <PlayCircle className="text-white w-12 h-12" />
                    </div>
                </a>
            );
        }

        const embed = post.embed;
        if (AppBskyEmbedImages.isView(embed)) return processImageEmbed(embed);
        if (AppBskyEmbedVideo.isView(embed)) return processVideoEmbed(embed);
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            const media = embed.media;
            if (AppBskyEmbedImages.isView(media)) return processImageEmbed(media as AppBskyEmbedImages.View);
            if (AppBskyEmbedVideo.isView(media)) return processVideoEmbed(media);
        }
        return null;
    };
    
    const renderEmbed = () => {
        if (!post.embed) return null;
        
        if (AppBskyEmbedExternal.isView(post.embed)) {
            return <ExternalLinkEmbed embed={post.embed} />;
        }
        if (AppBskyEmbedRecord.isView(post.embed)) {
            return <QuotedPost embed={post.embed} />;
        }
         if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
            if (AppBskyEmbedRecord.isView(post.embed.record)) {
                return <QuotedPost embed={post.embed.record} />;
            }
        }
        return null;
    }
    
    const timeAgo = formatDistanceToNowStrict(new Date(record.createdAt), { addSuffix: false });

    return (
        <div className="bg-surface-2 p-3 rounded-2xl rounded-bl-md shadow-sm">
            {reason && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                    <Repeat size={14} />
                    <span className="truncate">
                        {profileOwnerActor && (reason.by.handle === profileOwnerActor || reason.by.did === profileOwnerActor)
                            ? 'Reposted'
                            : <>Reposted by <a href={`#/profile/${reason.by.handle}`} className="hover:underline font-semibold" onClick={e => e.stopPropagation()}>{reason.by.displayName || `@${reason.by.handle}`}</a></>
                        }
                    </span>
                </div>
            )}

            {showAuthor && (
                 <div className="flex items-center gap-2 mb-2">
                     <a href={`#/profile/${author.handle}`}>
                        <img src={author.avatar} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" />
                     </a>
                     <div>
                        <a href={`#/profile/${author.handle}`} className="font-bold hover:underline leading-tight text-sm inline-flex items-center gap-1">
                            <span>{author.displayName || `@${author.handle}`}</span>
                            {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
                            )}
                        </a>
                        <p className="text-xs text-on-surface-variant">@{author.handle}</p>
                    </div>
                 </div>
            )}

            {isReply && record.reply && <ReplyPreview replyRef={record.reply} />}

            {record.text && (
                <div className="text-on-surface whitespace-pre-wrap break-words">
                    <RichTextRenderer record={record} />
                </div>
            )}
            {renderMedia()}
            {renderEmbed()}
            <div className="flex justify-end items-center gap-4 text-on-surface-variant text-xs mt-2">
                <PostActions post={post} />
                <a href={`#/post/${author.did}/${post.uri.split('/').pop()}`} className="hover:underline">{timeAgo}</a>
            </div>
        </div>
    );
};

export default PostBubble;
