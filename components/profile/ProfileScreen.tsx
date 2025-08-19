import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';
import { UserPlus, UserCheck, BadgeCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import PostBubble from '../post/PostBubble';

const ProfileFeed: React.FC<{ actor: string, isBlocked: boolean }> = ({ actor, isBlocked }) => {
    const { agent } = useAtp();
    const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);

    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchFeed = useCallback(async (currentCursor?: string) => {
        if (isBlocked) {
            setHasMore(false);
            setInitialLoad(false);
            return;
        }
        if (!currentCursor) setInitialLoad(true);
        else setIsLoadingMore(true);

        try {
            const res = await agent.getAuthorFeed({ actor, limit: 30, cursor: currentCursor });
            setFeed(prev => currentCursor ? [...prev, ...res.data.feed] : res.data.feed);
            setCursor(res.data.cursor);
            setHasMore(!!res.data.cursor && res.data.feed.length > 0);
        } catch (err) {
            console.error("Failed to load profile feed:", err);
            setHasMore(false); // Stop trying on error
        } finally {
            setIsLoadingMore(false);
            setInitialLoad(false);
        }
    }, [agent, actor, isBlocked]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !initialLoad && !isLoadingMore) {
                    fetchFeed(cursor);
                }
            },
            { rootMargin: '500px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [hasMore, initialLoad, isLoadingMore, cursor, fetchFeed]);

    if (initialLoad) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isBlocked) {
        return (
            <div className="p-4 text-center text-on-surface-variant bg-surface-2 rounded-lg">
                This user's posts are not available.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {feed.map(({ post }) => (
                <PostBubble key={post.cid} post={post} />
            ))}
            <div ref={loaderRef} className="h-10">
                {isLoadingMore && (
                    <div className="flex justify-center items-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}
            </div>
             {!hasMore && feed.length > 0 && (
                <div className="text-center text-on-surface-variant py-8 text-sm">You've reached the end.</div>
            )}
            {!hasMore && feed.length === 0 && (
                 <div className="text-center text-on-surface-variant py-8 text-sm">This user hasn't posted anything yet.</div>
            )}
        </div>
    );
};


const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { openEditProfileModal } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const isMe = session?.did === profile?.did;

    const handleFollow = async () => {
        if (!profile || isActionLoading || !session) return;
        setIsActionLoading(true);
        const oldViewerState = profile.viewer;
        setProfile(p => p ? { ...p, viewer: { ...p.viewer, following: 'temp-uri' }, followersCount: p.followersCount + 1 } : null);
        try {
            const { uri } = await agent.follow(profile.did);
            setProfile(p => p ? { ...p, viewer: { ...p.viewer, following: uri } } : null);
        } catch (e) {
            console.error("Failed to follow:", e);
            toast({ title: "Error", description: "Could not follow user.", variant: "destructive" });
            setProfile(p => p ? { ...p, viewer: oldViewerState, followersCount: p.followersCount - 1 } : null);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUnfollow = async () => {
        if (!profile || !profile.viewer?.following || isActionLoading) return;
        setIsActionLoading(true);
        const oldViewerState = profile.viewer;
        const oldFollowersCount = profile.followersCount;
        setProfile(p => p ? { ...p, viewer: { ...p.viewer, following: undefined }, followersCount: p.followersCount - 1 } : null);
        try {
            await agent.deleteFollow(profile.viewer.following);
        } catch (e) {
            console.error("Failed to unfollow:", e);
            toast({ title: "Error", description: "Could not unfollow user.", variant: "destructive" });
            setProfile(p => p ? { ...p, viewer: oldViewerState, followersCount: oldFollowersCount } : null);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const profileRes = await agent.getProfile({ actor });
                setProfile(profileRes.data);
                localStorage.setItem(`channel-last-viewed:${profileRes.data.did}`, new Date().toISOString());
            } catch (err: any) {
                setError(err.message || "Could not load profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [agent, actor]);
    

    if (isLoading) {
        return <div className="w-full h-full flex items-center justify-center bg-surface-1"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error || !profile) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error || "Profile not found."}</div>;
    }

    const FollowButton = () => (
        <button
            onClick={profile.viewer?.following ? handleUnfollow : handleFollow}
            disabled={isActionLoading}
            className={`font-bold py-2 px-6 rounded-full transition duration-200 flex items-center gap-2
                ${profile.viewer?.following 
                    ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80' 
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                } disabled:opacity-50`}
        >
            {profile.viewer?.following ? <UserCheck size={18} /> : <UserPlus size={18} />}
            <span>{profile.viewer?.following ? 'Following' : 'Follow'}</span>
        </button>
    );

    const isBlocked = !!(profile.viewer?.blocking || profile.viewer?.blockedBy);

    return (
        <div className="h-full w-full flex flex-col bg-surface-1 channel-bg">
            <header className="sticky top-0 bg-surface-2/80 backdrop-blur-sm z-10 flex-shrink-0 border-b border-outline">
                <div className="flex items-center gap-4 h-16 px-4">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3 md:hidden">
                        <ArrowLeft size={20} />
                    </button>
                    <a href={`#/profile/${profile.handle}`} className="flex-1 min-w-0 flex items-center gap-3">
                        <img src={profile.avatar} alt={profile.displayName} className="w-10 h-10 rounded-full bg-surface-3" />
                        <div className="truncate">
                           <h1 className="font-bold text-lg truncate flex items-center gap-1.5">
                                <span>{profile.displayName || profile.handle}</span>
                                {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                    <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                                )}
                            </h1>
                            <p className="text-sm text-on-surface-variant">{profile.followersCount} followers</p>
                        </div>
                    </a>
                    <div className="flex-shrink-0">
                      {session && (isMe ? (
                          <button onClick={openEditProfileModal} className="font-bold py-1 px-4 rounded-full transition duration-200 bg-surface-3 text-on-surface hover:bg-surface-3/80 text-sm">
                              Edit
                          </button>
                      ) : (
                          <FollowButton />
                      ))}
                    </div>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4">
                <ProfileFeed actor={actor} isBlocked={isBlocked} />
            </main>
        </div>
    );
};

export default ProfileScreen;
