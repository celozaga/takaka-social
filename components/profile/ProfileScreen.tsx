
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs, RichText, AtUri, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import FullPostCard from '../post/FullPostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck, Grid, Heart } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import ProfileHeader from './ProfileHeader';

type ProfileTab = 'posts' | 'likes';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { setCustomFeedHeaderVisible, openComposer } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [viewerState, setViewerState] = useState<AppBskyActorDefs.ViewerState | undefined>(undefined);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

    // State for 'Posts' tab
    const [postsFeed, setPostsFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [postsCursor, setPostsCursor] = useState<string | undefined>(undefined);
    const [isPostsLoading, setIsPostsLoading] = useState(true);
    const [isPostsLoadingMore, setIsPostsLoadingMore] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    
    // State for 'Likes' tab
    const [likesFeed, setLikesFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [likesCursor, setLikesCursor] = useState<string | undefined>(undefined);
    const [isLikesLoading, setIsLikesLoading] = useState(false);
    const [isLikesLoadingMore, setIsLikesLoadingMore] = useState(false);
    const [hasMoreLikes, setHasMoreLikes] = useState(true);

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
    
    const fetchPosts = useCallback(async (cursor?: string) => {
        if (!cursor) {
            setIsPostsLoading(true);
            setPostsFeed([]);
            setHasMorePosts(true);
        } else {
            setIsPostsLoadingMore(true);
        }

        try {
            const feedRes = await agent.getAuthorFeed({ actor, cursor, limit: 30 });
            const mediaPosts = feedRes.data.feed.filter(item => {
                if (item.reason) return false;
                const embed = item.post.embed;
                if (!embed) return false;
                if (AppBskyEmbedImages.isView(embed) || AppBskyEmbedVideo.isView(embed)) return true;
                if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                     const media = embed.media;
                     if (AppBskyEmbedImages.isView(media) || AppBskyEmbedVideo.isView(media)) return true;
                }
                return false;
            });

            setPostsFeed(prev => cursor ? [...prev, ...mediaPosts] : mediaPosts);
            setPostsCursor(feedRes.data.cursor);
            setHasMorePosts(!!feedRes.data.cursor && feedRes.data.feed.length > 0);
        } catch (err) {
            console.error("Failed to fetch posts:", err);
        } finally {
            setIsPostsLoading(false);
            setIsPostsLoadingMore(false);
        }
    }, [agent, actor]);

    const fetchLikes = useCallback(async (cursor?: string) => {
        if (!cursor) {
            setIsLikesLoading(true);
            setLikesFeed([]);
            setHasMoreLikes(true);
        } else {
            setIsLikesLoadingMore(true);
        }
        
        try {
            const res = await agent.api.app.bsky.feed.getActorLikes({ actor, cursor, limit: 30 });
            setLikesFeed(prev => cursor ? [...prev, ...res.data.feed] : res.data.feed);
            setLikesCursor(res.data.cursor);
            setHasMoreLikes(!!res.data.cursor && res.data.feed.length > 0);
        } catch (err) {
            console.error("Failed to fetch likes:", err);
        } finally {
            setIsLikesLoading(false);
            setIsLikesLoadingMore(false);
        }
    }, [agent, actor]);

    // Initial profile load
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

    // Fetch data for the active tab
    useEffect(() => {
        if (profile && !viewerState?.blocking && !viewerState?.blockedBy) {
            if (activeTab === 'posts' && postsFeed.length === 0) {
                fetchPosts();
            } else if (activeTab === 'likes' && likesFeed.length === 0) {
                fetchLikes();
            }
        }
    }, [activeTab, profile, viewerState, postsFeed.length, likesFeed.length, fetchPosts, fetchLikes]);

    // Process profile description
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
    
    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              if (activeTab === 'posts' && hasMorePosts && !isPostsLoadingMore) fetchPosts(postsCursor);
              if (activeTab === 'likes' && hasMoreLikes && !isLikesLoadingMore) fetchLikes(likesCursor);
            }
          }, { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [activeTab, hasMorePosts, isPostsLoadingMore, postsCursor, hasMoreLikes, isLikesLoadingMore, likesCursor, fetchPosts, fetchLikes]);

    if (isLoadingProfile) {
        return <div>{/* Skeleton for header + profile card */}</div>;
    }

    if (error || !profile) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error || "Profile not found."}</div>;
    }

    const FollowButton = () => ( <button onClick={viewerState?.following ? handleUnfollow : handleFollow} disabled={isActionLoading} className={`font-bold py-2.5 px-6 rounded-lg transition duration-200 flex items-center gap-2 flex-grow justify-center ${viewerState?.following ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80' : 'bg-primary text-on-primary hover:bg-primary/90'} disabled:opacity-50`}><span>{viewerState?.following ? 'Following' : 'Follow'}</span></button> );
    const MentionButton = () => ( <button onClick={() => openComposer({ initialText: `@${profile.handle} ` })} className="font-bold py-2.5 px-6 rounded-lg transition duration-200 flex items-center gap-2 flex-grow justify-center bg-surface-3 text-on-surface hover:bg-surface-3/80"><span>Mention</span></button> );
    
    const TabButton: React.FC<{tab: ProfileTab, icon: React.FC<any>, label: string}> = ({ tab, icon: Icon, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`flex-1 flex justify-center items-center gap-2 py-3 font-semibold transition-colors ${activeTab === tab ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant'}`}>
            <Icon size={20} />
        </button>
    );

    const renderContent = () => {
        if (viewerState?.blocking || viewerState?.blockedBy) {
            return <div className="text-center p-8 bg-surface-2 rounded-xl">{viewerState.blocking ? `You have blocked @${profile.handle}` : `You are blocked by @${profile.handle}`}</div>;
        }

        switch (activeTab) {
            case 'posts':
                if (isPostsLoading) return <div className="columns-2 gap-4 mt-4">{[...Array(6)].map((_, i) => <div key={i} className="break-inside-avoid mb-4"><PostCardSkeleton /></div>)}</div>;
                if (postsFeed.length === 0) return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl mt-4">This user has not posted any media yet.</div>;
                return (
                    <div className="columns-2 gap-4">
                        {postsFeed.map((feedViewPost) => (
                            <div key={feedViewPost.post.cid} className="break-inside-avoid mb-4">
                                <PostCard feedViewPost={feedViewPost} />
                            </div>
                        ))}
                    </div>
                );
            
            case 'likes':
                if (isLikesLoading) return <div className="mt-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl h-24 animate-pulse"></div>)}</div>;
                if (likesFeed.length === 0) return <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl mt-4">This user hasn't liked any posts yet.</div>;
                return (
                    <ul className="-my-2">
                        {likesFeed.map((feedViewPost) => (
                            <FullPostCard key={feedViewPost.post.cid} feedViewPost={feedViewPost} />
                        ))}
                    </ul>
                );
        }
    };

    return (
        <div>
            <ProfileHeader handle={profile.handle} />
            <div className="p-4 bg-surface-2 rounded-xl mt-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold break-words flex items-center gap-2"><span>{profile.displayName}</span>{profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && <BadgeCheck className="w-6 h-6 text-primary flex-shrink-0" fill="currentColor" />}</h2>
                        <p className="text-on-surface-variant">@{profile.handle}</p>
                    </div>
                    <img src={profile.avatar} alt="Avatar" className="w-20 h-20 rounded-full bg-surface-3" loading="lazy"/>
                </div>
                {profile.description && (<div className="mt-3 text-on-surface whitespace-pre-wrap break-words">{descriptionWithFacets ? <RichTextRenderer record={descriptionWithFacets} /> : <>{profile.description}</>}</div>)}
                <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-3">
                    <a href={`#/profile/${profile.handle}/followers`} className="hover:underline"><strong className="text-on-surface">{profile.followersCount}</strong> followers</a>
                    <a href={`#/profile/${profile.handle}/following`} className="hover:underline"><strong className="text-on-surface">{profile.followsCount}</strong> following</a>
                </div>
                {session && !isMe && viewerState && (<div className="flex items-center gap-2 mt-4"><FollowButton />{session && !isMe && <MentionButton />}</div>)}
            </div>
            <div className="mt-4 bg-surface-2 rounded-xl overflow-hidden">
                <div className="flex border-b border-surface-3">
                    <TabButton tab="posts" icon={Grid} label="Posts" />
                    <TabButton tab="likes" icon={Heart} label="Likes" />
                </div>
                <div className="p-4">
                    {renderContent()}
                    <div ref={loaderRef} className="h-10">
                         { (isPostsLoadingMore || isLikesLoadingMore) && <div className="mt-4 bg-surface-3 rounded-xl h-24 animate-pulse"></div> }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
