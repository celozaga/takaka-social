import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import IconButton from './IconButton';
import { useTheme } from '@/components/shared';

interface BackButtonProps {
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  size = 'medium',
  style 
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      default:
        return 24;
    }
  };

  return (
    <IconButton
      icon={<ArrowLeft size={getIconSize()} color={theme.colors.onSurface} />}
      onPress={handlePress}
      size={size}
      variant="ghost"
      style={style}
      accessibilityLabel={t('common.back')}
    />
  );
};

export default BackButton;
