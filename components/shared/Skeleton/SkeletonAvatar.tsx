import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

interface SkeletonAvatarProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 32,
  style
}) => {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    flexShrink: 0,
  },
});

export default SkeletonAvatar;
