
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useAtp } from './AtpContext';

// Define the shape of our custom preference object
const PREF_TYPE = 'social.takaka.app.defs#channelLastViewedPref';

interface ChannelLastViewedPref {
    $type: typeof PREF_TYPE;
    channels: { [did: string]: string }; // Map of did -> ISO timestamp string
}

const isChannelLastViewedPref = (pref: any): pref is ChannelLastViewedPref => {
    return pref && pref.$type === PREF_TYPE;
};

interface ChannelStateContextType {
  lastViewedTimestamps: Map<string, string>;
  updateLastViewedTimestamp: (did: string) => void;
}

const ChannelStateContext = createContext<ChannelStateContextType | undefined>(undefined);

export const ChannelStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { agent, session } = useAtp();
  const [lastViewedTimestamps, setLastViewedTimestamps] = useState<Map<string, string>>(new Map());

  // Fetch preferences on initial load
  useEffect(() => {
    if (!session) return;

    const fetchPrefs = async () => {
      try {
        const { data } = await agent.app.bsky.actor.getPreferences();
        const lastViewedPref = data.preferences.find(isChannelLastViewedPref);

        if (lastViewedPref && lastViewedPref.channels) {
          setLastViewedTimestamps(new Map(Object.entries(lastViewedPref.channels)));
        }
      } catch (error) {
        console.error("Failed to fetch channel state preferences:", error);
      }
    };
    fetchPrefs();
  }, [agent, session]);

  const updateLastViewedTimestamp = useCallback(async (did: string) => {
    if (!session) return;
    
    const newTimestamp = new Date().toISOString();
    
    // Optimistically update local state for immediate UI feedback
    setLastViewedTimestamps(prev => new Map(prev).set(did, newTimestamp));

    // Persist to server
    try {
        const { data: currentPrefsData } = await agent.app.bsky.actor.getPreferences();
        const otherPrefs = currentPrefsData.preferences.filter(p => !isChannelLastViewedPref(p));
        
        const currentLastViewedPref = currentPrefsData.preferences.find(isChannelLastViewedPref);
        const currentChannels = currentLastViewedPref?.channels || {};
        
        const newLastViewedPref: ChannelLastViewedPref = {
            $type: PREF_TYPE,
            channels: {
                ...currentChannels,
                [did]: newTimestamp,
            }
        };

        await agent.app.bsky.actor.putPreferences({
            preferences: [...otherPrefs, newLastViewedPref as any],
        });
    } catch (error) {
        console.error("Failed to save channel state preferences:", error);
        // Could add logic to revert optimistic update here if needed
    }
  }, [agent, session]);

  return (
    <ChannelStateContext.Provider value={{ lastViewedTimestamps, updateLastViewedTimestamp }}>
      {children}
    </ChannelStateContext.Provider>
  );
};

export const useChannelState = (): ChannelStateContextType => {
  const context = useContext(ChannelStateContext);
  if (!context) {
    throw new Error('useChannelState must be used within a ChannelStateProvider');
  }
  return context;
};
