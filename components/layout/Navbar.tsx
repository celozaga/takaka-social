import React from 'react';
import { Link } from 'expo-router';
import { Hash, Feather } from 'lucide-react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';

const Navbar: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <Link href="/(tabs)/home" asChild>
            <Pressable style={styles.link}>
              <Feather size={28} color="#A8C7FA" />
            </Pressable>
          </Link>
          <Link href="/(tabs)/feeds" asChild>
            <Pressable style={styles.link}>
              <Hash size={24} color="#C3C6CF" />
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      web: {
        left: 80
      },
      default: {
        left: 0
      }
    }),
    backgroundColor: '#111314', // surface-1
    zIndex: 40,
    height: 64,
  },
  container: {
    marginHorizontal: 'auto' as any, // RN web specific
    width: '100%',
    maxWidth: 640,
    paddingHorizontal: 16,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  link: {
    padding: 8,
  },
});

export default Navbar;
