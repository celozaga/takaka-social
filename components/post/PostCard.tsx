
import React from 'react';
import { AppBskyFeedDefs, AppBskyEmbedImages,AppBskyActorDefs, RichText, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { usePostActions } from '../../hooks/usePostActions';
import { Images, ExternalLink, PlayCircle, Heart, BadgeCheck, Repeat, MessageCircle } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';

type PostCardProps = {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
    isClickable?: boolean;
    showAllMedia?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ feedViewPost, isClickable = true, showAllMedia = false }) => {
    const { agent } = useAtp();
    const { post, reason, reply } = feedViewPost;
    const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
    const author = post.author as AppBskyActorDefs.ProfileViewBasic;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
    const postText = record?.text || '';
    const rkey = post.uri.split('/').pop() as string;
    const postLink = `#/post/${author.did}/${rkey}`;
    const profileLink = `#/profile/${author.handle}`;

    const renderMedia = () => {
        if (!post.embed) return null;

        const processImageEmbed = (embed: AppBskyEmbedImages.View) => {
            if (showAllMedia && embed.images.length > 0) {
                const gridCols = embed.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1';
                return (
                    <div className={`grid ${gridCols} gap-1.5`}>
                        {embed.images.map((image, index) => {
                            return (
                                <a href={image.fullsize} target="_blank" rel="noopener noreferrer" key={index} className="block relative group bg-surface-3 rounded-md overflow-hidden">
                                    <img
                                        src={image.thumb}
                                        alt={image.alt || `Post image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink className="text-white w-6 h-6" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                );
            }
            
            const firstImage = embed.images[0];
            if (!firstImage) return null;
            
            return (
                <div className="relative">
                    <img 
                        src={firstImage.thumb} 
                        alt={firstImage.alt || 'Post image'} 
                        className="w-full h-auto object-cover" 
                        loading="lazy"
                    />
                    {embed.images.length > 1 && (
                         <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold py-1 px-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm border border-white/20">
                            <Images size={14} />
                            <span>{embed.images.length}</span>
                        </div>
                    )}
                </div>
            );
        };
        
        const processVideoEmbed = (embedView: AppBskyEmbedVideo.View) => {
            const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
            const videoCid = embedView.cid;
            const posterUrl = embedView.thumbnail;
            
            if (!authorDid || !videoCid || !agent.service) {
                return <div className="w-full aspect-video bg-surface-3 flex items-center justify-center text-on-surface-variant">Video data unavailable</div>;
            }
            
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;

            if (showAllMedia) {
                 const videoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
                 return (
                     <video
                        src={videoUrl}
                        poster={posterUrl}
                        controls
                        muted
                        autoPlay
                        loop
                        className="w-full h-auto bg-black rounded-lg"
                     />
                 )
            }

            // Timeline view: Show thumbnail with play icon
            if (!posterUrl) {
                 return (
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center text-on-surface-variant">
                        <PlayCircle size={32} className="text-white/50" />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                           <PlayCircle size={14}/>
                        </div>
                    </div>
                 );
            }
            
            return (
                <div className="relative">
                    <img src={posterUrl} className="w-full h-auto object-cover bg-black" />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                        <PlayCircle size={14}/>
                    </div>
                </div>
            );
        }

        const embed = post.embed;

        if (AppBskyEmbedImages.isView(embed)) {
            return processImageEmbed(embed);
        }

        if (AppBskyEmbedVideo.isView(embed)) {
            return processVideoEmbed(embed);
        }

        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            const media = embed.media;
            if (AppBskyEmbedImages.isView(media)) {
                return processImageEmbed(media as AppBskyEmbedImages.View);
            }
            if (AppBskyEmbedVideo.isView(media)) {
                return processVideoEmbed(media as AppBskyEmbedVideo.View);
            }
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

    const mediaElement = renderMedia();
    if (!mediaElement) return null;

    const Wrapper = isClickable ? 'a' : 'div';
    const wrapperProps = isClickable ? { href: postLink } : {};

    return (
         <article className="bg-surface-2 rounded-xl overflow-hidden flex flex-col">
            <Wrapper {...wrapperProps} className="w-full block">
                {mediaElement}
            </Wrapper>
            <div className="p-3">
                {renderContext()}
                {postText && (
                     <Wrapper {...wrapperProps} className="block mb-2">
                        <p className="text-sm text-on-surface line-clamp-3 break-words">
                            <RichTextRenderer record={record} />
                        </p>
                    </Wrapper>
                )}
                 <div className="flex items-center justify-between gap-2 text-sm mt-2">
                   <a href={profileLink} className="flex items-center gap-2 truncate hover:opacity-80 transition-opacity min-w-0">
                     <img 
                        src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') || `https://picsum.photos/seed/${author.did}/24`} 
                        alt={`${author.displayName}'s avatar`} 
                        className="w-7 h-7 rounded-full bg-surface-3 flex-shrink-0" 
                        loading="lazy"
                     />
                     <div className="flex items-center gap-1 truncate">
                        <span className="text-on-surface font-semibold truncate text-xs">{author.displayName || `@${author.handle}`}</span>
                        {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                            <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
                        )}
                     </div>
                   </a>
                   <button 
                        onClick={handleLike} 
                        disabled={isLiking}
                        className={`flex items-center gap-1.5 transition-colors ${likeUri ? 'text-pink-500' : 'text-on-surface-variant hover:text-pink-500'}`}
                        aria-label="Like"
                    >
                        <Heart size={16} fill={likeUri ? 'currentColor' : 'none'} />
                        <span className="font-semibold text-xs">{likeCount}</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default React.memo(PostCard);