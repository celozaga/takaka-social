import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

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
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.shape.large,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  mediaPlaceholder: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    height: 250,
  },
  contentPlaceholder: {
    padding: theme.spacing.m,
    gap: theme.spacing.s,
  },
  textLineLg: {
    height: 16,
    width: '83.3333%', // w-5/6
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  textLineSm: {
    height: 16,
    width: 96, // w-24
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
  },
  likeInfo: {
    height: 20,
    width: 80, // w-20
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
  },
});


export default PostCardSkeleton;