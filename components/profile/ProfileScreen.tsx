
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs, RichText, AtUri, AppBskyFeedGetActorLikes, ComAtprotoRepoListRecords } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck, LayoutGrid, Repeat, Heart, List } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import ProfileHeader from './ProfileHeader';
import FeedSearchResultCard from '../feeds/FeedSearchResultCard';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import FullPostCard from '../post/FullPostCard';

type ProfileTab = 'posts' | 'reposts' | 'likes' | 'feeds';

const TABS: { id: ProfileTab; icon: React.FC<any>, label: string }[] = [
    { id: 'posts', icon: LayoutGrid, label: 'Posts' },
    { id: 'reposts', icon: Repeat, label: 'Reposts' },
    { id: 'likes', icon: Heart, label: 'Likes' },
    { id: 'feeds', icon: List, label: 'Feeds' },
];


const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { setCustomFeedHeaderVisible, openComposer } = useUI();
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [viewerState, setViewerState] = useState<AppBskyActorDefs.ViewerState | undefined>(undefined);
    const [feed, setFeed] = useState<(AppBskyFeedDefs.FeedViewPost | AppBskyFeedDefs.GeneratorView)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingFeed, setIsLoadingFeed] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

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
    
    const fetchFeedData = useCallback(async (tab: ProfileTab, currentCursor?: string) => {
        if (!currentCursor) {
            setIsLoadingFeed(true);
            setFeed([]);
            setCursor(undefined);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            let response: any;
            let newItems: (AppBskyFeedDefs.FeedViewPost | AppBskyFeedDefs.GeneratorView)[] = [];
            let nextCursor: string | undefined;

            switch (tab) {
                case 'posts':
                case 'reposts': {
                    let accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = currentCursor ? (feed as AppBskyFeedDefs.FeedViewPost[]) : [];
                    nextCursor = currentCursor;
                    let attempts = 0;
                    const MIN_ITEMS = 15;

                    // Keep fetching pages until we have enough items that match the filter or we run out of pages.
                    while (attempts < 5 && accumulatedPosts.length < (currentCursor ? accumulatedPosts.length + MIN_ITEMS : MIN_ITEMS)) {
                        attempts++;
                        const authorFeedResponse = await agent.getAuthorFeed({ actor, cursor: nextCursor, limit: 50 });
                        
                        if (!authorFeedResponse.data.feed.length) {
                            nextCursor = undefined;
                            break;
                        }

                        const filteredPosts = authorFeedResponse.data.feed.filter(item => {
                            if (tab === 'posts') return !item.reason && item.post.embed;
                            if (tab === 'reposts') return AppBskyFeedDefs.isReasonRepost(item.reason);
                            return false;
                        });
                        
                        accumulatedPosts = [...accumulatedPosts, ...filteredPosts];
                        nextCursor = authorFeedResponse.data.cursor;

                        if (!nextCursor) break;
                    }
                    newItems = accumulatedPosts;
                    break;
                }
                case 'likes':
                    response = await agent.app.bsky.feed.getActorLikes({ actor, cursor: currentCursor, limit: 30 });
                    newItems = response.data.feed;
                    nextCursor = response.data.cursor;
                    break;
                case 'feeds': {
                    const listRecordsResponse = await agent.api.com.atproto.repo.listRecords({
                        repo: actor,
                        collection: 'app.bsky.feed.generator',
                        limit: 50,
                        cursor: currentCursor,
                    });

                    const feedUris = listRecordsResponse.data.records.map(r => r.uri);
                    
                    if (feedUris.length > 0) {
                        const getFeedsResponse = await agent.app.bsky.feed.getFeedGenerators({ feeds: feedUris });
                        newItems = getFeedsResponse.data.feeds;
                    } else {
                        newItems = [];
                    }
                    
                    nextCursor = listRecordsResponse.data.cursor;
                    break;
                }
            }
            
            // For posts and reposts, `newItems` is the full list. For others, it's just the new page.
            if (tab === 'posts' || tab === 'reposts') {
                 setFeed(newItems);
            } else {
                 setFeed(prev => currentCursor ? [...prev, ...newItems] : newItems);
            }

            setCursor(nextCursor);
            setHasMore(!!nextCursor && newItems.length > 0);

        } catch (err) {
            console.error(`Failed to fetch ${tab}:`, err);
            setError(`Could not load ${tab}.`);
        } finally {
            setIsLoadingFeed(false);
            setIsLoadingMore(false);
        }
    }, [agent, actor, feed]);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const profileRes = await agent.getProfile({ actor });
                setProfile(profileRes.data);
                setViewerState(profileRes.data.viewer);
            } catch (err: any) {
                console.error("Failed to fetch profile data:", err);
                if (err.error === 'BlockedByActor') {
                    setError("You are blocked by this user.");
                } else {
                    setError(err.message || "Could not load profile.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [agent, actor]);

    useEffect(() => {
        if (profile && !profile.viewer?.blocking && !profile.viewer?.blockedBy) {
            fetchFeedData(activeTab);
        }
    }, [profile, activeTab]);
    
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


    const loadMore = useCallback(async () => {
        if (isLoadingMore || !cursor || !hasMore) return;
        fetchFeedData(activeTab, cursor);
    }, [activeTab, cursor, hasMore, isLoadingMore, fetchFeedData]);
    
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
            if (entries[0].isIntersecting && hasMore && !isLoadingFeed && !isLoadingMore) {
              loadMore();
            }
          },
          { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
          if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, isLoadingFeed, isLoadingMore, loadMore]);
    
    const handleTabChange = (tab: ProfileTab) => {
        if (tab !== activeTab) {
            setActiveTab(tab);
        }
    };
    
    const handlePinToggle = (feedGenerator: AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feedGenerator.uri);
        if (isPinned) {
            togglePin(feedGenerator.uri);
        } else {
            addFeed(feedGenerator, true);
        }
    };


    if (isLoading) {
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
    
    const renderFeedContent = () => {
        if (isLoadingFeed) {
             const skeleton = activeTab === 'posts' 
                ? (
                    <div className="columns-2 gap-4 mt-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl h-24 animate-pulse"></div>)}
                    </div>
                );
            return skeleton;
        }
        
        if (feed.length === 0) {
            return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No content found in this tab.</div>;
        }

        if (activeTab === 'feeds') {
            return (
                <div className="space-y-3">
                    {(feed as AppBskyFeedDefs.GeneratorView[]).map(f => (
                        <FeedSearchResultCard
                            key={f.uri}
                            feed={f}
                            isPinned={pinnedUris.has(f.uri)}
                            onTogglePin={() => handlePinToggle(f)}
                        />
                    ))}
                </div>
            )
        }
        
        const feedViewPosts = feed.filter(item => AppBskyFeedDefs.isFeedViewPost(item)) as AppBskyFeedDefs.FeedViewPost[];

        if (activeTab === 'posts') {
            return (
                <div className="columns-2 gap-4">
                    {feedViewPosts.map((feedViewPost) => {
                        const { post, reason } = feedViewPost;
                        const uniqueKey = `${post.cid}-${AppBskyFeedDefs.isReasonRepost(reason) ? reason.by.did : ''}`;
                        return (
                            <div key={uniqueKey} className="break-inside-avoid mb-4">
                                <PostCard feedViewPost={feedViewPost} />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // List view for Reposts and Likes
        return (
            <div className="flow-root">
                <ul className="-my-px">
                {feedViewPosts.map((feedViewPost) => {
                    const { post, reason } = feedViewPost;
                    const uniqueKey = `${post.cid}-${AppBskyFeedDefs.isReasonRepost(reason) ? reason.by.did : ''}`;
                    return <FullPostCard key={uniqueKey} feedViewPost={feedViewPost} />;
                })}
                </ul>
            </div>
        );
    }
    
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
            
            <div className="flex justify-around items-center mt-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`py-3 flex-1 flex justify-center items-center transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                        aria-label={tab.label}
                    >
                        <tab.icon size={24} />
                    </button>
                ))}
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
                        {renderFeedContent()}
                        <div ref={loaderRef} className="h-10">
                            {isLoadingMore && (
                                <div className="space-y-4">
                                     <div className="bg-surface-2 rounded-xl h-24 animate-pulse"></div>
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
