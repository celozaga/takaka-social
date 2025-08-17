
import React, { useState, useEffect, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { useToast } from './ui/use-toast';
import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';
import { Search } from 'lucide-react';

// --- Feed Pinning Logic (replaces a separate hook) ---

const useFeedPinning = () => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const [savedFeedsPref, setSavedFeedsPref] = useState<any>(null);
    const [pinnedUris, setPinnedUris] = useState<Set<string>>(new Set());

    const fetchPreferences = useCallback(async () => {
        if (!session) return;
        try {
            const { data } = await agent.app.bsky.actor.getPreferences();
            const feedsPref = data.preferences.find(
                p => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2' || p.$type === 'app.bsky.actor.defs#savedFeedsPref'
            );
            if (feedsPref) {
                setSavedFeedsPref(feedsPref);
                let uris: string[] = [];
                if (AppBskyActorDefs.isSavedFeedsPrefV2(feedsPref)) {
                     uris = feedsPref.items.filter(item => item.pinned).map(item => item.value);
                } else if (AppBskyActorDefs.isSavedFeedsPref(feedsPref)) {
                     uris = feedsPref.pinned || [];
                }
                setPinnedUris(new Set(uris));
            }
        } catch (error) {
            console.error("Failed to fetch preferences:", error);
        }
    }, [agent, session]);
    
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const togglePin = async (feedUri: string) => {
        if (!session) return;

        let newPref: any;
        const isPinned = pinnedUris.has(feedUri);

        if (!savedFeedsPref) {
            // Create new v2 pref if none exists
            newPref = {
                $type: 'app.bsky.actor.defs#savedFeedsPrefV2',
                items: [{ type: 'feed', value: feedUri, pinned: true }],
            };
        } else if (AppBskyActorDefs.isSavedFeedsPrefV2(savedFeedsPref)) {
            newPref = { ...savedFeedsPref, items: [...savedFeedsPref.items] };
            const existingItem = newPref.items.find((item: any) => item.value === feedUri);

            if (isPinned) {
                if (existingItem) existingItem.pinned = false; // Unpin
            } else {
                if (existingItem) existingItem.pinned = true; // Pin existing
                else newPref.items.push({ type: 'feed', value: feedUri, pinned: true }); // Add and pin
            }
        } else if (AppBskyActorDefs.isSavedFeedsPref(savedFeedsPref)) { // Handle migration from v1
            newPref = {
                $type: 'app.bsky.actor.defs#savedFeedsPrefV2',
                items: [
                    ...(savedFeedsPref.saved || []).map((uri: string) => ({ type: 'feed', value: uri, pinned: (savedFeedsPref.pinned || []).includes(uri) })),
                ]
            };
            const existingItem = newPref.items.find((item: any) => item.value === feedUri);
             if (isPinned) {
                if (existingItem) existingItem.pinned = false;
            } else {
                if (existingItem) existingItem.pinned = true;
                else newPref.items.push({ type: 'feed', value: feedUri, pinned: true });
            }
        }
        
        setSavedFeedsPref(newPref);
        setPinnedUris(prev => {
            const newSet = new Set(prev);
            if (isPinned) newSet.delete(feedUri);
            else newSet.add(feedUri);
            return newSet;
        });

        try {
            await agent.app.bsky.actor.putPreferences({ preferences: [newPref] });
            toast({ title: isPinned ? 'Feed unpinned' : 'Feed pinned to your home screen' });
        } catch (error) {
            console.error('Failed to update pin:', error);
            toast({ title: 'Error', description: 'Could not update your feeds.', variant: 'destructive' });
            fetchPreferences(); // Re-sync with server on error
        }
    };

    return { pinnedUris, togglePin, fetchPreferences };
};


// --- Feed Card Component ---

interface FeedCardProps {
  feed: AppBskyFeedDefs.GeneratorView;
  isPinned: boolean;
  onPinToggle: (uri: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ feed, isPinned, onPinToggle }) => {
  return (
    <div className="p-3 bg-surface-2 rounded-xl border border-surface-3">
        <div className="flex items-start gap-3">
            <img src={feed.avatar} alt={feed.displayName} className="w-12 h-12 rounded-lg bg-surface-3 flex-shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold truncate">{feed.displayName}</h3>
                        <p className="text-sm text-on-surface-variant">Feed by @{feed.creator.handle}</p>
                    </div>
                    <button 
                        onClick={() => onPinToggle(feed.uri)}
                        className={`font-semibold text-sm py-1.5 px-4 rounded-full transition-colors duration-200 flex-shrink-0
                            ${isPinned
                            ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80'
                            : 'bg-primary text-on-primary hover:bg-primary/90'
                            }
                        `}
                    >
                        {isPinned ? 'Unpin' : 'Pin Feed'}
                    </button>
                </div>
                 {feed.description && <p className="text-sm mt-1 text-on-surface line-clamp-2">{feed.description.replace(/\n/g, ' ')}</p>}
            </div>
        </div>
    </div>
  );
};


// --- Main PopularFeeds Component ---

const PopularFeeds: React.FC = () => {
    const { agent } = useAtp();
    const [feeds, setFeeds] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { pinnedUris, togglePin } = useFeedPinning();
    
    useEffect(() => {
        const fetchFeeds = async () => {
            setIsLoading(true);
            try {
                // This is an unspecced API but widely used by clients.
                const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({ limit: 15 });
                setFeeds(response.data.feeds);
            } catch (error) {
                console.error("Failed to fetch popular feeds:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeeds();
    }, [agent]);
    
    return (
        <div>
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xl font-bold">Discover Feeds</h2>
                <Search className="w-5 h-5 text-on-surface-variant" />
            </div>
             {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse"></div>
                    ))}
                </div>
             ) : (
                <div className="space-y-3">
                    {feeds.map(feed => (
                        <FeedCard 
                            key={feed.uri} 
                            feed={feed}
                            isPinned={pinnedUris.has(feed.uri)}
                            onPinToggle={togglePin}
                        />
                    ))}
                </div>
             )}
        </div>
    );
};

export default PopularFeeds;