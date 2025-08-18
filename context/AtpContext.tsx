
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { BskyAgent, AtpSessionData, AtpSessionEvent } from '@atproto/api';

interface AtpContextType {
  agent: BskyAgent;
  session: AtpSessionData | null;
  isLoadingSession: boolean;
  login: (identifier: string, appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string) => Promise<any>;
  logout: () => Promise<void>;
  unreadCount: number;
  chatUnreadCount: number;
  resetUnreadCount: () => void;
  resetChatUnreadCount: () => void;
}

const AtpContext = createContext<AtpContextType | undefined>(undefined);

export const AtpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AtpSessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const agent = useMemo(() => new BskyAgent({
    service: 'https://bsky.social',
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

  const fetchChatUnreadCount = useCallback(async () => {
    if (!agent.hasSession) return;
    try {
        const { data } = await agent.chat.bsky.convo.listConvos();
        const totalUnread = data.convos.reduce((acc, convo) => acc + convo.unreadCount, 0);
        setChatUnreadCount(totalUnread);
    } catch (error) {
        console.error("Failed to fetch chat unread count:", error);
    }
  }, [agent]);

  const resetChatUnreadCount = useCallback(() => {
    setChatUnreadCount(0);
  }, []);

  useEffect(() => {
    let pollInterval: number;

    const initialize = async () => {
      setIsLoadingSession(true);
      const storedSessionString = localStorage.getItem('atp-session');
      if (storedSessionString) {
        try {
          const parsedSession = JSON.parse(storedSessionString);
          await agent.resumeSession(parsedSession);
          setSession(parsedSession);
          await Promise.all([fetchUnreadCount(), fetchChatUnreadCount()]);
          pollInterval = window.setInterval(() => {
            fetchUnreadCount();
            fetchChatUnreadCount();
          }, 30000);
        } catch (error) {
          console.error("Failed to resume session:", error);
          localStorage.removeItem('atp-session');
          setSession(null);
        }
      }
      setIsLoadingSession(false);
    };

    initialize();
    
    return () => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    };
  }, [agent, fetchUnreadCount, fetchChatUnreadCount]);

  const login = async (identifier: string, appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string) => {
    const response = await agent.login({ identifier, password: appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE });
    if(agent.session) {
        setSession(agent.session);
        await Promise.all([fetchUnreadCount(), fetchChatUnreadCount()]);
    }
    return response;
  };

  const logout = async () => {
    await agent.logout();
    setSession(null);
    setUnreadCount(0);
    setChatUnreadCount(0);
  };

  return (
    <AtpContext.Provider value={{ 
        agent, session, isLoadingSession, login, logout, 
        unreadCount, resetUnreadCount,
        chatUnreadCount, resetChatUnreadCount
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
