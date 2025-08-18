
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AtUri, RichText, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck, ArrowLeft, Send, Image as ImageIcon, Video } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';

type FeedFilter = 'all' | 'photos' | 'videos';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { setCustomFeedHeaderVisible, openEditProfileModal, openComposer } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [viewerState, setViewerState] = useState<AppBskyActorDefs.ViewerState | undefined>(undefined);
    const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);
    const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

    const loaderRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const isMe = session?.did === profile?.did;

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);
    
    // Handlers for social actions
    const handleFollow = async () => {
        if (!profile || isActionLoading || !session) return;
        setIsActionLoading(true);
        const oldViewerState = viewerState;
        setViewerState(prev => prev ? { ...prev, following: 'temp-uri' } : undefined);
        setProfile(p => p ? { ...p, followersCount: p.followersCount + 1 } : null);
        try {
            const { uri } = await agent.follow(profile.did);
            setViewerState(prev => prev ? { ...prev, following: uri } : undefined);
        } catch (e) {
            console.error("Failed to follow:", e);
            toast({ title: "Error", description: "Could not follow user.", variant: "destructive" });
            setViewerState(oldViewerState);
            setProfile(p => p ? { ...p, followersCount: p.followersCount - 1 } : null);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUnfollow = async () => {
        if (!profile || !viewerState?.following || isActionLoading) return;
        setIsActionLoading(true);
        const oldViewerState = viewerState;
        const oldFollowersCount = profile.followersCount;
        setViewerState(prev => prev ? { ...prev, following: undefined } : undefined);
        setProfile(p => p ? { ...p, followersCount: p.followersCount - 1 } : null);
        try {
            await agent.deleteFollow(viewerState.following);
        } catch (e) {
            console.error("Failed to unfollow:", e);
            toast({ title: "Error", description: "Could not unfollow user.", variant: "destructive" });
            setViewerState(oldViewerState);
            setProfile(p => p ? { ...p, followersCount: oldFollowersCount } : null);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleMute = async () => {
        if (!profile || isActionLoading) return;
        setIsActionLoading(true);
        setIsMenuOpen(false);
        const oldViewerState = viewerState;
        setViewerState(prev => prev ? { ...prev, muted: true } : undefined);
        try {
            await agent.mute(profile.did);
            toast({ title: "User Muted", description: `You will no longer see posts from @${profile.handle}`});
        } catch (e) {
            console.error("Failed to mute:", e);
            toast({ title: "Error", description: "Could not mute user.", variant: "destructive" });
            setViewerState(oldViewerState);
        } finally {
            setIsActionLoading(false);
        }
    }
    
    const handleUnmute = async () => {
        if (!profile || isActionLoading) return;
        setIsActionLoading(true);
        setIsMenuOpen(false);
        const oldViewerState = viewerState;
        setViewerState(prev => prev ? { ...prev, muted: false } : undefined);
        try {
            await agent.unmute(profile.did);
            toast({ title: "User Unmuted" });
        } catch (e) {
            console.error("Failed to unmute:", e);
            toast({ title: "Error", description: "Could not unmute user.", variant: "destructive" });
            setViewerState(oldViewerState);
        } finally {
            setIsActionLoading(false);
        }
    }
    
    const handleBlock = async () => {
        if (!profile || isActionLoading || !session) return;
        setIsMenuOpen(false);
        if (!window.confirm(`Are you sure you want to block @${profile.handle}? They will not be able to see your posts or interact with you.`)) return;
        setIsActionLoading(true);
        const oldViewerState = viewerState;
        setViewerState(prev => prev ? { ...prev, blocking: 'temp-uri', following: undefined } : undefined); // Block also unfollows
        try {
            const { uri } = await agent.app.bsky.graph.block.create(
                { repo: session.did }, 
                { subject: profile.did, createdAt: new Date().toISOString() }
            );
            setViewerState(prev => prev ? { ...prev, blocking: uri } : undefined);
            toast({ title: "User Blocked" });
        } catch (e) {
            console.error("Failed to block:", e);
            toast({ title: "Error", description: "Could not block user.", variant: "destructive" });
            setViewerState(oldViewerState);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUnblock = async () => {
        if (!profile || !viewerState?.blocking || isActionLoading || !session) return;
        setIsActionLoading(true);
        setIsMenuOpen(false);
        const oldViewerState = viewerState;
        setViewerState(prev => prev ? { ...prev, blocking: undefined } : undefined);
        try {
            await agent.app.bsky.graph.block.delete({
                repo: session.did,
                rkey: new AtUri(viewerState.blocking).rkey,
            });
            toast({ title: "User Unblocked" });
        } catch (e) {
            console.error("Failed to unblock:", e);
            toast({ title: "Error", description: "Could not unblock user.", variant: "destructive" });
            setViewerState(oldViewerState);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const filterPosts = (posts: AppBskyFeedDefs.FeedViewPost[], filter: FeedFilter): AppBskyFeedDefs.FeedViewPost[] => {
        if (filter === 'all') return posts;
        return posts.filter(item => {
            const embed = item.post.embed;
            if (!embed) return false;
            
            const targetType = filter === 'photos' ? 'app.bsky.embed.images#view' : 'app.bsky.embed.video#view';

            if (embed.$type === targetType) return true;
            if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                if (embed.media?.$type === targetType) return true;
            }
            return false;
        });
    };

    const fetchProfileAndFeed = useCallback(async (currentCursor?: string) => {
        if (!currentCursor) {
            setIsLoading(true);
            setError(null);
            setFeed([]);
            setCursor(undefined);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            if (!currentCursor) {
                const profileRes = await agent.getProfile({ actor });
                setProfile(profileRes.data);
                setViewerState(profileRes.data.viewer);

                if (profileRes.data.viewer?.blocking || profileRes.data.viewer?.blockedBy) {
                    setHasMore(false);
                    setIsLoading(false);
                    return;
                }
            }

            const feedRes = await agent.getAuthorFeed({ actor, limit: 30, cursor: currentCursor });
            setFeed(prevFeed => [...prevFeed, ...feedRes.data.feed]);
            
            if (feedRes.data.cursor && feedRes.data.feed.length > 0) {
                setCursor(feedRes.data.cursor);
                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (err: any) {
            console.error("Failed to fetch profile data:", err);
            if (err.error === 'BlockedByActor') {
                setError("You are blocked by this user.");
            } else {
                setError(err.message || "Could not load profile.");
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent, actor]);

    useEffect(() => {
        fetchProfileAndFeed();
    }, [fetchProfileAndFeed]);
    
    useEffect(() => {
        if (profile?.description) {
            const processDescription = async () => {
                const rt = new RichText({ text: profile.description! });
                await rt.detectFacets(agent);
                setDescriptionWithFacets({ text: rt.text, facets: rt.facets });
            };
            processDescription();
        } else {
            setDescriptionWithFacets(null);
        }
    }, [profile?.description, agent]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
              fetchProfileAndFeed(cursor);
            }
          },
          { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
          if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, isLoading, isLoadingMore, fetchProfileAndFeed, cursor]);
    
    const displayedFeed = filterPosts(feed, activeFilter);

    if (isLoading && feed.length === 0) {
        return (
             <div className="columns-2 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="break-inside-avoid mb-4">
                        <PostCardSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    if (error || !profile) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error || "Profile not found."}</div>;
    }

    const FollowButton = () => (
        <button
            onClick={viewerState?.following ? handleUnfollow : handleFollow}
            disabled={isActionLoading}
            className={`font-bold py-2 px-6 rounded-full transition duration-200 flex items-center gap-2 flex-grow justify-center
                ${viewerState?.following 
                    ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80' 
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                }
                disabled:opacity-50`}
        >
            {viewerState?.following ? <UserCheck size={18} /> : <UserPlus size={18} />}
            <span>{viewerState?.following ? 'Following' : 'Follow'}</span>
        </button>
    );

    const ActionsMenu = () => (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="p-2 rounded-full bg-surface-3 hover:bg-surface-3/80"
                aria-label="More actions"
            >
                <MoreHorizontal size={20} />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-3 rounded-lg z-10 overflow-hidden">
                    <ul>
                         <li>
                            <button onClick={() => openComposer({initialText: `@${profile.handle} `})} className="w-full text-left px-4 py-2 hover:bg-surface-2 flex items-center gap-3">
                                <Send size={16} /> Mention
                            </button>
                        </li>
                        <li>
                            <button onClick={viewerState?.muted ? handleUnmute : handleMute} className="w-full text-left px-4 py-2 hover:bg-surface-2 flex items-center gap-3">
                                <MicOff size={16} /> {viewerState?.muted ? 'Unmute' : 'Mute'}
                            </button>
                        </li>
                        <li>
                            <button onClick={viewerState?.blocking ? handleUnblock : handleBlock} className={`w-full text-left px-4 py-2 flex items-center gap-3 ${viewerState?.blocking ? 'hover:bg-surface-2' : 'hover:bg-error/20 text-error'}`}>
                                {viewerState?.blocking ? <><ShieldOff size={16}/> Unblock</> : <><Shield size={16}/> Block</>}
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
    
    return (
        <div>
            <div className="h-48 bg-surface-3 rounded-t-lg -mx-4 -mt-4 relative">
                {profile.banner && <img src={profile.banner} alt="Banner" className="w-full h-full object-cover rounded-t-lg" loading="lazy"/>}
                <button onClick={() => window.history.back()} className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors z-10" aria-label="Go back">
                    <ArrowLeft size={20} />
                </button>
                <div className="absolute -bottom-16 left-8">
                    <img src={profile.avatar} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-surface-1 bg-surface-3" loading="lazy"/>
                </div>
            </div>
            
            <div className="pt-20 px-4 pb-8">
                {isMe ? (
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={openEditProfileModal}
                            className="font-bold py-2 px-6 rounded-full transition duration-200 bg-surface-3 text-on-surface hover:bg-surface-3/80"
                        >
                            Edit Profile
                        </button>
                    </div>
                ) : session && viewerState && (
                    <div className="flex items-center justify-end gap-2 mb-4">
                        <FollowButton />
                        <ActionsMenu />
                    </div>
                )}
                <h2 className="text-3xl font-bold flex items-center gap-2">
                    <span>{profile.displayName}</span>
                    {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                        <BadgeCheck className="w-6 h-6 text-primary" fill="currentColor" />
                    )}
                </h2>
                <p className="text-on-surface-variant">@{profile.handle}</p>
                <div className="flex items-center gap-4 text-on-surface-variant text-sm mt-2">
                    <a href={`#/profile/${actor}/followers`} className="hover:underline"><strong className="text-on-surface">{profile.followersCount}</strong> Followers</a>
                    <a href={`#/profile/${actor}/following`} className="hover:underline"><strong className="text-on-surface">{profile.followsCount}</strong> Following</a>
                    <span><strong className="text-on-surface">{profile.postsCount}</strong> Posts</span>
                </div>
                {profile.description && (
                    <div className="mt-4 text-on-surface whitespace-pre-wrap">
                        {descriptionWithFacets ? (
                            <RichTextRenderer record={descriptionWithFacets} />
                        ) : (
                            <>{profile.description}</>
                        )}
                    </div>
                )}
            </div>
            
             <div className="sticky top-0 bg-surface-1 z-20 -mx-4 px-4 pb-4">
                <div className="flex items-center justify-around border-b border-surface-3">
                    <button onClick={() => setActiveFilter('all')} className={`w-full py-3 font-semibold text-center transition-colors ${activeFilter === 'all' ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant'}`}>All</button>
                    <button onClick={() => setActiveFilter('photos')} className={`w-full py-3 font-semibold text-center transition-colors ${activeFilter === 'photos' ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant'}`}>Photos</button>
                    <button onClick={() => setActiveFilter('videos')} className={`w-full py-3 font-semibold text-center transition-colors ${activeFilter === 'videos' ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant'}`}>Videos</button>
                </div>
            </div>


            {viewerState?.blocking ? (
                <div className="text-center p-8 bg-surface-2 rounded-xl">
                    <p className="font-bold text-lg">You have blocked @{profile.handle}</p>
                    <p className="text-on-surface-variant text-sm mb-4">You won't see their posts or be able to follow them.</p>
                    <button onClick={handleUnblock} disabled={isActionLoading} className="font-bold py-2 px-6 rounded-full transition duration-200 bg-surface-3 text-on-surface hover:bg-surface-3/80 disabled:opacity-50">
                        Unblock
                    </button>
                </div>
            ) : (
                <>
                    {displayedFeed.length === 0 && !hasMore && (
                         <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl mt-4">
                            This user has not posted any {activeFilter !== 'all' ? `${activeFilter.slice(0,-1)}s` : 'media'} yet.
                        </div>
                    )}
                    
                    <div className="columns-2 gap-4">
                        {displayedFeed.map((feedViewPost) => (
                            <div key={feedViewPost.post.cid} className="break-inside-avoid mb-4">
                                <PostCard feedViewPost={feedViewPost} />
                            </div>
                        ))}
                    </div>

                    <div ref={loaderRef} className="h-10">
                        {isLoadingMore && (
                          <div className="columns-2 gap-4 mt-4">
                            <div className="break-inside-avoid mb-4">
                               <PostCardSkeleton />
                            </div>
                            <div className="break-inside-avoid mb-4">
                               <PostCardSkeleton />
                            </div>
                          </div>
                        )}
                    </div>

                    {!hasMore && displayedFeed.length > 0 && (
                        <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProfileScreen;
