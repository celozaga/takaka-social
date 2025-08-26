import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, StyleProp } from 'react-native';
import { Image, ImageStyle, ImageSource } from 'expo-image';
import { theme } from '@/lib/theme';

interface OptimizedImageProps {
  source: ImageSource;
  style: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  source,
  style,
  accessibilityLabel,
  contentFit = 'cover',
  transition = 200,
  onLoadStart,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Memoiza o source para evitar re-renders desnecessários
  const memoizedSource = useMemo(() => source, [source]);

  // Se houve erro, mostrar um placeholder simples
  if (hasError) {
    return (
      <View style={[styles.errorPlaceholder, style]}>
        <View style={styles.errorIcon} />
      </View>
    );
  }

  return (
    <View style={style}>
      {/* Skeleton/placeholder que fica visível durante o carregamento */}
      {isLoading && (
        <View style={[styles.skeleton, StyleSheet.absoluteFill]} />
      )}
      
      {/* Imagem real */}
      <Image
        source={memoizedSource}
        accessibilityLabel={accessibilityLabel}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={transition}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        // Otimizações para reduzir piscamento
        cachePolicy="memory-disk"
        placeholder={null}
        recyclingKey={typeof source === 'string' ? source : undefined}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 8,
  },
  errorPlaceholder: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.onSurfaceVariant,
    borderRadius: 12,
    opacity: 0.3,
  },
});

export default OptimizedImage;
