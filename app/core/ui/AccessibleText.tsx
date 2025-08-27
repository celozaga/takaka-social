import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from './Theme/ThemeProvider';
import { useAccessibility } from '@/context/AccessibilityContext';

interface AccessibleTextProps extends TextProps {
  variant?: keyof ReturnType<typeof useTheme>['theme']['typography'];
  children: React.ReactNode;
}

/**
 * AccessibleText component that automatically applies accessibility settings
 */
export const AccessibleText: React.FC<AccessibleTextProps> = ({ 
  variant = 'bodyMedium', 
  style, 
  children, 
  ...props 
}) => {
  const { theme } = useTheme();
  const { getTextScale, getFontWeight } = useAccessibility();
  
  const baseStyle = theme.typography[variant];
  const textScale = getTextScale();
  const fontWeight = getFontWeight();
  
  // Debug logs
  if (__DEV__) {
    console.log('🔍 AccessibleText Debug:', {
      variant,
      baseFontSize: baseStyle.fontSize,
      textScale,
      finalFontSize: baseStyle.fontSize ? baseStyle.fontSize * textScale : undefined,
      fontWeight,
      baseFontWeight: baseStyle.fontWeight,
      finalFontWeight: fontWeight === 'bold' ? 'bold' : (baseStyle.fontWeight || 'normal'),
    });
  }
  
  const accessibleStyle = {
    ...baseStyle,
    fontSize: baseStyle.fontSize ? baseStyle.fontSize * textScale : undefined,
    fontWeight: fontWeight === 'bold' ? 'bold' : (baseStyle.fontWeight || 'normal'),
  };
  
  return (
    <Text 
      style={[accessibleStyle, style]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export default AccessibleText;
