import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { BskyAgent, AtpSessionData, AtpSessionEvent } from '@atproto/api';
import { PDS_URL } from '../lib/config';
import { useToast } from '../components/ui/use-toast';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ATP_SESSION_KEY = 'atp-session';

// Create a cross-platform storage adapter.
// On native, it uses the secure keychain.
// On web, it uses localStorage via AsyncStorage, which is persistent and standard.
const sessionStore = {
    getItem: () => {
        return Platform.OS === 'web' ? AsyncStorage.getItem(ATP_SESSION_KEY) : getItemAsync(ATP_SESSION_KEY);
    },
    setItem: (value: string) => {
        return Platform.OS === 'web' ? AsyncStorage.setItem(ATP_SESSION_KEY, value) : setItemAsync(ATP_SESSION_KEY, value);
    },
    deleteItem: () => {
        return Platform.OS === 'web' ? AsyncStorage.removeItem(ATP_SESSION_KEY) : deleteItemAsync(ATP_SESSION_KEY);
    }
};


interface AtpContextType {
  agent: BskyAgent;
  session: AtpSessionData | null;
  isLoadingSession: boolean;
  login: (params: { identifier: string; appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string; token?: string; }) => Promise<any>;
  logout: () => Promise<void>;
  unreadCount: number;
  resetUnreadCount: () => void;
}

const AtpContext = createContext<AtpContextType | undefined>(undefined);

export const AtpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AtpSessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPollingPaused, setIsPollingPaused] = useState(false);
  const { toast } = useToast();

  // The agent is now configured with the `persistSession` callback, which is the
  // recommended way to handle session lifecycle events. This centralizes all
  // session storage logic and ensures it's synchronized with the agent's state.
  const agent = useMemo(() => new BskyAgent({
    service: PDS_URL,
    persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
      switch (evt) {
        case 'create':
        case 'update':
          if (sess) {
            sessionStore.setItem(JSON.stringify(sess));
            setSession(sess); // Keep React state in sync with the agent
          }
          break;
        case 'expired':
        case 'create-failed':
          sessionStore.deleteItem();
          setSession(null); // Clear React state
          break;
      }
    },
  }), []);
  
  // Effect for one-time session initialization
  useEffect(() => {
    const initialize = async () => {
      setIsLoadingSession(true);
      try {
        const storedSessionString = await sessionStore.getItem();
        if (storedSessionString) {
          const parsedSession = JSON.parse(storedSessionString);
          await agent.resumeSession(parsedSession);
          // `resumeSession` triggers the `update` event in `persistSession`,
          // which automatically calls `setSession` and keeps the state consistent.
        }
      } catch (error) {
        console.error("Failed to resume session:", error);
        await sessionStore.deleteItem();
        setSession(null);
      } finally {
        setIsLoadingSession(false);
      }
    };
    initialize();
  }, [agent]);

  const fetchUnreadCount = useCallback(async () => {
    if (!agent.hasSession) return;
    try {
      const { data } = await agent.app.bsky.notification.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      throw error;
    }
  }, [agent]);

  // Effect for polling, which depends on the session status
  useEffect(() => {
    if (!session) {
      setUnreadCount(0);
      return;
    }

    let pollInterval: ReturnType<typeof setInterval> | undefined;
    let pauseTimeout: ReturnType<typeof setTimeout> | undefined;

    const pollFunction = async () => {
      if (isPollingPaused) return;
      try {
        await fetchUnreadCount();
      } catch (error: any) {
        if (error && error.status === 429) {
          console.warn("Rate limit hit. Pausing polling for 60 seconds.");
          setIsPollingPaused(true);
          toast({
              title: "Rate limit reached",
              description: "Too many requests. Will retry automatically in a minute.",
              variant: "destructive"
          });
          if (pauseTimeout) clearTimeout(pauseTimeout);
          pauseTimeout = setTimeout(() => {
              setIsPollingPaused(false);
              console.log("Resuming polling.");
          }, 60000);
        }
      }
    };

    fetchUnreadCount().catch(() => {}); // Initial fetch
    pollInterval = setInterval(pollFunction, 30000);

    return () => {
        if (pollInterval) clearInterval(pollInterval);
        if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [session, fetchUnreadCount, isPollingPaused, toast]);
  
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const login = useCallback(async (params: { identifier: string; appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string; token?: string; }) => {
    // The agent's login method will now automatically trigger the `persistSession`
    // callback, which handles storing the session and updating React state.
    const response = await agent.login({ identifier: params.identifier, password: params.appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE, authFactorToken: params.token });
    await fetchUnreadCount();
    return response;
  }, [agent, fetchUnreadCount]);

  const logout = useCallback(async () => {
    // The agent's logout method will automatically trigger the 'expired' event
    // in `persistSession`, handling the cleanup.
    await agent.logout();
  }, [agent]);

  return (
    <AtpContext.Provider value={{ 
        agent, session, isLoadingSession, login, logout, 
        unreadCount, resetUnreadCount
    }}>
      {children}
    </AtpContext.Provider>
  );
};

export const useAtp = (): AtpContextType => {
  const context = useContext(AtpContext);
  if (!context) {
    throw new Error('useAtp must be used within an AtpProvider');
  }
  return context;
};
