
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import Reply from './Reply';
import PostScreenActionBar from './PostScreenActionBar';
import { useToast } from '../ui/use-toast';
import { ArrowLeft, ExternalLink, Share2, BadgeCheck } from 'lucide-react';
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
  const [currentUserProfile, setCurrentUserProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [postAuthor, setPostAuthor] = useState<AppBskyActorDefs.ProfileViewBasic | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
 
  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  useEffect(() => {
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

  useEffect(() => {
    if (session?.did) {
      agent.getProfile({ actor: session.did }).then(({ data }) => {
        setCurrentUserProfile(data);
      });
    } else {
      setCurrentUserProfile(null);
    }
  }, [agent, session?.did]);

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

            // Single image view
            if (embed.images.length === 1) {
                const image = embed.images[0];
                return (
                    <a href={image.fullsize} target="_blank" rel="noopener noreferrer" className="block relative group bg-surface-3 rounded-xl overflow-hidden">
                        <img src={image.thumb} alt={image.alt || 'Post image'} className="w-full h-auto object-contain max-h-[80vh]" loading="lazy" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white w-6 h-6" />
                        </div>
                    </a>
                );
            }
            
            // Gallery for multiple images
            const activeImage = embed.images[currentImageIndex];

            return (
                <div className="space-y-2">
                    {/* Main Image */}
                    <div className="relative">
                        <a href={activeImage.fullsize} target="_blank" rel="noopener noreferrer" className="block relative group bg-surface-3 rounded-xl overflow-hidden aspect-[4/3]">
                            <img src={activeImage.thumb} alt={activeImage.alt || `Post image ${currentImageIndex + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink className="text-white w-6 h-6" />
                            </div>
                        </a>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold py-1 px-2 rounded-full backdrop-blur-sm">
                            {currentImageIndex + 1} / {embed.images.length}
                        </div>
                    </div>
                    
                    {/* Thumbnails */}
                    <div className="grid grid-cols-4 gap-2">
                        {embed.images.map((image, index) => (
                            <button 
                                key={index}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(index); }}
                                className={`block relative bg-surface-3 rounded-md overflow-hidden aspect-square border-2 transition-all ${currentImageIndex === index ? 'border-primary' : 'border-transparent'}`}
                                aria-label={`View image ${index + 1}`}
                            >
                                <img src={image.thumb} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                {currentImageIndex !== index && <div className="absolute inset-0 bg-black/50 hover:bg-black/30 transition-colors"></div>}
                            </button>
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
            if (AppBskyEmbedImages.isView(media)) return processImageEmbed(media);
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
        
        <div className="hidden md:block px-4">
            {session && currentUserProfile && (
                <div className="py-3 flex items-center gap-3">
                    <img src={currentUserProfile.avatar} alt="My avatar" className="w-10 h-10 rounded-full bg-surface-3" loading="lazy" />
                    <button
                        onClick={() => openComposer({ replyTo: { uri: mainPost.uri, cid: mainPost.cid } })}
                        className="flex-1 bg-surface-2 text-on-surface-variant text-left px-4 py-2.5 rounded-full hover:bg-surface-3 transition-colors"
                    >
                        Write your reply...
                    </button>
                </div>
            )}
        </div>
        
        {allReplies.length > 0 && (
            <div className="mt-2">
              <Reply reply={thread} isRoot={true} />
            </div>
        )}
      </div>

      <PostScreenActionBar post={mainPost} />
    </div>
  );
};

export default PostScreen;
