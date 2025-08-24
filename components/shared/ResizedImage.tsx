import React from 'react';
import { Image, ImageProps } from 'react-native';

interface ResizedImageProps extends ImageProps {
  src: string;
  alt: string;
}

const ResizedImage: React.FC<ResizedImageProps> = ({ src, alt, style, ...props }) => {
  if (!src) {
    return <Image {...props} style={style} source={{ uri: '' }} accessibilityLabel={alt} />;
  }

  return <Image source={{ uri: src }} accessibilityLabel={alt} style={style} {...props} />;
};

export default ResizedImage;
