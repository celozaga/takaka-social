import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'takaka-search-history';
const HISTORY_LIMIT = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
      } catch (e) {
        console.error("Failed to load search history from storage", e);
      }
    };
    loadHistory();
  }, []);

  const saveHistory = async (newHistory: string[]) => {
    setHistory(newHistory);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save search history to storage", e);
    }
  };

  const addHistoryItem = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;

    setHistory(prev => {
        const newHistory = [trimmedTerm, ...prev.filter(item => item.toLowerCase() !== trimmedTerm.toLowerCase())].slice(0, HISTORY_LIMIT);
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)).catch(e => {
            console.error("Failed to save search history", e);
        });
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
