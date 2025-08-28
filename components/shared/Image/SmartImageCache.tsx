import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image as ExpoImage, ImageSource } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared';

interface SmartImageCacheProps {
  source: string | ImageSource;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  transition?: number;
  placeholder?: string;
  accessibilityLabel?: string;
  priority?: 'low' | 'normal' | 'high';
  preload?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

// Global cache for image preloading
class ImageCacheManager {
  private static instance: ImageCacheManager;
  private preloadQueue: Map<string, Promise<void>> = new Map();
  private loadedImages: Map<string, { timestamp: number; priority: string }> = new Map();
  private failedImages: Set<string> = new Set();
  private maxCacheSize = 150; // Increased cache size
  private currentCacheSize = 0;
  private priorityWeights = { high: 3, normal: 2, low: 1 };
  private lastCleanup = Date.now();
  private cleanupInterval = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async preloadImage(uri: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    // Check if already loaded or failed
    if (this.loadedImages.has(uri) || this.failedImages.has(uri)) {
      // Update timestamp for recently accessed images
      if (this.loadedImages.has(uri)) {
        const existing = this.loadedImages.get(uri)!;
        this.loadedImages.set(uri, { ...existing, timestamp: Date.now() });
      }
      return Promise.resolve();
    }

    if (this.preloadQueue.has(uri)) {
      return this.preloadQueue.get(uri)!;
    }

    const preloadPromise = this.performPreload(uri, priority);
    this.preloadQueue.set(uri, preloadPromise);

    try {
      await preloadPromise;
      this.loadedImages.set(uri, { timestamp: Date.now(), priority });
      this.currentCacheSize++;
      
      // Intelligent cache cleanup
      this.smartCleanup();
    } catch (error) {
      this.failedImages.add(uri);
      console.warn('Failed to preload image:', uri, error);
    } finally {
      this.preloadQueue.delete(uri);
    }
  }

  private async performPreload(uri: string, priority: 'low' | 'normal' | 'high'): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use different strategies based on priority
      const timeout = priority === 'high' ? 5000 : priority === 'normal' ? 10000 : 15000;
      
      const timeoutId = setTimeout(() => {
        reject(new Error('Preload timeout'));
      }, timeout);

      ExpoImage.prefetch(uri)
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private smartCleanup(): void {
    const now = Date.now();
    
    // Only cleanup if cache is full or it's been a while since last cleanup
    if (this.currentCacheSize <= this.maxCacheSize && (now - this.lastCleanup) < this.cleanupInterval) {
      return;
    }
    
    this.lastCleanup = now;
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const entriesToRemove = Math.floor(this.maxCacheSize * 0.25); // Remove 25%
    
    // Create array of entries with scores for intelligent cleanup
    const entries = Array.from(this.loadedImages.entries()).map(([uri, data]) => ({
      uri,
      data,
      age: now - data.timestamp,
      score: this.calculateCleanupScore(data, now),
    }));
    
    // Sort by score (lower score = more likely to be removed)
    entries.sort((a, b) => a.score - b.score);
    
    // Remove old or low-priority entries
    let removed = 0;
    for (const entry of entries) {
      if (removed >= entriesToRemove && this.currentCacheSize <= this.maxCacheSize) {
        break;
      }
      
      // Remove if too old or if we need space
      if (entry.age > maxAge || (this.currentCacheSize > this.maxCacheSize && removed < entriesToRemove)) {
        this.loadedImages.delete(entry.uri);
        this.currentCacheSize--;
        removed++;
      }
    }
  }
  
  private calculateCleanupScore(data: { timestamp: number; priority: string }, now: number): number {
    const age = now - data.timestamp;
    const priorityWeight = this.priorityWeights[data.priority as keyof typeof this.priorityWeights] || 1;
    
    // Lower score = more likely to be removed
    // Age increases removal likelihood, priority decreases it
    return age / (priorityWeight * 1000);
  }

  isImageLoaded(uri: string): boolean {
    return this.loadedImages.has(uri);
  }

  isImageFailed(uri: string): boolean {
    return this.failedImages.has(uri);
  }

  clearCache(): void {
    this.loadedImages.clear();
    this.failedImages.clear();
    this.preloadQueue.clear();
    this.currentCacheSize = 0;
    this.lastCleanup = Date.now();
  }
  
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    const totalRequests = this.loadedImages.size + this.failedImages.size;
    const hitRate = totalRequests > 0 ? this.loadedImages.size / totalRequests : 0;
    
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
}

// Hook for strategic image preloading
export const useImagePreloader = () => {
  const cacheManager = useMemo(() => ImageCacheManager.getInstance(), []);

  const preloadImage = useCallback(
    async (uri: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
      if (typeof uri === 'string' && uri.length > 0) {
        return cacheManager.preloadImage(uri, priority);
      }
      return Promise.resolve();
    },
    [cacheManager]
  );

  const preloadImages = useCallback(
    async (uris: string[], priority: 'low' | 'normal' | 'high' = 'normal') => {
      const preloadPromises = uris.map(uri => {
        if (typeof uri === 'string' && uri.length > 0) {
          return cacheManager.preloadImage(uri, priority);
        }
        return Promise.resolve();
      });

      try {
        await Promise.allSettled(preloadPromises);
      } catch (error) {
        console.warn('Batch preload failed:', error);
      }
    },
    [cacheManager]
  );

  const preloadImagesInViewport = useCallback(
    (uris: string[], visibleRange: { start: number; end: number }) => {
      // Preload visible images with high priority
      const visibleUris = uris.slice(visibleRange.start, visibleRange.end + 1);
      preloadImages(visibleUris, 'high');

      // Preload next batch with normal priority
      const nextBatchStart = visibleRange.end + 1;
      const nextBatchEnd = Math.min(nextBatchStart + 5, uris.length);
      const nextBatchUris = uris.slice(nextBatchStart, nextBatchEnd);
      preloadImages(nextBatchUris, 'normal');

      // Preload previous batch with low priority
      const prevBatchEnd = visibleRange.start - 1;
      const prevBatchStart = Math.max(prevBatchEnd - 5, 0);
      const prevBatchUris = uris.slice(prevBatchStart, prevBatchEnd + 1);
      preloadImages(prevBatchUris, 'low');
    },
    [preloadImages]
  );

  return {
    preloadImage,
    preloadImages,
    preloadImagesInViewport,
    isImageLoaded: cacheManager.isImageLoaded.bind(cacheManager),
    isImageFailed: cacheManager.isImageFailed.bind(cacheManager),
    clearCache: cacheManager.clearCache.bind(cacheManager),
  };
};

const SmartImageCache: React.FC<SmartImageCacheProps> = memo(({
  source,
  style,
  contentFit = 'cover',
  transition = 200,
  placeholder,
  accessibilityLabel,
  priority = 'normal',
  preload = false,
  onLoad,
  onError,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const cacheManager = useMemo(() => ImageCacheManager.getInstance(), []);

  const imageUri = useMemo(() => {
    if (typeof source === 'string') {
      return source;
    }
    if (source && typeof source === 'object' && 'uri' in source) {
      return source.uri;
    }
    return '';
  }, [source]);

  // Preload image if requested
  useEffect(() => {
    if (preload && imageUri) {
      cacheManager.preloadImage(imageUri, priority);
    }
  }, [preload, imageUri, priority, cacheManager]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Show placeholder while loading or on error
  if (isLoading || hasError) {
    return (
      <View style={[style, styles.placeholder]}>
        {/* You can add a skeleton or spinner here */}
      </View>
    );
  }

  return (
    <ExpoImage
      source={source}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      onLoad={handleLoad}
      onError={handleError}
      // Expo Image caching configuration
      cachePolicy="memory-disk"
      recyclingKey={imageUri}
    />
  );
});

const createStyles = (theme: any) =>
  StyleSheet.create({
    placeholder: {
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

SmartImageCache.displayName = 'SmartImageCache';

export default SmartImageCache;
export { ImageCacheManager };