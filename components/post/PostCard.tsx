import React from 'react';
import { Link } from 'expo-router';
import { AppBskyFeedDefs, AppBskyEmbedImages,AppBskyActorDefs, RichText, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { usePostActions } from '../../hooks/usePostActions';
import { Images, ExternalLink, PlayCircle, Heart, BadgeCheck, Repeat } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import PostCardSkeleton from './PostCardSkeleton';
import ResizedImage from '../shared/ResizedImage';
import SharedVideoPlayer from '../shared/VideoPlayer';

type PostCardProps = {
    feedViewPost: AppBskyFeedDefs.FeedViewPost;
    isClickable?: boolean;
    showAllMedia?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ feedViewPost, isClickable = true, showAllMedia = false }) => {
    const { agent } = useAtp();
    const moderation = useModeration();
    const [isContentVisible, setIsContentVisible] = React.useState(false);
    const [hlsUrl, setHlsUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!showAllMedia) return;

        const { post } = feedViewPost;
        const embed = post.embed;
        let videoEmbed: AppBskyEmbedVideo.View | undefined;

        if (AppBskyEmbedVideo.isView(embed)) {
            videoEmbed = embed;
        } else if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media)) {
            videoEmbed = embed.media as AppBskyEmbedVideo.View;
        }

        if (videoEmbed) {
            const fetchUrl = async () => {
                try {
                    const result = await (agent.api.app.bsky.video as any).getPlaybackUrl({
                        did: post.author.did,
                        cid: videoEmbed!.cid,
                    });
                    setHlsUrl(result.data.url);
                } catch (error) {
                    console.warn(`Could not get HLS playback URL for ${post.uri}, falling back to blob.`, error);
                    setHlsUrl(null);
                }
            };
            fetchUrl();
        }
    }, [showAllMedia, feedViewPost, agent]);
    
    const { post, reason } = feedViewPost;
    
    const modDecision = moderation.isReady ? moderatePost(post, moderation) : null;

    const { likeUri, likeCount, isLiking, handleLike } = usePostActions(post);
    const author = post.author as AppBskyActorDefs.ProfileViewBasic;
    const record = post.record as { text: string; createdAt: string, facets?: RichText['facets'] };
    const postText = record?.text || '';
    const rkey = post.uri.split('/').pop() as string;
    const postLink = `/post/${author.did}/${rkey}`;
    const profileLink = `/profile/${author.handle}`;

    const getMediaInfo = (p: AppBskyFeedDefs.PostView): { mediaPost: AppBskyFeedDefs.PostView, mediaEmbed: (AppBskyEmbedImages.View | AppBskyEmbedVideo.View) } | null => {
        const embed = p.embed;
        if (!embed) return null;
        if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) return { mediaPost: p, mediaEmbed: embed };
        if (AppBskyEmbedVideo.isView(embed)) return { mediaPost: p, mediaEmbed: embed };
        return null;
    }
    
    const mediaInfo = getMediaInfo(post);

    const renderMedia = () => {
        if (!mediaInfo) return null;
        
        const { mediaPost, mediaEmbed } = mediaInfo;
        const isRepost = reason && AppBskyFeedDefs.isReasonRepost(reason);

        if (AppBskyEmbedImages.isView(mediaEmbed)) {
            const embed = mediaEmbed;
            if (showAllMedia && embed.images.length > 0) {
                const gridCols = embed.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1';
                return (
                    <div className={`grid ${gridCols} gap-1.5`}>
                        {embed.images.map((image, index) => {
                            return (
                                <a href={image.fullsize} target="_blank" rel="noopener noreferrer" key={index} className="block relative group bg-surface-3 rounded-md overflow-hidden">
                                    <ResizedImage
                                        src={image.thumb}
                                        resizeWidth={400}
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
            
            const hasMultipleImages = embed.images.length > 1;
            
            return (
                <div className="relative">
                    <ResizedImage 
                        src={firstImage.thumb}
                        resizeWidth={400}
                        alt={firstImage.alt || 'Post image'} 
                        className="w-full h-auto object-cover" 
                        loading="lazy"
                    />
                    {(hasMultipleImages || isRepost) && (
                         <div className="absolute top-2 right-2 flex items-center gap-1.5">
                            {isRepost && (
                                <div className="bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                                    <Repeat size={14} />
                                </div>
                            )}
                            {hasMultipleImages && (
                                <div className="bg-black/70 text-white text-xs font-bold py-1 px-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm border border-white/20">
                                    <Images size={14} />
                                    <span>{embed.images.length}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        if (AppBskyEmbedVideo.isView(mediaEmbed)) {
            const embedView = mediaEmbed;
            const authorDid = (mediaPost.author as AppBskyActorDefs.ProfileViewBasic).did;
            const videoCid = embedView.cid;
            const posterUrl = embedView.thumbnail;
            
            if (!authorDid || !videoCid || !agent.service) {
                return <div className="w-full aspect-video bg-surface-3 flex items-center justify-center text-on-surface-variant">Video data unavailable</div>;
            }
            
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;

            if (showAllMedia) {
                const blobVideoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
                const playerOptions = {
                    autoplay: true,
                    controls: true,
                    poster: posterUrl,
                    sources: [{ 
                        src: hlsUrl || blobVideoUrl, 
                        type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4' 
                    }],
                    loop: true,
                    muted: true,
                    playsinline: true
                };
                return <SharedVideoPlayer options={playerOptions} className="w-full h-auto bg-black rounded-lg" />;
            }

            if (!posterUrl) {
                 return (
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center text-on-surface-variant">
                        <PlayCircle size={32} className="text-white/50" />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                           {isRepost && (
                                <div className="bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                                   <Repeat size={14}/>
                               </div>
                           )}
                           <div className="bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                              <PlayCircle size={14}/>
                           </div>
                        </div>
                    </div>
                 );
            }
            
            return (
                <div className="relative">
                    <ResizedImage src={posterUrl} resizeWidth={400} className="w-full h-auto object-cover bg-black" />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        {isRepost && (
                            <div className="bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                                <Repeat size={14}/>
                            </div>
                        )}
                        <div className="bg-black/70 text-white text-xs font-bold p-1.5 rounded-full backdrop-blur-sm border border-white/20">
                            <PlayCircle size={14}/>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderContext = () => {
        if (reason && AppBskyFeedDefs.isReasonRepost(reason)) {
            return (
                <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
                    <Repeat size={14} />
                    <span className="truncate">
                        Reposted by <Link href={`/profile/${reason.by.handle}` as any} className="hover:underline" onClick={e => e.stopPropagation()}>{reason.by.displayName || `@${reason.by.handle}`}</Link>
                    </span>
                </div>
            );
        }
    
        return null;
    };
    
    if (!modDecision) {
        return <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>;
    }
    
    if (modDecision.visibility === 'hide') {
        return null;
    }
    
    if (modDecision.visibility === 'warn' && !isContentVisible) {
        return (
             <article className="bg-surface-2 rounded-xl overflow-hidden flex flex-col">
                <ContentWarning 
                    reason={modDecision.reason!} 
                    onShow={() => setIsContentVisible(true)} 
                />
            </article>
        );
    }


    const mediaElement = renderMedia();
    if (!mediaElement) return null;

    const Wrapper = isClickable ? Link : 'div';
    const wrapperProps = isClickable ? { href: postLink } : {};

    return (
         <article className="bg-surface-2 rounded-xl overflow-hidden flex flex-col">
            <Wrapper {...wrapperProps as any} className="w-full block">
                {mediaElement}
            </Wrapper>
            <div className="p-3">
                {renderContext()}
                {postText && (
                     <Wrapper {...wrapperProps as any} className="block mb-2">
                        <p className="text-sm text-on-surface line-clamp-3 break-words">
                            <RichTextRenderer record={record} />
                        </p>
                    </Wrapper>
                )}
                 <div className="flex items-center justify-between gap-2 text-sm mt-2">
                   <Link href={profileLink as any} className="flex items-center gap-2 truncate hover:opacity-80 transition-opacity min-w-0">
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
                   </Link>
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
