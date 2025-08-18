import React, { useState, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import Reply from './Reply';
import PostScreenActionBar from './PostScreenActionBar';
import { useToast } from '../ui/use-toast';
import { ArrowLeft, ExternalLink, Share2, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';

interface PostScreenProps {
  did: string;
  rkey: string;
}

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent, session } = useAtp();
  const { openComposer } = useUI();
  const { toast } = useToast();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [postAuthor, setPostAuthor] = useState<AppBskyActorDefs.ProfileViewBasic | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartXRef = useRef(0);
 
  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  useEffect(() => {
    setCurrentImageIndex(0); // Reset for new posts
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 100, parentHeight: 5 });
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
          setPostAuthor(data.thread.post.author);
        } else {
          throw new Error("Post not found or is not a valid thread root.");
        }
      } catch (err: any) {
        console.error("Failed to fetch post thread:", err);
        setError(err.message || "Could not load post.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchThread();
  }, [agent, postUri]);

  const handleFollow = async () => {
      if (!postAuthor || isActionLoading || !session) return;
      setIsActionLoading(true);
      const oldAuthor = postAuthor;
      setPostAuthor(prev => prev ? { ...prev, viewer: { ...(prev.viewer || {}), following: 'temp-uri' } } : null);
      try {
          const { uri } = await agent.follow(postAuthor.did);
          setPostAuthor(prev => prev ? { ...prev, viewer: { ...(prev.viewer || {}), following: uri } } : null);
      } catch (e) {
          console.error("Failed to follow:", e);
          toast({ title: "Error", description: "Could not follow user.", variant: "destructive" });
          setPostAuthor(oldAuthor);
      } finally {
          setIsActionLoading(false);
      }
  };

  const handleUnfollow = async () => {
      if (!postAuthor || !postAuthor.viewer?.following || isActionLoading) return;
      setIsActionLoading(true);
      const oldAuthor = postAuthor;
      setPostAuthor(prev => prev ? { ...prev, viewer: { ...(prev.viewer || {}), following: undefined } } : null);
      try {
          await agent.deleteFollow(postAuthor.viewer.following);
      } catch (e) {
          console.error("Failed to unfollow:", e);
          toast({ title: "Error", description: "Could not unfollow user.", variant: "destructive" });
          setPostAuthor(oldAuthor);
      } finally {
          setIsActionLoading(false);
      }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/#/post/${did}/${rkey}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Post URL has been copied to your clipboard." });
  };


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
            const videoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
            return (
                <video src={videoUrl} poster={embedView.thumbnail} controls muted autoPlay loop className="w-full h-auto bg-black rounded-lg" />
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

  if (isLoading) {
    return (
        <div className="pt-16 px-4">
             <div className="w-full aspect-square bg-surface-2 rounded-xl animate-pulse mb-4"></div>
             <div className="h-6 w-3/4 bg-surface-2 rounded animate-pulse mb-4"></div>
             <div className="h-4 w-1/2 bg-surface-2 rounded animate-pulse"></div>
        </div>
    );
  }

  if (error || !thread || !postAuthor) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl pt-20">{error || "Post not found."}</div>;
  }

  const mainPost = thread.post;
  const record = mainPost.record as { text: string, facets?: RichText['facets'], createdAt: string };
  const allReplies = (thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];
  const isMe = session?.did === postAuthor.did;

  const FollowButton = () => {
    if (!session || isMe) return null;
    return (
        <button
            onClick={postAuthor.viewer?.following ? handleUnfollow : handleFollow}
            disabled={isActionLoading}
            className={`font-semibold text-sm py-1.5 px-4 rounded-full transition-colors duration-200
                ${postAuthor.viewer?.following 
                    ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80' 
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                }
                disabled:opacity-50`}
        >
            {postAuthor.viewer?.following ? 'Following' : 'Follow'}
        </button>
    );
  };

  return (
    <div>
      <header className="bg-surface-1 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <a href="#" onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                    <ArrowLeft size={20} />
                </a>
                <a href={`#/profile/${postAuthor.handle}`} className="flex items-center gap-3 truncate">
                    <img src={postAuthor.avatar} alt={postAuthor.displayName} className="w-10 h-10 rounded-full bg-surface-3" loading="lazy" />
                    <div className="font-bold truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{postAuthor.displayName}</span>
                        {postAuthor.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                            <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                        )}
                    </div>
                </a>
            </div>
            <div className="flex items-center gap-2">
                <FollowButton />
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-surface-3">
                    <Share2 size={20} />
                </button>
            </div>
        </div>
      </header>
      
      <div>
        <div className="p-4">
             {renderMedia(mainPost)}
             {record.text && (
                <div className="my-3 text-on-surface whitespace-pre-wrap break-words">
                    <RichTextRenderer record={record} />
                </div>
             )}
             <p className="text-sm text-on-surface-variant my-3">{format(new Date(record.createdAt), "h:mm a · MMM d, yyyy")}</p>
        </div>
        
        <PostScreenActionBar post={mainPost} />
        
         <div className="border-t border-surface-3 md:mt-4">
          {(mainPost.replyCount || 0) > 0 && (
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-lg font-bold">
                {mainPost.replyCount} {mainPost.replyCount === 1 ? 'Comment' : 'Comments'}
              </h2>
            </div>
          )}

          {allReplies.length > 0 && (
            <div>
              <Reply reply={thread} isRoot={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostScreen;