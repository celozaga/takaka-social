import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { useAtp } from './AtpContext';

const PREF_TYPE = 'social.takaka.app.defs#channelLastViewedPref';

// Interface for our custom preference object
interface ChannelLastViewedPref {
    $type: typeof PREF_TYPE;
    channels: { [did: string]: string }; // Map of did -> ISO timestamp string
}

// Type guard to identify our custom preference
const isChannelLastViewedPref = (pref: any): pref is ChannelLastViewedPref => {
    return pref && pref.$type === PREF_TYPE;
};

type LastViewedMap = Map<string, string>; // did -> ISO timestamp

interface ChannelStateContextType {
  lastViewedTimestamps: LastViewedMap;
  getLastViewedAt: (did: string) => string | undefined;
  markChannelReadUpTo: (did: string, isoTimestamp: string) => Promise<void>;
  refreshFromServer: () => Promise<void>;
}

const ChannelStateContext = createContext<ChannelStateContextType | undefined>(undefined);

export const ChannelStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { agent, session } = useAtp();
  const [lastViewedTimestamps, setLastViewedTimestamps] = useState<LastViewedMap>(new Map());
  const isFetching = useRef(false);
  const isPutting = useRef(false);

  // Helper to extract our preference from the list of all preferences
  const extractOurPref = (prefs: any[]): Record<string, string> => {
    const pref = prefs.find(isChannelLastViewedPref);
    return pref?.channels ?? {};
  };

  // Helper to build the new preferences array, merging our changes
  const buildNewPrefs = (currentPrefs: any[], updatedChannels: Record<string, string>): any[] => {
    const otherPrefs = currentPrefs.filter((p) => !isChannelLastViewedPref(p));
    return [
      ...otherPrefs,
      { $type: PREF_TYPE, channels: updatedChannels }
    ];
  };

  const refreshFromServer = useCallback(async () => {
    if (!session || !agent || isFetching.current) return;
    try {
      isFetching.current = true;
      const { data } = await agent.app.bsky.actor.getPreferences({});
      const channels = extractOurPref(data.preferences ?? []);
      setLastViewedTimestamps(new Map(Object.entries(channels)));
    } catch (error) {
        console.error("Failed to refresh channel state from server:", error);
    }
    finally {
      isFetching.current = false;
    }
  }, [agent, session]);

  // Effect for initial load and periodic synchronization
  useEffect(() => {
    if (!session) {
      setLastViewedTimestamps(new Map()); // Clear state on logout
      return;
    };

    refreshFromServer();

    const intervalId = setInterval(refreshFromServer, 20000); // 20s polling
    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            refreshFromServer();
        }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [session, refreshFromServer]);

  const getLastViewedAt = useCallback((did: string) => lastViewedTimestamps.get(did), [lastViewedTimestamps]);

  const markChannelReadUpTo = useCallback(async (did: string, isoTimestamp: string) => {
    if (!session || !agent || isPutting.current) return;

    // Check if an update is necessary to avoid needless writes
    const currentTimestamp = lastViewedTimestamps.get(did);
    if (currentTimestamp && new Date(isoTimestamp) <= new Date(currentTimestamp)) {
        return; // No update needed
    }

    // Optimistic update
    const newTimestamps = new Map(lastViewedTimestamps);
    newTimestamps.set(did, isoTimestamp);
    setLastViewedTimestamps(newTimestamps);

    try {
        isPutting.current = true;
        // Persist to PDS Preferences
        const { data } = await agent.app.bsky.actor.getPreferences({});
        const currentPrefs = data.preferences ?? [];
        const currentChannels = extractOurPref(currentPrefs);

        const prevIsoOnServer = currentChannels[did];
        // Only write if our new timestamp is newer than what's on the server
        if (!prevIsoOnServer || new Date(isoTimestamp) > new Date(prevIsoOnServer)) {
            currentChannels[did] = isoTimestamp;
            const newPrefsPayload = buildNewPrefs(currentPrefs, currentChannels);
            await agent.app.bsky.actor.putPreferences({ preferences: newPrefsPayload });
        }
    } catch(error) {
        console.error("Failed to persist channel read state:", error);
        // On failure, revert the optimistic update by refreshing from the server's source of truth
        refreshFromServer();
    } finally {
        isPutting.current = false;
    }
  }, [agent, session, lastViewedTimestamps, refreshFromServer]);

  return (
    <ChannelStateContext.Provider value={{ lastViewedTimestamps, getLastViewedAt, markChannelReadUpTo, refreshFromServer }}>
      {children}
    </ChannelStateContext.Provider>
  );
};

export const useChannelState = () => {
  const ctx = useContext(ChannelStateContext);
  if (!ctx) throw new Error('useChannelState must be used within ChannelStateProvider');
  return ctx;
};
