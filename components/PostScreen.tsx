
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import Reply from './Reply';
import PostActions from './PostActions';
import PostStats from './PostStats';
import { ArrowLeft, MoreHorizontal, ExternalLink, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PostScreenProps {
  did: string;
  rkey: string;
}

const REPLIES_PER_PAGE = 15;

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent, session } = useAtp();
  const { openComposer } = useUI();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  
  const [visibleReplies, setVisibleReplies] = useState<AppBskyFeedDefs.ThreadViewPost[]>([]);
  const [replyCursor, setReplyCursor] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const allRepliesRef = useRef<AppBskyFeedDefs.ThreadViewPost[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);


  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 100 });
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
          const allReplies = (data.thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];
          allRepliesRef.current = allReplies;
          setVisibleReplies(allReplies.slice(0, REPLIES_PER_PAGE));
          setReplyCursor(REPLIES_PER_PAGE);
          setHasMoreReplies(allReplies.length > REPLIES_PER_PAGE);
        } else {
          throw new Error("Post not found or is not a valid thread root.");
        }
        if (session?.did) {
           const profileRes = await agent.getProfile({ actor: session.did });
           setCurrentUserProfile(profileRes.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch post thread:", err);
        setError(err.message || "Could not load post.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchThread();
  }, [agent, postUri, session?.did]);

  const loadMoreReplies = useCallback(() => {
    const nextReplies = allRepliesRef.current.slice(replyCursor, replyCursor + REPLIES_PER_PAGE);
    setVisibleReplies(prev => [...prev, ...nextReplies]);
    const newCursor = replyCursor + REPLIES_PER_PAGE;
    setReplyCursor(newCursor);
    setHasMoreReplies(allRepliesRef.current.length > newCursor);
  }, [replyCursor]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreReplies) {
          loadMoreReplies();
        }
      },
      { rootMargin: '400px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMoreReplies, loadMoreReplies]);


  const renderMedia = (post: AppBskyFeedDefs.PostView) => {
        if (!post.embed) return null;

        const processImageEmbed = (embed: AppBskyEmbedImages.View) => {
            if (embed.images.length === 0) return null;
            const gridCols = embed.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1';
            const gridRows = embed.images.length > 2 ? 'grid-rows-2' : 'grid-rows-1';
            return (
                <div className={`grid ${gridCols} ${gridRows} gap-1.5 rounded-xl overflow-hidden`}>
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

  if (error || !thread) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl pt-20">{error || "Post not found."}</div>;
  }

  const mainPost = thread.post;
  const record = mainPost.record as { text: string, facets?: RichText['facets'], createdAt: string };
  const author = mainPost.author;

  return (
    <div>
      <header className="fixed top-0 left-0 right-0 md:left-20 bg-surface-1/80 backdrop-blur-md z-40 border-b border-surface-3">
        <div className="container mx-auto max-w-3xl px-4 h-16 flex items-center justify-between gap-4">
            <a href="#" onClick={() => window.history.back()} className="flex items-center gap-2 text-on-surface p-2 -ml-2 rounded-full hover:bg-surface-3">
                <ArrowLeft size={20} />
            </a>
            <a href={`#/profile/${author.handle}`} className="flex items-center gap-2 truncate">
                <img src={author.avatar} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" />
                <span className="font-bold text-sm truncate">{author.displayName || author.handle}</span>
            </a>
            <div className="flex items-center gap-2">
                 <button className="p-2 rounded-full hover:bg-surface-3"><MoreHorizontal size={20}/></button>
            </div>
        </div>
      </header>
      
      <div className="pt-16">
        <div className="p-4">
             {renderMedia(mainPost)}
             {record.text && <p className="my-3 text-on-surface whitespace-pre-wrap">{record.text}</p>}
             <p className="text-sm text-on-surface-variant my-3">{format(new Date(record.createdAt), "h:mm a · MMM d, yyyy")}</p>
             <div className="border-t border-surface-3 pt-3">
                <PostStats post={mainPost} />
             </div>
        </div>
        
        <div className="px-4 py-2 border-y border-surface-3">
            <PostActions post={mainPost} />
        </div>
        
        {session && currentUserProfile && (
             <div className="flex items-center gap-3 p-4 border-b border-surface-3">
                <img src={currentUserProfile.avatar} alt="My avatar" className="w-8 h-8 rounded-full bg-surface-3"/>
                <button onClick={() => openComposer({ uri: mainPost.uri, cid: mainPost.cid })} className="text-on-surface-variant text-left flex-1">
                    Write your reply...
                </button>
             </div>
        )}

        {visibleReplies.length > 0 && (
            <div className="mt-4 px-4 space-y-4">
            {visibleReplies.map(reply => (
                <Reply key={reply.post.cid} reply={reply} />
            ))}
            </div>
        )}

        <div ref={loaderRef} className="h-10">
          {hasMoreReplies && (
            <div className="w-8 h-8 mx-auto my-4 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostScreen;