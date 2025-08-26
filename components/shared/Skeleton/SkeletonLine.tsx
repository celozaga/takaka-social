import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = 12,
  style
}) => {
  return (
    <View
      style={[
        styles.line,
        { width, height },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  line: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.small,
  },
});

export default SkeletonLine;
