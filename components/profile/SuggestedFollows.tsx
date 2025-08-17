
import React, { useState, useEffect, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs } from '@atproto/api';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import { Search } from 'lucide-react';

const CATEGORIES = [
    { id: 'foryou', name: 'For You' },
    { id: 'artists', name: 'Art', url: 'https://raw.githubusercontent.com/bluesky-social/directory/main/src/data/people/artists.json' },
    { id: 'scientists', name: 'Science', url: 'https://raw.githubusercontent.com/bluesky-social/directory/main/src/data/people/scientists.json' },
    { id: 'journalists', name: 'News', url: 'https://raw.githubusercontent.com/bluesky-social/directory/main/src/data/people/journalists.json' },
    { id: 'gaming', name: 'Gaming', url: 'https://raw.githubusercontent.com/bluesky-social/directory/main/src/data/people/gaming.json'},
    { id: 'dev', name: 'Developers', url: 'https://raw.githubusercontent.com/bluesky-social/directory/main/src/data/people/dev.json' },
];

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
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
    const [profiles, setProfiles] = useState<(AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed)[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuggestions = useCallback(async (category_id: string) => {
        if (!session) return;
        setIsLoading(true);
        setProfiles([]);

        try {
            if (category_id === 'foryou') {
                const { data } = await agent.app.bsky.actor.getSuggestions({ limit: 25 });
                setProfiles(data.actors);
            } else {
                const category = CATEGORIES.find(c => c.id === category_id);
                if (category && category.url) {
                    const response = await fetch(category.url);
                    const data = await response.json();
                    const handles = data.handles as string[];
                    // Fetch a random subset to keep it fresh and performant
                    const randomHandles = handles.sort(() => 0.5 - Math.random()).slice(0, 25);
                    const { data: profileData } = await agent.getProfiles({ actors: randomHandles });
                    setProfiles(profileData.profiles);
                }
            }
        } catch (error) {
            console.error(`Failed to fetch suggestions for ${category_id}:`, error);
        } finally {
            setIsLoading(false);
        }

    }, [agent, session]);
    
    useEffect(() => {
        fetchSuggestions(activeCategory);
    }, [activeCategory, fetchSuggestions]);
    
    if (!session) {
        return null; // Don't show this component to logged-out users
    }

    return (
        <div>
             <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xl font-bold">Suggested Follows</h2>
                <Search className="w-5 h-5 text-on-surface-variant" />
            </div>

            <div className="no-scrollbar -mx-4 px-4 flex items-center gap-2 overflow-x-auto pb-2 mb-3">
                 {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap
                            ${activeCategory === cat.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-3'}
                        `}
                    >
                        {cat.name}
                    </button>
                ))}
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
