
import React, { useState, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText } from '@atproto/api';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import Reply from './Reply';
import PostActions from './PostActions';
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface PostScreenProps {
  did: string;
  rkey: string;
}

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent, session } = useAtp();
  const { openComposer } = useUI();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [authorProfile, setAuthorProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 10 });
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
          // Fetch the full author profile to get viewer state
          const profileRes = await agent.getProfile({ actor: data.thread.post.author.did });
          setAuthorProfile(profileRes.data);
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
    if (!authorProfile || isActionLoading) return;
    setIsActionLoading(true);
    const oldViewerState = authorProfile.viewer;
    setAuthorProfile(p => p ? { ...p, viewer: { ...p.viewer, following: 'temp-uri' }} : null);
    try {
        const { uri } = await agent.follow(authorProfile.did);
        setAuthorProfile(p => p ? { ...p, viewer: { ...p.viewer, following: uri }} : null);
    } catch(e) {
        toast({ title: 'Error', description: 'Could not follow user.', variant: 'destructive' });
        setAuthorProfile(p => p ? { ...p, viewer: oldViewerState } : null);
    } finally {
        setIsActionLoading(false);
    }
  };
  
  const handleUnfollow = async () => {
    if (!authorProfile || !authorProfile.viewer?.following || isActionLoading) return;
    setIsActionLoading(true);
    const oldViewerState = authorProfile.viewer;
    setAuthorProfile(p => p ? { ...p, viewer: { ...p.viewer, following: undefined }} : null);
    try {
        await agent.deleteFollow(authorProfile.viewer.following);
    } catch(e) {
        toast({ title: 'Error', description: 'Could not unfollow user.', variant: 'destructive' });
        setAuthorProfile(p => p ? { ...p, viewer: oldViewerState } : null);
    } finally {
        setIsActionLoading(false);
    }
  };


  if (isLoading) {
    return <PostCardSkeleton />;
  }

  if (error || !thread || !authorProfile) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error || "Post not found."}</div>;
  }

  const mainPost = thread.post;
  const record = mainPost.record as { text: string, facets?: RichText['facets'] };
  const replies = (thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];
  const author = authorProfile;

  return (
    <div className="pb-24 md:pb-0">
      {/* --- Header --- */}
      <header className="fixed top-0 left-0 right-0 md:left-20 bg-surface-1/80 backdrop-blur-md z-40 border-b border-surface-3">
        <div className="container mx-auto max-w-3xl px-4 h-16 flex items-center justify-between gap-4">
            <a href="#" onClick={() => window.history.back()} className="flex items-center gap-2 text-on-surface p-2 -ml-2 rounded-full hover:bg-surface-3">
                <ArrowLeft size={20} />
            </a>
            <a href={`#/profile/${author.handle}`} className="flex items-center gap-2 truncate">
                <img src={author.avatar} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" />
                <span className="font-bold text-sm truncate">{author.displayName || author.handle}</span>
            </a>
            {session && session.did !== author.did && (
                <button 
                    onClick={author.viewer?.following ? handleUnfollow : handleFollow}
                    disabled={isActionLoading}
                    className={`font-bold py-1.5 px-4 rounded-full text-sm transition ${author.viewer?.following ? 'bg-surface-3 text-on-surface' : 'bg-primary text-on-primary'}`}
                >
                    {author.viewer?.following ? 'Following' : 'Follow'}
                </button>
            )}
             <button className="p-2 rounded-full hover:bg-surface-3"><MoreHorizontal size={20}/></button>
        </div>
      </header>
      
      {/* --- Post Content (needs pt-16 offset) --- */}
      <div className="pt-16">
        <div className="px-4">
             <PostCard post={mainPost} isClickable={false} showAllMedia={true} />
             {record.text && <p className="mt-3 text-on-surface whitespace-pre-wrap">{record.text}</p>}
        </div>

        <div className="px-4 mt-4 pb-4 border-b border-surface-3">
            <p className="text-sm font-semibold text-on-surface">{mainPost.replyCount || 0} Comments</p>
        </div>

        {/* --- Replies --- */}
        {replies.length > 0 && (
            <div className="mt-4 px-4 space-y-4">
            {replies.map(reply => (
                <Reply key={reply.post.cid} reply={reply} />
            ))}
            </div>
        )}
      </div>

      {/* --- Bottom Action Bar (Mobile) --- */}
      {session && (
          <div className="md:hidden fixed bottom-20 left-0 right-0 h-16 bg-surface-2/95 backdrop-blur-sm border-t border-surface-3 px-4 flex items-center gap-2 z-30">
            <button 
                onClick={() => openComposer({ uri: mainPost.uri, cid: mainPost.cid })}
                className="flex-grow bg-surface-3 h-10 rounded-full text-left px-4 text-sm text-on-surface-variant"
            >
                Say something...
            </button>
            <div className="-mr-2">
                <PostActions post={mainPost} />
            </div>
          </div>
      )}
    </div>
  );
};

export default PostScreen;
