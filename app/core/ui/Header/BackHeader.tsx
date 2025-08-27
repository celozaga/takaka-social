import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/components/shared';
import BackButton from '../Button/BackButton';

interface BackHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const BackHeader: React.FC<BackHeaderProps> = ({
  title,
  onBackPress,
  rightAction,
  style
}) => {
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.innerContainer}>
        <BackButton onPress={onBackPress} size="medium" />
        <Text style={styles.title}>{title}</Text>
        {rightAction && (
          <View style={styles.rightAction}>
            {rightAction}
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    zIndex: 30,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  rightAction: {
    marginLeft: 'auto',
  },
});

export default BackHeader;
