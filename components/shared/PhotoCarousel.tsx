import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Linking,
  FlatListProps,
} from 'react-native';
import { AppBskyEmbedImages } from '@atproto/api';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '../ui';
import { Tooltip } from './Tooltip';
import { useTheme } from '@/components/shared';
import { spacing, typography, radius, sizes, shadows } from '@/src/design/tokens';

interface PhotoCarouselProps {
  images: AppBskyEmbedImages.ViewImage[];
  style?: any;
  customAspectRatio?: number;
  maxHeight?: number;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  images,
  style,
  customAspectRatio,
  maxHeight = 400,
}) => {
    const { theme } = useTheme();

  useEffect(() => {
    console.log('PhotoCarousel - theme object changed:', theme);
    console.log('PhotoCarousel - theme.colors:', theme?.colors);
  }, [theme]);

  const createStyles = useMemo(() => {
    return StyleSheet.create({
      container: {
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceContainer,
        ...shadows.sm,
      },
      innerContainer: {
        position: 'relative',
      },
      imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
      imagePressable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      carouselImage: {
        width: '100%',
        height: '100%',
      },
      imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
        transitionDuration: '200ms',
        transitionProperty: 'opacity',
        transitionTimingFunction: 'ease-in-out',
      },
      arrow: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -sizes.iconMd / 2 }],
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: radius.full,
        padding: spacing.sm,
        zIndex: 1,
      },
      arrowLeft: {
        left: spacing.sm,
      },
      arrowRight: {
        right: spacing.sm,
      },
      counterOverlay: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: radius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
      },
      counterText: {
        ...typography.textXs,
        color: theme.colors.white,
      },
    });
  }, [theme]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const isDesktop = Platform.OS === 'web' && screenWidth >= 1024;
  const isMobile = screenWidth < 600;

  // Calculate container dimensions
  const padding = isMobile ? spacing.md : spacing.lg;
  const containerWidth = screenWidth;
  
  // Calculate aspect ratio
  const aspectRatio = customAspectRatio || 
    (images[0]?.aspectRatio ? images[0].aspectRatio.width / images[0].aspectRatio.height : 16/9);
  
  // Calculate height based on aspect ratio
  const calculatedHeight = containerWidth / aspectRatio;
  const finalHeight = Math.min(calculatedHeight, 500);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentIndex(newIndex);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ 
        index: newIndex, 
        animated: true
      });
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ 
        index: newIndex, 
        animated: true
      });
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, images.length]);

  const handleImagePress = useCallback(async (imageUrl: string) => {
    try {
      setIsLoading(true);
      await Linking.openURL(imageUrl);
    } catch (error) {
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
      <View style={[styles.imageContainer, { width: containerWidth, height: finalHeight }]}>
        <Tooltip contentKey="media.viewImage" position="top">
          <Pressable 
            style={styles.imagePressable}
            onPress={() => handleImagePress(item.fullsize)}
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
              { opacity: (Platform.OS === 'web' && isHovered) ? 1 : 0 }
            ]}>
              <ExternalLink color="white" size={24} />
            </View>
          </Pressable>
        </Tooltip>
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
    getItemLayout: (_: any, index: number) => ({
      length: containerWidth,
      offset: containerWidth * index,
      index,
    }),
    removeClippedSubviews: Platform.OS !== 'web',
    maxToRenderPerBatch: 3,
    windowSize: 5,
    initialNumToRender: 1,
    decelerationRate: Platform.OS === 'ios' ? 'fast' : 0.9,
    snapToInterval: containerWidth,
    snapToAlignment: 'start',
  };

  const showControls = images.length > 1;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.innerContainer, { width: containerWidth, height: finalHeight }]}>
        <FlatList ref={flatListRef} {...flatListProps} />
        
        {/* Image counter */}
        {showControls && (
          <View style={styles.counterOverlay}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}
        
        {/* Navigation arrows */}
        {showControls && currentIndex > 0 && (
          <Tooltip contentKey="media.previousImage" position="top">
            <Pressable 
              style={[styles.arrow, styles.arrowLeft]} 
              onPress={handlePrev}
              hitSlop={{ top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm }}
            >
              <ChevronLeft color="white" size={sizes.iconMd} />
            </Pressable>
          </Tooltip>
        )}
        
        {showControls && currentIndex < images.length - 1 && (
          <Tooltip contentKey="media.nextImage" position="top">
            <Pressable 
              style={[styles.arrow, styles.arrowRight]} 
              onPress={handleNext}
              hitSlop={{ top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm }}
            >
              <ChevronRight color="white" size={sizes.iconMd} />
            </Pressable>
          </Tooltip>
        )}
      </View>
      
      {/* Dot indicators */}
      {showControls && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <Pressable
              key={index}
              style={[
                styles.dot, 
                index === currentIndex && styles.dotActive
              ]}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ 
                  index, 
                  animated: true
                });
                setCurrentIndex(index);
              }}
              hitSlop={{ top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  innerContainer: {
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainer,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.lg,
    ...(Platform.OS === 'web' && {
      transition: 'opacity 0.2s',
    }),
  },
  counterOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    zIndex: 2,
  },
  counterText: {
    ...typography.bodySmall,
    color: 'white',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    width: sizes.buttonLg,
    height: sizes.buttonLg,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginTop: -(sizes.buttonLg / 2),
    ...shadows.md,
  },
  arrowLeft: {
    left: spacing.md,
  },
  arrowRight: {
    right: spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: sizes.iconXs,
    height: sizes.iconXs,
    borderRadius: radius.full,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.2 }],
  },
});

export default PhotoCarousel;
