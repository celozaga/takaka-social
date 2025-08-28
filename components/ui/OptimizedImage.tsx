import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, StyleProp } from 'react-native';
import { Image, ImageStyle, ImageSource } from 'expo-image';
import { useTheme } from '@/components/shared/Theme';
// Smart image cache functionality removed for now

interface OptimizedImageProps {
  source: ImageSource | string;
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
  const { theme } = useTheme();

  // Cria estilos dependentes do tema
  const themedStyles = React.useMemo(() => StyleSheet.create({
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
  }), [theme]);
  
  // Image preloading functionality removed for now

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
  const memoizedSource = useMemo(() => {
    return source;
  }, [source]);

  // Obtém borderRadius do estilo para aplicar também ao skeleton e garantir recorte correto
  const flattenedStyle = useMemo(() => StyleSheet.flatten(style) as ImageStyle, [style]);
  const dynamicBorderRadius = (flattenedStyle && (flattenedStyle.borderRadius as number)) ?? 8;

  // Se houve erro, mostrar um placeholder simples
  if (hasError) {
    return (
      <View style={[themedStyles.errorPlaceholder, { borderRadius: dynamicBorderRadius }, style]}>
        <View style={[themedStyles.errorIcon]} />
      </View>
    );
  }

  return (
    // garante recorte pelo borderRadius
    <View style={[style, { overflow: 'hidden' }]}>
      {/* Skeleton/placeholder que fica visível durante o carregamento */}
      {isLoading && (
        <View style={[themedStyles.skeleton, StyleSheet.absoluteFill, { borderRadius: dynamicBorderRadius }]} />
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
        // Otimizações para reduzir piscamento e melhor cache
        cachePolicy="memory-disk"
        placeholder={null}
        recyclingKey={typeof source === 'string' ? source : source?.uri}
        priority="high"
        allowDownscaling={true}
        autoplay={false}
      />
    </View>
  );
});



export default OptimizedImage;
