import React from 'react';
import { View, ImageProps as RNImageProps } from 'react-native';
import { Image, ImageProps as ExpoImageProps, ImageContentFit } from 'expo-image';
import { resizeImage } from '@/lib/image';
import { theme } from '@/lib/theme';

interface ResizedImageProps extends Omit<ExpoImageProps, 'source' | 'resizeMode'> {
  src: string;
  alt: string;
  width?: number;
  resizeMode?: RNImageProps['resizeMode'];
}

const ResizedImage: React.FC<ResizedImageProps> = ({ src, alt, style, width, resizeMode, contentFit, ...props }) => {
  // Request 2x resolution for retina displays, if width is provided
  const finalSrc = width ? resizeImage(src, Math.round(width * 2)) : src;

  if (!finalSrc) {
    return <View style={[style, { backgroundColor: theme.colors.surfaceContainerHigh }]} />;
  }

  // Map resizeMode to contentFit, with contentFit prop taking precedence
  const finalContentFit: ImageContentFit =
    contentFit ||
    (resizeMode === 'stretch'
      ? 'fill'
      : resizeMode === 'contain' || resizeMode === 'center'
      ? 'contain'
      : 'cover');

  return (
    <Image
      source={finalSrc}
      accessibilityLabel={alt}
      style={style}
      contentFit={finalContentFit}
      placeholder={theme.colors.surfaceContainerHigh}
      transition={300} // Fade in transition
      {...props}
    />
  );
};

export default ResizedImage;
