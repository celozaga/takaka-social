// ============================================================================
// Helpers - General Utility Functions
// ============================================================================
//
// This module provides general utility functions that don't fit into
// specific categories like formatters or validators.
//

import { Platform } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  maxDelay?: number;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

export const asyncHelpers = {
  // Create a delay/sleep function
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Retry a function with exponential backoff
  retry: async <T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 'exponential',
      maxDelay = 30000,
    } = options;

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        let waitTime = delay;
        if (backoff === 'exponential') {
          waitTime = Math.min(delay * Math.pow(2, attempt - 1), maxDelay);
        } else {
          waitTime = Math.min(delay * attempt, maxDelay);
        }
        
        await asyncHelpers.delay(waitTime);
      }
    }
    
    throw lastError!;
  },

  // Create a timeout wrapper for promises
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
      }),
    ]);
  },

  // Batch async operations
  batch: async <T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    batchSize: number = 5
  ): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(fn));
      results.push(...batchResults);
    }
    
    return results;
  },
};

// ============================================================================
// FUNCTION UTILITIES
// ============================================================================

export const functionHelpers = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: DebounceOptions = {}
  ): T => {
    const { leading = false, trailing = true } = options;
    let timeout: NodeJS.Timeout | null = null;
    let result: ReturnType<T>;
    
    return ((...args: Parameters<T>) => {
      const callNow = leading && !timeout;
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        timeout = null;
        if (trailing) {
          result = func(...args);
        }
      }, wait);
      
      if (callNow) {
        result = func(...args);
      }
      
      return result;
    }) as T;
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: ThrottleOptions = {}
  ): T => {
    const { leading = true, trailing = true } = options;
    let timeout: NodeJS.Timeout | null = null;
    let previous = 0;
    let result: ReturnType<T>;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (!previous && !leading) {
        previous = now;
      }
      
      const remaining = wait - (now - previous);
      
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func(...args);
      } else if (!timeout && trailing) {
        timeout = setTimeout(() => {
          previous = !leading ? 0 : Date.now();
          timeout = null;
          result = func(...args);
        }, remaining);
      }
      
      return result;
    }) as T;
  },

  // Memoize function results
  memoize: <T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T => {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Create a once function (only executes once)
  once: <T extends (...args: any[]) => any>(func: T): T => {
    let called = false;
    let result: ReturnType<T>;
    
    return ((...args: Parameters<T>) => {
      if (!called) {
        called = true;
        result = func(...args);
      }
      return result;
    }) as T;
  },
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

export const objectHelpers = {
  // Deep clone an object
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => objectHelpers.deepClone(item)) as unknown as T;
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = objectHelpers.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  },

  // Deep merge objects
  deepMerge: <T extends Record<string, any>>(...objects: Partial<T>[]): T => {
    const result = {} as T;
    
    for (const obj of objects) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = objectHelpers.deepMerge(
              result[key] || {},
              value
            );
          } else {
            result[key] = value;
          }
        }
      }
    }
    
    return result;
  },

  // Get nested property safely
  get: <T = any>(obj: any, path: string, defaultValue?: T): T => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue as T;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue as T;
  },

  // Set nested property
  set: (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  },

  // Pick specific properties from object
  pick: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  // Omit specific properties from object
  omit: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> => {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export const arrayHelpers = {
  // Remove duplicates from array
  unique: <T>(array: T[], keyFn?: (item: T) => any): T[] => {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // Group array items by key
  groupBy: <T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Shuffle array
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Find differences between arrays
  difference: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter(item => !array2.includes(item));
  },

  // Find intersection of arrays
  intersection: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter(item => array2.includes(item));
  },
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

export const stringHelpers = {
  // Generate random string
  randomString: (length: number = 10, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },

  // Convert string to slug
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert to title case
  titleCase: (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => stringHelpers.capitalize(word))
      .join(' ');
  },

  // Truncate string with ellipsis
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) {
      return str;
    }
    return str.slice(0, length - suffix.length) + suffix;
  },

  // Extract mentions from text
  extractMentions: (text: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return arrayHelpers.unique(mentions);
  },

  // Extract hashtags from text
  extractHashtags: (text: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags: string[] = [];
    let match;
    
    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }
    
    return arrayHelpers.unique(hashtags);
  },
};

// ============================================================================
// PLATFORM UTILITIES
// ============================================================================

export const platformHelpers = {
  // Check if running on iOS
  isIOS: (): boolean => Platform.OS === 'ios',

  // Check if running on Android
  isAndroid: (): boolean => Platform.OS === 'android',

  // Check if running on web
  isWeb: (): boolean => Platform.OS === 'web',

  // Get platform-specific value
  select: <T>(options: { ios?: T; android?: T; web?: T; default?: T }): T | undefined => {
    return Platform.select(options);
  },

  // Check if device has notch/safe area
  hasNotch: (): boolean => {
    // This is a simplified check - in a real app you'd use a library like react-native-device-info
    return Platform.OS === 'ios' && Platform.Version >= 11;
  },
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export const storageHelpers = {
  // Safe JSON parse
  safeJsonParse: <T = any>(str: string | null, defaultValue: T): T => {
    if (!str) {
      return defaultValue;
    }
    
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  },

  // Safe JSON stringify
  safeJsonStringify: (obj: any, defaultValue: string = '{}'): string => {
    try {
      return JSON.stringify(obj);
    } catch {
      return defaultValue;
    }
  },

  // Create storage key with prefix
  createStorageKey: (prefix: string, key: string): string => {
    return `${prefix}:${key}`;
  },
};

// ============================================================================
// COMBINED HELPERS EXPORT
// ============================================================================

export const helpers = {
  async: asyncHelpers,
  function: functionHelpers,
  object: objectHelpers,
  array: arrayHelpers,
  string: stringHelpers,
  platform: platformHelpers,
  storage: storageHelpers,
};

export default helpers;