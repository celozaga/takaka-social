
import React from 'react';
import { View, StyleSheet } from 'react-native';

const PostCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Media placeholder */}
      <View style={styles.mediaPlaceholder} />
      
      {/* Content placeholder */}
      <View style={styles.contentPlaceholder}>
        <View style={styles.textLineLg} />
        <View style={styles.footer}>
          <View style={styles.authorInfo}>
            <View style={styles.avatar} />
            <View style={styles.textLineSm} />
          </View>
          <View style={styles.likeInfo} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E2021', // surface-2
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  mediaPlaceholder: {
    width: '100%',
    backgroundColor: '#2b2d2e', // surface-3
    height: 250,
  },
  contentPlaceholder: {
    padding: 12,
  },
  textLineLg: {
    height: 16,
    width: '83.3333%', // w-5/6
    backgroundColor: '#2b2d2e',
    borderRadius: 4,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#2b2d2e',
  },
  textLineSm: {
    height: 16,
    width: 96, // w-24
    backgroundColor: '#2b2d2e',
    borderRadius: 4,
  },
  likeInfo: {
    height: 20,
    width: 80, // w-20
    backgroundColor: '#2b2d2e',
    borderRadius: 4,
  },
});


export default PostCardSkeleton;
