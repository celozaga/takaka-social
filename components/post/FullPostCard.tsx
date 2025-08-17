
import React from 'react';
import { AppBskyFeedDefs, AppBskyEmbedImages, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyActorDefs, AppBskyFeedPost } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Repeat, MessageCircle, ExternalLink } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import PostActions from './PostActions';

interface FullPostCardProps {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
}

const FullPostCard: React.FC<FullPostCardProps> = ({ feedViewPost }) => {
    const { agent } = useAtp();
    const { post, reason, reply } = feedViewPost;
    const author = post.author;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };

    const postLink = `#/post/${author.did}/${post.uri.split('/').pop()}`;

    const renderMedia = () => {
        if (!post.embed) return null;
        
        const processImageEmbed = (embed: AppBskyEmbedImages.View) => {
            if (embed.images.length === 0) return null;
            const gridCols = embed.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1';
            const gridRows = embed.images.length > 2 ? 'grid-rows-2' : 'grid-rows-1';
            return (
                <div className={`mt-2 grid ${gridCols} ${gridRows} gap-1.5 rounded-xl overflow-hidden`}>
                    {embed.images.map((image, index) => (
                        <a href={image.fullsize} target="_blank" rel="noopener noreferrer" key={index} className="block relative group bg-surface-3 aspect-square">
                            <img src={image.thumb} alt={image.alt || `Post image ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                             <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink className="text-white w-6 h-6" />
                            </div>
                        </a>
                    ))}
                </div>
            );
        };
        
        const processVideoEmbed = (embedView: AppBskyEmbedVideo.View) => {
            const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
            const videoCid = embedView.cid;
            if (!authorDid || !videoCid || !agent.service) return null;
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
            const videoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
            return (
                <video src={videoUrl} poster={embedView.thumbnail} controls muted autoPlay loop className="w-full h-auto bg-black rounded-lg mt-2" />
            );
        }

        const embed = post.embed;
        if (AppBskyEmbedImages.isView(embed)) return processImageEmbed(embed);
        if (AppBskyEmbedVideo.isView(embed)) return processVideoEmbed(embed);
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            const media = embed.media;
            if (AppBskyEmbedImages.isView(media)) return processImageEmbed(media);
            if (AppBskyEmbedVideo.isView(media)) return processVideoEmbed(media);
        }
        return null;
    };
    
     const renderContext = () => {
        if (reason && AppBskyFeedDefs.isReasonRepost(reason)) {
            return (
                <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
                    <Repeat size={14} />
                    <span className="truncate">
                        Reposted by <a href={`#/profile/${reason.by.handle}`} className="hover:underline" onClick={e => e.stopPropagation()}>{reason.by.displayName || `@${reason.by.handle}`}</a>
                    </span>
                </div>
            );
        }
    
        if (reply && AppBskyFeedDefs.isPostView(reply.parent)) {
            return (
                <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
                    <MessageCircle size={14} />
                    <span className="truncate">
                        Reply to <a href={`#/profile/${reply.parent.author.handle}`} className="hover:underline" onClick={e => e.stopPropagation()}>{reply.parent.author.displayName || `@${reply.parent.author.handle}`}</a>
                    </span>
                </div>
            );
        }
        return null;
    };


    return (
        <li className="py-2">
            <a href={postLink} className="block p-4 bg-surface-2 hover:bg-surface-3 rounded-xl transition-colors">
                {renderContext()}
                <div className="flex items-start gap-3">
                    <a href={`#/profile/${author.handle}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full bg-surface-3" loading="lazy" />
                    </a>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                             <a href={`#/profile/${author.handle}`} className="font-bold hover:underline truncate inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <span className="truncate">{author.displayName || `@${author.handle}`}</span>
                                {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                    <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
                                )}
                            </a>
                             <span className="text-on-surface-variant flex-shrink-0">· {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}</span>
                        </div>
                        {record.text && (
                            <div className="text-on-surface whitespace-pre-wrap mt-1 text-sm break-words">
                                <RichTextRenderer record={record} />
                            </div>
                        )}
                        {renderMedia()}
                        <div className="mt-3">
                            <PostActions post={post} />
                        </div>
                    </div>
                </div>
            </a>
        </li>
    );
};

export default FullPostCard;
