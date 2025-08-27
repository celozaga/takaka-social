import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  FlatList, 
  FlatListProps, 
  useWindowDimensions,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Linking } from 'react-native';
import { AppBskyEmbedImages } from '@atproto/api';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '../ui';
import { useTheme } from '@/components/shared';

interface PhotoCarouselProps {
  images: AppBskyEmbedImages.ViewImage[];
  style?: any;
  aspectRatio?: number;
  maxHeight?: number;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ 
  images, 
  style, 
  aspectRatio: customAspectRatio,
  maxHeight = 700 
}) => {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const styles = createStyles(theme);

  // Calcular dimensões responsivas com fallbacks para diferentes plataformas
  const isDesktop = screenWidth >= 768;
  const isTablet = screenWidth >= 600 && screenWidth < 768;
  const isMobile = screenWidth < 600;
  
  // Ajustar larguras baseado na plataforma
  const mainContentMaxWidth = isDesktop ? 640 : screenWidth;
  const navRailWidth = isDesktop ? 80 : 0;
  const listPadding = isMobile ? theme.spacing.md : theme.spacing.lg * 2;

  const effectiveContentWidth = isDesktop
    ? Math.min(screenWidth - navRailWidth, mainContentMaxWidth)
    : screenWidth;
  
  const containerWidth = Math.max(effectiveContentWidth - listPadding, 200); // Mínimo de 200px
  
  // Usar aspect ratio customizado ou calcular baseado na primeira imagem
  const calculatedAspectRatio = customAspectRatio || 
    (images[0]?.aspectRatio ? images[0].aspectRatio.width / images[0].aspectRatio.height : 1.5);
  
  const calculatedHeight = containerWidth / calculatedAspectRatio;
  const finalHeight = Math.min(calculatedHeight, maxHeight);

  // Configuração de visibilidade otimizada para cada plataforma
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: Platform.OS === 'web' ? 50 : 80,
    minimumViewTime: Platform.OS === 'web' ? 0 : 100,
  }).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentIndex(newIndex);
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ 
        index: newIndex, 
        animated: true,
        viewPosition: 0
      });
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ 
        index: newIndex, 
        animated: true,
        viewPosition: 0
      });
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, images.length]);

  const handleImagePress = useCallback(async (imageUrl: string) => {
    try {
      setIsLoading(true);
      await Linking.openURL(imageUrl);
    } catch (error) {
      // Fallback para diferentes plataformas
      if (Platform.OS === 'web') {
        window.open(imageUrl, '_blank');
      } else {
        Alert.alert('Erro', 'Não foi possível abrir a imagem');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderImageItem = useCallback(({ item }: { item: AppBskyEmbedImages.ViewImage }) => {
    return (
      <View style={{ 
        width: containerWidth, 
        height: finalHeight, 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Pressable 
          style={{ 
            width: '100%', 
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => handleImagePress(item.fullsize)}
          onLongPress={() => {
            // Suporte a long press para mobile
            if (Platform.OS !== 'web') {
              Alert.alert(
                'Opções da Imagem',
                'O que você gostaria de fazer?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Abrir Imagem', onPress: () => handleImagePress(item.fullsize) },
                  { text: 'Copiar URL', onPress: () => {
                    // Implementar copiar URL se necessário
                  }}
                ]
              );
            }
          }}
          {...(Platform.OS === 'web' && {
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
          } as any)}
        >
          <OptimizedImage 
            source={item.thumb} 
            accessibilityLabel={item.alt || 'Gallery image'} 
            style={styles.carouselImage} 
            contentFit="contain" 
            transition={300}
            onError={() => {
              console.warn('Failed to load image:', item.thumb);
            }}
          />
          <View style={[
            styles.imageOverlay, 
            { 
              opacity: (Platform.OS === 'web' && isHovered) ? 1 : 0,
              // Melhorar visibilidade em mobile
              backgroundColor: Platform.OS === 'web' 
                ? 'rgba(0,0,0,0.3)' 
                : 'rgba(0,0,0,0.1)'
            }
          ]}>
            <ExternalLink color="white" size={Platform.OS === 'web' ? 24 : 20} />
          </View>
        </Pressable>
      </View>
    );
  }, [containerWidth, finalHeight, handleImagePress, isHovered, styles]);

  const flatListProps: FlatListProps<AppBskyEmbedImages.ViewImage> = {
    data: images,
    renderItem: renderImageItem,
    horizontal: true,
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
    keyExtractor: (item: AppBskyEmbedImages.ViewImage, index: number) => 
      `${item.thumb}-${index}`,
    onViewableItemsChanged,
    viewabilityConfig,
    style: StyleSheet.absoluteFillObject,
    getItemLayout: (_: any, index: number) => ({
      length: containerWidth,
      offset: containerWidth * index,
      index,
    }),
    // Otimizações para performance
    removeClippedSubviews: Platform.OS !== 'web',
    maxToRenderPerBatch: 3,
    windowSize: 5,
    initialNumToRender: 1,
    // Melhorar scroll em mobile
    decelerationRate: Platform.OS === 'ios' ? 'fast' : 0.9,
    snapToInterval: containerWidth,
    snapToAlignment: 'start',
  };

  const showArrows = images.length > 1;
  const showCounter = images.length > 1;
  const showDots = images.length > 1;

  // Ajustar tamanho das setas baseado na plataforma
  const arrowSize = Platform.OS === 'web' ? 40 : 44; // Touch target mínimo para mobile
  const arrowIconSize = Platform.OS === 'web' ? 24 : 20;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.innerContainer, { height: finalHeight }]}>
        <FlatList ref={flatListRef} {...flatListProps} />
        
        {/* Contador de imagens */}
        {showCounter && (
          <View style={styles.counterOverlay}>
            <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
          </View>
        )}
        
        {/* Setas de navegação */}
        {showArrows && currentIndex > 0 && (
          <Pressable 
            style={[
              styles.arrow, 
              styles.arrowLeft, 
              { width: arrowSize, height: arrowSize, marginTop: -arrowSize / 2 }
            ]} 
            onPress={handlePrev}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft style={styles.arrowIcon} color="white" size={arrowIconSize} />
          </Pressable>
        )}
        
        {showArrows && currentIndex < images.length - 1 && (
          <Pressable 
            style={[
              styles.arrow, 
              styles.arrowRight, 
              { width: arrowSize, height: arrowSize, marginTop: -arrowSize / 2 }
            ]} 
            onPress={handleNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight style={styles.arrowIcon} color="white" size={arrowIconSize} />
          </Pressable>
        )}
      </View>
      
      {/* Indicadores de pontos */}
      {showDots && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <Pressable
              key={index}
              style={[
                styles.dot, 
                index === currentIndex && styles.dotActive,
                { marginHorizontal: Platform.OS === 'web' ? theme.spacing.xs : theme.spacing.sm }
              ]}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ 
                  index, 
                  animated: true,
                  viewPosition: 0
                });
                setCurrentIndex(index);
              }}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
  },
  innerContainer: {
    position: 'relative',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    width: '100%',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
    ...(Platform.OS === 'web' && {
      transition: 'opacity 0.2s',
    }),
  },
  counterOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    zIndex: 1,
    // Melhorar visibilidade em mobile
    ...(Platform.OS !== 'web' && {
      backgroundColor: 'rgba(0,0,0,0.8)',
    }),
  },
  counterText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: 'white',
    fontWeight: 'bold',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    // Melhorar touch target em mobile
    ...(Platform.OS !== 'web' && {
      backgroundColor: 'rgba(0,0,0,0.7)',
      elevation: 3, // Android shadow
      shadowColor: '#000', // iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    }),
  },
  arrowLeft: {
    left: theme.spacing.md,
  },
  arrowRight: {
    right: theme.spacing.md,
  },
  arrowIcon: {
    color: 'white'
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS !== 'web' ? theme.spacing.xs : 0,
  },
  dot: {
    width: Platform.OS === 'web' ? 8 : 10,
    height: Platform.OS === 'web' ? 8 : 10,
    borderRadius: Platform.OS === 'web' ? 4 : 5,
    backgroundColor: theme.colors.surfaceContainerHighest,
    // Melhorar touch target em mobile
    ...(Platform.OS !== 'web' && {
      backgroundColor: 'rgba(255,255,255,0.4)',
    }),
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    // Melhorar visibilidade em mobile
    ...(Platform.OS !== 'web' && {
      backgroundColor: theme.colors.primary,
      transform: [{ scale: 1.2 }],
    }),
  }
});

export default PhotoCarousel;
