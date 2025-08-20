import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs, AppBskyFeedDefs, AtUri, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import { format, isToday, isYesterday } from 'date-fns';

type ProfileFeed = {
  profile: AppBskyActorDefs.ProfileView;
  latestPost: AppBskyFeedDefs.FeedViewPost | null;
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


const getPreviewText = (latestPost: AppBskyFeedDefs.FeedViewPost | null): React.ReactNode => {
    if (!latestPost) return <span className="text-on-surface-variant italic">No posts yet.</span>;
    
    if (AppBskyFeedDefs.isReasonRepost(latestPost.reason)) {
        const originalAuthor = latestPost.post.author;
        return (
            <span className="text-on-surface-variant">
                <span className="font-semibold text-on-surface">{latestPost.reason.by.displayName || `@${latestPost.reason.by.handle}`}</span> reposted
            </span>
        );
    }
    
    const record = latestPost.post.record as any;

    if (record.text) {
        return <RichTextRenderer record={record} />;
    }
  
    if (AppBskyEmbedImages.isView(latestPost.post.embed)) {
        return <span className="text-on-surface-variant">[Photo]</span>;
    }
    if (AppBskyEmbedVideo.isView(latestPost.post.embed)) {
        return <span className="text-on-surface-variant">[Video]</span>;
    }
  
    return <span className="text-on-surface-variant">New post</span>;
}

const ProfileFeedItem: React.FC<{ profileFeed: ProfileFeed, currentHash: string }> = ({ profileFeed, currentHash }) => {
    const { profile, latestPost, unreadCount } = profileFeed;
    const isActive = `#/profile/${profile.handle}` === currentHash;

    return (
        <li>
            <a href={`#/profile/${profile.handle}`} className={`flex items-start gap-3 p-3 transition-colors ${isActive ? 'bg-surface-2' : 'hover:bg-surface-2'}`}>
                <img src={profile.avatar} alt={profile.displayName} className="w-14 h-14 rounded-full bg-surface-3 flex-shrink-0" />
                <div className="flex-1 min-w-0 border-b border-surface-3 pb-3">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg truncate">{profile.displayName || profile.handle}</h2>
                        {latestPost && <p className="text-sm text-on-surface-variant flex-shrink-0 ml-2">{formatTimestamp(latestPost.post.indexedAt)}</p>}
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
        
        const fetchFeeds = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data: followsData } = await agent.getFollows({ actor: session.did, limit: 100 });
                const profiles = followsData.follows;

                const authorFeedsPromises = profiles.map(profile =>
                    agent.getAuthorFeed({ actor: profile.did, limit: 25 }) // Fetch up to 25 posts
                        .then(res => ({ profile, feed: res.data.feed }))
                        .catch(() => ({ profile, feed: [] })) // Handle errors for individual feeds
                );
                const authorFeeds = await Promise.all(authorFeedsPromises);

                const combinedFeeds: ProfileFeed[] = authorFeeds.map(({ profile, feed }) => {
                    const latestPost = feed[0] || null;
                    const lastViewedString = localStorage.getItem(`channel-last-viewed:${profile.did}`);
                    let unreadCount = 0;
                    
                    if (latestPost) { // Only calculate if there are posts
                        if (lastViewedString) {
                            const lastViewedDate = new Date(lastViewedString);
                            unreadCount = feed.filter(item => new Date(item.post.indexedAt) > lastViewedDate).length;
                        } else {
                            // If never viewed, all fetched posts are unread.
                            unreadCount = feed.length;
                        }
                    }
                    
                    return { profile, latestPost, unreadCount };
                });

                combinedFeeds.sort((a, b) => {
                    if (!a.latestPost) return 1;
                    if (!b.latestPost) return -1;
                    return new Date(b.latestPost.post.indexedAt).getTime() - new Date(a.latestPost.post.indexedAt).getTime();
                });
                
                setProfileFeeds(combinedFeeds);
            } catch (e) {
                console.error("Failed to fetch followed profiles", e);
                setError("Could not load your feed.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeeds();
    }, [agent, session]);

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