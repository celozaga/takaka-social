

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useAtp } from './AtpContext';
import { AppBskyActorDefs, ComAtprotoLabelDefs } from '@atproto/api';

type Preferences = AppBskyActorDefs.Preferences;
type MutedWord = AppBskyActorDefs.MutedWord;
type LabelVisibility = 'show' | 'warn' | 'hide';
type LabelPreferenceMap = Map<string, LabelVisibility>;

interface ModerationContextType {
    isReady: boolean;
    adultContentEnabled: boolean;
    labelPreferences: LabelPreferenceMap;
    mutedWords: MutedWord[];
    setAdultContentEnabled: (enabled: boolean) => Promise<void>;
    setLabelPreference: (label: string, visibility: LabelVisibility) => Promise<void>;
    addMutedWord: (word: string) => Promise<void>;
    removeMutedWord: (word: string) => Promise<void>;
}

const ModerationContext = createContext<ModerationContextType | undefined>(undefined);

export const ModerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { agent, session } = useAtp();
    const [isReady, setIsReady] = useState(false);
    const [preferences, setPreferences] = useState<Preferences>([]);
    const [adultContentEnabled, setAdultContentEnabledState] = useState(false);
    const [labelPreferences, setLabelPreferences] = useState<LabelPreferenceMap>(new Map());
    const [mutedWords, setMutedWords] = useState<MutedWord[]>([]);

    const parsePreferences = useCallback((prefs: Preferences) => {
        // Adult Content
        const adultContentPref = prefs.find(p => p.$type === 'app.bsky.actor.defs#adultContentPref');
        if (AppBskyActorDefs.isAdultContentPref(adultContentPref)) {
            setAdultContentEnabledState(adultContentPref.enabled);
        } else {
            setAdultContentEnabledState(false);
        }

        // Label Preferences
        const newLabelPrefs = new Map<string, LabelVisibility>();
        const contentLabelPrefs = prefs.filter(p => p.$type === 'app.bsky.actor.defs#contentLabelPref');
        for (const pref of contentLabelPrefs) {
            if (AppBskyActorDefs.isContentLabelPref(pref)) {
                if (['show', 'warn', 'hide'].includes(pref.visibility)) {
                    newLabelPrefs.set(pref.label, pref.visibility as LabelVisibility);
                }
            }
        }
        setLabelPreferences(newLabelPrefs);
        
        // Muted Words
        const mutedWordsPref = prefs.find(p => p.$type === 'app.bsky.actor.defs#mutedWordsPref');
        if (AppBskyActorDefs.isMutedWordsPref(mutedWordsPref) && Array.isArray(mutedWordsPref.items)) {
            setMutedWords(mutedWordsPref.items);
        } else {
            setMutedWords([]);
        }

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
            parsePreferences(preferences); // Revert on failure
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
        if (visibility !== 'show') { // 'show' is the default, so we remove the pref
            const newPref = { $type: 'app.bsky.actor.defs#contentLabelPref', label, visibility };
            newPrefs.push(newPref);
        }
        
        await savePreferences(newPrefs);
    };

    const addMutedWord = async (word: string) => {
        const newWord: MutedWord = { value: word, targets: ['content'], actorTarget: 'all' }; // Default target
        const currentMutedPref = preferences.find(p => p.$type === 'app.bsky.actor.defs#mutedWordsPref');
        const otherPrefs = preferences.filter(p => p.$type !== 'app.bsky.actor.defs#mutedWordsPref');
        
        let updatedItems: MutedWord[] = [];
        if (AppBskyActorDefs.isMutedWordsPref(currentMutedPref)) {
            updatedItems = [...currentMutedPref.items, newWord];
        } else {
            updatedItems = [newWord];
        }

        const newPref = { $type: 'app.bsky.actor.defs#mutedWordsPref', items: updatedItems };
        await savePreferences([...otherPrefs, newPref]);
    };

    const removeMutedWord = async (word: string) => {
        const currentMutedPref = preferences.find(p => p.$type === 'app.bsky.actor.defs#mutedWordsPref');
        if (!AppBskyActorDefs.isMutedWordsPref(currentMutedPref)) return;

        const otherPrefs = preferences.filter(p => p.$type !== 'app.bsky.actor.defs#mutedWordsPref');
        const updatedItems = currentMutedPref.items.filter(item => item.value !== word);
        
        const newPref = { $type: 'app.bsky.actor.defs#mutedWordsPref', items: updatedItems };
        await savePreferences([...otherPrefs, newPref]);
    };

    const value = {
        isReady,
        adultContentEnabled,
        labelPreferences,
        mutedWords,
        setAdultContentEnabled,
        setLabelPreference,
        addMutedWord,
        removeMutedWord,
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