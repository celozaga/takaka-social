/**
 * ============================================================================
 * Avatar Overlay Follow Component
 * ============================================================================
 *
 * Combines Avatar with an overlay FollowButton for profile discovery interfaces.
 * Commonly used in "Suggested Users" or "People to Follow" sections.
 *
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Avatar from './Avatar';
import FollowButton from '../Button/FollowButton';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type FollowState = 'follow' | 'following' | 'pending';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarOverlayFollowProps {
  /** Avatar image URI */
  avatarUri?: string;
  /** Fallback text for avatar (usually initials) */
  avatarFallback?: string;
  /** Avatar size */
  avatarSize?: AvatarSize;
  /** Current follow state */
  followState: FollowState;
  /** Called when follow button is pressed */
  onFollowPress: () => void;
  /** Whether the follow button is disabled */
  disabled?: boolean;
  /** Whether the follow button is loading */
  loading?: boolean;
  /** Custom style for container */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for the whole component */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const AvatarOverlayFollow: React.FC<AvatarOverlayFollowProps> = ({
  avatarUri,
  avatarFallback,
  avatarSize = 'lg',
  followState,
  onFollowPress,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();

  return (
    <View 
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Avatar
        uri={avatarUri}
        fallback={avatarFallback}
        size={avatarSize}
        style={styles.avatar}
      />
      
      <View style={[
        styles.followButtonContainer,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.outline,
        }
      ]}>
        <FollowButton
          state={followState}
          onPress={onFollowPress}
          disabled={disabled}
          loading={loading}
          size="sm"
          style={styles.followButton}
        />
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    // Avatar will size itself
  },
  followButtonContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    borderRadius: 12,
    borderWidth: 2,
    padding: 2,
  },
  followButton: {
    minWidth: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});

export default AvatarOverlayFollow;
