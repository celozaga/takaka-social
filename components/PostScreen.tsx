
import React, { useState, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import Reply from './Reply';
import PostActions from './PostActions';
import { ArrowLeft, MessageSquare, Repeat, Heart, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface PostScreenProps {
  did: string;
  rkey: string;
}

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent, session } = useAtp();
  const { openComposer } = useUI();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
 
  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 100, parentHeight: 5 });
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
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
  const allReplies = (thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];

  return (
    <div>
      <header className="sticky top-16 md:top-0 bg-surface-1/95 backdrop-blur-md z-40 border-b border-surface-3 -mt-20 pt-20">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <a href="#" onClick={() => window.history.back()} className="flex items-center gap-2 text-on-surface p-2 -ml-2 rounded-full hover:bg-surface-3">
                <ArrowLeft size={20} />
            </a>
            <a href={`#/profile/${author.handle}`} className="flex items-center gap-3 truncate">
                <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full bg-surface-3" />
                <div>
                  <p className="font-bold truncate leading-tight">{author.displayName}</p>
                  <p className="text-on-surface-variant text-sm leading-tight">@{author.handle}</p>
                </div>
            </a>
        </div>
      </header>
      
      <div>
        <div className="p-4 border-b border-surface-3">
             {record.text && <p className="my-3 text-on-surface whitespace-pre-wrap text-lg">{record.text}</p>}
             {renderMedia(mainPost)}
             <p className="text-sm text-on-surface-variant my-3">{format(new Date(record.createdAt), "h:mm a · MMM d, yyyy")}</p>
        </div>
        
        <div className="px-4 py-3 border-b border-surface-3 flex items-center gap-6">
            <div className="flex items-center gap-2 text-on-surface-variant">
                <MessageSquare size={18} />
                <strong className="text-on-surface">{mainPost.replyCount || 0}</strong>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
                <Repeat size={18} />
                <strong className="text-on-surface">{mainPost.repostCount || 0}</strong>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
                <Heart size={18} />
                <strong className="text-on-surface">{mainPost.likeCount || 0}</strong>
            </div>
        </div>
        
        {session && currentUserProfile && (
            <div className="px-4 py-3 border-b border-surface-3 flex items-center gap-3">
                <img src={currentUserProfile.avatar} alt="My avatar" className="w-10 h-10 rounded-full bg-surface-3" />
                <button
                onClick={() => openComposer({ uri: mainPost.uri, cid: mainPost.cid })}
                className="flex-1 bg-surface-2 text-on-surface-variant text-left px-4 py-2.5 rounded-full hover:bg-surface-3 transition-colors"
                >
                Write your reply...
                </button>
            </div>
        )}
        
        {allReplies.length > 0 && (
            <div>
              <Reply reply={thread} isRoot={true} />
            </div>
        )}
      </div>
    </div>
  );
};

export default PostScreen;
