
import { useState, useEffect, useCallback } from 'react';
import { useAtp } from '../context/AtpContext';
import { useToast } from '../components/ui/use-toast';
import { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';

type SavedFeedsPrefV2 = AppBskyActorDefs.SavedFeedsPrefV2;
type SavedFeedsPref = AppBskyActorDefs.SavedFeedsPref;
type SavedFeed = AppBskyActorDefs.SavedFeed;

const V2_TYPE = 'app.bsky.actor.defs#savedFeedsPrefV2';
const V1_TYPE = 'app.bsky.actor.defs#savedFeedsPref';

export const useSavedFeeds = () => {
    const { agent, session } = useAtp();
    const { toast } = useToast();

    const [preferences, setPreferences] = useState<SavedFeedsPrefV2 | undefined>(undefined);
    const [feedViews, setFeedViews] = useState<Map<string, AppBskyFeedDefs.GeneratorView>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    const pinnedUris = new Set(preferences?.items.filter(item => item.pinned).map(item => item.value) || []);
    const allUris = preferences?.items.map(item => item.value) || [];

    const load = useCallback(async () => {
        if (!session) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await agent.app.bsky.actor.getPreferences();
            const feedsPref = data.preferences.find(p => p.$type === V2_TYPE || p.$type === V1_TYPE);

            let v2Pref: SavedFeedsPrefV2;

            if (!feedsPref) {
                v2Pref = { $type: V2_TYPE, items: [] };
            } else if (AppBskyActorDefs.isSavedFeedsPref(feedsPref)) { // V1 pref, needs migration
                const v1 = feedsPref as SavedFeedsPref;
                
                // Robustly handle potentially malformed v1 preferences
                const pinnedUrisV1 = Array.isArray(v1.pinned) ? v1.pinned.filter(u => typeof u === 'string') : [];
                const savedUrisV1 = Array.isArray(v1.saved) ? v1.saved.filter(u => typeof u === 'string') : [];
                
                const allV1Uris = [...new Set([...pinnedUrisV1, ...savedUrisV1])];
                
                v2Pref = {
                    $type: V2_TYPE,
                    items: allV1Uris.map(uri => ({
                        id: crypto.randomUUID(),
                        type: 'feed',
                        value: uri,
                        pinned: pinnedUrisV1.includes(uri),
                    }))
                };
            } else {
                v2Pref = feedsPref as SavedFeedsPrefV2;
            }

            setPreferences(v2Pref);

            const urisToFetch = v2Pref.items.map(item => item.value);
            if (urisToFetch.length > 0) {
                const { data: generators } = await agent.app.bsky.feed.getFeedGenerators({ feeds: urisToFetch });
                setFeedViews(new Map(generators.feeds.map(f => [f.uri, f])));
            } else {
                setFeedViews(new Map());
            }

        } catch (error) {
            console.error("Failed to load feeds:", error);
            toast({ title: "Error", description: "Could not load your feeds.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [agent, session, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const savePreferences = useCallback(async (newPreferences: SavedFeedsPrefV2) => {
        try {
            const { data: currentData } = await agent.app.bsky.actor.getPreferences();

            // Filter out old feed preferences (v1 or v2) to avoid duplication
            const otherPreferences = currentData.preferences.filter(
                p => p.$type !== V2_TYPE && p.$type !== V1_TYPE
            );
            
            // Construct the new list of all preferences
            const finalPreferences = [...otherPreferences, { ...newPreferences, $type: V2_TYPE }];

            await agent.app.bsky.actor.putPreferences({ preferences: finalPreferences });
            setPreferences(newPreferences);
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast({ title: "Error", description: "Your changes could not be saved.", variant: "destructive" });
            await load(); // Re-fetch to revert optimistic update
        }
    }, [agent, toast, load]);
    
    const addFeed = useCallback(async (feed: AppBskyFeedDefs.GeneratorView, pin = false) => {
        if (!session) {
            toast({ title: "Please sign in", description: "You must be signed in to save feeds." });
            return;
        }
        setFeedViews(prev => new Map(prev).set(feed.uri, feed));
        
        const newPref: SavedFeedsPrefV2 = {
            $type: V2_TYPE,
            items: [...(preferences?.items || [])]
        };
        
        const existing = newPref.items.find(item => item.value === feed.uri);
        if (existing) {
            existing.pinned = pin; // Update pinning status if it exists
        } else {
            newPref.items.push({ id: crypto.randomUUID(), type: 'feed', value: feed.uri, pinned: pin });
        }

        await savePreferences(newPref);
        toast({ title: pin ? 'Feed Pinned' : 'Feed Saved' });
    }, [preferences, savePreferences, session, toast]);

    const togglePin = useCallback(async (uri: string) => {
        if (!preferences) return;
        const newPref = { ...preferences, items: [...preferences.items] };
        const item = newPref.items.find(i => i.value === uri);
        if (item) {
            item.pinned = !item.pinned;
            await savePreferences(newPref);
            toast({ title: item.pinned ? 'Feed Pinned' : 'Feed Unpinned' });
        }
    }, [preferences, savePreferences, toast]);
    
    const removeFeed = useCallback(async (uri: string) => {
        if (!preferences) return;
        const newPref: SavedFeedsPrefV2 = {
            ...preferences,
            items: preferences.items.filter(i => i.value !== uri)
        };
        await savePreferences(newPref);
        toast({ title: 'Feed Removed' });
    }, [preferences, savePreferences, toast]);

    const reorder = useCallback(async (from: number, to: number) => {
        if (!preferences) return;
        
        const pinned = preferences.items.filter(i => i.pinned);
        const unpinned = preferences.items.filter(i => !i.pinned);

        const [moved] = pinned.splice(from, 1);
        pinned.splice(to, 0, moved);

        const newPref: SavedFeedsPrefV2 = {
            ...preferences,
            items: [...pinned, ...unpinned]
        };

        await savePreferences(newPref);
    }, [preferences, savePreferences]);


    return {
        isLoading,
        allUris,
        pinnedUris,
        feedViews,
        load,
        togglePin,
        removeFeed,
        addFeed,
        reorder,
    };
};
