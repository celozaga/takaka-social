

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { BskyAgent, AtpSessionData, AtpSessionEvent } from '@atproto/api';
import { PDS_URL } from '../lib/config';
import { useToast } from '../components/ui/use-toast';
import * as SecureStore from 'expo-secure-store';

const ATP_SESSION_KEY = 'atp-session';

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

  const agent = useMemo(() => new BskyAgent({
    service: PDS_URL,
    persistSession: async (evt: AtpSessionEvent, sess?: AtpSessionData) => {
      switch (evt) {
        case 'create':
        case 'update':
          if (sess) {
            await SecureStore.setItemAsync(ATP_SESSION_KEY, JSON.stringify(sess));
            setSession(sess);
          } else {
            await SecureStore.deleteItemAsync(ATP_SESSION_KEY);
            setSession(null);
          }
          break;
        case 'create-failed':
            await SecureStore.deleteItemAsync(ATP_SESSION_KEY);
            setSession(null);
            break;
      }
    },
  }), []);

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
  
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | undefined;
    let pauseTimeout: ReturnType<typeof setTimeout> | undefined;

    const pollFunction = async () => {
      if (isPollingPaused || !agent.hasSession) return;
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

    const initialize = async () => {
      setIsLoadingSession(true);
      const storedSessionString = await SecureStore.getItemAsync(ATP_SESSION_KEY);
      if (storedSessionString) {
        try {
          const parsedSession = JSON.parse(storedSessionString);
          await agent.resumeSession(parsedSession);
          setSession(parsedSession);
          await fetchUnreadCount().catch(() => {
            // Ignore initial fetch errors, polling will handle it
          });
          pollInterval = setInterval(pollFunction, 30000);
        } catch (error) {
          console.error("Failed to resume session:", error);
          await SecureStore.deleteItemAsync(ATP_SESSION_KEY);
          setSession(null);
        }
      }
      setIsLoadingSession(false);
    };

    initialize();
    
    return () => {
        if (pollInterval) clearInterval(pollInterval);
        if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [agent, fetchUnreadCount, isPollingPaused, toast]);

  const login = async (params: { identifier: string; appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string; token?: string; }) => {
    const { identifier, appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE, token } = params;
    const response = await agent.login({ identifier, password: appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE, authFactorToken: token });
    if(agent.session) {
        setSession(agent.session);
        await fetchUnreadCount();
    }
    return response;
  };

  const logout = async () => {
    await agent.logout();
    setSession(null);
    setUnreadCount(0);
  };

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