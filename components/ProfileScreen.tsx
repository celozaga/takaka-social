import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyActorDefs, AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent } = useAtp();
    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loaderRef = useRef<HTMLDivElement>(null);
    
    const filterMediaPosts = (posts: AppBskyFeedDefs.FeedViewPost[]): AppBskyFeedDefs.FeedViewPost[] => {
        return posts.filter(item => {
            const embed = item.post.embed;
            if (!embed) {
                return false;
            }

            if (AppBskyEmbedImages.isView(embed)) {
                return true;
            }

            if (embed.$type === 'app.bsky.embed.video#view') {
                return true;
            }

            if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                const media = embed.media;
                if (AppBskyEmbedImages.isView(media)) {
                    return true;
                }
                if (media?.$type === 'app.bsky.embed.video#view') {
                    return true;
                }
            }
            return false;
        });
    };

    useEffect(() => {
        const fetchProfileAndFeed = async () => {
            setIsLoading(true);
            setError(null);
            setHasMore(true);
            try {
                const profileRes = await agent.getProfile({ actor });
                setProfile(profileRes.data);

                const feedRes = await agent.getAuthorFeed({ actor, limit: 30 });
                const mediaPosts = filterMediaPosts(feedRes.data.feed);
                setFeed(mediaPosts);
                
                if (feedRes.data.cursor && feedRes.data.feed.length > 0) {
                    setCursor(feedRes.data.cursor);
                } else {
                    setHasMore(false);
                }

            } catch (err: any) {
                console.error("Failed to fetch profile data:", err);
                setError(err.message || "Could not load profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileAndFeed();
    }, [agent, actor]);

    const loadMorePosts = useCallback(async () => {
        if (isLoadingMore || !cursor || !hasMore) return;
        setIsLoadingMore(true);
        try {
          const response = await agent.getAuthorFeed({ actor, cursor, limit: 30 });
          if (response.data.feed.length > 0) {
            const newMediaPosts = filterMediaPosts(response.data.feed);
            setFeed(prevFeed => [...prevFeed, ...newMediaPosts]);
            if (response.data.cursor) {
              setCursor(response.data.cursor);
            } else {
              setHasMore(false);
            }
          } else {
            setHasMore(false);
          }
        } catch (err) {
          console.error('Failed to fetch more posts:', err);
        } finally {
          setIsLoadingMore(false);
        }
    }, [agent, actor, cursor, hasMore, isLoadingMore]);

    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
              loadMorePosts();
            }
          },
          { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
          if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, isLoading, isLoadingMore, loadMorePosts]);

    if (isLoading) {
        return (
             <div className="columns-2 gap-4 space-y-4">
                {[...Array(6)].map((_, i) => <div key={i} className="break-inside-avoid"><PostCardSkeleton /></div>)}
            </div>
        );
    }

    if (error || !profile) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error || "Profile not found."}</div>;
    }

    return (
        <div>
            {/* Banner */}
            <div className="h-48 bg-surface-3 rounded-t-lg -mx-4 -mt-4 relative">
                {profile.banner && <img src={profile.banner} alt="Banner" className="w-full h-full object-cover rounded-t-lg"/>}
                <div className="absolute -bottom-16 left-8">
                    <img src={profile.avatar} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-surface-1 bg-surface-3"/>
                </div>
            </div>
            
            <div className="pt-20 px-4 pb-4">
                <h2 className="text-3xl font-bold">{profile.displayName}</h2>
                <p className="text-on-surface-variant">@{profile.handle}</p>
                <div className="flex items-center gap-4 text-on-surface-variant text-sm mt-2">
                    <span><strong className="text-on-surface">{profile.followersCount}</strong> Followers</span>
                    <span><strong className="text-on-surface">{profile.followsCount}</strong> Following</span>
                    <span><strong className="text-on-surface">{profile.postsCount}</strong> Posts</span>
                </div>
                {profile.description && <p className="mt-4 text-on-surface">{profile.description}</p>}
            </div>

            <div className="my-4 border-b border-surface-3"></div>

            {feed.length === 0 && !isLoadingMore && (
                <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">This user has not posted any media yet.</div>
            )}
            
            <div className="columns-2 gap-4 space-y-4">
                {feed.map(({ post }) => (
                    <div key={post.cid} className="break-inside-avoid">
                        <PostCard post={post} />
                    </div>
                ))}
            </div>

            <div ref={loaderRef} className="h-10">
                {isLoadingMore && (
                  <div className="columns-2 gap-4 space-y-4 mt-4">
                    <div className="break-inside-avoid"><PostCardSkeleton /></div>
                    <div className="break-inside-avoid"><PostCardSkeleton /></div>
                  </div>
                )}
            </div>

            {!hasMore && feed.length > 0 && (
                <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
            )}
        </div>
    );
};

export default ProfileScreen;