
import React, { useState } from 'react';
import { List } from 'lucide-react';
import { View, StyleSheet, StyleProp } from 'react-native';
import { ImageStyle } from 'expo-image';
import { OptimizedImage } from '../ui';
import { useTheme } from '@/components/shared';

interface FeedAvatarProps {
  src?: string;
  alt: string;
  style: StyleProp<ImageStyle>;
}

const FeedAvatar: React.FC<FeedAvatarProps> = ({ src, alt, style }) => {
  const [hasError, setHasError] = useState(!src);
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  
  const handleError = () => { if (!hasError) setHasError(true); };

  if (hasError) {
    return (
      <View style={[styles.fallback, style]}>
        <List style={styles.icon} color={theme.colors.onSurfaceVariant} />
      </View>
    );
  }

  return (
    <OptimizedImage
      source={src}
      accessibilityLabel={alt}
      style={[style, styles.circularImage]}
      onError={handleError}
      transition={300}
    />
  );
};

const createStyles = (theme: any) => StyleSheet.create({
    fallback: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: 9999
    },
    icon: {
        width: '50%',
        height: '50%'
    },
    circularImage: {
        borderRadius: 9999
    }
});

export default FeedAvatar;