

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

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
                // No preferences found, start with a clean slate.
                v2Pref = { $type: V2_TYPE, items: [] };
            } else if (AppBskyActorDefs.isSavedFeedsPref(feedsPref)) { 
                // V1 preferences found, migrate them robustly.
                const v1 = feedsPref as SavedFeedsPref;
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
                // V2 preferences found, validate and sanitize them.
                const potentialV2 = feedsPref as Partial<SavedFeedsPrefV2>;
                if (Array.isArray(potentialV2.items)) {
                    const validItems = potentialV2.items.filter((item: any): item is SavedFeed => 
                        item &&
                        typeof item.id === 'string' &&
                        item.type === 'feed' &&
                        typeof item.value === 'string' &&
                        typeof item.pinned === 'boolean'
                    );
                    v2Pref = { $type: V2_TYPE, items: validItems };
                } else {
                    // `items` is missing or not an array. Reset to empty.
                    v2Pref = { $type: V2_TYPE, items: [] };
                }
            }

            setPreferences(v2Pref);

            const urisToFetch = v2Pref.items.map(item => item.value).filter(Boolean);
            if (urisToFetch.length > 0) {
                const { data: generators } = await agent.app.bsky.feed.getFeedGenerators({ feeds: urisToFetch });
                setFeedViews(new Map(generators.feeds.map(f => [f.uri, f])));
            } else {
                setFeedViews(new Map());
            }

        } catch (error) {
            console.error("Failed to load feeds:", error);
            toast({ title: t('common.error'), description: t('hooks.loadFeedsError'), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [agent, session, toast, t]);

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
            toast({ title: t('common.error'), description: t('hooks.saveFeedsError'), variant: "destructive" });
            await load(); // Re-fetch to revert optimistic update
        }
    }, [agent, toast, load, t]);
    
    const addFeed = useCallback(async (feed:AppBskyFeedDefs.GeneratorView, pin = false) => {
        if (!session) {
            toast({ title: t('hooks.signInToSave'), description: t('hooks.signInToSaveDescription') });
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
        toast({ title: pin ? t('hooks.feedPinned') : t('hooks.feedSaved') });
    }, [preferences, savePreferences, session, toast, t]);

    const togglePin = useCallback(async (uri: string) => {
        if (!preferences) return;
        
        const newItems = preferences.items.map(item => {
            if (item.value === uri) {
                return { ...item, pinned: !item.pinned };
            }
            return item;
        });

        const newPref = { ...preferences, items: newItems };

        await savePreferences(newPref);
        toast({ title: newPref.items.find(i => i.value === uri)?.pinned ? t('hooks.feedPinned') : t('hooks.feedUnpinned') });
    }, [preferences, savePreferences, toast, t]);
    
    const removeFeed = useCallback(async (uri: string) => {
        if (!preferences) return;
        const newPref: SavedFeedsPrefV2 = {
            ...preferences,
            items: preferences.items.filter(i => i.value !== uri)
        };
        await savePreferences(newPref);
        toast({ title: t('hooks.feedRemoved') });
    }, [preferences, savePreferences, toast, t]);

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
        preferences,
        allUris,
        pinnedUris,
        feedViews,
        load,
        togglePin,
        removeFeed,
        addFeed,
        reorder,
        savePreferences,
    };
};
