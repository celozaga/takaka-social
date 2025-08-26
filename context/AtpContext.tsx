


import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { BskyAgent, AtpSessionData, AtpSessionEvent } from '@atproto/api';
import { PDS_URL } from '../lib/config';
import { useToast } from '../components/ui/use-toast';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ATP_CREDENTIALS_KEY = 'atp-credentials';

interface StoredCredentials {
  session: AtpSessionData;
  serviceUrl: string;
}

const credentialsStore = {
    getItem: async (): Promise<StoredCredentials | null> => {
        const stored = Platform.OS === 'web' ? await AsyncStorage.getItem(ATP_CREDENTIALS_KEY) : await getItemAsync(ATP_CREDENTIALS_KEY);
        return stored ? JSON.parse(stored) : null;
    },
    setItem: (creds: StoredCredentials) => {
        const value = JSON.stringify(creds);
        return Platform.OS === 'web' ? AsyncStorage.setItem(ATP_CREDENTIALS_KEY, value) : setItemAsync(ATP_CREDENTIALS_KEY, value);
    },
    deleteItem: () => {
        return Platform.OS === 'web' ? AsyncStorage.removeItem(ATP_CREDENTIALS_KEY) : deleteItemAsync(ATP_CREDENTIALS_KEY);
    }
};

interface AtpContextType {
  agent: BskyAgent;
  publicAgent: BskyAgent;
  session: AtpSessionData | null;
  serviceUrl: string;
  isLoadingSession: boolean;
  login: (params: { identifier: string; appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string; token?: string; serviceUrl: string; }) => Promise<any>;
  logout: () => Promise<void>;
  unreadCount: number;
  resetUnreadCount: () => void;
}

const AtpContext = createContext<AtpContextType | undefined>(undefined);

export const AtpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AtpSessionData | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string>(PDS_URL);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPollingPaused, setIsPollingPaused] = useState(false);
  const { toast } = useToast();

  const agent = useMemo(() => new BskyAgent({
    service: serviceUrl,
    persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
      switch (evt) {
        case 'create':
        case 'update':
          if (sess) {
            credentialsStore.setItem({ session: sess, serviceUrl });
            setSession(sess);
          }
          break;
        case 'expired':
        case 'create-failed':
          credentialsStore.deleteItem();
          setSession(null);
          setServiceUrl(PDS_URL); // Reset to default on logout/failure
          break;
      }
    },
  }), [serviceUrl]);

  // Create a dedicated public agent for unauthenticated requests
  const publicAgent = useMemo(() => {
    console.log('🔧 DEBUG: Creating public agent for unauthenticated requests');
    return new BskyAgent({
      service: 'https://bsky.social'
    });
  }, []);
  
  useEffect(() => {
    const initialize = async () => {
      console.log('🔧 DEBUG: Initializing AtpContext...');
      setIsLoadingSession(true);
      try {
        const storedCreds = await credentialsStore.getItem();
        if (storedCreds) {
          // Set service URL first to ensure agent is created correctly
          setServiceUrl(storedCreds.serviceUrl || PDS_URL);
          // The agent will be recreated by the useMemo.
          // We then resume the session with this new agent instance.
          // A short delay ensures the state update for serviceUrl propagates.
          setTimeout(() => {
            agent.resumeSession(storedCreds.session).then(() => {
                setSession(storedCreds.session);
            }).catch(e => {
                console.error("Session resumption failed, clearing credentials.", e);
                credentialsStore.deleteItem();
                setSession(null);
                setServiceUrl(PDS_URL);
            }).finally(() => {
                setIsLoadingSession(false);
            });
          }, 0);
        } else {
            console.log('🔧 DEBUG: No stored credentials, testing public agent...');
            // Test public agent functionality
            console.log('🔧 DEBUG: Starting public agent test...');
            console.log('🔧 DEBUG: Public agent service:', publicAgent.service);
            
            // First test: simple health check
            fetch('https://bsky.social/xrpc/com.atproto.server.describeServer')
                .then(response => response.json())
                .then(data => {
                    console.log('🌐 DEBUG: Direct API test successful:', data);
                })
                .catch(error => {
                    console.error('🌐 ERROR: Direct API test failed:', error);
                });
            
            // Test 1: Try getting profile (public endpoint)
            publicAgent.getProfile({ actor: 'bsky.app' }).then((response) => {
                console.log('✅ SUCCESS: Public agent getProfile working:', response?.data?.handle);
            }).catch((error) => {
                console.error('❌ ERROR: Public agent getProfile failed:', error);
            });
            
            // Test 2: Try feed generators endpoint (public)
            publicAgent.app.bsky.feed.getFeedGenerators({
                feeds: ['at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot']
            }).then((response) => {
                console.log('✅ SUCCESS: getFeedGenerators working:', response?.data?.feeds?.length);
            }).catch((error) => {
                console.error('❌ ERROR: getFeedGenerators failed:', error);
            });
            
            // Test 3: Try search posts (public)
            publicAgent.app.bsky.feed.searchPosts({ q: 'bluesky', limit: 1 }).then((response) => {
                console.log('✅ SUCCESS: searchPosts working:', response?.data?.posts?.length);
            }).catch((error) => {
                console.error('❌ ERROR: searchPosts failed:', error);
            });
            
            // Test 4: Original getFeed test
            publicAgent.app.bsky.feed.getFeed({ 
                feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot', 
                limit: 1 
            }).then((response) => {
                console.log('✅ SUCCESS: Public agent getFeed working correctly', response?.data?.feed?.length, 'posts received');
            }).catch((error) => {
                console.error('❌ ERROR: Public agent getFeed failed:', {
                    message: error.message,
                    status: error.status,
                    statusText: error.statusText,
                    error: error
                });
            });
            
            setIsLoadingSession(false);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        await credentialsStore.deleteItem();
        setSession(null);
        setServiceUrl(PDS_URL);
        setIsLoadingSession(false);
      }
    };
    initialize();
  }, []); // Run only once on mount. Agent dependency removed to avoid re-initialization loop.

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

  useEffect(() => {
    if (!session) {
      setUnreadCount(0);
      return;
    }

    let pollInterval: ReturnType<typeof setInterval> | undefined;
    let pauseTimeout: ReturnType<typeof setTimeout> | undefined;

    const pollFunction = async () => {
      if (isPollingPaused) return;
      try { await fetchUnreadCount(); } catch (error: any) {
        if (error && error.status === 429) {
          setIsPollingPaused(true);
          toast({ title: "Rate limit reached", description: "Too many requests. Will retry automatically.", variant: "destructive" });
          if (pauseTimeout) clearTimeout(pauseTimeout);
          pauseTimeout = setTimeout(() => setIsPollingPaused(false), 60000);
        }
      }
    };

    fetchUnreadCount().catch(() => {});
    pollInterval = setInterval(pollFunction, 30000);

    return () => {
        if (pollInterval) clearInterval(pollInterval);
        if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [session, fetchUnreadCount, isPollingPaused, toast]);
  
  const resetUnreadCount = useCallback(() => setUnreadCount(0), []);

  const login = useCallback(async (params: { identifier: string; appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: string; token?: string; serviceUrl: string; }) => {
    // Create a temporary agent for the login attempt with the chosen service
    const tempAgent = new BskyAgent({ service: params.serviceUrl });
    
    const { data: sessionResponse } = await tempAgent.login({ 
      identifier: params.identifier, 
      password: params.appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE, 
      authFactorToken: params.token 
    });

    // Manually construct AtpSessionData to satisfy the stricter type, ensuring 'active' is set.
    const newSession: AtpSessionData = {
      did: sessionResponse.did,
      handle: sessionResponse.handle,
      email: sessionResponse.email,
      emailConfirmed: sessionResponse.emailConfirmed,
      accessJwt: sessionResponse.accessJwt,
      refreshJwt: sessionResponse.refreshJwt,
      active: sessionResponse.active ?? true,
    };

    // If successful, store credentials and update the provider's state
    await credentialsStore.setItem({ session: newSession, serviceUrl: params.serviceUrl });
    setServiceUrl(params.serviceUrl);
    setSession(newSession);
    
    // Ensure the main agent gets the session after the serviceUrl change
    // We need to wait briefly for the useMemo to recreate the agent with the new serviceUrl
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
        // Apply the session to the main agent to ensure it's synchronized
        await agent.resumeSession(newSession);
        
        // Now fetch unread count with the properly configured agent
        if (agent.hasSession) {
            await fetchUnreadCount();
        }
    } catch (error) {
        console.error("Failed to sync session with main agent:", error);
        // The session state is already set, so the UI will still work
    }

  }, [agent, fetchUnreadCount]);

  const logout = useCallback(async () => {
    await agent.logout(); // This triggers 'expired' in persistSession
  }, [agent]);

  return (
    <AtpContext.Provider value={{ 
        agent, publicAgent, session, serviceUrl, isLoadingSession, login, logout, 
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