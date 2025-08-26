/**
 * ============================================================================
 * Follow Button Component
 * ============================================================================
 *
 * Universal follow/unfollow button with proper states and accessibility.
 * Uses expo-haptics for tactile feedback on native platforms.
 *
 */

import React from 'react';
import { Pressable, Text, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type FollowState = 'follow' | 'following' | 'pending';
type ButtonSize = 'sm' | 'md' | 'lg';

interface FollowButtonProps {
  /** Current follow state */
  state: FollowState;
  /** Called when button is pressed */
  onPress: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is loading */
  loading?: boolean;
  /** Button size */
  size?: ButtonSize;
  /** Custom style for button */
  style?: StyleProp<ViewStyle>;
  /** Custom style for text */
  textStyle?: StyleProp<TextStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const FollowButton: React.FC<FollowButtonProps> = ({
  state,
  onPress,
  disabled = false,
  loading = false,
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();
  
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Provide haptic feedback on native platforms
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    
    switch (state) {
      case 'follow':
        return 'Follow';
      case 'following':
        return 'Following';
      case 'pending':
        return 'Pending';
      default:
        return 'Follow';
    }
  };

  const getButtonStyles = (pressed: boolean): any[] => {
    const baseStyles: any[] = [
      styles.button,
      styles[size],
      {
        borderWidth: 1,
      },
    ];

    if (state === 'follow') {
      baseStyles.push({
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      });
    } else {
      baseStyles.push({
        backgroundColor: 'transparent',
        borderColor: theme.colors.outline,
      });
    }

    if (pressed && !disabled && !loading) {
      baseStyles.push({
        opacity: 0.8,
      });
    }

    if (disabled || loading) {
      baseStyles.push({
        opacity: 0.5,
      });
    }

    return baseStyles;
  };

  const getTextStyles = (): any[] => {
    const baseStyles: any[] = [
      styles.text,
      styles[`${size}Text`],
    ];

    if (state === 'follow') {
      baseStyles.push({
        color: theme.colors.onPrimary,
      });
    } else {
      baseStyles.push({
        color: theme.colors.onSurface,
      });
    }

    return baseStyles;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        ...getButtonStyles(pressed),
        style,
      ]}
      accessibilityLabel={accessibilityLabel || getButtonText()}
      accessibilityRole="button"
      testID={testID}
    >
      <Text style={[...getTextStyles(), textStyle]}>
        {getButtonText()}
      </Text>
    </Pressable>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
  },

  // Text base
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Text sizes
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
});

export default FollowButton;
