import React, { useState, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs, AtUri } from '@atproto/api';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import Composer from './Composer';
import { ArrowLeft } from 'lucide-react';

interface PostScreenProps {
  did: string;
  rkey: string;
}

const ReplyCard: React.FC<{ post: AppBskyFeedDefs.PostView }> = ({ post }) => {
    const author = post.author;
    const record = post.record as { text: string; createdAt: string };
    return (
        <div className="flex gap-3 py-4 border-b border-surface-3 last:border-b-0">
            <a href={`#/profile/${author.handle}`}>
                <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full bg-surface-3"/>
            </a>
            <div className="flex-1">
                <a href={`#/profile/${author.handle}`} className="font-bold hover:underline">{author.displayName} <span className="text-on-surface-variant font-normal">@{author.handle}</span></a>
                <p className="text-on-surface whitespace-pre-wrap mt-1">{record.text}</p>
                 {/* Simplified actions for replies */}
            </div>
        </div>
    )
}

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent, session } = useAtp();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 10 });
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
  }, [agent, postUri, refreshKey]);

  if (isLoading) {
    return <PostCardSkeleton />;
  }

  if (error || !thread) {
    return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error || "Post not found."}</div>;
  }
  
  const mainPost = thread.post;
  const replies = (thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];


  return (
    <div>
      <a href="#" onClick={() => window.history.back()} className="flex items-center gap-2 text-primary mb-4 hover:underline">
          <ArrowLeft size={18}/>
          <span>Back</span>
      </a>

      <div className="grid grid-cols-1">
        <PostCard post={mainPost} isClickable={false} showAllMedia={true} />
      </div>

      {session && (
        <div className="my-4">
          <Composer 
              onPostSuccess={() => setRefreshKey(k => k + 1)}
              replyTo={{ uri: mainPost.uri, cid: mainPost.cid }}
          />
        </div>
      )}

      <div className="my-4 border-b border-surface-3"></div>

      <h3 className="text-xl font-bold mb-2">Replies</h3>
      {replies.length > 0 ? (
        <div className="bg-surface-2 rounded-xl">
            {replies.map(reply => (
                <ReplyCard key={reply.post.cid} post={reply.post} />
            ))}
        </div>
      ) : (
        <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No replies yet.</div>
      )}
    </div>
  );
};

export default PostScreen;
