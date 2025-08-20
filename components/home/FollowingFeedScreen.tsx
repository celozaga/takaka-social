
import React, { useState, useEffect, useMemo } from 'react';
import { useAtp } from '../../context/AtpContext';
import {
    AppBskyActorDefs,
    AppBskyFeedDefs,
    BskyAgent
} from '@atproto/api';
import { format, isToday, isYesterday } from 'date-fns';
import { useChannelState } from '../../context/ChannelStateContext';

type ProfileFeed = {
  profile: AppBskyActorDefs.ProfileView;
  latestPost?: AppBskyFeedDefs.FeedViewPost;
  unreadCount: number;
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
                <span className="truncate">{record?.text}</span>
            </div>
        );
    }
    
    return textPreview;
};


const ProfileFeedItem: React.FC<{ profileFeed: ProfileFeed, currentHash: string }> = React.memo(({ profileFeed, currentHash }) => {
    const { profile, latestPost, unreadCount } = profileFeed;
    const isActive = `#/profile/${profile.handle}` === currentHash || `#/profile/${profile.did}` === currentHash;
    const hasUnread = unreadCount > 0;

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
                            <div className="mt-1 bg-primary text-on-primary text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center flex-shrink-0">
                                <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            </a>
        </li>
    );
});

const fetchAllFollows = async (agent: BskyAgent, actor: string) => {
    let follows: AppBskyActorDefs.ProfileView[] = [];
    let cursor: string | undefined;
    do {
        const res = await agent.getFollows({ actor, cursor, limit: 100 });
        if (res.data.follows) {
            follows = follows.concat(res.data.follows);
        }
        cursor = res.data.cursor;
    } while (cursor);
    return follows;
};

const FollowingFeedScreen: React.FC = () => {
    const { agent, session } = useAtp();
    const { lastViewedTimestamps } = useChannelState();
    const [profileFeeds, setProfileFeeds] = useState<ProfileFeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentHash, setCurrentHash] = React.useState(window.location.hash);

    React.useEffect(() => {
        const handler = () => setCurrentHash(window.location.hash);
        window.addEventListener('hashchange', handler);
        return () => window.removeEventListener('hashchange', handler);
    }, []);

    const sortedData = useMemo(() => {
        return [...profileFeeds].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    }, [profileFeeds]);


    useEffect(() => {
        if (!session) return;
        
        let isCancelled = false;

        const BATCH_SIZE = 25;
        const DELAY_BETWEEN_BATCHES = 1000;

        const fetchAndProcessFeeds = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const followedProfiles = await fetchAllFollows(agent, session.did);
                if (isCancelled) return;

                const initialFeedData: ProfileFeed[] = followedProfiles.map(p => ({
                    profile: p,
                    unreadCount: 0,
                    lastActivity: p.indexedAt || new Date(0).toISOString(),
                }));
                setProfileFeeds(initialFeedData);
                setIsLoading(false);

                for (let i = 0; i < followedProfiles.length; i += BATCH_SIZE) {
                    if (isCancelled) return;

                    const batch = followedProfiles.slice(i, i + BATCH_SIZE);
                    
                    const feedPromises = batch.map(async (profile): Promise<ProfileFeed> => {
                        try {
                            const lastViewedString = lastViewedTimestamps.get(profile.did);
                            const lastViewedDate = lastViewedString ? new Date(lastViewedString) : new Date(0);

                            const feedRes = await agent.getAuthorFeed({ actor: profile.did, limit: 30 });
                            const posts = feedRes.data.feed;
                            
                            const unreadCount = posts.filter(item => {
                                const eventDate = new Date(AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.indexedAt : item.post.indexedAt);
                                return eventDate > lastViewedDate;
                            }).length;

                            const latestPost = posts[0];
                            const lastActivity = latestPost
                                ? (AppBskyFeedDefs.isReasonRepost(latestPost.reason) ? latestPost.reason.indexedAt : latestPost.post.indexedAt)
                                : profile.indexedAt || new Date(0).toISOString();

                            return { profile, latestPost, unreadCount, lastActivity };
                        } catch (e) {
                             if (!(e instanceof Error && e.message.includes('RateLimitExceeded'))) {
                                console.warn(`Failed to get feed for ${profile.handle}`, e);
                            }
                            return {
                                profile,
                                latestPost: undefined,
                                unreadCount: 0,
                                lastActivity: profile.indexedAt || new Date(0).toISOString(),
                            };
                        }
                    });

                    const results = await Promise.all(feedPromises);
                    if (isCancelled) return;

                    setProfileFeeds(prevFeeds => {
                        const newFeedsMap = new Map(prevFeeds.map(f => [f.profile.did, f]));
                        results.forEach(result => {
                            if (result) {
                                newFeedsMap.set(result.profile.did, result);
                            }
                        });
                        return Array.from(newFeedsMap.values());
                    });

                    if (i + BATCH_SIZE < followedProfiles.length) {
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                    }
                }
            } catch (e) {
                if (isCancelled) return;
                console.error("Failed to fetch followed profiles:", e);
                setError("Could not load your following feed.");
                setIsLoading(false);
            }
        };

        fetchAndProcessFeeds();

        return () => {
            isCancelled = true;
        };
    }, [agent, session, lastViewedTimestamps]);

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
    
    if (sortedData.length === 0) {
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
                {sortedData.map(feed => (
                    <ProfileFeedItem key={feed.profile.did} profileFeed={feed} currentHash={currentHash} />
                ))}
            </ul>
        </div>
    );
};

export default FollowingFeedScreen;
