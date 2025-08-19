import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useAtp } from './AtpContext';
import { AppBskyActorDefs } from '@atproto/api';

// Replaced local type with SDK type to support all preference types.
type Preferences = AppBskyActorDefs.Preferences;

type LabelVisibility = 'show' | 'warn' | 'hide';
type LabelPreferenceMap = Map<string, LabelVisibility>;

interface ModerationContextType {
    isReady: boolean;
    adultContentEnabled: boolean;
    labelPreferences: LabelPreferenceMap;
    setAdultContentEnabled: (enabled: boolean) => Promise<void>;
    setLabelPreference: (label: string, visibility: LabelVisibility) => Promise<void>;
}

const ModerationContext = createContext<ModerationContextType | undefined>(undefined);

export const ModerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { agent, session } = useAtp();
    const [isReady, setIsReady] = useState(false);
    const [preferences, setPreferences] = useState<Preferences>([]);
    const [adultContentEnabled, setAdultContentEnabledState] = useState(false);
    const [labelPreferences, setLabelPreferences] = useState<LabelPreferenceMap>(new Map());

    const parsePreferences = useCallback((prefs: Preferences) => {
        const adultContentPref = prefs.find(p => p.$type === 'app.bsky.actor.defs#adultContentPref');
        if (AppBskyActorDefs.isAdultContentPref(adultContentPref)) {
            setAdultContentEnabledState(adultContentPref.enabled);
        } else {
            setAdultContentEnabledState(false);
        }

        const newLabelPrefs = new Map<string, LabelVisibility>();
        const contentLabelPrefs = prefs.filter(p => p.$type === 'app.bsky.actor.defs#contentLabelPref');
        for (const pref of contentLabelPrefs) {
            if (AppBskyActorDefs.isContentLabelPref(pref)) {
                // Fix: Only accept valid visibility values for our app's type.
                if (pref.visibility === 'show' || pref.visibility === 'warn' || pref.visibility === 'hide') {
                    newLabelPrefs.set(pref.label, pref.visibility as LabelVisibility);
                }
            }
        }
        setLabelPreferences(newLabelPrefs);
    }, []);

    const fetchPreferences = useCallback(async () => {
        if (!session) {
            setIsReady(true);
            return;
        }
        try {
            const { data } = await agent.app.bsky.actor.getPreferences();
            setPreferences(data.preferences);
            parsePreferences(data.preferences);
        } catch (error) {
            console.error("Failed to fetch moderation preferences:", error);
        } finally {
            setIsReady(true);
        }
    }, [agent, session, parsePreferences]);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const savePreferences = async (newPrefs: Preferences) => {
        try {
            await agent.app.bsky.actor.putPreferences({ preferences: newPrefs });
            setPreferences(newPrefs);
            parsePreferences(newPrefs);
        } catch (error) {
            console.error("Failed to save moderation preferences:", error);
            // Revert on failure
            parsePreferences(preferences);
        }
    };
    
    const setAdultContentEnabled = async (enabled: boolean) => {
        const otherPrefs = preferences.filter(p => p.$type !== 'app.bsky.actor.defs#adultContentPref');
        const newPref = { $type: 'app.bsky.actor.defs#adultContentPref', enabled };
        await savePreferences([...otherPrefs, newPref]);
    };

    const setLabelPreference = async (label: string, visibility: LabelVisibility) => {
        const otherPrefs = preferences.filter(
            p => !(p.$type === 'app.bsky.actor.defs#contentLabelPref' && (p as AppBskyActorDefs.ContentLabelPref).label === label)
        );

        let newPrefs: Preferences = [...otherPrefs];
        if (visibility !== 'show') {
            const newPref = {
                $type: 'app.bsky.actor.defs#contentLabelPref',
                label,
                visibility
            };
            newPrefs.push(newPref);
        }
        
        await savePreferences(newPrefs);
    };

    const value = {
        isReady,
        adultContentEnabled,
        labelPreferences,
        setAdultContentEnabled,
        setLabelPreference,
    };

    return (
        <ModerationContext.Provider value={value}>
            {children}
        </ModerationContext.Provider>
    );
};

export const useModeration = (): ModerationContextType => {
    const context = useContext(ModerationContext);
    if (!context) {
        throw new Error('useModeration must be used within a ModerationProvider');
    }
    return context;
};
