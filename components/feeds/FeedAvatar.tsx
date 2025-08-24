import React, { useState } from 'react';
import { List } from 'lucide-react';
import { View, StyleSheet, StyleProp } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { theme } from '@/lib/theme';

interface FeedAvatarProps {
  src?: string;
  alt: string;
  style: StyleProp<ImageStyle>;
}

const FeedAvatar: React.FC<FeedAvatarProps> = ({ src, alt, style }) => {
  const [hasError, setHasError] = useState(!src);
  const handleError = () => { if (!hasError) setHasError(true); };

  if (hasError) {
    return (
      <View style={[styles.fallback, style]}>
        <List style={styles.icon} color={theme.colors.onSurfaceVariant} />
      </View>
    );
  }

  return (
    <Image
      source={src}
      accessibilityLabel={alt}
      style={style}
      onError={handleError}
      transition={300}
    />
  );
};

const styles = StyleSheet.create({
    fallback: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceContainerHigh
    },
    icon: {
        width: '50%',
        height: '50%'
    }
});

export default FeedAvatar;