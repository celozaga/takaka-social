

import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { 
    AppBskyActorDefs,
    AppBskyFeedDefs, 
    RichText,
    AppBskyEmbedImages,
    AppBskyEmbedRecordWithMedia,
    AppBskyEmbedVideo
} from '@atproto/api';
import { format, isToday, isYesterday } from 'date-fns';
import { useChannelState } from '../../context/ChannelStateContext';

type ProfileFeed = {
  profile: AppBskyActorDefs.ProfileViewBasic;
  latestPost: AppBskyFeedDefs.FeedViewPost;
  unreadCount: number;
};

const formatTimestamp = (dateString: string) => {
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
    if (AppBskyFeedDefs.isReasonRepost(latestPost.reason)) {
        return <span className="text-on-surface-variant italic">Reposted</span>;
    }
    
    const record = latestPost.post.record as any;
    if (record.text) {
        const rt = new RichText({ text: record.text });
        return <>{rt.text}</>;
    }

    if (latestPost.post.embed) {
        const embed = latestPost.post.embed;
        if (AppBskyEmbedImages.isView(embed) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedImages.isView(embed.media))) {
            return <span className="text-on-surface-variant">[Photo]</span>;
        }
        if (AppBskyEmbedVideo.isView(embed) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media))) {
            return <span className="text-on-surface-variant">[Video]</span>;
        }
    }
  
    return <span className="text-on-surface-variant">New post</span>;
}

const ProfileFeedItem: React.FC<{ profileFeed: ProfileFeed, currentHash: string }> = ({ profileFeed, currentHash }) => {
    const { profile, latestPost, unreadCount } = profileFeed;
    const isActive = `#/profile/${profile.handle}` === currentHash;

    const eventTimestamp = AppBskyFeedDefs.isReasonRepost(latestPost.reason) 
        ? latestPost.reason.indexedAt 
        : latestPost.post.indexedAt;

    return (
        <li>
            <a href={`#/profile/${profile.handle}`} className={`flex items-start gap-3 p-3 transition-colors ${isActive ? 'bg-surface-2' : 'hover:bg-surface-2'}`}>
                <img src={profile.avatar} alt={profile.displayName || ''} className="w-14 h-14 rounded-full bg-surface-3 flex-shrink-0" />
                <div className="flex-1 min-w-0 border-b border-surface-3 pb-3">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg truncate">{profile.displayName || profile.handle}</h2>
                        <p className="text-sm text-on-surface-variant flex-shrink-0 ml-2">{formatTimestamp(eventTimestamp)}</p>
                    </div>
                    <div className="flex justify-between items-start mt-0.5">
                        <div className="text-on-surface-variant text-sm line-clamp-2 break-words pr-2">
                           {getPreviewText(latestPost)}
                        </div>
                        {unreadCount > 0 && (
                            <div className="mt-1 bg-primary text-on-primary text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center flex-shrink-0">
                                <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            </a>
        </li>
    );
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

    useEffect(() => {
        if (!session) return;
        
        const fetchAndProcessTimeline = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Fetch main timeline
                const { data } = await agent.getTimeline({ limit: 100 });
                const feedItems = data.feed;

                if (feedItems.length === 0) {
                    setProfileFeeds([]);
                    setIsLoading(false);
                    return;
                }

                // 2. Group items by the actor who performed the action (author or reposter)
                const activityByActor = new Map<string, {
                    profile: AppBskyActorDefs.ProfileViewBasic;
                    items: AppBskyFeedDefs.FeedViewPost[];
                }>();

                for (const item of feedItems) {
                    const actor = AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by : item.post.author;
                    if (!activityByActor.has(actor.did)) {
                        activityByActor.set(actor.did, { profile: actor, items: [] });
                    }
                    activityByActor.get(actor.did)!.items.push(item);
                }

                // 3. Create ProfileFeed for each actor
                const processedFeeds: ProfileFeed[] = [];
                for (const [did, data] of activityByActor.entries()) {
                    const latestPost = data.items[0]; // Timeline is sorted, so first item is latest activity
                    const lastViewedString = lastViewedTimestamps.get(did);
                    let unreadCount = 0;

                    if (lastViewedString) {
                        const lastViewedDate = new Date(lastViewedString);
                        unreadCount = data.items.filter(item => {
                            const eventDate = new Date(
                                AppBskyFeedDefs.isReasonRepost(item.reason) 
                                ? item.reason.indexedAt 
                                : item.post.indexedAt
                            );
                            return eventDate > lastViewedDate;
                        }).length;
                    } else {
                        // If never viewed, all items from this actor are unread
                        unreadCount = data.items.length;
                    }
                    
                    processedFeeds.push({
                        profile: data.profile,
                        latestPost,
                        unreadCount
                    });
                }
                
                // 4. Sort the list of profiles based on their most recent activity
                processedFeeds.sort((a, b) => {
                    const dateA = new Date(AppBskyFeedDefs.isReasonRepost(a.latestPost.reason) ? a.latestPost.reason.indexedAt : a.latestPost.post.indexedAt);
                    const dateB = new Date(AppBskyFeedDefs.isReasonRepost(b.latestPost.reason) ? b.latestPost.reason.indexedAt : b.latestPost.post.indexedAt);
                    return dateB.getTime() - dateA.getTime();
                });
                
                setProfileFeeds(processedFeeds);

            } catch (e) {
                console.error("Failed to fetch and process timeline:", e);
                setError("Could not load your feed.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessTimeline();
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
    
    if (profileFeeds.length === 0) {
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
        </div>
    );
};

export default FollowingFeedScreen;