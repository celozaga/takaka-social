
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAtp } from '../context/AtpContext';
import { BskyAgent, AppBskyActorDefs,AppBskyFeedDefs } from '@atproto/api';

// Define the shape of the preferences item for feeds
interface FeedPrefItem {
    id: string; // Typically a timestamp-based unique ID
    value: string; // The AT URI of the feed generator
    pinned: boolean;
}

// Define the shape of the saved feeds preference object
interface SavedFeedsPref {
    $type: 'app.bsky.actor.defs#savedFeedsPref';
    items: FeedPrefItem[];
}

const isSavedFeedsPref = (pref: any): pref is SavedFeedsPref => {
    return pref && pref.$type === 'app.bsky.actor.defs#savedFeedsPref';
};

export const useSavedFeeds = () => {
    const { agent, session } = useAtp();
    const [isLoading, setIsLoading] = useState(true);
    const [preferences, setPreferences] = useState<SavedFeedsPref | null>(null);
    const [feedViews, setFeedViews] = useState<Map<string, AppBskyFeedDefs.GeneratorView>>(new Map());

    const fetchFeeds = useCallback(async () => {
        if (!session) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await agent.app.bsky.actor.getPreferences();
            const savedFeedsPref = data.preferences.find(isSavedFeedsPref);

            if (savedFeedsPref) {
                setPreferences(savedFeedsPref);
                const feedUris = savedFeedsPref.items.map(item => item.value);
                if (feedUris.length > 0) {
                    const { data: generatorsData } = await agent.app.bsky.feed.getFeedGenerators({ feeds: feedUris });
                    const newFeedViews = new Map<string, AppBskyFeedDefs.GeneratorView>();
                    generatorsData.feeds.forEach(feed => newFeedViews.set(feed.uri, feed));
                    setFeedViews(newFeedViews);
                }
            } else {
                // If no pref exists, create a default empty one
                setPreferences({ $type: 'app.bsky.actor.defs#savedFeedsPref', items: [] });
            }
        } catch (error) {
            console.error("Failed to fetch saved feeds:", error);
        } finally {
            setIsLoading(false);
        }
    }, [agent, session]);

    useEffect(() => {
        fetchFeeds();
    }, [fetchFeeds]);

    const savePreferences = useCallback(async (newItems: FeedPrefItem[]) => {
        const { data: currentPrefs } = await agent.app.bsky.actor.getPreferences();
        const otherPrefs = currentPrefs.preferences.filter(p => !isSavedFeedsPref(p));

        const newSavedFeedsPref: SavedFeedsPref = {
            $type: 'app.bsky.actor.defs#savedFeedsPref',
            items: newItems,
        };

        await agent.app.bsky.actor.putPreferences({
            preferences: [...otherPrefs, newSavedFeedsPref as any],
        });

        setPreferences(newSavedFeedsPref);
    }, [agent]);
    
    const pinnedUris = useMemo(() => {
        return new Set(preferences?.items.filter(item => item.pinned).map(item => item.value) || []);
    }, [preferences]);

    const addFeed = useCallback(async (feed:AppBskyFeedDefs.GeneratorView, pin: boolean = false) => {
        const currentItems = preferences?.items || [];
        if (currentItems.some(item => item.value === feed.uri)) return; // Already exists

        const newItem: FeedPrefItem = {
            id: Date.now().toString(),
            value: feed.uri,
            pinned: pin,
        };
        
        await savePreferences([...currentItems, newItem]);
        setFeedViews(prev => new Map(prev).set(feed.uri, feed));
    }, [preferences, savePreferences]);

    const removeFeed = useCallback(async (uri: string) => {
        const currentItems = preferences?.items || [];
        const newItems = currentItems.filter(item => item.value !== uri);
        await savePreferences(newItems);
    }, [preferences, savePreferences]);

    const togglePin = useCallback(async (uri: string) => {
        const currentItems = preferences?.items || [];
        const itemIndex = currentItems.findIndex(item => item.value === uri);
        if (itemIndex === -1) return; // Not a saved feed

        const newItems = [...currentItems];
        const item = newItems[itemIndex];
        newItems[itemIndex] = { ...item, pinned: !item.pinned };

        await savePreferences(newItems);
    }, [preferences, savePreferences]);

    const reorder = useCallback(async (fromIndex: number, toIndex: number) => {
        const currentItems = preferences?.items || [];
        const pinnedItems = currentItems.filter(i => i.pinned);
        const unpinnedItems = currentItems.filter(i => !i.pinned);
        
        if (fromIndex < 0 || fromIndex >= pinnedItems.length || toIndex < 0 || toIndex >= pinnedItems.length) return;

        const [movedItem] = pinnedItems.splice(fromIndex, 1);
        pinnedItems.splice(toIndex, 0, movedItem);

        await savePreferences([...pinnedItems, ...unpinnedItems]);
    }, [preferences, savePreferences]);

    return {
        isLoading,
        preferences,
        feedViews,
        pinnedUris,
        addFeed,
        removeFeed,
        togglePin,
        reorder,
    };
};
