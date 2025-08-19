
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs, AtUri, RichText } from '@atproto/api';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck, ArrowLeft, Loader2 } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import PostBubble from '../post/PostBubble';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { openEditProfileModal } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);

    const loaderRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    
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
        const fetchProfileAndFeed = async () => {
            setIsLoading(true);
            try {
                const profileRes = await agent.getProfile({ actor });
                setProfile(profileRes.data);

                if (profileRes.data.viewer?.blocking || profileRes.data.viewer?.blockedBy) {
                    setHasMore(false);
                    return;
                }

                const feedRes = await agent.getAuthorFeed({ actor, limit: 30 });
                setFeed(feedRes.data.feed);
                setCursor(feedRes.data.cursor);
                setHasMore(!!feedRes.data.cursor && feedRes.data.feed.length > 0);
            } catch (err: any) {
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
            setFeed(prevFeed => [...prevFeed, ...response.data.feed]);
            setCursor(response.data.cursor);
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
        const mainEl = mainContentRef.current;
        if (!mainEl) return;
        const handleScroll = () => {
            if (mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight < 1000) {
                loadMorePosts();
            }
        };
        mainEl.addEventListener('scroll', handleScroll);
        return () => mainEl.removeEventListener('scroll', handleScroll);
    }, [loadMorePosts]);

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
            {profile.viewer?.following ? 'Following' : 'Follow'}
        </button>
    );

    return (
        <div className="h-full w-full flex flex-col bg-surface-1 channel-bg">
            <header className="sticky top-0 bg-surface-2/80 backdrop-blur-sm z-10 flex-shrink-0">
                <div className="flex items-center gap-4 h-16 px-4">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-lg truncate">{profile.displayName || profile.handle}</h1>
                        <p className="text-sm text-on-surface-variant">{profile.followersCount} followers</p>
                    </div>
                    {session && (isMe ? (
                         <button onClick={openEditProfileModal} className="font-bold py-1 px-4 rounded-full transition duration-200 bg-surface-3 text-on-surface hover:bg-surface-3/80 text-sm">
                            Edit
                        </button>
                    ) : (
                        <FollowButton />
                    ))}
                </div>
            </header>
            
            <main ref={mainContentRef} className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {feed.map(({ post }) => (
                        <PostBubble key={post.cid} post={post} />
                    ))}
                </div>
                {isLoadingMore && (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                 {!hasMore && feed.length > 0 && (
                    <div className="text-center text-on-surface-variant py-8 text-sm">You've reached the end.</div>
                )}
            </main>
        </div>
    );
};

export default ProfileScreen;
