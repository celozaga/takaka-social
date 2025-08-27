
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HiddenPostsContextType {
  hiddenPostUris: Set<string>;
  hidePost: (uri: string) => void;
}

const HiddenPostsContext = createContext<HiddenPostsContextType | undefined>(undefined);

const HIDDEN_POSTS_STORAGE_KEY = 'takaka-hidden-posts';

export const HiddenPostsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hiddenPostUris, setHiddenPostUris] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadHiddenPosts = async () => {
      try {
        const storedUris = await AsyncStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);
        if (storedUris) {
          setHiddenPostUris(new Set(JSON.parse(storedUris)));
        }
      } catch (e) {
        console.error("Failed to load hidden posts from storage", e);
      }
    };
    loadHiddenPosts();
  }, []);

  const hidePost = useCallback((uri: string) => {
    setHiddenPostUris(prev => {
      const newSet = new Set(prev);
      newSet.add(uri);
      AsyncStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify(Array.from(newSet))).catch(e => {
        console.error("Failed to save hidden posts to storage", e);
      });
      return newSet;
    });
  }, []);

  return (
    <HiddenPostsContext.Provider value={{ hiddenPostUris, hidePost }}>
      {children}
    </HiddenPostsContext.Provider>
  );
};

export const useHiddenPosts = (): HiddenPostsContextType => {
  const context = useContext(HiddenPostsContext);
  if (!context) {
    throw new Error('useHiddenPosts must be used within a HiddenPostsProvider');
  }
  return context;
};