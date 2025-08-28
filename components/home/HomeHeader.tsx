import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/shared';
import { useRouter } from 'expo-router';

const HomeHeader = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/feeds')} style={styles.button}>
        <Ionicons name="menu-outline" size={28} color={theme.colors.onSurface} />
      </Pressable>
      <View style={styles.logo} />
      <Pressable onPress={() => router.push('/search')} style={styles.button}>
        <Ionicons name="search-outline" size={24} color={theme.colors.onSurface} />
      </Pressable>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      height: 56,
    },
    button: {
      padding: theme.spacing.sm,
    },
    logo: {
      width: 32,
      height: 32,
      resizeMode: 'contain',
    },
  });

export default HomeHeader;