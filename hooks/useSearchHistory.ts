import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

const HISTORY_KEY = 'takaka-search-history';
const HISTORY_LIMIT = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
      } catch (e) {
        console.error("Failed to load search history from localStorage", e);
      }
    }
  }, []);

  const saveHistory = (newHistory: string[]) => {
    setHistory(newHistory);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save search history to localStorage", e);
      }
    }
  };

  const addHistoryItem = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;

    setHistory(prev => {
        const newHistory = [trimmedTerm, ...prev.filter(item => item.toLowerCase() !== trimmedTerm.toLowerCase())].slice(0, HISTORY_LIMIT);
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            } catch (e) {
                console.error("Failed to save search history", e);
            }
        }
        return newHistory;
    });
  }, []);

  const removeHistoryItem = useCallback((term: string) => {
    const newHistory = history.filter(item => item !== term);
    saveHistory(newHistory);
  }, [history]);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, []);

  return { history, addHistoryItem, removeHistoryItem, clearHistory };
}
