
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { BskyAgent, AtpSessionData, AtpSessionEvent, AppBskyActorDefs } from '@atproto/api';
import { PDS_URL } from '../lib/config';

interface AtpContextType {
  agent: BskyAgent;
  session: AtpSessionData | null;
  profile: AppBskyActorDefs.ProfileViewDetailed | null;
  isLoadingSession: boolean;
  chatSupported: boolean | null;
  login: (identifier: string, appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string) => Promise<any>;
  logout: () => Promise<void>;
  unreadCount: number;
  resetUnreadCount: () => void;
}

const AtpContext = createContext<AtpContextType | undefined>(undefined);

export const AtpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AtpSessionData | null>(null);
  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatSupported, setChatSupported] = useState<boolean | null>(null);

  const agent = useMemo(() => new BskyAgent({
    service: PDS_URL,
    persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
      switch (evt) {
        case 'create':
        case 'update':
          if (sess) {
            localStorage.setItem('atp-session', JSON.stringify(sess));
            setSession(sess);
          } else {
            // If sess is undefined, the session has been cleared.
            localStorage.removeItem('atp-session');
            setSession(null);
            setProfile(null);
          }
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
    }
  }, [agent]);
  
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);


  useEffect(() => {
    let pollInterval: number;

    const initialize = async () => {
      setIsLoadingSession(true);
      try {
        const serverDesc = await agent.com.atproto.server.describeServer();
        setChatSupported(serverDesc.data.chat?.available ?? false);

        const storedSessionString = localStorage.getItem('atp-session');
        if (storedSessionString) {
          const parsedSession = JSON.parse(storedSessionString);
          await agent.resumeSession(parsedSession);
          setSession(parsedSession);
          
          if (agent.session) {
              const profileRes = await agent.getProfile({ actor: agent.session.did });
              setProfile(profileRes.data);
          }

          await fetchUnreadCount();
          
          pollInterval = window.setInterval(() => {
            fetchUnreadCount();
          }, 30000);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        localStorage.removeItem('atp-session');
        setSession(null);
        setProfile(null);
      }
      setIsLoadingSession(false);
    };

    initialize();
    
    return () => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    };
  }, [agent, fetchUnreadCount]);

  const login = async (identifier: string, appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string) => {
    const response = await agent.login({ identifier, password: appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE });
    if(agent.session) {
        setSession(agent.session);
        const profileRes = await agent.getProfile({ actor: agent.session.did });
        setProfile(profileRes.data);
        const serverDesc = await agent.com.atproto.server.describeServer();
        setChatSupported(serverDesc.data.chat?.available ?? false);
        await fetchUnreadCount();
    }
    return response;
  };

  const logout = async () => {
    await agent.logout();
    setSession(null);
    setProfile(null);
    setUnreadCount(0);
    setChatSupported(null);
  };

  return (
    <AtpContext.Provider value={{ 
        agent, session, profile, isLoadingSession, login, logout, chatSupported,
        unreadCount, resetUnreadCount,
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
