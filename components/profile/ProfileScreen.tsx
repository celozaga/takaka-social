import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs, RichText, AtUri, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import ProfileHeader from './ProfileHeader';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { setCustomFeedHeaderVisible, openComposer } = useUI();

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

    const loaderRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const isMe = session?.did === profile?.did;

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);
    
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
        setViewerState(prev => prev ? { ...prev, blocking: 'temp-uri', following: undefined } : undefined);
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
    
    const filterMediaPosts = (posts: AppBskyFeedDefs.FeedViewPost[]): AppBskyFeedDefs.FeedViewPost[] => {
        return posts.filter(item => {
            // Only show original posts with media
            if (item.reason) return false;

            const embed = item.post.embed;
            if (!embed) return false;
            
            if (AppBskyEmbedImages.isView(embed)) return true;
            if (AppBskyEmbedVideo.isView(embed)) return true;

            if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                const media = embed.media;
                if (AppBskyEmbedImages.isView(media)) return true;
                if (AppBskyEmbedVideo.isView(media)) return true;
            }
            return false;
        });
    };

    const fetchProfileAndFeed = useCallback(async (currentCursor?: string) => {
        if (!currentCursor) {
            setIsLoading(true);
            setFeed([]);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }
        setError(null);

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

            const feedRes = await agent.getAuthorFeed({ actor, cursor: currentCursor, limit: 30 });
            
            const mediaPosts = filterMediaPosts(feedRes.data.feed);
            
            setFeed(prev => [...prev, ...mediaPosts]);
            
            if (feedRes.data.cursor && feedRes.data.feed.length > 0) {
                setCursor(feedRes.data.cursor);
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

    const loadMorePosts = useCallback(() => {
        if (isLoadingMore || !cursor || !hasMore) return;
        fetchProfileAndFeed(cursor);
    }, [isLoadingMore, cursor, hasMore, fetchProfileAndFeed]);
    
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
            if (entries[0].isIntersecting) {
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
    }, [loadMorePosts]);

    if (isLoading && !profile) {
        return (
            <div>
                <div className="sticky top-0 -mx-4 -mt-4 px-4 bg-surface-1 z-30 h-16 animate-pulse"></div>
                <div className="p-4 bg-surface-2 rounded-xl mt-4 animate-pulse">
                    <div className="h-20"></div>
                    <div className="h-4 w-3/4 mt-4 rounded bg-surface-3"></div>
                    <div className="h-4 w-1/2 mt-2 rounded bg-surface-3"></div>
                </div>
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
            className={`font-bold py-2.5 px-6 rounded-lg transition duration-200 flex items-center gap-2 flex-grow justify-center
                ${viewerState?.following 
                    ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80' 
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                }
                disabled:opacity-50`}
        >
            <span>{viewerState?.following ? 'Following' : 'Follow'}</span>
        </button>
    );

    const MentionButton = () => {
        if (!session || isMe) return null;
        return (
            <button
                onClick={() => openComposer({ initialText: `@${profile.handle} ` })}
                className="font-bold py-2.5 px-6 rounded-lg transition duration-200 flex items-center gap-2 flex-grow justify-center bg-surface-3 text-on-surface hover:bg-surface-3/80"
            >
                <span>Mention</span>
            </button>
        );
    };

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
            <ProfileHeader handle={profile.handle} />
            <div className="p-4 bg-surface-2 rounded-xl mt-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold break-words flex items-center gap-2">
                            <span>{profile.displayName}</span>
                             {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                <BadgeCheck className="w-6 h-6 text-primary flex-shrink-0" fill="currentColor" />
                            )}
                        </h2>
                        <p className="text-on-surface-variant">@{profile.handle}</p>
                    </div>
                    <img src={profile.avatar} alt="Avatar" className="w-20 h-20 rounded-full bg-surface-3" loading="lazy"/>
                </div>

                {profile.description && (
                    <div className="mt-3 text-on-surface whitespace-pre-wrap break-words">
                        {descriptionWithFacets ? <RichTextRenderer record={descriptionWithFacets} /> : <>{profile.description}</>}
                    </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-3">
                    <a href={`#/profile/${profile.handle}/followers`} className="hover:underline">
                        <strong className="text-on-surface">{profile.followersCount}</strong> followers
                    </a>
                    <a href={`#/profile/${profile.handle}/following`} className="hover:underline">
                        <strong className="text-on-surface">{profile.followsCount}</strong> following
                    </a>
                </div>
                
                {session && !isMe && viewerState && (
                    <div className="flex items-center gap-2 mt-4">
                        <FollowButton />
                        <MentionButton />
                        <ActionsMenu />
                    </div>
                )}
            </div>

            <div className="mt-4">
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
                         {isLoading && feed.length === 0 ? (
                            <div className="columns-2 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="break-inside-avoid mb-4">
                                        <PostCardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : feed.length === 0 && !isLoadingMore ? (
                             <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">This user has not posted any media yet.</div>
                        ) : (
                            <div className="columns-2 gap-4">
                                {feed.map((feedViewPost) => {
                                    const { post, reason } = feedViewPost;
                                    const uniqueKey = `${post.cid}-${AppBskyFeedDefs.isReasonRepost(reason) ? reason.by.did : ''}`;
                                    return (
                                        <div key={uniqueKey} className="break-inside-avoid mb-4">
                                            <PostCard feedViewPost={feedViewPost} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div ref={loaderRef} className="h-10">
                            {isLoadingMore && (
                                <div className="columns-2 gap-4 mt-4">
                                    <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                                    <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                                </div>
                            )}
                        </div>

                        {!hasMore && feed.length > 0 && (
                            <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileScreen;
