import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppBskyActorDefs } from '@atproto/api';
import { useAtp } from './AtpContext';

// Cache structure: Map<actor DID or handle, { profile: ProfileViewDetailed, timestamp: number }>
interface CacheEntry {
    profile: AppBskyActorDefs.ProfileViewDetailed;
    timestamp: number;
}
type ProfileCache = Map<string, CacheEntry>;

interface ProfileCacheContextType {
    getProfile: (actor: string) => Promise<AppBskyActorDefs.ProfileViewDetailed>;
    clearProfile: (actor: string) => void;
}

const ProfileCacheContext = createContext<ProfileCacheContextType | undefined>(undefined);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const ProfileCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cache, setCache] = useState<ProfileCache>(new Map());
    const { agent, publicAgent, publicApiAgent, session } = useAtp();

    const getProfile = useCallback(async (actor: string): Promise<AppBskyActorDefs.ProfileViewDetailed> => {
        const cachedEntry = cache.get(actor);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
            return cachedEntry.profile;
        }

        // Not in cache or stale, fetch from API
        const profileAgent = session ? agent : publicApiAgent;
        console.log('🔍 DEBUG: Profile fetch using agent type:', session ? 'authenticated' : 'public');
        
        const { data } = await profileAgent.getProfile({ actor });
        
        // Update cache
        setCache(prevCache => {
            const newCache = new Map(prevCache);
            // Store by both DID and handle for easier lookup
            newCache.set(data.did, { profile: data, timestamp: Date.now() });
            newCache.set(data.handle, { profile: data, timestamp: Date.now() });
            return newCache;
        });

        return data;
    }, [agent, publicAgent, publicApiAgent, session, cache]);

    const clearProfile = useCallback((actor: string) => {
        // Actor could be a DID or handle, so we need to clear both if they exist
        const cachedEntry = cache.get(actor);
        setCache(prevCache => {
            const newCache = new Map(prevCache);
            newCache.delete(actor);
            if (cachedEntry) {
                // Ensure both DID and handle entries are removed
                newCache.delete(cachedEntry.profile.did);
                newCache.delete(cachedEntry.profile.handle);
            }
            return newCache;
        });
    }, [cache]);

    return (
        <ProfileCacheContext.Provider value={{ getProfile, clearProfile }}>
            {children}
        </ProfileCacheContext.Provider>
    );
};

export const useProfileCache = (): ProfileCacheContextType => {
    const context = useContext(ProfileCacheContext);
    if (!context) {
        throw new Error('useProfileCache must be used within a ProfileCacheProvider');
    }
    return context;
};
