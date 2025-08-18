
import React, { useState, useEffect, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs } from '@atproto/api';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import { Search } from 'lucide-react';

const ActorSkeletonCard: React.FC = () => (
    <div className="p-4 bg-surface-2 rounded-xl border border-surface-3 animate-pulse">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-3 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <div className="min-w-0 space-y-2">
                        <div className="h-4 w-32 bg-surface-3 rounded"></div>
                        <div className="h-3 w-24 bg-surface-3 rounded"></div>
                    </div>
                    <div className="h-8 w-24 bg-surface-3 rounded-full ml-2"></div>
                </div>
                <div className="mt-3 h-3 w-5/6 bg-surface-3 rounded"></div>
            </div>
        </div>
    </div>
);

const SuggestedFollows: React.FC = () => {
    const { agent, session } = useAtp();
    const [profiles, setProfiles] = useState<(AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed)[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session) {
            setIsLoading(false);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const { data } = await agent.app.bsky.actor.getSuggestions({ limit: 15 });
                setProfiles(data.actors);
            } catch (error) {
                console.error(`Failed to fetch suggestions:`, error);
                // Fail silently
                setProfiles([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [agent, session]);

    if (!session || (!isLoading && profiles.length === 0)) {
        return null;
    }

    return (
        <div>
             <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xl font-bold">Suggested Follows</h2>
                <a href="#/search?filter=people" className="p-1 hover:bg-surface-3 rounded-full" aria-label="Find more people">
                    <Search className="w-5 h-5 text-on-surface-variant" />
                </a>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    [...Array(5)].map((_, i) => <ActorSkeletonCard key={i} />)
                ) : (
                    profiles.map(profile => (
                        <ActorSearchResultCard key={profile.did} actor={profile} />
                    ))
                )}
            </div>
        </div>
    );
};

export default SuggestedFollows;
