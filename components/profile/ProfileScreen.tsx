
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs, RichText, AtUri, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck, Grid, Send, Image as ImageIcon, Video } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import ProfileHeader from './ProfileHeader';

type ProfileTab = 'all' | 'photos' | 'videos';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { setCustomFeedHeaderVisible, openComposer } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [viewerState, setViewerState] = useState<AppBskyActorDefs.ViewerState | undefined>(undefined);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<ProfileTab>('all');

    // State for 'All Media' tab
    const [allFeed, setAllFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [allCursor, setAllCursor] = useState<string | undefined>(undefined);
    const [isAllLoading, setIsAllLoading] = useState(false);
    const [isAllLoadingMore, setIsAllLoadingMore] = useState(false);
    const [hasMoreAll, setHasMoreAll] = useState(true);
    
    // State for 'Photos' tab
    const [photosFeed, setPhotosFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [photosCursor, setPhotosCursor] = useState<string | undefined>(undefined);
    const [isPhotosLoading, setIsPhotosLoading] = useState(false);
    const [isPhotosLoadingMore, setIsPhotosLoadingMore] = useState(false);
    const [hasMorePhotos, setHasMorePhotos] = useState(true);
    
     // State for 'Videos' tab
    const [videosFeed, setVideosFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [videosCursor, setVideosCursor] = useState<string | undefined>(undefined);
    const [isVideosLoading, setIsVideosLoading] = useState(false);
    const [isVideosLoadingMore, setIsVideosLoadingMore] = useState(false);
    const [hasMoreVideos, setHasMoreVideos] = useState(true);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);

    const loaderRef = useRef<HTMLDivElement>(null);
    
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
            toast({ title: "Error", description: "Could not unblock user.", variant: "destructive" });
            setViewerState(oldViewerState);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const fetchFilteredFeed = useCallback(async (tab: ProfileTab, cursor?: string) => {
        const setLoading = (val: boolean) => {
            if (tab === 'all') setIsAllLoading(val);
            else if (tab === 'photos') setIsPhotosLoading(val);
            else if (tab === 'videos') setIsVideosLoading(val);
        };
        const setLoadingMore = (val: boolean) => {
            if (tab === 'all') setIsAllLoadingMore(val);
            else if (tab === 'photos') setIsPhotosLoadingMore(val);
            else if (tab === 'videos') setIsVideosLoadingMore(val);
        };
        const setFeed = (updater: React.SetStateAction<AppBskyFeedDefs.FeedViewPost[]>) => {
            if (tab === 'all') setAllFeed(updater);
            else if (tab === 'photos') setPhotosFeed(updater);
            else if (tab === 'videos') setVideosFeed(updater);
        };
        const setCursor = (val?: string) => {
            if (tab === 'all') setAllCursor(val);
            else if (tab === 'photos') setPhotosCursor(val);
            else if (tab === 'videos') setVideosCursor(val);
        };
        const setHasMore = (val: boolean) => {
            if (tab === 'all') setHasMoreAll(val);
            else if (tab === 'photos') setHasMorePhotos(val);
            else if (tab === 'videos') setHasMoreVideos(val);
        };

        if (!cursor) {
            setLoading(true);
            setFeed([]);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            let foundPosts: AppBskyFeedDefs.FeedViewPost[] = [];
            let nextCursor: string | undefined = cursor;
            let hasNextPage = true;
            let attempts = 0;
            const requiredPostsOnInitialLoad = 10;

            do {
                attempts++;
                const res = await agent.getAuthorFeed({ actor, cursor: nextCursor, limit: 50 });

                if (res.data.feed.length > 0) {
                    const filtered = res.data.feed.filter(item => {
                        if (item.reason) return false;
                        const embed = item.post.embed;
                        if (!embed) return false;
                        const hasImage = (AppBskyEmbedImages.isView(embed)) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedImages.isView(embed.media));
                        const hasVideo = (AppBskyEmbedVideo.isView(embed)) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media));
                        switch (tab) {
                            case 'all': return hasImage || hasVideo;
                            case 'photos': return hasImage;
                            case 'videos': return hasVideo;
                        }
                    });
                    foundPosts.push(...filtered);
                }
                
                nextCursor = res.data.cursor;
                hasNextPage = !!nextCursor;

            } while (
                !cursor && // Only loop on initial load
                foundPosts.length < requiredPostsOnInitialLoad && 
                hasNextPage && 
                attempts < 5
            );

            setFeed(prev => cursor ? [...prev, ...foundPosts] : foundPosts);
            setCursor(nextCursor);
            setHasMore(hasNextPage);
        } catch (err) {
            console.error(`Failed to fetch ${tab}:`, err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [agent, actor]);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            setError(null);
            try {
                const profileRes = await agent.getProfile({ actor });
                setProfile(profileRes.data);
                setViewerState(profileRes.data.viewer);
                if (profileRes.data.viewer?.blocking || profileRes.data.viewer?.blockedBy) {
                    setError("This profile is unavailable.");
                }
            } catch (err: any) {
                if (err.error === 'BlockedByActor') setError("You are blocked by this user.");
                else setError(err.message || "Could not load profile.");
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [agent, actor]);

    useEffect(() => {
        if (profile && !viewerState?.blocking && !viewerState?.blockedBy) {
            const isEmpty = (tab: ProfileTab) => {
                if (tab === 'all') return allFeed.length === 0;
                if (tab === 'photos') return photosFeed.length === 0;
                if (tab === 'videos') return videosFeed.length === 0;
                return true;
            };
            const isLoading = (tab: ProfileTab) => {
                 if (tab === 'all') return isAllLoading;
                if (tab === 'photos') return isPhotosLoading;
                if (tab === 'videos') return isVideosLoading;
                return false;
            }
            if (isEmpty(activeTab) && !isLoading(activeTab)) {
                fetchFilteredFeed(activeTab);
            }
        }
    }, [activeTab, profile, viewerState, allFeed.length, photosFeed.length, videosFeed.length, isAllLoading, isPhotosLoading, isVideosLoading, fetchFilteredFeed]);

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
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              if (activeTab === 'all' && hasMoreAll && !isAllLoadingMore) fetchFilteredFeed('all', allCursor);
              if (activeTab === 'photos' && hasMorePhotos && !isPhotosLoadingMore) fetchFilteredFeed('photos', photosCursor);
              if (activeTab === 'videos' && hasMoreVideos && !isVideosLoadingMore) fetchFilteredFeed('videos', videosCursor);
            }
          }, { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [activeTab, hasMoreAll, isAllLoadingMore, allCursor, hasMorePhotos, isPhotosLoadingMore, photosCursor, hasMoreVideos, isVideosLoadingMore, videosCursor, fetchFilteredFeed]);

    if (isLoadingProfile) {
        return (
             <div>
                <div className="sticky top-0 -mx-4 -mt-4 px-4 bg-surface-1 z-30 h-16 animate-pulse"></div>
                <div className="px-4 mt-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="w-24 h-24 rounded-full bg-surface-3"></div>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                             <div className="h-10 bg-surface-3 rounded-lg"></div>
                             <div className="h-10 bg-surface-3 rounded-lg"></div>
                             <div className="h-10 bg-surface-3 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-5 w-40 bg-surface-3 rounded"></div>
                        <div className="h-4 w-full bg-surface-3 rounded"></div>
                        <div className="h-4 w-3/4 bg-surface-3 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl mt-4">{error || "Profile not found."}</div>;
    }

    const FollowButton = () => (
        <button onClick={viewerState?.following ? handleUnfollow : handleFollow} disabled={isActionLoading} className={`flex-1 font-bold py-2.5 rounded-lg transition duration-200 text-center ${viewerState?.following ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80' : 'bg-accent text-on-accent hover:bg-accent/90'} disabled:opacity-50`}>
            {viewerState?.following ? 'Following' : 'Follow'}
        </button>
    );
    
    const MentionButton = () => (
        <button onClick={() => openComposer({ initialText: `@${profile.handle} ` })} className="px-3 rounded-lg transition duration-200 bg-surface-3 text-on-surface hover:bg-surface-3/80">
            <Send size={20} />
        </button>
    );
    
    const TabButton: React.FC<{tab: ProfileTab, icon: React.FC<any>}> = ({ tab, icon: Icon }) => (
        <button onClick={() => setActiveTab(tab)} className={`flex-1 flex justify-center items-center gap-2 py-3 font-semibold transition-colors relative ${activeTab === tab ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            <Icon size={24} />
            {activeTab === tab && <div className="absolute bottom-0 h-0.5 w-12 bg-on-surface rounded-full"></div>}
        </button>
    );

    const renderContent = () => {
        if (viewerState?.blocking || viewerState?.blockedBy) {
            return <div className="text-center p-8 bg-surface-2 rounded-xl">{viewerState.blocking ? `You have blocked @${profile.handle}` : `You are blocked by @${profile.handle}`}</div>;
        }

        let isLoading, feed, hasMore;
        let definitiveEmptyMessage = "This user has not posted any media yet.";
        let tentativeEmptyMessage = "No media found in recent posts. Scroll to find more.";

        switch(activeTab) {
            case 'photos':
                isLoading = isPhotosLoading;
                feed = photosFeed;
                hasMore = hasMorePhotos;
                definitiveEmptyMessage = "This user has not posted any photos yet.";
                tentativeEmptyMessage = "No photos found in recent posts. Scroll to find more.";
                break;
            case 'videos':
                isLoading = isVideosLoading;
                feed = videosFeed;
                hasMore = hasMoreVideos;
                definitiveEmptyMessage = "This user has not posted any videos yet.";
                tentativeEmptyMessage = "No videos found in recent posts. Scroll to find more.";
                break;
            case 'all':
            default:
                isLoading = isAllLoading;
                feed = allFeed;
                hasMore = hasMoreAll;
        }

        if (isLoading) return <div className="columns-2 gap-4 mt-4">{[...Array(6)].map((_, i) => <div key={i} className="break-inside-avoid mb-4"><PostCardSkeleton /></div>)}</div>;
        
        if (feed.length === 0) {
            const message = hasMore ? tentativeEmptyMessage : definitiveEmptyMessage;
            return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl mt-4">{message}</div>;
        }
        
        return (
            <div className="columns-2 gap-4">
                {feed.map((feedViewPost) => (
                    <div key={feedViewPost.post.cid} className="break-inside-avoid mb-4">
                        <PostCard feedViewPost={feedViewPost} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <ProfileHeader handle={profile.handle} onMoreClick={() => setIsMenuOpen(true)} />

             {isMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-[90]" onClick={() => setIsMenuOpen(false)}>
                    <div className="fixed bottom-0 left-0 right-0 bg-surface-2 p-4 rounded-t-2xl animate-in slide-in-from-bottom-5 duration-300" onClick={e => e.stopPropagation()}>
                         <ul className="space-y-2">
                            <li><button onClick={viewerState?.muted ? handleUnmute : handleMute} className="w-full text-left px-4 py-3 hover:bg-surface-3 rounded-lg flex items-center gap-3 text-lg"><MicOff size={20} /> {viewerState?.muted ? 'Unmute' : 'Mute'}</button></li>
                            <li><button onClick={viewerState?.blocking ? handleUnblock : handleBlock} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-lg rounded-lg ${viewerState?.blocking ? 'hover:bg-surface-3' : 'hover:bg-error/20 text-error'}`}>{viewerState?.blocking ? <><ShieldOff size={20}/> Unblock</> : <><Shield size={20}/> Block</>}</button></li>
                        </ul>
                    </div>
                </div>
            )}

            <div className="px-4">
                <div className="flex items-center justify-between gap-4 mt-4">
                    <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full bg-surface-3" loading="lazy"/>
                    <div className="flex-1 grid grid-cols-3 text-center gap-2">
                        <a href={`#/profile/${profile.handle}/following`} className="hover:bg-surface-3 rounded-md py-2">
                            <p className="font-bold text-lg">{profile.followsCount}</p>
                            <p className="text-sm text-on-surface-variant">Following</p>
                        </a>
                        <a href={`#/profile/${profile.handle}/followers`} className="hover:bg-surface-3 rounded-md py-2">
                            <p className="font-bold text-lg">{profile.followersCount}</p>
                            <p className="text-sm text-on-surface-variant">Followers</p>
                        </a>
                         <div className="py-2">
                            <p className="font-bold text-lg">{profile.postsCount}</p>
                            <p className="text-sm text-on-surface-variant">Posts</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span>{profile.displayName}</span>
                        {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />}
                    </h2>
                    {profile.description && (
                        <div className="mt-1 text-on-surface whitespace-pre-wrap break-words text-sm">
                            {descriptionWithFacets ? <RichTextRenderer record={descriptionWithFacets} /> : <>{profile.description}</>}
                        </div>
                    )}
                </div>

                {session && !isMe && viewerState && (
                    <div className="flex items-stretch gap-2 mt-4">
                        <FollowButton />
                        <MentionButton />
                    </div>
                )}
            </div>

            <div className="mt-4 border-b border-surface-3">
                 <div className="flex">
                    <TabButton tab="all" icon={Grid} />
                    <TabButton tab="photos" icon={ImageIcon} />
                    <TabButton tab="videos" icon={Video} />
                </div>
            </div>

            <div className="mt-4">
                {renderContent()}
                <div ref={loaderRef} className="h-10">
                    { (isAllLoadingMore || isPhotosLoadingMore || isVideosLoadingMore) && (
                        <div className="columns-2 gap-4 mt-4">
                          <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                          <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
