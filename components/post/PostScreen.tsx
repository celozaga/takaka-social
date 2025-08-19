

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedPost } from '@atproto/api';
import Reply from './Reply';
import PostScreenActionBar from './PostScreenActionBar';
import { useToast } from '../ui/use-toast';
import { ArrowLeft, ExternalLink, Share2, BadgeCheck, ChevronLeft, ChevronRight, MessageSquareDashed, MoreHorizontal, Loader2, ShieldAlert, Heart, Repeat, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useHeadManager } from '../../hooks/useHeadManager';
import Hls from 'hls.js';
import { useModeration } from '../../context/ModerationContext';
import { moderatePost } from '../../lib/moderation';
import ContentWarning from '../shared/ContentWarning';
import { usePostActions } from '../../hooks/usePostActions';


const getImageUrlFromPost = (post: AppBskyFeedDefs.PostView): string | undefined => {
    if (!post.embed) return undefined;
    
    let embed = post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(embed)) {
        embed = embed.media;
    }

    if (AppBskyEmbedImages.isView(embed) && embed.images[0]) {
        return embed.images[0].thumb;
    }
    if (AppBskyEmbedVideo.isView(embed)) {
        return embed.thumbnail;
    }
    return undefined;
};

const PostVideoPlayer: React.FC<{ hlsSrc?: string | null; blobSrc: string; poster?: string }> = ({ hlsSrc, blobSrc, poster }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const cleanup = () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };

        if (hlsSrc && Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(hlsSrc);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error('HLS fatal error, falling back to blob:', data);
                    cleanup();
                    if (videoElement) {
                        videoElement.src = blobSrc;
                    }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl') && hlsSrc) {
            videoElement.src = hlsSrc;
        } else {
            videoElement.src = blobSrc;
        }

        return cleanup;
    }, [hlsSrc, blobSrc]);

    return (
        <video
            ref={videoRef}
            poster={poster}
            controls
            muted
            autoPlay
            loop
            playsInline
            className="w-full h-auto bg-black rounded-lg"
        />
    );
};

const PostStats: React.FC<{ post: AppBskyFeedDefs.PostView }> = ({ post }) => {
    const {
        likeUri, likeCount, isLiking, handleLike,
        repostUri, repostCount, isReposting, handleRepost
    } = usePostActions(post);

    const formatStat = (count: number) => {
        if (count > 999999) return `${(count / 1000000).toFixed(1)}M`.replace('.0','');
        if (count > 999) return `${(count / 1000).toFixed(1)}K`.replace('.0','');
        return count.toString();
    };

    return (
        <div className="flex items-center gap-2 mt-3 text-sm text-on-surface-variant">
            <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${likeUri ? 'bg-like/20 text-like' : 'bg-surface-3 hover:bg-surface-3/80'}`}
            >
                <Heart size={16} fill={likeUri ? 'currentColor' : 'none'} />
                <span className="font-semibold">{formatStat(likeCount)}</span>
            </button>
            <button
                onClick={handleRepost}
                disabled={isReposting}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${repostUri ? 'bg-primary/20 text-primary' : 'bg-surface-3 hover:bg-surface-3/80'}`}
            >
                <Repeat size={16} />
                <span className="font-semibold">{formatStat(repostCount)}</span>
            </button>
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-3">
                <MessageCircle size={16} />
                <span className="font-semibold">{formatStat(post.replyCount || 0)}</span>
            </div>
        </div>
    );
};


interface PostScreenProps {
  did: string;
  rkey: string;
}

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent } = useAtp();
  const { openMediaActionsModal } = useUI();
  const { t } = useTranslation();
  const moderation = useModeration();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postAuthor, setPostAuthor] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartXRef = useRef(0);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
 
  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  const record = thread?.post.record as { text: string, facets?: RichText['facets'], createdAt: string };
  const postExcerpt = record?.text ? (record.text.length > 100 ? record.text.substring(0, 100) + '…' : record.text) : '';
  const title = postAuthor ? `${t('post.byline', { user: `@${postAuthor.handle}`})}${postExcerpt ? `: "${postExcerpt}"` : ''}` : t('common.post');
  const description = record?.text;
  const imageUrl = thread?.post ? getImageUrlFromPost(thread.post) : undefined;

  useHeadManager({ title, description, imageUrl, type: 'article' });


  useEffect(() => {
    setCurrentImageIndex(0); // Reset for new posts
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 100, parentHeight: 5 });
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
          const profileRes = await agent.getProfile({ actor: data.thread.post.author.did });
          setPostAuthor(profileRes.data);
        } else {
          throw new Error(t('post.notFound'));
        }
      } catch (err: any) {
        console.error("Failed to fetch post thread:", err);
        setError(err.message || t('post.loadingError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchThread();
  }, [agent, postUri, t]);

  useEffect(() => {
    if (!thread?.post) return;

    const embed = thread.post.embed;
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
                    did: thread.post.author.did,
                    cid: videoEmbed!.cid,
                });
                setHlsUrl(result.data.url);
            } catch (error) {
                console.warn(`Could not get HLS playback URL for ${thread.post.uri}, falling back to blob.`, error);
                setHlsUrl(null);
            }
        };
        fetchUrl();
    }
  }, [thread, agent]);

  const renderMedia = (post: AppBskyFeedDefs.PostView) => {
        if (!post.embed) return null;

        const processImageEmbed = (embed: AppBskyEmbedImages.View) => {
            if (embed.images.length === 0) return null;

            const activeImage = embed.images[currentImageIndex];

            if (embed.images.length === 1) {
                return (
                    <a href={activeImage.fullsize} target="_blank" rel="noopener noreferrer" className="block relative group bg-black rounded-xl overflow-hidden">
                        <img src={activeImage.thumb} alt={activeImage.alt || 'Post image'} className="w-full h-auto object-contain max-h-[80vh]" loading="lazy" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white w-6 h-6" />
                        </div>
                    </a>
                );
            }
            
            // Carousel for multiple images
            const handlePrev = (e?: React.MouseEvent) => {
                e?.preventDefault();
                e?.stopPropagation();
                setCurrentImageIndex(prev => Math.max(0, prev - 1));
            };

            const handleNext = (e?: React.MouseEvent) => {
                e?.preventDefault();
                e?.stopPropagation();
                setCurrentImageIndex(prev => Math.min(embed.images.length - 1, prev + 1));
            };
            
            const handleTouchStart = (e: React.TouchEvent) => {
                touchStartXRef.current = e.targetTouches[0].clientX;
            };
    
            const handleTouchEnd = (e: React.TouchEvent) => {
                if (touchStartXRef.current === 0) return;
                const touchEndX = e.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartXRef.current;
                touchStartXRef.current = 0; // Reset immediately
    
                // Swipe threshold
                if (Math.abs(deltaX) > 50) {
                    if (deltaX < 0) { // Swiped left
                        handleNext();
                    } else { // Swiped right
                        handlePrev();
                    }
                }
            };

            return (
                <div>
                    <div className="relative group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        <div className="relative bg-black rounded-xl overflow-hidden">
                            <a href={activeImage.fullsize} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                <img 
                                    src={activeImage.thumb} 
                                    alt={activeImage.alt || `Post image ${currentImageIndex + 1}`} 
                                    className="w-full h-auto object-contain max-h-[80vh] transition-opacity duration-200"
                                    key={currentImageIndex}
                                />
                            </a>
                        </div>
                        
                        {/* Counter */}
                         <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-semibold py-1 px-2.5 rounded-full backdrop-blur-sm">
                            {currentImageIndex + 1}/{embed.images.length}
                        </div>

                        {/* Desktop Navigation Arrows */}
                        {currentImageIndex > 0 &&
                            <button 
                                onClick={handlePrev}
                                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/75 transition-opacity opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        }
                        {currentImageIndex < embed.images.length - 1 &&
                            <button 
                                onClick={handleNext}
                                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/75 transition-opacity opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>
                        }
                    </div>

                    {/* Indicator Dots */}
                    <div className="flex justify-center items-center gap-2 mt-4">
                        {embed.images.map((_, index) => (
                            <button 
                                key={index}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(index); }}
                                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${currentImageIndex === index ? 'bg-primary' : 'bg-outline hover:bg-on-surface-variant'}`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            );
        };
        
        const processVideoEmbed = (embedView: AppBskyEmbedVideo.View) => {
            const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
            const videoCid = embedView.cid;
            if (!authorDid || !videoCid || !agent.service) return null;
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
            const blobVideoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
            return (
                <PostVideoPlayer 
                    hlsSrc={hlsUrl}
                    blobSrc={blobVideoUrl}
                    poster={embedView.thumbnail}
                />
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

  if (isLoading || !moderation.isReady) {
    return (
        <div className="pt-16 px-4">
             <div className="w-full aspect-square bg-surface-2 rounded-xl animate-pulse mb-4"></div>
             <div className="h-6 w-3/4 bg-surface-2 rounded animate-pulse mb-4"></div>
             <div className="h-4 w-1/2 bg-surface-2 rounded animate-pulse"></div>
        </div>
    );
  }

  if (error || !thread || !postAuthor) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl pt-20">{error}</div>;
  }

  const mainPost = thread.post;
  const modDecision = moderatePost(mainPost, moderation);
  
  const PageHeader = () => (
      <header className="flex-shrink-0 bg-surface-1/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <a href="#" onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                <ArrowLeft size={20} />
            </a>
            <h1 className="text-lg font-bold">
                {mainPost.replyCount || 0} {t(mainPost.replyCount === 1 ? 'common.reply' : 'common.replies')}
            </h1>
            <button onClick={() => openMediaActionsModal(mainPost)} className="p-2 -mr-2 rounded-full hover:bg-surface-3">
                <MoreHorizontal size={20} />
            </button>
        </div>
      </header>
  );

  if (modDecision.visibility === 'hide') {
    return (
        <div className="flex flex-col h-screen bg-surface-1">
            <PageHeader />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-surface-2 rounded-xl">
                    <ShieldAlert size={40} className="mx-auto mb-4 opacity-50" />
                    <p className="font-semibold text-on-surface">Post hidden</p>
                    <p className="text-sm text-on-surface-variant mt-1">{modDecision.reason}</p>
                </div>
            </div>
        </div>
    )
  }

  if (modDecision.visibility === 'warn' && !isContentVisible) {
    return (
         <div className="flex flex-col h-screen bg-surface-1">
            <PageHeader />
            <div className="flex-1 flex items-center justify-center p-4">
                <ContentWarning 
                    reason={modDecision.reason!}
                    onShow={() => setIsContentVisible(true)}
                />
            </div>
        </div>
    )
  }

  const currentRecord = mainPost.record as { text: string, facets?: RichText['facets'], createdAt: string };
  const allReplies = (thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];
  
  return (
    <div className="flex flex-col h-screen bg-surface-1">
      <PageHeader />
      
      <main className="flex-1 overflow-y-auto channel-bg">
        {/* Main Post */}
        <div className="bg-transparent px-2 pt-2 mb-2">
            {renderMedia(mainPost)}
            {currentRecord.text && (
                <div className="my-3 text-on-surface whitespace-pre-wrap break-words">
                    <RichTextRenderer record={currentRecord} />
                </div>
            )}
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
                <a href={`#/profile/${postAuthor.handle}`} className="font-bold text-primary hover:underline">@{postAuthor.handle}</a>
                <span>{format(new Date(currentRecord.createdAt), "p")}</span>
            </div>
            <PostStats post={mainPost} />
        </div>
        
        {/* Separator & Replies */}
        {(mainPost.replyCount || 0) > 0 ? (
            <>
                {allReplies.length > 0 && (
                    <div className="flex justify-center my-4">
                        <span className="text-xs text-on-surface-variant bg-surface-3/50 rounded-full px-3 py-1">
                            Discussion started
                        </span>
                    </div>
                )}
                <div className="px-2 pb-4">
                  <Reply reply={thread} isRoot={true} />
                </div>
            </>
        ) : (
            <div className="text-center text-on-surface-variant p-8 bg-surface-2/50 rounded-xl mt-4 mx-4">
                <MessageSquareDashed size={40} className="mx-auto mb-4 opacity-50" />
                <p className="font-semibold text-on-surface">{t('post.noReplies')}</p>
            </div>
        )}
      </main>

      <PostScreenActionBar post={mainPost} />
    </div>
  );
};

export default PostScreen;