
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs, AppBskyFeedDefs, AtUri, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import { format, isToday, isYesterday } from 'date-fns';

type ProfileFeed = {
  profile: AppBskyActorDefs.ProfileView;
  latestPost: AppBskyFeedDefs.FeedViewPost | null;
  isUnread: boolean;
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

const ProfileFeedItem: React.FC<{ profileFeed: ProfileFeed }> = ({ profileFeed }) => {
    const { profile, latestPost, isUnread } = profileFeed;

    return (
        <li>
            <a href={`#/profile/${profile.handle}`} className="flex items-start gap-3 p-3 hover:bg-surface-2 transition-colors">
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
                        {isUnread && (
                            <div className="mt-1 w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
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

    useEffect(() => {
        if (!session) return;
        
        const fetchFeeds = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data: followsData } = await agent.getFollows({ actor: session.did, limit: 100 });
                const profiles = followsData.follows;

                const latestPostsPromises = profiles.map(profile =>
                    agent.getAuthorFeed({ actor: profile.did, limit: 1 })
                        .then(res => res.data.feed[0] || null)
                        .catch(() => null)
                );
                const latestPosts = await Promise.all(latestPostsPromises);

                const combinedFeeds: ProfileFeed[] = profiles.map((profile, index) => {
                    const latestPost = latestPosts[index];
                    let isUnread = false;
                    if (latestPost) {
                        const lastViewed = localStorage.getItem(`channel-last-viewed:${profile.did}`);
                        if (!lastViewed || new Date(latestPost.post.indexedAt) > new Date(lastViewed)) {
                            isUnread = true;
                        }
                    }
                    return { profile, latestPost, isUnread };
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
                    <ProfileFeedItem key={feed.profile.did} profileFeed={feed} />
                ))}
            </ul>
        </div>
    );
};

export default FollowingFeedScreen;
