import React from 'react';
import { Link } from 'expo-router';
import { Hash, Feather } from 'lucide-react';
import { View, StyleSheet, Platform } from 'react-native';

const Navbar: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <Link href="/(tabs)/home" style={styles.link}>
            <Feather size={28} color="#A8C7FA" />
          </Link>
          <Link href="/(tabs)/feeds" style={styles.link}>
            <Hash size={24} color="#C3C6CF" />
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
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
    marginHorizontal: 'auto',
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
