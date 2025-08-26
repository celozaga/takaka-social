
import React from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { useTheme } from '@/components/shared';

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <Link href="/(tabs)/home" asChild>
            <Pressable style={styles.link}>
              <Ionicons name="home-outline" size={28} color={theme.colors.primary} />
            </Pressable>
          </Link>
          <Link href="/(tabs)/feeds" asChild>
            <Pressable style={styles.link}>
              <Ionicons name="grid-outline" size={24} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  header: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    right: 0,
    ...Platform.select({
      web: {
        left: 80
      },
      default: {
        left: 0
      }
    }),
    backgroundColor: theme.colors.background,
    zIndex: 40,
    height: 64,
  },
  container: {
    marginHorizontal: 'auto' as any, // RN web specific
    width: '100%',
    maxWidth: 640,
    paddingHorizontal: theme.spacing.md,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  link: {
    padding: theme.spacing.xs,
  },
});

export default Navbar;