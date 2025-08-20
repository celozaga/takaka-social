import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import {
    AppBskyActorDefs,
    AppBskyFeedDefs,
    RichText,
    AppBskyEmbedImages,
    AppBskyEmbedRecordWithMedia,
    AppBskyEmbedVideo,
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
    const isRepost = AppBskyFeedDefs.isReasonRepost(latestPost.reason);
    const postToShow = latestPost.post;
    const record = postToShow.record as any;

    let textPreview: React.ReactNode = null;
    if (record.text) {
        textPreview = <>{record.text}</>;
    } else if (postToShow.embed) {
        const embed = postToShow.embed;
        if (AppBskyEmbedImages.isView(embed) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedImages.isView(embed.media))) {
            textPreview = <span className="text-on-surface-variant">[Photo]</span>;
        } else if (AppBskyEmbedVideo.isView(embed) || (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media))) {
            textPreview = <span className="text-on-surface-variant">[Video]</span>;
        }
    }

    if (!textPreview) {
       textPreview = <span className="text-on-surface-variant">New post by {postToShow.author.displayName || `@${postToShow.author.handle}`}</span>;
    }

    if (isRepost) {
        return (
            <div className="flex items-baseline">
                <span className="text-on-surface-variant italic mr-1.5 flex-shrink-0">Reposted:</span>
                <span className="truncate">{textPreview}</span>
            </div>
        );
    }
    
    return textPreview;
};

const ProfileFeedItem: React.FC<{ profileFeed: ProfileFeed, currentHash: string }> = ({ profileFeed, currentHash }) => {
    const { profile, latestPost, unreadCount } = profileFeed;
    const isActive = `#/profile/${profile.handle}` === currentHash;

    const eventTimestamp = latestPost
        ? (AppBskyFeedDefs.isReasonRepost(latestPost.reason) ? latestPost.reason.indexedAt : latestPost.post.indexedAt)
        : profile.indexedAt;

    const previewNode = latestPost
        ? getPreviewText(latestPost)
        : <span className="text-on-surface-variant italic">No recent activity</span>;

    const hasUnread = unreadCount > 0;

    return (
        <li>
            <a href={`#/profile/${profile.handle}`} className={`flex items-start gap-3 p-3 transition-colors ${isActive ? 'bg-surface-2' : 'hover:bg-surface-2'} ${!latestPost ? 'opacity-60' : ''}`}>
                <img src={profile.avatar} alt={profile.displayName || ''} className="w-14 h-14 rounded-full bg-surface-3 flex-shrink-0" />
                <div className="flex-1 min-w-0 border-b border-surface-3 pb-3">
                    <div className="flex justify-between items-center">
                        <h2 className={`font-bold text-lg truncate ${hasUnread ? 'text-on-surface' : 'text-on-surface-variant'}`}>{profile.displayName || profile.handle}</h2>
                        <p className="text-sm text-on-surface-variant flex-shrink-0 ml-2">{formatTimestamp(eventTimestamp)}</p>
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
};


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

    useEffect(() => {
        if (!session) return;
        
        const fetchAndProcessFeeds = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [allFollowedProfiles, timelineRes] = await Promise.all([
                    fetchAllFollows(agent, session.did),
                    agent.getTimeline({ limit: 100 })
                ]);

                const timelineItems = timelineRes.data.feed;

                const profileFeedMap = new Map<string, ProfileFeed>();
                for (const profile of allFollowedProfiles) {
                    profileFeedMap.set(profile.did, {
                        profile,
                        unreadCount: 0,
                        lastActivity: profile.indexedAt,
                    });
                }
                
                for (const item of timelineItems) {
                    const actor = AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.by : item.post.author;
                    
                    if (profileFeedMap.has(actor.did)) {
                        const profileData = profileFeedMap.get(actor.did)!;

                        const lastViewedString = lastViewedTimestamps.get(actor.did);
                        const eventDate = new Date(
                            AppBskyFeedDefs.isReasonRepost(item.reason) ? item.reason.indexedAt : item.post.indexedAt
                        );
                        
                        if (!lastViewedString || new Date(lastViewedString) < eventDate) {
                            profileData.unreadCount += 1;
                        }
                        
                        const currentLastActivity = new Date(profileData.lastActivity);
                        if (eventDate > currentLastActivity) {
                            profileData.latestPost = item;
                            profileData.lastActivity = eventDate.toISOString();
                        }
                    }
                }
                
                const processedFeeds = Array.from(profileFeedMap.values());
                
                processedFeeds.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
                
                setProfileFeeds(processedFeeds);

            } catch (e) {
                console.error("Failed to fetch and process feed:", e);
                setError("Could not load your feed.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessFeeds();

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
