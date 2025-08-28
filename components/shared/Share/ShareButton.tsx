/**
 * ============================================================================
 * Share Button Component
 * ============================================================================
 *
 * Universal share button with platform-specific implementations.
 * Uses expo-sharing on native platforms and Web Share API on web with fallback.
 *
 */

import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle, Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../Theme';
import { Tooltip } from '../Tooltip';

// ============================================================================
// Types
// ============================================================================

interface ShareContent {
  /** Title of the content */
  title?: string;
  /** Text content to share */
  text?: string;
  /** URL to share */
  url?: string;
  /** Files to share (native only) */
  files?: string[];
}

interface ShareButtonProps {
  /** Content to share */
  content: ShareContent;
  /** Share button icon */
  children: React.ReactNode;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Called after successful share */
  onShareSuccess?: () => void;
  /** Called when share fails */
  onShareError?: (error: Error) => void;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const ShareButton: React.FC<ShareButtonProps> = ({
  content,
  children,
  disabled = false,
  style,
  onShareSuccess,
  onShareError,
  accessibilityLabel = 'Share',
  testID,
}) => {
  const { theme } = useTheme();

  const handleShare = async () => {
    if (disabled) return;

    try {
      if (Platform.OS === 'web') {
        await handleWebShare();
      } else {
        await handleNativeShare();
      }
      
      onShareSuccess?.();
    } catch (error) {
      console.error('Share failed:', error);
      onShareError?.(error as Error);
    }
  };

  const handleWebShare = async () => {
    // Try Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.text,
          url: content.url,
        });
        return;
      } catch (error) {
        // User cancelled or API not available, fallback to clipboard
        console.log('Web Share API failed, falling back to clipboard');
      }
    }

    // Fallback to clipboard
    await handleClipboardFallback();
  };

  const handleNativeShare = async () => {
    const shareOptions: any = {};
    
    if (content.url) {
      shareOptions.url = content.url;
    }
    
    if (content.text) {
      shareOptions.message = content.text;
    }
    
    if (content.title) {
      shareOptions.dialogTitle = content.title;
    }

    if (content.files && content.files.length > 0) {
      // Share files using expo-sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Share the first file (expo-sharing supports one file at a time)
      await Sharing.shareAsync(content.files[0], shareOptions);
    } else {
      // Share text/URL content
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Create a shareable text content
      const shareText = [content.title, content.text, content.url]
        .filter(Boolean)
        .join(' - ');
      
      if (!shareText) {
        throw new Error('No content to share');
      }

      // For text sharing, we need to use platform-specific solutions
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // On native platforms, create a temporary text "file" or use system share
        Alert.alert(
          'Share',
          'Content copied to clipboard for sharing',
          [
            {
              text: 'Copy to Clipboard',
              onPress: () => handleClipboardFallback(),
            },
          ]
        );
      }
    }
  };

  const handleClipboardFallback = async () => {
    const shareText = [content.title, content.text, content.url]
      .filter(Boolean)
      .join(' - ');

    if (!shareText) {
      throw new Error('No content to share');
    }

    await Clipboard.setStringAsync(shareText);
    
    if (Platform.OS === 'web') {
      // Show a simple notification on web
      console.log('Content copied to clipboard');
    } else {
      Alert.alert('Copied', 'Content copied to clipboard');
    }
  };

  return (
    <Tooltip contentKey="post.share" position="top">
      <Pressable
        onPress={handleShare}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed && !disabled 
              ? theme.colors.surfaceContainerHigh 
              : 'transparent',
          },
          disabled && styles.disabled,
          style,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={testID}
      >
        {children}
      </Pressable>
    </Tooltip>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ShareButton;
