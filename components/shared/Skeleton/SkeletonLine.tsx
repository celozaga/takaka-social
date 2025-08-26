import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/components/shared';

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
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  return (
    <View
      style={[
        styles.line,
        { width: width as any, height },
        style
      ]}
    />
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  line: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radius.sm,
  },
});

export default SkeletonLine;
