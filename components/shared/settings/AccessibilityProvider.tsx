import React, { createContext, useContext, ReactNode } from 'react';
import { Text, TextProps, View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';

// ============================================================================
// Types
// ============================================================================

interface AccessibilityProviderProps {
  children: ReactNode;
}

interface AccessibilityContextType {
  // Text Accessibility
  getTextScale: () => number;
  getFontWeight: () => 'normal' | 'bold';
  getContrastMode: () => 'normal' | 'high';
  getMotionPreference: () => 'normal' | 'reduced';
  
  // Utility functions
  createAccessibleTextStyle: (baseStyle: any) => any;
  createAccessibleViewStyle: (baseStyle: any) => any;
  getAccessibleColors: () => any;
}

// ============================================================================
// Context
// ============================================================================

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { theme } = useTheme();

  // Text accessibility - using default accessibility properties
  const getTextScale = (): number => {
    return 1.0; // Default text scale
  };

  const getFontWeight = (): 'normal' | 'bold' => {
    return 'normal'; // Default font weight
  };

  // Contrast accessibility
  const getContrastMode = (): 'normal' | 'high' => {
    return 'normal'; // Will be implemented when contrast settings are available
  };

  // Motion accessibility
  const getMotionPreference = (): 'normal' | 'reduced' => {
    return 'normal'; // Will be implemented when motion settings are available
  };

  // Get accessible colors based on contrast settings
  const getAccessibleColors = () => {
    const contrastMode = getContrastMode();
    
    if (contrastMode === 'high') {
      return {
        ...theme.colors,
        // Increase contrast for better accessibility
        onSurface: theme.colors.surface === '#0F0F0F' ? '#FFFFFF' : '#000000',
        onSurfaceVariant: theme.colors.surface === '#0F0F0F' ? '#E0E0E0' : '#1A1A1A',
        outline: theme.colors.surface === '#0F0F0F' ? '#FFFFFF' : '#000000',
        surfaceContainer: theme.colors.surface === '#0F0F0F' ? '#0A0A0A' : '#FFFFFF',
      };
    }
    
    return theme.colors;
  };

  // Create accessible text style
  const createAccessibleTextStyle = (baseStyle: any) => {
    const textScale = getTextScale();
    const fontWeight = getFontWeight();
    
    return {
      ...baseStyle,
      fontSize: baseStyle.fontSize ? baseStyle.fontSize * textScale : undefined,
      fontWeight: fontWeight === 'bold' ? 'bold' : baseStyle.fontWeight,
      // Apply high contrast colors if enabled
      color: baseStyle.color ? getAccessibleColors()[baseStyle.color] || baseStyle.color : undefined,
    };
  };

  // Create accessible view style
  const createAccessibleViewStyle = (baseStyle: any) => {
    const contrastMode = getContrastMode();
    const accessibleColors = getAccessibleColors();
    
    return {
      ...baseStyle,
      // Apply high contrast background colors if enabled
      backgroundColor: baseStyle.backgroundColor ? 
        accessibleColors[baseStyle.backgroundColor] || baseStyle.backgroundColor : undefined,
      borderColor: baseStyle.borderColor ? 
        accessibleColors[baseStyle.borderColor] || baseStyle.borderColor : undefined,
    };
  };

  const contextValue: AccessibilityContextType = {
    getTextScale,
    getFontWeight,
    getContrastMode,
    getMotionPreference,
    createAccessibleTextStyle,
    createAccessibleViewStyle,
    getAccessibleColors,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useAccessibilityProvider = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  
  if (context === undefined) {
    throw new Error('useAccessibilityProvider must be used within an AccessibilityProvider');
  }
  
  return context;
};

// ============================================================================
// Accessible Components
// ============================================================================

interface AccessibleTextProps extends TextProps {
  variant?: keyof ReturnType<typeof useTheme>['theme']['typography'];
  children: React.ReactNode;
}

/**
 * AccessibleText component that automatically applies all accessibility settings
 */
export const AccessibleText: React.FC<AccessibleTextProps> = ({ 
  variant = 'bodyMedium', 
  style, 
  children, 
  ...props 
}) => {
  const { theme } = useTheme();
  const { createAccessibleTextStyle } = useAccessibilityProvider();
  
  const baseStyle = theme.typography[variant];
  const accessibleStyle = createAccessibleTextStyle(baseStyle);
  
  return (
    <Text 
      style={[accessibleStyle, style]} 
      {...props}
    >
      {children}
    </Text>
  );
};

interface AccessibleViewProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * AccessibleView component that applies accessibility styles to containers
 */
export const AccessibleView: React.FC<AccessibleViewProps> = ({ 
  style, 
  children, 
  ...props 
}) => {
  const { createAccessibleViewStyle } = useAccessibilityProvider();
  
  const accessibleStyle = createAccessibleViewStyle(style || {});
  
  return (
    <View 
      style={accessibleStyle} 
      {...props}
    >
      {children}
    </View>
  );
};

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Pre-configured accessible text components for common use cases
 */
export const AccessibleTitle = (props: Omit<AccessibleTextProps, 'variant'>) => (
  <AccessibleText variant="titleLarge" {...props} />
);

export const AccessibleSubtitle = (props: Omit<AccessibleTextProps, 'variant'>) => (
  <AccessibleText variant="titleMedium" {...props} />
);

export const AccessibleBody = (props: Omit<AccessibleTextProps, 'variant'>) => (
  <AccessibleText variant="bodyLarge" {...props} />
);

export const AccessibleCaption = (props: Omit<AccessibleTextProps, 'variant'>) => (
  <AccessibleText variant="bodySmall" {...props} />
);

export const AccessibleLabel = (props: Omit<AccessibleTextProps, 'variant'>) => (
  <AccessibleText variant="labelLarge" {...props} />
);

// ============================================================================
// Motion-Aware Components
// ============================================================================

interface MotionAwareViewProps extends ViewProps {
  children: React.ReactNode;
  animatedStyle?: any;
}

/**
 * MotionAwareView component that respects motion preferences
 */
export const MotionAwareView: React.FC<MotionAwareViewProps> = ({ 
  style, 
  animatedStyle,
  children, 
  ...props 
}) => {
  const { getMotionPreference } = useAccessibilityProvider();
  const motionPreference = getMotionPreference();
  
  // If motion is reduced, don't apply animated styles
  const finalStyle = motionPreference === 'reduced' ? style : [style, animatedStyle];
  
  return (
    <View 
      style={finalStyle} 
      {...props}
    >
      {children}
    </View>
  );
};

// ============================================================================
// Contrast-Aware Components
// ============================================================================

interface ContrastAwareViewProps extends ViewProps {
  children: React.ReactNode;
  highContrastStyle?: any;
}

/**
 * ContrastAwareView component that applies high contrast styles when enabled
 */
export const ContrastAwareView: React.FC<ContrastAwareViewProps> = ({ 
  style, 
  highContrastStyle,
  children, 
  ...props 
}) => {
  const { getContrastMode } = useAccessibilityProvider();
  const contrastMode = getContrastMode();
  
  // Apply high contrast styles if enabled
  const finalStyle = contrastMode === 'high' ? [style, highContrastStyle] : style;
  
  return (
    <View 
      style={finalStyle} 
      {...props}
    >
      {children}
    </View>
  );
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get accessibility-aware colors
 */
export const useAccessibleColors = () => {
  const { getAccessibleColors } = useAccessibilityProvider();
  return getAccessibleColors();
};

/**
 * Hook to check if motion is reduced
 */
export const useMotionPreference = () => {
  const { getMotionPreference } = useAccessibilityProvider();
  return getMotionPreference();
};

/**
 * Hook to check contrast mode
 */
export const useContrastMode = () => {
  const { getContrastMode } = useAccessibilityProvider();
  return getContrastMode();
};

/**
 * Hook to create accessibility-aware styles
 */
export const useAccessibleStyles = () => {
  const { createAccessibleTextStyle, createAccessibleViewStyle } = useAccessibilityProvider();
  
  return {
    createTextStyle: createAccessibleTextStyle,
    createViewStyle: createAccessibleViewStyle,
  };
};

export default AccessibilityProvider;
