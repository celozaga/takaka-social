
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs } from '@atproto/api';
import { Loader2, BadgeCheck } from 'lucide-react';

const ChannelItem: React.FC<{ profile: AppBskyActorDefs.ProfileView }> = ({ profile }) => {
    return (
        <li>
            <a href={`#/profile/${profile.handle}`} className="flex items-center gap-4 p-3 hover:bg-surface-2 rounded-lg transition-colors">
                <img src={profile.avatar} alt={profile.displayName} className="w-14 h-14 rounded-full bg-surface-3" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h2 className="font-bold text-lg truncate">{profile.displayName || profile.handle}</h2>
                        {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                            <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                        )}
                    </div>
                    <p className="text-on-surface-variant truncate">@{profile.handle}</p>
                </div>
            </a>
        </li>
    );
};


const ChannelsScreen: React.FC = () => {
    const { agent, session } = useAtp();
    const [following, setFollowing] = useState<AppBskyActorDefs.ProfileView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;
        
        const fetchFollowing = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // In a real app with many follows, this would need pagination.
                // For this concept, we fetch up to 100.
                const { data } = await agent.getFollows({ actor: session.did, limit: 100 });
                setFollowing(data.follows);
            } catch (e) {
                console.error("Failed to fetch following list", e);
                setError("Could not load your channels.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFollowing();
    }, [agent, session]);

    if (isLoading) {
        return (
            <div className="space-y-2 mt-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                        <div className="w-14 h-14 rounded-full bg-surface-3"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-3/4 bg-surface-3 rounded"></div>
                            <div className="h-4 w-1/2 bg-surface-3 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-error p-8 bg-surface-2 rounded-xl mt-4">{error}</div>;
    }
    
    if (following.length === 0) {
        return (
            <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl mt-4">
                <h2 className="text-xl font-bold text-on-surface">Your inbox is empty</h2>
                <p>Follow some channels to see them here.</p>
                <a href="#/search" className="mt-4 inline-block bg-primary text-on-primary font-bold py-2 px-6 rounded-full">
                    Find Channels
                </a>
            </div>
        );
    }

    return (
        <div>
            <ul>
                {following.map(profile => (
                    <ChannelItem key={profile.did} profile={profile} />
                ))}
            </ul>
        </div>
    );
};

export default ChannelsScreen;
