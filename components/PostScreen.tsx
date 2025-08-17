import React, { useState, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import Composer from './Composer';
import Reply from './Reply';
import PostStats from './PostStats';
import { ArrowLeft } from 'lucide-react';

interface PostScreenProps {
  did: string;
  rkey: string;
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
        <ArrowLeft size={18} />
        <span>Back</span>
      </a>

      <div className="grid grid-cols-1">
        <PostCard post={mainPost} isClickable={false} showAllMedia={true} />
      </div>

      <div className="py-3 border-b border-surface-3">
         <PostStats post={mainPost} />
      </div>

      {session && (
        <div className="my-4">
          <Composer
            onPostSuccess={() => setRefreshKey(k => k + 1)}
            replyTo={{ uri: mainPost.uri, cid: mainPost.cid }}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-4">
          {replies.map(reply => (
            <Reply key={reply.post.cid} reply={reply} />
          ))}
        </div>
      )}

      {replies.length === 0 && !session && (
         <div className="text-center text-on-surface-variant p-8 mt-4 bg-surface-2 rounded-xl">No replies yet.</div>
      )}
    </div>
  );
};

export default PostScreen;
