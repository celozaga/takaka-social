import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/components/shared/Theme';

interface SkeletonAvatarProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 32,
  style
}) => {
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
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

const createStyles = (theme: any) => StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    flexShrink: 0,
  },
});

export default SkeletonAvatar;
