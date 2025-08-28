/**
 * Tooltip Responsive Test Component
 * 
 * This component demonstrates and tests the responsive behavior of the tooltip system
 * across different screen sizes and devices.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Tooltip, TooltipContentKey } from './index';
import { useTheme } from '../Theme';

interface TestButtonProps {
  label: string;
  contentKey?: TooltipContentKey;
  content?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

const TestButton: React.FC<TestButtonProps> = ({ label, contentKey, content, position = 'auto' }) => {
  const { theme } = useTheme();
  
  return (
    <Tooltip contentKey={contentKey} content={content} position={position}>
      <Pressable
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minWidth: 80,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          borderRadius: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.onPrimary,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Tooltip>
  );
};

export const TooltipResponsiveTest: React.FC = () => {
  const { theme } = useTheme();
  const [screenInfo, setScreenInfo] = useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenInfo(window);
    });

    return () => subscription?.remove();
  }, []);

  const getScreenType = () => {
    if (screenInfo.width >= 1024) return 'Desktop';
    if (screenInfo.width >= 768) return 'Tablet';
    return 'Mobile';
  };

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Tooltip Responsive Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Screen: {screenInfo.width}x{screenInfo.height} ({getScreenType()})
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Predefined Content Keys
        </Text>
        <View style={styles.buttonGrid}>
          <TestButton label="Follow" contentKey="follow" />
          <TestButton label="Like" contentKey="like" />
          <TestButton label="Share" contentKey="share" />
          <TestButton label="Reply" contentKey="reply" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Navigation Tooltips
        </Text>
        <View style={styles.buttonGrid}>
          <TestButton label="Home" contentKey="nav.home" />
          <TestButton label="Search" contentKey="nav.search" />
          <TestButton label="Notifications" contentKey="nav.notifications" />
          <TestButton label="Profile" contentKey="nav.profile" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Position Testing
        </Text>
        <View style={styles.positionGrid}>
          <TestButton label="Top" content="Tooltip positioned at top" position="top" />
          <TestButton label="Bottom" content="Tooltip positioned at bottom" position="bottom" />
          <TestButton label="Left" content="Tooltip positioned at left" position="left" />
          <TestButton label="Right" content="Tooltip positioned at right" position="right" />
          <TestButton label="Auto" content="Auto-positioned tooltip" position="auto" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Long Content Test
        </Text>
        <View style={styles.buttonGrid}>
          <TestButton
            label="Long Text"
            content="This is a very long tooltip text that should wrap properly and demonstrate responsive behavior across different screen sizes and devices."
          />
          <TestButton
            label="Medium Text"
            content="This tooltip has medium length content to test wrapping."
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Settings Tooltips
        </Text>
        <View style={styles.buttonGrid}>
          <TestButton label="Account" contentKey="settings.account" />
          <TestButton label="Privacy" contentKey="settings.privacy" />
          <TestButton label="Help" contentKey="settings.help" />
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl * 2,
    },
    header: {
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      opacity: 0.7,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: theme.spacing.md,
    },
    buttonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    positionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },

  });

export default TooltipResponsiveTest;