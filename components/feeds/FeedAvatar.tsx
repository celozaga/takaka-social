
import React, { useState } from 'react';
import { List } from 'lucide-react';
import { View, Image, StyleSheet, StyleProp, ImageStyle } from 'react-native';

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
        <List style={styles.icon} color="#C3C6CF" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      accessibilityLabel={alt}
      style={style}
      onError={handleError}
    />
  );
};

const styles = StyleSheet.create({
    fallback: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2b2d2e' // surface-3
    },
    icon: {
        width: '50%',
        height: '50%'
    }
});

export default FeedAvatar;
