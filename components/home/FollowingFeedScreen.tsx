import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import {
    AppBskyActorDefs,
    AppBskyFeedDefs,
} from '@atproto/api';
import { format, isToday, isYesterday } from 'date-fns';
import { useChannelState } from '../../context/ChannelStateContext';

type ProfileFeed = {
  profile: AppBskyActorDefs.ProfileViewBasic;
  latestPost?: AppBskyFeedDefs.FeedViewPost;
  hasUnread: boolean;
  lastActivity: string; // ISO string for sorting
};

const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) {
        return format(date, 'p'); // e.g., 4:30 PM
    }
    if (isYesterday(date)) {
        return 'Yesterday';
    }
    return format(date, 'MMM d'); // e.g., Jun 12
};

const getPreviewText = (latestPost: AppBskyFeedDefs.FeedViewPost): React.ReactNode => {
    const isRepost = AppBskyFeedDefs.isReasonRepost(latestPost.reason);
    const postToShow = latestPost.post;
    const record = postToShow.record as any;

    let textPreview: React.ReactNode = record?.text || '[media]';

    if (isRepost) {
        return (
            <div className="flex items-baseline">
                <span className="text-on-surface-variant italic mr-1.5 flex-shrink-0">Reposted:</span>
                <span className="truncate">{record?.text || '[media]'}</span>
            </div>
        );
    }
    
    return textPreview;
};


const ProfileFeedItem: React.FC<{ profileFeed: ProfileFeed, currentHash: string }> = React.memo(({ profileFeed, currentHash }) => {
    const { profile, latestPost, hasUnread } = profileFeed;
    const isActive = `#/profile/${profile.handle}` === currentHash || `#/profile/${profile.did}` === currentHash;

    const previewNode = latestPost
        ? getPreviewText(latestPost)
        : <span className="text-on-surface-variant italic">No recent activity</span>;

    return (
        <li>
            <a href={`#/profile/${profile.handle}`} className={`flex items-start gap-3 p-3 transition-colors ${isActive ? 'bg-surface-2' : 'hover:bg-surface-2'} ${!latestPost ? 'opacity-60' : ''}`}>
                <img src={profile.avatar} alt={profile.displayName || ''} className="w-14 h-14 rounded-full bg-surface-3 flex-shrink-0" />
                <div className="flex-1 min-w-0 border-b border-surface-3 pb-3">
                    <div className="flex justify-between items-center">
                        <h2 className={`font-bold text-lg truncate ${hasUnread ? 'text-on-surface' : 'text-on-surface-variant'}`}>{profile.displayName || profile.handle}</h2>
                        <p className="text-sm text-on-surface-variant flex-shrink-0 ml-2">{formatTimestamp(profileFeed.lastActivity)}</p>
                    </div>
                    <div className="flex justify-between items-start mt-0.5">
                        <div className="text-on-surface-variant text-sm line-clamp-2 break-words pr-2">
                           {previewNode}
                        </div>
                        {hasUnread && (
                            <div className="mt-2 bg-primary rounded-full h-2.5 w-2.5 flex-shrink-0" title="Unread posts"></div>
                        )}
                    </div>
                </div>
            </a>
        </li>
    );
});

const FollowingFeedScreen: React.FC = () => {
    const { agent, session } = useAtp();
    const { lastViewedTimestamps } = useChannelState();
    const [profileFeeds, setProfileFeeds] = useState<ProfileFeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentHash, setCurrentHash] = React.useState(window.location.hash);
    
    const [phase, setPhase] = useState<'timeline' | 'follows'>('timeline');
    
    // Using refs to avoid re-creating useCallback on every state change
    const timelineCursor = useRef<string | undefined>();
    const followsCursor = useRef<string | undefined>();
    const seenDids = useRef(new Set<string>());
    const hasMoreTimeline = useRef(true);
    const hasMoreFollows = useRef(true);
    const isFetching = useRef(false);

    const loaderRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handler = () => setCurrentHash(window.location.hash);
        window.addEventListener('hashchange', handler);
        return () => window.removeEventListener('hashchange', handler);
    }, []);

    const loadMore = useCallback(async () => {
        if (isFetching.current || (!hasMoreTimeline.current && !hasMoreFollows.current)) return;
        
        isFetching.current = true;
        setIsLoadingMore(true);

        try {
            if (phase === 'timeline' && hasMoreTimeline.current) {
                const timelineRes = await agent.getTimeline({ limit: 50, cursor: timelineCursor.current });

                if (!timelineRes.data.cursor || timelineRes.data.feed.length === 0) {
                    hasMoreTimeline.current = false;
                    setPhase('follows');
                } else {
                    timelineCursor.current = timelineRes.data.cursor;
                }

                const newFeeds: ProfileFeed[] = [];
                for (const item of timelineRes.data.feed) {
                    const authorDid = item.post.author.did;
                    if (seenDids.current.has(authorDid)) continue;

                    seenDids.current.add(authorDid);
                    
                    const lastViewedString = lastViewedTimestamps.get(authorDid);
                    const lastViewedDate = lastViewedString ? new Date(lastViewedString) : new Date(0);
                    const eventDate = new Date(AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.indexedAt : item.post.indexedAt);

                    newFeeds.push({
                        profile: item.post.author,
                        latestPost: item,
                        hasUnread: eventDate > lastViewedDate,
                        lastActivity: eventDate.toISOString()
                    });
                }
                setProfileFeeds(prev => [...prev, ...newFeeds]);

            } else if (phase === 'follows' && hasMoreFollows.current) {
                const followsRes = await agent.getFollows({ actor: session!.did, limit: 100, cursor: followsCursor.current });
                
                if (!followsRes.data.cursor || followsRes.data.follows.length === 0) {
                    hasMoreFollows.current = false;
                } else {
                    followsCursor.current = followsRes.data.cursor;
                }

                const inactiveFeeds: ProfileFeed[] = [];
                for (const profile of followsRes.data.follows) {
                    if (seenDids.current.has(profile.did)) continue;

                    seenDids.current.add(profile.did);
                    inactiveFeeds.push({
                        profile: profile,
                        hasUnread: false,
                        lastActivity: profile.indexedAt || new Date(0).toISOString(),
                    });
                }
                setProfileFeeds(prev => [...prev, ...inactiveFeeds]);
            }
        } catch (e: any) {
            console.error("Failed to load feed data:", e);
            setError("Could not load data. " + e.message);
        } finally {
            setIsLoadingMore(false);
            isFetching.current = false;
        }
    }, [agent, session, phase, lastViewedTimestamps]);

    // Initial load effect
    useEffect(() => {
        if (!session) return;

        // Reset state for initial load or user change
        setIsLoading(true);
        setProfileFeeds([]);
        setPhase('timeline');
        timelineCursor.current = undefined;
        followsCursor.current = undefined;
        seenDids.current.clear();
        hasMoreTimeline.current = true;
        hasMoreFollows.current = true;
        setError(null);
        isFetching.current = false;

        loadMore().finally(() => {
            setIsLoading(false)
        });
    }, [session, loadMore]);

    // Intersection observer effect
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading) {
                    loadMore();
                }
            },
            { rootMargin: '600px' }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [isLoading, loadMore]);

    // Chaining effect to load follows immediately after timeline finishes
    useEffect(() => {
        if (phase === 'follows' && !hasMoreTimeline.current && hasMoreFollows.current && !isLoading && !isLoadingMore) {
            loadMore();
        }
    }, [phase, isLoading, isLoadingMore, loadMore]);

    if (isLoading) {
        return (
            <div className="mt-2">
                 {[...Array(8)].map((_, i) => (
                     <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                         <div className="w-14 h-14 rounded-full bg-surface-3 flex-shrink-0"></div>
                         <div className="flex-1 min-w-0 border-b border-surface-3 pb-3">
                             <div className="flex justify-between items-center">
                                 <div className="h-5 w-1/2 bg-surface-3 rounded"></div>
                                 <div className="h-4 w-1/6 bg-surface-3 rounded"></div>
                             </div>
                             <div className="mt-2 h-4 w-3/4 bg-surface-3 rounded"></div>
                         </div>
                     </div>
                 ))}
             </div>
        );
    }

    if (error) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl mt-4">{error}</div>;
    }
    
    if (profileFeeds.length === 0 && !isLoading) {
        return (
            <div className="text-center text-on-surface-variant p-8 mt-4">
                <h2 className="text-xl font-bold text-on-surface">Your feed is empty</h2>
                <p>Follow some profiles to see their posts here.</p>
                <a href="#/search" className="mt-4 inline-block bg-primary text-on-primary font-bold py-2 px-6 rounded-full">
                    Find Profiles
                </a>
            </div>
        );
    }

    return (
        <div>
            <ul>
                {profileFeeds.map(feed => (
                    <ProfileFeedItem key={feed.profile.did} profileFeed={feed} currentHash={currentHash} />
                ))}
            </ul>
            <div ref={loaderRef} className="h-20">
                {isLoadingMore && (
                    <div className="flex items-start gap-3 p-3 animate-pulse">
                         <div className="w-14 h-14 rounded-full bg-surface-3 flex-shrink-0"></div>
                         <div className="flex-1 min-w-0 border-b border-surface-3 pb-3">
                             <div className="h-5 w-1/2 bg-surface-3 rounded"></div>
                             <div className="mt-2 h-4 w-3/4 bg-surface-3 rounded"></div>
                         </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default FollowingFeedScreen;