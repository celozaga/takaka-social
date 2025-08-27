/**
 * ============================================================================
 * Avatar Component
 * ============================================================================
 *
 * Universal avatar component using expo-image for optimal performance.
 * Supports different sizes, fallback, and accessibility features.
 *
 */

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  /** Avatar image URI */
  uri?: string;
  /** Fallback text (usually initials) */
  fallback?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Avatar: React.FC<AvatarProps> = ({
  uri,
  fallback,
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();
  
  const avatarSize = theme.sizes[`avatar${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof theme.sizes];
  const fontSize = avatarSize * 0.4; // Scale font size with avatar size
  
  const avatarStyles = [
    styles.avatar,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: theme.colors.surfaceContainer,
    },
    style,
  ];

  return (
    <View
      style={avatarStyles}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
          transition={200}
        />
      ) : (
        <Text
          style={[
            styles.fallbackText,
            {
              fontSize,
              color: theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {fallback?.charAt(0).toUpperCase() || '?'}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Avatar;
